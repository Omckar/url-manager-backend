import { Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Url } from '../models/url.model';
import { CreateUrlDto } from '../dto/create-url.dto';
import { UpdateUrlDto } from '../dto/update-url.dto';
import { encodeBase62 } from '../utils/base62';
import { Op } from 'sequelize';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UrlsService {
  constructor(
    @InjectModel(Url)
    private urlModel: typeof Url,
  ) {}

  async create(userId: number, createDto: CreateUrlDto): Promise<Url> {
    const { longUrl, customAlias, expiryDate, password } = createDto;

    // If custom alias is provided, check if it's already in use
    if (customAlias) {
      const sanitizedAlias = customAlias.trim();
      const existing = await this.urlModel.findOne({
        where: {
          [Op.or]: [
            { shortCode: sanitizedAlias },
            { customAlias: sanitizedAlias },
          ],
        },
      });
      if (existing) {
        throw new ConflictException('Custom alias is already in use');
      }
    }

    const passwordHash = password ? await bcrypt.hash(password, 10) : null;
    const expiry = expiryDate ? new Date(expiryDate) : null;

    const tempShortCode = customAlias
      ? customAlias.trim()
      : `TEMP_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const url = await this.urlModel.create({
      userId,
      longUrl,
      customAlias: customAlias ? customAlias.trim() : null,
      shortCode: tempShortCode,
      expiryDate: expiry,
      passwordHash,
      clickCount: 0,
      isActive: true,
    } as any);

    // If no custom alias was requested, generate short code from auto-increment ID
    if (!customAlias) {
      url.shortCode = encodeBase62(url.id);
      await url.save();
    }
    return url;
  }

  async findAll(
    userId: number,
    query: {
      page?: number;
      limit?: number;
      search?: string;
      filter?: string;
      sortBy?: string;
    },
  ) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const offset = (page - 1) * limit;

    const whereClause: any = { userId };

    // Search matches longUrl, shortCode, or customAlias
    if (query.search) {
      const searchLike = `%${query.search}%`;
      whereClause[Op.or] = [
        { longUrl: { [Op.like]: searchLike } },
        { shortCode: { [Op.like]: searchLike } },
        { customAlias: { [Op.like]: searchLike } },
      ];
    }

    // Filters: active, expired, disabled, password_protected
    if (query.filter) {
      const now = new Date();
      if (query.filter === 'active') {
        whereClause.isActive = true;
        whereClause[Op.and] = [
          {
            [Op.or]: [
              { expiryDate: null },
              { expiryDate: { [Op.gt]: now } },
            ],
          },
        ];
      } else if (query.filter === 'expired') {
        whereClause.expiryDate = { [Op.lt]: now };
      } else if (query.filter === 'disabled') {
        whereClause.isActive = false;
      } else if (query.filter === 'password_protected') {
        whereClause.passwordHash = { [Op.not]: null as any };
      }
    }

    // Sort order mapping
    let order: any = [['createdAt', 'DESC']]; // default newest
    if (query.sortBy === 'oldest') {
      order = [['createdAt', 'ASC']];
    } else if (query.sortBy === 'most_clicked') {
      order = [['clickCount', 'DESC']];
    } else if (query.sortBy === 'alphabetical') {
      order = [['longUrl', 'ASC']];
    }

    const { rows, count } = await this.urlModel.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order,
    });

    return {
      data: rows,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    };
  }

  async findOne(id: number, userId: number): Promise<Url> {
    const url = await this.urlModel.findByPk(id);
    if (!url) {
      throw new NotFoundException('URL not found');
    }
    if (url.userId !== userId) {
      throw new ForbiddenException('You do not have access to this URL');
    }
    return url;
  }

  async update(id: number, userId: number, updateDto: UpdateUrlDto): Promise<Url> {
    const url = await this.findOne(id, userId);
    const { customAlias, expiryDate, password, isActive } = updateDto;

    if (customAlias !== undefined) {
      const sanitizedAlias = customAlias ? customAlias.trim() : null;
      if (sanitizedAlias && sanitizedAlias !== url.customAlias) {
        const existing = await this.urlModel.findOne({
          where: {
            id: { [Op.ne]: id },
            [Op.or]: [
              { shortCode: sanitizedAlias },
              { customAlias: sanitizedAlias },
            ],
          },
        });
        if (existing) {
          throw new ConflictException('Custom alias is already in use');
        }
        url.customAlias = sanitizedAlias;
        url.shortCode = sanitizedAlias; // custom alias overrides shortCode redirect path
      } else if (!sanitizedAlias) {
        url.customAlias = null;
        url.shortCode = encodeBase62(url.id); // Revert to standard short code
      }
    }

    if (expiryDate !== undefined) {
      url.expiryDate = expiryDate ? new Date(expiryDate) : null;
    }

    if (password !== undefined) {
      url.passwordHash = password ? await bcrypt.hash(password, 10) : null;
    }

    if (isActive !== undefined) {
      url.isActive = isActive;
    }

    await url.save();
    return url;
  }

  async remove(id: number, userId: number): Promise<void> {
    const url = await this.findOne(id, userId);
    await url.destroy();
  }

  async verifyPassword(id: number, passwordPlain: string): Promise<boolean> {
    const url = await this.urlModel.findByPk(id);
    if (!url || !url.passwordHash) {
      return false;
    }
    return bcrypt.compare(passwordPlain, url.passwordHash);
  }

  // Used internally by the redirect logic (public access)
  async findByShortCode(shortCode: string): Promise<Url | null> {
    return this.urlModel.findOne({
      where: {
        [Op.or]: [
          { shortCode },
          { customAlias: shortCode },
        ],
      },
    });
  }
}
