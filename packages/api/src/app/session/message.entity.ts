import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 't_message' })
export class MessageEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'session_id', type: 'int' })
  sessionId!: number;

  @Column({ name: 'user_name', type: 'varchar', length: 255 })
  userName!: string;

  @Column({ name: 'message_type', type: 'int', default: 1 })
  messageType!: number;

  // 1 marks this message as an assistant "thought" rendered as a
  // collapsible note. 0 is a regular message.
  @Column({ name: 'is_thought', type: 'int', default: 0 })
  isThought!: number;

  @Column({ type: 'longtext', nullable: true })
  content!: string | null;

  @Column({ name: 'created_on', type: 'timestamp' })
  createdOn!: Date;

  @Column({ name: 'created_by', type: 'varchar', length: 255 })
  createdBy!: string;

  @Column({ name: 'updated_on', type: 'timestamp', nullable: true })
  updatedOn!: Date | null;

  @Column({ name: 'updated_by', type: 'varchar', length: 255, nullable: true })
  updatedBy!: string | null;
}
