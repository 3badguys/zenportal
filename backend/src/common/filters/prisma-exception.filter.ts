import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = (request as any).requestId || '';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database error';

    switch (exception.code) {
      case 'P2002': // unique constraint violation
        status = HttpStatus.CONFLICT;
        const target = (exception.meta?.target as string[]) || [];
        message = `Duplicate value for: ${target.join(', ')}`;
        break;

      case 'P2003': // foreign key constraint failure
        status = HttpStatus.BAD_REQUEST;
        message = 'Related record not found';
        break;

      case 'P2025': // record not found (update/delete)
        status = HttpStatus.NOT_FOUND;
        message = 'Record not found';
        break;

      case 'P2014': // would violate relation constraint
        status = HttpStatus.BAD_REQUEST;
        message = 'Cannot delete: related records exist';
        break;

      case 'P2000': // value too long
        status = HttpStatus.BAD_REQUEST;
        message = 'Input value too long';
        break;

      default:
        this.logger.error(
          `[${requestId}] Prisma error ${exception.code}: ${exception.message}`,
          exception.stack,
        );
        break;
    }

    this.logger.warn(
      `[${requestId}] ${request.method} ${request.url} → Prisma ${exception.code}: ${message}`,
    );

    response.status(status).json({
      code: status,
      message,
      data: null,
      requestId: requestId || undefined,
    });
  }
}
