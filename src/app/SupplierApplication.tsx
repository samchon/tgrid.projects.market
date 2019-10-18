import "./polyfill";
import React from "react";
import ReactDOM from "react-dom";
import mat = require("@material-ui/core");

import MenuBookIcon from "@material-ui/icons/MenuBook";
import GitHubIcon from "@material-ui/icons/Github";

import { DateUtil } from "../utils/DateUtil";
import { StringUtil } from "../utils/StringUtil";

import { Supplier } from "../core/supplier/Supplier";
import { Global } from "../Global";

class SupplierApplication extends React.Component<IProps>
{
    private histories_: IHistory[];

    /* ----------------------------------------------------------------
        CONSTRUCTORS
    ---------------------------------------------------------------- */
    public constructor(props: IProps)
    {
        // ASSIGN MEMBERS
        super(props);
        this.histories_ = [];

        // EVENTS FROM THE SUPPLIER
        props.supplier.on("assign", uid => this._Insert_history({
            uid: uid,
            type: "assign"
        }));
        props.supplier.on("compile", (uid, code) => this._Insert_history({
            uid: uid,
            type: "compile",
            length: code.length
        }));
        props.supplier.on("close", uid => this._Insert_history({
            uid: uid,
            type: "close"
        }))
    }

    public componentDidUpdate()
    {
        document.body.scrollTop = document.body.scrollHeight - document.body.clientHeight;
    }

    /* ----------------------------------------------------------------
        EVENT HANDLERS
    ---------------------------------------------------------------- */
    private _Insert_history(history: Omit<IHistory, "created_at">): void
    {
        (history as IHistory).created_at = new Date();
        this.histories_.push(history as IHistory);

        this.setState({});
    }
    
    private _Open_link(url: string): void
    {
        window.open(url, "_blank");
    }

    /* ----------------------------------------------------------------
        RENDERERS
    ---------------------------------------------------------------- */
    public render(): JSX.Element
    {
        return <React.Fragment>
            <mat.AppBar>
                <mat.Toolbar>
                    <mat.Typography> 
                        Market > Supplier 
                        #{StringUtil.numberFormat(this.props.supplier.uid)}
                    </mat.Typography>
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
                { this._Render_histories() }
            </div>
        </React.Fragment>;
    }

    private _Render_histories(): JSX.Element
    {
        return <mat.Table size="small">
            <mat.TableHead>
                <mat.TableRow>
                    <mat.TableCell> Consumer </mat.TableCell>
                    <mat.TableCell> Type </mat.TableCell>
                    <mat.TableCell> Time </mat.TableCell>
                </mat.TableRow>
            </mat.TableHead>
            <mat.TableBody>
            {this.histories_.map(history => 
                <mat.TableRow hover>
                    <mat.TableCell> #{StringUtil.numberFormat(history.uid)} </mat.TableCell>
                    <mat.TableCell> {history.type} </mat.TableCell>
                    <mat.TableCell> 
                        { DateUtil.to_string(history.created_at, true, true) }
                    </mat.TableCell>
                </mat.TableRow>
            )}
            </mat.TableBody>
        </mat.Table>;
    }
}

interface IProps
{
    supplier: Supplier;
}
interface IHistory
{
    uid: number;
    type: string;
    created_at: Date;
    length?: number;
}

window.onload = async function ()
{
    let supplier: Supplier = await Supplier.participate(Global.url("/supplier"));
    ReactDOM.render(<SupplierApplication supplier={supplier} />, document.body);
};