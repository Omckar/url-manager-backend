import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyUrlPasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Short code is required' })
  shortCode: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}
