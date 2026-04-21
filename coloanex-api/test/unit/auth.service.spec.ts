import { ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../../src/auth/auth.service';

describe('AuthService', () => {
  const prisma = {
    user: {
      update: jest.fn(),
    },
  };
  const jwtService = new JwtService({});
  const sessionService = { createSession: jest.fn() };
  const activityLogsService = { logUserActivity: jest.fn() };
  const borrowersService = { ensureBorrowerExists: jest.fn() };
  const usersService = {
    markUserAsOnline: jest.fn(),
    createUserForWebSignup: jest.fn(),
    createUserForAppSignup: jest.fn(),
  };
  const mailService = { sendMail: jest.fn() };

  const makeService = () =>
    new AuthService(
      prisma as any,
      jwtService,
      sessionService as any,
      activityLogsService as any,
      borrowersService as any,
      usersService as any,
      mailService as any,
    );

  it('rejects web login for disallowed roles', async () => {
    const service = makeService();
    jest.spyOn(service, 'validateUser').mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      password: 'hashed',
      isActive: true,
      isBanned: false,
      tenantId: 't1',
      roles: [{ role: { name: 'Guest', permissions: [] } }],
      permissions: [],
    } as any);

    await expect(
      service.loginWeb({ email: 'a@b.com', password: 'x' } as any),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows app login for borrower role', async () => {
    const service = makeService();
    jest.spyOn(service, 'validateUser').mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      password: 'hashed',
      isActive: true,
      isBanned: false,
      tenantId: 't1',
      roles: [{ role: { name: 'Borrower', permissions: [] } }],
      permissions: [],
    } as any);

    jest.spyOn(prisma.user, 'update').mockResolvedValue({} as any);
    jest.spyOn(service as any, 'performLogin').mockResolvedValue({
      accessToken: 'access',
      refreshToken: 'refresh',
      sessionId: 'session',
      user: {},
    });

    const result = await service.loginApp({
      email: 'a@b.com',
      password: 'x',
    } as any);

    expect(result.accessToken).toBe('access');
    expect(prisma.user.update).toHaveBeenCalled();
  });
});
