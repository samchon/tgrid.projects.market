import { Supplier } from "../core/supplier/Supplier";
import { Global } from "../Global";

async function main(): Promise<void>
{
    await Supplier.participate(`http://127.0.0.1:${Global.PORT}/supplier`);
}
main();

global.process.on("unhandledRejection", reason =>
{
    console.log(reason);
    global.process.exit(-1);
});