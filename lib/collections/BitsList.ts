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

import AdHoc from "../AdHoc";

export namespace BitsList {

    // Generates a mask of a given number of bits
    export function mask(bits: number): number {return (1 << bits) - 1;}

    // Returns the length of the bit field
    export function length(src: number) {return src >>> 3;}

    // Returns the index in the bit array for a given item and bit position
    export function index(item_X_bits: number) {return item_X_bits >> LEN;}

    // Returns the bit position within a word
    export function bit(item_X_bits: number): number {return item_X_bits & MASK;}

    // Extracts a value from a bit field
    export function value(src: number, bit: number, bits: number) {return src >>> bit & mask(bits);}

    // Combines values from two consecutive bit fields
    export function value_(prev: number, next: number, bit: number, bits: number) {return ((next & mask(bit + bits - BITS)) << BITS - bit | prev >>> bit) & mask(bits);}

    export const LEN = 5;
    export const BITS = 1 << LEN;//32 bits
    export const MASK = BITS - 1;

    // Calculates the length needed to store a given number of bits
    function len4bits(bits: number) {return (bits + BITS) >>> LEN;}

    const O = new Uint32Array(0); // Zeroed array

    export abstract class _R {
        protected values: Uint32Array = O;
        protected _size = 0;

        // Returns the number of elements
        get size(): number {return this._size;}

        set size(value: number) {}

        protected readonly mask: number;

        readonly bits: number;
        readonly default_value;

        // Constructor to initialize bit array with specified bits per item and optional default value
        constructor(bits_per_item: number, default_value?: number, size?: number, length?: number) {
            this.mask = mask(this.bits = bits_per_item);

            this.default_value = default_value ?? 0 & 0xFF

            // Initialize length and values array
            if (length === undefined || length < 1) length = size;
            if (length === undefined || length < 1) return;
            this.values = new Uint32Array(length)

            if (!size) return

            if (!default_value)
                R.set(this, size - 1, 0)
            else
                while (-1 < --size)
                    R.set(this, size, this.default_value)
        }

        // Returns the length in terms of the number of elements that can be stored
        get length() {return this.values.length * BITS / this.bits | 0;}

        // Sets the length of the bit array
        //if 0 < items - fit storage space according `items` param
        //if items < 0 - cleanup and allocate spase
        protected set length(items: number) { this.set_length(items)}

        // Adjusts the storage length based on the number of items
        protected set_length(items: number) {
            if (0 < items) {

                if (items < this._size) this._size = items;
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
                        this._size = 0;
                        return
                    }
                }

            this.clear()
        }

        // Clears the bit array
        protected clear() {
            if (this.default_value == 0)//can do it fast
                for (let i = Math.min(index(this.bits * this.size), this.values.length - 1); -1 < i; i -= 4) this.values[i] = 0;
            this._size = 0;
        }

        get isEmpty() {return this._size == 0;}

        // Adds a value to the bit array
        protected static add(dst: _R, src: number) {this.set(dst, dst._size, src);}

        // Adds a value at a specific index in the bit array
        protected static add_(dst: _R, item: number, value: number) {
            if (dst._size <= item) { // If the item index is greater than the current size
                R.set(dst, item, value); // Set the value directly
                return;
            }
            let p = item * dst.bits; // Calculate the bit position
            item = index(p); // Calculate the array index
            let src = dst.values; // Reference to the source values
            let dst_ = dst.values; // Reference to the destination values
            if (dst.length * BITS < p) dst.length = (Math.max(dst.length + dst.length / 2 | 0, len4bits(p))); // Resize the array if needed
            let v = value & dst.mask; // Mask the value
            let Bit = bit(p); // Calculate the bit offset
            if (0 < Bit) {
                let i = src[item]; // Get the current value
                let k = BITS - Bit; // Remaining bits in the current value
                if (k < dst.bits) {
                    dst_[item] = (i << k) >>> k | v << Bit; // Insert part of the value
                    v = v >> k | i >> Bit << dst.bits - k; // Shift the remaining value
                } else {
                    dst_[item] = (i << k) >>> k | v << Bit | i >>> Bit << Bit + dst.bits; // Insert the value and shift bits
                    v = i >>> Bit + dst.bits | src[item + 1] << k - dst.bits & dst.mask; // Prepare the remaining value
                }
                item++;
            }
            dst._size++; // Increase the size
            for (let max = len4bits(dst._size * dst.bits); ;) {
                let i = src[item]; // Get the current value
                dst_[item] = i << dst.bits | v; // Insert the value
                if (max < ++item) break; // Exit if the max index is reached
                v = i >>> BITS - dst.bits; // Prepare the remaining value
            }
        }

        // Retrieves the value at a specific index
        protected get_(item: number): number {
            let Index = index(item *= this.bits); // Calculate the array index
            let Bit = bit(item); // Calculate the bit offset
            return (BITS < Bit + this.bits ?
                    value_(this.values[Index], this.values[Index + 1], Bit, this.bits) : // Get value across two elements
                    value(this.values[Index], Bit, this.bits)); // Get value within a single element
        }

        // Sets a range of values from a source array
        protected static set_(dst: _R, from: number, src: ArrayLike<number>) {for (let i = src.length; -1 < --i;) R.set(dst, from + i, src[i]);}

        // Sets a value at a specific index
        protected static set(dst: _R, item: number, src: number) {

            const total_bits = item * dst.bits

            if (item < dst._size) {// If the item index is within the current size
                const
                    v = src & dst.mask, // Mask the value
                    Index = index(total_bits), // Calculate the array index
                    Bit = bit(total_bits), // Calculate the bit offset
                    k = BITS - Bit, // Remaining bits in the current value
                    i = dst.values[Index]; // Get the current value at the index

                if (k < dst.bits) {
                    dst.values[Index] = (i << k) >>> k | v << Bit; // Insert part of the value
                    dst.values[Index + 1] = dst.values[Index + 1] >>> dst.bits - k << dst.bits - k | v >> k; // Insert the remaining part
                } else {
                    dst.values[Index] = ~(~0 >>> BITS - dst.bits << Bit) & i | v << Bit; // Insert the value within the current element
                }
                return;
            }

            if (dst.length <= item) // Resize the array if needed
                dst.length = (Math.max(dst.length + dst.length / 2 | 0, len4bits(total_bits + dst.bits)));

            if (dst.default_value != 0) // Fill with default value up to the item index
                for (let i = dst.size; i < item; i++) R.append(dst, i, dst.default_value);

            R.append(dst, item, src);// Append the value at the specified index

            dst._size = item + 1; // Update the size
        }

        // Appends a value to the destination bit array
        private static append(dst: _R, item: number, src: number) {
            const
                v = src & dst.mask, // Mask the source value
                p = item * dst.bits, // Calculate the bit position
                Index = index(p), // Get the index in the values array
                Bit = bit(p), // Get the bit offset within the value
                k = BITS - Bit, // Calculate the remaining bits in the current value
                i = dst.values[Index]; // Get the current value at the index

            if (k < dst.bits) { // If bits to insert cross the boundary of the current value
                dst.values[Index] = (i << k) >>> k | v << Bit; // Insert part of the value
                dst.values[Index + 1] = v >> k; // Insert the remaining part
            } else { // If bits to insert fit within the current value
                dst.values[Index] = ~(~0 << Bit) & i | v << Bit; // Insert the value
            }
        }

        // Removes a value at the specified item index in the destination bit array
        protected static removeAt(dst: _R, item: number) {
            if (item + 1 == dst._size) { // If the item is the last one
                if (dst.default_value == 0) R.append(dst, item, 0); // Zero the place if needed
                dst._size--; // Decrease the size
                return;
            }
            let Index = index(item *= dst.bits); // Calculate the starting index
            const
                Bit = bit(item), // Calculate the starting bit
                k = BITS - Bit; // Remaining bits in the current value
            let i = dst.values[Index]; // Get the current value at the index
            if (Index + 1 == dst.length) { // If it's the last value in the array
                if (Bit == 0) dst.values[Index] = i >>> dst.bits; // Shift bits to the right
                else if (k < dst.bits) dst.values[Index] = (i << k) >>> k; // Mask the bits
                else if (dst.bits < k) dst.values[Index] = (i << k) >>> k | i >>> Bit + dst.bits << Bit; // Mask and shift bits
                dst._size--; // Decrease the size
                return;
            }
            if (Bit == 0) dst.values[Index] = i >>>= dst.bits; // If starting bit is 0, shift the bits
            else if (k < dst.bits) {
                let ii = dst.values[Index + 1];
                dst.values[Index] = (i << k) >>> k | ii >>> Bit + dst.bits - BITS << Bit; // Combine bits from the next value
                dst.values[++Index] = i = ii >>> dst.bits; // Update the index and value
            } else if (dst.bits < k)
                if (Index + 1 == dst.values.length) {
                    dst.values[Index] = (i << k) >>> k | i >>> Bit + dst.bits << Bit; // Combine bits within the value
                    dst._size--; // Decrease the size
                    return;
                } else {
                    let ii = dst.values[Index + 1];
                    dst.values[Index] = (i << k) >>> k | i >>> Bit + dst.bits << Bit | ii << BITS - dst.bits; // Combine bits across values
                    dst.values[++Index] = i = ii >>> dst.bits; // Update the index and value
                }
            let f = Index;
            for (let max = dst._size * dst.bits >>> LEN; Index < max;) {
                let ii = dst.values[Index + 1];
                dst.values[Index] = i << dst.bits >>> dst.bits | ii << BITS - dst.bits; // Shift bits and combine with the next value
                dst.values[++Index] = i = ii >>> dst.bits; // Update the index and value
            }
            dst._size--; // Decrease the size
        }

        // Returns the index of the specified value in the bit array
        protected _indexOf(value: number): number {
            for (let item = 0, max = this._size * this.bits; item < max; item += this.bits)
                if (value == this.get_(item)) return item / this.bits | 0; // Return the index if value matches
            return -1; // Return -1 if value not found
        }

        // Returns the last index of the specified value starting from the given index
        protected _lastIndexOf_(from: number, value: number) {
            for (let i = Math.max(from, this._size); -1 < --i;)
                if (value == this.get_(i)) return i; // Return the index if value matches
            return -1; // Return -1 if value not found
        }

        // Removes all occurrences of the specified value from the bit array
        protected static remove(dst: _R, value: number) {
            for (let i = dst._size; -1 < (i = dst._lastIndexOf_(i, value));)
                this.removeAt(dst, i); // Remove the value at the found index
        }

        // Returns a string representation of the bit array
        toString() { return `length = ${this.size}\n \n${this.toJSON()}` }

        // Returns a JSON representation of the bit array
        toJSON() {

            if (0 < this._size) {
                const result = new Array<number>();
                let src = this.values[0];

                for (let bp = 0, max = this._size * this.bits, _bit; bp < max; bp += this.bits)
                    result.push((BITS < (_bit = bit(bp)) + this.bits) ?
                                value_(src, src = this.values[index(bp) + 1], _bit, this.bits) :
                                value(src, _bit, this.mask))

                return result;
            }

            return [] // Return an empty array if no elements
        }

        // Checks if two bit arrays are equal
        static equals(one: _R | undefined, two: _R | undefined): boolean {
            if (one === two) return true; // Return true if both are the same object
            if (!one || !two || one._size !== two._size) return false; // Return false if either is undefined or sizes differ

            let i = index(one._size);
            const mask = (1 << bit(one._size)) - 1;
            if ((one.values[i] & mask) != (two.values[i] & mask)) return false; // Check the last partial element
            while (-1 < --i)
                if (one.values[i] != two.values[i]) return false; // Check all other elements
            return true; // Return true if all elements match
        }

        // Computes a hash code for the bit array
        static hash(hash: number, src: _R | undefined): number {
            if (!src) return hash; // Return the hash if src is undefined
            let length = index(src._size);
            const mask = (1 << bit(src._size)) - 1; // Last partial element mask

            switch (length) {
                case 0:
                    return AdHoc.finalizeHash(hash, 0); // Finalize hash for empty array
                case 1:
                    return AdHoc.finalizeHash(AdHoc.mix(hash, AdHoc.hash_number(hash, src.values[0] & mask)), 1); // Finalize hash for single element
            }
            hash = AdHoc.mix(hash, AdHoc.hash_number(hash, src.values[length] & mask)); // Process partial element

            return AdHoc.hash_array(hash, src.values, AdHoc.hash_number, length - 1); // Process all other elements
        }
    }

    export abstract class R extends _R {

// Returns the number of elements
        get size(): number {return this._size;}


        // Retrieves the value at the specified index
        public get(index: number): number {return this.get_(index);}

        // Returns the class name for string tag
        get [Symbol.toStringTag]() { return "BitsList.R" }

        // Retrieves the last value in the list
        get last(): number {return this.get_(this._size - 1);}

        // Checks if the list contains the specified value
        contains(value: number): boolean {return -1 < this._indexOf(value);}

        // Returns the index of the first occurrence of the value
        indexOf(value: number): number { return this._indexOf(value)}

        // Returns the index of the last occurrence of the value
        lastIndexOf(value: number): number {return super._lastIndexOf_(this._size, value);}

        // Returns the index of the last occurrence of the value from a given index
        lastIndexOf_(from: number, value: number) {return super._lastIndexOf_(from, value)}

        // Converts the list to a Uint8Array
        toArray(dst: Uint8Array | undefined): Uint8Array {
            if (this._size == 0) return new Uint8Array(0);
            if (dst == undefined || dst.length < this._size) dst = new Uint8Array(this._size);
            for (let item = 0, max = this._size * this.bits; item < max; item += this.bits)
                dst[item / this.bits | 0] = this.get_(item);
            return dst;
        }

        // Calculates the hash code for the given list
        static hash(hash: number, src: R | undefined): number { return _R.hash(AdHoc.hash_number(hash, undefined), src); }

        // Compares two lists for equality
        static equals(one: R | undefined, two: R | undefined): boolean { return _R.equals(one, two); }

    }

    export class RW extends R {

        // Constructor for RW class
        constructor(bits_per_item: number, default_value?: number, size?: number, length?: number) {super(bits_per_item, default_value, size, length);}

        // Returns the class name for string tag
        get [Symbol.toStringTag]() { return "BitsList.RW" }

        // Creates a copy of the current object with specified bit size and values
        copy_of(bits_per_item: number, values: Uint8Array): RW {
            let r = new RW(bits_per_item, undefined, undefined, values.length);
            R.set_(r, 0, values);
            return r
        }

        // Adds a value to the list
        add(value: number) {R.add(this, value);}

        // Adds a value at the specified index in the list
        add_(index: number, src: number) {R.add_(this, index, src);}

        // Removes a value at the specified index
        removeAt(item: number) {R.removeAt(this, item);}

        // Removes the last value in the list
        remove() {R.removeAt(this, this._size - 1);}

        // Removes all instances of the specified value in the list
        remove_(value: number) {R.remove(this, value);}

        // Retrieves the last value in the list
        get last(): number {return this.get_(this._size - 1);}

        // Sets the last value in the list
        set last(value: number) {R.set(this, this._size - 1, value);}

        // Sets the last value in the list to the specified value
        set1(value: number) {this.set1_(this.size - 1, value);}

        // Sets the value at the specified index in the list
        set1_(item: number, value: number) {R.set(this, item, value);}

        // Sets multiple values starting from the specified index
        set(index: number, ...src: number[]): RW {
            R.set_(this, index, src);
            return this;
        }
        // Set values starting from a specified index using an array-like object
        set_(index: number, src: ArrayLike<(number)>, src_index: number = 0, len: number = src.length): RW {

            for (let i = len; -1 < --i;)
                R.set(this, index + i, src[src_index + i])
            return this
        }

        // Retains only the values in the list that are contained in the specified collection
        retainAll(chk: R): boolean {
            let fix = this._size;
            let v;
            for (let item = 0; item < this._size; item++)
                if (!chk.contains(v = this.get_(item))) R.remove(this, v);
            return fix != this._size;
        }

        // Clears the list
        clear() {super.clear();}

        // Retrieves the length of the list
        get length() {return this.values.length * BITS / this.bits | 0;}

        get size(): number {return this._size;}
        set size(size: number) {
            if (size < 1) this.clear();
            else if (this.size < size) this.set1_(size - 1, this.default_value);
            else this._size = size;
        }

        // Sets the length of the list
        set length(items: number) { this.set_length(items)}

        // Adjusts the list to fit the number of items
        fit() {this.length = (-this._size);}

    }
}

export default BitsList;