import { ActivityLogsService } from '../../src/activity-logs/activity-logs.service';
import { ActivityAction } from '../../src/activity-logs/entities/activity-log.entity';

describe('ActivityLogsService', () => {
  const prisma = {
    activityLog: {
      create: jest.fn(),
    },
  };

  const makeService = () => new ActivityLogsService(prisma as any);

  it('logs user visit correctly', async () => {
    const service = makeService();
    jest.spyOn(prisma.activityLog, 'create').mockResolvedValue({} as any);

    await service.logUserVisit('u1', '127.0.0.1', 'Mozilla');

    expect(prisma.activityLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorUserId: 'u1',
          action: ActivityAction.VISIT,
        }),
      }),
    );
  });
});
