import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let errors: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (res && typeof res === 'object') {
        if (Array.isArray((res as any).message)) {
          // ValidationPipe default: message is an array of messages
          message = 'Validation failed';
          errors = (res as any).message;
        } else if ((res as any).message) {
          message = (res as any).message;
        } else if ((res as any).error) {
          message = (res as any).error;
        }
      }
    } else if (exception && exception.message) {
      message = exception.message;
    }

    const payload = {
      status: 'error',
      data: {
        message,
        errors,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    };

    response.status(status).json(payload);
  }
}
