import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../models/user.model';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
  ) {}

  async create(email: string, passwordPlain: string, name?: string): Promise<User> {
    const existingUser = await this.findOneByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(passwordPlain, 10);
    return this.userModel.create({
      email: email.toLowerCase(),
      passwordHash,
      name,
    } as any);
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ where: { email: email.toLowerCase() } });
  }

  async findOneById(id: number): Promise<User | null> {
    return this.userModel.findByPk(id);
  }

  async updateProfile(id: number, name?: string): Promise<User> {
    const user = await this.findOneById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (name !== undefined) {
      user.name = name;
    }
    await user.save();
    return user;
  }

  async changePassword(id: number, currentPasswordPlain: string, newPasswordPlain: string): Promise<void> {
    const user = await this.findOneById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await bcrypt.compare(currentPasswordPlain, user.passwordHash);
    if (!isMatch) {
      throw new ConflictException('Current password is incorrect');
    }

    user.passwordHash = await bcrypt.hash(newPasswordPlain, 10);
    await user.save();
  }
}
