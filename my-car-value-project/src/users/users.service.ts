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
    // repo.create() sirf ek in-memory `User` instance banata hai (DB me kuch save nahi karta abhi)
    const user = this.repo.create({ email, password });

    // repo.save() asal me DB me INSERT query chalata hai aur saved user (id ke saath) return karta hai
    // ye ek Promise return karta hai, isliye controller ko is result ko await/return karna hoga
    return this.repo.save(user);
  }
}
