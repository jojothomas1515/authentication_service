import {Column, DataType, Model, Table} from 'sequelize-typescript';

@Table({tableName: 'roles', timestamps: false})
export default class Role extends Model<Role> {
  @Column({type: DataType.INTEGER, primaryKey: true, autoIncrement: true})
  declare id: number;

  @Column({type: DataType.STRING, allowNull: false})
  declare name: string;
}
