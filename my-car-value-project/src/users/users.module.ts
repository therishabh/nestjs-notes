import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
// AuthService signup/auth workflow (password hashing, duplicate-email check) handle karta hai —
// UsersService se alag rakha gaya taaki UsersService sirf plain DB CRUD tak simit rahe
import { AuthService } from './auth.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  // AuthService bhi providers me register kiya — warna UsersController ke constructor me
  // ise inject karte hi "can't resolve dependencies" error aata
  providers: [UsersService, AuthService],
})
export class UsersModule {}
