import { WorkerServer } from "tgrid/protocols/workers";
import { TspSolver } from "../../../utils/TspSolver";

async function main(): Promise<void>
{
    let server: WorkerServer<TspSolver> = new WorkerServer();
    await server.open(new TspSolver());
}
main();