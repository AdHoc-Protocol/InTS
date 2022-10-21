export class Context
{
    bigint_  : bigint | undefined
    object_  : object | undefined
    string_  : string | undefined
    boolean_ : boolean | undefined
    number_  : number | undefined
    
    
}

export namespace Context{
    export interface Provider {
        get context():Context;
    }
}

export default Context;