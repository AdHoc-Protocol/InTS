//  MIT License
//
//  Copyright © 2020 Chikirev Sirguy, Unirail Group. All rights reserved.
//  For inquiries, please contact:  al8v5C6HU4UtqE9@gmail.com
//  GitHub Repository: https://github.com/AdHoc-Protocol
//
//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to use,
//  copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
//  the Software, and to permit others to do so, under the following conditions:
//
//  1. The above copyright notice and this permission notice must be included in all
//     copies or substantial portions of the Software.
//
//  2. Users of the Software must provide a clear acknowledgment in their user
//     documentation or other materials that their solution includes or is based on
//     this Software. This acknowledgment should be prominent and easily visible,
//     and can be formatted as follows:
//     "This product includes software developed by Chikirev Sirguy and the Unirail Group
//     (https://github.com/AdHoc-Protocol)."
//
//  3. If you modify the Software and distribute it, you must include a prominent notice
//     stating that you have changed the Software.
//
//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT, OR OTHERWISE, ARISING FROM,
//  OUT OF, OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
//  SOFTWARE.

import AdHoc from "../AdHoc"

export namespace BitList {
    const LEN = 5;
    const BITS = 1 << LEN;//32 bits
    const MASK = BITS - 1;
    const FFFF_FFFF = 0xFFFF_FFFF;
    const OI = 0x7FFF_FFFF;
    const IO = ~OI;

    function bitCount(i: number): number {
        i = i - (i >>> 1 & 0x55555555);
        i = (i & 0x33333333) + (i >>> 2 & 0x33333333);
        i = i + (i >>> 4) & 0x0f0f0f0f;
        i = i + (i >>> 8);
        i = i + (i >>> 16);
        return i & 0x3f;
    }

    // Function to find the number of trailing zeros in an integer
    function numberOfTrailingZeros(i: number) {
        // HD, Figure 5-14
        let y;
        if (i == 0) return 32;
        let n = 31;
        y = i << 16;
        if (y != 0) {
            n = n - 16;
            i = y;
        }
        y = i << 8;
        if (y != 0) {
            n = n - 8;
            i = y;
        }
        y = i << 4;
        if (y != 0) {
            n = n - 4;
            i = y;
        }
        y = i << 2;
        if (y != 0) {
            n = n - 2;
            i = y;
        }
        return n - ((i << 1) >>> 31);
    }

    // Function to calculate the number of 4-bit chunks needed for a given number of bits
    function len4bits(bits: number): number {return 1 + (bits >> LEN);}

    // Base class for BitList operations
    export abstract class R {
        protected _size = 0; // Protected property to store the size of the bit list

        // Property to get the size of the bit list
        get size(): number {return this._size;}

        values: Uint32Array = new Uint32Array(0); // Array to store the bit values

        // Static function to calculate the index based on the number of bits
        static index(item_X_bits: number): number {return item_X_bits >> LEN;}

        // Static function to create a mask for a given number of bits
        static mask(bits: number): number {return (1 << bits) - 1;}

        _used = 0; // Private property to track the number of used indices

        // Function to calculate the number of used indices
        used(): number {
            if (-1 < this._used) return this._used;
            this._used &= OI;
            let i = this._used - 1;
            while (-1 < i && this.values[i] == 0) i--;
            return this._used = i + 1;
        }

        // Function to ensure enough space for a given bit position
        used_(bit: number): number {
            if (this.size <= bit) this._size = bit + 1;
            let index = bit >> LEN;
            if (index < this.used()) return index;
            if (this.values.length < (this._used = index + 1)) {
                const tmp = new Uint32Array(Math.max(1.5 * this.values.length, this._used))
                tmp.set(this.values);
                this.values = tmp;
            }
            return index;
        }

        // Function to check if a specific bit is set
        get(bit: number): boolean {
            let index = bit >> LEN;
            return index < this.used() && (this.values[index] & 1 << bit) != 0;
        }

        // Function to get a bit with ternary logic (TRUE/FALSE)
        get_(bit: number, FALSE: number, TRUE: number): number {
            let index = bit >> LEN;
            return index < this.used() && (this.values[index] & 1 << bit) != 0 ?
                   TRUE :
                   FALSE;
        }

        // Function to copy a range of bits into a destination array
        get$(dst: Uint32Array, from_bit: number, to_bit: number): number {
            const ret = (to_bit - from_bit - 1 >> LEN) + 1;
            let index = from_bit >> LEN;

            if ((from_bit & MASK) == 0) for (let i = index, max = index + (ret - 1); i < max; i++) dst[i] = this.values[i]
            else
                for (let i = 0; i < ret - 1; i++, index++)
                    dst[i] = this.values[index] >>> from_bit | this.values[index + 1] << -from_bit;

            const mask = FFFF_FFFF >>> -to_bit;

            dst[ret - 1] = (to_bit - 1 & MASK) < (from_bit & MASK) ?
                           this.values[index] >>> from_bit | (this.values[index + 1] & mask) << -from_bit :
                           (this.values[index] & mask) >>> from_bit;
            return ret;
        }

        // Function to find the next set bit after a given position
        next1(bit: number): number {
            let index = bit >> LEN;
            if (this.used() <= index) return -1;
            for (let i = this.values[index] & FFFF_FFFF << bit; ; i = this.values[index]) {
                if (i != 0) return index * BITS + numberOfTrailingZeros(i);
                if (++index == this._used) return -1;
            }
        }

        // Function to find the next unset bit after a given position
        next0(bit: number): number {
            let index = bit >> LEN;
            if (this.used() <= index) return bit;
            for (let i = ~this.values[index] & FFFF_FFFF << bit; ; i = ~this.values[index]) {
                if (i != 0) return index * BITS + numberOfTrailingZeros(i);
                if (++index == this._used) return this._used * BITS;
            }
        }

        prev1(bit: number): number {
            let index = bit >> LEN;
            if (this.used() <= index) return this.last1() - 1;
            for (let i = this.values[index] & FFFF_FFFF >>> -(bit + 1); ; i = this.values[index]) {
                if (i != 0) return (index + 1) * BITS - 1 - Math.clz32(i);
                if (index-- == 0) return -1;
            }
        }

        // Function to find the previous unset bit before a given position
        prev0(bit: number): number {
            let index = bit >> LEN;
            if (this.used() <= index) return bit;
            for (let i = ~this.values[index] & FFFF_FFFF >>> -(bit + 1); ; i = ~this.values[index]) {
                if (i != 0) return (index + 1) * BITS - 1 - Math.clz32(i);
                if (index-- == 0) return -1;
            }
        }

        // Function to find the position of the last set bit
        last1(): number {
            return this.used() == 0 ?
                   0 :
                   BITS * (this._used - 1) + BITS - Math.clz32(this.values[this._used - 1]);
        }

        // Function to check if the bit list is empty
        isEmpty(): boolean {return this._used == 0;}

        // Function to calculate the rank of a bit (number of set bits up to that position)
        rank(bit: number): number {
            let max = bit >> LEN;
            if (max < this.used())
                for (let i = 0, sum = 0; ; i++)
                    if (i < max) sum += bitCount(this.values[i]);
                    else return sum + bitCount(this.values[i] & FFFF_FFFF >>> BITS - (bit + 1));
            return this.cardinality();
        }

        // Function to calculate the total number of set bits
        cardinality(): number {
            let sum = 0
            for (let i = 0, max = this.used(); i < max; i++)
                sum += bitCount(this.values[i]);

            return sum;
        }

        // Function to find the bit at a given cardinality (rank)
        bit(cardinality: number): number {
            let i = 0, c = 0;
            while ((c += bitCount(this.values[i])) < cardinality) i++;
            let v = this.values[i];
            let z = Math.clz32(v);
            for (let p = 1 << BITS - 1; cardinality < c; z++) if ((v & p >>> z) != 0) c--;
            return i * BITS + BITS - z;
        }

        // Property to get the total length of the bit list
        get length(): number {return this.values.length * BITS;}

        // Symbol.toStringTag getter to provide a custom string representation
        get [Symbol.toStringTag]() { return "BitList.R" }

        // Function to convert the bit list to a string representation
        toString() { return `length = ${this.size}\n \n${this.toJSON()}` }

        // Function to convert the bit list to a JSON representation
        toJSON() {

            let size = this.size;
            if (!size) return '[]'
            const max = size >> LEN;

            let ret = ""

            for (let i = 0; i < max; i++) {
                const v = this.values[i];
                for (let s = 0; s < BITS; s++) {
                    ret += (v & 1 << s ?
                            1 :
                            0) + ",";
                    if ((s + 1) % 8 == 0) ret += ' '
                }
                ret += '\n'
            }

            if (0 < (size &= MASK)) {
                const v = this.values[max];
                for (let s = 0; s < size; s++) {
                    ret += (v & 1 << s ?
                            1 :
                            0) + ",";
                    if ((s + 1) % 8 == 0) ret += ' '
                }
                ret += '\n'
            }

            return `[\n${ret.substring(0, ret.lastIndexOf(","))}\n]`
        }

        // Static function to compare two BitList instances for equality
        static equals(one: R | undefined, two: R | undefined): boolean {
            if (one === two) return true

            if (!one || !two || one.size !== two.size) return false

            for (let i = one.used(); -1 < --i;) if (one.values[i] != two.values[i]) return false;
            return true;
        }

        // Static function to generate a hash value for a BitList instance
        static hash(hash: number, src: R | undefined): number {
            return src ?
                   AdHoc.hash_array(hash, src.values, AdHoc.hash_number, src.used()) :
                   hash
        }

    }

    // Derived class for read-write BitList operations
    export class RW extends R {
        // Symbol.toStringTag getter to provide a custom string representation
        get [Symbol.toStringTag]() { return "BitList.RW" }

        // Constructor to initialize the RW instance
        constructor(lengthOrArray: number | ArrayLike<boolean>, size?: number, fill_value?: boolean) {
            super();
            if (typeof lengthOrArray === 'number') {
                if ((lengthOrArray ?? 0) < 1) return
                this.values = new Uint32Array(len4bits(lengthOrArray));

                if (size)
                    if (0 < size) this.set_(size - 1, fill_value ?? false)
                    else {
                        this._size = -size
                        this._used |= IO;
                    }

            } else {
                this.values = new Uint32Array(len4bits(lengthOrArray.length));

                for (let i = 0; i < lengthOrArray.length; i++)
                    this.add(lengthOrArray[i])
            }
        }

        // Function to copy a range of bits from another BitList instance
        copy(src: R, from_bit: number, to_bit: number): RW {

            if (src.size <= from_bit) return new RW(0);
            let length = Math.min(to_bit, src.size - 1) - from_bit;
            let i2 = src.get(to_bit) ?
                     to_bit :
                     src.prev1(to_bit);
            if (i2 == -1) return new RW(0);

            if (this.values.length < (i2 - 1 >> LEN) + 1)
                this.values = new Uint32Array((i2 - 1 >> LEN) + 1);
            this._used = this.values.byteLength | IO;
            let
                i1 = src.get(from_bit) ?
                     from_bit :
                     src.next1(from_bit),
                index = i1 >>> LEN,
                max = (i2 >>> LEN) + 1,
                i = 0;
            for (let v = src.values[index] >>> i1; ; v >>>= i1, i++)
                if (index + 1 < max)
                    this.values[i] = v | (v = src.values[index + i]) << BITS - i1;
                else {
                    this.values[i] = v;
                    return this;
                }
        }

        // Function to perform bitwise AND operation with another BitList instance
        and(and: R): RW {
            if (Object.is(this, and)) return this;
            if (and.used < this.used)
                while (this._used > and._used) this.values[--this._used] = 0;
            for (let i = 0; i < this._used; i++) this.values[i] &= and.values[i];
            this._used |= IO;
            return this;
        }

        // Function to perform bitwise OR operation with another BitList instance
        or(or: R): RW {

            if (or.used() < 1 || Object.is(this, or)) return this;
            let u = this._used;
            if (this.used < or.used) {
                if (this.values.length < or._used) {
                    const tmp = new Uint32Array(Math.max(2 * this.values.length, or._used));
                    tmp.set(this.values);
                    this.values = tmp;
                }
                this._used = or._used;
            }
            let min = Math.min(u, or._used);
            for (let i = 0; i < min; i++)
                this.values[i] |= or.values[i];

            if (min < or._used) this.values.set(or.values.slice(min, or._used - min), min);
            else if (min < u) this.values.set(or.values.slice(min, u - min), min);
            return this;
        }

        // Function to perform bitwise XOR operation with another BitList instance
        xor(xor: R): RW {
            if (xor.used() < 1 || Object.is(this, xor)) return this;
            let u = this._used;
            if (this.used < xor.used) {
                if (this.values.length < xor._used) {
                    const tmp = new Uint32Array(Math.max(2 * this.values.length, xor._used));
                    tmp.set(this.values);
                    this.values = tmp;
                }
                this._used = xor._used;
            }
            let min = Math.min(u, xor._used);
            for (let i = 0; i < min; i++)
                this.values[i] ^= xor.values[i];
            if (min < xor._used) this.values.set(xor.values.slice(min, xor._used - min), min);
            else if (min < u) this.values.set(xor.values.slice(min, u - min), min);
            this._used |= IO;
            return this;
        }

        // Function to perform bitwise AND-NOT operation with another BitList instance
        andNot(not: R): RW {
            for (let i = Math.min(this.used(), not.used()) - 1; -1 < i; i--) this.values[i] &= ~not.values[i];
            this._used |= IO;
            return this;
        }

        // Function to check if there is an intersection with another BitList instance
        intersects(set: R): boolean {
            for (let i = Math.min(this._used, set._used) - 1; i >= 0; i--)
                if ((this.values[i] & set.values[i]) != 0) return true;
            return false;
        }

        // Function to flip a specific bit
        flip(bit: number) {
            let index = this.used_(bit);
            if ((this.values[index] ^= 1 << bit) == 0 && index + 1 == this._used) this._used |= IO;
        }

        // Function to flip a range of bits
        flip_(from_bit: number, to_bit: number) {
            if (from_bit == to_bit) return;
            let from_index = from_bit >> LEN;
            let to_index = this.used_(to_bit - 1);
            let from_mask = FFFF_FFFF << from_bit;
            let to_mask = FFFF_FFFF >>> -to_bit;
            if (from_index == to_index) {
                if ((this.values[from_index] ^= from_mask & to_mask) == 0 && from_index + 1 == this._used) this._used |= IO;
            } else {
                this.values[from_index] ^= from_mask;
                for (let i = from_index + 1; i < to_index; i++) this.values[i] ^= FFFF_FFFF;
                this.values[to_index] ^= to_mask;
                this._used |= IO;
            }
        }

        // Function to set a range of bits based on an array-like source
        set(index: number, ...src: any[]): RW {
            for (let i = 0, max = src.length; i < max; i++)
                if (src[i]) this.set1(index + i);
                else this.set0(index + i);
            return this;
        }

        // Function to set a single bit based on a value
        set_(bit: number, value: any) {
            if (value)
                this.set1(bit);
            else
                this.set0(bit);
        }

        // Function to set a range of bits based on a callback function
        set$(index: number, src: (index: number) => boolean, src_index_max: number): RW {
            for (let i = 0, max = src_index_max; i < max; i++)
                if (src(i)) this.set1(index + i);
                else this.set0(index + i);
            return this;
        }

        // Function to set a range of bits based on a string
        seT(index: number, src: string): RW {
            if (src.startsWith("0x") || src.startsWith("0b")) return this.sEt(index, BigInt(src))

            for (let i = 0, max = src.length; i < max; i++)
                this.set_(index + i, src.charAt(i) !== '0');

            return this;
        }

        // Function to set a range of bits based on a bigint
        sEt(index: number, src: bigint): RW {
            for (let i = 0; src; src >>= 1n, i++)
                this.set_(index + i, (src & 1n) !== 0n)

            return this;
        }

        // Function to set a range of bits based on a value
        Set(from_bit: number, to_bit: number, value: any) {
            if (value)
                this.set1_(from_bit, to_bit);
            else
                this.set0_(from_bit, to_bit);
        }

        // Function to set a specific bit to 1
        set1(bit: number) {

            let index = this.used_(bit);//!!!
            this.values[index] |= 1 << bit;
        }

        // Function to set a range of bits to 1
        set1_(from_bit: number, to_bit: number): RW {
            if (from_bit == to_bit) return this;
            let from_index = from_bit >> LEN;
            let to_index = this.used_(to_bit - 1);
            let from_mask = FFFF_FFFF << from_bit;
            let to_mask = FFFF_FFFF >>> -to_bit;
            if (from_index == to_index) this.values[from_index] |= from_mask & to_mask;
            else {
                this.values[from_index] |= from_mask;
                for (let i = from_index + 1; i < to_index; i++)
                    this.values[i] = FFFF_FFFF;
                this.values[to_index] |= to_mask;
            }
            return this;
        }

        // Function to set a specific bit to 0
        set0(bit: number) {
            if (this.size <= bit) this._size = bit + 1;
            let index = bit >> LEN;
            if (index < this.used())
                if (index + 1 == this._used && (this.values[index] &= ~(1 << bit)) == 0) this._used |= IO;
                else
                    this.values[index] &= ~(1 << bit);
        }

        // Function to set a range of bits to 0
        set0_(from_bit: number, to_bit: number): RW {
            if (this.size <= to_bit) this._size = to_bit + 1;

            if (from_bit == to_bit) return this;

            let from_index = from_bit >> LEN;
            if (this.used() <= from_index) return this;

            let to_index = to_bit - 1 >> LEN;
            if (this._used <= to_index) {
                to_bit = this.last1();
                to_index = this._used - 1;
            }

            let from_mask = FFFF_FFFF << from_bit;
            let to_mask = FFFF_FFFF >>> -to_bit;

            if (from_index == to_index) {
                if ((this.values[from_index] &= ~(from_mask & to_mask)) == 0) if (from_index + 1 == this._used) this._used |= IO;
            } else {
                this.values[from_index] &= ~from_mask;
                for (let i = from_index + 1; i < to_index; i++) this.values[i] = 0;
                this.values[to_index] &= ~to_mask;
                this._used |= IO;
            }
            return this;
        }

        // Function to add a value to the bit list
        add(value: boolean | number) {this.set_(this._size, value);}

        // Function to add a range of bits based on a number and a bit count
        add_(src: number, bits: number) {
            if (BITS < bits) bits = BITS;
            let _size = this._size;
            this._size += bits;
            if ((src &= ~(1 << bits - 1)) == 0) return;
            this.used_(_size + BITS - Math.clz32(src));
            let bit = _size & MASK;
            if (bit == 0) this.values[R.index(this._size)] = src;
            else {
                this.values[R.index(_size)] &= src << bit | R.mask(bit);
                if (R.index(_size) < R.index(this._size)) this.values[R.index(this._size)] = src >> bit;
            }
        }

        // Function to add a value at a specific index
        add$(key: number, value: number | boolean) {
            if (key < this.last1()) {
                let index = key >> LEN;
                let m = FFFF_FFFF << key;
                let v = this.values[index];
                m = (v & m) << 1 | v & ~m;
                if (value) m |= 1 << key;
                while (++index < this._used) {
                    this.values[index - 1] = m;
                    let t = v >>> BITS - 1 & 0xFFFF_FFFF;
                    v = this.values[index];
                    m = v << 1 | t;
                }
                this.values[index - 1] = m;
                this._used |= IO;
            } else if (value) {
                let index = this.used_(key);  //!!!
                this.values[index] |= 1 << key;
            }
            this._size++;
        }

        // Function to clear the bit list
        clear() {
            for (this.used; this._used > 0;) this.values[--this._used] = 0;
            this._size = 0;
        }

        // Function to remove a specific bit
        remove(bit: number) {
            if (this._size <= bit) return;
            this._size--;
            let index = bit >> LEN;
            if (this.used() <= index) return;

            let last = this.last1();
            if (bit == last) this.set0(bit);
            else if (bit < last) {
                let m = FFFF_FFFF << bit;
                let v = this.values[index];
                v = v >>> 1 & m | v & ~m;
                while (++index < this._used) {
                    m = this.values[index];
                    this.values[index - 1] = (m & 1) << BITS - 1 | v;
                    v = m >>> 1;
                }
                this.values[index - 1] = v;
                this._used |= IO;
            }
        }

        // Function to fit the bit list to its actual size
        fit() {this.length = this.size;}

        // Property to get the total length of the bit list
        get length(): number { return super.length; }

        // Property setter to set the total length of the bit list
        set length(bits: number) {
            if (0 < bits) {
                if (bits < this._size) {
                    this.set0_(bits, this._size + 1);
                    this._size = bits;
                }
                const tmp = new Uint32Array(R.index(bits) + 1)
                tmp.set(this.values);
                this.values = tmp;
                this._used |= IO;
                return;
            }
            this._size = 0;
            this._used = 0;

            this.values = this.values.slice(0, R.index(-bits) + 1);
        }

        get size(): number {return this._size;}

        // Adjusts the size of the bit list by either clearing it, truncating it, or extending it with zeros.
        set size(new_size: number) {
            if (new_size < this.size)// If the new size is less than the current size:
                if (new_size < 1) this.clear();
                else {  // Otherwise, set all bits from the new size up to the current size to 0, then update the size.
                    this.set0_(new_size - 1, this.size);
                    this._size = new_size;
                }
            else if (this.size < new_size)// If the new size is greater than the current size, extend the bit list with zeros up to the new size.
                this.set0(new_size - 1);
        }
    }
}

export default BitList;
