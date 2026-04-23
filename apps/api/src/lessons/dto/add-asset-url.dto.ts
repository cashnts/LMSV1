import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class AddAssetUrlDto {
  @IsUrl({ require_tld: false })
  url!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;
}
