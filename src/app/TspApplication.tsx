import "./polyfill";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { randint } from "tstl/algorithm";
import { sleep_for } from "tstl/thread";

import { Global } from "../Global";

import { IPoint } from "../utils/IPoint";
import { Consumer } from "../core/consumer/Consumer";
import { Servant } from "../core/consumer/Servant";
import { TspSolver } from "../utils/TspSolver";

import { TspInputMovie } from "./movies/TspInputMovie";
import { TspResultMovie } from "./movies/TspResultMovie";
import { ReactUtil } from "../utils/ReactUtil";
import { StringUtil } from "../utils/StringUtil";

export class TspApplication extends React.Component
{
    private input_: TspInputMovie.IParameters;

    /* ----------------------------------------------------------------
        CONSTRUCTORS
    ---------------------------------------------------------------- */
    public constructor()
    {
        super({});

        this.input_ = { factorial: 10, servants: 4 };
    }

    public static main(): void
    {
        ReactDOM.render(<TspApplication />, document.body);
    }

    /* ----------------------------------------------------------------
        SOLVERS
    ---------------------------------------------------------------- */
    public async solve(): Promise<void>
    {
        //----
        // PREPARE ASSETS
        //----
        // RANDOM BRANCHES
        let branches: IPoint[] = [];
        for (let i: number = 0; i < this.input_.factorial; ++i)
            branches.push(
            {
                y: randint(0, 100),
                x: randint(0, 100)
            });

        // MOUNT ASSETS   
        let script: string = await(await fetch
        (
            "assets/js/tsp-servant.min.js", 
            { method: "GET" })
        ).text();
        let url: string = `ws://${window.location.hostname}:${Global.PORT}/consumer`;

        // FETCH SERVANTS
        let consumer: Consumer = await Consumer.participate(url);
        let servants: Servant[] = [];

        for (let supp of await consumer.getSuppliers())
        {
            let serv: Servant | null = await consumer.buyResource(supp);
            if (serv === null)
                continue;

            await serv.compile(null, script);
            servants.push(serv);

            if (servants.length === this.input_.servants)
                break;
        }
        
        // EXCEPTION - NO SERVANT
        if (servants.length === 0)
        {
            await consumer.leave();
            await ReactUtil.render(
                <React.Fragment>
                    <h2> Error </h2>
                    No servant to assign.
                </React.Fragment>,
                document.getElementById("result_div")!
            );
            return;
        }

        //----
        // SOLVE PARALLEL
        //----
        let time: number = Date.now();
        let complete: boolean = false;

        // SHOW PROGRESS
        await ReactUtil.render
        (
            <React.Fragment>
                <h2> Comupting... </h2>
                <ul>
                    <li> Number of assigned servants: #{servants.length} </li>
                    <li id="elapsed_time_li"> Elapsed time </li>
                </ul>
            </React.Fragment>,
            document.getElementById("result_div")!
        );

        (async () =>
        {
            let element: HTMLElement = document.getElementById("elapsed_time_li")!;
            while (complete === false)
            {
                await sleep_for(10);

                let elapsedTime: number = Date.now() - time;
                element.innerHTML = StringUtil.numberFormat(elapsedTime) + " ms";
            }
        })();

        // DO SOLVE
        let solutions: TspSolver.ISolution[] = await TspSolver.distribute(branches, servants);
        complete = true;

        await consumer.leave();

        // PRINT RESULT
        ReactDOM.render(
            <TspResultMovie servants={servants} 
                            solutions={solutions} />, 
            document.getElementById("result_div")
        );
    }

    /* ----------------------------------------------------------------
        RENDERERS
    ---------------------------------------------------------------- */
    public render(): JSX.Element
    {
        return <div>
            <h1> Grid Coin Example - TSP Solver </h1>
            <TspInputMovie parameters={this.input_} />
            <button onClick={this.solve.bind(this)}> Solve </button>

            <div id="result_div">

            </div>
        </div>;
    }
}

window.onload = TspApplication.main;