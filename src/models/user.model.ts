import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import { Url } from './url.model';

@Table({ tableName: 'users', timestamps: true })
export class User extends Model<User> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  })
  declare email: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare passwordHash: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare name: string | null;

  @HasMany(() => Url)
  urls: Url[];
}
