import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ReportsModule } from './reports/reports.module';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    // Dev-only DB setup: synchronize auto-creates tables from entities, unsafe for production
    TypeOrmModule.forRoot({
      type: 'sqlite', // Database driver/engine — batata hai kaunsa database use ho raha hai (yahan SQLite, ek file-based DB)
      database: 'db.sqlite', // Database file ka naam/path — SQLite yahan is file me data store karega
      entities: [], // Entity classes ki list (tables) — abhi empty hai, jaise-jaise entities banoge (User, Report) yaha add karni hongi
      synchronize: true, // TypeORM ko entities ke basis pe DB schema auto create/update karne dega — dev me convenient, production me data loss ka risk
    }),
    UsersModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
