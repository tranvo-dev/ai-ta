import { GoogleGenerativeAI, ChatSession } from "@google/generative-ai";
import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MessageDto } from "./dto/message.dto";

const SYSTEM_INSTRUCTION = `
    You are a Vietnamese math teacher teaching secondary grades 6-9.
    Provide step-by-step solutions aligned with Vietnamese secondary curriculum.
    Omit greetings and introduction.
    Respond in Vietnamese.
    Format rules:
    - Write math expressions inline using plain text or Unicode (e.g. x = 1/2, x² + 2x, √5) instead of LaTeX dollar signs.
    - Only use LaTeX ($...$) for complex fractions or expressions that cannot be written clearly in plain text.
    - Prefer bold text (**Bước 1:**) for step labels.
`;

@Injectable()
export class GeminiService {
    private genAI: GoogleGenerativeAI;
    private model: any;
    private sessions = new Map<string, ChatSession>();

    constructor(private configService: ConfigService) {
        this.genAI = new GoogleGenerativeAI(
            this.configService.getOrThrow<string>('API_KEY')
        );
        this.model = this.genAI.getGenerativeModel({
            model: this.configService.getOrThrow<string>('DEFAULT_MODEL'),
            systemInstruction: SYSTEM_INSTRUCTION,
        });
    }

    private getOrCreateSession(sessionId: string): ChatSession {
        if (!this.sessions.has(sessionId)) {
            this.sessions.set(sessionId, this.model.startChat({ history: [] }));
        }
        return this.sessions.get(sessionId)!;
    }

    async generateResponse(body: MessageDto, _userId: string) {
        const { message, sessionId } = body;
        if (!message || !sessionId) throw new BadRequestException('message and sessionId are required');
        try {
            const chat = this.getOrCreateSession(sessionId);
            const result = await chat.sendMessage(message);
            return { message: result.response.text() };
        } catch (err) {
            console.error('[GEMINI SERVICE] - Error when generating response', err);
            throw err;
        }
    }
}
