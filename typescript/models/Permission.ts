import {Column, CreatedAt, DataType, Model, Table} from "sequelize-typescript";

@Table({tableName: 'permissions', timestamps: false})
export default class Permission extends Model<Permission> {
  @Column({type: DataType.INTEGER, primaryKey: true, autoIncrement: true})
  declare id: number;

  @Column({type: DataType.STRING, allowNull: false})
  declare name: string;

  @CreatedAt
  declare createdAt: Date;
}
