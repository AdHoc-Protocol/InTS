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

import BitList from "./BitList"
import AdHoc from "../AdHoc"

export namespace Int8NullList {
    export abstract class R<UNDEFINED = undefined> {
        // Data structures for handling nulls and big integers
        // @ts-ignore
        nulls: BitList.RW; // BitList to handle null flags
        // @ts-ignore
        values: Int8Array; // Array to store values
        undefined_value: UNDEFINED; // Default value for undefined elements

        constructor(undefined_value: UNDEFINED) { this.undefined_value = undefined_value; }

        // Property accessors for length and size
        get length(): number { return this.nulls.length; } // Length of the list
        get size(): number { return this.nulls.size; } // Number of elements in the list

        // Field validation functions
        isEmpty(): boolean { return this.size < 1; } // Check if the list is empty

        // Index functions for navigating the list
        nextValueIndex(index: number): number { return this.nulls.next1(index); } // Index of the next non-null value
        prevValueIndex(index: number): number { return this.nulls.prev1(index); } // Index of the previous non-null value
        nextNullIndex(index: number): number { return this.nulls.next0(index); } // Index of the next null value
        prevNullIndex(index: number): number { return this.nulls.prev0(index); } // Index of the previous null value

        // Retrieve the last element, or return the default undefined value
        get last(): number | UNDEFINED { return this.get(this.size - 1); }

        // Get a specific element or the default undefined value
        get(index: number): number | UNDEFINED {
            return this.nulls.get(index) ?
                   this.values[this.nulls.rank(index) - 1] :
                   this.undefined_value;
        }

        hasValue(index: number): boolean { return this.nulls.get(index) }

        // Index functions for search operations
        indexOf(value: number, fromIndex?: number): number {
            const i = this.values.indexOf(value, fromIndex);
            return i < 0 ?
                   i :
                   this.nulls.bit(i);
        }

        lastIndexOf(value: number, fromIndex?: number): number {
            const i = this.values.lastIndexOf(value, fromIndex);
            return i < 0 ?
                   i :
                   this.nulls.bit(i);
        }

        // Set a value at a specific index, handling undefined cases
        protected static set<UNDEFINED>(dst: R<UNDEFINED>, index: number, value: number | UNDEFINED) {
            if (value === dst.undefined_value) {
                if (dst.size <= index) dst.nulls.set0(index); // Resize if necessary
                else if (dst.nulls.get(index)) {
                    const r = dst.nulls.rank(index);
                    dst.values.copyWithin(r, r + 1, dst.nulls.cardinality() - r);
                    dst.nulls.set0(index);
                }
            } else if (dst.nulls.get(index)) dst.values[dst.nulls.rank(index) - 1] = <number>value;
            else {
                dst.nulls.set1(index);
                const i = this.add_values(dst, index)
                dst.values[i] = <number>value
            }
        }

        // Handle array resizing and element addition
        static add_values<UNDEFINED>(dst: R<UNDEFINED>, index: number): number {
            index = dst.nulls.rank(index) - 1;
            const dc = dst.nulls.cardinality()
            if (index < dc) {
                if (dc < dst.values.length) dst.values.copyWithin(index + 1, index, dc - index)
                else {
                    const tmp = new Int8Array(dst.values.length * 1.5);

                    for (let i = index; -1 < --i;) tmp[i] = dst.values[i];
                    for (let i = dc, min = index - 1; min < --i;) tmp[i + 1] = dst.values[i];
                    dst.values = tmp;
                }
            } else {
                if (dst.values.length <= index) {
                    const tmp = new Int8Array(Math.max(dst.values.length * 1.5, index + 1));

                    for (let i = dc; -1 < --i;) tmp[i] = dst.values[i];

                    dst.values = tmp;
                }
            }

            return index;
        }


        get [Symbol.toStringTag]() { return "Int8ArrayNull.R" }

        // Implement a default iterable behavior
        * [Symbol.iterator](): IterableIterator<number | UNDEFINED> {
            const length = this.size;

            for (let i = 0, ii; i < length;)
                if ((ii = this.nextValueIndex(i)) == i) yield this.get(i++)
                else if (ii == -1 || length <= ii) {
                    while (i++ < length) yield this.undefined_value;
                    return;
                } else for (; i < ii;) yield this.undefined_value
        }

        toString() { return `length = ${this.size}\n${this.toJSON()}` }

        // Convert to JSON representation (as array)
        toJSON() {
            const length = this.size;
            const array: any[] = [];
            for (let i = 0; i < length; i++) {
                array.push(this.get(i));
            }
            return array;
        }

        // Check for equality between two instances
        static equals<UNDEFINED>(one: R<UNDEFINED> | undefined, two: R<UNDEFINED> | undefined): boolean {
            if (one === two) return true
            if (!one || !two || one.size !== two.size || !BitList.R.equals(one.nulls, two.nulls)) return false
            for (let i = one.nulls.cardinality(); -1 < --i;)
                if (one.values[i] !== two.values[i]) return false

            return true;
        }

        static hash<UNDEFINED>(hash: number, src: R<UNDEFINED> | undefined): number {
            return src ?
                   AdHoc.mix(hash = BitList.R.hash(hash, src.nulls), AdHoc.hash_array(hash, src.values, AdHoc.hash_number, src.nulls.cardinality())) :
                   hash
        }
    }

    const O = new Int8Array(0)

    export class RW<UNDEFINED = undefined> extends R<UNDEFINED> {
        get [Symbol.toStringTag]() { return "Int8ArrayNull.RW" }

        constructor(lengthOrArray: number | ArrayLike<number | UNDEFINED>, undefinedValue?: UNDEFINED, size?: number) {
            super(undefinedValue ?? undefined as UNDEFINED);
            if (typeof lengthOrArray === 'number') {
                this.nulls = new BitList.RW(lengthOrArray, Math.min(size ?? lengthOrArray, lengthOrArray));
                this.values = new Int8Array(lengthOrArray);
            } else {
                this.nulls = new BitList.RW(lengthOrArray.length, lengthOrArray.length);
                this.values = new Int8Array(lengthOrArray.length);
                this.set_(0, lengthOrArray);
            }
        }

// Fill the list with a specified value within the given range
        fill(fill_value: number | UNDEFINED, start: number, end: number): RW<UNDEFINED> {
            while (start < end)
                R.set(this, start, fill_value);
            return this;
        }

// Remove the last element from the list
        remove() {this.remove_(this.size - 1);}

// Remove the element at the specified index from the list
        remove_(index: number) {
            if (this.size < 1 || this.size <= index) return;

            // If the element at the index is not null, remove it and shift elements accordingly
            if (this.nulls.get(index)) {
                let r = this.nulls.rank(index);
                this.values.copyWithin(r - 1, r, this.nulls.cardinality() - r);
            }

            // Remove the null flag at the specified index
            this.nulls.remove(index);
        }

// Add a new element to the end of the list
        add(value: number | UNDEFINED) { R.set(this, this.size, value); }

// Add an element at the specified index to the list
        add_(index: number, value: number | UNDEFINED) {
            if (value == this.undefined_value) this.nulls.add$(index, false);
            else if (index < this.size) {
                this.nulls.add$(index, true);
                const i = R.add_values(this, index)
                this.values[i] = <number>value;
            } else R.set(this, index, value);
        }

// Add all elements from another list to this list
        addAll(src: R<UNDEFINED>) {
            for (let i = src.size; -1 < --i;)
                this.add(src.get(i));
        }

// Get the last element from the list
        get last(): number | UNDEFINED { return super.last; }

// Set the last element of the list to a specified value
        set last(value: number | UNDEFINED) { R.set(this, this.size - 1, value);}

// Set a specified value at the given index
        set1(value: number | UNDEFINED) { this.set1_(this.size - 1, value);}

// Set a specified value at the given index
        set1_(index: number, value: number | UNDEFINED) { R.set(this, index, value);}

// Set values starting from a specified index using an array-like object
        set(index: number, ...src: (number | UNDEFINED)[]) {return this.set_(0, src, 0, src.length) }

// Set values starting from a specified index using an array-like object
        set_(index: number, src: ArrayLike<(number | UNDEFINED)>, src_index: number = 0, len: number = src.length): RW<UNDEFINED> {

            for (let i = len; -1 < --i;)
                R.set(this, index + i, src[src_index + i])
            return this
        }

// Set values starting from a specified index using another list
        set$(index: number, src: R, start: number, end: number): RW<UNDEFINED> {
            index += end - start;
            while (start < end)
                R.set(this, index--, src.get(end--));
            return this;
        }

        // Clear the entire list
        clear() {
            this.values.fill(0, 0, this.nulls.cardinality());
            this.nulls.clear();
        }

        // Swap two elements at specified indices
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
                } else {
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
            } else return;

            let v = this.values[exist];
            this.values.copyWithin(exist, exist + 1, this.nulls.cardinality() - exist);
            this.values.copyWithin(empty + 1, empty, this.nulls.cardinality() - empty);
            this.values[empty] = v;
        }

        // Get the length of the list (number of elements)
        get length(): number {return this.nulls.length;}

        // Set the length of the list
        set length(items: number) {

            this.nulls.length = items;
            this.values.slice(0, Math.max(this.nulls.cardinality(),items) );
        }

        // Fit the internal arrays to actual data
        fit() {
            // Fit the nulls array
            this.nulls.fit();
            // Resize the values array based on values_size
            this.values = this.values.slice(0, this.nulls.cardinality());
        }

        // Get the size of the list (number of non-null elements)
        get size(): number { return this.nulls.size; }

        // Set the size of the list (number of non-null elements)
        set size(new_size: number) {
            // Set the size of the nulls array
            this.nulls.size = new_size;
            // Resize the values array based on the cardinality of nulls
            this.values.slice(0, this.nulls.cardinality());
        }


    }
}

export default Int8NullList;

