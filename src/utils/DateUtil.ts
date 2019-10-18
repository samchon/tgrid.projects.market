export namespace DateUtil
{
	export function to_string(date: Date, hms: boolean = false, dense: boolean = false): string
	{
		if (hms === true)
			if (dense === true)
				return _Is_today(date) 
					? _To_time_string(date) 
					: _To_date_string(date);
			else
				return _To_date_string(date) + " " + _To_time_string(date);
		else
			return _To_date_string(date);
	}

	export function diff(x: Date | string, y: Date | string): IDifference
	{
		x = _To_date(x);
		y = _To_date(y);

		// FIRST DIFFERENCES
		let ret: IDifference = 
		{
			year: x.getFullYear() - y.getFullYear(),
			month: x.getMonth() - y.getMonth(),
			date: x.getDate() - y.getDate()
		};

		//----
		// HANDLE NEGATIVE ELEMENTS
		//----
		// DATE
		if (ret.date < 0)
		{
			let last: number = last_date(y.getFullYear(), y.getMonth());

			--ret.month;
			ret.date = x.getDate() + (last - y.getDate());
		}
		
		// MONTH
		if (ret.month < 0)
		{
			--ret.year;
			ret.month = 12 + ret.month;
		}
		return ret;
	}

	export function last_date(year: number, month: number): number
	{
		// LEAP MONTH
		if (month == 1 && year % 4 == 0 && !(year % 100 == 0 && year % 400 != 0))
			return 29;
		else
			return LAST_DATES[month];
	}

	export interface IDifference
	{
		year: number;
		month: number;
		date: number;
	}

	/**
	 * @hidden
	 */
	function _Is_today(date: Date): boolean
	{
		let now: Date = new Date();
		return now.getFullYear() === date.getFullYear()
			&& now.getMonth() === date.getMonth()
			&& now.getDate() === date.getDate();
	}

	/**
	 * @hidden
	 */
	function _To_date_string(date: Date): string
	{
		return `${date.getFullYear()}-${_To_cipher_string(date.getMonth()+1)}-${_To_cipher_string(date.getDate())}`;
	}

	/**
	 * @hidden
	 */
	function _To_time_string(date: Date): string
	{
		return `${_To_cipher_string(date.getHours())}:${_To_cipher_string(date.getMinutes())}:${_To_cipher_string(date.getSeconds())}`;
	}

	/**
	 * @hidden
	 */
	function _To_date(date: string | Date): Date
	{
		if (date instanceof Date)
			return date;
		else
			return new Date(date);
	}

	function _To_cipher_string(val: number): string
	{
		if (val < 10)
			return "0" + val;
		else
			return String(val);
	}

	/**
	 * @hidden
	 */
	const LAST_DATES: number[] = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
}