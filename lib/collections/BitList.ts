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


import AdHoc from "../AdHoc"

export namespace BitList{

    function copyOf( src: Uint32Array, newLength: number ): Uint32Array{
        if( newLength == src.length ) return src;

        const ret = new Uint32Array( newLength );
        ret.set( src.subarray( 0, Math.min( src.length, newLength ) ) );
        return ret;
    }

    /**
     * An abstract base class providing a read-only view and core implementation
     * details for a {@link BitList}.
     * <para>
     * <b>Bit Indexing and Representation:</b>
     * .                 MSB                LSB
     * .                 |                 |
     * bits in the list [0, 0, 0, 1, 1, 1, 1] Leading 3 zeros and trailing 4 ones
     * index in the list 6 5 4 3 2 1 0
     * shift left  ≪
     * shift right  ≫
     * </para>
     * <para>
     * <b>Storage Optimization:</b>
     * This class utilizes several optimizations:
     * <list type="bullet">
     *     <item><b>Trailing Ones ({@link trailingOnesCount}):</b> A sequence of '1' bits at the
     *     beginning (indices 0 to {@link trailingOnesCount} - 1) are stored implicitly
     *     by just keeping count, not using space in the {@link values} array.</item>
     *     <item><b>Explicit Bits ({@link values}):</b> Bits *after* the implicit trailing ones
     *     are packed into a {@link Uint32Array} array. The first conceptual bit stored in
     *     {@link values} always corresponds to the first '0' bit after the trailing ones.
     *     The last bit stored in {@link values} corresponds to the highest-indexed '1'
     *     bit ({@link R.last1}).</item>
     *     <item><b>Trailing Zeros:</b> '0' bits from index {@link R.last1} + 1 up to
     *     {@link R.size} - 1 are also implicit and not stored in {@link values}.</item>
     *     <item><b>Used Count ({@link _used}):</b> Tracks how many {@link number} elements in the
     *     {@link values} array actually contain non-zero data, allowing the array to
     *     potentially be larger than strictly needed for current bits.</item>
     * </list>
     * This structure provides the foundation for concrete readable and writable
     * {@link BitList} implementations.
     * </para>
     */
    export abstract class R{
        /**
         * The logical number of bits in this list. This defines the valid range of
         * indices [0, size-1].
         * It includes implicitly stored trailing ones and trailing zeros, as well as
         * explicitly stored bits in {@code values}.
         */
        protected _size: number = 0;
        /**
         * The count of consecutive '1' bits starting from index 0. These bits are
         * stored implicitly and are *not* represented in the {@code values} array.
         * If {@code trailingOnesCount} is 0, the list starts with a '0' (or is empty).
         */
        protected trailingOnesCount: number = 0;

        /**
         * The backing array storing the explicit bits of the {@code BitList}.
         * <p>
         * Contains bits from index {@code trailingOnesCount} up to {@link R.last1}.
         * Bits are packed into {@code number}s, 32 bits per element.
         * Within each {@code number}, bits are stored LSB-first (index 0 of the conceptual
         * sub-array of 32 bits corresponds to the lowest index within that block).
         * The {@code values} array element at index {@code i} stores bits corresponding
         * to the global bit indices
         * {@code [trailingOnesCount + i*32, trailingOnesCount + (i+1)*32 - 1]}.
         * <p>
         * Trailing zeros beyond {@link R.last1} up to {@link R.size} are not stored.
         * May contain trailing {@code number} elements that are all zero.
         * Initialized to a shared empty array for efficiency.
         */
        protected values: Uint32Array = new Uint32Array( 0 );
        /**
         * The number of {@code number} elements currently used in the {@code values} array.
         * This is the index of the highest element containing a '1' bit, plus one.
         * It can be less than {@code values.length}.
         * A negative value (specifically, having the sign bit set via {@code _used |= IO})
         * indicates that the count might be stale (due to operations like clearing bits
         * in the last used word) and needs recalculation via {@link R.used}.
         */
        protected _used: number = 0;

        /**
         * Returns the logical size (number of bits) of this {@code BitList}.
         * This determines the valid range of bit indices [0, size-1].
         *
         * @return The number of bits in the list.
         */
        get size(): number{ return this._size; }

        /**
         * Calculates the minimum number of {@code number} elements needed to store a
         * given number of bits.
         *
         * @param bits The number of bits.
         * @return The required length of a {@code Uint32Array} array.
         */
        static len4bits( bits: number ): number{ return ( bits + R.BITS - 1 ) >> R.LEN; }

        /**
         * The base-2 logarithm of {@link R.BITS}, used for calculating array indices
         * ({@code bit >> LEN}). Value is 5 (for 32-bit words).
         */
        protected static readonly LEN: number = 5; // log2(32)
        /**
         * The number of bits in a {@code number} (element of Uint32Array). Value is 32.
         */
        protected static readonly BITS: number = 1 << R.LEN; // 32
        /**
         * A mask to extract the bit position within a {@code number} element
         * ({@code bit & MASK}). Value is 31 (0b11111 for 32-bit words).
         */
        protected static readonly MASK: number = R.BITS - 1; // 31

        /**
         * Calculates the index within the {@code values} array corresponding to a
         * global bit index. Note: This does *not* account for {@code trailingOnesCount}.
         * The bit index must be relative to the start of the `values` array.
         *
         * @param bit The bit index *relative to the start of the {@code values} array*.
         * @return The index in the {@code values} array.
         */
        static index( bit: number ): number{ return bit >> R.LEN; }

        /**
         * Creates a {@code number} mask with the least significant {@code bits} set to '1'.
         * For example, {@code mask(3)} returns {@code 0b111} (7).
         * If {@code bits} is 0, returns 0. If {@code bits} is 32 or more, returns -1 (all ones for 32-bit signed, which is 0xFFFFFFFF).
         *
         * @param bits The number of low-order bits to set (0-32).
         * @return A {@code number} with the specified number of LSBs set.
         */
        static mask( bits: number ): number{
            bits |= 0; // Ensure integer
            if( bits <= 0 ) return 0;
            if( bits >= R.BITS ) return -1; // All 1s for a 32-bit word (0xFFFFFFFF)
            return ( 1 << bits ) - 1;
        }

        /**
         * Integer maximum value constant ({@code 0x7FFFFFFF}). Used for bit manipulation on {@code _used}.
         */
        static readonly OI: number = 0x7FFFFFFF;
        /**
         * Integer minimum value constant ({@code 0x80000000}). Used to mark the {@code _used} count as potentially stale.
         */
        static readonly IO: number = 0x80000000 | 0; // Ensure it's a 32-bit signed negative number

        /**
         * Calculates or retrieves the number of {@code number} elements in the
         * {@code values} array that are actively used (contain at least one '1' bit).
         * <p>
         * If the internal {@code _used} field is non-negative, it's considered accurate
         * and returned directly. If it's negative (marked stale via {@code _used |= IO}),
         * this method recalculates the count by scanning {@code values} backwards from
         * the last known potential position to find the highest-indexed non-zero element.
         * The internal {@code _used} field is updated with the accurate count before returning.
         *
         * @return The number of {@code number} elements in {@code values} actively storing bits.
         * Returns 0 if {@code values} is empty or contains only zeros.
         */
        protected used(): number{ // Corresponds to protected int used() in Java
            // Check if `_used` is positive, indicating a cached and valid value. Return
            // directly if valid.
            if( this._used >= 0 ) return this._used;

            // `_used` is negative, recalculation is needed. Clear the sign bit to get the
            // last known count.
            this._used &= R.OI;

            // Start scanning backwards from the last known used index to find the highest
            // non-zero element.
            let u = this._used - 1;

            // Iterate backwards, skipping zeroed longs to find the actual used length.
            while( u >= 0 && this.values[u] === 0 ) u--;

            // Update `_used` with the new count (index + 1) and return it.
            return this._used = u + 1;
        }

        /**
         * Ensures the internal state (`_size` and `values` array capacity) can accommodate
         * the specified bit index, expanding if necessary. It also returns the calculated
         * index within the `values` array for the given bit.
         * <p>
         * If {@code bit} is greater than or equal to the current {@link R.size},
         * {@code _size} is updated to {@code bit + 1}.
         * If the calculated {@code values} index is outside the current bounds of used elements
         * or the allocated length of {@code values}, the `values` array is resized (typically
         * grows by 50%) and the `_used` count is updated.
         *
         * @param bit The global bit position (0-indexed) to ensure accommodation for.
         * @return The index in the {@code values} array where the bit resides,
         * or -1 if the bit falls within the implicit {@code trailingOnesCount} range.
         */
        protected used_( bit: number ): number{

            if( this.size <= bit ) this._size = bit + 1;
            const index = ( bit - this.trailingOnesCount ) >> R.LEN;
            if( index < 0 ) return -1; // Within trailing '1's

            const currentActualUsed = this.used(); // Ensures _used is positive and correct
            if( index < currentActualUsed ) return index;

            this._used = index + 1; // _used is now positive and represents the new count
            if( this.values.length < this._used )
                this.values = copyOf( this.values, Math.max( this.values.length + ( this.values.length >> 1 ), this._used ) );
            return index;
        }

        /**
         * Retrieves the value of the bit at the specified global index.
         *
         * @param bit The global bit index (0-indexed) to retrieve.
         * @return {@code true} if the bit at the specified index is '1', {@code false}
         * if it is '0'. Returns {@code false} if the index is negative or
         * greater than or equal to {@link R.size}.
         */
        public get( bit: number ): boolean{
            if( bit < 0 || bit >= this.size ) return false;
            if( bit < this.trailingOnesCount ) return true;
            const index = ( bit - this.trailingOnesCount ) >> R.LEN;
            return index < this.used() && ( this.values[index] & ( 1 << ( ( bit - this.trailingOnesCount ) & R.MASK ) ) ) !== 0;
        }

        /**
         * Retrieves the value of the bit at the specified index and returns one of two
         * provided primitive values based on the result.
         * This is a convenience method equivalent to {@code get(bit) ? TRUE : FALSE}.
         *
         * @param bit   The global bit index (0-indexed) to check.
         * @param FALSE The value to return if the bit at {@code bit} is '0' or out of bounds.
         * @param TRUE  The value to return if the bit at {@code bit} is '1'.
         * @return {@code TRUE} if {@code get(bit)} is true, otherwise {@code FALSE}.
         */
        public get_( bit: number, FALSE: number, TRUE: number ): number{
            return this.get( bit ) ?
                   TRUE :
                   FALSE;
        }

        /**
         * Copies a range of bits from this {@code BitList} into a destination
         * {@code Uint32Array} array, starting at the beginning of the destination array.
         * <p>
         * Bits are copied starting from {@code from_bit} (inclusive) up to
         * {@code to_bit} (exclusive). The destination array {@code dst} is assumed
         * to be zero-initialized or the caller handles merging. Bits are packed into
         * {@code dst} starting at index 0, bit 0.
         *
         * @param dst      The destination {@code Uint32Array} array to copy bits into.
         * @param from_bit The starting global bit index in this {@code BitList} (inclusive).
         * @param to_bit   The ending global bit index in this {@code BitList} (exclusive).
         * @return The number of bits actually copied. This may be less than
         * {@code to_bit - from_bit} if the range exceeds the list's size or
         * the destination array's capacity. Returns 0 if the range is invalid
         * or out of bounds.
         */
        public get$( dst: Uint32Array, from_bit: number, to_bit: number ): number{
            if( to_bit <= from_bit || from_bit < 0 || this._size <= from_bit ) return 0;
            to_bit = Math.min( to_bit, this._size );
            const bits_to_copy = to_bit - from_bit;

            // Calculate number of full 32-bit chunks that fit in dst
            const full_words = Math.min( bits_to_copy >> R.LEN, dst.length );

            for( let i = 0; i < full_words; i++ )
                dst[i] = this.get32( from_bit + i * R.BITS );

            let copied_bits = full_words * R.BITS;
            const remaining_bits = bits_to_copy - copied_bits;
            if( remaining_bits === 0 ) return copied_bits;

            if( full_words < dst.length ){ // Check if there's space for the partial word
                dst[full_words] = this.get32( from_bit + copied_bits ) & R.mask( remaining_bits );
                return copied_bits + remaining_bits;
            }
            return copied_bits;
        }


        /**
         * Finds the index of the next '1' bit in this {@link BitList} after the specified bit index.
         * <p>
         * This method searches for the first bit set to '1' starting from the position immediately
         * following the given {@code bit} index. If no '1' bit is found, or if the input is invalid,
         * it returns -1.
         * </p>
         *
         * @param bit The starting bit index (exclusive) for the search. A value of -1 starts the search from index 0.
         * @return The index of the next '1' bit, or -1 if no '1' bit is found or if the list is empty or the input is less than -1.
         */
        public next1( bit: number ): number{
            if( this.size === 0 || ++bit < 0 || this.size <= bit ) return -1; //Java bit++ < -1 is same as ++bit < 0
            if( bit < this.trailingOnesCount ) return bit;

            const last1 = this.last1();
            if( bit === last1 ) return last1; // This was bit == last1, if last1 is the only 1 bit after toc
            if( last1 < bit ) return -1;

            const bitOffset = bit - this.trailingOnesCount;
            let index = bitOffset >>> R.LEN;

            for( let value = this.values[index] & ( ~0 << ( bitOffset & R.MASK ) ); ; value = this.values[++index] )
                if( value !== 0 )
                    return this.trailingOnesCount + ( index << R.LEN ) + AdHoc.numberOfTrailingZeros( value );
        }

        /**
         * Finds the index of the next '0' bit in this {@link BitList} after the specified bit index.
         * <p>
         * This method searches for the first bit set to '0' starting from the position immediately
         * following the given {@code bit} index. If no '0' bit is found, or if the input is invalid,
         * it returns -1.
         * </p>
         *
         * @param bit The starting bit index (exclusive) for the search. A value of -1 starts the search from index 0.
         * @return The index of the next '0' bit, or -1 if no '0' bit is found or if the list is empty.
         */
        public next0( bit: number ): number{
            if( this.size === 0 ) return -1;

            if( ++bit < this.trailingOnesCount )
                return this.trailingOnesCount === this.size ?
                       -1 :
                       this.trailingOnesCount;

            if( this.size <= bit ) return -1;

            const last1 = this.last1();

            if( bit === last1 )
                return last1 + 1 < this.size ?
                       bit + 1 :
                       -1;

            if( last1 < bit )
                return last1 + 1 < this.size ?
                       bit :
                       -1;


            // Adjust bit position relative to the end of trailing ones
            const bitOffset = bit - this.trailingOnesCount;
            let index = bitOffset >> R.LEN; // Which long in values array


            for( let value = ~this.values[index] & ~0 << ( bitOffset & R.MASK ); ; value = ~this.values[++index] )
                if( value != 0 )
                    return this.trailingOnesCount + ( index << R.LEN ) + AdHoc.numberOfTrailingZeros( value );
        }

        /**
         * Finds the index of the previous '1' bit in this {@link BitList} before the specified bit index.
         * <p>
         * This method searches backward for the first bit set to '1' starting from the position
         * immediately preceding the given {@code bit} index. If no '1' bit is found, or if the input
         * is invalid, it returns -1.
         * </p>
         *
         * @param bit The starting bit index (exclusive) for the backward search. If -1 or greater than or equal to the list size, the search starts from the last index.
         * @return The index of the previous '1' bit, or -1 if no '1' bit is found or if the list is empty or the input is less than -1.
         */
        public prev1( bit: number ): number{
            if( this.size === 0 || bit < -1 ) return -1;

            bit = ( this.size <= bit || bit === -1 ) ?
                  this.size - 1 :
                  bit - 1;

            if( bit < 0 ) return -1; // After adjustment, if bit becomes < 0
            if( bit < this.trailingOnesCount ) return bit;

            const last1 = this.last1();
            if( last1 < bit ) bit = last1; // Search from actual last1 if bit is beyond it
            if( last1 < this.trailingOnesCount ) return last1; // last1 is within TOC, bit must be too. This case should be covered by bit < trailingOnesCount

            const bitOffset = bit - this.trailingOnesCount;
            let index = bitOffset >> R.LEN;

            for( let value = this.values[index] & R.mask( ( bitOffset & R.MASK ) + 1 ); ; value = this.values[--index] )
                if( value == 0 ){ if( index == 0 ) return this.trailingOnesCount - 1; }else
                    return this.trailingOnesCount + ( index << R.LEN ) + R.BITS - 1 - AdHoc.numberOfLeadingZeros( value );
        }

        /**
         * Finds the index of the previous '0' bit in this {@link BitList} before the specified bit index.
         * <p>
         * This method searches backward for the first bit set to '0' starting from the position
         * immediately preceding the given {@code bit} index. If no '0' bit is found, or if the input
         * is invalid, it returns -1.
         * </p>
         *
         * @param bit The starting bit index (exclusive) for the backward search. If -1 or greater than or equal to the list size, the search starts from the last index.
         * @return The index of the previous '0' bit, or -1 if no '0' bit is found or if the list is empty or the input is less than -1.
         */
        public prev0( bit: number ): number{
            if( this.size === 0 || bit < -1 ) return -1;

            bit = ( this.size <= bit || bit === -1 ) ?
                  this.size - 1 :
                  bit - 1;

            if( bit < 0 ) return -1;

            if( bit < this.trailingOnesCount ) return -1; // All 1s in this range

            if( this.last1() < bit ) return bit; // Bits after last1 are 0s

            const bitInValues = bit - this.trailingOnesCount;
            let index = bitInValues >> R.LEN; // Index in values array

            for( let value = ~this.values[index] & R.mask( ( bitInValues & R.MASK ) + 1 ); ; value = ~this.values[--index] )
                if( value != 0 )
                    return this.trailingOnesCount + ( index << R.LEN ) + R.BITS - 1 - AdHoc.numberOfLeadingZeros( value );
        }

        /**
         * Returns the index of the highest-numbered ('leftmost' or most significant)
         * bit that is set to '1'.
         *
         * @return The index of the highest set bit, or -1 if the {@code BitList}
         * contains no '1' bits (i.e., it's empty or all zeros).
         */
        public last1(): number{
            return this.used() === 0 ?
                   this.trailingOnesCount - 1 :
                   this.trailingOnesCount + ( ( this._used - 1 ) << R.LEN ) + R.BITS - 1 - Math.clz32( this.values[this._used - 1] );
        }

        /**
         * Checks if this {@code BitList} contains only '0' bits (or is empty).
         *
         * @return {@code true} if the list has size 0, or if {@code trailingOnesCount}
         * is 0 and the {@code _used} (actual used count) is 0;
         * {@code false} otherwise.
         */
        public isAllZeros(): boolean{ return this.trailingOnesCount === 0 && this.used() === 0; }

        /**
         * Calculates the number of '1' bits from index 0 up to and including the
         * specified bit index (also known as rank or population count).
         *
         * @param bit The global bit index (inclusive) up to which to count set bits.
         *            If negative, returns 0. If greater than or equal to {@code _size},
         *            counts up to {@code _size() - 1}.
         * @return The total number of '1' bits in the range [0, bit].
         */
        public rank( bit: number ): number{
            if( bit < 0 || this.size === 0 ) return 0;
            if( this.size <= bit ) bit = this.size - 1;
            if( bit < this.trailingOnesCount ) return bit + 1;
            if( this.used() === 0 ) return this.trailingOnesCount;

            const last1 = this.last1(); // Relies on actualUsed internally
            if( last1 < bit ) bit = last1;

            // Calculate rank for bits beyond trailing ones.
            const index = bit - this.trailingOnesCount >> R.LEN; // Index of the long containing the bit.
            // Count bits in the word up to and including relBit's position within that word
            let sum = this.trailingOnesCount + AdHoc.bitCount( this.values[index] & R.mask( ( bit - this.trailingOnesCount & R.MASK ) + 1 ) );
            // Add '1' counts from all preceding longs in the values array.
            for( let i = 0; i < index; i++ )
                sum += AdHoc.bitCount( this.values[i] );

            return sum; // Total count of '1's up to the specified bit.
        }

        /**
         * Returns the total number of bits set to '1' in this {@code BitList}.
         * This is equivalent to calling {@code rank(_size() - 1)}.
         *
         * @return The total number of '1' bits (cardinality).
         */
        public cardinality(): number{ return this.rank( this.size - 1 ); }

        /**
         * Finds the global bit index of the Nth set bit ('1'). If the Nth '1' exists,
         * {@code rank(result) == cardinality}.
         *
         * @param cardinality The rank (1-based count) of the '1' bit to find. For example,
         *                    {@code cardinality = 1} finds the first '1', {@code cardinality = 2}
         *                    finds the second '1', etc.
         * @return The 0-based global index of the bit with the specified cardinality,
         * or -1 if the cardinality is less than 1 or greater than the total
         * number of '1's in the list ({@link #cardinality()}).
         */
        public bit( cardinality: number ): number{
            // Handle invalid cardinality
            if( cardinality <= 0 ) return -1; // No position has zero or negative '1's
            if( cardinality > this.cardinality() ) return -1; // Exceeds total '1's in list

            // If within trailing ones, return cardinality - 1 (since all are '1's)
            if( cardinality <= this.trailingOnesCount ) return cardinality - 1; // 0-based index of the cardinality-th '1'

            // Adjust cardinality for bits beyond trailing ones
            let remainingCardinality = cardinality - this.trailingOnesCount;
            // totalBits relative to start of values array up to last1
            const totalBits = this.last1() + 1 - this.trailingOnesCount + 1;

            // Scan through values array
            for( let i = 0; i < this.used() && remainingCardinality > 0; i++ ){
                const value = this.values[i];
                const bits = Math.min( R.BITS, totalBits - ( i << R.LEN ) );
                const count = AdHoc.bitCount( value & R.mask( bits ) ); // '1's in this long within the relevant part

                // Find the exact bit in this long
                if( remainingCardinality <= count )
                    for( let j = 0; j < bits; j++ )
                        if( ( value & ( 1 << j ) ) !== 0 )
                            if( --remainingCardinality === 0 )
                                return this.trailingOnesCount + ( i << R.LEN ) + j;


                remainingCardinality -= count;
            }

            // Should not reach here if cardinality is valid, but return -1 for safety
            return -1;
        }


        /**
         * @static
         * @method hash
         * Generates a hash code for a BitList instance.
         * @param {number} hash - The initial hash value to mix with.
         * @param {R | undefined} src - The BitList instance to generate a hash for.
         * @returns {number} The combined hash value.
         */
        static hash( hash: number, src: R | undefined ): number{
            return src ? // If src is not undefined or undefined
                   AdHoc.hash_array( hash, src.values, AdHoc.hash_number, src.used() ) ^ src.trailingOnesCount : // Hash the used part of the values array
                   hash // Return initial hash if src is undefined or undefined
        }

        /**
         * Returns the total potential bit capacity of the underlying storage,
         * considering the current length of the {@code values} array.
         * This is {@code trailingOnesCount + values.length * 32}. It represents the
         * maximum bit index that could theoretically be accessed without needing to
         * reallocate the {@code values} array, not the logical {@link #size}.
         *
         * @return The current storage capacity in bits.
         */
        get length(): number{
            return this.trailingOnesCount + ( this.values.length << R.LEN );
        }


        /**
         * Creates and returns a deep copy of this {@code R} instance.
         * The clone will have the same {@code _size}, {@code trailingOnesCount},
         * and a separate copy of the {@code values} array with the same bit content.
         * The {@code _used} count is also copied.
         *
         * @return A new {@code R} instance identical to this one.
         */
        public clone(): R{
            // The 'as any' and 'as R' are for satisfying TypeScript's abstract class instantiation rules.
            // A derived class would typically call super() and then copy.
            // For an abstract class, this is more of a template for derived classes.
            const dst = new ( this.constructor as any )() as R;
            dst._size = this._size;
            dst.trailingOnesCount = this.trailingOnesCount;
            dst.values = this.values.length === 0 ?
                         new Uint32Array( 0 ) :
                         new Uint32Array( this.values );
            dst._used = this._used; // Copy potentially stale state too
            return dst;
        }


        /**
         * @static
         * @method equals
         * Checks if two BitList instances are equal.
         * Two BitLists are considered equal if they have the same size and the same bit values.
         * @param {R | undefined} one - The first BitList instance to compare.
         * @param {R | undefined} two - The second BitList instance to compare.
         * @returns {boolean} True if the BitLists are equal, false otherwise.
         */
        static equals( one: R | undefined, two: R | undefined ): boolean{
            if( two === one ) return true;
            if( !one || !two || one.size !== two.size || one.trailingOnesCount !== two.trailingOnesCount ) return false;

            // Compare up to the actual used length of the shorter of the two (if used counts differ)
            // or up to their common used length.
            // For a strict equality, both _used counts (after calculation) should be the same.
            if( one.used() !== two.used() ) return false;

            for( let i = one.used(); --i >= 0; ) // Corrected loop condition
                if( one.values[i] !== two.values[i] )
                    return false;

            return true;
        }


        /**
         * @readonly
         * @property {string} [Symbol.toStringTag] - Custom string tag for instances of this class.
         * Used for `Object.prototype.toString.call()` to identify the class type.
         */
        get [Symbol.toStringTag](){ return "BitList.R" }

        /**
         * @method toString
         * Returns a string representation of the BitList, including length and JSON format.
         * @returns {string} A string describing the BitList.
         */
        toString(){ return `length = ${ this.size }\n \n${ this.toJSON() }` }

        /**
         * @method toJSON
         * Converts the BitList to a JSON string representation as an array of bits (0 and 1).
         * @returns {string} A JSON string representing the BitList.
         */
        toJSON(){

            let size = this.size; // Get logical size for JSON output
            if( !size ) return '[]' // Return empty JSON array if size is 0
            const max = size >> R.LEN; // Calculate number of full Uint32 chunks

            let ret = ""

            for( let i = 0; i < max; i++ ){ // Iterate through full Uint32 chunks
                const v = this.get32( i * 32 );
                for( let s = 0; s < R.BITS; s++ ){ // Iterate through bits in each chunk
                    ret += ( v & 1 << s ? // Check if bit is set
                             1 : // Append 1 if set
                             0 ) + ","; // Append 0 if unset
                    if( ( s + 1 ) % 8 == 0 ) ret += ' ' // Add space every 8 bits for readability
                }
                ret += '\n' // Newline after each chunk
            }

            if( 0 < ( size &= R.MASK ) ){ // Handle remaining bits in the last chunk (if any)
                const v = this.get32(max * 32);
                for( let s = 0; s < size; s++ ){
                    ret += ( v & 1 << s ? // Check if bit is set
                             1 : // Append 1 if set
                             0 ) + ","; // Append 0 if unset
                    if( ( s + 1 ) % 8 == 0 ) ret += ' ' // Add space every 8 bits for readability
                }
                ret += '\n' // Newline after last partial chunk
            }

            return `[\n${ ret.substring( 0, ret.lastIndexOf( "," ) ) }\n]` // Return JSON array string, removing trailing comma
        }


        /**
         * Counts the number of leading '0' bits (zeros at the most significant end,
         * highest indices) in this {@code BitList}.
         * Equivalent to {@code _size() - 1 - last1()} for non-empty lists.
         *
         * @return The number of leading zero bits. Returns {@code _size()} if the list
         * is all zeros or empty. Returns 0 if the highest bit (at {@code _size()-1})
         * is '1'.
         */
        public get numberOfLeading0(): number{
            return this.size === 0 ?
                   0 :
                   this.size - 1 - this.last1();
        }

        /**
         * Counts the number of trailing '0' bits (zeros at the least significant end,
         * lowest indices) in this {@code BitList}.
         * This is equivalent to the index of the first '1' bit, or {@code _size()} if
         * the list contains only '0's.
         *
         * @return The number of trailing zero bits. Returns {@code _size()} if the list
         * is all zeros or empty. Returns 0 if the first bit (index 0) is '1'.
         */
        public get numberOfTrailing0(): number{
            if( this.size == 0 || 0 < this.trailingOnesCount ) return 0;
            const i = this.next1( -1 );
            return i == -1 ?
                   this.size :
                   i;
        }

        /**
         * Counts the number of trailing '1' bits (ones at the least significant end,
         * lowest indices) in this {@code BitList}.
         * This directly corresponds to the {@code trailingOnesCount} optimization field.
         *
         * @return The number of implicitly stored trailing '1' bits. Returns 0 if the
         * list starts with '0' or is empty.
         */
        public get numberOfTrailing1(): number{ return this.trailingOnesCount; }

        /**
         * Counts the number of leading '1' bits (ones at the most significant end,
         * highest indices) in this {@code BitList}.
         *
         * @return The number of leading '1' bits. Returns 0 if the list ends in '0',
         * is empty, or contains only '0's. Returns {@code _size()} if the list
         * contains only '1's.
         */
        public get numberOfLeading1(): number{
            if( 0 < this.size ){
                const last1 = this.last1();
                return last1 + 1 === this.size ?
                       last1 - this.prev0( last1 ) :
                       0;
            }
            return 0;
        }

        /**
         * Retrieves a 32-bit word from the BitList starting at the given global bit index.
         * This method handles combining bits from trailingOnesCount, the values array,
         * and implicit trailing zeros to construct the 32-bit word.
         *
         * @param bit The global starting bit index from which to fetch the 32-bit word.
         * @return A 32-bit number representing the bits from index `bit` to `bit + 31`.
         */
        public get32( bit: number ): number{
            if( bit + R.BITS <= this.trailingOnesCount ) return -1;
            if( this.last1() < bit ) return 0;

            let ret = 0;
            let bitsFetched: number = 0;

            if( bit < this.trailingOnesCount ){
                bitsFetched = this.trailingOnesCount - bit;
                ret = R.mask( bitsFetched );
                bit += bitsFetched - this.trailingOnesCount;
            }else bit -= this.trailingOnesCount;

            const index: number = bit >> R.LEN;
            if( this.used() <= index ) return ret;

            const pos: number = bit & R.MASK;

            const bitsNeeded: number = R.BITS - bitsFetched;
            let bits = this.values[index] >> pos;

            if( pos !== 0 && index + 1 < this.used() ) bits |= this.values[index + 1] << R.BITS - pos;

            if( bitsNeeded < R.BITS ) bits &= R.mask( bitsNeeded );

            ret |= bits << bitsFetched;

            return ret;
        }

        /**
         * Find the index of the first bit where two BitLists differ
         *
         * @param other First BitList.
         * @return The index of the first differing bit, or min(other.size, r2.size) if
         * they are identical up to the shorter length.
         */
        public findFirstDifference( other: R ): number{
            const checkLimit = Math.min( other.size, this.size );
            const toc1 = other.trailingOnesCount;
            const toc2 = this.trailingOnesCount;
            const commonTOC = Math.min( toc1, toc2 );

            if( toc1 !== toc2 ) return commonTOC;

            let bit = commonTOC;
            while( bit < checkLimit ){
                const word1 = other.get32( bit );
                const word2 = this.get32( bit );
                if( word1 !== word2 ){
                    const diffOffset = AdHoc.numberOfTrailingZeros( word1 ^ word2 );
                    const diffBit = bit + diffOffset;
                    return Math.min( diffBit, checkLimit );
                }
                if( bit > checkLimit - R.BITS ) bit = checkLimit;
                else bit += R.BITS;
            }

            return checkLimit;
        }

    }

    /**
     * A concrete, mutable implementation of {@code BitList} extending the read-only
     * base {@link R}.
     * <p>
     * This class provides methods to set, clear, flip, add, insert, and remove bits,
     * as well as perform bulk operations and manage the list's size and capacity.
     * It inherits the optimized storage mechanism from {@code R} (using
     * {@code trailingOnesCount} and a {@code values} array) and updates this
     * structure efficiently during modifications.
     */
    export class RW extends R{
        /**
         * @readonly
         * @property {string} [Symbol.toStringTag] - Custom string tag for instances of this class.
         * Used for `Object.prototype.toString.call()` to identify the class type.
         */
        get [Symbol.toStringTag](){ return "BitList.RW" }

        /**
         * Constructs an empty {@code RW} BitList with an initial capacity hint.
         * The underlying storage (`values` array) will be allocated to hold at least
         * `bits`, potentially reducing reallocations if the approximate
         * final size is known. The logical size remains 0.
         *
         * @param bits The initial capacity hint in bits. If non-positive,
         *             a default initial capacity might be used or allocation
         *             deferred.
         */
        public constructor( bits: number );
        /**
         * Constructs a new {@code RW} BitList of a specified initial size, with all
         * bits initialized to a specified default value.
         *
         * @param default_value The boolean value to initialize all bits to
         *                      ({@code true} for '1', {@code false} for '0').
         * @param size          The initial number of bits in the list.
         *                      If negative, the list is filled with `false` values to the absolute value of `size`.
         */
        public constructor( default_value: boolean | number, size: number );
        public constructor( arg1: number | boolean, arg2?: number ){
            super();
            if( typeof arg1 === 'number' && arg2 === undefined ){
                const bits = arg1;
                if( bits < 0 ) throw new Error( "bits cannot be negative" );
                if( 0 < bits ) this.values = new Uint32Array( R.len4bits( bits ) );
            }else{
                const default_value = arg1;
                const size = arg2!;
                if( size < 0 ) this._size = -size;
                if( 0 < size )
                    if( default_value ) this.trailingOnesCount = this._size = size;
                    else this._size = size;
            }
        }


        /**
         * Performs a bitwise AND operation between this {@code BitList} and another
         * read-only {@code BitList}.
         * The result is stored in this {@code BitList}, modifying it in place.
         *
         * @param and The other {@code BitList} to perform AND with.
         * @return This {@code RW} instance after the AND operation.
         */
        and( and: R ): this{
            // --- 1. Handle Trivial Cases ---
            // If either BitList is null or effectively empty (size 0), the result of the
            // AND is empty.
            // Clear this BitList and return.
            if( and == null || and.size === 0 ){
                const s = this.size
                this.clear() // Result of AND with empty set is empty set.
                this.size = s
                return this
            }
            // Optimization: If 'this' BitList is entirely contained within the trailing
            // ones region of 'and',
            // then 'this AND and' is simply 'this'. No modification is needed.
            // Example: this = [1,1], and = [1,1,1,0]. this.size (2) <= and.toc (3). Result
            // is [1,1].
            if( this.size <= ( <RW> and ).trailingOnesCount )
                return this

            // Optimization: If the 'and' BitList has no explicitly stored bits (`and.used()
            // == 0`),
            // it means 'and' consists solely of implicit trailing ones up to
            // `and.trailingOnesCount`,
            // followed by implicit zeros up to `and.size()`.
            // In this case, for the AND operation:
            // - Bits in `this` from index 0 up to `and.trailingOnesCount - 1` are ANDed
            // with '1's, so they remain unchanged.
            // - Bits in `this` from index `and.trailingOnesCount` onwards are ANDed with
            // '0's (implicit zeros of 'and'), so they must become '0'.
            // The `set0(from, to)` method clears bits in the specified range.
            if( ( <RW> and ).used() === 0 ){
                this.set0( ( <RW> and ).trailingOnesCount, this.size ) // Truncate 'this' to the resulting minimum size.
                return this
            }

            // --- 2. Calculate Result Dimensions ---
            // The result's trailing ones can only exist where *both* operands had trailing
            // ones.
            const min_toc = Math.min( this.trailingOnesCount, ( <RW> and ).trailingOnesCount )
            // The result's size is limited by the shorter of the two operands.
            const min_size = Math.min( this.size, and.size )

            // --- 3. Optimization: Result is entirely trailing ones ---
            // If the effective size of the result is completely covered by the new trailing
            // ones count,
            // then no explicit bits need to be stored in the 'values' array.
            if( min_size <= min_toc ){
                // Clear any existing data in the values array.
                if( 0 < this.used() )
                    this.values.fill( 0, 0, this.used() ) // Use used() for safety
                // Update the state of 'this' to reflect the result.
                this.trailingOnesCount = min_size // TOC is the full size
                this.size = min_size
                this._used = 0 // No explicit bits are used.
                return this
            }
            // --- 4. Adjust Size and Prepare for Main Logic ---
            // If the final size (min_size) is smaller than the current size of 'this',
            // truncate 'this' to min_size. This effectively sets bits beyond min_size to 0.
            if( min_size < this.size )
                this.size = min_size

            // --- 5. Handle Discrepancies in TrailingOnesCount ---
            // This section attempts to align the 'values' array of 'this' conceptually
            // to start right after the final min_toc, before performing the word-wise AND.

            let bit = min_toc // 'bit' tracks the absolute bit index being processed, starts after common TOC.
            let i = 0 // 'i' tracks the index within the 'this.values' array (destination).

            // Case 5a: 'this' originally had more trailing ones than the final 'min_toc'.
            // The bits in 'this' between `and.trailingOnesCount` (which equals `min_toc`
            // here)
            // and the original `this.trailingOnesCount` were '1's.
            // In the 'and' list, bits in this range are effectively '0' (either explicitly
            // or implicitly).
            // So, `1 AND 0` results in '0'. These bits in 'this' must become '0'.
            if( ( <RW> and ).trailingOnesCount < this.trailingOnesCount ) // Equivalent to: min_toc < this.trailingOnesCount
                // This sets the bit at 'and.trailingOnesCount' (which is the first bit *after*
                // min_toc) to '0'.
                // Crucially, the set0(bit) method, when called with a bit less than the current
                // trailingOnesCount, restructures the BitList. It reduces
                // `this.trailingOnesCount`
                // to `and.trailingOnesCount` and shifts the content of the `values` array,
                // potentially allocating a new array.
                // This is a potentially very expensive operation involving array
                // copying/shifting.
                this.set0( ( <RW> and ).trailingOnesCount ) // This modifies this.trailingOnesCount, this.values, this.used.
                // After this call, this.trailingOnesCount should now equal min_toc.
                // The loop variables 'i' and 'bit' remain 0 and min_toc, respectively, which is
                // correct
                // for starting the subsequent loop right after the new (reduced) TOC.
                // Case 5b: if 'and' had more trailing ones than 'this' (i.e., min_toc <
                // and.trailingOnesCount).
                // The bits at start of 'this.values' on length `and.trailingOnesCount` -
            // `this.trailingOnesCount` are not changed.
            else if( this.trailingOnesCount < ( <RW> and ).trailingOnesCount && ( this.trailingOnesCount & R.MASK ) !== 0 ){ // Alignment needed
                // if 'this'
                // starts
                // mid-word and
                // 'and' has
                // more TOC.
                if( this.used() === 0 )
                    // If no explicit bits in 'this', and 'this' ends before 'and's TOC, the AND
                    // operation keeps 'this' as is up to its size. Size already adjusted.
                    return this

                // Calculate the difference in trailing ones counts. This is the number of bits
                // at the beginning of `this.values` that correspond to implicit '1's in `and`.
                const dif = ( <RW> and ).trailingOnesCount - this.trailingOnesCount // Number of bits where 'this' is 0 and 'and' is 1.

                // Calculate the index and position within this.values corresponding to the end
                // of this range.
                const index = dif >> R.LEN // Word index in this.values
                const pos = dif & R.MASK // Bit position within that word

                // <111111--- and.trailingOnesCount ----111><and.values[0]>< and.values[1]>...
                // | ^ |
                // pos & |
                // | v |
                // dif | |
                // <- trailingOnesCount -><values[0]>....<values[index]>...>
                // not changed part | | |
                // align till here | end of values[index]

                // Mask for lower bits up to 'pos' (exclusive of pos, i.e., bits 0 to pos-1).
                const mask = R.mask( pos ) // Mask to keep bits that are ANDed with implicit 1s.
                const v = this.values[index] // Get the value from 'this.values' at the boundary index.

                // Perform the partial AND operation on this boundary word `values[index]`.
                // `v & mask`: Preserves the lower `pos` bits of `v`. These bits are ANDed with
                // '1's from `and`, so they remain unchanged.
                // `v & (and.values[0] << pos)`: Handles the upper `64-pos` bits of `v`.
                // - `and.values[0] << pos`: Takes the first word of `and`'s explicit bits and
                // shifts it left by `pos`.
                // This aligns the beginning of `and.values[0]` with the `pos`-th bit of `v`.
                // - `v & (...)`: Performs the AND operation between the original upper bits of
                // `v` and the aligned lower bits of `and.values[0]`.
                // The result combines the preserved lower bits and the ANDed upper bits.
                this.values[index] = v & mask | v & ( <RW> and ).values[0] << pos

                // Update the loop counters to start the main word-wise loop from the *next*
                // word.
                i = index + 1 // Start `this.values` index from the next word.
                // Recalculate the absolute starting bit for the next iteration. It corresponds
                // to the start of `this.values[i]`.
                // The absolute position is the end of the common TOC (`trailingOnesCount` =
                // `min_toc`) plus the offset based on the word index `i`.
                bit = this.trailingOnesCount + ( i << R.LEN ) // `trailingOnesCount` here is `min_toc`.
            }

            // --- 6. Perform Word-Level AND for Remaining Bits ---
            for( ; bit < min_size && i < this.used(); i++, bit += R.BITS ) // Loop until the absolute bit index reaches the
                // final size.
                // Perform the AND operation for the current 64-bit chunk.
                // `and.get_(bit)`: Fetches 64 bits from the `and` list starting at absolute
                // index `bit`.
                // This correctly handles `and`'s internal structure (TOC + values + implicit
                // zeros).
                // `values[i] &= ...`: ANDs the fetched chunk from `and` with the corresponding
                // word in `this.values`
                // and stores the result back into `this.values[i]`.
                this.values[i] &= and.get32( bit )

            // --- 7. Final State Update ---
            // After the loop, `this.values` holds the result of the AND operation for the
            // explicit bits.
            // The `trailingOnesCount` and `size` fields were already set correctly earlier.
            // The `used` count might now be inaccurate if the AND operation zeroed out
            // higher-order words
            // that were previously in use. Mark `used` as dirty to force recalculation on
            // the next `used()` call.
            this._used |= R.IO // Mark used count as potentially invalid (needs recalculation).

            return this // Return this instance for method chaining.
        }

        or( or: R ): this{
            // --- 1. Handle Trivial Cases ---
            if( or == null || or.size === 0 || or.isAllZeros() )
                return this

            if( this.isAllZeros() ){
                // copy 'or' state
                this.size = or.size
                this.trailingOnesCount = ( <RW> or ).trailingOnesCount
                if( 0 < ( <RW> or ).used() )
                    if( this.values == null || this.values.length < ( <RW> or ).used() )
                        this.values = ( <RW> or ).values.slice() // Clone array
                    else
                        this.values.set( ( <RW> or ).values.subarray( 0, ( <RW> or ).used() ) ) // Copy array

                this._used = ( <RW> or ).used()
                return this
            }

            // The size of the result is the maximum of the sizes of the two operands.
            const max_size = Math.max( this.size, or.size )
            // Calculate a *candidate* for the resulting trailingOnesCount (TOC).
            // The result MUST have at least as many trailing ones as the maximum of the
            // input TOCs.
            // This is because if either operand has a '1' at a position < max(toc1, toc2),
            // the result will have a '1'.
            let max_toc = Math.max( this.trailingOnesCount, ( <RW> or ).trailingOnesCount )

            // If neither list uses its 'values' array (i.e., they consist entirely of
            // implicit ones),
            // the OR result is also entirely implicit ones, up to the maximum TOC.
            if( this.used() === 0 && ( <RW> or ).used() === 0 ){
                this.trailingOnesCount = max_toc // The resulting TOC is simply the larger of the two original TOCs.
                this.size = max_size // The resulting size is the larger of the two original sizes.
                return this
            }

            const last1 = this.last1()
            a:
                for( let i = this.next0( max_toc - 1 ), ii = or.next0( max_toc - 1 ); ; ){
                    while( i < ii ){
                        if( i === -1 ){
                            max_toc = last1 + 1
                            break a
                        }
                        i = this.next0( i )
                    }
                    while( ii < i ){
                        if( ii === -1 ){
                            max_toc = or.last1() + 1
                            break a
                        }
                        ii = or.next0( ii )
                    }
                    if( i === ii ){
                        max_toc = i === -1 ?
                                  Math.max( last1, or.last1() ) + 1 :
                                  i
                        break
                    }
                }

            // --- 3. Handle All-Ones Case ---
            // If the first common zero is at or after the result size, the result is all
            // ones.
            if( max_size <= max_toc ){
                if( 0 < this.used() ) this.values.fill( 0, 0, this.used() )
                this.trailingOnesCount = max_size // All ones up to size
                this.size = max_size
                this._used = 0
                return this
            }

            let bit = this.trailingOnesCount // tracks the absolute bit index corresponding to the start of the current word
            // in `this.values`. Initialize with original TOC.

            if( this.trailingOnesCount < max_toc ){
                // If the true `max_toc` is greater than the original `trailingOnesCount` of
                // `this`,
                // it means the result has more leading implicit '1's than 'this' originally
                // did.
                // The existing explicit bits in `this.values` must be shifted right
                // conceptually
                // to make space for these newly gained implicit '1's.
                const max = this.last1() + 1 - this.trailingOnesCount
                RW.shiftRight( this.values, this.values, 0, max, max_toc - this.trailingOnesCount, true )
                bit = this.trailingOnesCount = max_toc
                this._used |= R.IO
            }

            for( let i = 0; bit < max_size && i < this.used(); i++, bit += R.BITS )
                this.values[i] |= or.get32( bit )

            this.size = max_size

            return this
        }

        /**
         * Performs a bitwise XOR operation between this {@code BitList} and another
         * read-only {@code BitList} (`xor`).
         * The result is stored in this {@code BitList}, modifying it in place.
         * The size of the resulting BitList will be the maximum of the sizes of the two
         * operands.
         * The trailing ones count and the explicit bit values are updated based on the
         * XOR operation.
         * <p>
         * Formula: this = this XOR xor
         * <p>
         * Truth Table for XOR:
         * A | B | A XOR B
         * --|---|--------
         * 0 | 0 | 0
         * 0 | 1 | 1
         * 1 | 0 | 1
         * 1 | 1 | 0
         *
         * @param xor The other {@code R} (read-only) BitList to perform the XOR
         *            operation with.
         * @return This {@code RW} (read-write) instance after the XOR operation,
         * allowing for method chaining.
         */
        xor( xor: R ): this{
            // --- 1. Handle Trivial Cases ---
            // Case 1.1: XOR with null or empty BitList.
            // XORing with nothing or an empty set results in no change to 'this',
            // except potentially needing to match the size if 'xor' was non-null but size 0.
            // However, the size adjustment happens later. If xor is null or size 0, just return.
            if( xor == null || xor.size === 0 )
                return this

            if( this.isAllZeros() ){
                // Case 1.2: 'this' BitList is currently all zeros.
                // The result of `0 XOR xor` is simply `xor`.
                // Therefore, copy the state (size, trailingOnesCount, values, used) from `xor` into `this`.
                this.size = xor.size
                this.trailingOnesCount = ( <RW> xor ).trailingOnesCount
                // Deep copy needed as 'values' might be shared or modified later in 'xor'.
                if( 0 < ( <RW> xor ).used() )
                    if( this.values.length < ( <RW> xor ).used() )
                        this.values = ( <RW> xor ).values.slice() // Clone array
                    else
                        this.values.set( ( <RW> xor ).values.subarray( 0, ( <RW> xor ).used() ) ) // Copy array
                this._used = ( <RW> xor ).used() // Use used() to get potentially recalculated value
                return this
            }

            // Case 1.3: The 'xor' BitList is all zeros.
            // The result of `this XOR 0` is `this`.
            // No change to bits is needed. Only the size might need adjustment if `xor.size` was larger.
            if( xor.isAllZeros() ){
                if( this.size < xor.size )
                    this.size = xor.size
                return this
            }

            // --- 2. Calculate Result Dimensions & Check for All-Zeros Result ---
            // The final size of the BitList after XOR is the maximum of the two operand sizes.
            const max_size = Math.max( this.size, xor.size )

            // find first 1 in result
            const first_1 = this.findFirstDifference( xor )

            // If the first difference occurs at or after the maximum size required for the result,
            // it means 'this' and 'xor' are identical up to `max_size`.
            // Since `A XOR A = 0`, the result of the XOR operation up to `max_size` is all zeros.
            if( max_size <= first_1 ){
                this.clear() // Reset 'this' to an empty state (size=0, toc=0, used=0, values=O).
                // Set the size of the all-zero result correctly.
                this.size = max_size
                return this // Result is all zeros.
            }

            // --- Calculate the new TrailingOnesCount (new_toc) for the result ---
            let new_toc = 0

            if( first_1 === 0 )
                for( let x = -1; x === -1; ){
                    x = xor.get32( new_toc ) ^ this.get32( new_toc )
                    if( x === -1 ) new_toc += 32
                    else
                        new_toc += Math.clz32( ~x & 0xffffffff ) // Use 32-bit trailing zeros count
                    if( max_size <= new_toc ){
                        this.trailingOnesCount = new_toc
                        this._used = 0
                        this.size = max_size
                        return this
                    }
                }

            const last1 = this.last1()

            // Edge case: If all original '1's fall within the new TOC, the explicit part is empty.
            if( last1 < new_toc ){
                if( 0 < this.used() )
                    this.values.fill( 0, 0, this.used() ) // Clear the values array as it should contain only zeros.
                this.trailingOnesCount = new_toc
                this.size = max_size
                this._used = 0
                return this
            }

            // Highest '1' in either operand.
            const max_last1 = Math.max( last1, ( <RW> xor ).last1() )

            // Calculate the number of longs needed for the result's explicit bits (`values` array).
            // The explicit bits start conceptually *after* `new_toc`.
            // The highest bit index relative to the start of `values` would be `max_last1 - new_toc`.
            // We need `len4bits` based on the *count* of bits, which is `(max_last1 - new_toc) + 1`.
            // Handle the case where `new_toc` might be greater than `max_last1`.
            const new_values_len = R.len4bits( new_toc <= max_last1 ?
                                               max_last1 - new_toc + 1 :
                                               0 )

            // Initialize loop variables for iterating through words.
            let i = 0 // Start writing to index 0 of the result's `values` array.

            // --- Handle structural changes due to TOC differences ---
            // Case 4.1: The new TOC (`new_toc`) is shorter than `this`'s original TOC.
            // This implies that bits in `this` from `new_toc` up to `this.trailingOnesCount - 1` were originally '1'.
            // For the result's TOC to end at `new_toc`, the `xor` operand must *also* have had '1's in this same range.
            // Therefore, in this range, the operation is `1 XOR 1 = 0`.
            // Additionally, the explicit bits originally stored in `this.values` need to be conceptually shifted left
            // relative to the new, shorter TOC.
            if( new_toc < this.trailingOnesCount ){
                // Implication: Result has fewer initial implicit '1's than 'this' had.
                // Bits in 'this' from `new_toc` to `original_this_toc - 1` were originally '1'.
                // For the result's TOC to stop at `new_toc`, `xor` must also have had '1's in this range (1 XOR 1 = 0).
                // Action:
                // 1. Shift the explicit bits originally in `this.values` conceptually *left* relative to the new, shorter TOC.
                // 2. Fill the vacated space (corresponding to `new_toc` to `original_this_toc - 1`) with the XOR result (which is `1 XOR xor = ~xor`).
                // Calculate the shift_bits distance required for the existing `values` data.
                const shift_bits = this.trailingOnesCount - new_toc // Calculate the amount by which `this.values` needs to be shifted left.

                // Call shiftLeft helper. Source is `this.values`, destination `dst` is either `this.values` (if resized) or a new array.
                // The range `from_bit` to `to_bit` covers the original explicit bits (`0` to `original_this_last1 - original_this_toc + 1`).
                // The `shift_bits` parameter moves these bits left relative to the start of the array.
                // `clear=false`: The vacated bits on the right (low indices) are *not* cleared by `shiftLeft` itself,
                // because they will be explicitly filled by the subsequent loop using `~xor.get_()`.
                const sb = R.len4bits( shift_bits )
                this.values = 0 < this.used() ?
                              RW.shiftLeft( this.values, 0, this.last1() - this.trailingOnesCount + 1, shift_bits, false ) :
                              this.values.length < sb ?
                              new Uint32Array( sb ) :
                              this.values

                const index = shift_bits >>> R.LEN

                // Fill the space created by the shift_bits (from relative index 0 up to `shift_bits`)
                // with the XOR result for the absolute range `new_toc` to `original_this_toc - 1`.
                // In this range, `this` was '1' and `xor` was also '1', so `this XOR xor` is `0`.
                // The loop iterates using `i` over the destination `values` indices (0 to shift_bits/64)
                // and `bit` over absolute bit indices (`new_toc` to `original_toc - 1`).
                for( let bit = new_toc; i < index; i++, bit += R.BITS )
                    // Fetch 32 bits from `xor` starting at `bit`. We expect these to be all '1's.
                    // Invert them (`~`) to get all '0's. Store these '0's in `values[i]`.
                    // This correctly sets the result bits in this segment to 0.
                    // Note: If xor.get_() wasn't all 1s, new_toc would have been different.
                    this.values[i] = ~xor.get32( bit )

                // Handle the boundary word at `index` (if `shift_bits` wasn't a multiple of 32).
                const pos = shift_bits & R.MASK
                if( pos !== 0 ){
                    // process on edge bits
                    const mask_lower = R.mask( pos ) // Mask for lower `pos` bits (range [new_toc, original_toc)).
                    const val = this.values[i] // Value already shifted into upper bits of index i.
                    const xor_val = xor.get32( new_toc + ( i << R.LEN ) ) // Corresponding word from xor.

                    // Calculate result for the boundary word:
                    // Lower `pos` bits: Calculate `1 XOR xor_val` which equals `NOT xor_val`.
                    // Upper `32-pos` bits: XOR the shifted original bits with corresponding xor bits.
                    this.values[i] =
                        ( val ^ xor_val ) & ~mask_lower | // preserve Upper bits
                        ~xor_val & mask_lower // Lower bits result = NOT xor_val (since original this was 1)
                }
                this.trailingOnesCount = new_toc
                this.size = max_size // Set final size

                this._used += sb
                this._used |= R.IO // need totally recount

                return this
            }

            // Case 4.2: The new TOC (`new_toc`) is longer than `this`'s
            if( this.trailingOnesCount < new_toc ){
                // Calculate the shift_bits distance (number of bits to shift_bits right conceptually).
                const shift_bits = new_toc - this.trailingOnesCount
                // Shift original explicit bits right by shift_dist.
                // The source range covers the original explicit bits.
                // Destination starts at relative index 0.
                // `clear=true` ensures vacated higher-index bits (left side) are zeroed.
                RW.shiftRight( this.values, this.values, 0, this.last1() - this.trailingOnesCount + 1, shift_bits, true )
            }
            // Case 4.3: `trailingOnesCount == new_toc`. No structural shift needed.
            else if( this.values.length < new_values_len )
                this.values = copyOf( this.values, new_values_len )

            let bit = new_toc // Start processing from the absolute bit index where the new_toc ends.

            this.trailingOnesCount = new_toc // Update the trailingOnesCount of 'this'.

            // --- 5. Perform Word-Level XOR for Remaining Bits ---
            // Iterate through the longs required for the result's explicit part (`new_values_len`).
            // `i` tracks the index in `this.values` (starting potentially non-zero if Case 4.1 occurred).
            // `bit` tracks the corresponding absolute bit index.
            for( let max = R.len4bits( max_size ); i < max; i++, bit += R.BITS )
                this.values[i] ^= xor.get32( bit )

            this.size = max_size // Set final size
            this._used |= R.IO // need totally recount

            return this
        }

        /**
         * Performs a bitwise AND NOT operation:
         * {@code thisBitList AND NOT otherBitList}.
         * Clears bits in this {@code BitList} where the corresponding bit in the
         * {@code not} {@code BitList} is set.
         *
         * @param not The {@code BitList} to perform NOT and AND with.
         * @return This {@code RW} instance after the AND NOT operation.
         */
        andNot( not: R ): this{
            // --- 1. Handle Trivial Cases ---
            if( not == null || not.isAllZeros() || this.size === 0 )
                return this // ANDNOT with empty/all-zero set changes nothing in 'this'.
            // If 'this' is empty, result is empty.
            if( this.isAllZeros() )
                return this

            // --- 2. Calculate Result Dimensions ---
            // Resulting trailing ones exist where 'this' has '1' and 'not' has '0'.
            // This means they survive up to the point where 'not' has its first '1'.
            let first_1_in_not = not.next1( -1 )
            if( first_1_in_not === -1 )
                first_1_in_not = not.size // Treat all-zeros 'not' as having '1' beyond its size
            const res_toc = Math.min( this.trailingOnesCount, first_1_in_not )
            // The logical size is determined by 'this'. Bits in 'this' beyond 'not.size()'
            // are ANDed with ~0 (i.e., 1), so they survive.
            const res_size = this.size // Keep original size

            // --- 3. Optimization: Result is entirely trailing ones ---
            // This happens if res_toc covers the whole res_size.
            if( res_size <= res_toc ){
                if( this.used() > 0 )
                    this.values.fill( 0, 0, this.used() )
                this.trailingOnesCount = res_size
                this.size = res_size
                this._used = 0
                return this
            }

            // --- 4. Calculate Dimensions for the Result's 'values' Part ---
            const bits_in_result_values = res_size - res_toc
            if( bits_in_result_values <= 0 ){
                // Safety check
                if( this.used() > 0 )
                    this.values.fill( 0, 0, this.used() )
                this.trailingOnesCount = res_toc // Use res_toc, not res_size here
                this.size = res_size
                this._used = 0
                return this
            }
            const result_values_len = R.len4bits( bits_in_result_values )

            // --- 5. Determine Destination Array: Reuse 'this.values' or Allocate New ---
            let result_values: Uint32Array
            let in_place: boolean
            let original_used_cached = -1 // Cache original used count if in_place

            // In-place is possible if res_toc matches this.toc AND capacity is sufficient.
            if( this.trailingOnesCount === res_toc && this.values.length >= result_values_len ){
                original_used_cached = this.used() // Cache before potential modification
                result_values = this.values
                in_place = true
            }else{
                result_values = new Uint32Array( result_values_len )
                in_place = false
            }

            // --- 6. Perform Word-Level AND NOT Operation using get_() ---
            for( let i = 0; i < result_values_len; i++ ){
                const current_abs_bit_start = res_toc + ( i << R.LEN )
                const this_word = this.get32( current_abs_bit_start )
                // Optimization: if this_word is 0, the result is 0, skip fetching not_word
                if( this_word === 0 ){
                    result_values[i] = 0
                    continue
                }
                const not_word = not.get32( current_abs_bit_start )
                result_values[i] = this_word & ~not_word
            }

            // --- 7. Clean Up If Modified In-Place ---
            // If the result uses fewer longs than originally, clear the trailing ones.
            if( in_place )
                if( result_values_len < original_used_cached )
                    this.values.fill( 0, result_values_len, original_used_cached )

            // --- 8. Update the State of 'this' BitList ---
            this.trailingOnesCount = res_toc
            this.size = res_size
            this.values = result_values
            this._used = result_values_len | R.IO // Mark used dirty

            return this
        }

        /**
         * Checks if this {@code BitList} intersects with another {@code BitList} (i.e.,
         * if there is at least one bit position where both are '1').
         *
         * @param other The other {@code BitList} to check for intersection.
         * @return {@code true} if there is an intersection, {@code false} otherwise.
         */
        intersects( other: R ): boolean{
            // Trivial cases: cannot intersect with null or if either list is empty
            if( other == null || this.size === 0 || other.size === 0 )
                return false

            // Determine the maximum bit index to check (up to the end of the shorter list)
            const checkLimit = Math.min( this.size, other.size )

            // --- Fast structural checks first ---
            // 1. Check overlap in the shared trailing ones region: [0, min(this.toc, other.toc))
            // If both lists have trailing ones, they intersect immediately in this common range.
            const commonTOC = Math.min( this.trailingOnesCount, ( <RW> other ).trailingOnesCount )
            if( commonTOC > 0 )
                return true // Intersection guaranteed in the range [0, commonTOC)
            // At this point, we know that at least one of the lists has trailingOnesCount = 0,
            // otherwise, commonTOC would be > 0 and we would have returned true.

            // 2. Check overlap between this.trailingOnes and other.values
            // This checks the absolute bit range [commonTOC, min(checkLimit, this.toc))
            // If this list has trailing ones extending beyond the common range...
            // Start checking from end of common TOC (or 0 if none)
            const range1End = Math.min( checkLimit, this.trailingOnesCount ) // End at limit or end of this's TOC
            if( commonTOC < range1End ){
                // ...we need to see if 'other' has any '1's stored in its 'values' array within this absolute bit range.
                // We can efficiently check this by finding the next '1' in 'other' starting from range1Start.
                const next1InOther = other.next1( commonTOC - 1 )
                // If a '1' exists in 'other' within this range where 'this' has implicit '1's...
                if( next1InOther !== -1 && next1InOther < range1End )
                    return true // ...then they intersect.
            }

            // 3. Check overlap between other.trailingOnes and this.values (Symmetric to check 2)
            // This checks the absolute bit range [commonTOC, min(checkLimit, other.toc))
            // If the other list has trailing ones extending beyond the common range...
            const range2End = Math.min( checkLimit, ( <RW> other ).trailingOnesCount )
            if( commonTOC < range2End ){
                // ...we need to see if 'this' has any '1's stored in its 'values' array within this absolute bit range.
                const next1InThis = this.next1( commonTOC - 1 )
                // If a '1' exists in 'this' within this range where 'other' has implicit '1's...
                if( next1InThis !== -1 && next1InThis < range2End )
                    return true // ...then they intersect.
            }

            // --- Check the region where both *might* have explicit bits in 'values' ---
            // This region starts where the *longer* trailingOnesCount ends (or from bit 0 if both TOC=0).
            const valuesCheckStart = Math.max( this.trailingOnesCount, ( <RW> other ).trailingOnesCount )

            // We only need to check from valuesCheckStart up to checkLimit.
            // Use word-level checks for efficiency.
            // Calculate the starting bit offset relative to the beginning of each 'values' array.
            // Ensure the offset is non-negative.
            const thisRelBitStart = Math.max( 0, valuesCheckStart - this.trailingOnesCount )
            const otherRelBitStart = Math.max( 0, valuesCheckStart - ( <RW> other ).trailingOnesCount )

            // Calculate the starting word index for each 'values' array.
            const thisWordStartIndex = thisRelBitStart >> R.LEN
            const otherWordStartIndex = otherRelBitStart >> R.LEN

            // Calculate the ending bit index (inclusive) to check relative to each 'values' array start.
            const endBitInclusive = checkLimit - 1
            const thisRelBitEnd = endBitInclusive - this.trailingOnesCount
            const otherRelBitEnd = endBitInclusive - ( <RW> other ).trailingOnesCount

            // Determine the highest word index we need to potentially check in each 'values' array.
            // This depends on the relative end bit and the actual used words.
            const thisUsed = this.used() // Cache used() result
            const otherUsed = ( <RW> other ).used()
            const thisWordEndIndex = thisRelBitEnd < 0 ?
                                     -1 :
                                     Math.min( thisUsed - 1, thisRelBitEnd >> R.LEN )
            const otherWordEndIndex = otherRelBitEnd < 0 ?
                                      -1 :
                                      Math.min( otherUsed - 1, otherRelBitEnd >> R.LEN )

            // The loop needs to cover all word indices relevant to *both* lists within the check range.
            const loopStartIndex = Math.max( thisWordStartIndex, otherWordStartIndex )
            const loopEndIndex = Math.max( thisWordEndIndex, otherWordEndIndex ) // Iterate up to the highest relevant index

            // Iterate through the relevant words where both lists might have explicit bits.
            for( let wordIndex = loopStartIndex; wordIndex <= loopEndIndex; wordIndex++ ){
                // Get the word value from 'this', default to 0 if outside its relevant range or used words.
                const thisWord = wordIndex >= thisWordStartIndex && wordIndex <= thisWordEndIndex ?
                                 this.values[wordIndex] :
                                 0

                // Get the word value from 'other', default to 0 if outside its relevant range or used words.
                const otherWord = wordIndex >= otherWordStartIndex && wordIndex <= otherWordEndIndex ?
                                  ( <RW> other ).values[wordIndex] :
                                  0

                // If both words are 0, they can't intersect in this word.
                if( thisWord === 0 && otherWord === 0 )
                    continue

                // Create masks to isolate the bits *within this word* that fall into the absolute check range [valuesCheckStart, checkLimit).
                let commonMask = -1 // Start with all bits relevant

                // Mask off bits *below* valuesCheckStart if this word overlaps the start boundary.
                const wordAbsStartBit = this.trailingOnesCount + ( wordIndex << R.LEN ) // Approx absolute start
                // Determine which word starts first (relative to absolute bits)
                // other.values starts earlier
                if( wordAbsStartBit < valuesCheckStart )
                    if( this.trailingOnesCount <= ( <RW> other ).trailingOnesCount ){ // this.values starts earlier or same
                        if( wordIndex === thisWordStartIndex )
                            commonMask &= -1 << ( thisRelBitStart & R.MASK )
                    }else if( wordIndex === otherWordStartIndex )
                        commonMask &= -1 << ( otherRelBitStart & R.MASK )

                // Mask off bits *at or above* checkLimit if this word overlaps the end boundary.
                const wordAbsEndBit = wordAbsStartBit + R.BITS // Approx absolute end (exclusive)
                // Determine which word ends later (relative to absolute bits)
                // other.values ends later
                if( wordAbsEndBit > checkLimit )
                    if( this.trailingOnesCount >= ( <RW> other ).trailingOnesCount ){ // this.values ends later or same
                        if( wordIndex === thisWordEndIndex )
                            commonMask &= R.mask( ( thisRelBitEnd & R.MASK ) + 1 )
                    }else if( wordIndex === otherWordEndIndex )
                        commonMask &= R.mask( ( otherRelBitEnd & R.MASK ) + 1 )

                // Check for intersection within the masked portion of the words.
                if( ( thisWord & otherWord & commonMask ) !== 0 )
                    return true // Intersection found in the 'values' arrays.
            }

            // No intersection found after all checks
            return false
        }

        /**
         * Flips the bit at the specified position. If the bit is '0', it becomes '1',
         * and vice versa.
         *
         * @param bit The bit position to flip (0-indexed).
         * @return This {@code RW} instance after flipping the bit.
         */
        public flip( bit: number ): RW;
        /**
         * Flips a range of bits from {@code from_bit} (inclusive) to {@code to_bit}
         * (exclusive).
         * For each bit in the range, if it's '0', it becomes '1', and if it's '1', it
         * becomes '0'.
         * This implementation performs the flip in-place, efficiently handling
         * interactions with {@code trailingOnesCount} and the explicit bits stored
         * in the {@code values} array without creating temporary BitList objects.
         *
         * @param from_bit The starting bit position of the range to flip (inclusive,
         *                 0-indexed).
         * @param to_bit   The ending bit position of the range to flip (exclusive,
         *                 0-indexed).
         * @return This {@code RW} instance after flipping the bits in the specified
         * range.
         */
        public flip( from_bit: number, to_bit?: number ): RW;
        public flip( arg1: number, arg2?: number ): RW{
            if( arg2 === undefined ){ // Single bit flip
                const bit = arg1;
                if( bit < 0 ) return this;
                return this.get( bit ) ?
                       this.set0( bit ) :
                       this.set1( bit );
            }

            // Range flip
            let from_bit = arg1;
            let to_bit = arg2;


            // 1. Validate and normalize inputs
            if( from_bit < 0 )
                from_bit = 0
            if( to_bit <= from_bit )
                return this // Empty or invalid range, no change needed

            const last1 = this.last1()

            if( from_bit === this.trailingOnesCount ){
                if( this.used() === 0 ){
                    this.trailingOnesCount = to_bit
                    this.size = Math.max( this.size, to_bit )
                    return this
                }

                RW.fill( 3, this.values, 0, Math.min( last1 + 1, to_bit ) - this.trailingOnesCount ) // flip bits in the values
                let shift_bits = 0
                let i = 0
                for( let v: number; i < this._used; ){
                    v = this.values[i]
                    if( v === -1 )
                        shift_bits += 32
                    else{
                        shift_bits += Math.clz32( ~v & 0xffffffff ) // Use 32-bit trailing zeros count
                        break
                    }
                    i++
                }

                if( shift_bits === last1 + 1 - this.trailingOnesCount ){
                    this.trailingOnesCount += shift_bits + ( ( this.size = Math.max( this.size, to_bit ) ) - ( last1 + 1 ) )
                    this.values.fill( 0, 0, this._used )
                    this._used = 0
                    return this
                }

                const len = R.len4bits( ( last1 - this.trailingOnesCount ) - shift_bits + ( ( this.size = Math.max( this.size, to_bit ) ) - last1 ) )
                this.values = RW.shiftRight( this.values, this.values.length < len ?
                                                          new Uint32Array( len ) :
                                                          this.values, 0, last1 - this.trailingOnesCount + 1, shift_bits, true )

                this.trailingOnesCount += shift_bits
                this._used = len | R.IO
                return this
            }

            if( from_bit < this.trailingOnesCount ){
                const shift_bits = this.trailingOnesCount - from_bit
                const zeros = Math.min( this.trailingOnesCount, to_bit ) - from_bit // len of flipped to 0's trailing Ones

                if( 0 < this.used() ){
                    const len = R.len4bits( Math.max( last1 - this.trailingOnesCount + shift_bits, to_bit - this.trailingOnesCount ) )
                    this.values = RW.shiftLeft( this.values, 0, last1 - this.trailingOnesCount + 1 + shift_bits, shift_bits, false )
                    this._used = len
                    RW.fill( 0, this.values, 0, zeros )
                }else if( this.values.length < ( this._used = R.len4bits( Math.max( shift_bits, to_bit - this.trailingOnesCount ) ) ) )
                    this.values = new Uint32Array( this._used * 3 / 2 ).fill( 0 )

                RW.fill( 1, this.values, zeros, zeros + this.trailingOnesCount - from_bit )
                this.trailingOnesCount = from_bit
                this.size = Math.max( this.size, to_bit )
                this._used |= R.IO
                return this
            }else if( last1 < to_bit ){
                let u = Math.max( this.used(), R.len4bits( to_bit - this.trailingOnesCount ) )
                if( this.values.length < u )
                    this.values = this.used() === 0 ?
                                  new Uint32Array( u ).fill( 0 ) :
                                  copyOf( this.values, u );
                this._used = u

                if( last1 < from_bit ){
                    RW.fill( 1, this.values, from_bit - this.trailingOnesCount, to_bit - this.trailingOnesCount )
                    this.size = Math.max( this.size, to_bit )
                    return this
                }

                RW.fill( 1, this.values, last1 + 1 - this.trailingOnesCount, to_bit + 1 - this.trailingOnesCount )
                to_bit = last1
            }

            this.size = Math.max( this.size, to_bit )

            let pos = from_bit - this.trailingOnesCount & R.MASK
            let index = from_bit - this.trailingOnesCount >>> R.LEN
            if( 0 < pos ){
                const mask = R.mask( pos )
                const v = this.values[index]
                this.values[index] = v & mask | ~v & ~mask
                index++
            }

            const index2 = to_bit - this.trailingOnesCount >>> R.LEN
            while( index < index2 )
                this.values[index] = ~this.values[index++]

            const pos2 = to_bit - this.trailingOnesCount & R.MASK
            if( 0 < pos2 ){
                const mask = R.mask( pos2 )
                const v = this.values[index2]
                this.values[index2] = ~( v & mask ) | v & ~mask
            }

            return this // Return instance for method chaining
        }

        /**
         * Sets the bit at the specified index based on a primitive value.
         * The bit is set to '1' if the value is non-zero, and '0' if the value is zero.
         * The BitList size will be increased if the index is outside the current range.
         *
         * @param bit The global bit index (0-indexed) to set. Must be non-negative.
         * @param value The  value.
         * @returns This RW instance for method chaining.
         */
        set( bit: number, value: number | boolean ): RW{
            if( bit < 0 ) return this
            if( this.size <= bit ) this.size = bit + 1
            return value ?
                   this.set1( bit ) :
                   this.set0( bit )
        }


        /**
         * Sets a sequence of bits starting at a specified index, using values from a boolean array.
         * The BitList size will be increased if necessary to accommodate the sequence.
         *
         * @param index The starting global bit index (0-indexed, inclusive) to begin setting.
         *              Must be non-negative.
         * @param values An array of boolean values. values[i] determines the state of the bit
         *               at index + i (true for '1', false for '0').
         * @returns This RW instance for method chaining.
         */
        set$<T>( index: number, ...values: T[] ): RW{
            if( index < 0 ) return this
            const end = index + values.length
            if( this.size < end ) this.size = end

            for( let i = 0; i < values.length; i++ )
                values[i] ?
                this.set1( index + i ) :
                this.set0( index + i )
            return this
        }


        /**
         * Sets all bits within a specified range to a given boolean value.
         * The range is defined from from_bit (inclusive) to to_bit (exclusive).
         * The BitList size will be increased if to_bit is beyond the current size.
         *
         * @param from_bit The starting global bit index of the range (inclusive, 0-indexed).
         *                 Must be non-negative.
         * @param to_bit The ending global bit index of the range (exclusive, 0-indexed).
         *               Must not be less than from_bit.
         * @param value The value to set all bits in the range to (true for '1', false for '0').
         * @returns This RW instance for method chaining.
         */
        set_( from_bit: number, to_bit: number, value: number | boolean ): RW{
            if( from_bit >= to_bit || from_bit < 0 ) return this
            if( this.size < to_bit ) this.size = to_bit
            return value ?
                   this.set1( from_bit, to_bit ) :
                   this.set0( from_bit, to_bit )
        }

        /**
         * Sets the bit at the specified index to '1'.
         * Handles adjustments to {@code trailingOnesCount} and the {@code values} array,
         * including potential merging of adjacent '1' sequences and shifting bits if
         * a '0' within the {@code values} array (conceptually, the first '0' after
         * trailing ones) is changed to '1'. Expands storage if necessary.
         * Increases list size if {@code bit >= _size}.
         *
         * @param bit The global bit index (0-indexed) to set to '1'. Must be non-negative.
         * @return This {@code RW} instance for method chaining.
         */
        public set1( bit: number ): RW;
        /**
         * Sets all bits within a specified range to '1'.
         * The range is {@code [from_bit, to_bit)}. Handles adjustments to
         * {@code trailingOnesCount} and the {@code values} array, potentially merging
         * runs of '1's and shifting bits. Expands storage if needed.
         * Increases list size if {@code to_bit > _size}.
         *
         * @param from_bit The starting global bit index (inclusive, 0-indexed). Must be non-negative.
         * @param to_bit   The ending global bit index (exclusive, 0-indexed). Must not be less than {@code from_bit}.
         * @return This {@code RW} instance for method chaining.
         */
        public set1( from_bit: number, to_bit: number ): RW;
        public set1( arg1: number, arg2?: number ): RW{
            if( arg2 === undefined ){ // Single bit set1(bit)
                const bit = arg1;
                if( bit < this.trailingOnesCount ) return this

                if( this.size <= bit ) this.size = bit + 1

                if( bit === this.trailingOnesCount ){
                    if( this.used() === 0 ){
                        this.trailingOnesCount++
                        return this
                    }

                    const next1 = this.next1( bit )
                    const last1 = this.last1()
                    const valuesLast1 = last1 - this.trailingOnesCount

                    if( bit + 1 === next1 ){
                        const next0After = this.next0( next1 - 1 )
                        const spanOf1End = next0After === -1 ?
                                           last1 + 1 :
                                           next0After

                        if( last1 < spanOf1End ){
                            this.values.fill( 0, 0, this.used() )
                            this._used = 0
                        }else{
                            this.values = RW.shiftRight( this.values, this.values, next1 - this.trailingOnesCount, valuesLast1 + 1, spanOf1End - this.trailingOnesCount, true )
                            this._used |= R.IO
                        }

                        this.trailingOnesCount = spanOf1End
                        return this
                    }

                    this.values = RW.shiftRight( this.values, this.values, 0, valuesLast1 + 1, 1, true )

                    this.trailingOnesCount++
                    this._used |= R.IO
                    return this
                }

                const bitOffset = bit - this.trailingOnesCount
                const index = bitOffset >> R.LEN

                if( this.values.length < index + 1 )
                    this.values = copyOf( this.values, Math.max( this.values.length * 3 / 2, index + 1 ) );


                if( this._used <= index ) this._used = index + 1

                this.values[index] |= 1 << bitOffset & R.MASK

                return this
            }
            // Range set1(from_bit, to_bit)
            let fromBit = arg1;
            let toBit = arg2;

            if( fromBit < 0 || toBit <= fromBit ) return this
            if( this.size < toBit ) this.size = toBit
            if( toBit <= this.trailingOnesCount ) return this

            const last1 = this.last1()

            if( fromBit <= this.trailingOnesCount ){
                const nextZero = this.next0( toBit - 1 )
                toBit = nextZero === -1 ?
                        this.size :
                        nextZero

                if( last1 < toBit ){
                    this.values.fill( 0, 0, this._used )
                    this._used = 0
                    this.trailingOnesCount = toBit
                    return this
                }

                if( this._used > 0 )
                    this.values = RW.shiftRight( this.values, this.values, 0, last1 - this.trailingOnesCount + 1, toBit - this.trailingOnesCount, true )

                this.trailingOnesCount = toBit
                this._used |= R.IO
                return this
            }

            const max = toBit - this.trailingOnesCount >> R.LEN

            if( this.values.length < max + 1 )
                this.values = copyOf( this.values, Math.max( this.values.length * 3 / 2, max + 1 ) );

            if( this._used < max + 1 ) this._used = max + 1

            RW.fill( 1, this.values, fromBit - this.trailingOnesCount, toBit - this.trailingOnesCount )

            return this
        }

        /**
         * Sets the bit at the specified index to '0'.
         * Handles adjustments to {@code trailingOnesCount} and the {@code values} array.
         * If a bit within the {@code trailingOnesCount} region is cleared, it splits
         * the implicit '1's, potentially creating new explicit entries in the {@code values}
         * array and shifting existing ones. Expands storage if necessary.
         * Increases list size if {@code bit >= _size}.
         *
         * @param bit The global bit index (0-indexed) to set to '0'. Must be non-negative.
         * @return This {@code RW} instance for method chaining.
         */
        public set0( bit: number ): RW;
        /**
         * Sets all bits within a specified range to '0'.
         * The range is {@code [from_bit, to_bit)}. Handles adjustments to
         * {@code trailingOnesCount} and the {@code values} array, potentially splitting
         * implicit '1's runs and shifting bits. Expands storage if needed.
         * Increases list size if {@code to_bit > _size}.
         *
         * @param from_bit The starting global bit index (inclusive, 0-indexed). Must be non-negative.
         * @param to_bit   The ending global bit index (exclusive, 0-indexed). Must not be less than {@code from_bit}.
         * @return This {@code RW} instance for method chaining.
         */
        public set0( from_bit: number, to_bit: number ): RW;
        public set0( arg1: number, arg2?: number ): RW{
            if( arg2 === undefined ){ // Single bit set0(bit)
                const bit = arg1;
                if( bit < 0 ) return this

                if( this.size <= bit ){
                    this.size = bit + 1
                    return this
                }

                const last1 = this.last1()

                if( last1 < bit ){
                    this.size = Math.max( this.size, bit + 1 )
                    return this
                }

                if( bit < this.trailingOnesCount ){
                    if( bit + 1 === this.trailingOnesCount && this.used() === 0 ){
                        this.trailingOnesCount--
                        return this
                    }

                    const bitsInValues = last1 - this.trailingOnesCount + 1
                    const shift = this.trailingOnesCount - bit

                    this._used = R.len4bits( shift + bitsInValues )

                    if( bitsInValues > 0 ) this.values = RW.shiftLeft( this.values, 0, bitsInValues, shift, this.trailingOnesCount === 1 )
                    else if( this.values.length < this._used ) this.values = new Uint32Array( this._used )

                    if( shift > 1 ) RW.fill( 1, this.values, 1, shift )

                    this.trailingOnesCount = bit
                    this._used |= R.IO
                    return this
                }

                const bitInValues = bit - this.trailingOnesCount
                this.values[bitInValues >> R.LEN] &= ~( 1 << bitInValues & R.MASK )

                if( bit === last1 ) this._used |= R.IO

                return this

            }
            // Range set0(from_bit, to_bit)
            let fromBit = arg1;
            let toBit = arg2;

            if( fromBit < 0 || toBit <= fromBit ) return this
            if( this.size < toBit ) this.size = toBit

            const last1 = this.last1()
            if( last1 < fromBit ){
                this.size = Math.max( this.size, toBit )
                return this
            }

            toBit = Math.min( toBit, this.size )
            if( toBit <= fromBit ) return this

            const last1InValue = last1 - this.trailingOnesCount
            const bitsInValues = last1InValue < 0 ?
                                 0 :
                                 last1InValue + 1

            if( toBit <= this.trailingOnesCount ){
                const shift = this.trailingOnesCount - toBit
                this.trailingOnesCount = fromBit
                this._used = R.len4bits( shift + bitsInValues )

                if( bitsInValues > 0 )
                    this.values = RW.shiftLeft( this.values, 0, bitsInValues, toBit - fromBit + shift, true )
                else if( this.values.length < this._used )
                    this.values = new Uint32Array( Math.max( this.values.length + ( this.values.length >> 1 ), this._used ) )

                if( shift > 0 ) RW.fill( 1, this.values, toBit - fromBit, toBit - fromBit + shift )
            }else if( fromBit < this.trailingOnesCount ){
                const shift = this.trailingOnesCount - fromBit
                this.trailingOnesCount = fromBit
                this._used = R.len4bits( Math.max( shift + bitsInValues, toBit - this.trailingOnesCount ) )

                if( bitsInValues > 0 )
                    this.values = RW.shiftLeft( this.values, 0, bitsInValues, shift, true )
                else if( this.values.length < this._used )
                    this.values = new Uint32Array( Math.max( this.values.length + ( this.values.length >> 1 ), this._used ) )

                RW.fill( 0, this.values, 0, toBit - this.trailingOnesCount )
            }else RW.fill( 0, this.values, fromBit - this.trailingOnesCount, toBit - this.trailingOnesCount )

            this._used |= R.IO
            return this
        }


        /**
         * Removes the bit at the specified index, shifting all subsequent bits one
         * position to the left (towards lower indices). Decreases the size by one.
         * Handles adjustments to {@code trailingOnesCount} and the {@code values} array.
         *
         * @param bit The global bit index (0-indexed) to remove. Must be non-negative
         *            and less than the current size.
         * @return This {@code RW} instance for method chaining.
         */
        public remove( bit: number ): RW{
            if( bit < 0 || this.size <= bit ) return this

            this.size--

            if( bit < this.trailingOnesCount ){
                this.trailingOnesCount--
                return this
            }

            const last1 = this.last1()
            if( last1 < bit ) return this

            if( bit === last1 ){
                const bitOffset = bit - this.trailingOnesCount
                this.values[bitOffset >> R.LEN] &= ~( 1 << bitOffset & R.MASK )
                this._used |= R.IO
                return this
            }

            const last1InValues = last1 - this.trailingOnesCount

            if( bit !== this.trailingOnesCount )
                RW.shiftRight( this.values, this.values, bit - this.trailingOnesCount, last1InValues + 1, 1, true )
            else{
                const next0 = this.next0( bit )

                if( next0 === bit + 1 ){
                    RW.shiftRight( this.values, this.values, 1, last1InValues + 1, 1, true )
                    return this
                }

                if( next0 === -1 || last1 < next0 ){
                    this.trailingOnesCount += last1InValues
                    this.values.fill( 0, 0, this._used )
                }else{
                    const shift = next0 - bit
                    this.trailingOnesCount += shift - 1
                    RW.shiftRight( this.values, this.values, 1, last1InValues + 1, shift, true )
                }
            }

            this._used |= R.IO
            return this
        }

        public add( value: boolean | number ): RW{
            return value ?
                   this.add1( this.size ) :
                   this.add0( this.size );
        }

        public add$( bit: number, value: boolean | number ): RW{
            return value ?
                   this.add1( bit ) :
                   this.add0( bit );
        }


        /**
         * Inserts a '0' bit at the specified index, shifting all existing bits at
         * and after that index one position to the right (towards higher indices).
         * Increases the size by one. Handles adjustments to {@code trailingOnesCount}
         * and the {@code values} array.
         *
         * @param bit The global bit index (0-indexed) at which to insert the '0'.
         *            Must be non-negative. If {@code bit >= _size}, acts like appending a '0'.
         * @return This {@code RW} instance for method chaining.
         */
        public add0( bit: number ): RW{
            if( bit < 0 ) return this

            if( bit < this.size ) this.size++
            else this.size = bit + 1

            const last1 = this.last1()
            if( last1 < bit ) return this
            const last1InValues = last1 - this.trailingOnesCount

            if( bit < this.trailingOnesCount ){
                const shiftBits = this.trailingOnesCount - bit
                this._used = R.len4bits( last1 - this.trailingOnesCount + 1 + shiftBits )
                this.trailingOnesCount = bit

                if( last1InValues > 0 )
                    this.values = RW.shiftLeft( this.values, 0, last1InValues + 1, shiftBits, true )
                else if( this.values.length < this._used )
                    this.values = new Uint32Array( Math.max( Math.floor( this.values.length * 1.5 ), this._used ) )

                RW.fill( 1, this.values, 1, 1 + shiftBits )
            }else{
                this._used = R.len4bits( last1InValues + 1 + 1 ) | R.IO
                this.values = RW.shiftLeft( this.values, Math.abs( bit - this.trailingOnesCount ), last1InValues + 1, 1, true )
            }

            return this
        }

        /**
         * Inserts a '1' bit at the specified index, shifting all existing bits at
         * and after that index one position to the right (towards higher indices).
         * Increases the size by one. Handles adjustments to {@code trailingOnesCount}
         * and the {@code values} array, potentially merging with adjacent '1's.
         *
         * @param bit The global bit index (0-indexed) at which to insert the '1'.
         *            Must be non-negative. If {@code bit >= size}, acts like appending a '1'.
         * @return This {@code RW} instance for method chaining.
         */
        public add1( bit: number ): RW{
            if( bit < 0 ) return this

            if( bit <= this.trailingOnesCount ){
                this.trailingOnesCount++
                this.size++
                return this
            }

            const bitInValues = bit - this.trailingOnesCount
            const index = bitInValues >> R.LEN
            const last1 = this.last1()
            const valuesLast1 = last1 - this.trailingOnesCount

            if( this.used() === 0 ){
                if( this.values.length < index + 1 )
                    this.values = new Uint32Array( Math.max( this.values.length + ( this.values.length >> 1 ), index + 2 ) )
            }else if( bit <= last1 )
                this.values = RW.shiftLeft( this.values, bit - this.trailingOnesCount, valuesLast1 + 1, 1, false )

            this._used = R.len4bits( Math.max( bitInValues + 1, valuesLast1 + 1 + 1 ) )

            this.values[index] |= 1 << bitInValues & R.MASK
            if( this.size < bit ) this.size = bit + 1
            else this.size++

            return this
        }

        /**
         * Removes any trailing zero bits from the end of this {@code BitList} by
         * adjusting the size down to the index of the last '1' bit plus one.
         * If the list is all zeros or empty, the size becomes 0.
         *
         * @return This {@code RW} instance after trimming.
         */
        public trim(): RW{
            this.length = this.last1() + 1; // Use lengthSet to match Java's length(int)
            return this;
        }


        /**
         * Adjusts the capacity of the underlying {@code values} array to be the
         * minimum size required to hold the current logical bits (up to {@link #size}).
         * This can reduce memory usage if the list was previously larger or if
         * operations caused overallocation. It potentially clears bits between the
         * new size and the old size if shrinking.
         *
         * @return This {@code RW} instance after adjusting capacity.
         */
        public fit(): RW{
            this.length = this.size;
            return this;
        }

        /**
         * @readonly
         * @property {number} length - Gets the total allocated length (in bits) of the BitList.
         * @override
         */
        get length(): number{ return super.length; } // Override getter to call super class getter

        /**
         * Sets the logical length (size) of this {@code BitList} to the specified
         * number of bits.
         * <p>
         * If the new length {@code bits} is less than the current {@link #size}, the list
         * is truncated. Bits at indices {@code bits} and higher are discarded.
         * This may involve adjusting {@code trailingOnesCount} and clearing bits
         * within the {@code values} array. The underlying {@code values} array capacity
         * is also reduced to match the new requirement.
         * <p>
         * If {@code bits} is greater than the current size, the list is conceptually
         * padded with '0' bits at the end to reach the new length. The underlying
         * {@code values} array capacity might be increased, but no new '1' bits are set.
         * <p>
         * If {@code bits} is non-positive, the list is effectively cleared.
         *
         * @param bits The desired new length (size) of the {@code BitList} in bits.
         * @return This {@code RW} instance after setting the length.
         */
        set length( bits: number ){
            if( bits < 0 ) throw new Error( "length cannot be negative" )

            if( bits <= this.trailingOnesCount ){
                this.trailingOnesCount = bits
                this.values = new Uint32Array( 0 )
                this._used = 0
                this.size = bits
            }else if( bits < this.size ){
                const last1 = this.last1()

                if( last1 < bits ){
                    this.size = bits
                    return
                }

                const len = R.len4bits( bits - this.trailingOnesCount )
                if( len < this.values.length ) this.values = this.values.slice( 0, len )
                this._used = Math.min( this.used(), len ) | R.IO

                this.set0( bits, last1 + 1 )
                this.size = bits
            }
        }

        /**
         * @readonly
         * @property {number} size - Gets the logical size (number of bits) of the BitList.
         * @override
         */
        get size(): number{return this._size;} // Override getter to call super class getter
        /**
         * Sets the logical size of this {@code BitList}.
         * If the new size is smaller than the current size, the list is truncated,
         * discarding bits at indices {@code newSize} and above. This is similar to
         * {@link #length} but might not shrink the underlying array capacity as aggressively.
         * If the new size is larger, the list is expanded, conceptually padding with
         * '0' bits.
         *
         * @param size The desired new size of the {@code BitList}. Must be non-negative.
         * @return This {@code RW} instance after resizing.
         */
        set size( size: number ){
            if( size < this.size )
                if( size < 1 ) this.clear()
                else{
                    this.set0( size, this.size )
                    this._size = size
                }
            else if( this.size < size ) this._size = size
        }

        /**
         * Resets this {@code BitList} to an empty state.
         * Sets size and trailingOnesCount to 0, clears the {@code values} array
         * (sets elements to 0), and resets the {@code _used} count to 0.
         * The capacity of the {@code values} array may be retained.
         *
         * @return This {@code RW} instance after clearing.
         */
        public clear(): RW{
            this.values.fill( 0, 0, this.used() );

            this._used = 0;
            this._size = 0;
            this.trailingOnesCount = 0;
            return this;
        }

        /**
         * Creates and returns a deep copy of this {@code RW} instance.
         * The clone will have the same size, trailing ones count, and bit values
         * as the original, with its own independent copy of the underlying data.
         *
         * @return A new {@code RW} instance identical to this one.
         */
        public clone(): RW{ return super.clone() as RW; } // Utilize R's clone


        /**
         * Extracts a 32-bit word (number) from a Uint32Array, starting at a
         * specified bit offset within the array's conceptual bitstream.
         * Handles words that span across two Uint32 elements.
         *
         * @param src      The source Uint32Array.
         * @param bit      The starting bit position (0-based index relative to the start of src).
         * @param src_bits The total number of valid bits in the conceptual bitstream represented by src (used for boundary checks).
         * @return The 32-bit word starting at the specified bit position. Bits beyond src_bits are treated as 0.
         */
        protected static get__( src: Uint32Array, bit: number, src_bits: number ): number{
            const index = bit >>> this.LEN;
            const offset = bit & this.MASK;
            let result = src[index] >>> offset;
            if( 0 < offset && bit + this.BITS - offset < src_bits ) result |= src[index + 1] << ( this.BITS - offset );

            return result;
        }

        /**
         * Sets (writes) a 32-bit word (number) into a destination Uint32Array
         * at a specified bit offset within the array's conceptual bitstream.
         * Handles words that span across two Uint32 elements. Assumes destination
         * array is large enough.
         *
         * @param src      The 32-bit word to write.
         * @param dst      The destination Uint32Array.
         * @param bit      The starting bit position (0-based index relative to start of dst) to write to.
         * @param dst_bits The total number of valid bits in the destination conceptual bitstream (used for boundary checks/masking).
         */
        private static set( src: number, dst: Uint32Array, bit: number, dst_bits: number ): void{
            const index = bit >>> this.LEN;
            const offset = bit & this.MASK;

            if( offset === 0 ) dst[index] = src;
            else{
                dst[index] = dst[index] & this.mask( offset ) | ( src << offset );
                const next = index + 1;

                if( next < dst.length && next < this.len4bits( dst_bits ) )
                    dst[next] = dst[next] & ( ~0 << offset ) | ( src >>> ( this.BITS - offset ) );
            }
        }

        /**
         * Copies a specified number of bits from a source Uint32Array region
         * to a destination Uint32Array region. Handles overlapping regions correctly.
         * Uses get_ and set internally.
         *
         * @param src     The source Uint32Array.
         * @param src_bit The starting bit position in the source (relative index).
         * @param dst     The destination Uint32Array (can be the same as src).
         * @param dst_bit The starting bit position in the destination (relative index).
         * @param bits    The number of bits to copy.
         */
        private static bitcpy( src: Uint32Array, src_bit: number, dst: Uint32Array, dst_bit: number, bits: number ): void{
            const src_bits = src_bit + bits;
            const dst_bits = dst_bit + bits;

            const last = bits >>> this.LEN;
            const last_bits = ( bits - 1 & this.MASK ) + 1;

            if( dst === src && dst_bit < src_bit ){
                // <<<
                for( let i = 0; i < last; i++ )
                    this.set( this.get__( src, src_bit + ( i << this.LEN ), src_bits ), dst, dst_bit + ( i << this.LEN ), dst_bits );

                if( last_bits > 0 ){
                    const s = this.get__( src, src_bit + ( last << this.LEN ), src_bits );
                    const d = this.get__( dst, dst_bit + ( last << this.LEN ), dst_bits );
                    this.set( d ^ ( s ^ d ) & this.mask( last_bits ), dst, dst_bit + ( last << this.LEN ), dst_bits );
                }
            }else{    // >>>
                for( let i = 0; i < last; i++ )
                    this.set( this.get__( src, src_bit + bits - ( ( i + 1 ) << this.LEN ), src_bits ), dst, dst_bit + bits - ( ( i + 1 ) << this.LEN ), dst_bits );

                if( last_bits > 0 ){
                    const s = this.get__( src, src_bit, src_bits );
                    const d = this.get__( dst, dst_bit, dst_bits );
                    this.set( d ^ ( s ^ d ) & this.mask( last_bits ), dst, dst_bit, dst_bits );
                }
            }

            dst[this.len4bits( dst_bits ) - 1] &= this.mask( ( dst_bits - 1 & this.MASK ) + 1 );
        }

        /**
         * Shifts a range of bits within a Uint32Array to the right (towards
         * lower bit indices, LSB). Equivalent to >>> operation on the conceptual bitstream.
         * Optionally clears the bits vacated at the high end of the range.
         * <p>
         * works like right bit-shift >>> on primitives.
         * .                 MSB               LSB
         * .                 |                 |
         * bits in the list [0, 0, 0, 1, 1, 1, 1] Leading 3 zeros and trailing 4 ones
         * index in the list 6 5 4 3 2 1 0
         * shift left <<
         * shift right >>>
         *
         * @param src        The source Uint32Array.
         * @param dst        The destination Uint32Array. May be the same as src.
         * @param lo_bit     The starting bit index (inclusive, relative) of the range to shift.
         * @param hi_bit     The ending bit index (exclusive, relative) of the range to shift.
         * @param shift_bits The number of positions to shift right (must be positive).
         * @param clear      If true, the vacated bits at the high end (indices [hi_bit - shift_bits, hi_bit)) are set to 0.
         * @return The modified dst array
         */
        static shiftRight( src: Uint32Array, dst: Uint32Array, lo_bit: number, hi_bit: number, shift_bits: number, clear: boolean ): Uint32Array{
            if( hi_bit <= lo_bit || shift_bits < 1 ) return src;

            if( src !== dst && 0 < lo_bit )
                dst.set( src.subarray( 0, this.len4bits( lo_bit ) ), 0 );

            if( shift_bits < hi_bit - lo_bit )
                this.bitcpy( src, lo_bit + shift_bits, dst, lo_bit, hi_bit - lo_bit - shift_bits );

            if( clear )
                this.fill( 0, dst, hi_bit - shift_bits, hi_bit );
            return dst;
        }

        /**
         * Shifts a range of bits within a Uint32Array to the left (towards
         * higher bit indices, MSB). Equivalent to << operation on the conceptual bitstream.
         * Handles potential reallocation if the shift requires expanding the array.
         * Optionally clears the bits vacated at the low end of the range.
         * <p>
         * works like left bit-shift << on primitives.
         * .                 MSB               LSB
         * .                 |                 |
         * bits in the list [0, 0, 0, 1, 1, 1, 1] Leading 3 zeros and trailing 4 ones
         * index in the list 6 5 4 3 2 1 0
         * shift left <<
         * shift right >>>
         *
         * @param src        The source Uint32Array.
         * @param lo_bit     The starting bit index (inclusive, relative) of the range to shift.
         * @param hi_bit     The ending bit index (exclusive, relative) of the range to shift.
         * @param shift_bits The number of positions to shift left (must be positive).
         * @param clear      If true, the vacated bits at the low end (indices [lo_bit, lo_bit + shift_bits)) are set to 0.
         * @return The modified src array, or a new, larger array if reallocation occurred.
         */
        static shiftLeft( src: Uint32Array, lo_bit: number, hi_bit: number, shift_bits: number, clear: boolean ): Uint32Array{
            if( hi_bit <= lo_bit || shift_bits < 1 ) return src;

            const max = this.len4bits( hi_bit + shift_bits );
            let dst = src;

            if( src.length < max ){
                dst = new Uint32Array( Math.ceil( max * 1.5 ) );
                if( 0 < lo_bit >> this.LEN )
                    dst.set( src.subarray( 0, lo_bit >> this.LEN ), 0 );
            }

            this.bitcpy( src, lo_bit, dst, lo_bit + shift_bits, hi_bit - lo_bit );

            if( clear )
                this.fill( 0, dst, lo_bit, lo_bit + shift_bits );

            return dst;
        }

        /**
         * Fills a range of bits within a Uint32Array with a specified value (0, 1, or 2 for toggle/flip).
         * Operates on the conceptual bitstream represented by the array.
         *
         * @param src    The value to fill with: 0 (clear), 1 (set), any other (flip).
         * @param dst    The destination Uint32Array.
         * @param lo_bit The starting bit index (inclusive, relative) of the range to fill.
         * @param hi_bit The ending bit index (exclusive, relative) of the range to fill.
         */
        private static fill( src: number, dst: Uint32Array, lo_bit: number, hi_bit: number ): void{
            const lo_index = lo_bit >> this.LEN;
            const hi_index = ( hi_bit - 1 ) >> this.LEN;
            const lo_offset = lo_bit & this.MASK;
            const hi_offset = ( hi_bit - 1 ) & this.MASK;

            if( lo_index === hi_index )
                switch( src ){
                    case 0:
                        dst[lo_index] &= ~( this.mask( hi_bit - lo_bit ) << lo_offset );
                        return;
                    case 1:
                        dst[lo_index] |= this.mask( hi_bit - lo_bit ) << lo_offset;
                        return;
                    default:
                        dst[lo_index] ^= this.mask( hi_bit - lo_bit ) << lo_offset;
                        return;
                }

            switch( src ){
                case 0:
                    dst[lo_index] &= this.mask( lo_offset );
                    for( let i = lo_index + 1; i < hi_index; i++ )
                        dst[i] = 0;
                    dst[hi_index] &= ~this.mask( hi_offset + 1 );
                    return;
                case 1:
                    dst[lo_index] |= ~this.mask( lo_offset );
                    for( let i = lo_index + 1; i < hi_index; i++ )
                        dst[i] = -1;
                    dst[hi_index] |= this.mask( hi_offset + 1 );
                    return;
                default:
                    dst[lo_index] ^= ~this.mask( lo_offset );
                    for( let i = lo_index + 1; i < hi_index; i++ )
                        dst[i] ^= -1;
                    dst[hi_index] ^= this.mask( hi_offset + 1 );
            }
        }
    }
}

export default BitList;