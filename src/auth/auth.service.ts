import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { OAuthProfile } from './dto/oauth-profile.dto';
import { AuthResponse } from './dto/auth-response.dto';
import { RegisterDto } from './dto/auth-register.dto';
import { Role } from './roles.enum';
import bcrypt from 'node_modules/bcryptjs';
import { LoginDto } from './dto/auth-login.dto';

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

  async register(dto: RegisterDto) {
    const existing = await this.usersRepository.findOne({
      where: { email: dto.email },
    });

    if (existing) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = this.usersRepository.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      role: Role.READER,
    });

    const savedUser = await this.usersRepository.save(user);

    const { password, ...result } = savedUser;
    return result;

    return savedUser;
  }

  async login(dto: LoginDto) {
    if (!dto || !dto.email || !dto.password) {
      throw new UnauthorizedException('Missing credentials');
    }

    const user = await this.usersRepository.findOne({
      where: { email: dto.email },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);

    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      access_token: await this.jwtService.signAsync(payload, { expiresIn: '15m' }),
      refresh_token: await this.jwtService.signAsync(payload, { expiresIn: '7d' }),
    };
  }
}