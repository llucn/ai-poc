import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type CurrentUserPayload = {
  userId: string;
  userName: string;
  phoneNumber: string | null;
  email: string | null;
  groups: string[];
  accessClaims: Record<string, unknown>;
  idClaims: Record<string, unknown>;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserPayload | undefined =>
    ctx.switchToHttp().getRequest().user,
);
