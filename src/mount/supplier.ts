import { Supplier } from "../core/supplier/Supplier";

async function main(): Promise<void>
{
    await Supplier.participate("http://127.0.0.1:10101/supplier");
}
main();

global.process.on("unhandledRejection", reason =>
{
    console.log(reason);
    global.process.exit(-1);
});