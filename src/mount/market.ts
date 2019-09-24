import { Market } from "../core/market/Market";

async function main(): Promise<void>
{
    await Market.open(10101);
}
main();

global.process.on("unhandledRejection", reason =>
{
    console.log(reason);
    global.process.exit(-1);
});