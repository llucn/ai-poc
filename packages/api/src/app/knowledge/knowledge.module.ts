import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentEntity } from './document.entity';
import { DocumentChunkEntity } from './document-chunk.entity';
import { KnowledgeService } from './knowledge.service';
import { KnowledgeController } from './knowledge.controller';
import { S3Service } from './s3.service';
import { ChunkingService } from './chunking.service';

@Module({
  imports: [TypeOrmModule.forFeature([DocumentEntity, DocumentChunkEntity])],
  providers: [KnowledgeService, S3Service, ChunkingService],
  controllers: [KnowledgeController],
  exports: [KnowledgeService],
})
export class KnowledgeModule {}
