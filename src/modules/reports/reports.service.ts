import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentReport, ReportStatus } from './content-report.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(ContentReport)
    private readonly reportsRepo: Repository<ContentReport>,
  ) {}

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
