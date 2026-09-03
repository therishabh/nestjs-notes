import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

// @Entity() is class ko ek DB table represent karne wali TypeORM "entity" banata hai
// (default table name class ke naam se lowercase ban jaata hai — yahan "user")
@Entity()
export class User {
  // Primary key column — auto-incrementing number TypeORM khud generate karta hai
  // `!` (definite assignment assertion): TS ko batata hai ki ye property khud humne
  // constructor me set nahi ki, TypeORM DB se load/insert ke time isse populate karega,
  // isliye "strictPropertyInitialization" error na de
  @PrimaryGeneratedColumn()
  id!: number;

  // Normal column — DB me ek text/varchar column banega
  @Column()
  email!: string;

  // Normal column — DB me ek text/varchar column banega
  // (abhi plain-text hai, real app me isse hash karke store karna chahiye)
  @Column()
  password!: string;
}
