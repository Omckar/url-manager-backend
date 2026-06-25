import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';
import { User } from './user.model';
import { Analytics } from './analytics.model';

@Table({ tableName: 'urls', timestamps: true })
export class Url extends Model<Url> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare userId: number;

  @BelongsTo(() => User)
  user: User;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare longUrl: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    unique: true,
  })
  declare shortCode: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
    unique: true,
  })
  declare customAlias: string | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare expiryDate: Date | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare passwordHash: string | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  declare clickCount: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  declare isActive: boolean;

  @HasMany(() => Analytics)
  clicks: Analytics[];
}
