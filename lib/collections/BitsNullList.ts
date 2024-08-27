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

import BitsList from "./BitsList";
import AdHoc from "../AdHoc";


export namespace BitsNullList {
    /**
     * Abstract class representing a list of bits with support for null values.
     */
    export abstract class R extends BitsList._R {
        protected readonly undefined_val: number;

        // Constructor
        protected constructor(bits_per_item: number, null_val: number, size?: number, length?: number, default_value?: number) {
            super(bits_per_item, default_value ?? null_val, size, length);
            this.undefined_val = null_val;
        }

        /**
         * Gets the last element in the list.
         * @returns {number | undefined} The last element or undefined.
         */
        get last(): number | undefined {return this.get_(this._size - 1);}

        /**
         * Checks if the list contains the specified value.
         * @param value {number | undefined} The value to check for.
         * @returns {boolean} True if the value is found, false otherwise.
         */
        contains(value: number | undefined): boolean {
            return -1 < super._indexOf(value === undefined ?
                                       this.undefined_val :
                                       value);
        }

        /**
         * Returns the index of the first occurrence of the specified value.
         * @param value {number | undefined} The value to search for.
         * @returns {number} The index of the value or -1 if not found.
         */
        indexOf(value: number | undefined): number {
            return super._indexOf(value === undefined ?
                                  this.undefined_val :
                                  value)
        }

        /**
         * Returns the index of the last occurrence of the specified value.
         * @param value {number | undefined} The value to search for.
         * @returns {number} The index of the value or -1 if not found.
         */
        lastIndexOf(value: number | undefined): number {
            return super._lastIndexOf_(this._size, value === undefined ?
                                                   this.undefined_val :
                                                   value);
        }

        /**
         * Returns the index of the last occurrence of the specified value, starting from a given index.
         * @param from {number} The index to start searching from.
         * @param value {number | undefined} The value to search for.
         * @returns {number} The index of the value or -1 if not found.
         */
        lastIndexOf_(from: number, value: number | undefined) {
            return super._lastIndexOf_(from, value === undefined ?
                                             this.undefined_val :
                                             value)
        }

        /**
         * Checks if the specified index has a null value.
         * @param index {number} The index to check.
         * @returns {boolean} True if the value at the index is null, false otherwise.
         */
        hasValue(index: number): boolean { return super.get_(index) == this.undefined_val; }

        /**
         * Gets the element at the specified index.
         * @param index {number} The index of the element to get.
         * @returns {number | undefined} The element or undefined.
         */
        get(index: number): number | undefined {
            const value = super.get_(index);
            return value == this.undefined_val ?
                   undefined :
                   value;
        }

        /**
         * Gets the raw value at the specified index.
         * @param index {number} The index of the element to get.
         * @returns {number} The raw value.
         */
        public raw(index: number): number {return super.get_(index);}


        // Custom string tag for this class.
        get [Symbol.toStringTag]() { return "BitsNullList.RW" }

        /**
         * Generates a hash for the given object.
         * @param hash {number} The initial hash value.
         * @param src {R | undefined} The object to hash.
         * @returns {number} The computed hash value.
         */
        static hash(hash: number, src: R | undefined): number { return BitsList._R.hash(AdHoc.hash_number(hash, undefined), src);}

        /**
         * Checks if two objects are equal.
         * @param one {R | undefined} The first object to compare.
         * @param two {R | undefined} The second object to compare.
         * @returns {boolean} True if the objects are equal, false otherwise.
         */
        static equals(one: R | undefined, two: R | undefined): boolean {return BitsList._R.equals(one, two) && (one === two || (one != undefined && one!.undefined_val === two!.undefined_val)); }

        // Returns a string representation of the bit array
        toString() { return `length = ${this.size}\n \n${this.toJSON()}` }

        // Returns a JSON representation of the bit array
        toJSON() {

            if (0 < this._size) {
                const result = new Array<number>();
                let src = this.values[0];

                for (let bp = 0, max = this._size * this.bits, _bit; bp < max; bp += this.bits)
                    result.push((BitsList.BITS < (_bit = BitsList.bit(bp)) + this.bits) ?
                                BitsList.value_(src, src = this.values[BitsList.index(bp) + 1], _bit, this.bits) :
                                BitsList.value(src, _bit, this.mask))

                return result;
            }

            return [] // Return an empty array if no elements
        }

        get size(): number {return this._size;}
    }

    /**
     * Class representing a read-write list of bits with support for null values.
     */
    export class RW extends R {
        public constructor(bits_per_item: number, null_val: number, size?: number, length?: number, default_value?: number) {
            super(bits_per_item, null_val, size, length, default_value);
        }

        // Custom string tag for this class.
        get [Symbol.toStringTag]() { return "BitsNullList.RW" }

        /**
         * Creates a copy of the list with the specified bit length and values.
         * @param bits_per_item {number} The number of bits per item.
         * @param values {Uint8Array} The values to copy.
         * @returns {RW} A new RW instance with the copied values.
         */
        copy_of(bits_per_item: number, values: Uint8Array): RW {
            let r = new RW(bits_per_item, values.length);
            R.set_(r, 0, values);
            return r
        }

        /**
         * Adds a value to the end of the list.
         * @param value {number | undefined} The value to add.
         */
        add(value: number | undefined) {
            BitsList.R.add(this, value === undefined ?
                                 this.undefined_val :
                                 value);
        }

        /**
         * Inserts a value at the specified index.
         * @param index {number} The index to insert the value at.
         * @param value {number | undefined} The value to insert.
         */
        add_(index: number, value: number | undefined) {
            R.add_(this, index, value === undefined ?
                                this.undefined_val :
                                value);
        }

        /**
         * Removes the element at the specified index.
         * @param item {number} The index of the element to remove.
         */

        removeAt(item: number) {R.removeAt(this, item);}

        /**
         * Removes the last element from the list.
         */
        remove() {R.removeAt(this, this._size - 1);}

        /**
         * Removes the specified value from the list.
         * @param value {number | undefined} The value to remove.
         */
        remove_(value: number | undefined) {
            R.remove(this, value === undefined ?
                           this.undefined_val :
                           value);
        }

        /**
         * Gets the last element in the list.
         * @returns {number | undefined} The last element or undefined.
         */
        get last(): number | undefined {
            const value = super.get_(this._size - 1);
            return value == this.undefined_val ?
                   undefined :
                   value;
        }

        /**
         * Sets the last element in the list.
         * @param value {number | undefined} The value to set.
         */
        set last(value: number | undefined) {
            R.set(this, this._size - 1, value === undefined ?
                                        this.undefined_val :
                                        value);
        }

        /**
         * Sets the value at the last index.
         * @param value {number | undefined} The value to set.
         */
        set1(value: number | undefined) { this.set1_(this.size - 1, value);}

        /**
         * Sets the value at the specified index.
         * @param index {number} The index to set the value at.
         * @param value {number | undefined} The value to set.
         */
        set1_(index: number, value: number | undefined) {
            R.set(this, index, value === undefined ?
                               this.undefined_val :
                               value);
        }

        /**
         * Sets the raw value at the specified index.
         * @param index {number} The index to set the value at.
         * @param value {number} The value to set.
         */
        public raw_(index: number, value: number): void { R.set(this, index, value); }

        /**
         * Sets values starting from the specified index.
         * @param index {number} The index to start setting values from.
         * @param src {ArrayLike<number | undefined>} The values to set.
         * @returns {RW} The updated RW instance.
         */
        set(index: number, ...src: (number | undefined)[]): RW { return this.set_(index, src);}


        /**
         * Sets values starting from the specified index.
         * @param index {number} The index to start setting values from.
         * @param src {ArrayLike<number | undefined>} The values to set.
         * @param src_index
         * @param len
         * @returns {RW} The updated RW instance.
         */
        set_(index: number, src: ArrayLike<number | undefined>, src_index: number = 0, len: number = src.length): RW {
            for (let i = len; -1 < --i;) {
                const value = src[src_index + i];
                R.set(this, index + i, value === undefined ?
                                       this.undefined_val :
                                       value);
            }
            return this;
        }

        /**
         * Retains only the elements that are contained in the specified list.
         * @param chk {R} The list to check against.
         * @returns {boolean} True if the list was modified, false otherwise.
         */
        retainAll(chk: R): boolean {
            let fix = this._size;
            let v;
            for (let item = 0; item < this._size; item++)
                if (!chk.contains(v = this.get_(item))) R.remove(this, v);
            return fix != this._size;
        }

        /**
         * Clears all elements from the list.
         */
        clear() {super.clear();}

        /**
         * Gets the length of the list in terms of number of items.
         * @returns {number} The length of the list.
         */
        get length(): number {return this.values.length * BitsList.BITS / this.bits | 0;}

        /**
         * Sets the length of the list.
         * @param items {number} The new length of the list.
         */
        set length(items: number) { super.set_length(items); }

        /**
         * Adjusts the length of the list to fit the actual size.
         */
        fit() { this.length = (-this._size); }

        get size(): number {return this._size;}

        set size(size: number) {
            if (size < 1) this.clear();
            else if (this.size < size) this.set1_(size - 1, this.default_value);
            else this._size = size;
        }
    }
}
export default BitsNullList;