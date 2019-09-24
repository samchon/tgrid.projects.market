import * as React from "react";

import { TspSolver } from "../../utils/TspSolver";
import { TravelMovie } from "./TravelMovie";

export class TspResultMovie extends React.Component<TspResultMovie.IProps>
{
    public render(): JSX.Element
    {
        console.log(this.props);

        return <React.Fragment>
        {this.props.solutions.map((solution, index) =>
            <TravelMovie solution={solution} 
                         servant={this.props.servants[index]} />
        )}
        </React.Fragment>
    }
}

export namespace TspResultMovie
{
    export interface IProps
    {
        servants: { uid: number }[];
        solutions: TspSolver.ISolution[];
    }
}