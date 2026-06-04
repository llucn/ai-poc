import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FieldEntity } from '../field/field.entity';
import { FormController } from './form.controller';
import { FormFieldEntity } from './form-field.entity';
import { FormEntity } from './form.entity';
import { FormService } from './form.service';

@Module({
  imports: [TypeOrmModule.forFeature([FormEntity, FormFieldEntity, FieldEntity])],
  controllers: [FormController],
  providers: [FormService],
})
export class FormModule {}
