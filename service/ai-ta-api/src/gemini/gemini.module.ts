import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GeminiService } from './gemini.service';
import { GeminiController } from './gemini.controller';

@Module({
  imports: [AuthModule],
  controllers: [GeminiController],
  providers: [GeminiService],
})
export class GeminiModule {}
