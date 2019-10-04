import { Market } from "../core/market/Market";
import { Global } from "../Global";

async function main(): Promise<void>
{
    let market: Market = new Market();
    await market.open(Global.PORT);
}
main();

global.process.on("unhandledRejection", reason =>
{
    console.log(reason);
    global.process.exit(-1);
});