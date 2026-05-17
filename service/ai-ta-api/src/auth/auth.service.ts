import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

interface GoogleUser {
  googleId: string;
  email: string;
  name: string;
  picture: string;
}

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  login(user: GoogleUser): { access_token: string } {
    const payload = {
      sub: user.googleId,
      email: user.email,
      name: user.name,
      picture: user.picture,
    };
    return { access_token: this.jwtService.sign(payload) };
  }
}
