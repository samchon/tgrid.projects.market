import * as cp from "child_process";
import { sleep_for } from "tstl/thread/global";

async function main(): Promise<void>
{
    cp.fork(__dirname + "/market.js");
    await sleep_for(1000);

    for (let i: number = 0; i < 8; ++i)
        cp.fork(__dirname + "/supplier.js");
}
main();