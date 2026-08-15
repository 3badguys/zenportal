import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // log any unexpected error
    if (!(exception instanceof HttpException)) {
      this.logger.error(
        'Unhandled exception',
        exception instanceof Error ? exception.stack : exception,
      );
    }

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let extra: Record<string, unknown> | null = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else {
        const obj = res as Record<string, unknown>;
        message = (obj.message as string | string[]) || exception.message;
        // pass through extra fields (e.g. BadRequestException({ message, refs }))
        for (const [k, v] of Object.entries(obj)) {
          if (k !== 'message') (extra ??= {})[k] = v;
        }
      }
    }

    // mark response so we know it passed through
    response.status(status).json({
      code: status,
      message: Array.isArray(message) ? message.join('; ') : message,
      ...extra,
      data: null,
    });
  }
}
