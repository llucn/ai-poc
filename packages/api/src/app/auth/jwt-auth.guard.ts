import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './public.decorator';
import {
  ACCESS_VERIFIER,
  type CognitoVerifier,
  ID_VERIFIER,
} from './verifiers.provider';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(ACCESS_VERIFIER) private readonly accessVerifier: CognitoVerifier,
    @Inject(ID_VERIFIER) private readonly idVerifier: CognitoVerifier,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const authHeader: string = request.headers['authorization'] ?? '';
    const idHeader: string = request.headers['x-id-token'] ?? '';

    const match = /^Bearer (.+)$/i.exec(authHeader);
    if (!match) {
      throw new UnauthorizedException(
        'Missing or malformed Authorization header',
      );
    }

    let accessClaims: Record<string, unknown>;
    try {
      accessClaims = await this.accessVerifier.verify(match[1]);
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }

    if (!idHeader) {
      throw new UnauthorizedException('Missing X-Id-Token header');
    }

    let idClaims: Record<string, unknown>;
    try {
      idClaims = await this.idVerifier.verify(idHeader);
    } catch {
      throw new UnauthorizedException('Invalid ID token');
    }

    request.user = {
      userId: accessClaims.sub as string,
      userName:
        (idClaims.name as string | undefined) ??
        (idClaims['cognito:username'] as string),
      phoneNumber: (idClaims.phone_number as string | undefined) ?? null,
      email: (idClaims.email as string | undefined) ?? null,
      groups: (accessClaims['cognito:groups'] as string[] | undefined) ?? [],
      accessClaims,
      idClaims,
    };

    return true;
  }
}
