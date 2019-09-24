import "./polyfill";

import { Supplier } from "../core/supplier/Supplier";
import { StringUtil } from "../utils/StringUtil";

const TAB = "&nbsp;&nbsp;&nbsp;&nbsp;";
var CONSOLE_BOX!: HTMLDivElement;

function trace(...args: any[]): void
{
    let str: string = "";
    for (let elem of args)
        str += elem + " ";
    
    CONSOLE_BOX.innerHTML += str + "<br/>\n";
}

async function main(): Promise<void>
{
    let url: string = "ws://" + window.location.hostname + ":10101/supplier";
    let supp: Supplier =  await Supplier.participate(url);
    let time: number;

    CONSOLE_BOX = document.getElementById("consoleBox") as HTMLDivElement;
    
    //----
    // TRACE EVENTS
    //----
    // PRINT TITLE
    trace("Connection to market has succeded. Your uid is", supp.uid);
    trace();
    CONSOLE_BOX.innerHTML += "<hr/><br/>\n"

    // WHENEVER A CONSUMER BEING ASSIGNED
    supp.on("assign", (uid: number) =>
    {
        time = Date.now();
        trace(`Consumer #${uid} has bought your computing power.`);
        trace();
    });

    // COMPILE
    supp.on("compile", (code: string, ...args: string[]) =>
    {
        trace("The consumer requests you to compile a program");
        trace(`${TAB}- bytes of codes: #${StringUtil.numberFormat(code.length)}`);
        trace(`${TAB}- arguments: ${args.length ? args.toString() : "N/A"}`);
        trace();
    });

    // CLOSE
    supp.on("close", () => 
    {
        trace("The computation has been completed.");
        trace(`${TAB}- elapsed time: ${StringUtil.numberFormat(Date.now() - time)} ms`);
        trace();

        CONSOLE_BOX.innerHTML += "<hr/><br/>\n";
    });
}
window.onload = main;