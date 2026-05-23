import { Controller, Get } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health/cloudinary')
  async checkCloudinary() {
    try {
      const config = cloudinary.config();
      if (!config.cloud_name || !config.api_key || !config.api_secret) {
        return {
          status: 'error',
          message: 'Cloudinary credentials missing',
          details: {
            cloud_name: !!config.cloud_name,
            api_key: !!config.api_key,
            api_secret: !!config.api_secret,
          },
        };
      }

      await cloudinary.api.resources({ max_results: 1 });
      return { status: 'ok', message: 'Cloudinary connected' };
    } catch (error: any) {
      return {
        status: 'error',
        message: error.message,
      };
    }
  }
}

