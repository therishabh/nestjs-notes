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
// CurrentUserInterceptor — request pe `currentUser` attach karta hai (dekho
// current-user.interceptor.ts). Iske constructor me `UsersService` inject hota hai,
// isliye Nest DI container ko ye resolve karne ke liye kahi providers me register
// hona zaroori hai (neeche `APP_INTERCEPTOR` provider ke through).
import { CurrentUserInterceptor } from './interceptors/current-user.interceptor';
// `APP_INTERCEPTOR` — Nest ka ek SPECIAL/reserved DI token (`@nestjs/core` se), jo
// niche `providers` array me `{ provide: APP_INTERCEPTOR, useClass: ... }` ke roop
// me use hote hi Nest ko ye interceptor **poori application ke har module/controller/
// route** pe globally apply karne ka signal deta hai — chahe ye khud sirf `UsersModule`
// ke providers me likha ho, iska scope `UsersModule`/`/auth` tak limited NAHI rehta.
// Ye `main.ts` ke `app.useGlobalInterceptors(new CurrentUserInterceptor(...))` jaisa hi
// result deta hai, bas ek bada fayde ke saath: kyunki ye DI container ke through
// register hota hai, `CurrentUserInterceptor` apne constructor me `UsersService` jaisi
// dependencies normally inject करवा sakta hai — `main.ts` me `new` karke banaya hota
// to DI se bahar hota, aur manually `UsersService` ka instance khud jod-tod kar banana
// padta. (`APP_GUARD`, `APP_PIPE`, `APP_FILTER` bhi isi pattern se globally register
// hote hain.)
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  // AuthService/BcryptAuthService bhi providers me register kiye — warna kahi bhi
  // inject karte hi "can't resolve dependencies" error aata. `CurrentUserInterceptor`
  // yaha seedha class ke roop me NAHI, balki `APP_INTERCEPTOR` provider object ke
  // roop me register kiya hai — isse ye is module tak limited na rehkar poori app pe
  // global ho jaata hai (upar `APP_INTERCEPTOR` import ke comment me detail hai).
  // Ab controller me alag se `@UseInterceptors(CurrentUserInterceptor)` lagane ki
  // zaroorat NAHI rahi (pehle wahi kiya jaata tha, jo sirf `/auth/*` routes tak
  // limited hota — dekho README Step 19 vs Step 20 ka farak).
  providers: [
    UsersService,
    AuthService,
    BcryptAuthService,
    AuthV2Service,
    {
      provide: APP_INTERCEPTOR,
      useClass: CurrentUserInterceptor,
    },
  ],
})
export class UsersModule {}
