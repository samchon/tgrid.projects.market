import React from "react";
import mat = require("@material-ui/core");

import { Factorial } from "number-of-cases";
import { StringUtil } from "../../utils/StringUtil";

export class TspInputMovie extends React.Component<TspInputMovie.IProps>
{
    private _Handle_input(key: keyof TspInputMovie.IParameters, event: React.ChangeEvent<HTMLInputElement>): void
    {
        this.props.parameters[key] = Number(event.target.value);
        this.setState({});
    }

    public render(): JSX.Element
    {
        let parameters: TspInputMovie.IParameters = this.props.parameters;
        let size: number = new Factorial(parameters.factorial).size();

        return <div>
            <h2 style={{ marginBottom: 0 }}> Parameters </h2>
            <hr style={{ borderWidth: 3 }} />
            <div style={{ padding: 15, paddingRight: 0 }}>
                <mat.TextField type="number" 
                               label="Number of Branches (N!)"
                               fullWidth
                               onChange={this._Handle_input.bind(this, "factorial")}
                               defaultValue={parameters.factorial} />
                <br/><br/>
                <mat.TextField type="number"
                               label="Number of Servants (/S)"
                               fullWidth
                               onChange={this._Handle_input.bind(this, "servants")}
                               defaultValue={parameters.servants} />
            </div>
            <br/><br/>
            <div style={{ textAlign: "right" }}>
                <p>
                    Total Iterations: {StringUtil.numberFormat(size)} <br/>
                    Each Servant's Iterations: {StringUtil.numberFormat(size / parameters.servants)}
                </p>
                <mat.Button variant="contained" 
                            onClick={this.props.solver}> 
                    Solve 
                </mat.Button>
            </div>
        </div>;
    }
}

export namespace TspInputMovie
{
    export interface IProps
    {
        parameters: IParameters;
        solver: () => Promise<void>;
    }

    export interface IParameters
    {
        factorial: number;
        servants: number;
    }
}