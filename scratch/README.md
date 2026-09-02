# NestJS Scratch Project

Ye ek learning/practice project hai jisme NestJS ke basic concepts step by step explore kiye gaye hain — bina Nest CLI use kiye, manually setup karke.

## Step 1: Project Setup

`npm init` se ek plain Node.js project (`package.json`) banaya, aur zaroori NestJS dependencies manually install ki:

```bash
npm install @nestjs/common @nestjs/core @nestjs/platform-express reflect-metadata typescript
```

- `@nestjs/core` — Nest ka core framework (app bootstrap, DI container, etc.)
- `@nestjs/common` — decorators aur common utilities (`@Module`, `@Controller`, `@Get`, etc.)
- `@nestjs/platform-express` — Express ko underlying HTTP server ke roop me use karne ke liye
- `reflect-metadata` — decorators ke metadata (dependency injection) ke liye zaroori
- `typescript` — TypeScript compiler

## Step 2: TypeScript Configuration

`tsconfig.json` banaya jisme decorators enable kiye, kyunki NestJS heavily decorators (`@Module`, `@Controller`, etc.) pe based hai:

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "es2017",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

## Step 3: Root Module (`app.module.ts`)

`AppModule` banaya — har Nest app me kam se kam ek root module hona chahiye. `@Module()` decorator se `AppController` ko is module me register kiya.

## Step 4: Controller aur Routes (`app.controller.ts`)

`AppController` banaya `@Controller()` decorator ke saath (koi prefix nahi diya, isliye root `/` path handle karta hai). Isme teen routes banaye:

1. **`GET /`** — `"Hello, World!"` return karta hai
2. **`GET /bye`** — `"Goodbye, World!"` return karta hai
3. **`GET /:abcd`** — Dynamic route parameter ka example. `@Param('abcd')` decorator se URL me diya gaya dynamic segment (jaise `/42`) capture kiya aur response me wapas bheja.

## Step 5: Bootstrap File (`main.ts`)

`bootstrap()` async function banaya jo:
1. `NestFactory.create(AppModule)` se Nest application ka instance banata hai (root module se DI, routes, sab kuch setup hota hai)
2. `app.listen(3000)` se application ko port `3000` pe start karta hai

## Kaise Run Kare

```bash
npm install
npx tsc src/*.ts --outDir dist --experimentalDecorators --emitDecoratorMetadata --module commonjs --target es2017
node dist/main.js
```

Fir browser/Postman me test kare:
- `http://localhost:3000/` → `Hello, World!`
- `http://localhost:3000/bye` → `Goodbye, World!`
- `http://localhost:3000/42` → `Aap ne route param me ye id bheji hai: 42`

## Concepts Cover Kiye Gaye

- Nest application bootstrap process
- Modules (`@Module`)
- Controllers (`@Controller`)
- Routing decorators (`@Get`)
- Route parameters (`@Param`)
- Manual (non-CLI) NestJS project setup
