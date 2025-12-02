import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from 'src/common/decorators/public.decorator';

@Injectable()
export class AccessStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    if (!process.env.JWT_PUBLIC_KEY_PEM) {
      throw new Error('JWT_PUBLIC_KEY_PEM environment variable is not set');
    }
    if (!process.env.JWK_ALGORITHM) {
      throw new Error('JWK_ALGORITHM environment variable is not set');
    }
    if (!process.env.JWT_ISS) {
      throw new Error('JWT_ISS environment variable is not set');
    }
    if (!process.env.JWT_AUD) {
      throw new Error('JWT_AUD environment variable is not set');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKeyProvider: (_, __, done) =>
        done(null, process.env.JWT_PUBLIC_KEY_PEM),
      algorithms: [process.env.JWK_ALGORITHM as any],
      issuer: process.env.JWT_ISS,
      audience: process.env.JWT_AUD,
      ignoreExpiration: false,
    });
  }

  validate(payload: JwtPayload) {
    return payload;
  }
}

@Injectable()
export class AccessGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }
}
