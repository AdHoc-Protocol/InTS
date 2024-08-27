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

'use strict';
//https: //devdocs.io/javascript/global_objects/uint8clampedarray
import Context from "../gen/Context"


//Use undefined. Do not use undefined. https://github.com/Microsoft/TypeScript/wiki/Coding-guidelines#undefined-and-undefined

export namespace AdHoc {

//#region SAFE_INTEGER bitwise functions


    // Class to handle 33-53 bit operations on numbers, using high and low portions
    export class _33_53 {
        // High and low portions of the number
        hi = 0; // upper 21 bits
        lo = 0; // lower 32 bits

        // Set the high and low portions based on a given number
        set(x: number): _33_53 {
            if (x > 0) {
                // For positive numbers, extract low and high parts
                this.lo = x | 0; // lower 32 bits
                this.hi = x / 0x1_0000_0000 | 0; // upper 21 bits
            } else if (x < 0) {
                // For negative numbers, use bitwise operations to handle two's complement
                const lo = -x | 0;
                const hi = -x / 0x1_0000_0000 | 0;

                // Adjust for negative numbers using two's complement
                this.lo = ~lo + 1 | 0;
                this.hi = ~hi + (lo ?
                                 0 :
                                 1) | 0;
            } else {
                // For zero, set both parts to zero
                this.lo = 0;
                this.hi = 0;
            }

            return this;
        }

        // Get the combined number from high and low portions
        get(): number {
            // Combine the high and low portions to get the original number
            return this.hi * 0x1_0000_0000 + (this.lo >>> 0);
        }

        // Bitwise AND with another _33_53 object
        and(other: _33_53): _33_53 {
            this.lo &= other.lo;
            this.hi &= other.hi;
            return this;
        }

        // Bitwise AND with a number
        and_(x: number): _33_53 {
            // Prepare high and low parts based on the input number
            let hi = 0;
            let lo = 0;
            if (x > 0) {
                lo = x | 0;
                hi = x / 0x1_0000_0000 | 0;
            } else if (x < 0) {
                lo = -x | 0;
                hi = -x / 0x1_0000_0000 | 0;

                lo = ~lo + 1 | 0;
                hi = ~hi + (lo ?
                            0 :
                            1) | 0;
            }

            // Apply bitwise AND with the calculated parts
            this.lo &= lo;
            this.hi &= hi;
            return this;
        }

        and__(x: number, y: number): _33_53 { return this.set(x).and_(y) }

        // Bitwise OR with another _33_53 object
        or(src: _33_53): _33_53 {
            this.lo |= src.lo;
            this.hi |= src.hi;
            return this;
        }

        // Bitwise OR with a number
        or_(x: number): _33_53 {
            let hi = 0;
            let lo = 0;
            if (x > 0) {
                lo = x | 0;
                hi = x / 0x1_0000_0000 | 0;
            } else if (x < 0) {
                lo = -x | 0;
                hi = -x / 0x1_0000_0000 | 0;

                lo = ~lo + 1 | 0;
                hi = ~hi + (lo ?
                            0 :
                            1) | 0;
            }

            this.lo |= lo;
            this.hi |= hi;
            return this;
        }

        or__(x: number, y: number): _33_53 { return this.set(x).or_(y) }

        // Bitwise XOR with another _33_53 object
        xor(src: _33_53): _33_53 {
            this.lo ^= src.lo;
            this.hi ^= src.hi;
            return this;
        }

        // Bitwise XOR with a number
        xor_(x: number): _33_53 {
            let hi = 0;
            let lo = 0;
            if (x > 0) {
                lo = x | 0;
                hi = x / 0x1_0000_0000 | 0;
            } else if (x < 0) {
                lo = -x | 0;
                hi = -x / 0x1_0000_0000 | 0;

                lo = ~lo + 1 | 0;
                hi = ~hi + (lo ?
                            0 :
                            1) | 0;
            }

            this.lo ^= lo;
            this.hi ^= hi;
            return this;
        }

        xor__(x: number, y: number): _33_53 { return this.set(x).xor_(y) }

        neg_(x: number): _33_53 { return this.set(x).neg() }

        // Negate the current number (two's complement)
        neg() {
            this.lo = ~this.lo + 1 | 0;
            this.hi = ~this.hi + (this.lo ?
                                  0 :
                                  1) | 0;
            return this;
        }

        // Left shift by a certain number of bits
        shl(bits: number): _33_53 {
            if (!(bits &= 63)) return this; // Return if no shift required

            const lo = this.lo;
            const hi = this.hi;

            if (bits < 32) {
                // Shift within the lower 32 bits
                this.lo = lo << bits;
                this.hi = hi << bits | lo >>> 32 - bits;
            } else {
                // Shift more than 32 bits, affecting high part
                this.lo = 0;
                this.hi = lo << bits - 32;
            }
            return this;
        }

        shl_(x: number, bits: number) {return this.set(x).shl(bits)}

        // Right shift by a certain number of bits
        shr(bits: number): _33_53 {
            if (!(bits &= 63)) return this;
            const lo = this.lo
            const hi = this.hi


            if (bits < 32) {
                // Shift within the lower 32 bits
                this.lo = lo >>> bits | hi << 32 - bits;
                this.hi = hi >> bits; // Sign-preserving right shift
            } else {
                // Shift more than 32 bits, affecting high part
                this.lo = hi >> bits - 32;
                this.hi = hi < 0 ?
                          -1 :
                          0; // Maintain sign for high bits
            }

            return this;
        }

        shr_(x: number, bits: number): _33_53 {return this.set(x).shr(bits)}

        // Unsigned right shift by a certain number of bits
        shru(bits: number): _33_53 {
            if (!(bits &= 63)) return this; // Return if no shift
            const lo = this.lo;
            const hi = this.hi;

            if (bits < 32) {
                this.lo = lo >>> bits | hi << 32 - bits
                this.hi = hi >>> bits // Unsigned right shift for high bits
            } else if (bits === 32) {
                this.lo = hi
                this.hi = 0
            } else {
                this.lo = hi >>> bits - 32
                this.hi = 0
            }
            return this
        }

        shru_(x: number, bits: number): _33_53 {return this.set(x).shru(bits)}

        not() {
            this.lo = ~this.lo;
            this.hi = ~this.hi;
            return this
        }
    }

    export const p = new _33_53();
    export const q = new _33_53();


    export function bitCount(v: number): number {
        v = v - (v >> 1 & 0x55555555);
        v = (v & 0x33333333) + (v >> 2 & 0x33333333);
        return (v + (v >> 4) & 0xF0F0F0F) * 0x1010101 >> 24;
    }

    export function bitCount52(v: number): number { return bitCount(v / 0x1_0000_0000) + bitCount(v | 0) }

    export function numberOfLeadingZeros(v: number): number {return Math.clz32(v); }

    export function numberOfLeadingZeros52(v: number): number {
        const hi = numberOfLeadingZeros(v / 0x1_0000_0000);
        return hi === 32 ?
               numberOfLeadingZeros(v) :
               hi
    }

    export function numberOfLeadingZeros_(v: number, from_bit: number): number { return numberOfLeadingZeros(v << 31 - from_bit) }

    export function numberOfLeadingZeros52_(v: number, from_bit: number): number {

        if (from_bit < 32) return numberOfLeadingZeros_(v >>> 0, from_bit)
        const hi = v / 0x1_0000_0000 >>> 0;

        return hi === 0 ?
               32 + numberOfLeadingZeros_(v, from_bit - 32) :
               63 - from_bit + numberOfLeadingZeros_(hi, from_bit - 32);
    }

    export function numberOfLeadingZeros__(v: bigint, from_bit: number): number {
        if (v < 0) return 0
        if (from_bit < 32) return numberOfLeadingZeros_(Number(v), from_bit)
        if (from_bit < 52 || v < Number.MAX_VALUE) return numberOfLeadingZeros52_(Number(v), from_bit)

        return 52 + numberOfLeadingZeros_(Number(v >> 52n), from_bit - 52)
    }

    export function numberOfTrailingZeros(v: number): number {return bitCount((v & -v) - 1);}

    export function numberOfTrailingZeros52(v: number): number {
        return v >>> 0 === 0 ?
               32 + numberOfTrailingZeros(v / 0x1_0000_0000) :
               bitCount((v & -v) - 1);
    }

    // v8 has an optimization for storing 31-bit signed numbers.
    // Values which have either 00 or 11 as the high order bits qualify.
    // This function drops the highest order bit in a signed number, maintaining the sign bit.
    export function smi(i32: number) {
        return i32 >>> 1 & 0x40000000 | i32 & 0xbfffffff;
    }

    export function signed(value: number, negative_bit: number, subs: number) {
        return value < negative_bit ?
               value :
               value - subs
    }

//#endregion

    export interface BytesSrc {
        subscribe_on_new_bytes_to_transmit_arrive(subscriber: (BytesSrc) => void): (BytesSrc) => void;// Subscribe to be notified when new bytes are available for transmission

        read(dst: DataView, byte: number, bytes: number): number

        get isOpen(): boolean

        close(): void
    }

    export interface BytesDst {
        write(src: DataView, byte: number, bytes: number): number;

        get isOpen(): boolean;

        close(): void
    }

    export class Stage {
        readonly uid: number
        readonly name: string
        readonly timeout: number
        readonly on_transmitting: (number) => Stage
        readonly on_receiving: (number) => Stage

        constructor(uid: number, name: string, timeout: number,
                    on_transmitting: ((id: number) => AdHoc.Stage) | undefined = undefined,
                    on_receiving: ((id: number) => AdHoc.Stage) | undefined = undefined) {
            this.uid = uid;
            this.name = name;
            this.timeout = timeout;
            this.on_transmitting = on_transmitting ?? (() => Stage.ERROR);
            this.on_receiving = on_receiving ?? (() => Stage.ERROR);
        }

        get [Symbol.toStringTag]() {return this.name }
    }

    export namespace Stage {
        export const EXIT = new Stage(0xFFFF, "Exit", 0xFFFF)
        export const ERROR = new Stage(0xFFFF, "Error", 0xFFFF)
    }


    export const OK = Number.MAX_SAFE_INTEGER - 10,
        STR = OK - 100,
        RETRY = STR + 1,
        VAL4 = RETRY + 1,
        VAL = VAL4 + 1,
        LEN0 = VAL + 1,
        LEN1 = LEN0 + 1,
        LEN2 = LEN1 + 1,
        BITS = LEN2 + 1,
        BITS_BYTES = BITS + 1,
        BITS_BYTES4 = BITS_BYTES + 1,
        BITS_BYTES8 = BITS_BYTES4 + 1,
        VARINT4 = BITS_BYTES8 + 1,
        VARINT8 = VARINT4 + 1;

    export abstract class Receiver extends Context.Receiver implements AdHoc.BytesDst {

        readonly id_bytes: number;//bytes allocated for pack id
        handler: AdHoc.Receiver.EventsHandler | undefined;

        constructor(handler: AdHoc.Receiver.EventsHandler | undefined, id_bytes: number) {
            super();
            this.bytes_left = 0;
            this.id_bytes = id_bytes;
            this.handler = handler;
        }

        exchange(handler: AdHoc.Receiver.EventsHandler): AdHoc.Receiver.EventsHandler | undefined {
            const tmp = this.handler;
            this.handler = handler;
            return tmp;
        }


        output(): AdHoc.Receiver.BytesDst | undefined {
            const output = this.slot!.next!.dst;
            this.slot!.next!.dst = undefined
            return output
        }


//#region is null
        get_fields_nulls(this_case: number): boolean {
            if (this.byte < this.byte_max) {
                this.slot!.fields_nulls = this.buffer!.getUint8(this.byte++);
                return true;
            }

            this.slot!.state = this_case;
            this.mode = RETRY;
            return false;
        }

        is_null(field: number, if_null_case: number): boolean {
            if (this.slot!.fields_nulls & field) return false;
            this.slot.state = if_null_case;
            return true;
        }

        bit_null(if_null_case: number): boolean {
            if (this.get_bits === 0) return false;
            this.slot.state = if_null_case;
            return true;
        }


        public is_null_byte(if_null_case: number): boolean {
            if (this.get_byte() === 0) return false;
            this.slot.state = if_null_case
            return true;
        }

//#endregion


        public has_bytes(retry_case: number): boolean {
            if (this.byte < this.byte_max) return true;
            this.mode = RETRY;
            this.slot.state = retry_case;
            return false;
        }


        slot: Receiver.Slot;

        get isOpen(): boolean { return this.slot !== undefined}

        slot_ref: WeakRef<Receiver.Slot> = new WeakRef(new Receiver.Slot(this, undefined));


        close(): void {this.reset();}

        reset(): void {
            if (!this.slot) return;

            for (let s: Receiver.Slot | undefined = this.slot; s != undefined; s = s.next) s.dst = undefined;
            this.slot = undefined!;


            this.#cache.reset();

            this.buffer = undefined;
            this.mode = OK;
            this.bytes_left = 0;
            this.u4 = 0;
            this.u8 = 0n;
            this.str = undefined;
        }

        public abstract allocate(id: number): Receiver.BytesDst //throws Error if wrong id
        public abstract receiving(id: number): Receiver.BytesDst //throws Error if wrong id

        // if src == undefined - clear and close
        write(src: DataView, byte: number, bytes: number): number {
            this.byte = byte;
            this.byte_max = byte + bytes;

            const remaining = this.byte_max - this.byte;
            if (remaining < 1) return 0

            this.buffer = src;
            write:
            {
                for (; this.byte_max - this.byte;) {
                    if (this.slot && this.slot.dst)
                        switch (this.mode) {
                            case VAL:
                                if (this.#cache.complete()) break;
                                break write;
                            case LEN0:
                                if (!this.#cache.complete()) break write;
                                this.slot.check_len0(this.get4());
                                break;
                            case LEN1:
                                if (!this.#cache.complete()) break write;
                                this.slot.check_len1(this.get4());
                                break;
                            case LEN2:
                                if (!this.#cache.complete()) break write;
                                this.slot.check_len2(this.get4());
                                break;
                            case VARINT4:
                                if (this.#retry_get_varint4(this.slot.state)) break;
                                break write;
                            case VARINT8:
                                if (this.#retry_get_varint8(this.slot.state)) break;
                                break write;
                            case STR:
                                if (!this.#varint()) break write;

                                if (this.u4_ == -1) { if (!this.#check_length_and_getting_string()) break write; }//was reading string length
                                else {
                                    this.#chs![this.u4_++] = this.u4;
                                    if (!this.#getting_string()) break write;
                                }
                                break;
                        }
                    else
                        try {
                            if (!this.#cache.try_get(this.id_bytes)) break write;

                            const dst = this.receiving(this.get4_(this.id_bytes));//throws Error if wrong id
                            if (!this.slot) if (!(this.slot = this.slot_ref.deref()!)) this.slot_ref = new WeakRef(this.slot = new Receiver.Slot(this, undefined));

                            this.slot.dst = dst;
                            this.bytes_left = 0;
                            this.u8 = 0n;
                            this.u8_ = 0n;
                            this.u4 = 0;
                            this.u4_ = 0;
                            this.slot!.state = 0;
                            this.handler!.on_receiving(this, dst);
                            if (this.slot == undefined) return -1;    //receiving event handler has close this
                        } catch (ex) {
                            this.reset();
                            AdHoc.Receiver.error_handler(this, AdHoc.Receiver.OnError.INVALID_ID)
                            break;
                        }

                    this.mode = OK;
                    for (; ;)
                        if (!this.slot!.dst!.__put_bytes(this)) break write;//data over
                        else {
                            if (this.slot!.prev) this.slot = this.slot!.prev;
                            else break;
                        }

                    this.handler!.on_received(this, this.slot!.dst!);//dispatching
                    if (this.slot == undefined) return -1;	//received event handler has close this
                    this.slot!.dst = undefined; //mark ready to receive next package
                }

                if (!this.slot || !this.slot.dst) this.reset();

            }//write:
            this.buffer = undefined;

            return remaining;
        }

        try_get(get_case: number): boolean { return this.try_get_(this.bytes_left, get_case); }

        try_get_(bytes: number, get_case: number, mode_on_retry: number = VAL): boolean {

            if (this.#cache.try_get(bytes)) return true;

            this.bytes_left = bytes;
            this.mode = mode_on_retry;
            this.slot!.state = get_case;
            return false;
        }


        get remaining(): number { return this.byte_max - this.byte; }

        get position(): number { return this.byte; }

        retry_at(the_case: number) {
            this.slot!.state = the_case;
            this.mode = RETRY;
        }


//#region bits

        public init_bits()  //bits receiving init
        {
            this.bits = 0;
            this.bit = 8;
        }

        get get_bits(): number { return this.u4; }


        public get_bits_(len_bits: number): number {
            let ret: number;
            if (this.bit + len_bits < 9) {
                ret = this.bits >> this.bit & 0xFF >> 8 - len_bits;
                this.bit += len_bits;
            } else {
                ret = (this.bits >> this.bit | (this.bits = this.buffer!.getUint8(this.byte++)) << 8 - this.bit) & 0xFF >> 8 - len_bits;
                this.bit = this.bit + len_bits - 8;
            }

            return ret;
        }

        public try_get_bits(len_bits: number, this_case: number): boolean {
            if (this.bit + len_bits < 9) {
                this.u4 = this.bits >> this.bit & 0xFF >> 8 - len_bits;
                this.bit += len_bits;
            } else if (this.byte < this.byte_max) {
                this.u4 = (this.bits >> this.bit | (this.bits = this.buffer!.getUint8(this.byte++)) << 8 - this.bit) & 0xFF >> 8 - len_bits;
                this.bit = this.bit + len_bits - 8;
            } else {
                this.retry_at(this_case);
                return false;
            }
            return true;
        }

//#endregion


//#region varint

        public try_get_varint_bits1(bits: number, this_case: number): boolean {
            if (!this.try_get_bits(bits, this_case)) return false;
            this.bytes_left = this.get_bits + 1;
            return true;
        }

        public try_get_varint_bits(bits: number, this_case: number): boolean {
            if (!this.try_get_bits(bits, this_case)) return false;
            this.bytes_left = this.get_bits;
            return true;
        }


        public try_get_varint4(next_case: number): boolean {
            this.u4 = 0;
            this.bytes_left = 0;

            return this.#retry_get_varint4(next_case);
        }

        #retry_get_varint4(next_case: number): boolean {

            while (this.byte < this.byte_max) {
                const i = this.buffer!.getInt8(this.byte++);
                const v = i & 0x7F

                if (this.bytes_left + 7 < 33) this.u4 |= v << this.bytes_left
                else
                    this.u4 = 32 < this.bytes_left ?
                              (~~(this.u4 / 0xFFFF_FFFF) | v << this.bytes_left - 32) * 0x1_0000_0000 + (~~this.u4 >>> 0) :
                              (v >>> 7 - (31 - this.bytes_left)) * 0x1_0000_0000 + ((this.u4 | (v & 0x7F >>> 31 - this.bytes_left) << this.bytes_left) >>> 0)

                if (-1 < i) return true;

                this.bytes_left += 7;
            }

            this.slot.state = next_case;
            this.mode = VARINT4;
            return false;
        }

        #varint() {
            for (let b = 0; this.byte < this.byte_max; this.u4 |= (b & 0x7F) << this.bytes_left, this.bytes_left += 7)
                if ((b = this.buffer!.getUint8(this.byte++)) < 0x80) {
                    this.u4 |= b << this.bytes_left;
                    return true;
                }
            return false;
        }

        public try_get_varint8(next_case: number): boolean {
            this.u4 = 0;
            this.bit = 0;
            this.bytes_left = 28;//28=7 * 4
            this.tmp_bytes = 0;

            return this.#retry_get_varint8(next_case);
        }

        #retry_get_varint8(next_case: number): boolean {

            while (this.byte < this.byte_max) {
                const b = this.buffer!.getInt8(this.byte++);
                if (b < 0) {
                    if (this.bit === this.bytes_left) {
                        if (this.bytes_left === 31)
                            throw Error("Alarm. Overflow on decoding varint.")

                        this.tmp_bytes = (this.u4 | b << 28) >>> 0

                        this.u4 = b >> 4 & 0x7
                        this.bit = 3
                        this.bytes_left = 31 //Alarm bit 31 = 3 + 7 * 4
                    } else {
                        this.u4 |= (b & 0x7F) << this.bit;
                        this.bit += 7;
                    }
                    continue;
                }

                this.u4 |= b << this.bit;

                if (this.bytes_left === 31)
                    if (this.bit < 14)// 53(safe bit) = (7 + this.bit + 32)
                        this.u8 = BigInt(this.u4 * 0x1_0000_0000 + this.tmp_bytes)
                    else {
                        //Extremely rarely executed code path
                        this.tmp.setUint32(0, this.tmp_bytes, true)
                        this.tmp.setUint32(4, this.u4, true)
                        this.u8 = this.tmp.getBigUint64(0, true)
                    }
                else this.u8 = BigInt(this.u4)

                return true;
            }
            this.slot.state = next_case;
            this.mode = VARINT8;
            return false;
        }

//#endregion

        public get_bool(): boolean {
            const ret = this.buffer!.getUint8(this.byte) == 1;
            this.byte += 1;
            return ret;
        }

        public get_booL(): boolean | undefined {
            const ret = this.buffer!.getUint8(this.byte);
            this.byte += 1;
            return ret == 2 ?
                   undefined :
                   ret == 1;
        }

        public get_sbyte(): number {
            const ret = this.buffer!.getInt8(this.byte);
            this.byte += 1;
            return ret;
        }

        public get_byte(): number {
            const ret = this.buffer!.getUint8(this.byte);
            this.byte += 1;
            return ret;
        }

        public get_short(): number {
            const ret = this.buffer!.getInt16(this.byte, true);
            this.byte += 2;
            return ret;
        }

        public get_char(): number {
            const ret = this.buffer!.getUint16(this.byte, true);
            this.byte += 2;
            return ret;
        }

        public get_ushort(): number {
            const ret = this.buffer!.getUint16(this.byte, true);
            this.byte += 2;
            return ret;
        }

        public get_int(): number {
            const ret = this.buffer!.getInt32(this.byte, true);
            this.byte += 4;
            return ret;
        }

        public get_uint(): number {
            const ret = this.buffer!.getUint32(this.byte, true);
            this.byte += 4;
            return ret;
        }

        public get_long(): bigint {
            const ret = this.buffer!.getBigInt64(this.byte, true);
            this.byte += 8;
            return ret;
        }

        public to_long(hi: number, lo: number): bigint {
            this.tmp.setUint32(0, lo, true);
            this.tmp.setUint32(4, hi, true);
            return this.tmp.getBigInt64(0, true);
        }

        public to_long_(hi: number, ulo: number): number {
            return hi < 0 ?
                   hi * 0x1_0000_0000 - ulo :
                   hi * 0x1_0000_0000 + ulo;
        }

        public get_ulong(): bigint {
            const ret = this.buffer!.getBigUint64(this.byte, true);
            this.byte += 8;
            return ret;
        }

        public to_ulong(hi: number, lo: number): bigint {
            this.tmp.setUint32(0, lo, true);
            this.tmp.setUint32(4, hi, true);
            return this.tmp.getBigUint64(0, true);
        }

        public get_float(): number {
            const ret = this.buffer!.getFloat32(this.byte, true);
            this.byte += 4;
            return ret;
        }

        public get_double(): number {
            const ret = this.buffer!.getFloat64(this.byte, true);
            this.byte += 8;
            return ret;
        }

        public get4(): number {return this.get4_(this.bytes_left)}


        public get4_(bytes: number): number { //always less than 53 bits
            const byte = this.byte;
            this.byte += bytes;

            switch (bytes) {
                case 7:
                    return this.buffer!.getUint32(byte, true) + this.buffer!.getUint16(byte + 4, true) * 0x1_0000_0000 + this.buffer!.getUint8(byte + 6) * 0x1_0000_0000_0000;
                case 6:
                    return this.buffer!.getUint32(byte, true) + this.buffer!.getUint16(byte + 4, true) * 0x1_0000_0000;
                case 5:
                    return this.buffer!.getUint32(byte, true) + this.buffer!.getUint8(byte + 4) * 0x1_0000_0000;
                case 4:
                    return this.buffer!.getUint32(byte, true);
                case 3:
                    return this.buffer!.getUint8(byte) + (this.buffer!.getUint16(byte + 1, true) << 8);
                case 2:
                    return this.buffer!.getUint16(byte, true);
            }
            return this.buffer!.getUint8(byte);
        }


        public get4_signed(bytes: number): number { //always less 53 bits
            const byte = this.byte;
            this.byte += bytes;
            let hi = 0

            switch (bytes) {
                case 7:
                    hi = this.buffer!.getUint16(byte + 4, true) * 0x1_0000_0000 + this.buffer!.getInt8(byte + 6) * 0x1_0000_0000_0000;
                    break;
                case 6:
                    hi = this.buffer!.getInt16(byte + 4, true) * 0x1_0000_0000;
                    break;
                case 5:
                    hi = this.buffer!.getInt8(byte + 4) * 0x1_0000_0000;
                    break;
                case 4:
                    return this.buffer!.getInt32(byte, true);
                case 3:
                    return this.buffer!.getUint8(byte) | this.buffer!.getInt16(byte + 1, true) << 8;
                case 2:
                    return this.buffer!.getInt16(byte, true);
                case 1:
                    return this.buffer!.getInt8(byte);
            }

            return hi < 0 ?
                   hi - this.buffer!.getUint32(byte, true) :
                   hi + this.buffer!.getUint32(byte, true);
        }

        bvtyyj

        public get8(): bigint {return this.get8_(this.bytes_left)}

        public get8_(bytes: number): bigint {
            const byte = this.byte;


            switch (bytes) {
                case 8:
                    this.byte += bytes;
                    return this.buffer!.getBigUint64(byte, true);
                case 7://56 bits
                    this.byte += bytes;
                    this.tmp.setUint32(0, this.buffer!.getUint32(byte, true), true);
                    this.tmp.setUint32(4, this.buffer!.getUint16(byte + 4, true) | this.buffer!.getUint8(byte + 6) << 16, true);
                    return this.tmp.getBigUint64(0, true);
            }
            //less 53 bits
            return BigInt(this.get4_(bytes))
        }

        public get8_signed(bytes: number): bigint {
            const byte = this.byte;


            switch (bytes) {
                case 8:
                    this.byte += bytes;
                    return this.buffer!.getBigInt64(byte, true);
                case 7://56 bits
                    this.byte += bytes;
                    this.tmp.setUint32(0, this.buffer!.getUint32(byte, true), true);
                    this.tmp.setUint32(4, this.buffer!.getUint16(byte + 4, true) | this.buffer!.getInt8(byte + 6) << 16, true);
                    return this.tmp.getBigInt64(0, true);
            }
            //less 53 bits
            return BigInt(this.get4_signed(bytes))
        }

        readonly #cache = new Receiver.Cache(this);

//#region string

        public get_string(): string {//getting result internal loading

            const ret = this.str;
            this.str = undefined;
            return ret!;
        }

        #chs_ref: WeakRef<Uint16Array> = new WeakRef(new Uint16Array(255));
        #chs: Uint16Array | undefined

        #max_items = 0

        public try_get_string(max_chars: number, get_string_case: number): boolean {

            this.#max_items = max_chars
            this.u4_ = -1;//before read string length mark

            this.u4 = 0
            this.bytes_left = 0

            if (this.#varint() &&  //getting string length into u4
                this.#check_length_and_getting_string()) return true;


            this.slot!.state = get_string_case;
            this.mode = STR;
            return false;
        }

        #check_length_and_getting_string(): boolean {

            if (this.#max_items < this.u4) Receiver.error_handler(this, Receiver.OnError.OVERFLOW, Error("In check_length_and_getting_string(): boolean{} max_items < u4 : " + this.#max_items + " < " + this.u4));

            if (!this.#chs && !(this.#chs = this.#chs_ref.deref()) || this.#chs.length < this.u4) this.#chs_ref = new WeakRef<Uint16Array>(this.#chs = new Uint16Array(this.u4));

            this.#max_items = this.u4;//store string length into the max_items
            this.u4_ = 0;//index into output chrs array

            return this.#getting_string();
        }

        #decoder = new TextDecoder("utf-16")

        #getting_string(): boolean {

            while (this.u4_ < this.#max_items) {
                this.u4 = 0
                this.bytes_left = 0

                if (this.#varint()) this.#chs! [this.u4_++] = this.u4;
                else
                    return false;
            }
            this.str = this.#decoder.decode(this.#chs!.subarray(0, this.#max_items))
            return true;
        }

//#endregion


        get_bytes<DST extends Receiver.BytesDst>(dst: DST): DST {
            this.slot.state = 0
            dst.__put_bytes(this);
            return dst
        }

        try_get_bytes<DST extends Receiver.BytesDst>(dst: DST, next_case: number): DST | undefined {
            const s = this.slot!;
            (this.slot = s.next ??= new Receiver.Slot(this, s)).dst = dst;
            this.slot.state = 0
            this.u4_ = 0;
            this.u8_ = 0n;
            if (dst.__put_bytes(this)) {
                this.slot = s;
                return dst
            }

            s.state = next_case

            return undefined
        }

// region dims
        public dims: number[] = [];

        public dim(max: number, bytes: number): number {
            const dim = this.get4_(bytes);
            if (max < dim) {
                AdHoc.Receiver.error_handler(this, AdHoc.Receiver.OnError.OVERFLOW, Error("In dim(max: number, bytes: number): number{}  max < dim : " + max + " < " + dim));
                return 0;
            }

            this.dims.push(dim)
            return dim;
        }

        public length(max: number, bytes: number): number {
            const len = this.get4_(bytes);
            if (max < len) {
                AdHoc.Receiver.error_handler(this, AdHoc.Receiver.OnError.OVERFLOW, Error("In length(max: number, bytes: number): number{} max < len : " + max + " < " + len));
                return 0;
            }
            return len;
        }

// endregion

        toString(this: Receiver): string {
            let str = "Receiver\n";
            if (!this.slot) return str + " slot === undefined";
            let s = this.slot!;
            while (s.prev) s = s.prev;
            for (let i = 0; ; i++) {
                for (let ii = i; 0 < ii; ii--) str += "\t";
                str += `${Object.prototype.toString.call(s.dst)}\t${s.state}\t${s["index0"]}\t${s["index1"]}\t${s["index2"]} \n`;
                if (s === this.slot) break;
                s = s.next!;
            }
            return str;
        }

        tmp = new DataView(new ArrayBuffer(16));        //tmp storage
    }

    export namespace Receiver {
        export interface BytesDst {
            __put_bytes(src: Receiver): boolean;

            get __id(): number;
        }

        export interface EventsHandler {
            on_receiving(src: Receiver, dst: BytesDst): void;

            on_received(src: Receiver, dst: BytesDst): void;
        }


        export function zig_zag(src: number): number { return -(src & 1) ^ src >>> 1; }

        export function zig_zag4(src: number): number {
            return src < 0x8000_0000 ? //here the `src` is positive only
                   -(src & 1) ^ src >>> 1 :
                   p.set(src).and(q.set(1)).neg().xor(q.set(src).shru(1)).get()

        }

        export function zig_zag8(src: bigint): bigint { return -(src & 1n) ^ src >> 1n; }

        export let error_handler: OnError.Handler =
            (src: AdHoc.BytesDst, error_id: number, err?: Error) => {
                switch (error_id) {
                    case OnError.OVERFLOW:
                        throw new Error("OVERFLOW at " + src + !err ?
                                        "" :
                                        err! + err!.stack!)
                    case OnError.INVALID_ID:
                        throw new Error("INVALID_ID at " + src + !err ?
                                        "" :
                                        err! + err!.stack!)
                }
            }
        export let error_handler_: OnError.Handler_ =
            (src: AdHoc.BytesSrc, error_id: number, err?: Error) => {
                switch (error_id) {
                    case OnError.OVERFLOW:
                        throw new Error("OVERFLOW at " + src + !err ?
                                        "" :
                                        err! + err!.stack!)
                    case OnError.INVALID_ID:
                        throw new Error("INVALID_ID at " + src + !err ?
                                        "" :
                                        err! + err!.stack!)
                }
            }

        export namespace OnError {
            export const OVERFLOW = 0
            export const INVALID_ID = 1
            export type Handler = (dst: AdHoc.BytesDst, error_id: number, err?: Error) => void
            export type Handler_ = (src: AdHoc.BytesSrc, error_id: number, err?: Error) => void
        }

        export class Cache extends DataView {

            public readonly dst: AdHoc.Receiver;
            public tail: DataView | undefined;

            constructor(dst: AdHoc.Receiver) {
                super(new ArrayBuffer(16));
                this.dst = dst;
            }

            #bytes = 0
            #byte = 0

            public reset() {
                this.#bytes = 0
                this.#byte = 0
                this.tail = undefined
            }

            public complete(): boolean {
                if (!this.#bytes) return true

                if (this.dst.byte_max - this.dst.byte < this.#bytes - this.#byte) {
                    for (let max = this.dst.byte_max - this.dst.byte; this.#byte < max;) //just store available bytes
                        this.setUint8(this.#byte++, this.dst.buffer!.getUint8(this.dst.byte++))
                    return false
                }

                this.dst.byte = this.#bytes = -this.#byte
                this.tail = this.dst.buffer
                this.dst.buffer = this;//flip storage
                return true
            }

            public try_get(bytes: number): boolean {
                if (0 < this.#bytes) return this.complete()

                const available = this.dst.byte_max - this.dst.byte

                if (!available) return false;
                if (bytes <= available) return true;

                this.#byte = 0
                this.#bytes = bytes
                while (this.#byte < available) this.setUint8(this.#byte++, this.dst.buffer!.getUint8(this.dst.byte++))
                return false
            }

            public touch(byte: number): number {return super.getUint8(byte);}

            getInt8(byte: number): number {return super.getInt8(this.#read_from(byte, 1));}

            getUint8(byte: number): number {return super.getUint8(this.#read_from(byte, 1));}

            getInt16(byte: number, littleEndian ?: boolean): number {return super.getInt16(this.#read_from(byte, 2), littleEndian);}

            getUint16(byte: number, littleEndian ?: boolean): number {return super.getUint16(this.#read_from(byte, 2), littleEndian);}

            getInt32(byte: number, littleEndian ?: boolean): number {return super.getInt32(this.#read_from(byte, 4), littleEndian);}

            getUint32(byte: number, littleEndian ?: boolean): number {return super.getUint32(this.#read_from(byte, 4), littleEndian);}

            getBigInt64(byte: number, littleEndian ?: boolean): bigint {return super.getBigInt64(this.#read_from(byte, 8), littleEndian);}

            getBigUint64(byte: number, littleEndian ?: boolean): bigint {return super.getBigUint64(this.#read_from(byte, 8), littleEndian);}

            getFloat32(byte: number, littleEndian ?: boolean): number {return super.getFloat32(this.#read_from(byte, 4), littleEndian);}

            getFloat64(byte: number, littleEndian ?: boolean): number {return super.getFloat64(this.#read_from(byte, 8), littleEndian);}

            #read_from(byte: number, bytes: number): number {
                if (bytes < -byte) return byte - this.#bytes;

                byte = byte - this.#bytes

                for (let read = 0, write = -this.#bytes, write_max = byte + bytes; write < write_max;)
                    this.setUint8(write++, this.tail!.getUint8(read++))

                this.#bytes = 0;//mark not in use
                this.dst.buffer = this.tail
                this.tail = undefined

                return byte
            }
        }

        //#region Slot
        export class Slot extends Context.Receiver.Slot {
            dst: BytesDst | undefined;
            fields_nulls: number;

            get_bytes<DST extends Receiver.BytesDst>(dst: DST): DST { return <DST>this.next!.dst}

            next: Slot | undefined;
            readonly prev: Slot | undefined;

            constructor(dst: Receiver, prev: Slot | undefined) {
                super(dst, undefined);
                this.prev = prev;
                if (prev !== undefined) {
                    prev.next = this;
                }
            }
        }

//#endregion


    }

    export abstract class Transmitter extends Context.Transmitter implements AdHoc.BytesSrc {

        handler: AdHoc.Transmitter.EventsHandler;

        exchange(handler: AdHoc.Transmitter.EventsHandler): AdHoc.Transmitter.EventsHandler | undefined {
            const tmp = this.handler;
            this.handler = handler;
            return tmp;
        }

//#region value pack transfer

        pull4() { this.u4 = <number>this.#sending_values.shift()!}

        pull8() { this.u8 = <bigint>this.#sending_values.shift()!}

        put_bytes8_(src: bigint, handler: Transmitter.BytesSrc, next_case: number): boolean {
            this.u8 = src
            return this.put_bytes_(handler, next_case)
        }

        put_bytes8(src: bigint, handler: Transmitter.BytesSrc) {
            this.u8 = src
            return this.put_bytes(handler)
        }

        put_bytes4_(src: number, handler: Transmitter.BytesSrc, next_case: number): boolean {
            this.u4 = src
            return this.put_bytes_(handler, next_case)
        }

        put_bytes4(src: number, handler: Transmitter.BytesSrc) {
            this.u4 = src
            return this.put_bytes(handler)
        }

//#endregion

        put_bytes(src: Transmitter.BytesSrc) {

            this.slot.state = 1 //skip write id
            src.__get_bytes(this)
        }

        put_bytes_(src: Transmitter.BytesSrc, next_case: number): boolean {

            const s = this.slot!;

            (this.slot = s.next ??= new Transmitter.Slot(this, s)).src = src;
            this.slot.state = 1 //skip write id

            if (src.__get_bytes(this)) {
                this.slot = s;
                return true
            }

            s.state = next_case
            return false
        }


        constructor(handler: AdHoc.Transmitter.EventsHandler | undefined) {
            super();
            this.handler = handler!;
        }

        subscriber: (src: AdHoc.BytesSrc) => void;

        subscribe_on_new_bytes_to_transmit_arrive(subscriber: (BytesSrc) => void): (BytesSrc) => void {
            const tmp = this.subscriber;
            if ((this.subscriber = subscriber) && 0 < this.#sending.length) subscriber(this);
            return tmp;
        }

//#region sending

        #sending: Array<Transmitter.BytesSrc> = new Array<Transmitter.BytesSrc>();
        #sending_values: Array<bigint | number | boolean | undefined> = new Array<bigint | number | boolean | undefined>();

        protected send(src: Transmitter.BytesSrc) {
            this.#sending.push(src);
            if (this.subscriber) this.subscriber(this);
        }


        protected send_value(src: Transmitter.BytesSrc, value: bigint | number | boolean | undefined) {
            this.#sending.push(src);
            this.#sending_values.push(value);
            if (this.subscriber) this.subscriber(this);
        }

//#endregion


        get position(): number { return this.byte; }

        get remaining(): number { return this.byte_max - this.byte; }


//#region nulls

        public init_fields_nulls(field0_bit: number, this_case: number): boolean {
            if (!this.allocate(1, this_case)) return false;
            this.slot!.fields_nulls = field0_bit;
            return true;
        }

        public set_fields_nulls(field: number) {this.slot!.fields_nulls |= field;}

        public flush_fields_nulls() {this.buffer!.setUint8(this.byte++, this.slot!.fields_nulls);}

        public is_null(field: number, next_field_case: number) {
            if (!(this.slot!.fields_nulls & field)) {
                this.slot.state = next_field_case;
                return true;
            }
            return false;
        }

//#endregion

//#region Slot

        slot: Transmitter.Slot;

        get isOpen(): boolean { return this.slot !== undefined; }

        slot_ref = new WeakRef(new Transmitter.Slot(this, undefined));

        close(): void { this.reset();}

        reset(): void {
            if (!this.slot) return;

            for (let s: Transmitter.Slot | undefined = this.slot; s != undefined; s = s.next) s.src = undefined!;
            this.slot = undefined!;
            this.#sending.length = 0;
            this.#sending_values.length = 0;
            this.buffer = undefined;
            this.mode = OK;
            this.bytes_left = 0;
            this.u4 = 0;
            this.u8 = 0n;
            this.str = undefined;
        }

//#endregion

        //
        // if 0 < return - bytes read
        // if return == 0 - not enough space available
        // if return == -1 -  no more packets left
        read(dst: DataView, byte: number, bytes: number): number {

            this.byte = byte;
            this.byte_max = this.byte + bytes;

            if (this.byte_max - this.byte < 1) return 0;

            this.buffer = dst;
            const position = this.byte;
            read:
                for (; ;) {
                    if (this.slot && this.slot.src)
                        switch (this.mode)     //restore transition state
                        {
                            case STR:
                                if (!this.#varint(this.u4_)) break read;

                                if (this.bytes_left == -1) this.bytes_left = 0;//now ready getting string

                                while (this.bytes_left < this.str!.length)
                                    if (!this.#varint(this.str!.charCodeAt(this.bytes_left++))) break read;

                                this.str = undefined;
                                break;
                            case VAL:
                                do {
                                    this.buffer.setUint8(this.byte++, this.tmp.getUint8(this.bytes_left++))
                                    if (this.byte === this.byte_max) break read;
                                } while (this.bytes_left < this.tmp_bytes);
                                break;
                            case BITS_BYTES:
                                if (this.byte_max - this.byte < this.#bits_transaction_bytes_) break read;    //space for one full transaction
                                this.#bits_byte = this.byte;//preserve space for bits info
                                this.byte++;
                                for (let i = 0; i < this.bytes_left; i++)
                                    this.buffer?.setUint8(this.byte++, this.tmp.getUint8(i))
                                break;
                            case BITS_BYTES4:
                                if (this.byte_max - this.byte < this.#bits_transaction_bytes_) break read;    //space for one full transaction
                                this.#bits_byte = this.byte;//preserve space for bits info
                                this.byte++;
                                this.put_4(this.u4_, this.bytes_left)
                                break;
                            case BITS_BYTES8:
                                if (this.byte_max - this.byte < this.#bits_transaction_bytes_) break read;    //space for one full transaction
                                this.#bits_byte = this.byte;//preserve space for bits info
                                this.byte++;
                                this.put_8(this.u8, this.bytes_left)
                                break;
                            case VARINT4:
                                if (this.put_varint4(this.u4_, this.slot.state)) break;
                                break read;
                            case VARINT8:
                                if (this.put_varint8(this.u8_, this.slot.state)) break;
                                break read;
                            case BITS:
                                if (this.byte_max - this.byte < this.#bits_transaction_bytes_) break read;//space for one full transaction
                                this.#bits_byte = this.byte;//preserve space for bits info
                                this.byte = this.#bits_byte + 1;
                                break;
                        }
                    else {
                        const src = this.#sending.shift()!
                        if (!src) {
                            this.reset();
                            break
                        }

                        if (!this.slot) if (!(this.slot = this.slot_ref!.deref()!)) this.slot_ref = new WeakRef(this.slot = new Transmitter.Slot(this, undefined));

                        this.slot.src = src;
                        this.slot.state = 0; //write id request
                        this.u4 = 0;
                        this.bytes_left = 0;
                        this.handler!.on_sending(this, src);
                        if (this.slot == undefined) return -1;	//sending event handler has close this
                    }

                    this.mode = OK;
                    for (; ;)
                        if (!this.slot!.src!.__get_bytes(this)) break read;
                        else {


                            if (this.slot!.prev) this.slot = this.slot!.prev;
                            else break;
                        }

                    this.handler!.on_sent(this, this.slot.src!);
                    if (this.slot == undefined) return -1;	//sent event handler has close this
                    this.slot!.src = undefined!; //data request label of the next packet
                }//read:

            this.buffer = undefined;

            return 0 < this.byte - position ?
                   this.byte - position :
                   -1;
        }


        public put_bool(src: any) {
            this.put_bits(src ?
                          1 :
                          0, 1);
        }

        public put_bool_(src: any, next_case: number): boolean {
            return this.put_byte_(src ?
                                  1 :
                                  0, next_case);
        }

        public put_booL(src: number) {
            this.put_bits(src == undefined ?
                          2 :
                          src ?
                          1 :
                          0, 2);
        }

        public put_booL_(src: number, next_case: number): boolean {
            return this.put_byte_(src == undefined ?
                                  2 :
                                  src ?
                                  1 :
                                  0, next_case);
        }


        public allocate(bytes: number, this_case: number): boolean {
            this.slot!.state = this_case;//!! set always? and first. used to skip pack.id step in get_bytes of value packs
            if (bytes <= this.remaining) return true;
            this.mode = RETRY;
            return false;
        }

//#region bits

        #bits_byte = -1;
        #bits_transaction_bytes_ = 0

        public init_bits_(transaction_bytes: number, this_case: number): boolean {
            if ((this.#bits_transaction_bytes_ = transaction_bytes) <= this.remaining) return true;

            this.slot.state = this_case;
            this.byte = this.#bits_byte;//trim byte at bits_byte index

            this.mode = BITS;
            return false;
        }


        public init_bits(transaction_bytes: number, this_case: number): boolean {
            if (this.byte_max - this.byte < (this.#bits_transaction_bytes_ = transaction_bytes)) {
                this.slot!.state = this_case;
                this.mode = RETRY;
                return false;
            }

            this.bits = 0;
            this.bit = 0;

            this.#bits_byte = this.byte++;//allocate space
            return true;
        }

        public put_bits(src: number, len_bits: number): void {
            this.bits |= src << this.bit;
            if ((this.bit += len_bits) < 9) return;     //exactly 9! not 8! to avoid allocating the next byte after the current one is full. what might be redundant

            this.buffer!.setUint8(this.#bits_byte, this.bits);

            this.bits >>= 8;
            this.bit -= 8;

            this.#bits_byte = this.byte++;
        }

        public put_bits_(src: number, len_bits: number, continue_at_case: number): boolean {
            this.bits |= src << this.bit;
            if ((this.bit += len_bits) < 9) return true;     //exactly 9! not 8! to avoid allocating the next byte after the current one is full. what might be redundant

            this.buffer!.setUint8(this.#bits_byte, this.bits);

            this.bits >>= 8;
            this.bit -= 8;
            if (this.remaining < this.#bits_transaction_bytes_) {
                this.slot.state = continue_at_case;
                return false;
            }
            this.#bits_byte = this.byte++;
            return true;
        }

        public end_bits() {
            if (0 < this.bit) this.buffer!.setUint8(this.#bits_byte, this.bits);
            else this.byte = this.#bits_byte;//trim byte at bits_byte index isolated but not used
        }

        public put_nulls(nulls: number, nulls_bits: number, continue_at_case: number): boolean {
            if (this.put_bits_(nulls, nulls_bits, continue_at_case)) return true;

            this.mode = BITS;
            return false;
        }

        public continue_bits_at(continue_at_case: number) {
            this.slot.state = continue_at_case;
            this.byte = this.#bits_byte;//trim byte at bits_byte index
            this.mode = BITS;
        }

//#endregion

        public put_bits_bytes4(info: number, info_bits: number, value: number, value_bytes: number, continue_at_case: number): boolean {

            if (this.put_bits_(info, info_bits, continue_at_case)) {
                this.put_4(value, value_bytes)
                return true;
            }

            this.u4_ = value;
            this.bytes_left = value_bytes;
            this.slot.state = continue_at_case;
            this.mode = BITS_BYTES4;
            return false;
        }

        public put_bits_bytes(info: number, info_bits: number, value: Transmitter.BytesSrc, value_bytes: number, continue_at_case: number): boolean {

            if (this.put_bits_(info, info_bits, continue_at_case)) {
                this.put_bytes_(value, continue_at_case);
                return true;
            }

            if (Transmitter.tmp.slot === undefined) Transmitter.tmp.slot = new Transmitter.Slot(Transmitter.tmp, undefined);
            Transmitter.tmp.slot.state = 1
            Transmitter.tmp.byte = 0
            Transmitter.tmp.byte_max = this.tmp.byteLength
            Transmitter.tmp.buffer = this.tmp;

            value.__get_bytes(Transmitter.tmp);

            this.bytes_left = value_bytes;
            this.slot.state = continue_at_case;
            this.mode = BITS_BYTES;
            return false;
        }

        public put_bits_bytes8(info: number, info_bits: number, value: bigint, value_bytes: number, continue_at_case: number): boolean {

            if (this.put_bits_(info, info_bits, continue_at_case)) {
                this.put_8(value, value_bytes)
                return true;
            }

            this.u8 = value;
            this.bytes_left = value_bytes;
            this.slot.state = continue_at_case;
            this.mode = BITS_BYTES8;
            return false;
        }


//#region varint
        #bytes1(src: number): number {
            return src < 0x100 ?
                   1 :
                   2;
        }

        public put_varint21(src: number, continue_at_case: number) {
            const bytes = this.#bytes1(src);
            return this.put_bits_bytes4(bytes - 1, 1, src, bytes, continue_at_case);
        }

        public put_varint21_(src: number, continue_at_case: number, nulls: number, nulls_bits: number) {
            const bytes = this.#bytes1(src);
            return this.put_bits_bytes4(bytes - 1 << nulls_bits | nulls, nulls_bits + 1, src, bytes, continue_at_case);
        }


        #bytes2(src: number) {
            return src < 0x100 ?
                   1 :
                   src < 0x1_0000 ?
                   2 :
                   3;
        }

        public put_varint32(src: number, continue_at_case: number) {
            const bytes = this.#bytes2(src);
            return this.put_bits_bytes4(bytes, 2, src, bytes, continue_at_case);
        }

        public put_varint32_(src: number, continue_at_case: number, nulls: number, nulls_bits: number) {
            const bytes = this.#bytes2(src);
            return this.put_bits_bytes4(bytes << nulls_bits | nulls, nulls_bits + 2, src, bytes, continue_at_case);
        }


        #bytes3(src: number) {
            return src < 0x1_0000 ?
                   src < 0x100 ?
                   1 :
                   2 :
                   src < 0x100_0000 ?
                   3 :
                   4;
        }

        public put_varint42(src: number, continue_at_case: number) {
            const bytes = this.#bytes3(src);
            return this.put_bits_bytes4(bytes - 1, 2, src, bytes, continue_at_case);
        }

        public put_varint42_(src: number, continue_at_case: number, nulls: number, nulls_bits: number) {
            const bytes = this.#bytes3(src);
            return this.put_bits_bytes4(bytes - 1 << nulls_bits | nulls, nulls_bits + 2, src, bytes, continue_at_case);
        }


        #bytes4(src: number) {
            return src < 0x100_0000 ?
                   src < 0x1_0000 ?
                   src < 0x100 ?
                   1 :
                   2 :
                   3 :
                   src < 0x1_0000_0000 ?
                   4 :
                   src < 0x100_0000_0000 ?
                   5 :
                   src < 0x1_0000_0000_0000n ?
                   6 :
                   7;
        }

        public put_varint73(src: number, continue_at_case: number): boolean {
            const bytes = this.#bytes4(src);
            return this.put_bits_bytes4(bytes, 3, src, bytes, continue_at_case);
        }

        public put_varint73_(src: number, continue_at_case: number, nulls: number, nulls_bits: number): boolean {
            const bytes = this.#bytes4(src);
            return this.put_bits_bytes4(bytes << nulls_bits | nulls, nulls_bits + 3, src, bytes, continue_at_case);
        }

        #bytes4n(src: bigint) {
            return src < 0x100_0000 ?
                   src < 0x1_0000 ?
                   src < 0x100 ?
                   1 :
                   2 :
                   3 :
                   src < 0x1_0000_0000 ?
                   4 :
                   src < 0x100_0000_0000 ?
                   5 :
                   src < 0x1_0000_0000_0000n ?
                   6 :
                   7;
        }

        public put_varint73n(src: bigint, continue_at_case: number): boolean {
            const bytes = this.#bytes4n(src);
            return this.put_bits_bytes8(bytes, 3, src, bytes, continue_at_case);
        }

        public put_varint73n_(src: bigint, continue_at_case: number, nulls: number, nulls_bits: number): boolean {
            const bytes = this.#bytes4n(src);
            return this.put_bits_bytes8(bytes << nulls_bits | nulls, nulls_bits + 3, src, bytes, continue_at_case);
        }

        #bytes5(src: bigint): number {
            return src < 0 ?
                   8 :
                   src < 0x1_0000_0000 ?
                   src < 0x1_0000 ?
                   src < 0x100 ?
                   1 :
                   2 :
                   src < 0x100_0000 ?
                   3 :
                   4 :
                   src < 0x1_0000_0000_0000n ?
                   src < 0x100_0000_0000 ?
                   5 :
                   6 :
                   src < 0x100_0000_0000_0000n ?
                   7 :
                   8;
        }


        public put_varint83(src: bigint, continue_at_case: number): boolean {
            const bytes = this.#bytes5(src);
            return this.put_bits_bytes8(bytes - 1, 3, src, bytes, continue_at_case);
        }

        public put_varint83_(src: bigint, continue_at_case: number, nulls: number, nulls_bits: number): boolean {
            const bytes = this.#bytes5(src);
            return this.put_bits_bytes8(bytes - 1 << nulls_bits | nulls, nulls_bits + 3, src, bytes, continue_at_case);
        }

        public put_varint84(src: bigint, continue_at_case: number): boolean {
            const bytes = this.#bytes5(src);
            return this.put_bits_bytes8(bytes, 4, src, bytes, continue_at_case);
        }

        public put_varint84_(src: bigint, continue_at_case: number, nulls: number, nulls_bits: number): boolean {
            const bytes = this.#bytes5(src);
            return this.put_bits_bytes8(bytes << nulls_bits | nulls, nulls_bits + 4, src, bytes, continue_at_case);
        }


        // src - has value is in 0 to  Number.MAX_SAFE_INTEGER	range
        public put_varint4(src: number, next_case): boolean {

            while (this.byte < this.byte_max) {

                if (src < 0x80) {
                    this.buffer!.setUint8(this.byte++, src);
                    return true;
                }

                this.buffer!.setUint8(this.byte++, 0x80 | src);

                if (src < 0xFFFF_FFFF)
                    src >>>= 7;
                else
                    src = p.set(src).shru(7).get();
            }

            this.u4_ = src;
            this.slot.state = next_case;
            this.mode = VARINT4;
            return false;
        }


        public put_varint8(src: bigint, next_case): boolean {
            if (src < Number.MAX_SAFE_INTEGER) return this.put_varint4(Number(src), next_case);

            // very, very rarely visited place
            while (this.byte < this.byte_max) {
                if (src < 0x80) {
                    this.buffer!.setUint8(this.byte++, Number(src));
                    return true;
                }
                this.buffer!.setUint8(this.byte++, Number(0x80n | src & 0x7Fn));
                src >>= 7n;
            }

            this.u8_ = src;
            this.slot.state = next_case;
            this.mode = VARINT8;
            return false;
        }

//#endregion

//#region string

        public put_string(src: string, next_case: number) {

            put:
            {
                this.bytes_left = -1;//before getting string length mark
                if (!this.#varint(src.length)) break put;
                this.bytes_left = 0;//ready to receive the string

                while (this.bytes_left < src.length)
                    if (!this.#varint(src.charCodeAt(this.bytes_left++))) break put;

                return true;
            }

            this.slot!.state = next_case;
            this.str = src;
            this.mode = STR;
            return false;
        }

        #varint(src: number): boolean {

            for (; this.byte < this.byte_max; this.buffer!.setUint8(this.byte++, 0x80 | src), src >>>= 7)
                if (src < 0x80) {
                    this.buffer!.setUint8(this.byte++, src);
                    return true;
                }

            this.u4_ = src;
            return false;
        }

//#endregion


        public retry_at(the_case) {
            this.slot!.state = the_case;
            this.mode = RETRY;
        }


        public bytes4value(value) {
            return value < 0xFFFF ?
                   value < 0xFF ?
                   value == 0 ?
                   0 :
                   1 :
                   2 :
                   value < 0xFFFFFF ?
                   3 :
                   4;
        }

        public put_sbyte_(src: number, next_case: number) {
            if (this.byte < this.byte_max) {
                this.buffer!.setInt8(this.byte++, src);
                return true;
            }
            this.tmp.setInt8(0, src);
            this.#tmp_to_buffer(1, next_case);
            return false;
        }

        public put_sbyte(src: number) {this.buffer!.setInt8(this.byte++, src);}

        public put_byte_(src: number, next_case: number): boolean {
            if (this.byte < this.byte_max) {
                this.buffer!.setUint8(this.byte++, src);
                return true;
            }
            this.tmp.setUint8(0, src);
            this.#tmp_to_buffer(1, next_case);
            return false;
        }

        public put_byte(src: number): boolean {
            this.buffer!.setUint8(this.byte++, src);
            return true;
        }

        public put_short_(src: number, next_case: number) {
            if (this.byte_max - this.byte < 2) {
                this.tmp.setInt16(0, src, true);
                this.#tmp_to_buffer(2, next_case);
                return false;
            }
            this.buffer!.setInt16(this.byte, src, true);
            this.byte += 2;
            return true;
        }

        public put_short(src: number) {
            this.buffer!.setInt16(this.byte, src, true);
            this.byte += 2;
        }

        public put_char_(src: number, next_case: number) {
            if (this.byte_max - this.byte < 2) {
                this.tmp.setUint16(0, src, true);
                this.#tmp_to_buffer(2, next_case);
                return false;
            }
            this.buffer!.setUint16(this.byte, src, true);
            this.byte += 2;
            return true;
        }

        public put_char(src: number) {
            this.buffer!.setUint16(this.byte, src, true);
            this.byte += 2;
        }

        public put_ushort_(src: number, next_case: number) {
            if (this.byte_max - this.byte < 2) {
                this.tmp.setUint16(0, src, true);
                this.#tmp_to_buffer(2, next_case);
                return false;
            }
            this.buffer!.setUint16(this.byte, src, true);
            this.byte += 2;
            return true;
        }

        public put_ushort(src: number) {
            this.buffer!.setUint16(this.byte, src, true);
            this.byte += 2;
        }

        public put_int_(src: number, next_case: number) {
            if (this.byte_max - this.byte < 4) {
                this.tmp.setInt32(0, src, true);
                this.#tmp_to_buffer(4, next_case);
                return false;
            }
            this.buffer!.setInt32(this.byte, src, true);
            this.byte += 4;
            return true;
        }

        public put_int(src: number) {
            this.buffer!.setInt32(this.byte, src, true);
            this.byte += 4;
        }

        public put_uint_(src: number, next_case: number) {
            if (this.byte_max - this.byte < 4) {
                this.tmp.setUint32(0, src, true);
                this.#tmp_to_buffer(4, next_case);
                return false;
            }
            this.buffer!.setUint32(this.byte, src, true);
            this.byte += 4;
            return true;
        }

        public put_uint(src: number) {
            this.buffer!.setUint32(this.byte, src, true);
            this.byte += 4;
        }

        public put_4_(src: number, bytes: number, next_case: number): boolean {
            if (this.byte_max - this.byte < bytes) {
                this.#put(src, this.tmp, 0, bytes);
                this.#tmp_to_buffer(bytes, next_case);
                return false;
            }

            this.put_4(src, bytes);
            return true;
        }


        public put_4(src: number, bytes: number) {
            this.#put(src, this.buffer!, this.byte, bytes)
            this.byte += bytes;
        }

        #put(src: number, dst: DataView, byte: number, bytes: number) {//less 53 bits of data
            switch (bytes) {
                case 7:
                    dst.setUint32(byte, src, true);
                    dst.setUint16(byte + 4, src / 0x1_0000_0000 | 0, true);
                    dst.setUint8(byte + 6, src / 0x1_0000_0000_0000 | 0);
                    return;
                case 6:
                    dst.setUint32(byte, src, true);
                    dst.setUint16(byte + 4, src / 0x1_0000_0000 | 0, true);
                    return;
                case 5:
                    dst.setUint32(byte, src, true);
                    dst.setUint8(byte + 4, src / 0x1_0000_0000 | 0);
                    return;
                case 4:
                    dst.setUint32(byte, src, true);
                    return;
                case 3:
                    dst.setUint16(byte, src, true);
                    dst.setUint8(byte + 2, src >>> 16);
                    return;
                case 2:
                    dst.setUint16(byte, src, true);
                    return;
                case 1:
                    dst.setUint8(byte, src);
                    return;
            }
        }

        public put_long_(src: bigint, next_case: number) {
            if (this.byte_max - this.byte < 8) {
                this.tmp.setBigInt64(0, src, true);
                this.#tmp_to_buffer(8, next_case);
                return false;
            }
            this.buffer!.setBigInt64(this.byte, src, true);
            this.byte += 8;
            return true;
        }

        public put_long(src: bigint) {
            this.buffer!.setBigInt64(this.byte, src, true);
            this.byte += 8;
        }

        public put_ulong_(src: bigint, next_case: number) {
            if (this.byte_max - this.byte < 8) {
                this.tmp.setBigUint64(0, src, true);
                this.#tmp_to_buffer(8, next_case);
                return false;
            }
            this.buffer!.setBigUint64(this.byte, src, true);
            this.byte += 8;
            return true;
        }

        public put_ulong(src: bigint) {
            this.buffer!.setBigUint64(this.byte, src, true);
            this.byte += 8;
        }

        public put_float_(src: number, next_case) {
            if (this.byte_max - this.byte < 4) {
                this.tmp.setFloat32(0, src, true);
                this.#tmp_to_buffer(4, next_case);
                return false;
            }
            this.buffer!.setFloat32(this.byte, src, true);
            this.byte += 4;
            return true;
        }

        public put_float(src: number) {
            this.buffer!.setFloat32(this.byte, src, true);
            this.byte += 4;
        }

        public put_double_(src: number, next_case) {
            if (this.byte_max - this.byte < 8) {
                this.tmp.setFloat64(0, src, true);
                this.#tmp_to_buffer(8, next_case);
                return false;
            }
            this.buffer!.setFloat64(this.byte, src, true);
            this.byte += 8;
            return true;
        }

        public put_double(src: number) {
            this.buffer!.setFloat64(this.byte, src, true);
            this.byte += 8;
        }

        public put_8_(src: bigint, bytes: number, next_case: number) {
            if (bytes <= this.byte_max - this.byte) return this.put_8(src, bytes);

            this.tmp.setBigUint64(0, src, true);
            this.#tmp_to_buffer(bytes, next_case);
            return false;
        }

        public put_8(src: bigint, bytes: number) {
            this.buffer!.setBigUint64(this.byte, src, true);
            this.byte += bytes;
        }

        #tmp_to_buffer(bytes: number, next_case: number) {
            this.slot!.state = next_case;
            this.bytes_left = this.byte_max - this.byte;
            this.tmp_bytes = bytes;

            for (let i = 0; this.byte < this.byte_max;) this.buffer!.setUint8(this.byte++, this.tmp.getUint8(i++));
            this.mode = VAL;
        }

        get root(): Transmitter.BytesSrc | undefined {
            let s = this.slot!;
            while (s.prev) s = s.prev;
            return s.src
        }

        toString(this: Transmitter): string {

            let str = "Transmitter\n";
            if (!this.slot) return str + " slot === undefined";
            let s = this.slot!;

            while (s.prev) s = s.prev;
            for (let i = 0; ; i++) {
                for (let ii = i; 0 < ii; ii--) str += "\t";
                str += `${Object.prototype.toString.call(s.src)}}\t${s.state}\t${s["index0"]}\t${s["index1"]}\t${s["index2"]} \n`;
                if (s === this.slot) break;
                s = s.next!;
            }
            return str;
        }

        hi(value: bigint): number {
            this.tmp.setBigUint64(0, value, true)
            return this.tmp.getUint32(0)
        }

        lo(): number {return this.tmp.getUint32(4)}

        tmp = new DataView(new ArrayBuffer(16));        //tmp storage
    }

    export namespace Transmitter {
        export interface BytesSrc {
            __get_bytes(dst: Transmitter): boolean;

            get __id(): number;
        }

        export interface EventsHandler {
            on_sending(dst: Transmitter, src: BytesSrc): void;

            on_sent(dst: Transmitter, src: BytesSrc): void;
        }

        export function zig_zag(src: number, bits: number): number {return (src << 1 ^ src >> bits) >>> 0;}//here src is signed !!

        export function zig_zag4(src: number, bits: number) { //here src is signed !!
            return src < -2147483648 || 2147483647 < src || 31 < bits ?
                   p.set(src).shl(1).xor(q.set(src).shr(bits)).get() :
                   (src << 1 ^ src >> bits) >>> 0
        }

        export function zig_zag8(src: bigint, bits: bigint): bigint {return src << 1n ^ src >> bits;}//here src is signed !!

//#region Slot
        export class Slot extends Context.Transmitter.Slot {
            src: BytesSrc;
            fields_nulls: number;
            next: Slot | undefined;
            readonly prev: Slot;

            constructor(src: Transmitter, prev: Slot | undefined) {
                super(src, undefined);
                this.prev = prev!;
                if (prev !== undefined) {
                    prev.next = this;
                }
            }
        }

//#endregion
        class Tmp extends Transmitter {}

        export const tmp = new Tmp(undefined);
    }

    export function equals_floats(a: number | undefined, b: number | undefined) { return a === b || a !== undefined && b !== undefined && Math.fround(a) === Math.fround(b); }

    export function equals_strings(a: string | undefined, b: string | undefined) { return a === b || a !== undefined && b !== undefined && a.normalize() === b.normalize(); }

    export function equals_strings_arrays(a1: ArrayLike<string | undefined> | undefined, a2: ArrayLike<string | undefined> | undefined, size ?: number): boolean { return equals_arrays(a1, a2, equals_strings, size);}

    export function equals_arrays<T>(a1: ArrayLike<T> | undefined, a2: ArrayLike<T> | undefined, equals: (v1: T, v2: T) => boolean = Object.is, size ?: number): boolean {
        if (a1 === a2) return true
        if (a1 === undefined || a2 === undefined) return false
        if (size == undefined) {
            if ((size = a1.length) !== a2.length) return false
        } else if (a1.length < size || a2.length < size) return false

        while (-1 < --size)
            if (!equals(a1[size], a2[size])) return false

        return true;
    }

    export function equals_arrays_<T>(aa1: ArrayLike<ArrayLike<T> | undefined> | undefined, aa2: ArrayLike<ArrayLike<T> | undefined> | undefined, equals: (v1: T, v2: T) => boolean, size ?: number): boolean {

        function equals_fn(a1: ArrayLike<T> | undefined, a2: ArrayLike<T> | undefined): boolean {
            if (a1 === a2) return true
            if (a1 === undefined || a2 === undefined || a1.length !== a2.length) return false
            return equals_arrays(a1, a2, equals, a1.length)
        }

        return equals_arrays(aa1, aa2, equals_fn, size)
    }

    export function equals_maps<K, V>(m1: Map<K, V> | undefined, m2: Map<K, V> | undefined, equals: (v1: V, v2: V) => boolean): boolean {
        if (m1 === m2) return true
        if (m1 === undefined || m2 === undefined || m1.size !== m2.size) return false

        for (const [k, v] of m1) {
            if (!m2.has(k)) return false;
            const v1 = m2.get(k);
            if (v !== v1 && (v === undefined || v1 === undefined || !equals(v, v1))) return false
        }

        return true;
    }

    export function equals_maps_<K, V>(am1: ArrayLike<Map<K, V> | undefined> | undefined, am2: ArrayLike<Map<K, V> | undefined> | undefined, equals: (v1: V, v2: V) => boolean, size ?: number): boolean {
        function equals_fn(a1: Map<K, V> | undefined, a2: Map<K, V> | undefined): boolean {
            return equals_maps(a1, a2, equals)
        }

        return equals_arrays(am1, am2, equals_fn, size)
    }


    export function equals_sets<T>(s1: Set<T> | undefined, s2: Set<T> | undefined): boolean {
        if (s1 === s2) return true
        if (s1 === undefined || s2 === undefined || s1.size !== s2.size) return false

        for (const k of s1.keys())
            if (!s2.has(k)) return false;

        return true;
    }

    export function equals_sets_<K>(as1: ArrayLike<Set<K> | undefined> | undefined, as2: ArrayLike<Set<K> | undefined> | undefined, size ?: number): boolean { return equals_arrays(as1, as2, equals_sets, size) }

    export function mix(hash: number, data: number) {
        const h = mixLast(hash, data);
        return Math.imul(h << 13 | h >>> -13, 5) + 0xe6546b64;
    }

    export function mixLast(hash: number, data: number) {
        const h = Math.imul(data, 0xcc9e2d51)
        return Math.imul(hash ^ (h << 15 | h >>> -15), 0x1b873593);
    }

    export function finalizeHash(hash: number, length: number) {
        return avalanche(hash ^ length);
    }

    export function avalanche(size: number) {
        size = Math.imul(size ^ size >>> 16, 0x85ebca6b);
        size = Math.imul(size ^ size >>> 13, 0xc2b2ae35);
        return size ^ size >>> 16;
    }


    export function hash_boolean(hash: number, bool: boolean | undefined) {
        return mix(hash, bool === undefined ?
                         0x1b873593 :
                         bool ?
                         0x42108421 :
                         0x42108420)
    }

    export function hash_booleans_array(hash: number, src: ArrayLike<boolean>, size ?: number): number { return hash_array(hash, src, hash_boolean, size) }


    export function hash_string(hash: number, str: string | undefined) {
        if (!str) return mix(hash, 17163)
        let i = str.length - 1;
        for (; 1 < i; i -= 2) hash = mix(hash, str.charCodeAt(i) << 16 | str.charCodeAt(i + 1));
        if (0 < i) hash = mixLast(hash, str.charCodeAt(0));
        return finalizeHash(hash, str.length);
    }

    export function hash_strings_array(hash: number, src: ArrayLike<string | undefined>, size ?: number): number { return hash_array(hash, src, hash_string, size) }

    export function hash_float(hash: number, n: number | undefined): number {
        return hash_number(hash, n === undefined ?
                                 undefined :
                                 Math.fround(n));
    }

    // Compress arbitrarily large numbers into smi hashes.
    export function hash_number(hash: number, n: number | undefined): number {
        if (!n || n !== n || n === Infinity) return hash;
        let h = n | 0;
        if (h !== n) for (h ^= n * 0xffffffff; n > 0xffffffff; h ^= n) n /= 0xffffffff;
        return mix(hash, h);
    }

    export function hash_numbers_array(hash: number, src: ArrayLike<number>, size ?: number): number { return hash_array(hash, src, hash_number, size) }

    export function hash_bigint(hash: number, n: bigint | undefined) {
        return n === undefined ?
               hash :
               hash_number(hash, Number(n)) + (n < Number.MIN_SAFE_INTEGER || Number.MAX_SAFE_INTEGER < n ?
                                               Number(n >> 32n) :
                                               0)
    }

    export function hash_bigints_array(hash: number, src: ArrayLike<bigint>, size ?: number): number { return hash_array(hash, src, hash_bigint, size) }

    export function hash_bytes(hash: number, data: ArrayLike<number>) {
        let len = data.length, i, k = 0;
        for (i = 0; 3 < len; i += 4, len -= 4) hash = mix(hash, data[i] & 0xFF | (data[i + 1] & 0xFF) << 8 | (data[i + 2] & 0xFF) << 16 | (data[i + 3] & 0xFF) << 24);
        switch (len) {
            case 3:
                k ^= (data[i + 2] & 0xFF) << 16;
            case 2:
                k ^= (data[i + 1] & 0xFF) << 8;
        }
        return finalizeHash(mixLast(hash, k ^ data[i] & 0xFF), data.length);
    }


    //Compute a hash that is symmetric in its arguments - that is a hash
    //where the order of appearance of elements does not matter.
    //This is useful for hashing sets, for example.

    export function hash_map<K, V>(hash: number, src: Map<K, V>, hashK: (hash: number, k: K) => number, hashV: (hash: number, v: V) => number): number {
        let a = 0, b = 0, c = 1;

        for (const [k, v] of src) {
            let h = AdHoc.mix(hash, hashK(hash, k));
            h = AdHoc.mix(h, hashV(hash, v));
            h = AdHoc.finalizeHash(h, 2);
            a += h;
            b ^= h;
            c *= h | 1;
        }
        return AdHoc.finalizeHash(AdHoc.mixLast(AdHoc.mix(AdHoc.mix(hash, a), b), c), src.size);
    }


    export function hash_map_<K, V>(hash: number, src: ArrayLike<Map<K, V> | undefined>, hashK: (hash: number, k: K) => number, hashV: (hash: number, v: V) => number): number {

        function hasher(hash: number, map: Map<K, V>) {return hash_map(hash, map, hashK, hashV)}

        return hash_array(hash, src, hasher, src.length)
    }


    export function hash_set<K>(hash: number, src: Set<K>, hashK: (hash: number, k: K) => number): number {
        let a = 0, b = 0, c = 1;

        for (const k of src) {
            const h = hashK(hash, k);
            a += h;
            b ^= h;
            c *= h | 1;
        }
        return AdHoc.finalizeHash(AdHoc.mixLast(AdHoc.mix(AdHoc.mix(hash, a), b), c), src.size);
    }

    export function hash_set_<K>(hash: number, src: ArrayLike<Set<K> | undefined>, hashK: (hash: number, k: K) => number): number {

        function hasher(hash: number, set: Set<K>) {return hash_set(hash, set, hashK)}

        return hash_array(hash, src, hasher, src.length)
    }


    export function hash_array<V>(hash: number, src: ArrayLike<V>, hashV: (hash: number, v: V) => number, size ?: number): number {

        switch (size ??= src.length) {
            case 0:
                return AdHoc.finalizeHash(hash, 0);
            case 1:
                return AdHoc.finalizeHash(AdHoc.mix(hash, hashV(hash, src[0])), 1);
        }

        const initial = hashV(hash, src[0]);
        let prev = hashV(hash, src[1]);
        const rangeDiff = prev - initial;
        hash = AdHoc.mix(hash, initial);

        for (let i = 2; i < size; ++i) {
            hash = AdHoc.mix(hash, prev);
            const k = hashV(hash, src[i]);
            if (rangeDiff !== k - prev) {
                for (hash = AdHoc.mix(hash, k), ++i; i < size; ++i) hash = AdHoc.mix(hash, hashV(hash, src[i]));
                return AdHoc.finalizeHash(hash, size);
            }
            prev = k;
        }

        return AdHoc.avalanche(AdHoc.mix(AdHoc.mix(hash, rangeDiff), prev));
    }

    export function hash_array_<V>(hash: number, src: ArrayLike<ArrayLike<V> | undefined>, hashV: (hash: number, v: V) => number, size ?: number): number {
        function hasher(hash: number, array: ArrayLike<V> | undefined): number {
            return array ?
                   hash_array(hash, array, hashV, array.length) :
                   0
        }

        return hash_array(hash, src, hasher, size)
    }


    // call once before JSON.stringify()
    export function JSON_EXT() {

        // to overcome...
        //
        // TypeError: Do not know how to serialize a BigInt
        //         at JSON.stringify (<anonymous>)
        //
        // @ts-ignore
        BigInt.prototype.toJSON = function toJson() {
            // @ts-ignore
            return this.toString() + "n";
        };

        // correctly stringify Maps ordered by key
        // @ts-ignore
        Map.prototype.toJSON = function toJson() {
            // @ts-ignore
            return [...this.entries()].sort((A, B) => A[0] > B[0] ?
                                                      1 :
                                                      A[0] === B[0] ?
                                                      0 :
                                                      -1);
        }
    }

    const tmp = new DataView(new ArrayBuffer(16));        //tmp storage

    export function intBitsToFloat(bits: number): number {
        tmp.setUint32(0, bits, true);
        return tmp.getFloat32(0);
    }

    export function floatToIntBits(float: number): number {
        tmp.setFloat32(0, float);
        return tmp.getUint32(0, true);
    }

    /**
     * Calculates the number of bytes required to encode a Uint16Array using varint encoding.
     *
     * @param src The Uint16Array to be encoded.
     * @param src_from The starting index in the array (inclusive). Defaults to 0.
     * @param src_to The ending index in the array (exclusive). Defaults to src.length.
     * @returns The total number of bytes required for varint encoding.
     */
    function varint_bytes(src: Uint16Array, src_from: number = 0, src_to: number = src.length): number {
        let bytes = 0;
        let ch;
        while (src_from < src_to)
            // Determine the number of bytes needed for each character:
            // - 1 byte for ASCII characters (0-127)
            // - 2 bytes for characters between 128 and 16,383
            // - 3 bytes for characters between 16,384 and 65,535
            bytes += (ch = src[src_from++]) < 0x80 ?
                     1 :
                     ch < 0x4000 ?
                     2 :
                     3;

        return bytes;
    }

    /**
     * Counts the number of characters that can be represented by a Uint8Array in varint encoding.
     *
     * @param src The Uint8Array containing varint encoded data.
     * @param src_from The starting index in the array (inclusive). Defaults to 0.
     * @param src_to The ending index in the array (exclusive). Defaults to src.length.
     * @returns The number of characters that can be represented by the input bytes.
     */
    function varint_chars(src: Uint8Array, src_from: number = 0, src_to: number = src.length): number {
        let chars = 0;
        while (src_from < src_to)
            // Increment the character count for each byte that doesn't have
            // its most significant bit set (i.e., value < 128).
            // This indicates the end of a varint-encoded character.
            if (src[src_from++] < 0x80) chars++;

        return chars;
    }

    /**
     * Encodes a portion of a string into a Uint8Array using variable-length integer (varint) encoding.
     *
     * @param src The source string to encode.
     * @param src_from The starting index in the source string to begin encoding.
     * @param dst The destination Uint8Array to store the encoded bytes.
     * @param dst_from The starting index in the destination Uint8Array to begin writing.
     *
     * @returns A number containing two pieces of information:
     * - High 21 bits: The index in the source string of the first character not processed.
     * - Low 32 bits: The number of bytes written to the destination array.
     *
     * To extract these values:
     * - Next character to process: result / 0x100000000 | 0
     * - Bytes written: result | 0
     *
     * @description
     * This function implements a custom varint encoding scheme:
     * - Characters with code points < 128 are encoded as a single byte.
     * - Characters with code points >= 128 and < 4000 are encoded as two bytes.
     * - Characters with code points >= 4000 are encoded as three bytes.
     *
     * The encoding process stops when either:
     * - All characters from the input string have been processed, or
     * - The destination array is full.
     *
     * @example
     * const src = "Hello, 世界!";
     * const dst = new Uint8Array(20);
     * const result = varintEncode(src, 0, dst, 0);
     * const nextChar = result / 0x100000000 | 0;
     * const bytesWritten = result | 0;
     * console.log(`Next char: ${nextChar}, Bytes written: ${bytesWritten}`);
     */
    function varint_encode(src: string, src_from: number, dst: Uint8Array, dst_from: number): number {

        for (let max = dst.length, ch; src_from < max; src_from++)
            if ((ch = src.charCodeAt(src_from)) < 0x80) { // Most frequent case: ASCII characters (0-127) These characters are encoded as a single byte
                if (dst_from === max) break;

                dst[dst_from++] = ch;
            } else if (ch < 0x4_000) {
                if (max - dst_from < 2) break;

                dst[dst_from++] = 0x80 | ch;
                dst[dst_from++] = ch >> 7;
            } else { // Less frequent case
                if (max - dst_from < 3) break;

                dst[dst_from++] = 0x80 | ch;
                dst[dst_from++] = 0x80 | ch >> 7;
                dst[dst_from++] = ch >> 14;
            }

        return src_from * 0x1_0000_0000 + dst_from;
    }

    /**
     * Decodes a portion of a Uint8Array into a Uint16Array using varint decoding.
     * @param src The source Uint8Array to decode.
     * @param src_from The starting index in the source Uint8Array.
     * @param src_to The ending index (exclusive) in the source Uint8Array.
     * @param ret A number containing three pieces of information:
     *     - Bits 0-15: The partial character value from a previous call (if any).
     *     - Bits 16-23: The number of bits already processed for the partial character.
     *     - Bits 24-53: The starting index in the destination Uint16Array.
     * @param dst The destination Uint16Array to store the decoded characters.
     * @param dst_from Optional. The starting index in the destination Uint16Array. If not provided, it's extracted from ret.
     * @returns A number containing three pieces of information:
     * - Bits 0-15: The partial character value (if decoding is incomplete).
     *   Extract with: returnedValue & 0xFFFF
     * - Bits 16-23: The number of bits processed for the partial character.
     *   Extract with: (returnedValue >> 16) & 0xFF
     * - Bits 24-53: The next index to write in the destination Uint16Array.
     *   Extract with: returnedValue / 0x100_0000 | 0
     * This return value can be used as the 'ret' parameter in a subsequent call to continue decoding.
     *
     * To extract all values at once:
     * const partialChar = returnedValue & 0xFFFF;
     * const bitsProcessed = (returnedValue >> 16) & 0xFF;
     * const nextIndex = returnedValue / 0x100_0000 | 0;
     */
    function varint_decode(src: Uint8Array, src_from: number, src_to: number, ret: number, dst: Uint16Array, dst_from: number | undefined): number {
        if (dst_from === undefined) dst_from = ret / 0x100_0000 | 0;
        const max = dst.length;
        if (max <= dst_from) return ret;

        let ch = ret & 0xFFFF;
        let s = (ret >> 16) & 0xFF;
        let b = 0;
        while (src_from < src_to)
            if ((b = src[src_from++]) < 0x80) {
                dst[dst_from++] = b << s | ch;
                s = 0;
                ch = 0;
                if (dst_from == max) break;
            } else {
                ch |= (b & 0x7F) << s;
                s += 7;
            }

        return dst_from * 0x100_0000 + (s << 16 | ch);
    }
}

export default AdHoc;