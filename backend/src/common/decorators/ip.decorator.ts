import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const ClientIp = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest();
  const forwarded = request.headers['x-forwarded-for'];
  const ip = forwarded ? forwarded.split(',')[0].trim() : request.ip || request.connection?.remoteAddress || '127.0.0.1';
  // normalize IPv6 loopback
  return ip === '::1' ? '127.0.0.1' : ip;
});
