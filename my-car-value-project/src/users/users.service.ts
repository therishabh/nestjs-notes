import { Injectable } from '@nestjs/common';

// @Injectable() is class ko ek "provider" banata hai jise Nest ke DI container me
// register kiya ja sakta hai (users.module.ts ke `providers` array me already registered hai)
@Injectable()
export class UsersService {}
// Abhi khaali hai — aage yaha users se related business logic (create, find, update, delete)
// aayegi, aur DB se baat karne ke liye `@InjectRepository(User) private repo: Repository<User>`
// constructor me inject hogi (isiliye UsersModule me TypeOrmModule.forFeature([User]) already lagaya hai)
