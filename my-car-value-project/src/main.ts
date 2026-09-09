import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieSession from 'cookie-session';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // cookie-session middleware — request/response cycle me `req.session` available
  // karwata hai, jise controllers `@Session()` decorator (@nestjs/common se) ke
  // through read/write karte hain. Isse pehle lagana zaroori hai, warna `req.session`
  // hamesha `undefined` rahega aur `session.userId = ...` jaisa code runtime pe crash karega.
  app.use(
    cookieSession({
      keys: [process.env.COOKIE_SESSION_KEY ?? 'dev-only-secret-key'],
    }),
  );
  // useGlobalPipes — is pipe ko poori app ke har route pe apply karta hai
  // (alag se har controller/route pe @UsePipes() lagane ki zaroorat nahi)
  app.useGlobalPipes(
    // ValidationPipe request body ko uske DTO class (e.g. CreateUserDto) ke
    // class-validator decorators (@IsEmail, @IsString, etc.) ke against check karta hai —
    // validation fail hote hi controller tak pahunche bina hi 400 Bad Request bhej deta hai
    new ValidationPipe({
      // whitelist: true — DTO me define na kiye gaye extra properties (jo body me aayi
      // par decorator nahi lagi) ko silently strip/remove kar deta hai, error nahi deta
      // (e.g. agar koi `isAdmin: true` bhi bhej de jo CreateUserDto me nahi hai, wo hat jayega)
      whitelist: true,
    }),
  );
  await app.listen(process.env.PORT ?? 3030);
}
// void — bootstrap() ka returned Promise jaan-bujh kar ignore kiya (app top-level pe hi
// start ho raha hai, iska result kahi await/use nahi karna), isse ESLint ka
// "floating promise" warning bhi silence ho jaata hai
void bootstrap();
