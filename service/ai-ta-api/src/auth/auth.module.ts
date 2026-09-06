import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    // register() is what actually provides AuthModuleOptions; the bare
    // PassportModule is declared @Module({}) and provides nothing. Guards that
    // extend AuthGuard() need it, and they lose the base class's @Optional()
    // marking through inheritance, so it must genuinely be resolvable.
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy, JwtStrategy],
  // PassportModule is exported so that modules whose controllers use
  // JwtAuthGuard can resolve the AuthModuleOptions the guard injects.
  exports: [JwtModule, PassportModule],
})
export class AuthModule {}
