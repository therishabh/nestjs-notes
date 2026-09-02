import { NestFactory } from '@nestjs/core';
import { MessagesModule } from './messages/messages.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(MessagesModule);
  // useGlobalPipes() - is pipe ko poori application ke saare routes pe apply kar deta hai,
  // taaki har controller me alag se @UsePipes() lagane ki zaroorat na pade
  app.useGlobalPipes(
    new ValidationPipe({
      // whitelist: true - DTO class me jo properties define nahi hain, unhe request body
      // se automatically strip (remove) kar deta hai, matlab sirf allowed fields hi aage jaate hain
      whitelist: true,
      // forbidNonWhitelisted: true - agar request body me koi aisi extra property aayi jo
      // DTO me define nahi hai, to use silently strip karne ke bajaye error (400 Bad Request) throw kar deta hai
      forbidNonWhitelisted: true,
      // transform: true - incoming request data (jo by default plain JS object hota hai) ko
      // automatically DTO class ke instance me convert kar deta hai (jaise string "5" ko number 5 me,
      // agar DTO me @Type()/type declare kiya ho), taaki type-safe data controller me mile
      transform: true,
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
