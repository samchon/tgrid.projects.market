import "./polyfill";
import React from "react";
import ReactDOM from "react-dom";
import mat = require("@material-ui/core");

import MenuBookIcon from "@material-ui/icons/MenuBook";
import GitHubIcon from "@material-ui/icons/Github";

import { randint } from "tstl/algorithm/random";
import { StringUtil } from "../utils/StringUtil";

import { Monitor } from "../core/monitor/Monitor";
import { SupplierNode } from "../core/monitor/SupplierNode";
import { ConsumerNode } from "../core/monitor/ConsumerNode";
import { Global } from "../Global";
import { DateUtil } from "../utils/DateUtil";

class MonitorApplication extends React.Component<IProps>
{
    private selecte_consumer_: ConsumerNode | null;

    public constructor(props: IProps)
    {
        super(props);
        this.selecte_consumer_ = null;

        props.monitor.on("refresh", () => this.setState({}));
    }

    private _Open_link(url: string): void
    {
        window.open(url, "_blank");
    }

    private _Select_consumer(consumer: ConsumerNode): void
    {
        this.selecte_consumer_ = (this.selecte_consumer_ !== consumer)
            ? consumer
            : null;
        this.setState({});
    }

    /* ----------------------------------------------------------------
        RENDERERS
    ---------------------------------------------------------------- */
    public render(): JSX.Element
    {
        let monitor: Monitor = this.props.monitor;

        return <React.Fragment>
            <mat.AppBar>
                <mat.Toolbar>
                    <mat.Typography> Market > Monitor </mat.Typography>
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
            <div style={{ paddingTop: 75 }}>
                Number of participants
                <ul>
                    <li> Consumers: {monitor.getConsumers().size()} </li>
                    <li> Suppliers: {monitor.getSuppliers().size()} </li>
                </ul>
                <mat.Table size="small">
                    <mat.TableHead>
                        <mat.TableRow>
                            <mat.TableCell> Consumer </mat.TableCell>
                            <mat.TableCell> Suppliers </mat.TableCell>
                            <mat.TableCell> Participated </mat.TableCell>
                        </mat.TableRow>
                    </mat.TableHead>
                    <mat.TableBody>
                    {[...monitor.getConsumers()].map(it => 
                        this._Render_consumer(it.second)
                    )}
                    </mat.TableBody>
                </mat.Table>
            </div>
        </React.Fragment>;
    }

    private _Render_consumer(consumer: ConsumerNode): JSX.Element | null
    {
        if (consumer.servants.empty())
            return null;

        return <React.Fragment>
            <mat.TableRow hover 
                          onClick={this._Select_consumer.bind(this, consumer)}>
                <mat.TableCell> #{StringUtil.numberFormat(consumer.uid)} </mat.TableCell>
                <mat.TableCell align="right"> 
                    {StringUtil.numberFormat(consumer.servants.size())} 
                </mat.TableCell>
                <mat.TableCell>
                    {DateUtil.to_string(consumer.created_at, true, true)}
                </mat.TableCell>
            </mat.TableRow>
            <mat.TableRow>
                <mat.TableCell colSpan={3}
                               style={{ paddingTop: 0, paddingBottom: 0 }}>
                    <mat.Collapse in={this.selecte_consumer_ === consumer}>
                        { this._Render_servants([...consumer.servants].map(it => it.second)) }
                    </mat.Collapse>
                </mat.TableCell>
            </mat.TableRow>
        </React.Fragment>;
    }

    private _Render_servants(servants: SupplierNode[]): JSX.Element
    {
        return <React.Fragment>
            <h4> Assigned Suppliers </h4>
            <mat.Table size="small">
                <mat.TableHead>
                    <mat.TableRow>
                        <mat.TableCell> Supplier </mat.TableCell>
                        <mat.TableCell> Participated </mat.TableCell>
                        <mat.TableCell> Assigned </mat.TableCell>
                    </mat.TableRow>
                </mat.TableHead>
                <mat.TableBody>
                {servants.map(supplier => 
                    <mat.TableRow>
                        <mat.TableCell> #{StringUtil.numberFormat(supplier.uid)} </mat.TableCell>
                        <mat.TableCell> {DateUtil.to_string(supplier.created_at!, true, true)} </mat.TableCell>
                        <mat.TableCell> {DateUtil.to_string(supplier.assigned_at!, true, true)} </mat.TableCell>
                    </mat.TableRow>
                )}
                </mat.TableBody>
            </mat.Table>
        </React.Fragment>;
    }
}

interface IProps
{
    monitor: Monitor;
}

window.onload = async function ()
{
    let monitor: Monitor = await Monitor.participate(Global.url("/monitor"));

    // FAKE SYSTEMS
    if (window.location.href.indexOf("?fake") !== -1)
    {
        let sequence: number = 0;
        for (let i: number = 0; i < 8; ++i)
        {
            let consumer: ConsumerNode = new ConsumerNode({
                uid: --sequence,
                servants: [],
                created_at: new Date().toString()
            });
            let count: number = randint(0, 8);

            while (count-- > 0)
            {
                let supplier: SupplierNode = new SupplierNode({
                    uid: --sequence,
                    created_at: new Date().toString(),
                    assigned_at: null
                });
                supplier.assign(consumer);

                monitor.getSuppliers().emplace(supplier.uid, supplier);
                consumer.servants.emplace(supplier.uid, supplier);
            }
            monitor.getConsumers().emplace(consumer.uid, consumer);
        }
    }

    // DO RENDER
    ReactDOM.render(<MonitorApplication monitor={monitor} />, document.body);
}