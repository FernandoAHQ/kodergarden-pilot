import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity("admin_users")
export class AdminUserEntity {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Index({ unique: true }) @Column({ type: "varchar", length: 320 }) email!: string;
  @Column({ name: "display_name", type: "varchar", length: 120 }) displayName!: string;
  @Column({ name: "password_hash", type: "text" }) passwordHash!: string;
  @Column({ type: "varchar", length: 20, default: "admin" }) role!: "admin" | "viewer";
  @Column({ name: "created_at", type: "timestamptz", default: () => "CURRENT_TIMESTAMP" }) createdAt!: Date;
  @Column({ name: "disabled_at", type: "timestamptz", nullable: true }) disabledAt!: Date | null;
}

@Entity("admin_sessions")
export class AdminSessionEntity {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "user_id", type: "uuid" }) userId!: string;
  @ManyToOne(() => AdminUserEntity, { onDelete: "CASCADE" }) @JoinColumn({ name: "user_id" }) user!: AdminUserEntity;
  @Index({ unique: true }) @Column({ name: "token_hash", type: "char", length: 64 }) tokenHash!: string;
  @Column({ name: "csrf_token", type: "varchar", length: 100 }) csrfToken!: string;
  @Column({ name: "created_at", type: "timestamptz", default: () => "CURRENT_TIMESTAMP" }) createdAt!: Date;
  @Index() @Column({ name: "expires_at", type: "timestamptz" }) expiresAt!: Date;
  @Column({ name: "last_seen_at", type: "timestamptz", default: () => "CURRENT_TIMESTAMP" }) lastSeenAt!: Date;
}

export const authEntities = [AdminUserEntity, AdminSessionEntity];
