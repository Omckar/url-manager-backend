import { IsNotEmpty, IsUrl, IsOptional, IsString, IsDateString, MinLength } from 'class-validator';

export class CreateUrlDto {
  @IsNotEmpty({ message: 'Original URL is required' })
  @IsUrl({}, { message: 'Please provide a valid URL (include http:// or https://)' })
  longUrl: string;

  @IsString()
  @IsOptional()
  customAlias?: string;

  @IsDateString({}, { message: 'Please provide a valid expiry date' })
  @IsOptional()
  expiryDate?: string;

  @IsString()
  @IsOptional()
  @MinLength(4, { message: 'Password must be at least 4 characters long' })
  password?: string;
}
