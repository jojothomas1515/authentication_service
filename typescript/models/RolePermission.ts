import {BelongsToMany, Column, CreatedAt, DataType, Model, Table} from "sequelize-typescript";
import Permission from "./Permission";
import Role from "./Role";

@Table({tableName: "role_permissions", timestamps: false})
export default class RolePermission extends Model<RolePermission> {
  @Column({type: DataType.INTEGER, primaryKey: true, autoIncrement: true, autoIncrementIdentity: true})
  declare id: number;

  @Column({type: DataType.INTEGER, references: {model: 'roles', key: 'id'}, field: 'role_id'})
  declare roleId: number;

  @Column({type: DataType.INTEGER, references: {model: 'permissions', key: 'id'}, field: 'permission_id'})
  declare permissionId: number;

  @CreatedAt
  @Column({type: DataType.DATE, field: 'created_at'})
  declare createdAt: Date;

  @BelongsToMany(() => Permission, () => RolePermission, 'role_id', 'permission_id')
  declare permissions: RolePermission[];

  @BelongsToMany(() => Role, () => RolePermission, 'permission_id', 'role_id')
  declare roles: RolePermission[];
}
