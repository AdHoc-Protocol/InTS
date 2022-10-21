import BitList from "./BitList"
import AdHoc from "../AdHoc"
import BitsList from "./BitsList";

export namespace Uint16ArrayNull {
    export abstract class R {
        
        protected nulls: BitList.RW;
        protected values: Uint16Array;
        protected values_size = 0;
        
        get length(): number {return this.nulls.length;}
        
        isEmpty(): boolean {return this.length < 1;}
        
        nextValueIndex(index: number): number {return this.nulls.next1(index);}
        
        prevValueIndex(index: number): number {return this.nulls.prev1(index);}
        
        nextNullIndex(index: number): number {return this.nulls.next0(index);}
        
        prevNullIndex(index: number): number {return this.nulls.prev0(index);}
        
        get last(): number | undefined {return this.get(this.length - 1);}
        
        get(index: number): number | undefined {return this.nulls.get(index) ? this.values[this.nulls.rank(index) - 1] : undefined;}
        
        indexOf(value: number, fromIndex?: number): number {
            let i = this.values.indexOf(value, fromIndex)
            return i < 0 ? i : this.nulls.bit(i);
        }
        
        lastIndexOf(value: number, fromIndex?: number): number {
            let i = this.values.lastIndexOf(value, fromIndex);
            return i < 0 ? i : this.nulls.bit(i);
        }
        
        protected static set(dst: R, index: number, value: number | undefined) {
            
            if (value == undefined) {
                if (dst.length <= index) dst.nulls.set0(index);//resize
                else if (dst.nulls.get(index)) {
                    const r = dst.nulls.rank(index);
                    dst.values.copyWithin(r, r + 1, dst.values_size - r);
                    dst.values_size--;
                    dst.nulls.set0(index);
                }
            }
            else if (dst.nulls.get(index)) dst.values[dst.nulls.rank(index) - 1] = value;
            else {
                dst.nulls.set1(index);
                const i = this.add_values(dst, index)
                dst.values[i] = value
            }
        }
        
        static add_values(dst: R, index: number): number {
            
            index = dst.nulls.rank(index) - 1;
            
            if (index < dst.values_size) {
                if (dst.values_size < dst.values.length) dst.values.copyWithin(index + 1, index, dst.values_size - index)
                else {
                    const tmp = new Uint16Array(dst.values.length * 1.5);
                    
                    for (let i = index; -1 < --i;) tmp[i] = dst.values[i];
                    for (let i = dst.values_size, min = index - 1; min < --i;) tmp[i + 1] = dst.values[i];
                    dst.values = tmp;
                }
                dst.values_size++
            }
            else {
                if (dst.values.length <= index) {
                    const tmp = new Uint16Array(Math.max(dst.values.length * 1.5, index + 1));
                    
                    for (let i = dst.values_size; -1 < --i;) tmp[i] = dst.values[i];
                    
                    dst.values = tmp;
                }
                
                dst.values_size = index + 1;
            }
            
            return index;
        }
        
        
        get [Symbol.toStringTag]() { return "Uint16ArrayNull.R" }
        
        * [Symbol.iterator](): IterableIterator<number | undefined> {
            const length = this.length;
            
            for (let i = 0, ii; i < length;)
                if ((ii = this.nextValueIndex(i)) == i) yield this.get(i++)
                else if (ii == -1 || length <= ii) {
                    while (i++ < length) yield undefined
                    return;
                }
                else for (; i < ii;) yield undefined
        }
        
        toString() { return `length = ${this.length}\n${this.toJSON()}` }
        
        toJSON() {
            
            const length = this.length;
            if (0 < length) {
                let ret = "";
                
                for (let i = 0, ii; i < length;)
                    if ((ii = this.nextValueIndex(i)) == i) {
                        ret += (this.get(i++)) + ",";
                        if (i % 10 == 0) ret += '\n'
                    }
                    else if (ii == -1 || length <= ii) {
                        while (i++ < length) {
                            ret += "undefined,";
                            if (i % 10 == 0) ret += '\n'
                            
                        }
                        break;
                    }
                    else for (; i < ii;) {
                            ret += "undefined,";
                            if (++i % 10 == 0) ret += '\n'
                        }
                
                return `[\n${ret.substring(0, ret.lastIndexOf(","))}\n]`
            }
            return '[]'
        }
        
        static equals(one: R | undefined, two: R | undefined): boolean {
            if (one === two) return true
            if (!one || !two || one.length !== two.length || !BitList.R.equals(one.nulls, two.nulls)) return false
            
            for (let i = one.values_size; -1 < --i;)
                if (one.values[i] !== two.values[i]) return false
            
            return true;
        }
        
        static hash(hash:number, src: R | undefined): number {
            return src ? AdHoc.mix(hash = BitList.R.hash(hash, src.nulls), AdHoc.hash_array(hash, src.values, AdHoc.hash_number, src.values_size)) : hash
        }
    }
    
    export class RW extends R {
        get [Symbol.toStringTag]() { return "Uint16ArrayNull.RW" }
        
        constructor(capacity: number, length?: number) {
            super();
            this.nulls = new BitList.RW(capacity, Math.min(length ?? capacity, capacity));
            this.values = new Uint16Array(capacity);
        }
        
        fill(fill_value: number | undefined, start: number, end: number): RW {
            while (start < end)
                R.set(this, start, fill_value);
            return this;
        }
        
        set capacity(items: number) {
            let f = false;
            if (this.nulls.capacity < items)
                this.nulls.capacity = items
            else if (items < this.nulls.capacity) {
                this.nulls.capacity = items
                f = true;
            }
            
            if (this.values.length == items) {
                if (f) {
                    const c = this.nulls.cardinality();
                    if (c < this.values_size) for (let i = c; i < this.values_size; i++) this.values[i] = 0;
                    this.values_size = c;
                }
                return;
            }
            
            const tmp = new Uint16Array(items);
            
            this.values_size = this.nulls.cardinality();
            
            if (f) this.values_size = this.nulls.cardinality();
            
            for (let i = this.values_size; -1 < --i;) tmp[i] = this.values[i];
            this.values = tmp;
        }
        
        fit() {
            this.capacity = this.length
        }
        
        remove() {this.remove_(this.length - 1);}
        
        remove_(index: number) {
            if (this.length < 1 || this.length <= index) return;
            
            if (this.nulls.get(index)) {
                let r = this.nulls.rank(index);
                this.values.copyWithin(r - 1, r, this.values_size - r);
                this.values_size--;
            }
            
            this.nulls.remove(index);
        }
        
        add(value: number | undefined) {
            R.set(this, this.length, value);
        }
        
        
        add_(index: number, value: number | undefined) {
            if (value == undefined) this.nulls.add$(index, false);
            else if (index < this.length) {
                this.nulls.add$(index, true);
                const i = R.add_values(this, index)
                this.values[i] = value;
            }
            else R.set(this, index, value);
        }
        
        set last(value: number | undefined) { R.set(this, this.length - 1, value);}
        
        set(index: number, value: number | undefined) { R.set(this, index, value);}
        
        set_(index: number, src: ArrayLike<(number | undefined)>): RW {
            
            for (let i = 0; i < src.length; i++)
                R.set(this, index + i, src[i])
            return this
        }
        
        
        set$(index: number, src: R, start: number, end: number) {
            while (start < end)
                R.set(this, index++, src.get(start));
            return this;
        }
        
        set1(index: number, values: (number | undefined)[]) {
            for (let i = 0, max = values.length; i < max; i++)
                R.set(this, index + i, values[i]);
        }
        
        
        addAll(src: R) {
            
            for (let i = 0, s = src.length; i < s; i++)
                this.add(src.get(i));
        }
        
        clear() {
            this.values.fill(0, 0, this.values_size);
            this.values_size = 0;
            this.nulls.clear();
        }
        
        swap(index1: number, index2: number) {
            
            let exist, empty;
            if (this.nulls.get(index1))
                if (this.nulls.get(index2)) {
                    let r = this.nulls.rank(index1) - 1
                    let r2 = this.nulls.rank(index2) - 1
                    const tmp = this.values[r];
                    this.values[r] = this.values[r2];
                    this.values[r2] = tmp;
                    return;
                }
                else {
                    exist = this.nulls.rank(index1) - 1;
                    empty = this.nulls.rank(index2);
                    this.nulls.set0(index1);
                    this.nulls.set1(index2);
                }
            else if (this.nulls.get(index2)) {
                exist = this.nulls.rank(index2) - 1;
                empty = this.nulls.rank(index1);
                
                this.nulls.set1(index1);
                this.nulls.set0(index2);
            }
            else return;
            
            let v = this.values[exist];
            this.values.copyWithin(exist, exist + 1, this.values_size - exist);
            this.values.copyWithin(empty + 1, empty, this.values_size - empty);
            this.values[empty] = v;
        }
    }
}

export default Uint16ArrayNull;

