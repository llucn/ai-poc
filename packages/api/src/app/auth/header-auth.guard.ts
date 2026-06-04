import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './public.decorator';

/**
 * WARNING: This is a DEMO-ONLY authentication guard.
 * It reads user identity from plain-text HTTP headers without any validation.
 * DO NOT use this in production environments.
 */
@Injectable()
export class HeaderAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const userName = request.headers['x-user-name'];
    const userRole = request.headers['x-user-role'];

    if (!userName) {
      throw new UnauthorizedException('Missing X-User-Name header');
    }

    // Populate request.user with header-based identity
    request.user = {
      username: userName,
      role: userRole || null,
      // For compatibility with existing code that may reference these fields
      userId: userName,
      userName: userName,
      groups: userRole ? [userRole] : [],
    };

    return true;
  }
}
