// NestFactory ka use Nest application ka instance create karne ke liye hota hai (bootstrap process me)
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

// bootstrap function - ye Nest application ko start (initialize) karta hai.
// async isliye hai kyunki app create aur listen dono asynchronous operations hain
async function bootstrap(){
    // NestFactory.create() AppModule ko root module maan kar
    // pura Nest application instance banata hai (dependency injection, routes, etc. setup karta hai)
    const app = await NestFactory.create(AppModule);

    // app.listen(3000) - application ko port 3000 pe HTTP requests
    // sunne (listen karne) ke liye start karta hai
    await app.listen(3000);
}

// bootstrap function ko call kar rahe hain taaki application actually run ho jaye
bootstrap();