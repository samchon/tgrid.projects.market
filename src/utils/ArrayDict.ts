import { IPair } from "tstl/utility/IPair";

export class ArrayDict<T> implements ArrayLike<T>
{
    readonly [key: number]: T;
    private length_: number;

    /* ----------------------------------------------------------------
        CONSTRUCTORS
    ---------------------------------------------------------------- */
    public constructor()
    {
        this.length_ = 0;
    }

    public set(key: number, value: T): void
    {
        if (this.has(key) === false)
            ++this.length_;
        
        (this as Required<ArrayDict<T>>)[key] = value;
    }

    public erase(key: number): void
    {
        if (this.has(key) === false)
            return;

        --this.length_;
        delete (this as Required<ArrayDict<T>>)[key];
    }

    /* ----------------------------------------------------------------
        ACCESSORS
    ---------------------------------------------------------------- */
    public get length(): number
    {
        return this.length_;
    }

    public has(key: number): boolean
    {
        return this[key] !== undefined;
    }

    public get(key: number): T
    {
        return this[key];
    }

    public [Symbol.iterator](): IterableIterator<IPair<number, T>>
    {
        return new ArrayDict.ForOfAdaptor<T>(this);
    }
}

export namespace ArrayDict
{
    /**
     * @internal
     */
    export class ForOfAdaptor<T> implements IterableIterator<IPair<number, T>>
    {
        private dict_: ArrayDict<T>;
        private properties_: string[];
        private index_: number = 0;

        public constructor(dict: ArrayDict<T>)
        {
            this.dict_ = dict;
            this.properties_ = [];
            this.index_ = 0;

            for (let key in dict)
                if (key !== "length_")
                    this.properties_.push(key);
        }

        public next(): IteratorResult<IPair<number, T>>
        {
            if (this.index_ === this.properties_.length)
                return {
                    done: true,
                    value: undefined!
                };
            else
            {
                let key: number = Number(this.properties_[this.index_++]);
                return {
                    done: false,
                    value: 
                    {
                        first: key,
                        second: this.dict_[key]
                    }
                };
            }
        }

        public [Symbol.iterator](): IterableIterator<IPair<number, T>>
        {
            return this;
        }
    }
}