import React from "react";
import mat = require("@material-ui/core");

import { StringUtil } from "../../utils/StringUtil";

export class TspProgressMovie extends React.Component<TspProgressMovie.IProps>
{
    public render(): JSX.Element
    {
        let props: TspProgressMovie.IProps = this.props;
        let ratio: number = props.complete / props.total;
        let leftTime: number = props.time / ratio - props.time;

        return <div>
            <h2> Computing... </h2>
            <div>
                <ul>
                    <li> Number of servants: {props.servants} </li>
                    <li> Elapsed time: {StringUtil.numberFormat(props.time)} ms </li>
                    <li> Left time: about {StringUtil.numberFormat(leftTime)} ms </li>
                </ul>
                <mat.LinearProgress variant="determinate"
                                    style={{height: 10}}
                                    value={ratio * 100} />
                <p style={{ textAlign: "right" }}> 
                    {StringUtil.percentFormat(ratio)} 
                </p>
            </div>
        </div>;
    }
}

export namespace TspProgressMovie
{
    export interface IProps
    {
        servants: number;
        complete: number;
        total: number;
        time: number;
    }
}