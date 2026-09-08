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

  // Ek user ko uske `id` se dhoondta hai — `findOneBy()` short-hand hai
  // `find({ where: { id } })` ka, jab sirf ek simple equality condition check karni ho.
  // Agar user na mile to `null` return karta hai (error throw nahi karta) —
  // isi wajah `update()`/`remove()` me neeche explicit `if (!user)` check lagana pada.
  findOne(id: number) {
    return this.repo.findOneBy({ id });
  }

  // Email ke basis pe user(s) dhoondta hai — `find()` hamesha **array** return karta hai
  // (chahe 0, 1, ya multiple matches mile), `findOne`/`findOneBy` ke ulat jo single record
  // (ya `null`) return karte hain. Isliye naam `find` hai, `findOne` nahi.
  find(email: string) {
    return this.repo.find({ where: { email } });
  }

  // Existing user ko partially update karta hai (e.g. sirf email badalna ho to poora
  // object dobara bhejne ki zaroorat nahi — isliye `Partial<User>` type use kiya hai)
  async update(id: number, attrs: Partial<User>) {
    // Pehle DB se current user fetch karna zaroori hai — `Object.assign()` ek existing
    // JS object pe naye fields merge karta hai, isliye base object (`user`) chahiye
    const user = await this.findOne(id);
    if (!user) {
      throw new Error('user not found');
    }
    // `attrs` me jo bhi fields aayi (e.g. `{ email: 'new@x.com' }`) unhe `user` object pe
    // overwrite kar deta hai — jo fields `attrs` me nahi hain wo `user` ki purani value pe hi rahengi
    Object.assign(user, attrs);
    // save() yaha UPDATE chalayega (`INSERT` nahi), kyunki `user.id` already set hai
    // (yehi wo "upsert-like" behavior hai jo Step 6 me `save()` ke baare me discuss kiya tha)
    return this.repo.save(user);
  }

  // User delete karta hai — pehle DB se poora entity fetch karta hai, phir usse remove karta hai
  async remove(id: number) {
    const user = await this.findOne(id);
    if (!user) {
      throw new Error('user not found');
    }
    // ---- repo.remove(entity) vs repo.delete(criteria) ----
    // Yaha jaan-bujh kar `repo.remove(user)` use kiya hai, `repo.delete(id)` nahi — dono me farak hai:
    //
    // `repo.remove(entity)`:
    //   - Isse ek **poora loaded entity object** chahiye (isiliye upar pehle `findOne(id)` call kiya).
    //   - TypeORM lifecycle hooks (`@BeforeRemove()`, `@AfterRemove()`, agar entity pe lagaye ho) trigger karta hai.
    //   - Delete ke baad passed entity object ka `id` khud `undefined` set kar deta hai (in-memory).
    //   - Thoda "expensive" hai kyunki 2 DB calls lagte hain — pehle SELECT (findOne), phir DELETE.
    //   - Fayda: hume pata chal jaata hai user exist karta tha ya nahi (upar `if (!user)` check se),
    //     aur agar entity pe koi custom "before delete" business logic ho to wo guaranteed chalegi.
    //
    // `repo.delete(criteria)` (agar use karte):
    //   - Sirf `id` (ya koi bhi where-condition) chahiye — entity load karne ki zaroorat nahi,
    //     isliye ek hi DB call (direct DELETE query) me kaam ho jaata — zyada efficient.
    //   - Lifecycle hooks TRIGGER NAHI karta (kyunki TypeORM ke paas entity instance hi nahi hota).
    //   - Return value `DeleteResult` (`{ affected: number }`) hota hai, poora entity nahi —
    //     "user exist karta tha ya nahi" janne ke liye `affected === 0` check karna padta,
    //     jo `findOne()`-based null check jitna direct/readable nahi hai.
    //
    // Yaha `remove()` isliye chuna gaya kyunki humein pehle se hi "user not found" case explicitly
    // handle karna tha (better error message ke liye), to entity load to ho hi rahi thi —
    // isliye `remove()` use karna natural fit tha. Agar sirf fast bulk-delete chahiye ho
    // aur "not found" case ki fikar na ho, to `repo.delete(id)` zyada efficient choice hoti.
    return this.repo.remove(user);
  }
}
