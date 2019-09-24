// WORKERS
import { WorkerConnector } from "tgrid/protocols/workers";
import { TspSolver } from "../../utils/TspSolver";
import { Driver } from "tgrid/components/Driver";

// GRID
import { Consumer } from "../../core/consumer/Consumer";
import { Servant } from "../../core/consumer/Servant";
import { ISupplier } from "../../core/supplier/ISupplier";

// COMMON FEATURES
import { ILocation } from "./internal/ILocation";
import { IParallel } from "./internal/IParallel";
import { Factorial } from "number-of-cases";

import * as fs from "fs";
import { randint } from "tstl/algorithm/random";

const BRANCH_COUNT = 11;
const WORKER_COUNT = 4;
const PATH = __dirname + "/../../../assets/js/tsp-servant.min.js";

export function _Solve_in_single(branches: ILocation[]): void
{
    console.log("TSP Solver in Single Computer:");

    let solver: TspSolver=  new TspSolver();
    solver.assign(branches);

    let time: number = Date.now();
    let solution: ILocation[] = solver.solve();
    let distance: number = TspSolver.computeDistance(solution);

    console.log(`   Total: ${distance} km, ${Date.now() - time} ms`);
}

async function _Solve_parallel(branches: ILocation[], parallel: IParallel[], close: boolean = true, time: number = Date.now()): Promise<void>
{
    // SOLUTION & DIVIDING PARAMS
    let solution: ILocation[] | null = null;
    let size: number = new Factorial(BRANCH_COUNT).size();
    let first: number = 0;
    
    // LATCH FOR JOINING
    let promises: Promise<void>[] = [];

    //----
    // DISTRIBUTE COMPUTATIONS
    //----
    for (let i: number = 0; i < parallel.length; ++i)
    {
        let p: IParallel = parallel[i];
        let driver: Driver<TspSolver> = p.getDriver<TspSolver>();

        let myTime: number = Date.now();
        let piece: number = i === (parallel.length - 1)
            ? size - first
            : Math.floor(size / parallel.length);
        
        // PARALLEL PROCESS
        let func: () => Promise<void> = async () =>
        {
            await driver.assign(branches);
            let ret = await driver.solve(first, first + piece);

            let distance: number = TspSolver.computeDistance(ret);
            if (solution === null || distance < TspSolver.computeDistance(solution))
                solution = ret;
            
            console.log(`   ${i+1}. ${distance} km, ${Date.now() - myTime} ms`);
            
            if (close)
                await p.close();
        };
        promises.push(func());

        // TO THE NEXT STEP
        first += piece;
    }

    await Promise.all(promises);
    console.log(`   Total: ${TspSolver.computeDistance(solution!)} km, ${Date.now() - time} ms`);
}

export async function _Solve_in_workers(branches: ILocation[]): Promise<void>
{
    console.log("TSP Solver in TGrid Workers:");
    
    // WORKERS
    let workers: WorkerConnector[] = [];
    let script: string = fs.readFileSync(PATH, "utf8");
    
    for (let i: number = 0; i < WORKER_COUNT; ++i)
    {
        let w: WorkerConnector = new WorkerConnector();
        await w.compile(script);
        
        workers.push(w);
    }

    // PARALLEL COMPUTATIONS
    await _Solve_parallel(branches, workers);
}

export async function _Solve_in_grid(branches: ILocation[]): Promise<void>
{
    console.log("TSP Solver in Grid Computing.");

    let consumer: Consumer = await Consumer.participate("http://127.0.0.1:10101/consumer");
    let suppliers: ISupplier[] = await consumer.getSuppliers();

    let servants: Servant[] = [];
    let script: string = fs.readFileSync(PATH, "utf8");

    for (let supp of suppliers)
    {
        let serv: Servant | null = await consumer.buyResource(supp);
        if (serv === null)
            continue;
            
        await serv.compile(null, script);
        servants.push(serv);

        if (servants.length === WORKER_COUNT)
            break;
    }

    await _Solve_parallel(branches, servants, false);

    console.log("TSP Solver in Grid Computing with distribution.");
    let time: number = Date.now();

    await TspSolver.distribute(branches, servants);
    console.log(`    Elapsed time: ${Date.now() - time} ms`);

    await consumer.leave();
}

export async function test_tsp(): Promise<void>
{
    // PREPARE BRANCHES
    let branches: ILocation[] = [];

    for (let i: number = 0; i < BRANCH_COUNT; ++i)
        branches.push(
        {
            y: randint(0, 100),
            x: randint(0, 100)
        });

    // SOLVE TSP IN SIGNLE & GRID
    await _Solve_in_single(branches);
    await _Solve_in_workers(branches);
    await _Solve_in_grid(branches);
}
test_tsp();