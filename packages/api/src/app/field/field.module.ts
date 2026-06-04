import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FieldController } from './field.controller';
import { FieldEntity } from './field.entity';
import { FieldService } from './field.service';

@Module({
  imports: [TypeOrmModule.forFeature([FieldEntity])],
  controllers: [FieldController],
  providers: [FieldService],
})
export class FieldModule {}
