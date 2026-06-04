import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { KEBAB_CASE_REGEX } from './kebab-case';

export class CreateIssueCategoryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  @Matches(KEBAB_CASE_REGEX, {
    message:
      'name must be kebab-case (lowercase letters, digits, hyphens; no leading/trailing/double hyphens)',
  })
  name!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  displayName!: string;
}

export class UpdateIssueCategoryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  displayName!: string;
}

export class DeleteIssueCategoriesDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  ids!: number[];
}

export type IssueCategoryDto = {
  id: number;
  name: string;
  displayName: string;
};

export type ExistsResponseDto = {
  name: boolean;
  displayName: boolean;
};
