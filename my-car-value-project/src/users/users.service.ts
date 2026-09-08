import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';

// @Injectable() is class ko ek "provider" banata hai jise Nest ke DI container me
// register kiya ja sakta hai (users.module.ts ke `providers` array me already registered hai)
@Injectable()
export class UsersService {
  // @InjectRepository(User) Nest ko batata hai ki `User` entity ka repository yaha inject karo —
  // ye repository sirf isliye milta hai kyunki UsersModule ne TypeOrmModule.forFeature([User])
  // import kiya hua hai (warna "can't resolve dependencies" error aata)
  // Repository<User> ek TypeORM object hai jisme .create(), .save(), .find(), etc. jaise
  // DB query methods hote hain — humein khud SQL likhne ki zaroorat nahi padti
  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
  ) {}

  // Naya user banane ka logic — controller (`UsersController.create`) yaha se call karta hai
  create(email: string, password: string) {
    // ---- repo.create() ----
    // Sirf ek in-memory `User` class instance banata hai — koi DB call, koi query, koi await nahi.
    // Isliye ye SYNCHRONOUS hai (Promise return nahi karta) aur `id` abhi bhi `undefined` hota hai
    // (DB hi decide karta hai id kya hoga, aur DB abhi touch hua hi nahi).
    // Iska fayda: entity ke `@BeforeInsert()` jaise TypeORM lifecycle hooks (agar future me lagaye)
    // yahi trigger hote hain, aur agar hum `new User()` seedha likhte to wo hooks skip ho jaate.
    // Isliye best practice `repo.create()` use karna hai, `new User()` nahi.
    const user = this.repo.create({ email, password });

    // ---- repo.save() ----
    // Actual DB call yahi karta hai — agar entity me `id` nahi hai to INSERT chalata hai,
    // agar `id` already hai to UPDATE chalata hai (yani save() dono create aur update handle karta hai,
    // ye "upsert-like" behavior interview me kaafi puchha jaata hai).
    // Ye ASYNCHRONOUS hai, isliye Promise<User> return karta hai — jab DB insert complete ho jayega
    // tab resolve hoga, aur resolved value me DB-generated `id` bhi included hoga.
    // `return` isliye kiya hai taaki:
    //   1. Ye Promise controller tak propagate ho (jo age isse `return` karke Nest ko de deta hai,
    //      aur Nest khud await/resolve karke response body bana deta hai).
    //   2. Agar DB error aaye (e.g. duplicate email, connection drop) to wo error bhi upar propagate ho
    //      jaaye, silently gum na ho (agar humne `return` na kiya hota to ye ek "floating promise" hota).
    return this.repo.save(user);
  }
}
