import { Market } from "../core/market/Market";
import { Global } from "../Global";

async function main(): Promise<void>
{
    await Market.open(Global.PORT);
}
main();

global.process.on("unhandledRejection", reason =>
{
    console.log(reason);
    global.process.exit(-1);
});