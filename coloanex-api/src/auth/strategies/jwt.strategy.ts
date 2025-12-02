import 'dotenv/config';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService, JwtPayload } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    try {
      const token = ExtractJwt.fromAuthHeaderAsBearerToken()(payload as any);
      if (!token) {
        throw new UnauthorizedException('No token provided');
      }
      await this.authService.validateAccessToken(token);
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
