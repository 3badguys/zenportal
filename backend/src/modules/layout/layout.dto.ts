import { IsArray, IsOptional, IsString, IsObject, ArrayNotEmpty } from 'class-validator';

export class UpdateLayoutDto {
  @IsArray({ message: 'blocks must be an array' })
  @ArrayNotEmpty({ message: 'blocks must not be empty' })
  blocks: BlockDto[];
}

export class BlockDto {
  @IsString()
  type: string;

  @IsObject()
  @IsOptional()
  props?: Record<string, any>;
}
