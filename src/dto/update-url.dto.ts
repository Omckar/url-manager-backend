import { IsOptional, IsString, IsDateString, IsBoolean, MinLength } from 'class-validator';

export class UpdateUrlDto {
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

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
