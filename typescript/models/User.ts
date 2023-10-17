import {Column, CreatedAt, DataType, ForeignKey, HasOne, Model, Table} from 'sequelize-typescript'
import Role from "./Role";

@Table({tableName: 'users', timestamps: false})
export default class User extends Model<User> {
  @Column({type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true})
  declare id: string;

  @Column({type: DataType.STRING, allowNull: true})
  declare username: string;

  @Column({type: DataType.STRING, allowNull: false, field: 'first_name'})
  declare firstName: string;

  @Column({type: DataType.STRING, allowNull: false, field: 'last_name'})
  declare lastName: string;

  @Column({type: DataType.STRING, allowNull: false})
  declare email: string;

  @Column({type: DataType.TEXT, field: 'section_order'})
  declare sectionOrder: string;

  @Column({type: DataType.STRING})
  declare password: string;

  @Column({type: DataType.STRING})
  declare provider: string;

  @Column({type: DataType.TEXT, field: 'profile_pic'})
  declare profilePic: string;

  @Column({type: DataType.STRING, field: 'refresh_token'})
  declare refreshToken: string;

  @Column({type: DataType.STRING, field: 'two_fa_code', allowNull: true})
  declare twoFACode: string;

  @ForeignKey(() => Role)
  @Column({type: DataType.INTEGER, defaultValue: 2, allowNull: false, field: 'role_id'})
  declare roleId: number;

  @Column({type: DataType.BOOLEAN, defaultValue: false, field: 'is_verified'})
  declare isVerified: boolean;

  @Column({type: DataType.BOOLEAN, defaultValue: false, field: 'two_factor_auth'})
  declare twoFactorAuth: boolean;

  @Column({type: DataType.STRING(255)})
  declare location: string;

  @Column({type: DataType.STRING(255)})
  declare country: string;

  @CreatedAt
  declare createdAt: Date;

  @HasOne(() => Role, 'role_id')
  declare userRole: Role;
}
