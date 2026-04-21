import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateAssetDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  filename!: string;

  @IsIn(['document', 'file', 'image', 'video'])
  kind!: 'document' | 'file' | 'image' | 'video';

  @IsOptional()
  @IsString()
  @MaxLength(200)
  mimeType?: string;
}
