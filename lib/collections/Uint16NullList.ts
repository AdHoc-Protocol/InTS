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

import BitList from "./BitList";
import AdHoc from "../AdHoc";

/**
 * A specialized list for storing `number` values with support for an `UNDEFINED` state to represent
 * missing or uninitialized elements. This implementation optimizes memory and performance by using
 * two internal storage strategies: **Compressed** (space-efficient for sparse lists) and **Flat**
 * (time-efficient for dense lists).
 *
 * @remarks
 * The list uses a {@link BitList.RW} to track nullity (whether an element is `UNDEFINED`) and a
 * {@link Uint16Array} to store non-`UNDEFINED` `number` values. The choice of storage strategy
 * dynamically adapts based on the density of non-`UNDEFINED` elements and a configurable threshold.
 *
 * - **Compressed Strategy**: Stores only non-`UNDEFINED` values contiguously, using rank-based
 *   access via the nullity bitlist. Ideal for sparse lists with many `UNDEFINED` elements.
 * - **Flat Strategy**: Mirrors the logical structure, storing values at their logical indices.
 *   Faster for dense lists but uses more memory for `UNDEFINED` slots.
 *
 * @example
 * ```typescript
 * const list = new Uint16NullList.RW(10, undefined); // Empty list with capacity 10
 * list.append(1n).append(undefined).append(2n);
 * console.log(list.toJSON()); // [1, undefined, 2]
 * console.log(list.cardinality); // 2 (two non-UNDEFINED values)
 * ```
 *
 * @namespace
 */
export namespace Uint16NullList{
    /**
     * A read-only base class for a list of `number` values with support for `UNDEFINED` states.
     *
     * @remarks
     * This class provides methods to query the list, including accessing elements, checking nullity,
     * and iterating over values. It relies on a {@link BitList.RW} to track which elements are
     * non-`UNDEFINED` and a {@link Uint16Array} to store `number` values, organized according
     * to the active storage strategy (Compressed or Flat).
     *
     * @template UNDEFINED The type of the value representing an `UNDEFINED` state (default: `undefined`).
     */
    export abstract class R<UNDEFINED = undefined>{
        /**
         * The bitlist tracking nullity for each logical index.
         * A `true` bit indicates a non-`UNDEFINED` `number` value; a `false` bit indicates an `UNDEFINED` state.
         * Its size defines the logical size of this list.
         *
         * @protected
         */
        protected nulls!: BitList.RW;

        /**
         * The array storing `number` values for non-`UNDEFINED` elements.
         *
         * @remarks
         * - In **Compressed Strategy** (`isFlatStrategy` is `false`): Contains only non-`UNDEFINED` values,
         *   with length typically equal to {@link cardinality}. Access requires rank calculation via `nulls`.
         * - In **Flat Strategy** (`isFlatStrategy` is `true`): Mirrors the logical size, with values at their
         *   logical indices (valid only if `nulls.get(i)` is `true`).
         *
         * @protected
         */
        protected values!: Uint16Array;

        /**
         * The value representing an `UNDEFINED` state, returned by accessors for `UNDEFINED` elements.
         *
         * @readonly
         */
        readonly undefinedValue: UNDEFINED;

        /**
         * The number of non-`UNDEFINED` elements (used primarily in Compressed Strategy).
         *
         * @remarks
         * In Flat Strategy, `nulls.cardinality()` is authoritative. In Compressed Strategy, this matches
         * the length of the `values` array containing valid elements.
         *
         * @protected
         */
        protected _cardinality: number = 0;

        /**
         * The threshold for switching from Compressed to Flat Strategy.
         *
         * @remarks
         * When the number of non-`UNDEFINED` elements exceeds this threshold, the {@link RW} class
         * may switch to Flat Strategy for better performance. Default is 1024.
         *
         * @protected
         */
        protected _flatStrategyThreshold: number = 1024;

        /**
         * Indicates the current storage strategy.
         *
         * @remarks
         * - `true`: **Flat Strategy** (values stored at logical indices).
         * - `false`: **Compressed Strategy** (values stored contiguously, accessed via rank).
         *
         * @protected
         */
        protected isFlatStrategy: boolean = false;

        /**
         * @param undefinedValue The value representing `UNDEFINED` elements.
         * @protected
         */
        protected constructor( undefinedValue: UNDEFINED ){
            this.undefinedValue = undefinedValue;
        }

        /**
         * Gets the number of non-`UNDEFINED` elements in the list.
         *
         * @returns The count of non-`UNDEFINED` elements.
         * @remarks In Flat Strategy, this uses `nulls.cardinality()`. In Compressed Strategy, it uses `_cardinality`.
         */
        public get cardinality(): number { return this.isFlatStrategy ? this.nulls.cardinality() : this._cardinality; }

        /**
         * Gets the physical capacity of the internal `values` array.
         *
         * @returns The allocated length of the `values` array.
         * @remarks
         * - In Flat Strategy: Typically matches or exceeds the logical {@link size}.
         * - In Compressed Strategy: Matches or exceeds the number of non-`UNDEFINED` elements ({@link cardinality}).
         */
        public get length(): number { return this.values.length; }

        /**
         * Gets the logical size of the list, including both non-`UNDEFINED` and `UNDEFINED` elements.
         *
         * @returns The total number of logical elements, equal to `nulls.size`.
         */
        public get size(): number { return this.nulls.size; }

        /**
         * Checks if the list is empty (logical size is 0).
         *
         * @returns `true` if the list has no elements, `false` otherwise.
         */
        public get isEmpty(): boolean { return this.size < 1; }

        /**
         * Checks if the element at the specified logical index is non-`UNDEFINED`.
         *
         * @param index The 0-based logical index to check.
         * @returns `true` if the element is non-`UNDEFINED`, `false` if `UNDEFINED` or out of bounds.
         * @example
         * const list = new Uint16NullList.RW(0, undefined).append(1n).append(undefined);
         * console.log(list.hasValue(0)); // true
         * console.log(list.hasValue(1)); // false
         */
        public hasValue( index: number ): boolean { return this.nulls.get( index ); }

        /**
         * Finds the next logical index with a non-`UNDEFINED` element after the specified index.
         *
         * @param index The 0-based index after which to search (starts at `index + 1`). Use -1 to start from the beginning.
         * @returns The logical index of the next non-`UNDEFINED` element, or -1 if none exists.
         * @example
         * const list = new Uint16NullList.RW(0, undefined).append(undefined).append(1n);
         * console.log(list.nextValueIndex(-1)); // 1
         */
        public nextValueIndex( index: number ): number { return this.nulls.next1( index ); }

        /**
         * Finds the previous logical index with a non-`UNDEFINED` element before the specified index.
         *
         * @param index The 0-based index before which to search (starts at `index - 1`). Use `size` to start from the end.
         * @returns The logical index of the previous non-`UNDEFINED` element, or -1 if none exists.
         * @example
         * const list = new Uint16NullList.RW(0, undefined).append(1n).append(undefined);
         * console.log(list.prevValueIndex(2)); // 0
         */
        public prevValueIndex( index: number ): number { return this.nulls.prev1( index ); }

        /**
         * Finds the next logical index with an `UNDEFINED` element after the specified index.
         *
         * @param index The 0-based index after which to search (starts at `index + 1`). Use -1 to start from the beginning.
         * @returns The logical index of the next `UNDEFINED` element, or -1 if none exists.
         * @example
         * const list = new Uint16NullList.RW(0, undefined).append(1n).append(undefined);
         * console.log(list.nextNullIndex(0)); // 1
         */
        public nextNullIndex( index: number ): number { return this.nulls.next0( index ); }

        /**
         * Finds the previous logical index with an `UNDEFINED` element before the specified index.
         *
         * @param index The 0-based index before which to search (starts at `index - 1`). Use `size` to start from the end.
         * @returns The logical index of the previous `UNDEFINED` element, or -1 if none exists.
         * @example
         * const list = new Uint16NullList.RW(0, undefined).append(1n).append(undefined);
         * console.log(list.prevNullIndex(2)); // 1
         */
        public prevNullIndex( index: number ): number { return this.nulls.prev0( index ); }

        /**
         * Retrieves the element at the specified logical index.
         *
         * @param index The 0-based logical index (0 to `size - 1`).
         * @returns The `number` value if non-`UNDEFINED`, or `undefinedValue` if `UNDEFINED`.
         * @throws Error if `index` is negative or `>= size`.
         * @remarks
         * - In Compressed Strategy: Uses `nulls.rank(index)` to locate the value in `values`.
         * - In Flat Strategy: Accesses `values[index]` directly if non-`UNDEFINED`.
         * @example
         * const list = new Uint16NullList.RW(0, undefined).append(1n).append(undefined);
         * console.log(list.get(0)); // 1n
         * console.log(list.get(1)); // undefined
         */
        public get( index: number ): number | UNDEFINED{
            if( index < 0 ) throw new Error( "Index cannot be negative" );
            if( this.size <= index ) throw new Error( "Index out of bounds" );

            return this.nulls.get( index ) ?
                   this.isFlatStrategy ?
                   this.values[index] :
                   this.values[this.nulls.rank( index ) - 1] :
                   this.undefinedValue;
        }

        /**
         * Gets the last element in the list.
         *
         * @returns The `number` value if the last element is non-`UNDEFINED`, or `undefinedValue` if `UNDEFINED`.
         * @throws Error if the list is empty.
         * @example
         * const list = new Uint16NullList.RW(0, undefined).append(1n);
         * console.log(list.last); // 1n
         */
        get last(): number | UNDEFINED { return this.get( this.size - 1 ); }

        /**
         * Finds the first logical index of a specific `number` value.
         *
         * @param value The `number` value to search for.
         * @returns The 0-based logical index of the first occurrence, or -1 if not found.
         * @remarks
         * - In Flat Strategy: Iterates over non-`UNDEFINED` indices.
         * - In Compressed Strategy: Uses `values.indexOf` and converts rank to logical index.
         * @example
         * const list = new Uint16NullList.RW(0, undefined).append(1n).append(undefined).append(1n);
         * console.log(list.indexOf(1n)); // 0
         */
        public indexOf( value: number ): number{
            if( this.isFlatStrategy ){
                for( let i = this.nulls.next1( -1 ); i != -1; i = this.nulls.next1( i ) ) if( this.values[i] === value ) return i;
                return -1;
            }

            const i = this.values.indexOf( value );
            return i < 0 || this._cardinality <= i ? -1 : this.nulls.bit( i + 1 );
        }

        /**
         * Finds the last logical index of a specific `number` value.
         *
         * @param value The `number` value to search for.
         * @returns The 0-based logical index of the last occurrence, or -1 if not found.
         * @remarks
         * - In Flat Strategy: Iterates backward over non-`UNDEFINED` indices.
         * - In Compressed Strategy: Uses `values.lastIndexOf` and converts rank to logical index.
         * @example
         * const list = new Uint16NullList.RW(0, undefined).append(1n).append(undefined).append(1n);
         * console.log(list.lastIndexOf(1n)); // 2
         */
        public lastIndexOf( value: number ): number{
            if( this.isFlatStrategy ){
                for( let i = this.nulls.last1(); i != -1; i = this.nulls.prev1( i - 1 ) ) if( this.values[i] === value ) return i;
                return -1;
            }else{
                const i = this.values.lastIndexOf( value, this._cardinality );
                return i < 0 ? -1 : this.nulls.bit( i + 1 );
            }
        }

        /**
         * Checks if the list contains a specific value or `UNDEFINED` state.
         *
         * @param value The `number` value or `undefinedValue` to search for.
         * @returns `true` if the value or an `UNDEFINED` state is found, `false` otherwise.
         * @remarks If `value` is `undefinedValue`, checks for any `UNDEFINED` element.
         * @example
         * const list = new Uint16NullList.RW(0, undefined).append(1n).append(undefined);
         * console.log(list.contains(1n)); // true
         * console.log(list.contains(undefined)); // true
         */
        public contains( value: number | UNDEFINED ): boolean { return value === this.undefinedValue ? this.nextNullIndex( -1 ) != -1 : this.indexOf( <number>value ) != -1; }

        /**
         * Generates a hash code for the list based on its elements and `undefinedValue`.
         *
         * @param hash The initial hash seed.
         * @param src The list to hash, or `undefined`.
         * @returns The calculated hash code.
         * @remarks Includes both non-`UNDEFINED` values and `UNDEFINED` states in the hash.
         */
        static hash<UNDEFINED>( hash: number, src: R<UNDEFINED> | undefined ): number{
            if( !src ) return hash;

            hash = BitList.R.hash( hash, src.nulls );
            const h = src.undefinedValue === undefined ? 17 : typeof src.undefinedValue === "number" ? AdHoc.hash_number( hash, src.undefinedValue ) : typeof src.undefinedValue === "number" ? AdHoc.hash_number( hash, src.undefinedValue ) : 37;

            for( let i = 0, size = src.size; i < size; i++ ) hash = AdHoc.mix( hash, src.hasValue( i ) ? AdHoc.hash_number( hash, <number>src.get( i ) ) : h );
            return AdHoc.finalizeHash( hash, src.size );
        }

        /**
         * Compares two lists for equality based on size and element content.
         *
         * @param one The first list, or `undefined`.
         * @param two The second list, or `undefined`.
         * @returns `true` if both lists have the same size and identical elements (including `UNDEFINED` states), `false` otherwise.
         * @remarks Does not compare `undefinedValue` properties directly; only checks element equivalence.
         */
        static equals<UNDEFINED>( one: R<UNDEFINED> | undefined, two: R<UNDEFINED> | undefined ): boolean{
            let size: number;
            if( two === one ) return true;
            if( !one || !two || two === one.undefinedValue || ( size = one.size ) != two.size ) return false;

            let b: boolean;
            for( let i = 0; i < size; i++ ) if( ( b = one.hasValue( i ) ) != two.hasValue( i ) || ( b && one.get( i ) != two.get( i ) ) ) return false;
            return true;
        }

        /**
         * Gets the string tag for the list.
         *
         * @returns The string "Uint16ArrayNull.R".
         */
        get [Symbol.toStringTag](): string { return "Uint16ArrayNull.R"; }

        /**
         * Returns a string representation of the list.
         *
         * @returns A string showing the physical length, logical size, and JSON-like content.
         * @example
         * const list = new Uint16NullList.RW(0, undefined).append(1n).append(undefined);
         * console.log(list.toString()); // "length = 2, size = 2\n[1, null]"
         */
        toString(): string { return `length = ${ this.length }, size = ${ this.size }\n${ JSON.stringify( this.toJSON() ) }`; }

        /**
         * Converts the list to an array for JSON serialization.
         *
         * @returns An array with `number` values for non-`UNDEFINED` elements and `undefinedValue` for `UNDEFINED` elements.
         * @example
         * const list = new Uint16NullList.RW(0, null).append(1n).append(null);
         * console.log(list.toJSON()); // [1, null]
         */
        public toJSON(): any[]{
            const ret: any[] = [];
            if( this.size == 0 ) return ret;

            for( let i = -1, ii = -1; i < this.size; ){
                if( ( i = this.nextValueIndex( i ) ) === -1 ){
                    while( ++ii < this.size ) ret.push( this.undefinedValue );
                    break;
                }
                while( ++ii < i ) ret.push( this.undefinedValue );
                ret.push( this.get( i ) );
            }
            return ret;
        }

        /**
         * Copies a range of elements to a destination array.
         *
         * @param index The 0-based logical starting index.
         * @param len The number of elements to copy.
         * @param dst The destination array, or `undefinedValue` to create a new array.
         * @returns The populated destination array, or a new array if `dst` is `undefinedValue` or too small.
         * @throws Error if `index` or `len` is negative, or if `index + len` exceeds `size`.
         * @example
         * const list = new Uint16NullList.RW(0, undefined).append(1n).append(undefined);
         * const arr = list.toArray(0, 2, []); // [1n, undefined]
         */
        public toArray( index: number, len: number, dst: ( number | UNDEFINED )[] ): ( number | UNDEFINED )[]{
            if( this.size === 0 ) return dst;
            if( dst === this.undefinedValue || dst.length < len ) dst = new Array<number | UNDEFINED>( len );

            for( let i = 0, srcIndex = index; i < len && srcIndex < this.size; i++, srcIndex++ ) dst[i] = this.get( srcIndex );
            return dst;
        }

        /**
         * Checks if all elements from another list are present in this list.
         *
         * @param src The list whose elements to check.
         * @returns `true` if all non-`UNDEFINED` values and at least one `UNDEFINED` state (if present in `src`) are in this list.
         * @example
         * const list1 = new Uint16NullList.RW(0, undefined).append(1n).append(undefined);
         * const list2 = new Uint16NullList.RW(0, undefined).append(1n);
         * console.log(list1.containsAll(list2)); // true
         */
        public containsAll( src: R ): boolean{
            for( let i = 0, s = src.size; i < s; i++ )
                if( src.hasValue( i ) ){
                    if( this.indexOf( <number>src.get( i ) ) === -1 ) return false;
                }else if( this.nextNullIndex( -1 ) === -1 ) return false;
            return true;
        }

        /**
         * Finds the first element satisfying a predicate.
         *
         * @param predicate A function to test each element (value, index, list).
         * @returns The first matching element, or `undefinedValue` if none match.
         * @example
         * const list = new Uint16NullList.RW(0, undefined).append(1n).append(2n);
         * const found = list.findValue((v) => v === 2n); // 2n
         */
        findValue( predicate: ( value: number | UNDEFINED, index: number, list: R<UNDEFINED> ) => boolean ): number | UNDEFINED{
            for( let i = 0; i < this.size; i++ ){
                const element = this.get( i );
                if( predicate( element, i, this ) ) return element;
            }
            return this.undefinedValue;
        }

        /**
         * Finds the index of the first element satisfying a predicate.
         *
         * @param predicate A function to test each element (value, index, list).
         * @returns The logical index of the first matching element, or -1 if none match.
         * @example
         * const list = new Uint16NullList.RW(0, undefined).append(1n).append(2n);
         * const index = list.findValueIndex((v) => v === 2n); // 1
         */
        findValueIndex( predicate: ( value: number | UNDEFINED, index: number, list: R<UNDEFINED> ) => boolean ): number{
            for( let i = 0; i < this.size; i++ ) if( predicate( this.get( i ), i, this ) ) return i;
            return -1;
        }

        /**
         * Executes a callback for each element in logical order.
         *
         * @param callbackfn A function to execute (value, index, list).
         * @param thisArg Optional `this` context for the callback.
         * @example
         * const list = new Uint16NullList.RW(0, undefined).append(1n).append(undefined);
         * list.forEach((value, index) => console.log(`${index}: ${value}`));
         * // Outputs: 0: 1, 1: undefined
         */
        forEach( callbackfn: ( value: number | UNDEFINED, index: number, list: R<UNDEFINED> ) => void, thisArg?: any ): void{
            for( let i = 0; i < this.size; i++ ) callbackfn.call( thisArg, this.get( i ), i, this );
        }

        /**
         * Calculates the sum of all non-`UNDEFINED` `number` values.
         *
         * @returns The sum of non-`UNDEFINED` values, or `0` if none exist.
         * @example
         * const list = new Uint16NullList.RW(0, undefined).append(1n).append(undefined).append(2n);
         * console.log(list.sum()); // 3n
         */
        sum(): number{
            let totalSum = 0;
            for( let i = 0; i < this.size; i++ ){
                const value = this.get( i );
                if( value !== this.undefinedValue ) totalSum += value as number;
            }
            return totalSum;
        }

        /**
         * Finds the minimum non-`UNDEFINED` `number` value.
         *
         * @returns The smallest non-`UNDEFINED` value, or `undefinedValue` if none exist.
         * @example
         * const list = new Uint16NullList.RW(0, undefined).append(2n).append(undefined).append(1n);
         * console.log(list.min()); // 1n
         */
        min(): number | UNDEFINED{
            let minValue: number | UNDEFINED = this.undefinedValue;
            for( let i = 0; i < this.size; i++ ){
                const value = this.get( i );
                if( value !== this.undefinedValue )
                    if( minValue === this.undefinedValue || ( value as number ) < ( minValue as number ) )
                        minValue = value;
            }
            return minValue;
        }

        /**
         * Finds the maximum non-`UNDEFINED` `number` value.
         *
         * @returns The largest non-`UNDEFINED` value, or `undefinedValue` if none exist.
         * @example
         * const list = new Uint16NullList.RW(0, undefined).append(1n).append(undefined).append(2n);
         * console.log(list.max()); // 2n
         */
        max(): number | UNDEFINED{
            let maxValue: number | UNDEFINED = this.undefinedValue;
            for( let i = 0; i < this.size; i++ ){
                const value = this.get( i );
                if( value !== this.undefinedValue )
                    if( maxValue === this.undefinedValue || ( value as number ) > ( maxValue as number ) )
                        maxValue = value;
            }
            return maxValue;
        }

        /**
         * Returns an iterator over the list’s elements in logical order.
         *
         * @returns An iterator yielding `number` values for non-`UNDEFINED` elements and JavaScript `undefined` for `UNDEFINED` elements.
         * @remarks Yields `undefined` for `UNDEFINED` states, regardless of `undefinedValue`.
         * @example
         * const list = new Uint16NullList.RW(0, null).append(1n).append(null);
         * for (const value of list) console.log(value); // Outputs: 1, undefined
         */
        [Symbol.iterator](): IterableIterator<number | undefined>{
            let index = 0;
            return {
                next: (): IteratorResult<number | undefined> => {
                    if( index >= this.size ) return { done: true, value: undefined };
                    const value = this.nulls.get( index ) ? ( this.isFlatStrategy ? this.values[index] : this.values[this.nulls.rank( index ) - 1] ) : undefined;
                    index++;
                    return { done: false, value };
                },
                [Symbol.iterator](){
                    return this;
                },
            };
        }
    }

    /**
     * A read-write implementation of a list supporting `number` values and `UNDEFINED` states.
     *
     * @remarks
     * Extends {@link R} to add methods for modifying the list, including setting, adding, and removing
     * elements. It dynamically switches between Compressed and Flat strategies based on the density
     * of non-`UNDEFINED` elements and the {@link R._flatStrategyThreshold} threshold.
     *
     * @template UNDEFINED The type of the value representing `UNDEFINED` states (default: `undefined`).
     */
    export class RW<UNDEFINED = undefined> extends R<UNDEFINED>{
        /**
         * Gets the string tag for the list.
         *
         * @returns The string "Uint16ArrayNull.RW".
         */
        get [Symbol.toStringTag](): string { return "Uint16ArrayNull.RW"; }

        /**
         * Creates a new read-write list.
         *
         * @param lengthOrArray Either a number specifying the initial capacity (or logical size if `size` is provided),
         *                     or an array-like object to initialize the list.
         * @param undefinedValue The value representing `UNDEFINED` states (default: `undefined`).
         * @param size Optional logical size when `lengthOrArray` is a number.
         * @throws Error if `lengthOrArray` is negative when a number.
         * @example
         * const list = new Uint16NullList.RW(10, undefined); // Empty list, capacity 10
         * const listFromArray = new Uint16NullList.RW([1n, undefined, 2n], undefined);
         * console.log(listFromArray.toJSON()); // [1, undefined, 2]
         */
        constructor( lengthOrArray: number | ArrayLike<number | UNDEFINED>, undefinedValue: UNDEFINED = undefined as UNDEFINED, size?: number ){
            super( undefinedValue );
            if( typeof lengthOrArray === "number" ){
                this.nulls = size ? new BitList.RW( false, size ) : new BitList.RW( lengthOrArray );
                this.values = new Uint16Array( lengthOrArray );
            }else{
                this.nulls = new BitList.RW( lengthOrArray.length );
                this.values = new Uint16Array( lengthOrArray.length );
                this.set$( 0, lengthOrArray );
            }
        }

        /**
         * Sets the threshold for switching to Flat Strategy.
         *
         * @param threshold The new threshold (non-negative). A lower value favors Flat Strategy; a higher value favors Compressed Strategy.
         * @throws Error if `threshold` is negative.
         * @remarks May trigger an immediate strategy switch if the threshold changes the preferred strategy based on current `cardinality`.
         * @example
         * const list = new Uint16NullList.RW(0, undefined).append(1n);
         * list.flatStrategyThreshold(0); // Switches to Flat Strategy
         */
        public flatStrategyThreshold( threshold: number ): void{
            if( ( this._flatStrategyThreshold = threshold ) < 0 ) throw new Error( "Threshold cannot be negative" );
            if( threshold <= this._cardinality && !this.isFlatStrategy ) this.switchToFlatStrategy();
            else if( threshold > this._cardinality && this.isFlatStrategy ) this.switchToCompressedStrategy();
        }

        /**
         * Creates a deep copy of the list.
         *
         * @returns A new `RW` instance with identical content, strategy, and configuration.
         * @example
         * const list = new Uint16NullList.RW(0, undefined).append(1n);
         * const copy = list.clone();
         * copy.append(2n);
         * console.log(list.toJSON()); // [1]
         * console.log(copy.toJSON()); // [1, 2]
         */
        public clone(): RW<UNDEFINED>{
            const dst = Object.create( this.constructor.prototype ) as RW<UNDEFINED>;
            dst.values = this.values.slice();
            dst.nulls = this.nulls.clone();
            dst._cardinality = this._cardinality;
            dst.isFlatStrategy = this.isFlatStrategy;
            ( dst as any ).undefinedValue = this.undefinedValue;
            dst._flatStrategyThreshold = this._flatStrategyThreshold;
            return dst;
        }

        /**
         * Removes the last logical element.
         *
         * @returns This instance for method chaining.
         * @remarks Has no effect if the list is empty.
         * @example
         * const list = new Uint16NullList.RW(0, undefined).append(1n).append(2n);
         * list.remove();
         * console.log(list.toJSON()); // [1]
         */
        public remove(): this { return this.remove_( this.size - 1 ); }

        /**
         * Removes the element at the specified logical index.
         *
         * @param index The 0-based logical index to remove.
         * @returns This instance for method chaining.
         * @remarks Has no effect if `index` is out of bounds. Shifts subsequent elements left.
         * @example
         * const list = new Uint16NullList.RW(0, undefined).append(1n).append(2n);
         * list.remove_(0);
         * console.log(list.toJSON()); // [2]
         */
        public remove_( index: number ): this{
            if( index < 0 || this.size <= index ) return this;

            if( this.isFlatStrategy ) resize( this.values, this.values, index, this.nulls.size, -1 );
            else if( this.nulls.get( index ) ) this._cardinality = resize( this.values, this.values, this.nulls.rank( index ) - 1, this._cardinality, -1 );

            this.nulls.remove( index );
            return this;
        }

        /**
         * Sets the element at the specified logical index.
         *
         * @param index The 0-based logical index (non-negative).
         * @param value The `number` or `undefinedValue` to set.
         * @throws Error if `index` is negative.
         * @protected
         */
        protected set_$( index: number, value: number | UNDEFINED ): void{
            if( index < 0 ) throw new Error( "Index cannot be negative" );
            if( value === this.undefinedValue ){
                if( this.nulls.last1() < index ) this.nulls.set0( index );
                else if( this.nulls.get( index ) ){
                    if( !this.isFlatStrategy ) this._cardinality = resize( this.values, this.values, this.nulls.rank( index ) - 1, this._cardinality, -1 );
                    this.nulls.set0( index );
                }
                return;
            }

            if( this.isFlatStrategy ){
                if( this.values.length <= index ) this.values = copyOf( this.values, Math.max( index + 1, ( this.values.length * 3 ) / 2 ) );
                this.values[index] = <number>value;
                this.nulls.set1( index );
            }else if( this.nulls.get( index ) ){
                this.values[this.nulls.rank( index ) - 1] = <number>value;
            }else{
                const rank = this.nulls.rank( index );
                const max = Math.max( rank, this._cardinality );
                if( this.values.length <= max && this._flatStrategyThreshold <= this._cardinality ){
                    this.switchToFlatStrategy_( Math.max( index + 1, ( this.nulls.size * 3 ) / 2 ) );
                    this.nulls.set1( index );
                    this.values[index] = <number>value;
                }else{
                    this._cardinality = resize( this.values, this.values.length <= max ? ( this.values = new Uint16Array( 2 + ( max * 3 ) / 2 ) ) : this.values, rank, this._cardinality, 1 );
                    this.values[rank] = <number>value;
                    this.nulls.set1( index );
                }
            }
        }

        /**
         * Sets the last logical element’s value.
         *
         * @param value The `number` or `undefinedValue` to set.
         * @returns This instance for method chaining.
         * @remarks If the list is empty, adds a new element at index 0.
         * @example
         * const list = new Uint16NullList.RW(0, undefined).append(1n);
         * list.setLast(2n);
         * console.log(list.toJSON()); // [2]
         */
        public setLast( value: number | UNDEFINED ): RW<UNDEFINED>{
            this.set_$( Math.max( 0, this.size - 1 ), value );
            return this;
        }

        /**
         * Sets multiple elements from a list of `number` values.
         *
         * @param index The 0-based logical starting index.
         * @param values The `number` values to set (non-`UNDEFINED`).
         * @returns This instance for method chaining.
         * @throws Error if `index` is negative.
         * @remarks Extends the list with `UNDEFINED` elements if needed.
         * @example
         * const list = new Uint16NullList.RW(0, undefined);
         * list.set(0, 1n, 2n);
         * console.log(list.toJSON()); // [1, 2]
         */
        public set( index: number, ...values: number[] ): RW<UNDEFINED> { return this.set__( index, values, 0, values.length ); }

        /**
         * Sets elements from an array-like object containing `number` or `UNDEFINED` values.
         *
         * @param index The 0-based logical starting index.
         * @param values The array-like source of values.
         * @returns This instance for method chaining.
         * @throws Error if `index` is negative.
         * @example
         * const list = new Uint16NullList.RW(0, undefined);
         * list.set$(0, [1n, undefined, 2n]);
         * console.log(list.toJSON()); // [1, undefined, 2]
         */
        public set$( index: number, values: ArrayLike<number | UNDEFINED> ): RW<UNDEFINED>{
            for( let i = values.length; -1 < --i; ) this.set_$( index + i, values[i] );
            return this;
        }

        /**
         * Sets a range of elements from a `number` array.
         *
         * @param index The 0-based logical starting index.
         * @param src The source `number` array.
         * @param src_index The starting index in `src` (default: 0).
         * @param len The number of elements to copy (default: `src.length`).
         * @returns This instance for method chaining.
         * @throws Error if `index`, `src_index`, or `len` is negative, or if the source range is invalid.
         * @example
         * const list = new Uint16NullList.RW(0, undefined);
         * list.set__(0, [1n, 2n, 3n], 1, 2);
         * console.log(list.toJSON()); // [2, 3]
         */
        public set__( index: number, src: number[], src_index: number = 0, len: number = src.length ): RW<UNDEFINED>{
            if( index < 0 ) throw new Error( "Index cannot be negative" );
            if( src_index < 0 ) throw new Error( "Source index cannot be negative" );
            if( len < 0 ) throw new Error( "Length cannot be negative" );
            if( !src ) throw new Error( "Source array cannot be UNDEFINED" );
            if( src.length < src_index + len ) throw new Error( "Source range exceeds array bounds" );

            for( let i = len; -1 < --i; ) this.set_$( index + i, src[src_index + i] );
            return this;
        }

        /**
         * Sets a range of elements from an array containing `number` or `UNDEFINED` values.
         *
         * @param index The 0-based logical starting index.
         * @param src The source array.
         * @param src_index The starting index in `src` (default: 0).
         * @param len The number of elements to copy (default: `src.length`).
         * @returns This instance for method chaining.
         * @throws Error if `index`, `src_index`, or `len` is negative, or if the source range is invalid.
         * @example
         * const list = new Uint16NullList.RW(0, undefined);
         * list.set$$(0, [1n, undefined, 2n], 0, 2);
         * console.log(list.toJSON()); // [1, undefined]
         */
        public set$$( index: number, src: ( number | UNDEFINED )[], src_index: number, len: number ): RW<UNDEFINED>{
            if( index < 0 ) throw new Error( "Index cannot be negative" );
            if( src_index < 0 ) throw new Error( "Source index cannot be negative" );
            if( len < 0 ) throw new Error( "Length cannot be negative" );
            if( !src ) throw new Error( "Source array cannot be UNDEFINED" );
            if( src.length < src_index + len ) throw new Error( "Source range exceeds array bounds" );

            for( let i = len; -1 < --i; ) this.set_$( index + i, src[src_index + i] );
            return this;
        }

        /**
         * Appends all elements from an array to the end of the list.
         *
         * @param items The array of `number` or `UNDEFINED` values to append.
         * @returns This instance for method chaining.
         * @remarks May trigger a strategy switch if density changes significantly.
         * @example
         * const list = new Uint16NullList.RW(0, undefined);
         * list.add([1n, undefined, 2n]);
         * console.log(list.toJSON()); // [1, undefined, 2]
         */
        public add( items: ( number | UNDEFINED )[] ): RW<UNDEFINED> { return this.set$( this.size, items ); }

        /**
         * Appends a single element to the end of the list.
         *
         * @param value The `number` or `undefinedValue` to append.
         * @returns This instance for method chaining.
         * @remarks May trigger a switch to Flat Strategy if `cardinality` exceeds the threshold.
         * @example
         * const list = new Uint16NullList.RW(0, undefined);
         * list.append(1n).append(undefined);
         * console.log(list.toJSON()); // [1, undefined]
         */
        public append( value: number | UNDEFINED ): RW<UNDEFINED>{
            this.set_$( this.size, value );
            return this;
        }

        /**
         * Inserts a single element at the specified logical index.
         *
         * @param index The 0-based logical index for insertion (non-negative).
         * @param value The `number` or `undefinedValue` to insert.
         * @returns This instance for method chaining.
         * @throws Error if `index` is negative.
         * @remarks Shifts elements right and may extend the list with `UNDEFINED` elements.
         * @example
         * const list = new Uint16NullList.RW(0, undefined).append(2n);
         * list.add1(0, 1n);
         * console.log(list.toJSON()); // [1, 2]
         */
        public add1( index: number, value: number | UNDEFINED ): RW<UNDEFINED>{
            if( value === this.undefinedValue ){
                const s = this.size;
                this.nulls.add$( index, false );
                if( this.isFlatStrategy ) resize( this.values, this.values.length <= this.nulls.size - 1 ? ( this.values = new Uint16Array( ( ( this.nulls.size - 1 ) * 2 ) / 3 ) ) : this.values, index, s, 1 );
                return this;
            }
            if( index < 0 ) throw new Error( "Index cannot be negative" );
            if( index < this.size ){
                if( this.isFlatStrategy ){
                    this.nulls.add$( index, true );
                    resize( this.values, this.values.length <= this.nulls.size - 1 ? ( this.values = new Uint16Array( ( this.nulls.size * 3 ) / 2 ) ) : this.values, index, this.size - 1, 1 );
                    this.values[index] = <number>value;
                }else{
                    this.nulls.add$( index, true );
                    this._cardinality++;
                    const rank = this.nulls.rank( index ) - 1;
                    if( this.values.length <= this._cardinality && this._flatStrategyThreshold <= this._cardinality ){
                        this.switchToFlatStrategy();
                        this.values[index] = <number>value;
                        return this;
                    }
                    resize( this.values, this.values.length <= this._cardinality ? ( this.values = new Uint16Array( ( this._cardinality * 3 ) / 2 ) ) : this.values, rank, this._cardinality - 1, 1 );
                    this.values[rank] = <number>value;
                }
            }else this.set_$( index, value );
            return this;
        }

        /**
         * Appends all elements from another list.
         *
         * @param src The source list to append.
         * @returns This instance for method chaining.
         * @remarks Uses this list’s `undefinedValue` for `UNDEFINED` elements from `src`.
         * @example
         * const list1 = new Uint16NullList.RW(0, undefined).append(1n);
         * const list2 = new Uint16NullList.RW(0, undefined).append(2n);
         * list1.addAll(list2);
         * console.log(list1.toJSON()); // [1, 2]
         */
        public addAll( src: R ): RW<UNDEFINED>{
            for( let i = 0, s = src.size; i < s; i++ )
                if( src.hasValue( i ) ) this.append( <number>src.get( i ) );
                else this.nulls.set( this.nulls.size, false );
            return this;
        }

        /**
         * Clears all elements, resetting the list to empty.
         *
         * @returns This instance for method chaining.
         * @remarks Retains the `values` array’s capacity but resets `size` and `cardinality` to 0.
         * @example
         * const list = new Uint16NullList.RW(0, undefined).append(1n);
         * list.clear();
         * console.log(list.toJSON()); // []
         */
        public clear(): RW<UNDEFINED>{
            this._cardinality = 0;
            this.nulls.clear();
            return this;
        }

        /**
         * Sets the logical size and physical capacity of the list.
         *
         * @param length The new logical size (non-negative).
         * @throws Error if `length` is negative.
         * @remarks
         * - If `length < size`: Truncates the list and may switch to Compressed Strategy.
         * - If `length > size`: Extends with `UNDEFINED` elements.
         * - If `length = 0`: Clears the list.
         * @example
         * const list = new Uint16NullList.RW(0, undefined).append(1n);
         * list.length = 2;
         * console.log(list.toJSON()); // [1, undefined]
         */
        public set length( length: number ){
            if( length < 0 ) throw new Error( "length cannot be negative" );

            const shrink = length < this.nulls.size;
            this.nulls.length = length;

            if( length === 0 ){
                this._cardinality = 0;
                this.values = new Uint16Array();
                return;
            }

            if( this.isFlatStrategy ){
                if( shrink && this.nulls.cardinality() <= this._flatStrategyThreshold ) this.switchToCompressedStrategy();
                else if( this.values.length != length ) this.values = copyOf( this.values, length );
            }else{
                if( shrink ) this._cardinality = this.nulls.cardinality();
                if( this._flatStrategyThreshold <= this._cardinality ) this.switchToFlatStrategy_( length );
                else if( this.values.length != length ) this.values = copyOf( this.values, length );
            }
        }

        /**
         * Sets the logical size of the list.
         *
         * @param size The new logical size (non-negative).
         * @throws Error if `size` is negative.
         * @remarks
         * - If `size < current size`: Truncates the list.
         * - If `size > current size`: Extends with `UNDEFINED` elements.
         * - If `size = 0`: Clears the list.
         * @example
         * const list = new Uint16NullList.RW(0, undefined).append(1n);
         * list.size = 2;
         * console.log(list.toJSON()); // [1, undefined]
         */
        public set size( size: number ){
            if( size < 0 ) throw new Error( "size cannot be negative" );
            if( size === 0 ){
                this.clear();
                return;
            }

            if( this.size < size ) this.set_$( size - 1, this.undefinedValue );
            else{
                this.nulls.size = size;
                if( !this.isFlatStrategy ) this._cardinality = this.nulls.cardinality();
            }
        }

        /**
         * Trims the internal capacity to match the logical size.
         *
         * @returns This instance for method chaining.
         * @remarks Equivalent to `length = size`. May trigger a strategy switch.
         * @example
         * const list = new Uint16NullList.RW(10, undefined).append(1n);
         * list.fit();
         * console.log(list.length); // 1
         */
        public fit(): RW<UNDEFINED>{
            this.length = this.size;
            return this;
        }

        /**
         * Trims trailing `UNDEFINED` elements.
         *
         * @returns This instance for method chaining.
         * @remarks Sets `length` to the last non-`UNDEFINED` index + 1, or 0 if all elements are `UNDEFINED`.
         * @example
         * const list = new Uint16NullList.RW(0, undefined).append(1n).append(undefined);
         * list.trim();
         * console.log(list.toJSON()); // [1]
         */
        public trim(): RW<UNDEFINED>{
            this.length = this.nulls.last1() + 1;
            if( this.isFlatStrategy && this.cardinality < this._flatStrategyThreshold ) this.switchToCompressedStrategy();
            return this;
        }

        /**
         * Swaps elements at two logical indices.
         *
         * @param index1 The first 0-based logical index.
         * @param index2 The second 0-based logical index.
         * @returns This instance for method chaining.
         * @throws Error if either index is out of bounds.
         * @example
         * const list = new Uint16NullList.RW(0, undefined).append(1n).append(2n);
         * list.swap(0, 1);
         * console.log(list.toJSON()); // [2, 1]
         */
        public swap( index1: number, index2: number ): RW<UNDEFINED>{
            if( index1 < 0 || index1 >= this.size ) throw new Error( `Index1 out of bounds: ${ index1 }` );
            if( index2 < 0 || index2 >= this.size ) throw new Error( `Index2 out of bounds: ${ index2 }` );

            if( index1 === index2 ) return this;

            const v1 = this.hasValue( index1 ) ? this.get( index1 ) : this.undefinedValue;
            const v2 = this.hasValue( index2 ) ? this.get( index2 ) : this.undefinedValue;

            this.set_$( index1, v2 );
            this.set_$( index2, v1 );
            return this;
        }

        /**
         * Switches the storage to Flat Strategy with a specified capacity.
         *
         * @param capacity The target capacity for the `values` array.
         * @protected
         * @remarks Reallocates `values` and repositions non-`UNDEFINED` values to their logical indices.
         */
        protected switchToFlatStrategy_( capacity: number ): void{
            if( this.size === 0 ){
                if( this.values.length === capacity ) this.values = new Uint16Array( Math.max( 16, capacity ) );
                this.isFlatStrategy = true;
                this._cardinality = 0;
                return;
            }

            const compressed = this.values;
            this.values = new Uint16Array( capacity );
            for( let i = -1, ii = 0; ( i = this.nulls.next1( i ) ) != -1; ) this.values[i] = compressed[ii++];
            this.isFlatStrategy = true;
            this._cardinality = 0;
        }

        /**
         * Switches the storage to Flat Strategy.
         *
         * @protected
         * @remarks Uses the current `size` as the capacity for the new `values` array.
         */
        protected switchToFlatStrategy(): void { this.switchToFlatStrategy_( this.nulls.size ); }

        /**
         * Switches the storage to Compressed Strategy.
         *
         * @protected
         * @remarks Packs non-`UNDEFINED` values contiguously and updates `cardinality`.
         */
        protected switchToCompressedStrategy(): void{
            this._cardinality = this.nulls.cardinality();
            let ii = 0;
            for( let i = -1; ( i = this.nulls.next1( i ) ) != -1; ) if( i != ii ) this.values[ii++] = this.values[i];
            this.values = this.values.slice( 0, ii );
            this.isFlatStrategy = false;
        }
    }

    /**
     * Creates a new `Uint16Array` with the specified length, copying elements from the source.
     *
     * @param src The source `Uint16Array`.
     * @param newLength The desired length of the new array.
     * @returns A new `Uint16Array` with copied elements.
     * @private
     */
    function copyOf( src: Uint16Array, newLength: number ): Uint16Array{
        if( newLength == src.length ) return src;
        const ret = new Uint16Array( newLength );
        ret.set( src.subarray( 0, Math.min( src.length, newLength ) ) );
        return ret;
    }

    /**
     * Resizes the internal array, shifting elements for insertions or deletions.
     *
     * @param src The source `Uint16Array`.
     * @param dst The destination `Uint16Array`.
     * @param index The index where resizing occurs.
     * @param size The current size of the array.
     * @param resize The number of elements to add (positive) or remove (negative).
     * @returns The new size after resizing.
     * @throws RangeError if `index` or `size` is negative.
     * @private
     */
    function resize( src: Uint16Array, dst: Uint16Array, index: number, size: number, resize: number ): number{
        if( index < 0 ) throw new RangeError( "index cannot be negative" );
        if( size < 0 ) throw new RangeError( "size cannot be negative" );

        if( resize < 0 ){
            const removeCount = -resize;
            if( src !== dst && index > 0 ) dst.set( src.subarray( 0, index ), 0 );
            if( index + removeCount < size ){
                dst.set( src.subarray( index + removeCount, size ), index );
                return size - removeCount;
            }
            return index;
        }
        if( size > 0 ){
            if( index < size ){
                if( index === 0 ) dst.set( src.subarray( 0, size ), resize );
                else{
                    if( src !== dst && index > 0 ) dst.set( src.subarray( 0, index ), 0 );
                    dst.set( src.subarray( index, size ), index + resize );
                }
            }else if( src !== dst ) dst.set( src.subarray( 0, size ), 0 );
        }
        return Math.max( index, size ) + resize;
    }
}

export default Uint16NullList;