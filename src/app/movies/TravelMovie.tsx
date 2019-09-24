import * as React from "react";

import { TspSolver } from "../../utils/TspSolver";
import { StringUtil } from "../../utils/StringUtil";

export class TravelMovie extends React.Component<TravelMovie.IProps>
{
    public render(): JSX.Element
    {
        let solution = this.props.solution;

        return <div>
        {solution.travel ? 
            <svg width={100 * TravelMovie.MAGNIFIER + 2 * TravelMovie.MARGIN} 
                 height={100 * TravelMovie.MAGNIFIER + 2 * TravelMovie.MARGIN}>
                <polyline fill="none"
                          stroke="black" 
                          points={solution.travel.map(p => (p.x * TravelMovie.MAGNIFIER + TravelMovie.MARGIN) + "," + (p.y * TravelMovie.MAGNIFIER + TravelMovie.MARGIN)).join(" ")} />
                {solution.travel.map((p, index) =>
                    <React.Fragment>
                        <circle cx={p.x * TravelMovie.MAGNIFIER + TravelMovie.MARGIN} 
                                cy={p.y * TravelMovie.MAGNIFIER + TravelMovie.MARGIN} 
                                r={3 * TravelMovie.MAGNIFIER} 
                                fill="white" stroke="red" />
                        <text x={p.x * TravelMovie.MAGNIFIER + TravelMovie.MARGIN}
                              y={p.y * TravelMovie.MAGNIFIER + 1.5 * TravelMovie.MAGNIFIER + TravelMovie.MARGIN}
                              textAnchor="middle"> 
                            {index + 1} 
                        </text>
                    </React.Fragment>
                )}
            </svg> : null
        }
            <ul>
                <li> Servant: Supplier #{this.props.servant.uid} </li>
                <li> Iterations: #{StringUtil.numberFormat(solution.iterations)} </li>
                <li> Distance: 
                {solution.travel
                    ? StringUtil.numberFormat(TspSolver.computeDistance(solution.travel)) + " km"
                    : "Disconnected"
                }
                </li>
                <li> Elapsed time: {StringUtil.numberFormat(solution.elapsedTime)} ms </li>
            </ul>
        </div>;
    }
}

export namespace TravelMovie
{
    export interface IProps
    {
        solution: TspSolver.ISolution;
        servant: { uid: number };
    }

    export const MARGIN: number = 10;
    export const MAGNIFIER: number = 3;
}