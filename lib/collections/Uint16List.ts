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
 * Namespace for managing lists of 64-bit unsigned integers (`number`) with efficient read-only and read-write operations.
 * Provides methods for adding, removing, searching, iterating, and sorting large unsigned integers.
 * @namespace
 */
export namespace Uint16List{
    /**
     * Read-only base class for a list of `number` values, backed by a `Uint16Array`.
     * Provides methods for accessing and querying elements without modification.
     */
    export class R{
        /**
         * Tag for identifying the class in string representation.
         * @returns The string tag "Uint16List.R".
         */
        get [Symbol.toStringTag](): string { return "Uint16List.R"; }

        /**
         * Sentinel value used for uninitialized elements when the list expands.
         * Must be a `number` that does not conflict with valid data in the use case.
         * @readonly
         */
        public readonly defaultValue: number;

        /**
         * Internal array storing the list's `number` values, dynamically resized as needed.
         * @protected
         */
        protected values: Uint16Array;

        /**
         * Current number of valid elements in the list, always less than or equal to the array's capacity.
         * @protected
         */
        protected _size: number = 0;

        /**
         * Creates a read-only list with a specified default value for uninitialized elements.
         * @param defaultValue - The `number` value used for uninitialized elements.
         * @example
         * const list = new Uint16List.R(0);
         */
        constructor( defaultValue: number ){
            this.defaultValue = defaultValue;
            this.values = O;
        }

        /**
         * Returns the internal `Uint16Array` containing the list's values.
         * @warning Direct modification of the returned array may corrupt the list's state and should be avoided.
         * @returns The internal `Uint16Array`.
         */
        public array(): Uint16Array { return this.values; }

        /**
         * Gets the current number of elements in the list.
         * @returns The number of valid elements.
         */
        public get size(): number { return this._size; }

        /**
         * Gets the capacity of the internal array.
         * @returns The length of the internal `Uint16Array`.
         */
        public get length(): number { return this.values.length; }

        /**
         * Checks if the list is empty.
         * @returns `true` if the list has no elements, `false` otherwise.
         */
        public get isEmpty(): boolean { return this._size === 0; }

        /**
         * Checks if the list contains a specific `number` value.
         * @param value - The `number` value to search for.
         * @returns `true` if the value is found, `false` otherwise.
         */
        public contains( value: number ): boolean { return this.indexOf( value ) !== -1; }

        /**
         * Copies a specified number of elements from the list to a destination array.
         * If no destination array is provided, a new one is created.
         * @param index - Starting index in the destination array.
         * @param len - Number of elements to copy.
         * @param dst - Destination `Uint16Array` or `null` to create a new array of size `len`.
         * @returns The populated destination array, or `null` if the list is empty.
         * @throws Error if `index` or `len` is negative, or if the range exceeds the destination array's bounds.
         * @example
         * const list = new Uint16List.RW(0).append(1n).append(2n);
         * const arr = list.toArray(0, 2, null); // Returns Uint16Array [1n, 2n]
         */
        public toArray( index: number, len: number, dst: Uint16Array | null ): Uint16Array | null { return this.values.slice( 0, this._size ); }

        /**
         * Checks if all elements from another list are present in this list.
         * @param src - The list whose elements are checked.
         * @returns `true` if all elements in `src` are present, `false` otherwise.
         */
        public containsAll( src: R ): boolean{
            for( let i = 0; i < src.size; i++ ) if( !this.contains( src.get( i ) ) ) return false;
            return true;
        }

        /**
         * Retrieves the value at a specific index.
         * @param index - The 0-based index of the element.
         * @returns The `number` value at the specified index.
         * @throws Error if `index` is negative or exceeds the list's size.
         */
        public get( index: number ): number{
            if( index < 0 || index >= this._size ) throw new Error( "Index out of bounds" );
            return this.values[index];
        }

        /**
         * Gets the last value in the list.
         * @returns The `number` value at the end of the list.
         * @throws Error if the list is empty.
         */
        public get last(): number{
            if( this._size === 0 ) throw new Error( "List is empty" );
            return this.values[this._size - 1];
        }

        /**
         * Copies a range of elements into a destination array with bounds checking.
         * @param dst - Destination `Uint16Array`.
         * @param dstIndex - Starting index in the destination array.
         * @param srcIndex - Starting index in this list.
         * @param len - Maximum number of elements to copy.
         * @returns The number of elements actually copied.
         * @throws Error if any index is negative or the range exceeds bounds.
         */
        public getRange( dst: Uint16Array, dstIndex: number, srcIndex: number, len: number ): number{
            if( dstIndex < 0 || srcIndex < 0 || len < 0 || dstIndex + len > dst.length || srcIndex + len > this._size )
                throw new Error( "Invalid parameters" );
            len = Math.min( Math.min( this._size - srcIndex, len ), dst.length - dstIndex );
            if( len < 1 ) return 0;
            for( let i = 0; i < len; i++ ) dst[dstIndex + i] = this.values[srcIndex + i];
            return len;
        }

        /**
         * Finds the first occurrence of a value in the list.
         * @param value - The `number` value to locate.
         * @returns The 0-based index of the first occurrence, or -1 if not found.
         */
        public indexOf( value: number ): number{
            for( let i = 0; i < this._size; i++ ) if( this.values[i] === value ) return i;
            return -1;
        }

        /**
         * Finds the first occurrence of a value starting from a specified index.
         * @param value - The `number` value to search for.
         * @param fromIndex - The 0-based index to start the search from (default: 0).
         * @returns The 0-based index of the first occurrence, or -1 if not found.
         */
        public indexOfFrom( value: number, fromIndex: number = 0 ): number{
            for( let i = Math.max( 0, fromIndex ); i < this._size; i++ ) if( this.values[i] === value ) return i;
            return -1;
        }

        /**
         * Checks if the list includes a specific value starting from an index.
         * @param value - The `number` value to search for.
         * @param fromIndex - The 0-based index to start the search from (default: 0).
         * @returns `true` if the value is found, `false` otherwise.
         */
        public includesValue( value: number, fromIndex: number = 0 ): boolean { return this.indexOfFrom( value, fromIndex ) !== -1; }

        /**
         * Executes a callback function for each element in the list.
         * @param callbackfn - Function to execute, receiving the current value, index, and list.
         * @param thisArg - Optional value to use as `this` in the callback.
         * @example
         * const list = new Uint16List.RW(0).append(1n).append(2n);
         * list.forEach((value, index) => console.log(`${index}: ${value}`));
         * // Outputs: 0: 1, 1: 2
         */
        public forEach( callbackfn: ( value: number, index: number, list: R ) => void, thisArg?: any ): void{
            for( let i = 0; i < this._size; i++ ) callbackfn.call( thisArg, this.values[i], i, this );
        }

        /**
         * Finds the last occurrence of a value in the list.
         * @param value - The `number` value to locate.
         * @returns The 0-based index of the last occurrence, or -1 if not found.
         */
        public lastIndexOf( value: number ): number{
            for( let i = this._size - 1; i >= 0; i-- ) if( this.values[i] === value ) return i;
            return -1;
        }

        /**
         * Compares two `R` instances for equality based on size and element values.
         * @param one - The first `R` instance (or `undefined`).
         * @param two - The second `R` instance (or `undefined`).
         * @returns `true` if the lists are equal (same size and identical elements), `false` otherwise.
         */
        static equals( one: R | undefined, two: R | undefined ): boolean{
            if( one === two ) return true;
            return !!one && !!two && one.size === two.size && AdHoc.equals_arrays( one.values, two.values, Object.is, one.size );
        }

        /**
         * Generates a hash code for an `R` instance.
         * @param hash - The initial hash value to combine with.
         * @param src - The `R` instance to hash (or `undefined`).
         * @returns The combined hash value.
         */
        static hash( hash: number, src: R | undefined ): number{
            return src ?
                   AdHoc.mix( hash, AdHoc.hash_array( hash, src.values, AdHoc.hash_number, src._size ) ) :
                   hash;
        }

        /**
         * Creates a shallow copy of the list.
         * @returns A new `R` instance with copied elements and the same `defaultValue`.
         */
        public clone(): R{
            const cloned = new R( this.defaultValue );
            cloned.values = new Uint16Array( this.values );
            cloned._size = this._size;
            return cloned;
        }

        /**
         * Returns a string representation of the list, including length, size, and JSON data.
         * @returns A string describing the list's state and elements.
         */
        public toString(): string { return `length = ${ this.length }, size = ${ this.size }\n${ this.toJSON() }`; }

        /**
         * Serializes the list to a JSON string, converting `number` values to strings.
         * @returns A JSON array string of the list's elements.
         * @example
         * const list = new Uint16List.RW(0).append(1n).append(2n);
         * console.log(list.toJSON()); // ["1", "2"]
         */
        public toJSON(): string[]{
            const result = new Array<string>( this._size );
            for( let i = 0; i < this._size; i++ )
                result[i] = this.values[i].toString();
            return result;
        }

        /**
         * Returns an iterator over the list's valid elements.
         * @returns An iterator yielding `number` values from index 0 to `size - 1`.
         * @example
         * const list = new Uint16List.RW(0).append(1n).append(2n);
         * for (const value of list) console.log(value); // Outputs: 1, 2
         */
        public [Symbol.iterator](): IterableIterator<number> { return this.values.subarray( 0, this._size ).values(); }
    }

    /**
     * An empty, constant `Uint16Array` used to avoid allocations for empty lists.
     * @private
     */
    const O = new Uint16Array( 0 );

    /**
     * Read-write extension of `R`, adding methods to modify the list of `number` values.
     */
    export class RW extends R{
        /**
         * Tag for identifying the class in string representation.
         * @returns The string tag "Uint16List.RW".
         */
        get [Symbol.toStringTag](): string { return "Uint16List.RW"; }

        /**
         * Creates an empty list with a specified initial capacity or a list with initialized elements.
         * @param lengthOrDefaultValue - If a number, the initial capacity; if a `number`, the default value for uninitialized elements.
         * @param size - If provided, the initial size (if positive) or capacity (if negative, using absolute value).
         * @example
         * const emptyList = new Uint16List.RW(10); // Capacity of 10
         * const filledList = new Uint16List.RW(0, 5); // Size 5, filled with 0
         */
        constructor( lengthOrDefaultValue: number | number, size?: number ){
            if( typeof lengthOrDefaultValue === "number" ){
                super( 0 );
                this.values = lengthOrDefaultValue > 0 ?
                              new Uint16Array( lengthOrDefaultValue ) :
                              O;
            }else{
                super( lengthOrDefaultValue );
                const sizeVal = size ?? 0;
                this.values = sizeVal === 0 ?
                              O :
                              new Uint16Array( sizeVal < 0 ?
                                                  -sizeVal :
                                                  sizeVal );
                this._size = sizeVal < 0 ?
                             -sizeVal :
                             sizeVal;
                if( sizeVal > 0 && lengthOrDefaultValue !== 0 ) this.values.fill( lengthOrDefaultValue, 0, this._size );
            }
        }

        /**
         * Appends a `number` value to the end of the list, resizing if necessary.
         * @param value - The `number` value to append.
         * @returns This instance for method chaining.
         * @example
         * const list = new Uint16List.RW(0).append(1n).append(2n);
         * console.log(list.toJSON()); // ["1", "2"]
         */
        public append( value: number ): RW { return this.add1( this._size, value ); }

        /**
         * Inserts a `number` value at the specified index, shifting elements rightward.
         * @param index - The 0-based index for insertion.
         * @param value - The `number` value to insert.
         * @returns This instance for method chaining.
         * @throws Error if `index` is negative or exceeds `size + 1`.
         */
        public add1( index: number, value: number ): RW{
            const max: number = Math.max( index, this.size + 1 );
            this.size = resize( this.values, this.values.length <= max ?
                                             ( this.values = new Uint16Array( max + Math.floor( max / 2 ) ) ) :
                                             this.values, index, this.size, 1 );
            this.values[index] = value;
            return this;
        }

        /**
         * Appends multiple `number` values to the end of the list.
         * @param src - The `number` values to append.
         * @returns This instance for method chaining.
         * @example
         * const list = new Uint16List.RW(0).add(1n, 2n, 3n);
         * console.log(list.toJSON()); // ["1", "2", "3"]
         */
        public add( ...src: number[] ): RW { return this.addAt( this._size, src, 0, src.length ); }

        /**
         * Inserts a range of `number` values from an array at a specified index.
         * @param index - The 0-based index in this list to insert at.
         * @param src - Source array of `number` values.
         * @param srcIndex - Starting index in the source array.
         * @param len - Number of elements to insert.
         * @returns This instance for method chaining.
         * @throws Error if indices or length are invalid.
         */
        public addAt( index: number, src: number[], srcIndex: number, len: number ): RW{
            if( index < 0 || index > this._size || srcIndex < 0 || len < 0 || srcIndex + len > src.length )
                throw new Error( "Invalid parameters" );
            const max: number = Math.max( index, this.size ) + len;
            this.size = resize( this.values, this.values.length < max ?
                                             ( this.values = new Uint16Array( max + Math.floor( max / 2 ) ) ) :
                                             this.values, index, this.size, len );
            for( let i = 0; i < len; i++ ) this.values[index + i] = src[srcIndex + i];
            return this;
        }

        /**
         * Removes the last element from the list.
         * @returns This instance for method chaining.
         * @example
         * const list = new Uint16List.RW(0).append(1n).append(2n);
         * list.remove();
         * console.log(list.toJSON()); // ["1"]
         */
        public remove(): RW{
            if( this._size === 0 ) return this;
            this._size--;
            return this;
        }

        /**
         * Removes the element at a specified index, shifting subsequent elements leftward.
         * @param index - The 0-based index of the element to remove.
         * @returns This instance for method chaining.
         * @example
         * const list = new Uint16List.RW(0).add(1n, 2n, 3n);
         * list.removeAt(1);
         * console.log(list.toJSON()); // ["1", "3"]
         */
        public removeAt( index: number ): RW{
            if( index < 0 || index >= this._size ) return this;
            this.values.copyWithin( index, index + 1, this._size );
            this._size--;
            return this;
        }

        /**
         * Removes a range of elements starting at the specified index.
         * @param index - The 0-based starting index.
         * @param len - Number of elements to remove.
         * @returns This instance for method chaining.
         * @throws Error if `index` or `len` is negative or `index` exceeds size.
         */
        public removeRange( index: number, len: number ): RW{
            if( index < 0 || len < 0 || index >= this._size ) return this;
            len = Math.min( len, this._size - index );
            if( len === 0 ) return this;
            this.values.copyWithin( index, index + len, this._size );
            this._size -= len;
            return this;
        }

        /**
         * Sets the value at the end of the list, expanding if necessary with `defaultValue`.
         * @param value - The `number` value to set.
         * @returns This instance for method chaining.
         */
        public setLast( value: number ): RW { return this.set1( Math.max( 0, this.size - 1 ), value ); }

        /**
         * Sets a value at a specific index, expanding the list if needed.
         * @param index - The 0-based index to set the value.
         * @param value - The `number` value to set.
         * @returns This instance for method chaining.
         * @throws Error if `index` is negative.
         * @example
         * const list = new Uint16List.RW(0).append(1n);
         * list.set1(0, 10);
         * console.log(list.toJSON()); // ["10"]
         */
        public set1( index: number, value: number ): RW{
            if( index < 0 ) throw new Error( "Index cannot be negative" );
            if( index >= this.values.length ) this.values = copyOf( this.values, index + Math.max( 1, Math.floor( index / 2 ) ) );
            if( index >= this._size ){
                if( this.defaultValue !== 0 ) this.values.fill( this.defaultValue, this._size, index );
                this._size = index + 1;
            }
            this.values[index] = value;
            return this;
        }

        /**
         * Sets multiple `number` values starting at a specified index.
         * @param index - The 0-based index to start setting values.
         * @param src - The `number` values to set.
         * @returns This instance for method chaining.
         */
        public set( index: number, ...src: number[] ): RW { return this.setRange( index, src, 0, src.length ); }

        /**
         * Sets a range of `number` values from an array, expanding the list if necessary.
         * @param index - The 0-based index in this list to start setting.
         * @param src - Source array of `number` values.
         * @param srcIndex - Starting index in the source array.
         * @param len - Number of elements to set.
         * @returns This instance for method chaining.
         * @throws Error if indices or length are invalid.
         */
        public setRange( index: number, src: number[], srcIndex: number, len: number ): RW{
            if( index < 0 || srcIndex < 0 || len < 0 || srcIndex + len > src.length )
                throw new Error( "Invalid parameters" );
            if( index + len > this.values.length )
                this.values = copyOf( this.values, index + len + Math.floor( ( index + len ) / 2 ) );
            if( index + len > this._size ){
                if( this.defaultValue !== 0 ) this.values.fill( this.defaultValue, this._size, index );
                this._size = index + len;
            }
            for( let i = 0; i < len; i++ ) this.values[index + i] = src[srcIndex + i];
            return this;
        }

        /**
         * Swaps the elements at two specified indices.
         * @param index1 - The first 0-based index.
         * @param index2 - The second 0-based index.
         * @returns This instance for method chaining.
         * @throws Error if either index is negative or exceeds the list's size.
         */
        public swap( index1: number, index2: number ): RW{
            if( index1 < 0 || index1 >= this._size || index2 < 0 || index2 >= this._size )
                throw new Error( `Index must be non-negative and less than the list's size: index1=${ index1 }, index2=${ index2 }` );
            const tmp = this.values[index1];
            this.values[index1] = this.values[index2];
            this.values[index2] = tmp;
            return this;
        }

        /**
         * Removes all elements present in another list.
         * @param src - The `R` instance containing elements to remove.
         * @returns The number of elements removed.
         */
        public removeAll( src: R ): number{
            if( src.isEmpty || this.isEmpty )
                return 0;

            const initialSize = this._size;
            const valuesToRemove = new Set<number>( src ); // Create a Set for efficient lookups

            if( valuesToRemove.size === 0 )
                return 0;

            let writeIndex = 0;
            for( let readIndex = 0; readIndex < this._size; readIndex++ ){
                const value = this.values[readIndex];
                if( !valuesToRemove.has( value ) ){
                    if( writeIndex !== readIndex )
                        this.values[writeIndex] = value;
                    writeIndex++;
                }
            }
            this._size = writeIndex;
            return initialSize - this._size;
        }

        /**
         * Removes all occurrences of a specific `number` value.
         * @param src - The `number` value to remove.
         * @returns The number of elements removed.
         * @example
         * const list = new Uint16List.RW(0).add(1n, 2n, 1n);
         * list.removeAllValue(1n);
         * console.log(list.toJSON()); // ["2"]
         */
        public removeAllValue( src: number ): number{
            const initialSize = this._size;
            let writeIndex = 0;
            for( let readIndex = 0; readIndex < this._size; readIndex++ )
                if( this.values[readIndex] !== src ) this.values[writeIndex++] = this.values[readIndex];
            this._size = writeIndex;
            return initialSize - this._size;
        }

        /**
         * Quickly removes all occurrences of a `number` value by replacing with the last element, possibly reordering the list.
         * @param valueToRemove - The `number` value to remove.
         * @returns This instance for method chaining.
         */
        removeAll_fast( valueToRemove: number ): RW{
            let i = 0;
            while( i < this._size )
                if( this.values[i] === valueToRemove ){
                    // Replace with the last element and shrink size
                    this.values[i] = this.values[--this._size];
                    // Do not increment i, so we can re-check the new value at the current index
                }else
                    i++;
            return this;
        }

        /**
         * Quickly removes an element by replacing it with the last element, possibly reordering the list.
         * @param index - The 0-based index of the element to remove.
         * @returns This instance for method chaining.
         * @throws RangeError if `index` is out of bounds.
         */
        remove_fast( index: number ): RW{
            if( index < 0 || index >= this._size ) throw new RangeError( "Index out of bounds" );
            this.values[index] = this.values[--this._size];
            return this;
        }

        /**
         * Retains only elements present in another list, removing all others.
         * @param chk - The `R` instance containing elements to retain, or `null`.
         * @returns `true` if the list was modified, `false` otherwise.
         */
        public retainAll( chk: R | null ): boolean{
            if( chk === null || this._size === 0 ) return false;
            const initialSize = this._size;
            let writeIndex = 0;
            for( let i = 0; i < this._size; i++ ) if( chk.contains( this.values[i] ) ) this.values[writeIndex++] = this.values[i];
            this._size = writeIndex;
            return initialSize !== this._size;
        }

        /**
         * Clears the list, setting its size to 0 without changing capacity.
         * @returns This instance for method chaining.
         */
        public clear(): RW{
            this._size = 0;
            return this;
        }

        /**
         * Trims the internal array's capacity to match the current size.
         * @returns This instance for method chaining.
         */
        public fit(): RW{
            if( this.values.length > this._size ) this.values = copyOf( this.values, this._size );
            return this;
        }

        /**
         * Gets the capacity of the internal array.
         * @returns The length of the internal `Uint16Array`.
         */
        public get length(): number { return this.values.length; }

        /**
         * Sets the capacity of the internal array, truncating or expanding as needed.
         * @param length - The new capacity; if less than 1, clears the list.
         * @throws Error if `length` is negative.
         */
        public set length( length: number ){
            if( length < 0 ) throw new Error( "length cannot be negative" );
            if( this.values.length !== length ){
                if( length < 1 ){
                    this.values = O;
                    this._size = 0;
                    return;
                }
                this.values = copyOf( this.values, length );
                if( length < this._size ) this._size = length;
            }
        }

        /**
         * Gets the current number of elements in the list.
         * @returns The number of valid elements.
         */
        public get size(): number { return this._size; }

        /**
         * Sets the list's size, expanding with `defaultValue` or truncating as needed.
         * @param size - The new size; if less than 1, clears the list.
         * @throws Error if `size` is negative.
         */
        public set size( size: number ){
            if( size < 0 ) throw new Error( "size cannot be negative" );
            if( size < this._size ) this._size = size;
            else if( size > this._size ) this.set1( size - 1, this.defaultValue );
        }

        /**
         * Creates a new array with the results of applying a callback to each element.
         * @param callbackfn - Function to apply, receiving the current value, index, and list.
         * @param thisArg - Optional value to use as `this` in the callback.
         * @returns A new array with the transformed values.
         * @example
         * const list = new Uint16List.RW(0).add(1n, 2n);
         * const doubled = list.mapValue((v) => Number(v) * 2);
         * console.log(doubled); // [2, 4]
         */
        public mapValue<U>( callbackfn: ( value: number, index: number, list: RW ) => U, thisArg?: any ): U[]{
            const result: U[] = new Array( this._size );
            for( let i = 0; i < this._size; i++ ) result[i] = callbackfn.call( thisArg, this.values[i], i, this );
            return result;
        }

        /**
         * Creates a new `RW` list with elements that pass a test.
         * @param predicate - Function to test each element, receiving the value, index, and list.
         * @param thisArg - Optional value to use as `this` in the predicate.
         * @returns A new `RW` list with elements that pass the test.
         * @example
         * const list = new Uint16List.RW(0).add(1n, 2n, 3n);
         * const evens = list.filter((v) => v % 2n === 0);
         * console.log(evens.toJSON()); // ["2"]
         */
        public filter( predicate: ( value: number, index: number, list: RW ) => boolean, thisArg?: any ): RW{
            const filteredList = new RW( this.defaultValue, 0 );
            for( let i = 0; i < this._size; i++ ) if( predicate.call( thisArg, this.values[i], i, this ) ) filteredList.append( this.values[i] );
            return filteredList;
        }

        /**
         * Sorts the list in place, using numerical order by default.
         * @param compareFn - Optional function to define sort order; defaults to ascending numerical order.
         * @returns This instance, sorted in place.
         * @example
         * const list = new Uint16List.RW(0).add(3n, 1n, 2n);
         * list.sortValues();
         * console.log(list.toJSON()); // ["1", "2", "3"]
         */
        public sortValues( compareFn?: ( a: number, b: number ) => number ): RW{
            if( this._size > 1 )
                this.values.subarray( 0, this._size ).sort( compareFn );

            return this;
        }

        /**
         * Creates a shallow copy of the list.
         * @returns A new `RW` instance with copied elements and the same `defaultValue`.
         */
        public clone(): RW{
            const cloned = new RW( this.defaultValue, this._size );
            cloned.values.set( this.values.subarray( 0, this._size ) );
            cloned._size = this._size;
            return cloned;
        }
    }

    /**
     * Creates a new `Uint16Array` with the specified length, copying elements from the source.
     * @param src - The source `Uint16Array`.
     * @param newLength - The desired length of the new array.
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
     * Resizes the internal array, shifting elements to accommodate insertions or deletions.
     * @param src - The source `Uint16Array`.
     * @param dst - The destination `Uint16Array`.
     * @param index - The index where resizing occurs.
     * @param size - The current size of the list.
     * @param resize - The number of elements to add (positive) or remove (negative).
     * @returns The new size of the list.
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
        if( size > 0 )
            if( index < size )
                if( index === 0 ) dst.set( src.subarray( 0, size ), resize );
                else{
                    if( src !== dst && index > 0 ) dst.set( src.subarray( 0, index ), 0 );
                    dst.set( src.subarray( index, size ), index + resize );
                }
            else if( src !== dst ) dst.set( src.subarray( 0, size ), 0 );
        return Math.max( index, size ) + resize;
    }
}

export default Uint16List;