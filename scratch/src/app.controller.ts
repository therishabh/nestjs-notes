import { Controller, Get, Param } from "@nestjs/common";

// @Controller() decorator - iske bina Nest is class ko controller nahi manega.
// Yaha koi path prefix nahi diya (empty), matlab ye root ('/') path handle karega
@Controller()
export class AppController {

    // @Get() decorator - is method ko GET request se map kar raha hai.
    // Koi path nahi diya, isliye ye "/" (root URL) ke GET request ko handle karega
    @Get()
    getRootRoute() {
        return "Hello, World!";
    }

    @Get('/bye')
    getByeRoute() {
        return "Goodbye, World!";
    }

    // Naya route: @Get(':id') - yaha ':id' ek route parameter (dynamic segment) hai.
    // Matlab URL me "/" ke baad jo bhi value aayegi (jaise /5, /abc), wo "id" ke naam se
    // capture ho jayegi. Path pattern ban jata hai: "/:id"
    @Get(':abcd')
    getRouteWithParam(
        // @Param('id') decorator us dynamic ':id' segment ki actual value ko
        // is "id" argument me inject kar deta hai. Agar bracket me naam na dete
        // (sirf @Param()), to poore params object (saare route params) mil jate
        @Param('abcd') id: string
    ) {
        console.log(`Route param id: ${id}`); // Server console pe log kar rahe hain
        // Example: agar request "/42" pe aayi, to id yaha "42" hoga
        return `Aap ne route param me ye id bheji hai: ${id}`;
    }
}