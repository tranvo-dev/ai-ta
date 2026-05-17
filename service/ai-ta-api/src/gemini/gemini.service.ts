import { GoogleGenerativeAI, ChatSession } from "@google/generative-ai";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
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
    private chatSessions = new Map<string, ChatSession>();

    constructor(
        private configService: ConfigService,
        private prisma: PrismaService,
    ) {
        this.genAI = new GoogleGenerativeAI(
            this.configService.getOrThrow<string>('API_KEY')
        );
        this.model = this.genAI.getGenerativeModel({
            model: this.configService.getOrThrow<string>('DEFAULT_MODEL'),
            systemInstruction: SYSTEM_INSTRUCTION,
        });
    }

    private async getOrCreateChatSession(sessionId: string): Promise<ChatSession> {
        if (this.chatSessions.has(sessionId)) {
            return this.chatSessions.get(sessionId)!;
        }

        const dbMessages = await this.prisma.message.findMany({
            where: { sessionId },
            orderBy: { createdAt: 'asc' },
        });

        const history = dbMessages.map(m => ({
            role: m.role === 'user' ? 'user' as const : 'model' as const,
            parts: [{ text: m.content }],
        }));

        const chat = this.model.startChat({ history });
        this.chatSessions.set(sessionId, chat);
        return chat;
    }

    async generateResponse(body: MessageDto, userId: string) {
        const { message, sessionId } = body;
        if (!message || !sessionId) throw new BadRequestException('message and sessionId are required');

        const session = await this.prisma.session.findFirst({
            where: { id: sessionId, userId },
        });
        if (!session) throw new NotFoundException('Session not found');

        try {
            const chat = await this.getOrCreateChatSession(sessionId);
            const result = await chat.sendMessage(message);
            const aiText = result.response.text();

            const isFirst = await this.prisma.message.count({ where: { sessionId } }) === 0;

            await this.prisma.message.createMany({
                data: [
                    { sessionId, role: 'user', content: message },
                    { sessionId, role: 'assistant', content: aiText },
                ],
            });

            await this.prisma.session.update({
                where: { id: sessionId },
                data: {
                    updatedAt: new Date(),
                    ...(isFirst && { title: message.slice(0, 60) }),
                },
            });

            return { message: aiText };
        } catch (err) {
            console.error('[GEMINI SERVICE] - Error when generating response', err);
            throw err;
        }
    }
}
