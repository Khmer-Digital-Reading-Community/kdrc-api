import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { OAuthProfile } from './dto/oauth-profile.dto';
import { JwtService } from '@nestjs/jwt';
import { Role } from './roles.enum';
import { Roles } from './roles.decorator';
import { RolesGuard } from './guards/roles.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService,
    private readonly jwtService: JwtService, //Test
  ) { }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  // Passport redirects to Google, so the handler stays empty
  async googleAuth() {
    return { message: 'Redirecting to Google for authentication...' };
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request) {
    const profile = req.user as OAuthProfile;
    return this.authService.handleOAuthLogin(profile);
  }

  // Test token
  @Get('test-token')
  getTestToken() {
    const token = this.jwtService.sign({
      sub: 'test-user-iid',
      email: 'test@gmail.com',
      role: Role.WRITER,
    });

    return {
      accessToken: token,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.WRITER)
  @Get('writer-only')
  testWriter() {
    return 'You are a writer';
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req: Request) {
    return req.user;
  }
}
