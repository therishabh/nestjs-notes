# Mini Messages App

Ye project Nest CLI se generate kiya gaya hai (`nest new mini-messages-app`), aur isme step by step naye NestJS concepts practice kiye ja rahe hain. Neeche jo bhi kiya hai wo order me likha hai — jab bhi kuch naya add karo, isi file me neeche add karte jana.

## Step 1: Project Generate Kiya

Nest CLI se project scaffold kiya gaya — isme by default `AppModule`, `AppController`, `AppService` aur testing setup (Jest) already configured aata hai. Iske alawa `nest-cli.json`, ESLint, Prettier config bhi default se aaye.

## Step 2: `MessagesModule` Banaya

Nest CLI ke schematic se ek naya feature module generate kiya:

```bash
nest g module messages
```

Isse `src/messages/messages.module.ts` bana aur automatically `AppModule` ke `imports` array me register ho gaya. Feature-based folder structure follow karne ke liye har feature (jaise `messages`) apna khud ka module rakhta hai.

## Step 3: `MessagesController` Banaya

```bash
nest g controller messages
```

Isse `src/messages/messages.controller.ts` bana aur `MessagesModule` ke `controllers` array me automatically register ho gaya. Controller path prefix `@Controller('messages')` diya, matlab is controller ke saare routes `/messages` se start honge.

## Step 4: Routes Define Kiye

`MessagesController` me 4 routes banaye, alag-alag HTTP methods (`@Get`, `@Post`, `@Put`) use karke:

- `GET /messages` → `getMessages()` — saare messages ka dummy response deta hai
- `GET /messages/:id` → `getMessageById()` — `@Param('id')` decorator se URL ke dynamic `:id` segment ki value nikal kar use karta hai
- `POST /messages` → `createMessage()` — naya message create karne ka placeholder
- `PUT /messages/:id` → `updateMessage()` — id ke through message update karne ka placeholder

Abhi in routes me koi actual logic (DB, service call) nahi hai, sirf static string return ho raha hai — routing aur decorators samajhne ke liye.

## Step 5: `@Body()` Decorator Use Kiya

`createMessage()` aur `updateMessage()` me `@Body()` decorator add kiya taaki request ke JSON body se data read kiya ja sake:

- `POST /messages` — body me `{ text: string }` bhejte hain, wahi text response me wapas milta hai
- `PUT /messages/:id` — body ka `text` aur URL ka `id` (`@Param`) dono ek saath use hote hain

Abhi type ke liye inline `{ text: string }` use kiya hai, koi proper DTO class nahi banayi — wo agla step hoga.


## Step 6: `main.ts` me Floating Promise Warning Fix Kiya

`bootstrap()` async function hai jo Promise return karta hai. Pehle sirf `bootstrap()` likha tha jisse ESLint ka `no-floating-promises` warning aa raha tha (promise ko await/handle nahi kiya gaya tha). Fix kiya:

```ts
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(MessagesModule);
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
```

`void` operator se ESLint ko explicitly bata diya ki promise ka result jaan-bujh kar ignore kiya ja raha hai.

## Step 7: `ValidationPipe` Global Level Pe Lagaya

`main.ts` me `app.useGlobalPipes()` ke through `ValidationPipe` poori application pe apply kiya, taaki har controller me alag se `@UsePipes()` lagane ki zaroorat na pade:

```ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);
```

- `whitelist: true` — DTO me define na ki gayi extra properties ko request body se automatically strip (remove) kar deta hai
- `forbidNonWhitelisted: true` — agar koi extra (non-whitelisted) property aayi to use silently ignore karne ke bajaye `400 Bad Request` error de deta hai
- `transform: true` — incoming plain JS object ko automatically DTO class ke instance me convert kar deta hai (type-safe data controller me milta hai)

## Step 8: `CreateMessageDto` Banaya

`src/messages/dtos/create-message.dto.ts` me `class-validator` ke `@IsString()` decorator ke saath ek DTO class banayi:

```ts
export class CreateMessageDto {
  @IsString()
  text!: string;

  @IsString()
  author!: string;
}
```

- `!` (definite assignment assertion) use kiya kyunki DTO properties constructor me set nahi hoti — inki value request body se `ValidationPipe` ke `transform` ke through aati hai, isse TypeScript ka "no initializer" (strict property initialization) error fix ho jata hai
- Abhi ye DTO banayi hai lekin controller me `createMessage()`/`updateMessage()` me abhi bhi inline `{ text: string }` type use ho raha hai — DTO ko route me actually use karna agla step hoga

## Step 9: `request.http` File Banayi

Root me `request.http` file banayi (REST Client / VS Code extension ke saath use karne ke liye) jisme saare 4 routes ke test requests likhe hain — `GET /messages`, `GET /messages/:id`, `POST /messages` (JSON body ke saath), `PUT /messages/:id` (JSON body ke saath).

## Kaise Run Kare

```bash
npm install
npm run start:dev
```

Server `http://localhost:3000` pe start hoga. `request.http` file open karke saare routes test kar sakte ho.

## Ab Tak Cover Kiye Gaye Concepts

- Nest CLI se project generate karna
- Feature modules (`nest g module`)
- Controllers (`nest g controller`)
- Route decorators — `@Get`, `@Post`, `@Put`
- Dynamic route params ke liye `:id` pattern aur `@Param()` decorator
- Request body read karne ke liye `@Body()` decorator
- ESLint `no-floating-promises` aur `void` operator ka use
- Global `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`)
- DTOs aur `class-validator` decorators (`@IsString`)
- `.http` files se API testing (REST Client)
