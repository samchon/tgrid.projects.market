import "./polyfill";
import * as React from "react";
import * as ReactDOM from "react-dom";

import { HashMap } from "tstl/container/HashMap";
import { randint } from "tstl/algorithm";

import { Monitor } from "../core/monitor/Monitor";
import { ConsumerNode } from "../core/monitor/ConsumerNode";
import { SupplierNode } from "../core/monitor/SupplierNode";

import { ConsumerMovie } from "./movies/ConsumerMovie";

export class MonitorApplication extends React.Component<MonitorApplication.IProps>
{
    public render(): JSX.Element
    {
        let children: JSX.Element[] = [];
        let top: number = 0;

        for (let entry of this.props.consumers)
        {
            if (entry.second.servants.empty())
                continue;

            children.push(<ConsumerMovie consumer={entry.second} top={top} />);
            top += entry.second.servants.size() * ConsumerMovie.NODE_VERTICAL_GAP;
        }

        return <div>
            <h1> Grid Coin Monitor </h1>
            <ul>
                <li> Consumers: #{this.props.consumers.size()} </li>
                <li> Suppliers: #{this.props.suppliers.size()} </li>
            </ul>

            <svg width={ConsumerMovie.NODE_HORIZONTAL_GAP * 3} 
                 height={top}>
                <image xlinkHref={`assets/images/market.png`}
                       width={ConsumerMovie.NODE_SCALE} 
                       height={ConsumerMovie.NODE_SCALE} />
                <text textAnchor="middle"
                      fontSize={ConsumerMovie.FONT_SIZE}
                      x={ConsumerMovie.NODE_SCALE / 2}
                      y={ConsumerMovie.NODE_SCALE + 20}>
                    Market
                </text>
                { children }
            </svg>
        </div>;
    }
}

export namespace MonitorApplication
{
    export interface IProps
    {
        consumers: HashMap<number, ConsumerNode>;
        suppliers: HashMap<number, SupplierNode>;
    }

    export async function main(): Promise<void>
    {
        let url: string = "ws://" + window.location.hostname + ":10101/monitor";
        let monitor: Monitor = await Monitor.participate(url);

        _Render(monitor.getConsumers(), monitor.getSuppliers());
        monitor.on("refresh", () =>
        {
            _Render(monitor.getConsumers(), monitor.getSuppliers());
        });
    }

    export async function test(): Promise<void>
    {
        let sequence: number = 0;
        let consumerMap: HashMap<number, ConsumerNode> = new HashMap();
        let supplierMap: HashMap<number, SupplierNode> = new HashMap();

        for (let i: number = 0; i < 4; ++i)
        {
            let consumer: ConsumerNode = new ConsumerNode(++sequence);
            let count: number = randint(0, 5);

            while (count-- > 0)
            {
                let supplier: SupplierNode = new SupplierNode(++sequence);
                supplier.assign(consumer);

                supplierMap.emplace(supplier.uid, supplier);
                consumer.servants.emplace(supplier.uid, supplier);
            }
            consumerMap.emplace(consumer.uid, consumer);
        }

        _Render(consumerMap, supplierMap);;
    }

    /**
     * @hidden
     */
    function _Render(consumerMap: HashMap<number, ConsumerNode>, supplierMap: HashMap<number, SupplierNode>): void
    {
        ReactDOM.render
        (
            <MonitorApplication consumers={consumerMap} 
                                suppliers={supplierMap} />, 
            document.body
        );
    }
}

window.onload = () =>
{
    if (location.href.indexOf("?test") !== -1)
        MonitorApplication.test();
    else
        MonitorApplication.main();
}