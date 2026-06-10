import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentReport, ReportStatus } from './content-report.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(ContentReport)
    private readonly reportsRepo: Repository<ContentReport>,
    private readonly usersService: UsersService,
  ) {}

  async create(reporterId: string, dto: CreateReportDto) {
    if (dto.reportedUserId) {
      await this.usersService.findOne(dto.reportedUserId);
    }

    const report = this.reportsRepo.create({
      type: dto.type,
      description: dto.description,
      reporter: { id: reporterId },
      reportedUser: dto.reportedUserId
        ? { id: dto.reportedUserId }
        : undefined,
      status: ReportStatus.PENDING,
    });

    return this.reportsRepo.save(report);
  }

  findAll() {
    return this.reportsRepo.find({
      relations: ['reporter', 'reportedUser'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateStatus(id: string, status: ReportStatus) {
    const report = await this.reportsRepo.findOne({ where: { id } });
    if (!report) {
      throw new NotFoundException('Report not found');
    }
    report.status = status;
    return this.reportsRepo.save(report);
  }

  async remove(id: string) {
    const report = await this.reportsRepo.findOne({ where: { id } });
    if (!report) {
      throw new NotFoundException('Report not found');
    }
    await this.reportsRepo.remove(report);
    return { message: 'Report deleted' };
  }
}
