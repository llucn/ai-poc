import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { FIELD_TYPES, FieldType } from './field-type';

export class CreateFieldDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsBoolean()
  required!: boolean;

  @IsOptional()
  @IsString()
  defaultValue?: string | null;

  @IsString()
  @IsIn(FIELD_TYPES as unknown as string[])
  type!: string;

  @IsOptional()
  properties?: object | null;
}

export class UpdateFieldDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsBoolean()
  required!: boolean;

  @IsOptional()
  @IsString()
  defaultValue?: string | null;

  @IsString()
  @IsIn(FIELD_TYPES as unknown as string[])
  type!: string;

  @IsOptional()
  properties?: object | null;
}

export class DeleteFieldsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  ids!: number[];
}

export type FieldDto = {
  id: number;
  name: string;
  title: string;
  description: string | null;
  required: boolean;
  defaultValue: string | null;
  type: FieldType;
  properties: object | null;
  createdOn: string;
  createdBy: string;
  updatedOn: string | null;
  updatedBy: string | null;
};

export type ExistsFieldResponseDto = {
  name: boolean;
};
