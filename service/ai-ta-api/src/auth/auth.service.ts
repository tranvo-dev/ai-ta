import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

interface GoogleUser {
  googleId: string;
  email: string;
  name: string;
  picture: string;
}

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async login(user: GoogleUser): Promise<{ access_token: string }> {
    await this.prisma.user.upsert({
      where: { id: user.googleId },
      update: { name: user.name, picture: user.picture },
      create: {
        id: user.googleId,
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
    });

    const payload = {
      sub: user.googleId,
      email: user.email,
      name: user.name,
      picture: user.picture,
    };
    return { access_token: this.jwtService.sign(payload) };
  }
}
