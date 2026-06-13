import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// A single tool reported from the frontend's defineClientTool registry.
// parametersSchema is the JSON Schema output from zod's z.toJSONSchema().
export class ClientToolDefinitionDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  // JSON Schema object (arbitrary shape, validated as non-null but not parsed).
  @IsNotEmpty()
  parametersSchema!: unknown;
}

// Request body for POST /client-tools/sync: full list of tools currently
// registered in the browser via defineClientTool. The backend reconciles
// t_tool rows (source='registry') to match this list.
export class SyncRegistryDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClientToolDefinitionDto)
  tools!: ClientToolDefinitionDto[];
}
