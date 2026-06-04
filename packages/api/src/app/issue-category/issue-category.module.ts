import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IssueCategoryController } from './issue-category.controller';
import { IssueCategoryEntity } from './issue-category.entity';
import { IssueCategoryService } from './issue-category.service';

@Module({
  imports: [TypeOrmModule.forFeature([IssueCategoryEntity])],
  controllers: [IssueCategoryController],
  providers: [IssueCategoryService],
})
export class IssueCategoryModule {}
