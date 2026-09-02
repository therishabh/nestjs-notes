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

## Step 9: `text` Field Ko Required Banaya

`CreateMessageDto` ke `text` field pe `@IsNotEmpty()` decorator add kiya:

```ts
@IsString()
@IsNotEmpty()
text!: string;
```

`@IsString()` sirf type check karta hai (empty string `""` bhi valid string maani jaati hai), isliye field ko sach me required (non-empty) banane ke liye `@IsNotEmpty()` alag se lagana zaroori hai. Ab agar `text` empty, `null`, ya `undefined` bheja gaya to global `ValidationPipe` `400 Bad Request` error de dega.

## Step 10: `request.http` File Banayi

Root me `request.http` file banayi (REST Client / VS Code extension ke saath use karne ke liye) jisme saare 4 routes ke test requests likhe hain — `GET /messages`, `GET /messages/:id`, `POST /messages` (JSON body ke saath), `PUT /messages/:id` (JSON body ke saath).

## Step 11: `CreateMessageDto` Ko Controller Me Actually Use Kiya

Pehle `createMessage()` me inline type `{ text: string }` tha, ab usse hata kar asli `CreateMessageDto` use kiya:

```ts
@Post('/')
createMessage(@Body() body: CreateMessageDto) {
  return (
    'Message created with text: ' + body.text + ' and author: ' + body.author
  );
}
```

Ab request body global `ValidationPipe` ke through `CreateMessageDto` ke rules (`@IsString`, `@IsNotEmpty`) se validate hoti hai, aur `whitelist`/`forbidNonWhitelisted` ki wajah se DTO me na likhi extra properties (jaise `age`) request reject kar degi.

## Step 12: `MessagesRepository` Banaya (JSON File Based Fake DB)

`src/messages/messages.repository.ts` me ek repository class banayi jo `messages.json` file ko as a database use karti hai (`fs/promises` ke `readFile`/`writeFile` se):

- `findAll()` — sirf non-deleted (`isDeleted: false`) messages return karta hai, `created_at` ke hisaab se descending sort karke, aur response me sirf zaroori fields (`id`, `message`, `category`, `created_at`) bhejta hai
- `findById(id)` — id se ek message dhoondta hai (deleted messages exclude karke)
- `create(messageData)` — naya message file me push karta hai; id ke liye `crypto.randomUUID()` use kiya (pehle `messages.length + 1` tha jo duplicate ids de sakta tha agar messages delete hote)
- `update(id, messageData)` — existing message ke `message`/`category`/`updated_at` update karta hai
- `delete(id)` — hard delete ke bajaye soft delete karta hai (`isDeleted: true`, `deleted_at` set karta hai)

Har method try/catch me wrap kiya hai — file read/write ya JSON parse fail hone par raw error leak karne ke bajaye ek clean `Error` throw hota hai (aur `console.error` se log bhi ho jata hai).

## Step 13: `messages.json` Data File Add Ki

Root me `messages.json` file banayi jo repository ke liye seed data ka kaam karti hai — abhi ye ek fake "database" hai jise repository read/write karta hai.

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
- DTOs aur `class-validator` decorators (`@IsString`, `@IsNotEmpty`)
- `.http` files se API testing (REST Client)
- Controller me DTO ko route handler ke actual type ke roop me use karna
- File-based repository pattern (`fs/promises` se JSON file read/write)
- Soft delete pattern (`isDeleted` flag + `deleted_at` timestamp)
- `crypto.randomUUID()` se unique IDs generate karna
- Repository methods me try/catch se error handling
