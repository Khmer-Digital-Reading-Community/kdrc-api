import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { OAuthProfile } from './dto/oauth-profile.dto';
import { JwtService } from '@nestjs/jwt';
import { Role } from '../../common/enums/role.enum';
import { Roles, ROLES_KEY } from './roles.decorator';
import { RolesGuard } from './guards/roles.guard';
import { RegisterDto } from './dto/auth-register.dto';
import { LoginDto } from './dto/auth-login.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) { }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    return { message: 'Redirecting to Google for authentication...' };
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request) {
    const profile = req.user as OAuthProfile;
    return this.authService.handleOAuthLogin(profile);
  }

  @Get('test-token')
  getTestToken() {
    const token = this.jwtService.sign({
      sub: 1,
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

  @Get('admin-only')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  adminOnly() {
    return 'You are admin';
  }

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    console.log('LOGIN DTO:', dto);
    return this.authService.login(dto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  logout(@Req() req: Request) {
    return this.authService.logout(req.user?.['id']);
  }

  @Post('refresh')
  refresh(@Body('refresh_token') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req: Request) {
    return req.user;
  }
}
