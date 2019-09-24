import * as React from "react";
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
        let size: number = new Factorial(this.props.parameters.factorial).size();

        return <div>
            <h2> Parameters </h2>
            <ul>
                <li> Factoral: 
                    <input type="number" 
                           width={80}
                           onChange={this._Handle_input.bind(this, "factorial")}
                           defaultValue={this.props.parameters.factorial + ""} />
                    !: {StringUtil.numberFormat(size)}
                </li>
                <li> Number of Servants:   
                    <input type="number"
                           width={80}
                           onChange={this._Handle_input.bind(this, "servants")}
                           defaultValue={this.props.parameters.servants + ""} />
                </li>
            </ul>
        </div>;
    }
}

export namespace TspInputMovie
{
    export interface IProps
    {
        parameters: IParameters;
    }

    export interface IParameters
    {
        factorial: number;
        servants: number;
    }
}