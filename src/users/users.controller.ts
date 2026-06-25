import { Controller, Get, Put, Body, UseGuards, Post, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';

@Controller('api/users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async getProfile(@CurrentUser() user: any) {
    const userProfile = await this.usersService.findOneById(user.userId);
    if (!userProfile) {
      throw new NotFoundException('User profile not found');
    }
    return {
      id: userProfile.id,
      email: userProfile.email,
      name: userProfile.name,
      createdAt: (userProfile as any).createdAt,
    };
  }

  @Put('profile')
  async updateProfile(@CurrentUser() user: any, @Body() updateDto: UpdateProfileDto) {
    const updated = await this.usersService.updateProfile(user.userId, updateDto.name);
    return {
      message: 'Profile updated successfully',
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
      },
    };
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(@CurrentUser() user: any, @Body() changePasswordDto: ChangePasswordDto) {
    await this.usersService.changePassword(
      user.userId,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
    return {
      message: 'Password changed successfully',
    };
  }
}
