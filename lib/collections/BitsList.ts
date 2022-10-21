import AdHoc from "../AdHoc";

export namespace BitsList {
    
    
    function mask(bits: number): number {return (1 << bits) - 1;}
    
    function length(src: number) {return src >>> 3;}
    
    function index(item_X_bits: number) {return item_X_bits >> LEN;}
    
    function bit(item_X_bits: number): number {return item_X_bits & MASK;}
    
    function value(src: number, bit: number, bits: number) {return src >>> bit & mask(bits);}
    
    function value_(prev: number, next: number, bit: number, bits: number) {return ((next & mask(bit + bits - BITS)) << BITS - bit | prev >>> bit) & mask(bits);}
    
    const LEN = 5;
    const BITS = 1 << LEN;//32 bits
    const MASK = BITS - 1;
    
    function len4bits(bits: number) {return (bits + BITS) >>> LEN;}
    
    const O = new Uint32Array(0);//zero
    
    export abstract class R {
        protected values: Uint32Array = O;
        protected _length = 0;
        get length(): number {return this._length;}
        
        protected readonly mask: number;
        
        readonly bits: number;
        readonly default_value;
        
        protected constructor(bits_per_item: number, length?: number, default_value?: number) {
            this.mask = mask(this.bits = bits_per_item);
            
            this.default_value = default_value ?? 0 & 0xFF
            
            if (length) R.set(this, length - 1, this.default_value)
        }
        
        
        get capacity() {return this.values.length * BITS / this.bits | 0;}
        
        //if 0 < items - fit storage space according `items` param
        //if items < 0 - cleanup and allocate spase
        protected set capacity(items: number) {
            if (0 < items) {
                
                if (items < this._length) this._length = items;
                const new_values_length = len4bits(items * this.bits)
                
                if (new_values_length === this.values.length) return
                
                if (new_values_length == 0) this.values = O
                else {
                    const tmp = new Uint32Array(new_values_length);
                    tmp.set(this.values);
                    this.values = tmp;
                    return;
                }
            }
            
            const new_values_length = len4bits(-items * this.bits)
            
            if (this.values.length !== new_values_length)
                if (new_values_length == 0) this.values = O
                else {
                    this.values = new Uint32Array(new_values_length)
                    if (this.default_value == 0) {
                        this._length = 0;
                        return
                    }
                }
            
            this.clear()
        }
        
        protected clear() {
            if (this.default_value == 0)//can do it fast
                for (let i = Math.min(index(this.bits * this.length), this.values.length - 1); -1 < i; i -= 4) this.values[i] = 0;
            this._length = 0;
        }
        
        get isEmpty() {return this._length == 0;}
        
        
        protected static add(dst: R, src: number) {this.set(dst, dst._length, src);}
        
        protected static add_(dst: R, item: number, value: number) {
            if (dst._length <= item) {
                R.set(dst, item, value);
                return;
            }
            let p = item * dst.bits;
            item = index(p);
            let src = dst.values;
            let dst_ = dst.values;
            if (dst.capacity * BITS < p) dst.capacity = (Math.max(dst.capacity + dst.capacity / 2 | 0, len4bits(p)));
            let v = value & dst.mask;
            let Bit = bit(p);
            if (0 < Bit) {
                let i = src[item];
                let k = BITS - Bit;
                if (k < dst.bits) {
                    dst_[item] = (i << k) >>> k | v << Bit;
                    v = v >> k | i >> Bit << dst.bits - k;
                }
                else {
                    dst_[item] = (i << k) >>> k | v << Bit | i >>> Bit << Bit + dst.bits;
                    v = i >>> Bit + dst.bits | src[item + 1] << k - dst.bits & dst.mask;
                }
                item++;
            }
            dst._length++;
            for (let max = len4bits(dst._length * dst.bits); ;) {
                let i = src[item];
                dst_[item] = i << dst.bits | v;
                if (max < ++item) break;
                v = i >>> BITS - dst.bits;
            }
        }
        
        get last(): number {return this.get(this._length - 1);}
        
        get(item: number): number {
            let Index = index(item *= this.bits);
            let Bit = bit(item);
            return (BITS < Bit + this.bits ? value_(this.values[Index], this.values[Index + 1], Bit, this.bits) : value(this.values[Index], Bit, this.bits));
        }
        
        protected static set_(dst: R, from: number, src: ArrayLike<number>) {for (let i = src.length; -1 < --i;) R.set(dst, from + i, src[i]);}
        
        protected static set(dst: R, item: number, src: number) {
            
            const total_bits = item * dst.bits
            
            if (item < dst._length) {
                const
                    v = src & dst.mask,
                    Index = index(total_bits),
                    Bit = bit(total_bits),
                    k = BITS - Bit,
                    i = dst.values[Index];
                
                if (k < dst.bits) {
                    dst.values[Index] = (i << k) >>> k | v << Bit;
                    dst.values[Index + 1] = dst.values[Index + 1] >>> dst.bits - k << dst.bits - k | v >> k;
                }
                else dst.values[Index] = ~(~0 >>> BITS - dst.bits << Bit) & i | v << Bit;
                return;
            }
            
            if (dst.capacity <= item) dst.capacity = (Math.max(dst.capacity + dst.capacity / 2 | 0, len4bits(total_bits + dst.bits)));
            
            if (dst.default_value != 0)
                for (let i = dst.length; i < item; i++) R.append(dst, i, dst.default_value);
            
            R.append(dst, item, src);
            
            dst._length = item + 1;
        }
        
        private static append(dst: R, item: number, src: number) {
            const
                v = src & dst.mask,
                p = item * dst.bits,
                Index = index(p),
                Bit = bit(p),
                k = BITS - Bit,
                i = dst.values[Index];
            
            if (k < dst.bits) {
                dst.values[Index] = (i << k) >>> k | v << Bit;
                dst.values[Index + 1] = v >> k;
            }
            else
                dst.values[Index] = ~(~0 << Bit) & i | v << Bit;
        }
        
        protected static removeAt(dst: R, item: number) {
            if (item + 1 == dst._length) {
                if (dst.default_value == 0) R.append(dst, item, 0);//zeroed place
                dst._length--;
                return;
            }
            let Index = index(item *= dst.bits);
            const
                Bit = bit(item),
                k = BITS - Bit;
            let i = dst.values[Index];
            if (Index + 1 == dst.capacity) {
                if (Bit == 0) dst.values[Index] = i >>> dst.bits;
                else if (k < dst.bits) dst.values[Index] = (i << k) >>> k;
                else if (dst.bits < k) dst.values[Index] = (i << k) >>> k | i >>> Bit + dst.bits << Bit;
                dst._length--;
                return;
            }
            if (Bit == 0) dst.values[Index] = i >>>= dst.bits;
            else if (k < dst.bits) {
                let ii = dst.values[Index + 1];
                dst.values[Index] = (i << k) >>> k | ii >>> Bit + dst.bits - BITS << Bit;
                dst.values[++Index] = i = ii >>> dst.bits;
            }
            else if (dst.bits < k)
                if (Index + 1 == dst.values.length) {
                    dst.values[Index] = (i << k) >>> k | i >>> Bit + dst.bits << Bit;
                    dst._length--;
                    return;
                }
                else {
                    let ii = dst.values[Index + 1];
                    dst.values[Index] = (i << k) >>> k | i >>> Bit + dst.bits << Bit | ii << BITS - dst.bits;
                    dst.values[++Index] = i = ii >>> dst.bits;
                }
            let f = Index;
            for (let max = dst._length * dst.bits >>> LEN; Index < max;) {
                let ii = dst.values[Index + 1];
                dst.values[Index] = i << dst.bits >>> dst.bits | ii << BITS - dst.bits;
                dst.values[++Index] = i = ii >>> dst.bits;
            }
            dst._length--;
        }
        
        
        indexOf(value: number): number {
            for (let item = 0, max = this._length * this.bits; item < max; item += this.bits)
                if (value == this.get(item)) return item / this.bits | 0;
            return -1;
        }
        
        lastIndexOf(value: number): number {return this.lastIndexOf_(this._length, value);}
        
        lastIndexOf_(from: number, value: number) {
            for (let i = Math.max(from, this._length); -1 < --i;)
                if (value == this.get(i)) return i;
            return -1;
        }
        
        protected static remove(dst: R, value: number) {
            for (let i = dst._length; -1 < (i = dst.lastIndexOf_(i, value));)
                this.removeAt(dst, i);
        }
        
        contains(value: number): boolean {return -1 < this.indexOf(value);}
        
        toArray(dst: Uint8Array | undefined): Uint8Array {
            if (this._length == 0) return new Uint8Array(0);
            if (dst == undefined || dst.length < this._length) dst = new Uint8Array(this._length);
            for (let item = 0, max = this._length * this.bits; item < max; item += this.bits)
                dst[item / this.bits | 0] = this.get(item);
            return dst;
        }
        
        
        get [Symbol.toStringTag]() { return "BitsList.R" }
        
        toString() { return `length = ${this.length}\n \n${this.toJSON()}` }
        
        toJSON() {
            let ret = ""
            
            let length = this.length;
            if (0 < length) {
                let
                    ret = "",
                    src = this.values[0];
                
                for (let bp = 0, max = length * this.bits, i = 1; bp < max; bp += this.bits, i++) {
                    const _bit = bit(bp);
                    ret += ((BITS < _bit + this.bits) ? value_(src, src = this.values[index(bp) + 1], _bit, this.bits) : src >>> _bit & this.mask) + ",";
                    if (i % 10 == 0) ret += ' '
                }
                
                return `[\n${ret.substring(0, ret.lastIndexOf(","))}\n]`
            }
            return '[]'
        }
        
        static equals(one: R | undefined, two: R | undefined): boolean {
            if (one === two) return true
            if (!one || !two || one._length !== two._length) return false;
            
            let i = index(one._length);
            const mask = (1 << bit(one._length)) - 1;
            if ((one.values[i] & mask) != (two.values[i] & mask)) return false;
            while (-1 < --i)
                if (one.values[i] != two.values[i]) return false;
            return true;
        }
        
        static hash(hash: number, src: R | undefined): number {
            if (!src) return hash
            let length = index(src._length)
            const mask = (1 << bit(src._length)) - 1;//last partial element mask
            
            switch (length) {
                case 0:
                    return AdHoc.finalizeHash(hash, 0);
                case 1:
                    return AdHoc.finalizeHash(AdHoc.mix(hash, AdHoc.hash_number(hash, src.values[0] & mask)), 1);
            }
            hash = AdHoc.mix(hash, AdHoc.hash_number(hash, src.values[length] & mask));//process partial element
            
            return AdHoc.hash_array(hash, src.values, AdHoc.hash_number, length - 1)
        }
    }
    
    
    export class RW extends R {
        
        
        constructor(bits_per_item: number, length?: number, default_value?: number) {super(bits_per_item, length, default_value);}
        
        get [Symbol.toStringTag]() { return "BitsList.RW" }
        
        copy_of(bits_per_item: number, values: Uint8Array): RW {
            let r = new RW(bits_per_item, values.length);
            R.set_(r, 0, values);
            return r
        }
        
        
        add(value: number) {R.add(this, value);}
        
        add_(index: number, src: number) {R.add_(this, index, src);}
        
        
        removeAt(item: number) {R.removeAt(this, item);}
        
        remove() {R.removeAt(this, this._length - 1);}
        
        remove_(value: number) {R.remove(this, value);}
        
        set last(value: number) {R.set(this, this._length - 1, value);}
        
        
        set(item: number, value: number) {R.set(this, item, value);}
        
        
        set$(index: number, values: ArrayLike<number>) {R.set_(this, index, values);}
        
        retainAll(chk: R): boolean {
            let fix = this._length;
            let v;
            for (let item = 0; item < this._length; item++)
                if (!chk.contains(v = this.get(item))) R.remove(this, v);
            return fix != this._length;
        }
        
        clear() {super.clear();}
        
        fit() {this.capacity = (-this._length);}
        
    }
}

export default BitsList;