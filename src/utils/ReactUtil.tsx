import * as ReactDOM from "react-dom";

export namespace ReactUtil
{
    export function render(element: JSX.Element, container: HTMLElement): Promise<void>
	{
		return new Promise(resolve =>
		{
			ReactDOM.render(element, container, resolve);
		});
	}
}