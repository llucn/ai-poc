import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFormDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string | null;
}

export class UpdateFormDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string | null;
}

export class FormFieldItemDto {
  @IsInt()
  fieldId!: number;

  @IsInt()
  position!: number;
}

export class PutFormFieldsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FormFieldItemDto)
  fields!: FormFieldItemDto[];
}

export class DeleteFormsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  ids!: number[];
}

export type FormDto = {
  id: number;
  name: string;
  description: string | null;
  createdOn: string;
  createdBy: string;
  updatedOn: string | null;
  updatedBy: string | null;
};

export type FieldSnapshotDto = {
  id: number;
  name: string;
  title: string;
  type: string;
};

export type FormFieldDto = {
  formId: number;
  fieldId: number;
  position: number;
  field: FieldSnapshotDto;
};
