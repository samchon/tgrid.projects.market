import * as React from"react";
import { IPoint } from "../../utils/IPoint";

import { ConsumerNode } from "../../core/monitor/ConsumerNode";
import { SupplierNode } from "../../core/monitor/SupplierNode";

export class ConsumerMovie extends React.Component<ConsumerMovie.IProps>
{
    public render(): JSX.Element
    {
        let consumer: ConsumerNode = this.props.consumer;
        let children: JSX.Element[] = [];

        let i: number = 0;
        for (let entry of consumer.servants)
            children.push(this._Render_supplier(entry.second, i++));

        let point: IPoint = { x: ConsumerMovie.NODE_HORIZONTAL_GAP, y: this.props.top };

        return <React.Fragment>
            {this._Render_connection(point)}
            <g transform={`translate(${point.x}, ${point.y})`}>
                {this._Render_node(consumer)}
                {children}
            </g>
        </React.Fragment>;
    }

    /**
     * @hidden
     */
    private _Render_supplier(supplier: SupplierNode, index: number): JSX.Element
    {
        let point: IPoint = { x: ConsumerMovie.NODE_HORIZONTAL_GAP, y: index * ConsumerMovie.NODE_VERTICAL_GAP };

        return <React.Fragment>
            {this._Render_connection(point)}
            <g transform={`translate(${point.x}, ${point.y})`}>
                {this._Render_node(supplier)}
            </g>
        </React.Fragment>;
    }

    /**
     * @hidden
     */
    private _Render_node(system: ConsumerNode | SupplierNode): JSX.Element
    {
        // PREPARE ASSETS
        let source: string;
        let name: string;

        if (system instanceof ConsumerNode)
        {
            source = "consumer";
            name = "Consumer";
        }
        else
        {
            source = "supplier";
            name = "Supplier";
        }

        // RENDERS
        return <React.Fragment>
            <image xlinkHref={`assets/images/${source}.png`}
                   width={ConsumerMovie.NODE_SCALE} 
                   height={ConsumerMovie.NODE_SCALE} />
            <text textAnchor="middle"
                  fontSize={ConsumerMovie.FONT_SIZE}
                  x={ConsumerMovie.NODE_SCALE / 2}
                  y={ConsumerMovie.NODE_SCALE + 20}>
                {`${name} #${system.uid}`}
            </text>
        </React.Fragment>;
    }

    /**
     * @hidden
     */
    private _Render_connection(to: IPoint): JSX.Element
    {
        let neoFrom: IPoint = { x: ConsumerMovie.NODE_SCALE * 1.25, y: ConsumerMovie.NODE_SCALE / 2 };
        let neoTo: IPoint = { x: to.x - ConsumerMovie.NODE_SCALE * .25, y: to.y + ConsumerMovie.NODE_SCALE / 2 };

        let middleX: number = (neoFrom.x + neoTo.x) / 2;
        let points: IPoint[] = 
        [
            neoFrom,
            { x: middleX, y: neoFrom.y },
            { x: middleX, y: neoTo.y },
            neoTo
        ];

        // DO RENDER
        return <React.Fragment>
            <polyline points={points.map(p => p.x + "," + p.y).join(" ")}
                      style={{ fill: "none", stroke: "black" }} />
            <circle cx={points[0].x} cy={points[0].y} r={3} fill="white" stroke="blue" />
            <circle cx={points[3].x} cy={points[3].y} r={3} fill="white" stroke="blue" />
        </React.Fragment>;
    }
}

export namespace ConsumerMovie
{
    export interface IProps
    {
        consumer: ConsumerNode;
        top: number;
    }

    export const NODE_SCALE: number = 50;
    export const FONT_SIZE: number = 12;
    export const NODE_HORIZONTAL_GAP: number = NODE_SCALE * 3;
    export const NODE_VERTICAL_GAP: number = NODE_SCALE * 2;
}