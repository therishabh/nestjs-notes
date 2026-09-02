import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";

// @Module() decorator - is class ko Nest module banata hai.
// Module Nest application ka basic building block hai - har app me kam se kam
// ek root module hona chahiye
@Module({
    controllers: [AppController]
})
export class AppModule {}