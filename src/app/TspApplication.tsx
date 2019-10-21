import "./polyfill";
import React from "react";
import ReactDOM from "react-dom";
import mat = require("@material-ui/core");

import MenuBookIcon from "@material-ui/icons/MenuBook";
import GitHubIcon from "@material-ui/icons/Github";

import { IPointer } from "tstl/functional/IPointer";
import { randint, sort } from "tstl/algorithm";
import { sleep_for } from "tstl/thread/global";
import { begin, end } from "tstl/iterator/factory";

import { Global } from "../Global";
import { ReactUtil } from "../utils/ReactUtil";

import { IPoint } from "../utils/IPoint";
import { Consumer } from "../core/consumer/Consumer";
import { Servant } from "../core/consumer/Servant";
import { TspSolver } from "../utils/TspSolver";

import { TspInputMovie } from "./movies/TspInputMovie";
import { TspProgressMovie } from "./movies/TspProgressMovie";
import { TspResultMovie } from "./movies/TspResultMovie";
import { Factorial } from "number-of-cases";

export class TspApplication extends React.Component
{
    private input_: TspInputMovie.IParameters = {
        factorial: 11,
        servants: 4
    };

    private _Open_link(url: string): void
    {
        window.open(url, "_blank");
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
            branches.push({
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
            alert("No idle servant in the market.");
            return;
        }

        //----
        // SOLVE PARALLEL
        //----
        let time: number = Date.now();
        let complete: boolean = false;
        let countPtr: IPointer<number> = { value: 0 };
        let total: number = new Factorial(this.input_.factorial).size();

        (async () =>
        {
            while (complete === false)
            {
                await ReactUtil.render
                (
                    <TspProgressMovie servants={servants.length}
                                      complete={countPtr.value}
                                      total={total}
                                      time={Date.now() - time} />,
                    document.getElementById("result_div")!
                );
                await sleep_for(25);
            }
        })();

        // DO SOLVE
        let solutions: TspSolver.ISolution[] = await TspSolver.distribute(branches, servants, countPtr);
        let pairs: TspResultMovie.IServantSolution[] = servants.map((serv, idx) =>
        ({
            uid: serv.uid,
            ...solutions[idx]
        }));

        sort(begin(pairs), end(pairs), (x, y) =>
        {
            if (x.travel === null)
                return false;
            else if (y.travel === null)
                return true;
            else
                return TspSolver.computeDistance(x.travel) < TspSolver.computeDistance(y.travel);
        });

        complete = true;
        await consumer.leave();

        // PRINT RESULT
        await ReactUtil.render(<TspResultMovie solutions={pairs} />, document.getElementById("result_div")!);
    }

    /* ----------------------------------------------------------------
        RENDERERS
    ---------------------------------------------------------------- */
    public render(): JSX.Element
    {
        return <React.Fragment>
            <mat.AppBar>
                <mat.Toolbar>
                    <mat.Typography> Market > Consumer </mat.Typography>
                    <div style={{ flexGrow: 1 }} />
                    <mat.IconButton color="inherit"
                                    onClick={this._Open_link.bind(this, Global.BOOK)}>
                        <MenuBookIcon />
                    </mat.IconButton>
                    <mat.IconButton color="inherit"
                                    onClick={this._Open_link.bind(this, Global.GITHIB)}>
                        <GitHubIcon />
                    </mat.IconButton>
                </mat.Toolbar>
            </mat.AppBar>
            <div style={{ padding: 10, paddingTop: 50 }}>
                <TspInputMovie parameters={this.input_}
                               solver={this.solve.bind(this)} />
                <br/>
                <div id="result_div" />
            </div>
        </React.Fragment>;
    }
}

window.onload = function ()
{
    ReactDOM.render(<TspApplication />, document.body);
}