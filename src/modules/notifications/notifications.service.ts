import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { User } from '../users/user.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepo: Repository<Notification>,

    @InjectRepository(User)
    private usersRepo: Repository<User>,
  ) {}

  async create(createNotificationDto: CreateNotificationDto) {
    const user = await this.usersRepo.findOne({
      where: { id: createNotificationDto.recipientId },
    });

    if (!user) {
      throw new NotFoundException(
        `User with ID ${createNotificationDto.recipientId} not found`,
      );
    }

    const notification = this.notificationsRepo.create({
      ...createNotificationDto,
      recipient: user,
    });

    return this.notificationsRepo.save(notification);
  }

  async findAll() {
    return this.notificationsRepo.find({
      relations: ['recipient'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByUser(userId: string) {
    return this.notificationsRepo.find({
      where: { recipientId: userId },
      relations: ['recipient'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const notification = await this.notificationsRepo.findOne({
      where: { id },
      relations: ['recipient'],
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    return notification;
  }

  async update(id: string, updateNotificationDto: UpdateNotificationDto) {
    const notification = await this.findOne(id);

    Object.assign(notification, updateNotificationDto);

    return this.notificationsRepo.save(notification);
  }

  async markAsRead(id: string) {
    const notification = await this.findOne(id);
    notification.read = true;
    return this.notificationsRepo.save(notification);
  }

  async markAllAsRead(userId: string) {
    await this.notificationsRepo.update(
      { recipientId: userId, read: false },
      { read: true },
    );
  }

  async remove(id: string, userId: string) {
    const notification = await this.findOne(id);
    if (notification.recipientId !== userId) {
      throw new ForbiddenException(
        'You can only delete your own notifications',
      );
    }
    return this.notificationsRepo.remove(notification);
  }

  async getUnreadCount(userId: string) {
    return this.notificationsRepo.count({
      where: { recipientId: userId, read: false },
    });
  }
}
