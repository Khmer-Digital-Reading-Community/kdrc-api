import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(NotificationsGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(socket: Socket) {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers.authorization?.toString().replace(/^Bearer\s+/i, '');

    if (!token) {
      this.logger.warn('Socket connection rejected: missing auth token');
      socket.disconnect(true);
      return;
    }

    try {
      const payload = this.jwtService.verify<{ sub: string }>(token);
      const userId = payload.sub;
      socket.data.userId = userId;
      socket.join(userId);
      this.logger.log(`Socket connected for user ${userId}`);
    } catch (error) {
      this.logger.warn('Socket connection rejected: invalid auth token');
      socket.disconnect(true);
    }
  }

  handleDisconnect(socket: Socket) {
    const userId = socket.data.userId;
    this.logger.log(`Socket disconnected for user ${userId ?? 'unknown'}`);
  }

  notifyUser(userId: string, notification: unknown) {
    if (!this.server) return;
    this.logger.debug(`Emitting notification to user ${userId}`);
    this.server.to(userId).emit('notification', notification);
  }
}
