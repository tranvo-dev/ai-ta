import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { GeminiService } from "./gemini.service";
import { MessageDto } from "./dto/message.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller()
export class GeminiController {
    constructor(private readonly geminiService: GeminiService) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    async response(@Body() body: MessageDto, @Req() req: any) {
        return await this.geminiService.generateResponse(body, req.user.googleId);
    }
}