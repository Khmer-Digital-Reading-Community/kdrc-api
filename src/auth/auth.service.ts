import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { OAuthProfile } from './dto/oauth-profile.dto';
import { AuthResponse } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) { }

  async handleOAuthLogin(profile: OAuthProfile): Promise<AuthResponse> {
    if (!profile.email) {
      throw new UnauthorizedException('Unable to determine email from provider response.');
    }

    let user = await this.usersRepository.findOne({
      where: [
        { provider: profile.provider, providerId: profile.providerId },
        { email: profile.email },
      ],
    });

    if (!user) {
      user = this.usersRepository.create({
        email: profile.email,
        name: profile.name,
        provider: profile.provider,
        providerId: profile.providerId,
      });
    } else {
      user.provider = profile.provider;
      user.providerId = profile.providerId;
      if (profile.name && !user.name) {
        user.name = profile.name;
      }
    }

    const savedUser = await this.usersRepository.save(user);
    const payload = {
      sub: savedUser.id,
      email: savedUser.email,
      provider: savedUser.provider,
      role: savedUser.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: savedUser.id,
        email: savedUser.email,
        name: savedUser.name,
        provider: savedUser.provider,
        role: savedUser.role,
      },
    };
  }
}
