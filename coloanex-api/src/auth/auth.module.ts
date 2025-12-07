import 'dotenv/config';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { RedisSessionService } from './services/redis-session.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';
import { BorrowersModule } from '../borrowers/borrowers.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
          throw new Error('JWT_SECRET environment variable is not set');
        }
        return {
          secret,
          signOptions: {
            expiresIn: 900,
            algorithm: 'HS256',
          },
        };
      },
    }),
    ActivityLogsModule,
    BorrowersModule,
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, RedisSessionService, JwtStrategy],
  exports: [AuthService, RedisSessionService, JwtStrategy, PassportModule],
})
export class AuthModule {}
