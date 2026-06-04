import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CognitoJwtVerifier } from 'aws-jwt-verify';

export const ACCESS_VERIFIER = 'ACCESS_VERIFIER';
export const ID_VERIFIER = 'ID_VERIFIER';

export type CognitoVerifier = {
  verify(token: string): Promise<Record<string, unknown>>;
};

export const verifierProviders: Provider[] = [
  {
    provide: ACCESS_VERIFIER,
    useFactory: (config: ConfigService) =>
      CognitoJwtVerifier.create({
        userPoolId: config.getOrThrow<string>('cognitoUserPoolId'),
        tokenUse: 'access',
        clientId: config.getOrThrow<string>('cognitoClientId'),
      }),
    inject: [ConfigService],
  },
  {
    provide: ID_VERIFIER,
    useFactory: (config: ConfigService) =>
      CognitoJwtVerifier.create({
        userPoolId: config.getOrThrow<string>('cognitoUserPoolId'),
        tokenUse: 'id',
        clientId: config.getOrThrow<string>('cognitoClientId'),
      }),
    inject: [ConfigService],
  },
];
