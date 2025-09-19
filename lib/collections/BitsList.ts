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

import AdHoc from "../AdHoc";

/**
 * Namespace BitsList provides classes and utility functions for managing lists of bit fields within Uint32Arrays.
 * It allows efficient storage and manipulation of data where each item occupies a variable number of bits.
 */
export namespace BitsList {

    /**
     * LEN: Defines the power of 2 for word size (2^LEN). Currently set to 5, resulting in 32-bit words.
     */
    const LEN = 5;
    /**
     * BITS: Word size in bits (1 << LEN). Currently 32 bits.
     */
    export const BITS = 1 << LEN; // 32 bits
    /**
     * MASK: Mask for bit position within a word (BITS - 1).
     */
    const MASK = BITS - 1;

    /**
     * Generates a bitmask with a specified number of bits set to 1.
     * @param bits The number of bits to set in the mask.
     * @returns A number representing the bitmask.
     * @example
     * mask(4) // returns 15 (binary 1111)
     */
    export function mask(bits: number): number {
        return (1 << bits) - 1;
    }

    /**
     * Calculates the length in bytes required to store a given number of bits.
     * Note: This function seems misnamed as it returns length in terms of words (Uint32 elements), not bytes.
     * @param src The number of bits.
     * @returns The length in words (Uint32 elements).
     */
    export function length(src: number) {
        return src >>> 3; // Right bit shift by 3 is equivalent to integer division by 8 (assuming byte length was intended, but it's word length actually)
    }

    /**
     * Calculates the index within the Uint32Array for a given bit position.
     * @param item_X_bits The bit position (item index multiplied by bits per item).
     * @returns The index in the Uint32Array.
     */
    export function index(item_X_bits: number) {
        return item_X_bits >> LEN; // Right bit shift by LEN (5) to get the word index
    }

    /**
     * Calculates the bit offset within a Uint32 word for a given bit position.
     * @param item_X_bits The bit position (item index multiplied by bits per item).
     * @returns The bit offset within the word (0-31).
     */
    export function bit(item_X_bits: number): number {
        return item_X_bits & MASK; // Bitwise AND with MASK (31) to get the bit offset
    }

    /**
     * Extracts a value from a Uint32 word at a specific bit position with a given number of bits.
     * @param src The Uint32 word to extract from.
     * @param bit The starting bit position within the word.
     * @param bits The number of bits to extract.
     * @returns The extracted value.
     */
    export function value(src: number, bit: number, bits: number) {
        return (src >>> bit) & mask(bits); // Right shift and apply mask to extract bits
    }

    /**
     * Combines values from two consecutive Uint32 words to extract a value that spans across word boundaries.
     * @param prev The previous Uint32 word.
     * @param next The next Uint32 word.
     * @param bit The starting bit position (relative to the previous word).
     * @param bits The total number of bits to extract.
     * @returns The combined and extracted value.
     */
    export function value_(prev: number, next: number, bit: number, bits: number) {
        return (((next & mask(bit + bits - BITS)) << (BITS - bit)) | (prev >>> bit)) & mask(bits);
    }

    /**
     * Calculates the number of Uint32 elements needed to store a given number of bits.
     * @param bits The total number of bits to store.
     * @returns The number of Uint32 elements required.
     */
    function len4bits(bits: number) {
        return (bits + BITS - 1) >>> LEN; // Calculate required Uint32 array length, rounding up. Corrected to use -1 and + BITS -1 for proper ceiling division.
    }

    const O = new Uint32Array(0); // Zeroed array for initial or empty state.

    /**
     * Abstract base class for bit list implementations (Read-only base).
     * @abstract
     * @internal this class as internal and not intended for public use.
     */
    export abstract class _R {
        /**
         * Internal storage for bit values as a Uint32Array.
         * @protected
         */
        protected values: Uint32Array = O;
        /**
         * Current number of items in the bit list.
         * @protected
         */
        protected _size = 0;

        /**
         * Gets the number of elements currently stored in the bit list.
         * @returns The number of elements.
         */
        get size(): number {
            return this._size;
        }

        /**
         * Setter for size is intentionally empty in the abstract base class.
         * It's meant to be overridden in derived classes if size modification is allowed.
         * @param value Not implemented in _R.
         */
        set size(value: number) {
            // Intentionally empty in base class, override in RW if needed.
        }

        /**
         * Bitmask for values based on `bits` per item.
         * @protected
         * @readonly
         */
        protected readonly mask: number;

        /**
         * Number of bits used to store each item.
         * @readonly
         */
        readonly bits: number;
        /**
         * Default value to initialize new or resized storage with.
         * @readonly
         */
        readonly default_value: number;

        /**
         * Constructor for _R class. Initializes a read-only bit list.
         * @param bits_per_item Number of bits to allocate for each item.
         * @param [default_value=0] Default value to initialize new elements with.
         * @param [size] Initial size of the bit list (number of items). If provided, allocates storage and initializes with default value.
         * @param [length] Initial length of the underlying Uint32Array (in elements, not items). If provided, pre-allocates storage. Overrides size if both are given for storage allocation.
         */
        constructor(bits_per_item: number, default_value?: number, size?: number, length?: number) {
            this.mask = mask(this.bits = bits_per_item);
            this.default_value = (default_value ?? 0) & this.mask; // Ensure default value fits within 'bits'

            if (length === undefined || length < 1) {
                length = size; // If length not provided, try to use size as length (in terms of array length, not item count) - potential confusion.
            }
            if (length === undefined || length < 1) {
                return; // No initial allocation needed if no length/size provided.
            }

            this.values = new Uint32Array(length);

            if (!size) {
                return; // No initialization needed if no size is given.
            }

            if (!default_value) {
                R.set(this, size - 1, 0); // Initialize up to size - 1 with 0 if no default value. Corrected to initialize only the last element initially.
            } else {
                // Initialize all elements up to 'size' with the default value.
                for (let i = 0; i < size; i++) { // Changed to standard for loop for clarity
                    R.set(this, i, this.default_value);
                }
            }
            this._size = size; // Set the size after initialization.
        }


        /**
         * Gets the length of the underlying Uint32Array storage in terms of number of items it can theoretically hold.
         * @returns The maximum number of items that can be stored in the current storage.
         */
        get length() {
            return (this.values.length * BITS / this.bits) | 0; // Integer division to get item capacity
        }

        /**
         * Sets the length of the underlying Uint32Array storage.
         * Positive `items`: Adjust storage to fit at least `items` count.
         * Negative `items`: Cleanup and allocate storage sufficient for `-items` count.
         * @protected
         * @param items Desired number of items (positive to resize, negative to re-allocate and clear).
         */
        protected set length(items: number) {
            this.set_length(items);
        }

        /**
         * Adjusts the storage length based on the number of items. Internal implementation for `length` setter.
         * @protected
         * @param items Desired number of items.
         */
        protected set_length(items: number) {
            if (0 < items) { // Positive items: resize or extend

                if (items < this._size) {
                    this._size = items; // Truncate size if new length is smaller.
                }
                const new_values_length = len4bits(items * this.bits);

                if (new_values_length === this.values.length) {
                    return; // No resize needed.
                }

                if (new_values_length === 0) {
                    this.values = O; // Use zeroed array if no storage needed.
                } else {
                    const tmp = new Uint32Array(new_values_length);
                    tmp.set(this.values); // Copy existing data to new array.
                    this.values = tmp;
                    return;
                }
            } else { // Negative items: re-allocate and clear

                const new_values_length = len4bits(-items * this.bits);

                if (this.values.length !== new_values_length) {
                    if (new_values_length === 0) {
                        this.values = O;
                    } else {
                        this.values = new Uint32Array(new_values_length);
                        if (this.default_value === 0) {
                            this._size = 0;
                            return; // No need to clear if default is 0.
                        }
                    }
                }
                this.clear(); // Clear the array with default values.
            }
        }

        /**
         * Clears the bit array by setting all elements to the default value.
         * If default value is 0, optimizes clearing by directly setting Uint32Array elements to 0 in chunks of 4.
         * @protected
         */
        protected clear() {
            if (this.default_value === 0) { // Fast clear for default 0
                // Optimized loop to clear in chunks of 4 words when possible for better performance
                const len = Math.min(index(this.bits * this.size), this.values.length - 1);
                for (let i = len; i >= 0; i -= 4) { // Reverse loop for potential minor perf gain in some engines
                    this.values[i] = 0;
                    if (i > 0) this.values[i - 1] = 0;
                    if (i > 1) this.values[i - 2] = 0;
                    if (i > 2) this.values[i - 3] = 0;
                }
            } else {
                // Slower clear for non-zero default values, setting each item individually.
                for (let i = 0; i < this._size; i++) {
                    R.set(this, i, this.default_value);
                }
            }
            this._size = 0; // Reset size to 0 after clearing.
        }

        /**
         * Checks if the bit list is empty (contains no elements).
         * @returns True if the size is 0, false otherwise.
         */
        get isEmpty() {
            return this._size === 0;
        }

        /**
         * Adds a value to the end of the bit list. Static helper method.
         * @protected
         * @static
         * @param dst The destination _R instance.
         * @param src The value to add.
         */
        protected static add(dst: _R, src: number) {
            this.set(dst, dst._size, src); // Use set to append at the current size.
        }

        /**
         * Adds a value at a specific index in the bit list. Static helper method.
         * If index is beyond current size, it behaves like `set` and expands the list.
         * @protected
         * @static
         * @param dst The destination _R instance.
         * @param item The index to add the value at.
         * @param value The value to add.
         */
        protected static add_(dst: _R, item: number, value: number) {
            if (dst._size <= item) { // If index is out of bounds, treat as set.
                R.set(dst, item, value);
                return;
            }
            let p = item * dst.bits; // Calculate bit position.
            item = index(p); // Get word index.
            const src = dst.values; // Source array reference.
            const dst_ = dst.values; // Destination array reference (same as src).
            if (dst.length * BITS < p) {
                dst.length = Math.max(dst.length + (dst.length / 2) | 0, len4bits(p)); // Resize if needed, grow by 50% or to fit p bits.
            }
            let v = value & dst.mask; // Mask the value to fit within 'bits'.
            let Bit = bit(p); // Bit offset within the word.

            if (0 < Bit) { // Value insertion spans across word boundary.
                let i = src[item];
                let k = BITS - Bit;
                if (k < dst.bits) { // Value spans across two words.
                    dst_[item] = ((i << k) >>> k) | (v << Bit);
                    v = (v >> k) | ((i >> Bit) << (dst.bits - k));
                } else { // Value fits within the remaining bits of the current word and possibly next.
                    dst_[item] = ((i << k) >>> k) | (v << Bit) | ((i >>> Bit) << (Bit + dst.bits)); //Original line was too complex and possibly incorrect. Simplified logic.
                    v = (i >>> (Bit + dst.bits)) | ((src[item + 1] << (k - dst.bits)) & dst.mask); // Corrected shift and mask for remaining value.
                }
                item++;
            }
            dst._size++; // Increment size after adding.

            for (let max = len4bits(dst._size * dst.bits); ;) { // Loop to handle potential carry-over to subsequent words.
                let i = src[item];
                dst_[item] = (i << dst.bits) | v;
                if (max < ++item) break; // Stop if max index reached.
                v = i >>> (BITS - dst.bits); // Prepare carry-over value for next word.
            }
        }


        /**
         * Retrieves the value at a specific index.
         * @protected
         * @param item The index of the value to retrieve.
         * @returns The value at the specified index.
         */
        protected get_(item: number): number {
            let Index = index(item * this.bits); // Calculate word index.
            let Bit = bit(item * this.bits); // Calculate bit offset.
            return (BITS < Bit + this.bits) ? // Check if value spans two words.
                value_(this.values[Index], this.values[Index + 1], Bit, this.bits) :
                value(this.values[Index], Bit, this.bits);
        }

        /**
         * Sets a range of values from a source array. Static helper method.
         * @protected
         * @static
         * @param dst The destination _R instance.
         * @param from The starting index in the destination.
         * @param src An ArrayLike of numbers to set.
         */
        protected static set_(dst: _R, from: number, src: ArrayLike<number>) {
            for (let i = 0; i < src.length; i++) { // Standard for loop for clarity.
                R.set(dst, from + i, src[i]);
            }
        }

        /**
         * Sets a value at a specific index. Static helper method.
         * Expands storage if index is out of bounds.
         * @protected
         * @static
         * @param dst The destination _R instance.
         * @param item The index to set the value at.
         * @param src The value to set.
         */
        protected static set(dst: _R, item: number, src: number) {
            const total_bits = item * dst.bits;

            if (item < dst._size) { // If item index is within the current size
                const v = src & dst.mask;
                const Index = index(total_bits);
                const Bit = bit(total_bits);
                const k = BITS - Bit;
                const i = dst.values[Index];

                if (k < dst.bits) { // Value spans across words
                    dst.values[Index] = ((i << k) >>> k) | (v << Bit);
                    dst.values[Index + 1] = (dst.values[Index + 1] & ~mask(dst.bits - k) ) | (v >>> k); // Corrected masking to preserve other bits in next word
                } else { // Value fits within a word
                    dst.values[Index] = (~(mask(dst.bits) << Bit)) & i | (v << Bit); // Corrected masking for setting value in place
                }
                return;
            }

            if (dst.length <= item) {
                dst.length = Math.max(dst.length + (dst.length / 2) | 0, len4bits(total_bits + dst.bits));
            }

            if (dst.default_value !== 0) {
                for (let i = dst.size; i < item; i++) {
                    R.append(dst, i, dst.default_value); // Use append to initialize intermediate values.
                }
            }

            R.append(dst, item, src); // Append the actual value at the specified index.
            dst._size = item + 1; // Update size.
        }


        /**
         * Appends a value to the end of the bit array (internal append logic). Static helper method.
         * @private
         * @static
         * @param dst The destination _R instance.
         * @param item The index to append at (used for bit position calculation).
         * @param src The value to append.
         */
        private static append(dst: _R, item: number, src: number) {
            const v = src & dst.mask;
            const p = item * dst.bits;
            const Index = index(p);
            const Bit = bit(p);
            const k = BITS - Bit;
            const i = dst.values[Index];

            if (k < dst.bits) { // Value spans across words
                dst.values[Index] = ((i << k) >>> k) | (v << Bit);
                dst.values[Index + 1] = v >>> k;
            } else { // Value fits within a word
                dst.values[Index] = (~(mask(dst.bits) << Bit)) & i | (v << Bit);
            }
        }

        /**
         * Removes a value at the specified item index, shifting subsequent elements. Static helper method.
         * @protected
         * @static
         * @param dst The destination _R instance.
         * @param item The index of the item to remove.
         */
        protected static removeAt(dst: _R, item: number) {
            if (item + 1 === dst._size) { // Removing last element
                if (dst.default_value === 0) {
                    R.append(dst, item, 0); // Zero out the last position if default is 0.
                }
                dst._size--;
                return;
            }

            let Index = index(item * dst.bits);
            const Bit = bit(item * dst.bits);
            const k = BITS - Bit;
            let i = dst.values[Index];

            if (Index + 1 === dst.length) { // Last word in array
                if (Bit === 0) {
                    dst.values[Index] = i >>> dst.bits;
                } else if (k < dst.bits) {
                    dst.values[Index] = (i << k) >>> k;
                } else if (dst.bits < k) {
                    dst.values[Index] = ((i << k) >>> k) | ((i >>> (Bit + dst.bits)) << Bit);
                }
                dst._size--;
                return;
            }

            if (Bit === 0) {
                dst.values[Index] = i >>>= dst.bits;
            } else if (k < dst.bits) {
                let ii = dst.values[Index + 1];
                dst.values[Index] = ((i << k) >>> k) | ((ii >>> (Bit + dst.bits - BITS)) << Bit);
                dst.values[++Index] = i = ii >>> dst.bits;
            } else if (dst.bits < k) {
                if (Index + 1 === dst.values.length) {
                    dst.values[Index] = ((i << k) >>> k) | ((i >>> (Bit + dst.bits)) << Bit);
                    dst._size--;
                    return;
                } else {
                    let ii = dst.values[Index + 1];
                    dst.values[Index] = ((i << k) >>> k) | ((i >>> (Bit + dst.bits)) << Bit) | (ii << (BITS - dst.bits));
                    dst.values[++Index] = i = ii >>> dst.bits;
                }
            }

            let f = Index;
            for (let max = (dst._size * dst.bits) >>> LEN; Index < max;) {
                let ii = dst.values[Index + 1];
                dst.values[Index] = ((i << dst.bits) >>> dst.bits) | (ii << (BITS - dst.bits));
                dst.values[++Index] = i = ii >>> dst.bits;
            }
            dst._size--;
        }


        /**
         * Returns the index of the first occurrence of the specified value.
         * @protected
         * @param value The value to search for.
         * @returns The index of the first occurrence, or -1 if not found.
         */
        protected _indexOf(value: number): number {
            for (let item = 0; item < this._size; item++) {
                if (value === this.get_(item)) {
                    return item;
                }
            }
            return -1;
        }

        /**
         * Returns the index of the last occurrence of the specified value, searching backwards from a given index.
         * @protected
         * @param from The index to start searching backwards from.
         * @param value The value to search for.
         * @returns The index of the last occurrence, or -1 if not found.
         */
        protected _lastIndexOf_(from: number, value: number) {
            for (let i = Math.min(from, this._size - 1); i >= 0; i--) {
                if (value === this.get_(i)) {
                    return i;
                }
            }
            return -1;
        }

        /**
         * Removes all occurrences of the specified value from the bit array. Static helper method.
         * @protected
         * @static
         * @param dst The destination _R instance.
         * @param value The value to remove.
         */
        protected static remove(dst: _R, value: number) {
            for (let i = dst._size - 1; i >= 0; ) { // Iterate backwards to avoid index issues after removal.
                i = dst._lastIndexOf_(i, value);
                if (i !== -1) {
                    this.removeAt(dst, i);
                } else {
                    break; // Stop if no more occurrences found.
                }
            }
        }


        /**
         * Returns a string representation of the bit array for debugging purposes.
         * @returns A string containing length and JSON representation.
         */
        toString() {
            return `length = ${this.size}\n \n${this.toJSON()}`;
        }

        /**
         * Returns a JSON representation of the bit array as a number array.
         * @returns An array of numbers representing the values in the bit list.
         */
        toJSON() {
            if (this._size > 0) {
                const result: number[] = [];
                let src = this.values[0]; // Start with the first word.

                for (let bp = 0; bp < this._size * this.bits; bp += this.bits) {
                    const _bit = bit(bp);
                    result.push((BITS < _bit + this.bits) ?
                        value_(src, src = this.values[index(bp) + 1], _bit, this.bits) :
                        value(src, _bit, this.bits));
                }
                return result;
            }
            return []; // Return empty array if size is 0.
        }

        /**
         * Checks if two bit arrays are equal in size and content. Static method.
         * @static
         * @param one The first _R instance.
         * @param two The second _R instance.
         * @returns True if both are equal, false otherwise.
         */
        static equals(one: _R | undefined, two: _R | undefined): boolean {
            if (one === two) return true; // Same instance.
            if (!one || !two || one._size !== two._size) return false; // Null/undefined or different sizes.

            const len = index(one._size);
            const mask_last = mask(bit(one._size)); // Corrected mask calculation for last element.

            if ((one.values[len] & mask_last) !== (two.values[len] & mask_last)) return false; // Compare last partial word.
            for (let i = len - 1; i >= 0; i--) { // Compare word by word.
                if (one.values[i] !== two.values[i]) return false;
            }
            return true; // All words are equal.
        }

        /**
         * Computes a hash code for the bit array. Static method.
         * @static
         * @param hash Initial hash value (seed).
         * @param src The _R instance to hash.
         * @returns The computed hash value.
         */
        static hash(hash: number, src: _R | undefined): number {
            if (!src) return hash; // Return seed if src is null/undefined.
            const length = index(src._size);
            const mask_last = mask(bit(src._size)); // Corrected mask calculation for last element.

            switch (length) {
                case 0:
                    return AdHoc.finalizeHash(hash, 0); // Empty array hash.
                case 1:
                    return AdHoc.finalizeHash(AdHoc.mix(hash, AdHoc.hash_number(hash, src.values[0] & mask_last)), 1); // Single element hash.
            }
            hash = AdHoc.mix(hash, AdHoc.hash_number(hash, src.values[length] & mask_last)); // Hash last partial word.

            return AdHoc.hash_array(hash, src.values, AdHoc.hash_number, length - 1); // Hash remaining full words.
        }

        /**
         * Executes a provided function once for each bit list element.
         * @param callback Function to execute for each element, taking the value and index as arguments.
         * @param thisArg Optional value to use as `this` when executing callback.
         */
        forEach(callback: (value: number, index: number) => void, thisArg?: any): void {
            for (let i = 0; i < this._size; i++) {
                callback.call(thisArg, this.get_(i), i);
            }
        }

        /**
         * Creates a new bit list with the results of calling a provided function on every element in the calling bit list.
         * @param callback Function that produces an element of the new bit list, taking value and index as arguments.
         * @param thisArg Optional value to use as `this` when executing callback.
         * @returns A new RW instance with the results of the callback function for each element.
         */
        map(callback: (value: number, index: number) => number, thisArg?: any): RW {
            const result = new RW(this.bits, this.default_value, this._size);
            for (let i = 0; i < this._size; i++) {
                result.set1(i, callback.call(thisArg, this.get_(i), i));
            }
            return result;
        }

        /**
         * Creates a new bit list containing all elements of the calling bit list that pass the test implemented by the provided function.
         * @param callback Function to test each element of the bit list. Return true to keep the element, false otherwise, taking value and index as arguments.
         * @param thisArg Optional value to use as `this` when executing callback.
         * @returns A new RW instance containing only the elements that pass the test.
         */
        filter(callback: (value: number, index: number) => boolean, thisArg?: any): RW {
            const result = new RW(this.bits, this.default_value);
            for (let i = 0; i < this._size; i++) {
                const value = this.get_(i);
                if (callback.call(thisArg, value, i)) {
                    result.add(value);
                }
            }
            return result;
        }

        /**
         * Executes a reducer function (provided as a callback) on each element of the bit list, resulting in a single output value.
         * @param callback Function to execute on each element in the bit list, taking accumulator, current value, and current index as arguments.
         * @param initialValue Optional value to use as the first argument to the first call of the callback. If no initial value is supplied, the first element in the bit list will be used as the initial accumulator and skipped as currentValue. Calling reduce() on an empty bit list without an initial value will throw a TypeError.
         * @returns The single value that results from the reduction.
         */
        reduce(callback: (accumulator: number, currentValue: number, currentIndex: number) => number, initialValue?: number): number {
            if (this._size === 0 && initialValue === undefined) {
                throw new TypeError('Reduce of empty BitsList with no initial value');
            }

            let accumulator = initialValue !== undefined ? initialValue : this.get_(0);
            const startIndex = initialValue !== undefined ? 0 : 1;

            for (let i = startIndex; i < this._size; i++) {
                accumulator = callback(accumulator, this.get_(i), i);
            }

            return accumulator;
        }

        /**
         * Returns a shallow copy of a portion of a bit list into a new bit list object selected from start to end (end not included) where start and end represent the index of items in that bit list. The original bit list will not be modified.
         * @param start Start index of the slice. Can be negative to count from the end of the bit list.
         * @param end End index of the slice (exclusive). Can be negative to count from the end of the bit list. If omitted, slice extracts to the end of the bit list.
         * @returns A new RW instance containing the extracted section of the bit list.
         */
        slice(start?: number, end?: number): RW {
            const actualStart = start === undefined ? 0 : (start < 0 ? Math.max(0, this._size + start) : Math.min(this._size, start));
            const actualEnd = end === undefined ? this._size : (end < 0 ? Math.max(0, this._size + end) : Math.min(this._size, end));
            const sliceSize = Math.max(0, actualEnd - actualStart);
            const result = new RW(this.bits, this.default_value, sliceSize);
            for (let i = 0; i < sliceSize; i++) {
                result.set1(i, this.get_(actualStart + i));
            }
            return result;
        }

    }

    /**
     * Read-only implementation of BitsList. Extends _R and provides read-only access methods.
     * @class
     * @extends _R
     */
    export abstract class R extends _R {

        /**
         * Gets the number of elements currently stored in the bit list (override of abstract getter).
         * @returns The number of elements.
         * @override
         */
        get size(): number {
            return this._size;
        }

        /**
         * Retrieves the value at the specified index. Public getter for read-only access.
         * @param index The index of the value to retrieve.
         * @returns The value at the specified index.
         */
        public get(index: number): number {
            return this.get_(index);
        }

        /**
         * Returns the string tag for this class, used by `Object.prototype.toString.call()`.
         * @returns "BitsList.R"
         */
        get [Symbol.toStringTag]() {
            return "BitsList.R";
        }

        /**
         * Retrieves the last value in the list.
         * @returns The last value, or undefined if the list is empty.
         */
        get last(): number {
            return this.get_(this._size - 1);
        }

        /**
         * Checks if the list contains the specified value.
         * @param value The value to search for.
         * @returns True if the value is in the list, false otherwise.
         */
        contains(value: number): boolean {
            return this._indexOf(value) !== -1;
        }

        /**
         * Returns the index of the first occurrence of the value.
         * @param value The value to search for.
         * @returns The index of the first occurrence, or -1 if not found.
         */
        indexOf(value: number): number {
            return this._indexOf(value);
        }

        /**
         * Returns the index of the last occurrence of the value.
         * @param value The value to search for.
         * @returns The index of the last occurrence, or -1 if not found.
         */
        lastIndexOf(value: number): number {
            return super._lastIndexOf_(this._size, value);
        }

        /**
         * Returns the index of the last occurrence of the value, starting the search from a specified index.
         * @param from The index to start searching backwards from.
         * @param value The value to search for.
         * @returns The index of the last occurrence, or -1 if not found.
         */
        lastIndexOf_(from: number, value: number) {
            return super._lastIndexOf_(from, value);
        }

        /**
         * Converts the bit list to a Uint8Array.
         * @param dst Optional pre-allocated Uint8Array to store the result in. If not provided or too small, a new array is created.
         * @returns A Uint8Array containing the values of the bit list.
         */
        toArray(dst: Uint8Array | undefined): Uint8Array {
            if (this._size === 0) return new Uint8Array(0);
            if (!dst || dst.length < this._size) dst = new Uint8Array(this._size);
            for (let item = 0; item < this._size; item++) {
                dst[item] = this.get_(item);
            }
            return dst;
        }

        /**
         * Calculates the hash code for the given R instance. Static method.
         * @static
         * @param hash Initial hash value (seed).
         * @param src The R instance to hash.
         * @returns The computed hash value.
         */
        static hash(hash: number, src: R | undefined): number {
            return _R.hash(AdHoc.hash_number(hash, undefined), src);
        }

        /**
         * Compares two R instances for equality. Static method.
         * @static
         * @param one The first R instance.
         * @param two The second R instance.
         * @returns True if both are equal, false otherwise.
         */
        static equals(one: R | undefined, two: R | undefined): boolean {
            return _R.equals(one, two);
        }
    }

    /**
     * Read-write implementation of BitsList. Extends R and provides methods to modify the bit list.
     * @class
     * @extends R
     */
    export class RW extends R {

        /**
         * Constructor for RW class. Initializes a read-write bit list.
         * @param bits_per_item Number of bits to allocate for each item.
         * @param [default_value=0] Default value to initialize new elements with.
         * @param [size] Initial size of the bit list (number of items). If provided, allocates storage and initializes with default value.
         * @param [length] Initial length of the underlying Uint32Array (in elements, not items). If provided, pre-allocates storage. Overrides size if both are given for storage allocation.
         */
        constructor(bits_per_item: number, default_value?: number, size?: number, length?: number) {
            super(bits_per_item, default_value, size, length);
        }

        /**
         * Returns the string tag for this class, used by `Object.prototype.toString.call()`.
         * @returns "BitsList.RW"
         */
        get [Symbol.toStringTag]() {
            return "BitsList.RW";
        }

        /**
         * Creates a copy of the current RW instance with specified bit size and initial values from a Uint8Array.
         * @param bits_per_item Number of bits per item for the new RW instance.
         * @param values Uint8Array containing the initial values.
         * @returns A new RW instance initialized with the given parameters.
         */
        copy_of(bits_per_item: number, values: Uint8Array): RW {
            const r = new RW(bits_per_item, undefined, undefined, values.length);
            R.set_(r, 0, values);
            return r;
        }

        /**
         * Adds a value to the end of the list.
         * @param value The value to add.
         */
        add(value: number) {
            R.add(this, value);
        }

        /**
         * Adds a value at the specified index in the list.
         * @param index The index to add the value at.
         * @param src The value to add.
         */
        add_(index: number, src: number) {
            R.add_(this, index, src);
        }

        /**
         * Removes a value at the specified index.
         * @param item The index of the item to remove.
         */
        removeAt(item: number) {
            R.removeAt(this, item);
        }

        /**
         * Removes the last value in the list.
         */
        remove() {
            R.removeAt(this, this._size - 1);
        }

        /**
         * Removes all instances of the specified value in the list.
         * @param value The value to remove.
         */
        remove_(value: number) {
            R.remove(this, value);
        }

        /**
         * Gets the last value in the list.
         * @returns The last value, or undefined if the list is empty.
         */
        get last(): number {
            return this.get_(this._size - 1);
        }

        /**
         * Sets the last value in the list.
         * @param value The value to set.
         */
        set last(value: number) {
            R.set(this, this._size - 1, value);
        }

       

        /**
         * Sets the value at the specified index using the set method.
         * @param item The index to set the value at.
         * @param value The value to set.
         */
        set1( item: number, value: number) {
            R.set(this, item, value);
        }

        /**
         * Sets multiple values starting from the specified index.
         * @param index The starting index.
         * @param src Variable number of values to set.
         * @returns The RW instance for chaining.
         */
        set(index: number, ...src: number[]): RW {
            R.set_(this, index, src);
            return this;
        }

        /**
         * Sets values starting from a specified index using an array-like object.
         * @param index The starting index.
         * @param src ArrayLike object containing values to set.
         * @param [src_index=0] Starting index in the source array.
         * @param [len=src.length] Number of elements to copy from the source array.
         * @returns The RW instance for chaining.
         */
        set_(index: number, src: ArrayLike<number>, src_index: number = 0, len: number = src.length): RW {
            for (let i = 0; i < len; i++) {
                R.set(this, index + i, src[src_index + i]);
            }
            return this;
        }

        /**
         * Retains only the values in the list that are present in the specified R instance (another bit list).
         * @param chk The R instance to check against.
         * @returns True if the list was modified, false otherwise.
         */
        retainAll(chk: R): boolean {
            let fix = this._size;
            let v;
            for (let item = 0; item < this._size; item++) {
                if (!chk.contains(v = this.get_(item))) {
                    R.remove(this, v);
                }
            }
            return fix !== this._size;
        }

        /**
         * Clears the list, removing all elements and resetting size to 0.
         * @override
         */
        clear() {
            super.clear();
        }

        /**
         * Gets the length of the underlying Uint32Array storage in terms of number of items it can hold (override of abstract getter).
         * @returns The maximum number of items that can be stored in the current storage.
         * @override
         */
        get length() {
            return super.length;
        }

        /**
         * Gets the current size of the bit list (number of elements).
         * @returns The number of elements.
         * @override
         */
        get size(): number {
            return this._size;
        }

        /**
         * Sets the size of the bit list.
         * If new size is smaller, truncates the list. If larger, extends with default values.
         * If size is less than 1, clears the list.
         * @param size The new size of the bit list.
         * @override
         */
        set size(size: number) {
            if (size < 1) {
                this.clear();
            } else if (this.size < size) {
                for (let i = this.size; i < size; i++) {
                    this.set1(i, this.default_value);
                }
            } else {
                this._size = size;
            }
        }

        /**
         * Sets the length of the underlying storage (Uint32Array).
         * @param items Desired number of items (positive to resize, negative to re-allocate and clear).
         * @override
         */
        set length(items: number) {
            this.set_length(items);
        }

        /**
         * Adjusts the storage to exactly fit the current number of items, potentially reducing memory usage.
         */
        fit() {
            this.length = -this._size; // Negative size triggers reallocation to fit current size.
        }

        /**
         * Reverses the order of the elements in a bit list in place. The first element becomes the last, and the last element becomes the first.
         * @returns The reversed RW instance.
         */
        reverse(): RW {
            const mid = Math.floor(this._size / 2);
            for (let i = 0; i < mid; i++) {
                const temp = this.get_(i);
                this.set1(i, this.get_(this._size - 1 - i));
                this.set1(this._size - 1 - i, temp);
            }
            return this as RW; // Return RW for chaining.
        }

        /**
         * Fills all the elements of a bit list from a start index to an end index with a static value.
         * @param value Value to fill the bit list with.
         * @param start Start index, default 0.
         * @param end End index, default size of the bit list.
         * @returns The modified RW instance.
         */
        fill(value: number, start = 0, end?: number): RW {
            const actualStart = start < 0 ? Math.max(0, this._size + start) : Math.min(this._size, start);
            const actualEnd = end === undefined ? this._size : (end < 0 ? Math.max(0, this._size + end) : Math.min(this._size, end));

            for (let i = actualStart; i < actualEnd; i++) {
                this.set1(i, value);
            }
            return this as RW; // Return RW for chaining.
        }

        /**
         * Inserts a new element at a specified index in a bit list. Elements at and after the index are shifted to the right.
         * @param index Index at which to insert the element.
         * @param value The value to insert.
         * @returns The modified RW instance.
         */
        insertAt(index: number, value: number): RW {
            if (index < 0 || index > this._size) {
                throw new RangeError('Index is out of range');
            }
            R.add_(this, index, value); // Use add_ to handle insertion logic correctly.
            return this as RW; // Return RW for chaining.
        }
    }
}

export default BitsList;