import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
// AuthService signup/auth workflow (password hashing, duplicate-email check) handle karta hai —
// UsersService se alag rakha gaya taaki UsersService sirf plain DB CRUD tak simit rahe
import { AuthService } from './auth.service';
// BcryptAuthService — sirf learning/demo purpose ke liye, bcrypt-based hashing dikhane ke liye
// (dekho bcrypt-auth.service.ts ka top-level comment). Isse abhi koi controller use nahi karta.
import { BcryptAuthService } from './bcrypt-auth.service';
import { AuthV2Service } from './auth-v2.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  // AuthService/BcryptAuthService bhi providers me register kiye — warna kahi bhi inject
  // karte hi "can't resolve dependencies" error aata
  providers: [UsersService, AuthService, BcryptAuthService, AuthV2Service],
})
export class UsersModule {}
