import { Controller, Get, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto'; 

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // 1. GET /users/me (Private Profile - Requires Auth)
  // @UseGuards(JwtAuthGuard)
  // @Get('me')
  // getMe(@Req() req: any) {
  //   return this.usersService.findOne(req.user.id);
  // }
  @Get('me')
  getMe(@Req() req: any) {
    // Use the hardcoded ID here too
    return this.usersService.findOne('27970e91-fbb7-431c-982e-65f51e6924dc');
  }

  // 2. PATCH /users/me (Update Private Profile - Requires Auth)
  //@UseGuards(JwtAuthGuard)
  // @Patch('me')
  // updateMe(@Req() req: any, @Body() updateData: UpdateUserDto) {
  //   return this.usersService.update(req.user.id, updateData);
  // }
  @Patch('me')
  updateMe(@Req() req: any, @Body() updateData: UpdateUserDto) {
    return this.usersService.update('27970e91-fbb7-431c-982e-65f51e6924dc', updateData);
  }

  // 3. GET /users/:id (Public Profile - No Auth Required)
  @Get(':id')
  getPublicProfile(@Param('id') id: string) {
    return this.usersService.getPublicProfile(id);
  }


}