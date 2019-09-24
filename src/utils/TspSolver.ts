import { Driver } from "tgrid/components/Driver";
import { Factorial } from "number-of-cases";

import { IPair } from "tstl/utility/IPair";
import { IPoint } from "./IPoint";
import { Queue } from "tstl/container/Queue";

export class TspSolver
{
    private branches_!: IPoint[];
    private factorial_!: Factorial;

    public assign(branches: IPoint[]): void
    {
        this.branches_ = branches;
        this.factorial_ = new Factorial(branches.length);
    }

    public solve(first: number = 0, last: number = this.factorial_.size()): IPoint[]
    {
        let ret!: IPoint[];
        let distance: number = Number.MAX_SAFE_INTEGER;

        for (let i: number = first; i < last; ++i)
        {
            let indexes: number[] = this.factorial_.at(i);
            let travel: IPoint[] = [];

            for (let idx of indexes)
                travel.push(this.branches_[idx]);

            let myDistance: number = TspSolver.computeDistance(travel);
            if (myDistance < distance)
            {
                ret = travel;
                distance = myDistance;
            }
        }
        return ret;
    }
}

export namespace TspSolver
{
    /* ----------------------------------------------------------------
        COMPUTATIONS
    ---------------------------------------------------------------- */
    export function computeDistance(travel: IPoint[]): number
    {
        let ret: number = 0.0;
        for (let i: number = 1; i < travel.length; ++i)
        {
            let distance: number = Math.pow(travel[i].x - travel[i-1].x, 2);
            distance += Math.pow(travel[i].y - travel[i-1].y, 2);
            distance = Math.sqrt(distance);

            ret += distance;
        }
        return ret;
    }

    export function computeBest(travels: IPoint[][]): IPair<IPoint[], number>
    {
        let ret: IPair<IPoint[], number> = { first: null!, second: 0! };
        for (let elem of travels)
        {
            let distance: number = computeDistance(elem);
            if (ret.first === null || ret.second > distance)
            {
                ret.first = elem;
                ret.second = distance;
            }
        }
        return ret;
    }

    /* ----------------------------------------------------------------
        GRID COMPUTING
    ---------------------------------------------------------------- */
    export async function parallize(branches: IPoint[], workers: IWorker[]): Promise<ISolution[]>
    {
        // DIVIDING PARAMS
        let ret: ISolution[] = new Array(workers.length + 1);
        let size: number = new Factorial(branches.length).size();
        let first: number = 0;

        // LATCH FOR JOINING
        let latch: Promise<void>[] = [];
        
        //----
        // DISTRIBUTE COMPUTATIONS
        //----
        for (let i: number = 0; i < workers.length; ++i)
        {
            // ASSETS
            let p: IWorker = workers[i];
            let driver: Driver<TspSolver> = p.getDriver<TspSolver>();

            let myTime: number = Date.now();
            let piece: number = i === (workers.length - 1)
                ? size - first
                : Math.floor(size / workers.length);

            // SOLVER
            let solution: ISolution = { iterations: piece, travel: null!, elapsedTime: 0 };
            ret[i] = solution;

            // PARALLEL PROCESS
            let func = async () =>
            {
                await driver.assign(branches);

                // ASSIGN RESULT
                solution.travel = await driver.solve(first, first + piece);
                solution.elapsedTime = Date.now() - myTime;

                // CLOSER
                await p.close();
            };
            latch.push(func());

            // TO THE NEXT STEP
            first += piece;
        }

        await Promise.all(latch);
        return ret;
    }

    export async function distribute(branches: IPoint[], workers: IWorker[]): Promise<ISolution[]>
    {
        // PREPARE PIECES
        let size: number = new Factorial(branches.length).size();
        let queue: Queue<IPair<number, number>> = new Queue();

        for (let first: number = 0; first < size; first += UNIT)
        {
            let last: number = Math.min(first + UNIT, size);
            queue.push({ first: first, second: last });
        }

        // DISTRIBUTE PIECES
        let latch: Promise<void>[] = [];
        let ret: ISolution[] = new Array(workers.length);

        for (let i: number = 0; i < workers.length; ++i)
        {
            let func = async () =>
            {
                let solution = await _Distribute(branches, queue, workers[i]);
                ret[i] = solution;
            };
            latch.push(func());
        }

        // LAZY RETURNS
        await Promise.all(latch);
        return ret;
    }

    async function _Distribute(branches: IPoint[], queue: Queue<IPair<number, number>>, worker: IWorker): Promise<ISolution>
    {
        let driver: Driver<TspSolver> = worker.getDriver<TspSolver>();

        let time: number = Date.now();
        let distance: number = Number.MAX_SAFE_INTEGER;
        let ret: ISolution =
        {
            travel: null,
            iterations: 0,
            elapsedTime: 0
        };

        try
        {
            await driver.assign(branches);
            while (queue.empty() === false)
            {
                let piece: IPair<number, number> = queue.front();
                queue.pop();

                try
                {
                    let travel: IPoint[] = await driver.solve(piece.first, piece.second);
                    let myDistance: number = computeDistance(travel);

                    if (myDistance < distance)
                    {
                        distance = myDistance;
                        ret.travel = travel;
                    }
                    ret.iterations += piece.second - piece.first;
                }
                catch (error)
                {
                    queue.push(piece);
                    throw error;
                }
            }
        }
        catch {}

        // RETURNS WITH TIMER
        ret.elapsedTime = Date.now() - time;
        return ret;
    }

    /* ----------------------------------------------------------------
        DEFINITIONS
    ---------------------------------------------------------------- */
    export interface IWorker
    {
        getDriver<Controller extends object>(): Driver<Controller>;
        close(): Promise<void>;
    }

    export interface ISolution
    {
        travel: IPoint[] | null;
        iterations: number;
        elapsedTime: number;
    }

    export const UNIT = 10000;
}