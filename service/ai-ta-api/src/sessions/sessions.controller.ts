import { Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SessionsService } from './sessions.service';

@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.sessionsService.findAll(req.user.googleId);
  }

  @Post()
  create(@Req() req: any) {
    return this.sessionsService.create(req.user.googleId);
  }

  @Get(':id/messages')
  getMessages(@Param('id') id: string, @Req() req: any) {
    return this.sessionsService.getMessages(id, req.user.googleId);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Req() req: any) {
    return this.sessionsService.delete(id, req.user.googleId);
  }
}
