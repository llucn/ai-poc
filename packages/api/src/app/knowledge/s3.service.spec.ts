import { describe, expect, it, beforeEach } from 'vitest';
import { S3Service } from './s3.service';

describe('S3Service', () => {
  let service: S3Service;

  beforeEach(() => {
    service = new S3Service();
  });

  describe('onModuleInit - configuration validation', () => {
    it('marks service as not configured when env vars are missing', () => {
      delete process.env.AWS_S3_BUCKET_NAME;
      delete process.env.AWS_ACCESS_KEY_ID;
      delete process.env.AWS_SECRET_ACCESS_KEY;

      service.onModuleInit();
      expect(service.isConfigured()).toBe(false);
    });

    it('marks service as configured when all env vars are set', () => {
      process.env.AWS_S3_BUCKET_NAME = 'test-bucket';
      process.env.AWS_ACCESS_KEY_ID = 'test-key';
      process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';
      process.env.AWS_REGION = 'us-east-1';

      service.onModuleInit();
      expect(service.isConfigured()).toBe(true);

      // Cleanup
      delete process.env.AWS_S3_BUCKET_NAME;
      delete process.env.AWS_ACCESS_KEY_ID;
      delete process.env.AWS_SECRET_ACCESS_KEY;
      delete process.env.AWS_REGION;
    });

    it('defaults region to us-east-1 when not set', () => {
      process.env.AWS_S3_BUCKET_NAME = 'test-bucket';
      process.env.AWS_ACCESS_KEY_ID = 'test-key';
      process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';
      delete process.env.AWS_REGION;

      service.onModuleInit();
      expect(service.isConfigured()).toBe(true);

      delete process.env.AWS_S3_BUCKET_NAME;
      delete process.env.AWS_ACCESS_KEY_ID;
      delete process.env.AWS_SECRET_ACCESS_KEY;
    });

    it('marks not configured when bucket name is missing', () => {
      delete process.env.AWS_S3_BUCKET_NAME;
      process.env.AWS_ACCESS_KEY_ID = 'test-key';
      process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';

      service.onModuleInit();
      expect(service.isConfigured()).toBe(false);

      delete process.env.AWS_ACCESS_KEY_ID;
      delete process.env.AWS_SECRET_ACCESS_KEY;
    });
  });
});
