import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class AdminGuard implements CanActivate {
  private readonly logger = new Logger(AdminGuard.name);

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers['x-admin-token'];
    const envToken = process.env.ADMIN_TOKEN;

    // in production, ADMIN_TOKEN env var is required
    if (!envToken) {
      if (process.env.NODE_ENV === 'production') {
        this.logger.error('ADMIN_TOKEN not set in production environment');
        throw new UnauthorizedException('Server misconfiguration');
      }
      // dev fallback
      const expected = 'dev-token';
      if (!token || token !== expected) {
        throw new UnauthorizedException('Invalid admin token');
      }
      return true;
    }

    if (!token || token !== envToken) {
      throw new UnauthorizedException('Invalid admin token');
    }
    return true;
  }
}
