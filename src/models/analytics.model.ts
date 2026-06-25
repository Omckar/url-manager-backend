import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Url } from './url.model';

@Table({ tableName: 'analytics', timestamps: true })
export class Analytics extends Model<Analytics> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @ForeignKey(() => Url)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare urlId: number;

  @BelongsTo(() => Url)
  url: Url;

  @Column({
    type: DataType.STRING(45),
    allowNull: true,
  })
  declare ipAddress: string | null;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  declare browser: string | null;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  declare device: string | null;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  declare operatingSystem: string | null;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  declare country: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare referrer: string | null;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  declare timestamp: Date;
}
