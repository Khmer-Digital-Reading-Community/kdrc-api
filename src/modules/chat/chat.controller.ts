import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from 'src/common/enums/role.enum';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // Public: get all messages (for chat display)
  @Get()
  findAll() {
    return this.chatService.findAll();
  }

  // Authenticated: post a message
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req, @Body() dto: CreateChatMessageDto) {
    return this.chatService.create(req.user.id, dto);
  }

  // Admin: paginated list
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin')
  adminList(
    @Query() query: { search?: string; page?: string; limit?: string },
  ) {
    return this.chatService.findAllAdmin(query);
  }

  // Admin: delete single
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete('admin/:id')
  adminDelete(@Param('id') id: string) {
    return this.chatService.remove(id);
  }

  // Admin: bulk delete
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete('admin')
  adminBulkDelete(@Body() body: { ids: string[] }) {
    return this.chatService.bulkRemove(body.ids);
  }
}
