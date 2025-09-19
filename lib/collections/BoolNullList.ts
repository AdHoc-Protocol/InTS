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

export namespace BoolNullList {
    /**
     * Abstract class representing a read-only list of boolean values that supports null/undefined.
     * Internally uses 2 bits per item to represent true, false, and undefined states.
     * Extends BitsList._R for bit storage and manipulation.
     *
     *  - 0: Represents `false`
     *  - 1: Represents `true`
     *  - 2: Represents `undefined` or `null`
     *
     * @abstract
     * @extends BitsList._R
     */
    export abstract class R extends BitsList._R {
        /**
         * Constructor for BoolNullList.R.
         *
         * @param [size] {number} Initial size of the list (number of boolean items).
         * @param [length] {number} Initial length of the underlying storage array (in words).
         * @param [default_value] {boolean | undefined} Default value to initialize new elements. `undefined` will be used as default if not provided.
         */
        protected constructor(size?: number, length?: number, default_value?: boolean | undefined) {
            // 2 bits per item are used to represent boolean and null states.
            super(2, default_value === undefined ?
                     2 : // Default to 'undefined' state (represented by 2) if default_value is undefined
                     default_value ?
                     1 : // If default_value is true, represent as 1
                     0,  // If default_value is false, represent as 0
                  size, length);
        }

        /**
         * Checks if the list contains the specified boolean value or undefined.
         *
         * @param {boolean | undefined} value The boolean value or undefined to search for.
         * @returns {boolean} True if the value is found in the list, false otherwise.
         */
        contains(value: boolean | undefined): boolean {
            return -1 < super._indexOf(value === undefined ?
                                       2 : // Represent undefined as 2 for internal search
                                       value ?
                                       1 : // Represent true as 1 for internal search
                                       0);  // Represent false as 0 for internal search
        }

        /**
         * Returns the index of the first occurrence of the specified boolean value or undefined.
         *
         * @param {boolean | undefined} value The boolean value or undefined to search for.
         * @returns {number} The index of the first occurrence, or -1 if not found.
         */
        indexOf(value: boolean | undefined): number {
            return super._indexOf(value === undefined ?
                                  2 : // Represent undefined as 2 for internal search
                                  value ?
                                  1 : // Represent true as 1 for internal search
                                  0);  // Represent false as 0 for internal search
        }

        /**
         * Returns the index of the last occurrence of the specified boolean value or undefined.
         *
         * @param {boolean | undefined} value The boolean value or undefined to search for.
         * @returns {number} The index of the last occurrence, or -1 if not found.
         */
        lastIndexOf(value: boolean | undefined): number {
            return super._lastIndexOf_(this._size, value === undefined ?
                                                   2 : // Represent undefined as 2 for internal search
                                                   value ?
                                                   1 : // Represent true as 1 for internal search
                                                   0);  // Represent false as 0 for internal search
        }

        /**
         * Returns the index of the last occurrence of the specified boolean value or undefined, starting the search from a given index.
         *
         * @param {number} from The index to start searching backwards from.
         * @param {boolean | undefined} value The boolean value or undefined to search for.
         * @returns {number} The index of the last occurrence, or -1 if not found.
         */
        lastIndexOf_(from: number, value: boolean | undefined) {
            return super._lastIndexOf_(from, value === undefined ?
                                             2 : // Represent undefined as 2 for internal search
                                             value ?
                                             1 : // Represent true as 1 for internal search
                                             0);  // Represent false as 0 for internal search
        }

        /**
         * Gets the boolean value or undefined at the specified index.
         *
         * @param {number} index The index of the element to retrieve.
         * @returns {boolean | undefined} The boolean value at the index, or undefined if the value is null/undefined in the list.
         */
        get(index: number): boolean | undefined {
            const value = super.get_(index);
            return value === 2 ?
                   undefined : // Return undefined if internal value is 2 (representing undefined/null)
                   value === 1;  // Return true if internal value is 1, otherwise (implicitly 0) return false
        }

        /**
         * Gets the raw underlying numeric value at the specified index (0, 1, or 2).
         *
         * @param {number} index The index of the element to retrieve the raw value from.
         * @returns {number} The raw numeric value (0, 1, or 2) at the specified index.
         */
        public raw(index: number): number {
            return super.get_(index);
        }

        /**
         * @inheritdoc
         * @returns {string} The string tag "BoolNullList.RW".
         */
        get [Symbol.toStringTag]() {
            return "BoolNullList.RW";
        }

        /**
         * Generates a hash code for the BoolNullList.R instance.
         * @param {number} hash The initial hash value.
         * @param {R | undefined} src The BoolNullList.R instance to hash.
         * @returns {number} The computed hash value.
         */
        static hash(hash: number, src: R | undefined): number {
            return BitsList._R.hash(AdHoc.hash_number(hash, undefined), src);
        }

        /**
         * Checks if two BoolNullList.R instances are equal.
         *
         * @param {R | undefined} one The first BoolNullList.R instance to compare.
         * @param {R | undefined} two The second BoolNullList.R instance to compare.
         * @returns {boolean} True if the instances are equal, false otherwise.
         */
        static equals(one: R | undefined, two: R | undefined): boolean {
            return BitsList._R.equals(one, two) && (one === two || one != undefined);
        }
    }

    export class RW extends R {
        /**
         * Constructor for BoolNullList.RW.
         *
         * @param [size] {number} Initial size of the list (number of boolean items).
         * @param [length] {number} Initial length of the underlying storage array (in words).
         * @param [default_value] {boolean | undefined} Default value to initialize new elements. `undefined` will be used as default if not provided.
         */
        public constructor(size?: number, length?: number, default_value?: boolean | undefined) {
            super(size, length, default_value);
        }

        /**
         * @inheritdoc
         * @returns {string} The string tag "BoolNullList.RW".
         */
        get [Symbol.toStringTag]() {
            return "BoolNullList.RW";
        }

        /**
         * Creates a copy of the list.
         *
         * @param {number} _bits_per_item  This parameter is ignored as BoolNullList always uses 2 bits per item.
         * @param {Uint8Array} values The values to initialize the new list with.
         * @returns {RW} A new RW instance with the copied values.
         * @deprecated The `bits_per_item` parameter is ignored for BoolNullList.
         */
        copy_of(_bits_per_item: number, values: Uint8Array): RW { // bits_per_item is ignored as it's fixed to 2
            let r = new RW(undefined, values.length); // size will be set by R.set_
            R.set_(r, 0, values);
            return r;
        }

        /**
         * Adds a boolean value or undefined to the end of the list.
         *
         * @param {boolean | undefined} value The boolean value or undefined to add.
         */
        add(value: boolean | undefined) {
            BitsList.R.add(this, value === undefined ?
                                 2 : // Represent undefined as 2 for internal storage
                                 value ?
                                 1 : // Represent true as 1 for internal storage
                                 0);  // Represent false as 0 for internal storage
        }

        /**
         * Inserts a boolean value or undefined at the specified index.
         *
         * @param {number} index The index to insert the value at.
         * @param {boolean | undefined} value The boolean value or undefined to insert.
         */
        add_(index: number, value: boolean | undefined) {
            R.add_(this, index, value === undefined ?
                                2 : // Represent undefined as 2 for internal storage
                                value ?
                                1 : // Represent true as 1 for internal storage
                                0);  // Represent false as 0 for internal storage
        }

        /**
         * Removes the element at the specified index.
         *
         * @param {number} item The index of the element to remove.
         */
        removeAt(item: number) {
            R.removeAt(this, item);
        }

        /**
         * Removes the last element from the list.
         */
        remove() {
            R.removeAt(this, this._size - 1);
        }

        /**
         * Removes all occurrences of the specified boolean value or undefined from the list.
         *
         * @param {boolean | undefined} value The boolean value or undefined to remove.
         */
        remove_(value: boolean | undefined) {
            R.remove(this, value === undefined ?
                           2 : // Represent undefined as 2 for internal removal
                           value ?
                           1 : // Represent true as 1 for internal removal
                           0);  // Represent false as 0 for internal removal
        }

        /**
         * Gets the last boolean value or undefined in the list.
         *
         * @returns {boolean | undefined} The last boolean value, or undefined if the last element is null/undefined or the list is empty.
         */
        get last(): boolean | undefined {
            const value = super.get_(this._size - 1);
            return value == 2 ?
                   undefined :
                   value == 1;
        }

        /**
         * Sets the last boolean value or undefined in the list.
         *
         * @param {boolean | undefined} value The boolean value or undefined to set as the last element.
         */
        set last(value: boolean | undefined) {
            R.set(this, this._size - 1, value === undefined ?
                                        2 : // Represent undefined as 2 for internal storage
                                        value ?
                                        1 : // Represent true as 1 for internal storage
                                        0);  // Represent false as 0 for internal storage
        }

        /**
         * Sets the boolean value or undefined at the last index.
         * @deprecated Consider using `last = value` for clarity.
         * @param {boolean | undefined} value The boolean value or undefined to set.
         */
        set1(value: boolean | undefined) {
            this.set1_(this.size - 1, value);
        }

        /**
         * Sets the boolean value or undefined at the specified index.
         * @deprecated Consider using `set_(index, value)` or `set(index, value)` for clarity and consistency.
         * @param {number} index The index to set the value at.
         * @param {boolean | undefined} value The boolean value or undefined to set.
         */
        set1_(index: number, value: boolean | undefined) {
            R.set(this, index, value === undefined ?
                               2 : // Represent undefined as 2 for internal storage
                               value ?
                               1 : // Represent true as 1 for internal storage
                               0);  // Represent false as 0 for internal storage
        }

        /**
         * Sets the raw numeric value (0, 1, or 2) at the specified index, bypassing boolean/undefined conversion.
         *
         * @param {number} index The index to set the raw value at.
         * @param {number} value The raw numeric value (0, 1, or 2) to set.
         */
        public raw_(index: number, value: number): void {
            R.set(this, index, value);
        }

        /**
         * Sets multiple boolean values or undefined starting from the specified index.
         *
         * @param {number} index The starting index to set values from.
         * @param {(boolean | undefined)[]} src An array of boolean values or undefined to set.
         * @returns {RW} The RW instance for chaining.
         */
        set(index: number, ...src: (boolean | undefined)[]): RW {
            return this.set_(index, src);
        }

        /**
         * Sets boolean values or undefined from an array-like object starting at the specified index.
         *
         * @param {number} index The starting index to set values from.
         * @param {ArrayLike<boolean | undefined>} values An array-like object of boolean values or undefined.
         * @returns {RW} The RW instance for chaining.
         */
        set_(index: number, values: ArrayLike<boolean | undefined>): RW {
            for (let i = 0; i < values.length; i++) {
                const value = values[i];
                R.set(this, index + i, value === undefined ?
                                   2 : // Represent undefined as 2 for internal storage
                                   value ?
                                   1 : // Represent true as 1 for internal storage
                                   0);  // Represent false as 0 for internal storage
            }
            return this;
        }

        /**
         * Retains only the elements that are present in the specified BoolNullList.R instance.
         *
         * @param {R} chk The BoolNullList.R instance to check against.
         * @returns {boolean} True if the list was modified, false otherwise.
         */
        retainAll(chk: R): boolean {
            let fix = this._size;
            let v;
            for (let item = 0; item < this._size; item++) if (!chk.contains((v = this.get(item)))) R.remove(this, v === undefined ?
                                                                                                                  2 :
                                                                                                                  v ?
                                                                                                                  1 :
                                                                                                                  0);
            return fix != this._size;
        }

        clear() {
            super.clear();
        }

        /**
         * @inheritdoc
         * @returns {number} The length of the list in terms of number of items.
         */
        get length(): number {
            return ((this.values.length * BitsList.BITS) / this.bits) | 0;
        }

        set length(items: number) {
            super.set_length(items);
        }

        fit() {
            this.length = -this._size;
        }
    }
}
export default BoolNullList;
