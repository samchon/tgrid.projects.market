export namespace Global
{
    export const PORT = 10203;

    export const BOOK = "https://tgrid.dev/en/tutorial/projects/market";
    export const GITHIB = "https://github.com/samchon/tgrid.projects.market";

    export function url(path: string): string
    {
        return `ws://${window.location.hostname}:${Global.PORT}${path}`;
    }
}