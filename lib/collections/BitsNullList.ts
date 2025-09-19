// Copyright 2025 Chikirev Sirguy, Unirail Group
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// For inquiries, please contact: al8v5C6HU4UtqE9@gmail.com
// GitHub Repository: https://github.com/AdHoc-Protocol

import BitsList from "./BitsList";
import AdHoc from "../AdHoc";


export namespace BitsNullList {
    /**
     * Abstract class representing a read-only list of bits that supports null (or undefined) values.
     * Extends BitsList._R to inherit bit storage and manipulation logic.
     *
     * @abstract
     * @extends BitsList._R
     */
    export abstract class R extends BitsList._R {
        /**
         * @protected
         * @readonly
         * The value used internally to represent undefined or null within the bit array.
         * This value should be outside the valid range of normal data values for the bit field.
         */
        protected readonly undefined_val: number;

        /**
         * Constructor for the BitsNullList.R class.
         *
         * @param bits_per_item {number} The number of bits to allocate for each item in the list.
         * @param null_val {number} The value to use internally to represent null/undefined. This should be a value that will not be used for actual data.
         * @param [size] {number} Initial size of the list (number of items).
         * @param [length] {number} Initial length of the underlying storage array (in words).
         * @param [default_value] {number} The default value to initialize new storage with, defaults to `null_val` if not provided.
         */
        protected constructor(bits_per_item: number, null_val: number, size?: number, length?: number, default_value?: number) {
            super(bits_per_item, default_value ?? null_val, size, length);
            this.undefined_val = null_val;//Value representing undefined/null. Initialized with the provided `null_val`.
        }

        /**
         * Gets the last element in the list. Returns `undefined` if the last element is the null value.
         * @returns {(number | undefined)} The last element in the list, or `undefined` if it's a null value or the list is empty.
         */
        get last(): number | undefined {return this.get_(this._size - 1);}

        /**
         * Checks if the list contains the specified value (including undefined/null).
         * @param {(number | undefined)} value The value to check for.
         * @returns {boolean} True if the value is found in the list, false otherwise.
         */
        contains(value: number | undefined): boolean {
            return -1 < super._indexOf(value === undefined ?
                                       this.undefined_val :
                                       value);
        }

        /**
         * Returns the index of the first occurrence of the specified value (including undefined/null).
         * @param {(number | undefined)} value The value to search for.
         * @returns {number} The index of the first occurrence, or -1 if not found.
         */
        indexOf(value: number | undefined): number {
            return super._indexOf(value === undefined ?
                                  this.undefined_val :
                                  value)
        }

        /**
         * Returns the index of the last occurrence of the specified value (including undefined/null).
         * @param {(number | undefined)} value The value to search for.
         * @returns {number} The index of the last occurrence, or -1 if not found.
         */
        lastIndexOf(value: number | undefined): number {
            return super._lastIndexOf_(this._size, value === undefined ?
                                                   this.undefined_val :
                                                   value);
        }

        /**
         * Returns the index of the last occurrence of the specified value (including undefined/null), searching backwards from a given index.
         * @param {number} from The index to start searching backwards from.
         * @param {(number | undefined)} value The value to search for.
         * @returns {number} The index of the last occurrence, or -1 if not found.
         */
        lastIndexOf_(from: number, value: number | undefined) {
            return super._lastIndexOf_(from, value === undefined ?
                                             this.undefined_val :
                                             value)
        }

        /**
         * Checks if the element at the specified index is considered null or undefined.
         * @param {number} index The index to check.
         * @returns {boolean} True if the value at the index is null/undefined, false otherwise.
         */
        hasValue(index: number): boolean { return super.get_(index) === this.undefined_val; }

        /**
         * Gets the element at the specified index. Returns `undefined` if the element is the null value.
         * @param {number} index The index of the element to get.
         * @returns {(number | undefined)} The element at the specified index, or `undefined` if it's a null value.
         */
        get(index: number): number | undefined {
            const value = super.get_(index);
            return value == this.undefined_val ?
                   undefined :
                   value;
        }

        /**
         * Gets the raw underlying value at the specified index, regardless of whether it represents a null value.
         * Useful for internal operations where the raw representation is needed.
         * @param {number} index The index of the element to get the raw value from.
         * @returns {number} The raw value at the specified index.
         */
        public raw(index: number): number {return super.get_(index);}


        /**
         * @inheritdoc
         * @returns {string} The string tag "BitsNullList.RW".
         */
        get [Symbol.toStringTag]() { return "BitsNullList.RW" }

        /**
         * Generates a hash for the BitsNullList.R object.
         * @param {number} hash The initial hash value to start with.
         * @param {(R | undefined)} src The BitsNullList.R object to hash.
         * @returns {number} The computed hash value.
         */
        static hash(hash: number, src: R | undefined): number { return BitsList._R.hash(AdHoc.hash_number(hash, undefined), src);}

        /**
         * Checks if two BitsNullList.R objects are equal. They are considered equal if they have the same size,
         * the same elements in the same order, and the same undefined value representation.
         * @param {(R | undefined)} one The first BitsNullList.R object to compare.
         * @param {(R | undefined)} two The second BitsNullList.R object to compare.
         * @returns {boolean} True if the objects are equal, false otherwise.
         */
        static equals(one: R | undefined, two: R | undefined): boolean {
            return BitsList._R.equals(one, two) && (one === two || (one != undefined && two != undefined && one.undefined_val === two.undefined_val));
        }

        /**
         * @inheritdoc
         * @returns {string} A string representation of the bit array, including length and JSON output.
         */
        toString() { return `length = ${this.size}\n \n${this.toJSON()}` }

        /**
         * Returns a JSON representation of the bit array. Null values are represented as `null` in the JSON output.
         * @returns {Array<number | null>} An array containing the values of the bit list, with null values represented as `null`.
         */
        toJSON() {

            if (0 < this._size) {
                const result = new Array<number>();
                let src = this.values[0];

                for (let bp = 0, max = this._size * this.bits, _bit; bp < max; bp += this.bits)
                    result.push((BitsList.BITS < (_bit = BitsList.bit(bp)) + this.bits) ?
                                BitsList.value_(src, src = this.values[BitsList.index(bp) + 1], _bit, this.bits) :
                                BitsList.value(src, _bit, this.bits))

                return result;
            }

            return [] // Return an empty array if no elements
        }

        get size(): number {return this._size;}
    }

    /**
     * Class representing a read-write list of bits with support for null values.
     * Extends BitsNullList.R and provides methods to modify the list.
     *
     * @class
     * @extends BitsNullList.R
     */
    export class RW extends R {
        /**
         * Constructor for the BitsNullList.RW class.
         *
         * @param bits_per_item {number} The number of bits to allocate for each item.
         * @param null_val {number} The value to use internally to represent null/undefined.
         * @param [size] {number} Initial size of the list (number of items).
         * @param [length] {number} Initial length of the underlying storage array (in words).
         * @param [default_value] {number} The default value to initialize new storage with, defaults to `null_val` if not provided.
         */
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
         * Sets the value at the specified index.
         * @param index {number} The index to set the value at.
         * @param value {number | undefined} The value to set.
         */
        set1( index: number, value: number | undefined) {
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

        /**
         * @inheritdoc
         * @returns {number} The current size of the bit list.
         */
        get size(): number {return this._size;}

        /**
         * @inheritdoc
         * @param {number} size The new size of the bit list.
         */
        set size(size: number) {
            if (size < 1) this.clear();
            else if (this.size < size) this.set1(size - 1, this.default_value);
            else this._size = size;
        }
    }
}
export default BitsNullList;