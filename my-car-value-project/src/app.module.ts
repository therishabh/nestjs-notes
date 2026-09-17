import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ReportsModule } from './reports/reports.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/user.entity';
import { Report } from './reports/report.entity';
// AuthGuard — ab poori application ke liye "login required" default bana deta hai
// (dekho src/users/guards/AuthGuard.ts, aur README Step 21 ke "senior notes" section).
// Isse `UsersModule` ke bajaye yaha `AppModule` (root) me register kiya, kyunki iski
// `Reflector` dependency kisi feature module se private nahi hai — `CurrentUserInterceptor`
// (Step 20) ke ulat, jiski `UsersService` dependency sirf `UsersModule` tak resolve
// hoti thi, isliye wo waha register karna padta. `AuthGuard` ke liye asal me koi
// module-specific constraint nahi hai, isliye root module hi sabse discoverable/natural
// jagah hai ek app-wide security concern rakhne ke liye.
import { AuthGuard } from './users/guards/AuthGuard';
import { APP_GUARD } from '@nestjs/core';

// `@nestjs/config` — `.env` files se environment variables padhne ka official Nest wrapper
// (Node ke `dotenv` package ke upar bana hai). Isse pehle `main.ts` me sirf
// `process.env.COOKIE_SESSION_KEY` jaisa ek-off, direct `process.env` access tha — ab
// DB config (`DB_NAME`) ke liye ek proper, testable, type-hinted tareeka use kiya
// (dekho README Step 23).
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    // `ConfigModule.forRoot()` — `.env` file padh kar uske key-values ko poori app me
    // `ConfigService` ke through available karata hai.
    // - `isGlobal: true` — is module ko poore app me "global" bana deta hai, matlab kisi
    //   bhi doosre module (UsersModule, ReportsModule) ko `ConfigModule` ko apne `imports`
    //   me alag se lene ki zaroorat nahi, `ConfigService` seedha inject ho jaata hai —
    //   bilkul waisa hi jaise `APP_GUARD`/`APP_INTERCEPTOR` (Step 20/22) module-boundary
    //   ke bahar globally kaam karte hain, bas mechanism alag hai (ye ek dedicated
    //   `isGlobal` flag hai, DI-token-based nahi).
    // - `envFilePath: \`.env.${process.env.NODE_ENV}\`` — `NODE_ENV` ke hisaab se sahi
    //   `.env` file uthata hai (`.env.development`, `.env.test`, etc.) — isliye
    //   `package.json` ke `start:dev` script me `NODE_ENV=development` explicitly set
    //   kiya gaya hai (warna `process.env.NODE_ENV` `undefined` hota, aur ye path
    //   `.env.undefined` ban jaata — file na milti to `ConfigService` bas khaali/`undefined`
    //   values deta, turant crash nahi hota, isliye galti se miss hona aasan hai).
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV}`,
    }),
    // Purana hardcoded (static) DB setup — jaan-bujh kar comment-out karke rakha hai
    // (delete nahi kiya), taaki naye `forRootAsync()` wale (neeche) se COMPARE ho sake:
    // yaha `database: 'db.sqlite'` ek fixed string thi, ab wahi value `.env` file se
    // `ConfigService` ke through aati hai — matlab dev/test alag-alag DB files use kar
    // sakte hain (`.env.development` → `db.sqlite`, `.env.test` → `test.sqlite`) bina
    // code me kuch badle.
    //
    // TypeOrmModule.forRoot({
    //   type: 'sqlite', // Database driver/engine — batata hai kaunsa database use ho raha hai (yahan SQLite, ek file-based DB)
    //   database: 'db.sqlite', // Database file ka naam/path — SQLite yahan is file me data store karega
    //   entities: [User, Report], // Entity classes ki list (tables) — jaise-jaise nayi entities banoge (Report, etc.) yaha add karni hongi
    //   synchronize: true, // TypeORM ko entities ke basis pe DB schema auto create/update karne dega — dev me convenient, production me data loss ka risk
    // }),
    //
    // `forRoot()` ke bajaye `forRootAsync()` istemal karna ZAROORI tha — `forRoot()` ek
    // plain, synchronous options-object leta hai jo module-definition time pe hi (poori
    // app bootstrap hone se pehle) resolve ho jaata hai, isliye usme kisi DI-managed
    // provider (jaise `ConfigService`) ko reference nahi kiya ja sakta — wo provider
    // abhi banaa hi nahi hota. `forRootAsync()` ka `useFactory` DI container ko `inject`
    // array me maangi gayi dependencies (`ConfigService`) pehle resolve karne deta hai,
    // phir unhe factory function me pass karta hai — isse options object DYNAMICALLY,
    // doosre providers ki resolved values se, banaya ja sakta hai.
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          type: 'sqlite',
          // `config.get<string>('DB_NAME')` — generic `<string>` sirf TypeScript ko
          // "trust karo, ye string hi hogi" batata hai, runtime pe koi guarantee nahi
          // hai. Agar `.env` file me `DB_NAME` key hi missing/typo ho, to ye `undefined`
          // return karega — TS compile-time pe error nahi degi (generic ne "promise"
          // kar diya string hone ka), lekin runtime pe TypeORM ko `database: undefined`
          // mil jaayega. Isi tarah ka "any/generic jhooth bol sakta hai" risk pehle bhi
          // is project me discuss hua hai (Step 12 ka `this.dto: any` gotcha).
          database: config.get<string>('DB_NAME'),
          synchronize: true,
          entities: [User, Report],
        };
      },
    }),
    UsersModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // `APP_INTERCEPTOR` (Step 20) ki tarah hi `APP_GUARD` bhi ek special/reserved token
    // hai — is provider ko yaha likhte hi Nest `AuthGuard` ko poori application ke har
    // route pe globally apply kar deta hai. Ab default "fail-closed" hai: jo route
    // explicitly `@Public()` (dekho public.decorator.ts) se mark nahi hai, wo sab
    // login-required hai.
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
