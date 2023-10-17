import {Column, DataType, Model, Table} from "sequelize-typescript";

@Table({tableName: "password_reset_tokens", timestamps: false})
export default class PasswordResetToken extends Model<PasswordResetToken> {

  @Column({type: DataType.INTEGER, primaryKey: true, autoIncrement: true})
  declare id: number;

  @Column({type: DataType.STRING, allowNull: false})
  declare token: string;

  @Column({type: DataType.UUID, allowNull: false, references: {model: "users", key: "id"}})
  declare userId: string;

  @Column({type: DataType.DATE, allowNull: false})
  declare expiresAt: Date;
}
