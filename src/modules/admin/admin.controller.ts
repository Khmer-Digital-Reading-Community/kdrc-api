import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminExchangeService } from './admin-exchange.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { AdminUpdateExchangeDto } from './dto/admin-update-exchange.dto';
import { AdminUpdateExchangeRequestDto } from './dto/admin-update-exchange-request.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly adminExchangeService: AdminExchangeService,
  ) {}

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Get('activity')
  getActivity(@Query('limit') limit?: string) {
    return this.adminService.getActivity(Number(limit) || 10);
  }

  @Get('analytics')
  getAnalytics() {
    return this.adminService.getAnalytics();
  }

  @Get('exchanges')
  listExchanges(
    @Query()
    query: {
      search?: string;
      listingStatus?: string;
      page?: string;
      limit?: string;
    },
  ) {
    return this.adminExchangeService.listListings(query);
  }

  @Patch('exchanges/:id')
  updateExchange(
    @Param('id') id: string,
    @Body() dto: AdminUpdateExchangeDto,
  ) {
    return this.adminExchangeService.updateListing(id, dto);
  }

  @Delete('exchanges/:id')
  deleteExchange(@Param('id') id: string) {
    return this.adminExchangeService.deleteListing(id);
  }

  @Get('exchange-requests')
  listExchangeRequests(
    @Query()
    query: {
      search?: string;
      status?: string;
      page?: string;
      limit?: string;
    },
  ) {
    return this.adminExchangeService.listRequests(query);
  }

  @Patch('exchange-requests/:id')
  updateExchangeRequest(
    @Param('id') id: string,
    @Body() dto: AdminUpdateExchangeRequestDto,
  ) {
    return this.adminExchangeService.updateRequestStatus(id, dto.status);
  }

  @Delete('exchange-requests/:id')
  deleteExchangeRequest(@Param('id') id: string) {
    return this.adminExchangeService.deleteRequest(id);
  }
}
