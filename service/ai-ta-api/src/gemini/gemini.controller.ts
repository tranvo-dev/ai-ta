import { Body, Controller, Post } from "@nestjs/common";
import { GeminiService } from "./gemini.service";
import { MessageDto } from "./dto/message.dto";

@Controller()
export class GeminiController {
    constructor(private readonly geminiService: GeminiService) { }
    @Post()
    async response(@Body() body: MessageDto) {
        return await this.geminiService.generateResponse(body);
    }
}