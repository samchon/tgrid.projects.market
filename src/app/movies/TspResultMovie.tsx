import React from "react";
import mat = require("@material-ui/core");

import { TspSolver } from "../../utils/TspSolver";
import { TravelMovie } from "./TravelMovie";
import { StringUtil } from "../../utils/StringUtil";

export class TspResultMovie extends React.Component<TspResultMovie.IProps>
{
    private selected_solution_: TspSolver.ISolution | null = null;

    private _Select_solution(solution: TspSolver.ISolution): void
    {
        this.selected_solution_ = (this.selected_solution_ !== solution)
            ? solution
            : null;
        this.setState({});
    }

    public render(): JSX.Element
    {
        return <div>
            <h2 style={{ marginBottom: 0 }}> Result </h2>
            <hr style={{ borderWidth: 3 }} />
            <mat.Table size="small">
                <mat.TableHead>
                    <mat.TableCell> Supplier </mat.TableCell>
                    <mat.TableCell> Distance </mat.TableCell>
                    <mat.TableCell> Iterations </mat.TableCell>
                </mat.TableHead>
                { this.props.solutions.map(s => this._Render_solution(s)) }
            </mat.Table>
        </div>;
    }

    private _Render_solution(solution: TspResultMovie.IServantSolution): JSX.Element
    {
        if (solution.travel === null)
            return <mat.TableRow hover>
                <mat.TableCell> #{StringUtil.numberFormat(solution.uid)} </mat.TableCell>
                <mat.TableCell colSpan={2}> Failed </mat.TableCell>
            </mat.TableRow>;

        return <React.Fragment>
            <mat.TableRow hover 
                          onClick={this._Select_solution.bind(this, solution)}>
                <mat.TableCell> #{StringUtil.numberFormat(solution.uid)} </mat.TableCell>
                <mat.TableCell> 
                    {StringUtil.numberFormat(TspSolver.computeDistance(solution.travel))} 
                </mat.TableCell>
                <mat.TableCell> {StringUtil.numberFormat(solution.iterations)} </mat.TableCell>
            </mat.TableRow>
            <mat.TableRow>
                <mat.TableCell colSpan={3}
                               style={{ paddingTop: 0, paddingBottom: 0 }}>
                    <mat.Collapse in={this.selected_solution_ === solution}>
                        <TravelMovie solution={solution} />
                    </mat.Collapse>
                </mat.TableCell>
            </mat.TableRow>
        </React.Fragment>;
    }
}

export namespace TspResultMovie
{
    export interface IProps
    {
        solutions: IServantSolution[];
    }

    export interface IServantSolution extends TspSolver.ISolution
    {
        uid: number;
    }
}