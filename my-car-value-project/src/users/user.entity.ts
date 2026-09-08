import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  AfterInsert,
  AfterUpdate,
  AfterRemove,
} from 'typeorm';

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

  // ---- TypeORM Lifecycle Hooks ----
  // Ye teeno methods TypeORM khud call karta hai jab respective DB operation **successfully**
  // complete ho jaaye — humein manually kahi se call karne ki zaroorat nahi. Inka use audit
  // logging, cache invalidation, side-effects (e.g. welcome email bhejna) jaise kaamon me hota hai.
  //
  // IMPORTANT: ye hooks sirf tabhi trigger hote hain jab operation **entity instance ke through**
  // ho — `repo.save()` aur `repo.remove()` dono entity load/pass karte hain isliye inhe trigger
  // karte hain, lekin `repo.delete(id)`/`repo.update(id, ...)` sirf ek query-level criteria pe
  // seedha SQL chalate hain (entity ko kabhi touch hi nahi karte), isliye wo ye hooks trigger
  // NAHI karte — [Step 7](../README.md#step-7-find-update-remove-methods-add-kiye) me
  // `remove()` vs `delete()` ka yahi sabse bada practical farak discuss kiya gaya hai.

  // repo.save() se naya row INSERT hone ke baad trigger hota hai
  @AfterInsert()
  logAfterInsert() {
    console.log('User Inserted with ID : ', this.id);
  }

  // repo.save() se existing row UPDATE hone ke baad trigger hota hai
  @AfterUpdate()
  logAfterUpdate() {
    console.log('User updated successfully with ID : ', this.id);
  }

  // repo.remove() se row DELETE hone ke baad trigger hota hai
  @AfterRemove()
  logAfterRemove() {
    console.log('User Removed with ID : ', this.id);
  }
}
