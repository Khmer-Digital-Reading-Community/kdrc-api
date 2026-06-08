import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { AuthResponse } from './dto/auth-response.dto';
import { LoginDto } from './dto/auth-login.dto';
import { OAuthProfile } from './dto/oauth-profile.dto';
import { RegisterDto } from './dto/auth-register.dto';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async handleOAuthLogin(profile: OAuthProfile): Promise<AuthResponse> {
    if (!profile.email) {
      throw new UnauthorizedException('Unable to determine email from provider response.');
    }

    let user = await this.usersService.findByProviderOrEmail(
      profile.provider,
      profile.providerId,
      profile.email,
    );

    if (!user) {
      user = await this.usersService.create({
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

      user = await this.usersService.save(user);
    }

    const payload = {
      sub: user.id,
      email: user.email,
      provider: user.provider,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        provider: user.provider,
        role: user.role,
      },
    };
  }

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);

    if (existing) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    console.log('HASHED:', hashedPassword);

    const savedUser = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      role: dto.role || Role.WRITER,
    });

    const { password, ...result } = savedUser;
    return result;
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmailWithPassword(dto.email);
    console.log('FOUND USER:', user);
    console.log('INPUT PASSWORD:', dto.password);
    console.log('DB PASSWORD:', user?.password);
    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    console.log('MATCH RESULT:', isMatch);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const access_token = await this.jwtService.signAsync(payload, {
      expiresIn: '15m',
    });

    const refresh_token = await this.jwtService.signAsync(payload, {
      expiresIn: '7d',
    });

    const hashedRt = await bcrypt.hash(refresh_token, 10);

    await this.usersService.storeRefreshToken(user.id, hashedRt);

    return {
      accessToken: access_token,
      refreshToken: refresh_token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken);

      const user = await this.usersService.findOneWithRefreshToken(payload.sub);

      if (!user || !user.refreshToken) {
        throw new UnauthorizedException();
      }

      const isMatch = await bcrypt.compare(refreshToken, user.refreshToken);

      if (!isMatch) {
        throw new UnauthorizedException();
      }

      const newPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };

      const access_token = await this.jwtService.signAsync(newPayload, {
        expiresIn: '15m',
      });

      const new_refresh_token = await this.jwtService.signAsync(newPayload, {
        expiresIn: '7d',
      });

      const hashedRt = await bcrypt.hash(new_refresh_token, 10);

      await this.usersService.storeRefreshToken(user.id, hashedRt);

      return {
        access_token,
        refresh_token: new_refresh_token,
      };
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    await this.usersService.clearRefreshToken(userId);

    return { message: 'Logged out successfully' };
  }
}
