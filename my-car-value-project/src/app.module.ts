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

@Module({
  imports: [
    // Dev-only DB setup: synchronize auto-creates tables from entities, unsafe for production
    TypeOrmModule.forRoot({
      type: 'sqlite', // Database driver/engine — batata hai kaunsa database use ho raha hai (yahan SQLite, ek file-based DB)
      database: 'db.sqlite', // Database file ka naam/path — SQLite yahan is file me data store karega
      entities: [User, Report], // Entity classes ki list (tables) — jaise-jaise nayi entities banoge (Report, etc.) yaha add karni hongi
      synchronize: true, // TypeORM ko entities ke basis pe DB schema auto create/update karne dega — dev me convenient, production me data loss ka risk
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
