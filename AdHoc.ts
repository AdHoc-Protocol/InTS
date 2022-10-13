'use strict';
//https: //devdocs.io/javascript/global_objects/uint8clampedarray
import Context from "./Context"

//Use undefined. Do not use undefined. https://github.com/Microsoft/TypeScript/wiki/Coding-guidelines#undefined-and-undefined

export class AdHoc {
	byte: number
	len: number
	
	bit: number;
	
	obj: Object | undefined;
	str: string | undefined;
	internal_string: string | undefined;
	bits: number;
	buffer: DataView | undefined;
	mode: number;
	
	protected readonly data = new DataView(new ArrayBuffer(16));//adhoc storage
	
	u4: number;
	u8: bigint;
	fix_byte: number;
	fix_bytes: number;
	assertion: Assertion = Assertion.UNEXPECT;
}

enum Assertion {
	PACK_END  = 2,//End of a pack reached.
	SPACE_END = 1,//End of space reached
	UNEXPECT  = 0
}

export namespace AdHoc {
	export namespace EXT{
		export interface BytesSrc {
			read(dst ?: DataView, byte ?: number, bytes ?: number): number
			
			close();
			
			get isOpen(): boolean;
		}
		export namespace BytesSrc {
			
			export interface Producer {
				subscribe(subscriber: (BytesSrc) => void, token: Object | undefined);
				
				token(token: Object | undefined): Object | undefined;
				
				token(): Object | undefined;
			}
		}
		
		export interface BytesDst {
			write(src ?: DataView, byte ?: number, bytes ?: number): number;
			
			close();
			
			get isOpen(): boolean;
		}
	}
	export namespace INT{
		export interface BytesDst {
			put_bytes(src: Receiver): BytesDst | undefined;
		}
		
		export namespace BytesDst {
			export interface Consumer {
				receiving(src: Receiver, id: number): BytesDst;
				
				received(src: Receiver, output: BytesDst): void;
			}
		}
		
		export interface BytesSrc {
			get_bytes(dst: Transmitter): BytesSrc | undefined;
		}
		
		export namespace BytesSrc {
			export interface Producer {
				sending(dst: Transmitter): BytesSrc | undefined;
				
				sent(dst: Transmitter, input: BytesSrc);
			}
		}
	}
	
	
	
	
	
	
	
	function trailingZeros(i: number): number {
		
		let n = 7;
		i <<= 24;
		let y = i << 4;
		
		if (y != 0) {
			n -= 4;
			i = y;
		}
		Number.MAX_SAFE_INTEGER
		y = i << 2;
		
		return y == 0 ? n - (i << 1 >>> 31) : n - 2 - (y << 1 >>> 31);
	}
	
	
	const OK       = 0xFFFF_FFFF,
	      STR      = OK - 100,
	      DONE     = STR + 1,
	      VAL4     = DONE + 1,
	      VAL      = VAL4 + 1,
	      LEN      = VAL + 1,
	      BASE_LEN = LEN + 1,
	      BITS     = BASE_LEN + 1,
	      VARINTS  = BITS + 1,
	      VARINT4  = VARINTS + 1,
	      VARINT8  = VARINT4 + 1;
	
	export class Receiver extends AdHoc implements AdHoc.EXT.BytesDst, Context.Provider {
		
		readonly id_bytes: number;//bytes allocated for pack id
		int_dst: AdHoc.INT.BytesDst.Consumer | undefined;
		
		constructor(int_dst: AdHoc.INT.BytesDst.Consumer | undefined, id_bytes: number) {
			super();
			this.fix_byte = 0;
			this.id_bytes = id_bytes;
			this.int_dst  = int_dst;
		}


//region Slot
		slot: Receiver.Slot | undefined;
		slot_ref = new WeakRef(new Receiver.Slot(undefined));
		
		free_slot(): void {
			if (this.slot!.context) {
				this.context_      = this.slot!.context.prev!;
				this.slot!.context = undefined;
			}
			this.slot = this.slot!.prev!;
		}

//endregion

//region Context
		context_: Receiver.ContextExt | undefined;
		context_ref: WeakRef<Receiver.ContextExt> = new WeakRef(new Receiver.ContextExt(undefined));
		
		get context(): Context {
			
			if (this.slot!.context) return this.slot!.context;
			
			if (!this.context_ && !(this.context_ = this.context_ref.deref())) this.context_ref = new WeakRef(this.context_ = new Receiver.ContextExt(undefined));
			else if (!this.context_.next) this.context_ = this.context_.next = new Receiver.ContextExt(this.context_);
			else this.context_ = this.context_.next;
			
			return this.slot!.context = this.context_;
		}

//endregion
		
		
		output(): AdHoc.INT.BytesDst | undefined {
			const output         = this.slot!.next!.dst;
			this.slot!.next!.dst = undefined
			return output
		}
		
		get key(): AdHoc.INT.BytesDst | string | number | bigint | undefined {
			const k                 = this.slot!.context!.key;
			this.slot!.context!.key = undefined
			return k
		}
		
		set key(key: AdHoc.INT.BytesDst | string | number | bigint | undefined) {
			this.slot!.context!.key = key;
		}
		
		get value(): AdHoc.INT.BytesDst | undefined {
			const v                   = this.slot!.context!.value;
			this.slot!.context!.value = undefined;
			return v;
		}
		
		set value(value: AdHoc.INT.BytesDst | undefined) {
			this.slot!.context!.value = value;
		}
		
		
		get_info(the_case: number): boolean {
			if (this.byte < this.len) {
				this.context;
				this.slot!.context!.info = this.buffer!.getUint8(this.byte++);
				return true;
			}
			this.retry_at(the_case);
			return false;
		}
		
		
		get hasNullKey(): boolean {
			return ((this.slot!.context!.info as number) >> 7 & 1) == 1;
			
		}
		
		hasNullKey_(key_val_case: number, end_case: number): boolean {
			if (this.hasNullKey) return true;
			this.state = this.index_max == 0 ? end_case : key_val_case;
			
			return false;
		}
		
		hasNullKey$(null_values_case: number, key_val_case: number, next_field_case: number): boolean {
			const hasNullKey = this.hasNullKey;
			if (hasNullKey && this.nullKeyHasValue) return true;    //not jump. step to send value of key == undefined
			
			//if key == undefined does not exists or it's value == undefined
			//no need to receive value,  so can calculate next jump
			this.state = 0 < this.index_max ? null_values_case : //jump to send keys which value == undefined
			             0 < (this.index_max = this.key as number) ? key_val_case :// jump to send KV
			             next_field_case;
			
			return hasNullKey;
		}
		
		get nullKeyHasValue(): boolean {
			return (this.slot!.context!.info >> 6 & 1) == 1;
		}
		
		get_items_count(next_case: number): boolean {
			return this.get_len(this.slot!.context!.info & 7, next_case);
		}
		
		null_values_count(next_case: number): boolean {
			this.slot!.context!.key = this.index_max;//preserve total items count
			return this.get_len(this.slot!.context!.info >> 3 & 7, next_case);
		}
		
		get items_count(): number {
			return this.slot!.context!.key as number + this.index_max + (this.hasNullKey ? 1 : 0);
		}
		
		no_null_values(key_val_case: number, end_case: number): boolean {
			if (0 < this.index_max) return false;     //no keys which value == undefined
			
			this.state = 0 < (this.index_max = this.slot!.context!.key as number) ? key_val_case : end_case;// KV
			return true;
		}
		
		no_key_val(end_case: number): boolean {
			if (0 < (this.index_max = this.slot!.context!.key as number)) return false
			this.state = end_case
			return true
		}
		
		get state(): number {
			return this.slot!.state;
		}
		
		set state(value: number) {
			this.slot!.state = value;
		}
		
		get index(): number {
			return this.slot!.index
		}
		
		set index(value: number) {
			this.slot!.index = value
		}
		
		get index_max(): number {
			return this.slot!.index_max
		}
		
		set index_max(len: number) {
			this.slot!.index     = 0
			this.slot!.index_max = len;
		}
		
		index_max_zero(on_zero_case: number): boolean {
			if (0 < this.slot!.index_max) return false;
			this.state = on_zero_case;
			return true;
		}
		
		get base_index(): number {
			return this.slot!.base_index;
		}
		
		set base_index(value: number) {
			this.slot!.base_index = value;
		}
		
		get base_index_max(): number {
			return this.slot!.base_index_max;
		}
		
		set base_index_max(base_len: number) {
			this.slot!.base_index     = 0;
			this.slot!.base_index_max = base_len;
		}
		
		next_index_(ok_case: number): boolean {
			if (++this.slot!.index < this.slot!.index_max) {
				this.state = ok_case;
				return true;
			}
			return false;
		}
		
		
		next_index(): boolean {
			return ++this.slot!.index < this.slot!.index_max;
		}
		
		next_base_index(): boolean {
			return ++this.slot!.base_index < this.slot!.base_index_max;
		}
		
		get null_at_index(): boolean {
			return (this.nulls & 1 << (this.index & 7)) == 0;
		}
		
		get nulls(): number {
			return this.slot!.items_nulls;
		}
		
		nulls_(nulls: number, index: number): void {
			
			this.slot!.index       = index + trailingZeros(nulls);
			this.slot!.items_nulls = nulls;
		}
		
		
		get null_at_base_index(): boolean {
			return (this.base_nulls & 1 << (this.base_index & 7)) == 0;
		}
		
		get base_nulls(): number {
			return this.slot!.base_nulls;
		}
		
		base_nulls_(nulls: number, base_index: number): void {
			
			this.slot!.base_index = base_index + trailingZeros(nulls);
			this.slot!.base_nulls = nulls;
			
		}
		
		find_exist(index: number): boolean {
			const nulls = this.buffer!.getUint8(this.byte++);
			if (nulls == 0) return false;
			this.slot!.index       = index + trailingZeros(nulls);
			this.slot!.items_nulls = nulls;
			return true;
		}
		
		find_base_exist(base_index: number): boolean {
			const nulls = this.buffer!.getUint8(this.byte++);
			if (nulls == 0) return false;
			this.slot!.base_index = base_index + trailingZeros(nulls);
			this.slot!.base_nulls = nulls;
			return true;
		}
		
		get_fields_nulls(this_case: number): boolean {
			if (this.byte < this.len) {
				this.slot!.fields_nulls = this.buffer!.getUint8(this.byte++);
				return true;
			}
			
			this.slot!.state = this_case;
			this.mode        = DONE;
			return false;
		}
		
		is_null(field: number, next_field_case: number): boolean {
			if ((this.slot!.fields_nulls & field) == 0) {
				this.state = next_field_case;
				return true;
			}
			return false;
		}
		
		
		get idle(): boolean {
			return !this.slot;
		}
		
		close() {
		}
		
		get isOpen(): boolean { return this.slot !== undefined}
		
		// if src == undefined - clear and reset
		write(src ?: DataView, byte ?: number, bytes ?: number): number {
			
			if (!src) {
				this.buffer    = undefined;
				this.assertion = Assertion.UNEXPECT;
				if (!this.slot) return 0;
				this.mode            = OK;
				this.fix_byte        = 0;
				this.fix_bytes       = this.id_bytes;
				this.u4              = 0;
				this.u8              = 0n;
				this.internal_string = undefined;
				this.slot!.dst       = undefined;
				this.slot!.state     = 0;
				while (this.slot) {
					this.slot!.dst = undefined;
					this.free_slot();
				}
				return 0;
			}
			
			this.byte = byte ? byte : 0;
			this.len  = bytes ? bytes + this.byte : src.byteLength;
			
			const remaining = this.len - this.byte;
			
			if (remaining < 1)
				if (this.assertion == Assertion.PACK_END)    //PACK_END unexpected.
				{
					this.assertion = Assertion.UNEXPECT;
					return -1;
				}
			
			this.buffer = src;
			write:
				for (; ;) {
					if (!this.slot || !this.slot!.dst) {
						if (this.fix_byte == 0)      //tmp empty
						{
							if (this.len - this.byte < this.id_bytes)      //not enough id_bytes received
							{
								this.not_get()//store available
								if (this.slot) this.free_slot();    //remove hardlinks
								break;
							}
						}
						else if (this.not_get())      //store more
						{
							if (this.slot) this.free_slot();    //remove hardlinks
							break;
						}
						const id      = this.get4(this.id_bytes);
						this.fix_byte = 0;
						if (!(this.slot = this.slot_ref.deref())) this.slot_ref = new WeakRef(this.slot = new Receiver.Slot(undefined));
						if (!(this.slot!.dst = this.int_dst!.receiving(this, id))) {
							this.slot = undefined;
							break;
						}
						this.u8          = 0n;
						this.slot!.state = 0;
					}
					else switch (this.mode) {
						case VAL:
							if (this.not_get()) break write;
							break;
						case LEN:
							if (this.not_get()) break write;
							this.index_max = this.get4_();
							break;
						case VARINT4:
							if (this.buffer?.byteLength - this.byte && this.retry_get_varint4(this.state)) break;
							break write;
						case VARINT8:
							if (this.buffer?.byteLength - this.byte && this.retry_get_varint8(this.state)) break;
							break write;
						case BASE_LEN:
							if (this.not_get()) break write;
							this.base_index_max = this.get4_();
							break;
						case STR:
							if (!this.String()) break write;
							break;
						case DONE:
							break;
					}
					this.mode = OK;
					for (let dst: AdHoc.INT.BytesDst | undefined; ;)
						if ((dst = this.slot!.dst.put_bytes(this))) //deeper in hierarchy
						{
							this.slot        = this.slot!.next ??= new Receiver.Slot(this.slot);
							this.slot!.dst   = dst;
							this.slot!.state = 0;
						}
						else
						{
							if (this.mode < OK) break write;      //data over
							if (!this.slot!.prev) break;     //that was root, next dispatching
							// slot!.dst = undefined; //do not clean up maybe will use
							this.free_slot();
						}
					this.fix_byte    = 0;
					this.fix_bytes   = this.id_bytes;// !!!!!!!!!!!!!
					this.u4          = 0;
					this.slot!.state = 0;
					switch (this.assertion) {
						case Assertion.SPACE_END://unexpected. discard data.
							this.assertion = Assertion.UNEXPECT;
							return -1;
						case Assertion.PACK_END://expected
							this.int_dst!.received(this, this.slot!.dst);//dispatching
							this.slot!.dst = undefined; //mark ready to receive next package
							return remaining;
					}
					this.int_dst!.received(this, this.slot!.dst);//dispatching
					this.slot!.dst = undefined; //mark ready to receive next package
				}//write:
			
			this.buffer = undefined;
			
			if (this.assertion == Assertion.PACK_END)    //PACK_END unexpected.
			{
				this.assertion = Assertion.UNEXPECT;
				return -1;
			}
			
			return remaining;
		}
		
		retry_at(the_case: number) {
			this.slot!.state = the_case;
			this.mode        = DONE;
		}
		
		
		no_items_data(retry_at_case: number, no_items_case: number): boolean {
			for (let nulls: number; this.byte < this.buffer?.byteLength!;) {
				if ((nulls = this.buffer?.getUint8(this.byte++)!) != 0) {
					this.slot!.index += trailingZeros(this.slot!.items_nulls = nulls);
					return false;
				}
				if (this.slot!.index_max <= (this.slot!.index += 8)) {
					this.state = no_items_case;
					return false;
				}
			}
			this.retry_at(retry_at_case);
			return true;
		}
		
		public no_index(on_fail_case: number, on_fail_fix_index: number): boolean {
			if (this.byte < this.len) return false;
			this.retry_at(on_fail_case);
			this.index = on_fail_fix_index;
			return true;
		}
		
		public no_base_index(on_fail_case: number, fix_base_index_on_fail: number): boolean {
			if (this.byte < this.len) return false;
			this.retry_at(on_fail_case);
			this.base_index = fix_base_index_on_fail;
			return true;
		}
		
		get remaining(): number {
			return this.len - this.byte;
		}
		
		get position(): number {
			return this.byte;
		}


//region bits
		
		public init_bits()  //bits receiving init
		{
			this.bits = 0;
			this.bit  = 8;
		}
		
		get get_bits(): number {
			return this.u4;
		}
		
		
		public get_bits_(len_bits: number): number {
			let ret = 0;
			if (this.bit + len_bits < 9) {
				ret = this.bits >> this.bit & 0xFF >> 8 - len_bits;
				this.bit += len_bits;
			}
			else {
				ret      = (this.bits >> this.bit | (this.bits = this.buffer!.getUint8(this.byte++)) << 8 - this.bit) & 0xFF >> 8 - len_bits;
				this.bit = this.bit + len_bits - 8;
			}
			
			return ret;
		}
		
		public try_get_bits(len_bits: number, this_case: number): boolean {
			if (this.bit + len_bits < 9) {
				this.u4 = this.bits >> this.bit & 0xFF >> 8 - len_bits;
				this.bit += len_bits;
			}
			else if (this.byte < this.len) {
				this.u4  = (this.bits >> this.bit | (this.bits = this.buffer!.getUint8(this.byte++)) << 8 - this.bit) & 0xFF >> 8 - len_bits;
				this.bit = this.bit + len_bits - 8;
			}
			else {
				this.retry_at(this_case);
				return false;
			}
			return true;
		}

//endregion
		
		public zig_zag2(src: number): number {
			return -(src & 1) ^ src >>> 1;
		}
		
		public zig_zag4(src: number): number {
			return -(src & 1) ^ src >>> 1;
		}
		
		public zig_zag8(src: bigint): bigint {
			return -(src & 1n) ^ src >> 1n;
		}

//region single varint
		public try_get_varint4(next_case: number): boolean {
			this.u4       = 0;
			this.fix_byte = 0;
			
			return this.retry_get_varint4(next_case);
		}
		
		private retry_get_varint4(next_case: number): boolean {
			while (this.byte < this.len) {
				let b = this.buffer!.getInt8(this.byte++);
				if (b < 0) {
					this.u4 |= (b & 0x7F) << this.fix_byte;
					this.fix_byte += 7;
					continue;
				}
				this.u4 |= b << this.fix_byte;
				return true;
			}
			
			this.state = next_case;
			this.mode  = VARINT4;
			return false;
		}
		
		public try_get_varint8(next_case: number): boolean {
			this.u4        = 0;
			this.u8        = 0n;
			this.fix_byte  = 0;
			this.fix_bytes = 0;
			
			return this.retry_get_varint8(next_case);
		}
		
		private retry_get_varint8(next_case: number): boolean {
			
			while (this.byte < this.len) {
				const b = this.buffer!.getInt8(this.byte++);
				if (b < 0) {
					if (this.fix_byte == 7 * 4) {
						this.data!.setUint16(0, this.u4)
						this.u4 >>>= 16
						this.u4 |= (b & 0x7F) << 12;
						this.data!.setUint16(2, this.u4)
						this.u4 >>>= 16
						this.fix_byte  = 3
						this.fix_bytes = 4
						this.data!.setUint32(4, 0)//cleanup
					}
					else {
						this.u4 |= (b & 0x7F) << this.fix_byte;
						this.fix_byte += 7;
					}
					continue;
				}
				this.u4 |= b << this.fix_byte;
				if (this.fix_bytes == 4) {
					this.data.setUint32(4, this.u4);
					this.u8 = this.data.getBigUint64(0)
				}
				else
					this.u8 = BigInt(this.u4);
				return true;
			}
			
			this.state = next_case;
			this.mode  = VARINT8;
			return false;
		}

//endregion
		
		
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
			const ret = this.buffer!.getInt16(this.byte);
			this.byte += 2;
			return ret;
		}
		
		public get_char(): number {
			const ret = this.buffer!.getUint16(this.byte);
			this.byte += 2;
			return ret;
		}
		
		public get_ushort(): number {
			const ret = this.buffer!.getUint16(this.byte);
			this.byte += 2;
			return ret;
		}
		
		public get_int(): number {
			const ret = this.buffer!.getInt32(this.byte);
			this.byte += 4;
			return ret;
		}
		
		public get_uint(): number {
			const ret = this.buffer!.getUint32(this.byte);
			this.byte += 4;
			return ret;
		}
		
		public get_long(): bigint {
			const ret = this.buffer!.getBigInt64(this.byte);
			this.byte += 8;
			return ret;
		}
		
		public get_ulong(): bigint {
			const ret = this.buffer!.getBigUint64(this.byte);
			this.byte += 8;
			return ret;
		}
		
		public get_float(): number {
			const ret = this.buffer!.getFloat32(this.byte);
			this.byte += 4;
			return ret;
		}
		
		public get_double(): number {
			const ret = this.buffer!.getFloat64(this.byte);
			this.byte += 8;
			return ret;
		}
		
		public get4_(): number {return this.get4(this.fix_bytes)}
		
		public get4(bytes: number): number {
			let byte = this.byte
			this.byte += bytes;
			
			switch (bytes) {
				case 4:
					return this.buffer!.getUint32(byte)
				case 3:
					return this.buffer!.getUint16(byte) << 8 | this.buffer!.getUint8(byte + 2);
				case 2:
					return this.buffer!.getUint16(byte)
			}
			
			return this.buffer!.getUint8(byte)
		}
		
		
		public get8_(): bigint {return this.get8(this.fix_bytes)}
		
		public get8(bytes: number): bigint {
			let byte = this.byte
			this.byte += bytes;
			
			switch (bytes) {
				case 8:
					return this.buffer!.getBigUint64(byte);
				case 7:
					this.data.setUint32(0, this.buffer!.getUint32(byte))
					this.data.setUint16(4, this.buffer!.getUint16(byte + 4))
					this.data.setUint8(6, this.buffer!.getUint8(byte + 6))
					this.data.setUint8(7, 0);
					return this.data.getBigUint64(0);
				case 6:
					this.data.setUint32(0, this.buffer!.getUint32(byte))
					this.data.setUint16(4, this.buffer!.getUint16(byte + 4))
					this.data.setUint16(6, 0);
					return this.data.getBigUint64(0);
				case 5:
					this.data.setUint32(0, this.buffer!.getUint32(byte))
					this.data.setUint8(4, this.buffer!.getUint8(byte + 4))
					this.data.setUint32(5, 0);
					return this.data.getBigUint64(0);
				case 4:
					return BigInt(this.buffer!.getUint32(byte))
				case 3:
					return BigInt(this.buffer!.getUint16(byte) << 8 | this.buffer!.getUint8(byte + 2))
				case 2:
					return BigInt(this.buffer!.getUint16(byte))
				case 1:
					return BigInt(this.buffer!.getUint8(byte))
			}
			return 0n;
		}


//region temporary store part of received
		private tmp_ref: WeakRef<Receiver.TmpBuffer> = new WeakRef(new Receiver.TmpBuffer(this, 512)); //tmp buffer
		private tmp: Receiver.TmpBuffer | undefined;
		
		private set_tmp(bytes: number) {
			if (!(this.tmp = this.tmp_ref.deref()) || this.tmp.byteLength < bytes)
				this.tmp = new Receiver.TmpBuffer(this, Math.max(512, bytes));
		}
		
		recycle_tmp() {
			if (this.tmp_ref.deref() != this.tmp) this.tmp_ref = new WeakRef(this.tmp!);
			this.tmp       = undefined;
			this.fix_byte  = 0;
			this.fix_bytes = 0;
		}

//endregion
		
		public get_string(): string {//getting result internal loading
			
			const ret            = this.internal_string;
			this.internal_string = undefined;
			return ret!;
		}
		
		public get_string_(get_string_case: number): boolean {
			
			this.internal_string = undefined;
			this.fix_byte        = 0;
			let start            = this.byte
			
			while (this.byte < this.len)
				if (this.buffer!.getUint8(this.byte++) === 0xFF) {
					this.internal_string = this.utf8decoder.decode(this.buffer!.buffer.slice(start, this.byte - 1));
					return true;
				}
			
			this.internal_string = this.utf8decoder.decode(this.buffer!.buffer.slice(start, this.byte), {stream: true});
			
			this.slot!.state = get_string_case;
			this.mode        = STR;
			return false;
		}
		
		private readonly utf8decoder = new TextDecoder();
		
		private String(): boolean {
			
			let start = this.byte
			while (this.byte < this.len)
				if (this.buffer!.getUint8(this.byte++) === 0xFF) {
					this.internal_string += this.utf8decoder.decode(this.buffer!.buffer.slice(start, this.byte - 1));
					return true
				}
			
			this.internal_string += this.utf8decoder.decode(this.buffer!.buffer.slice(start, this.byte), {stream: true});
			
			return false;
		}
		
		try_get(bytes: number, get_case: number): boolean {
			if (bytes <= this.len - this.byte) return true;
			
			this.fix_byte  = 0;
			this.fix_bytes = bytes;
			
			if (this.byte < this.len)      //store partly received bytes
			{
				this.set_tmp(bytes);
				for (let i = this.len - this.byte; -1 < --i;)
					this.tmp!.setUint8(this.fix_byte++, this.buffer!.getUint8(this.byte++))
				this.mode = VAL;
			}
			else this.mode = DONE;//nothing to store, just continue on new data
			
			this.slot!.state = get_case;
			return false;
		}
		
		not_get(): boolean {
			
			if (this.fix_bytes - this.fix_byte <= this.len - this.byte) {
				if (!this.tmp) return false     //none bytes stored
				while (this.fix_byte < this.fix_bytes)    //copy requested bytes to  this.tmp
					this.tmp!.setUint8(this.fix_byte++, this.buffer!.getUint8(this.byte++))
				this.fix_bytes = this.byte -= this.fix_bytes
				this.tmp!.tail = this.buffer//flip storage
				this.buffer    = this.tmp;
				return false;
			}
			
			if (this.len - this.byte < 1) return true
			
			
			if (!this.tmp) this.set_tmp(this.fix_bytes);     //none bytes stored yet, create storage
			
			while (this.byte < this.len)    //to store available received bytes
				this.tmp!.setUint8(this.fix_byte++, this.buffer!.getUint8(this.byte++))
			
			return true;
		}
		
		get_len(bytes: number, next_case: number): boolean {
			if (bytes == 0) {
				this.index_max = 0;
				return true;
			}
			if (this.try_get(bytes, next_case)) {
				this.index_max = this.get4(bytes);
				return true;
			}
			
			this.mode = LEN;//override
			
			return false;
		}
		
		get_base_len(bytes: number, next_case: number): boolean {
			if (bytes == 0) {
				this.base_index_max = 0;
				return true;
			}
			
			if (this.try_get(bytes, next_case)) {
				this.base_index_max = this.get4(bytes);
				return true;
			}
			
			this.mode = BASE_LEN;//override
			
			return false;
		}
	}
	
	export namespace Receiver {
				
		export class TmpBuffer extends DataView {
			
			public readonly dst: AdHoc.Receiver;
			public tail: DataView | undefined;
			
			constructor(dst: AdHoc.Receiver, length: number) {
				super(new ArrayBuffer(length));
				this.dst = dst;
			}
			
			getInt8(byte: number): number {
				if (-1 < byte) {
					this.dst.recycle_tmp();
					return (this.dst.buffer = this.tail)!.getInt8(byte);
				}
				
				return super.getInt8(this.dst.fix_bytes - byte);
			}
			
			getUint8(byte: number): number {
				if (-1 < byte) {
					this.dst.recycle_tmp();
					return (this.dst.buffer = this.tail)!.getUint8(byte);
				}
				
				return super.getUint8(this.dst.fix_bytes - byte);
			}
			
			getInt16(byte: number, littleEndian ?: boolean): number {
				if (-1 < byte) {
					this.dst.recycle_tmp();
					return (this.dst.buffer = this.tail)!.getInt16(byte, littleEndian);
				}
				
				return super.getInt16(this.dst.fix_bytes - byte, littleEndian);
			}
			
			getUint16(byte: number, littleEndian ?: boolean): number {
				if (-1 < byte) {
					this.dst.recycle_tmp();
					return (this.dst.buffer = this.tail)!.getUint16(byte, littleEndian);
				}
				
				return super.getUint16(this.dst.fix_bytes - byte, littleEndian);
			}
			
			getInt32(byte: number, littleEndian ?: boolean): number {
				if (-1 < byte) {
					this.dst.recycle_tmp();
					return (this.dst.buffer = this.tail)!.getInt32(byte, littleEndian);
				}
				
				return super.getInt32(this.dst.fix_bytes - byte, littleEndian);
			}
			
			getUint32(byte: number, littleEndian ?: boolean): number {
				if (-1 < byte) {
					this.dst.recycle_tmp();
					return (this.dst.buffer = this.tail)!.getUint32(byte, littleEndian);
				}
				
				return super.getUint32(this.dst.fix_bytes - byte, littleEndian);
			}
			
			getBigInt64(byte: number, littleEndian ?: boolean): bigint {
				if (-1 < byte) {
					this.dst.recycle_tmp();
					return (this.dst.buffer = this.tail)!.getBigInt64(byte, littleEndian);
				}
				
				return super.getBigInt64(this.dst.fix_bytes - byte, littleEndian);
			}
			
			getBigUint64(byte: number, littleEndian ?: boolean): bigint {
				if (-1 < byte) {
					this.dst.recycle_tmp();
					return (this.dst.buffer = this.tail)!.getBigUint64(byte, littleEndian);
				}
				
				return super.getBigUint64(this.dst.fix_bytes - byte, littleEndian);
			}
			
			getFloat32(byte: number, littleEndian ?: boolean): number {
				if (-1 < byte) {
					this.dst.recycle_tmp();
					return (this.dst.buffer = this.tail)!.getFloat32(byte, littleEndian);
				}
				
				return super.getFloat32(this.dst.fix_bytes - byte, littleEndian);
			}
			
			getFloat64(byte: number, littleEndian ?: boolean): number {
				if (-1 < byte) {
					this.dst.recycle_tmp();
					return (this.dst.buffer = this.tail)!.getFloat64(byte, littleEndian);
				}
				
				return super.getFloat64(this.dst.fix_bytes - byte, littleEndian);
			}
		}
		
		//region Slot
		export class Slot {
			
			public state: number;
			public dst: INT.BytesDst | undefined;
			
			public base_index: number;
			public base_index_max: number;
			public base_nulls: number;
			
			public fields_nulls: number;
			
			public index: number     = 1;
			public index_max: number = 1;
			public items_nulls: number;
			
			public next: Slot | undefined;
			public prev: Slot | undefined;
			
			constructor(prev: Slot | undefined) {
				this.prev = prev;
				if (prev) prev.next = this;
			}
			
			toString(this: Slot): String {
				let s = this;
				while (s.prev) s = s.prev;
				var str = "\n";
				for (var i = 0; ; i++) {
					for (var ii = i; 0 < ii; ii--) str += "\t";
					str += typeof s.dst + "\n";
					if (s == this) break;
					s = s.next!;
				}
				return str;
			}
			
			context: ContextExt | undefined;
		}

//endregion

//region ContextExt
		export class ContextExt extends Context {
			
			info: number;
			key: INT.BytesDst | string | number | bigint | undefined;
			value: INT.BytesDst | undefined;
			
			next: ContextExt | undefined;
			prev: ContextExt | undefined;
			
			constructor(prev: ContextExt | undefined) {
				super();
				this.prev = prev;
				if (prev) prev.next = this;
			}
		}

//endregion
		
		
	}
	
	export class Transmitter extends AdHoc implements AdHoc.EXT.BytesSrc, Context.Provider {
		
		int_src: AdHoc.INT.BytesSrc.Producer;
		int_bigints_src: () => bigint;
		int_numbers_src: () => number;
		
		constructor(int_src: AdHoc.INT.BytesSrc.Producer, int_numbers_src: () => number, int_bigints_src: () => bigint) {
			super();
			this.int_src         = int_src;
			this.int_numbers_src  = int_numbers_src;
			this.int_bigints_src  = int_bigints_src;
		}
		
		close() {
		}
		
		get isOpen(): boolean { return this.slot !== undefined}

//region Slot
		
		slot: Transmitter.Slot | undefined;
		slot_ref = new WeakRef(new Transmitter.Slot(undefined));
		
		free_slot(): void {
			if (this.slot!.context_) {
				this.context_       = this.slot!.context_.prev!;
				this.slot!.context_ = undefined;
			}
			this.slot = this.slot!.prev!;
		}

//endregion


//region Context
		
		context_: Transmitter.ContextExt | undefined;
		context_ref: WeakRef<Transmitter.ContextExt> = new WeakRef(new Transmitter.ContextExt(undefined));
		
		get context(): Context {
			
			if (this.slot!.context_) return this.slot!.context_;
			
			if (!this.context_ && !(this.context_ = this.context_ref.deref())) this.context_ref = new WeakRef(this.context_ = new Transmitter.ContextExt(undefined));
			else if (!this.context_.next) this.context_ = this.context_.next = new Transmitter.ContextExt(this.context_);
			else this.context_ = this.context_.next;
			
			return this.slot!.context_ = this.context_;
		}

//endregion
		
		
		get state(): number {
			return this.slot!.state;
		}
		
		set state(value: number) {
			this.slot!.state = value;
		}
		
		get position(): number {
			return this.byte;
		}
		
		get remaining(): number {
			return this.len - this.byte;
		}
		
		get index(): number {
			return this.slot!.index
		}
		
		set index(value: number) {
			this.slot!.index = value
		}
		
		get index2(): number {
			return this.slot!.index2
		}
		
		set index2(value: number) {
			this.slot!.index2 = value
		}
		
		get index_max() {
			return this.slot!.index_max
		}
		
		set index_max(max: number) {
			this.slot!.index     = 0
			this.slot!.index_max = max;
		}
		
		public index_less_max(jump_case: number): boolean {
			if (this.slot!.index_max <= this.slot!.index) return false;
			this.state = jump_case;
			return true;
		}
		
		index_max_zero(on_zero_case: number): boolean {
			if (0 < this.slot!.index_max) return false;
			this.state = on_zero_case;
			return true;
		}
		
		get base_index(): number {
			return this.slot!.base_index;
		}
		
		set base_index(value: number) {
			this.slot!.base_index = value;
		}
		
		get base_index_max(): number {
			return this.slot!.base_index_max;
		}
		
		set base_index_max(base_len: number) {
			this.slot!.base_index     = 0;
			this.slot!.base_index_max = base_len;
		}
		
		set base_index2(value: number) {this.slot!.base_index2 = value;}
		
		public next_index2(): boolean {return ++this.slot!.index < this.slot!.index2;}
		
		public next_index(): boolean {return ++this.slot!.index < this.slot!.index_max;}
		
		public next_index_(yes_case: number): boolean {
			if (++this.slot!.index < this.slot!.index_max) {
				this.state = yes_case;
				return true;
			}
			return false;
		}
		
		public next_index$(yes_case: number, no_case: number): boolean {
			
			if (++this.slot!.index < this.slot!.index_max) {
				this.state = yes_case;
				return true;
			}
			this.state = no_case;
			return false;
		}
		
		
		public index_next(next_state: number): number {
			++this.slot!.index;
			this.state = this.slot!.index_max == this.slot!.index ? next_state + 1 : next_state;
			return this.slot!.index - 1;
		}
		
		
		public base_index_less_max(jump_case: number): boolean {
			if (this.slot!.base_index_max <= this.slot!.base_index) return false;
			this.state = jump_case;
			return true;
		}
		
		public next_base_index2(): boolean {return ++this.slot!.base_index < this.slot!.base_index2;}
		
		public next_base_index(): boolean {return ++this.slot!.base_index < this.slot!.base_index_max;}
		
		
		public init_fields_nulls(field0_bit: number, current_case: number): boolean {
			if (!this.allocate(1, current_case)) return false;
			this.slot!.fields_nulls = field0_bit;
			return true;
		}
		
		public set_fields_nulls(field: number) {this.slot!.fields_nulls |= field;}
		
		public flush_fields_nulls() {this.buffer!.setUint8(this.byte++, this.slot!.fields_nulls);}
		
		public is_null(field: number, next_field_case: number) {
			if ((this.slot!.fields_nulls & field) == 0) {
				this.state = next_field_case;
				return true;
			}
			return false;
		}
		
		// if !dst  - clean / reset state
		read(dst ?: DataView, byte ?: number, bytes ?: number): number {
			
			if (!dst)    //reset
			{
				if (!this.slot) return -1;
				this.buffer    = undefined;
				this.assertion = Assertion.UNEXPECT;
				while (this.slot) {
					this.slot!.src = undefined;
					this.free_slot();
				}
				this.mode     = OK;
				this.u4       = 0;
				this.fix_byte = 0; //this need bits sending
				return -1;
			}
			this.byte = byte ? byte : 0;
			this.len  = bytes ? this.byte + bytes : dst.byteLength;
			if (this.len - this.byte < 1) return 0;
			
			this.buffer    = dst;
			const position = this.byte;
			read:
				for (; ;) {
					if (!this.slot || !this.slot.src)
					{
						if (!(this.slot = this.slot_ref!.deref())) this.slot_ref = new WeakRef(this.slot = new Transmitter.Slot(undefined));
						if (!(this.slot.src = this.int_src!.sending(this))) {
							const ret   = this.byte - position;
							this.buffer = undefined;
							this.free_slot();//remove hardlinks
							this.assertion = Assertion.UNEXPECT;
							return 0 < ret ? ret : -1;
						}
						this.slot.state = 0; //write id request
						this.u4         = 0;
						this.fix_byte   = 0;
						this.slot.index = 0;
					}
					else switch (this.mode)     //restore transition state
					{
						case STR:
							if (!this.encode(this.internal_string!)) break read;      //there is not enough space in the provided buffer for further work
							this.internal_string = undefined;
							break;
						case VAL:
							do {
								this.buffer.setUint8(this.byte++, this.data.getUint8(this.fix_byte++))
								if (this.byte == this.len) break read;
							}
							while (this.fix_byte < this.fix_bytes);
							break;
						case VARINTS:
							if (this.len - this.byte < 25) break read;    //space for one full transaction
							this.bits_byte = this.byte;//preserve space for bits info
							this.byte      = this.bits_byte + 1;
							do {
								this.buffer.setUint8(this.byte++, this.data.getUint8(this.fix_byte++))
							}
							while (this.fix_byte < this.fix_bytes);
							break;
						case VARINT4:
							if (this.byte < this.buffer.byteLength && this.put_varint4(this.u4, this.state)) break;
							break read;
						case VARINT8:
							if (this.byte < this.buffer.byteLength && this.put_varint8(this.u8, this.state)) break;
							break read;
						case BITS:
							if (this.len - this.byte < 4) break read;
							this.bits_byte = this.byte;//preserve space for bits info
							this.byte      = this.bits_byte + 1;
							break;
					}
					this.mode = OK;
					for (let src: AdHoc.INT.BytesSrc | undefined; ;)
						if ((src = this.slot!.src.get_bytes(this)))     //deeper in hierarchy
						{
							this.slot       = this.slot!.next ??= new Transmitter.Slot(this.slot);
							this.slot.src   = src;
							this.slot.state = 1; //skip write id
						}
						else
						{
							if (this.mode < OK) break read;     //there is not enough space in the provided buffer for further work
							if (!this.slot!.prev) break;     //it was the root level, all packet data sent
							//slot.src = undefined so don't do, can be used in MAP
							this.free_slot();
						}
					this.int_src!.sent(this, this.slot.src);
					this.slot!.src = undefined; //data request label of the next packet
					if (this.assertion == Assertion.UNEXPECT) continue;
					this.slot      = undefined;
					this.assertion = Assertion.PACK_END;
					break;
				}//read:
			
			const ret   = this.byte - position;
			this.buffer = undefined;
			
			//if (outcome != Outcome.UNEXPECT) outcome = Outcome.SPACE_END;
			
			return ret; // number of bytes read
		}
		
		
		public put_bool(src: boolean) {this.put_bits(src ? 1 : 0, 1);}
		
		public put_bool_(src: boolean | undefined) {this.put_bits(src == undefined ? 0 : src ? 1 : 2, 2);}
		
		
		public allocate(bytes: number, current_case: number): boolean {
			if (bytes <= this.len - this.byte) return true;
			this.slot!.state = current_case;
			this.mode        = DONE;
			return false;
		}

//region bits
		
		private bits_byte = -1;
		
		public allocate_(current_case: number): boolean { //space request (20 bytes) for at least one transaction is called once on the first varint, during init_bits
			if (17 < this.len - this.byte) return true;
			
			this.state = current_case;
			this.byte  = this.bits_byte;//trim byte at bits_byte index
			
			this.mode = BITS;
			return false;
		}
		
		public init_bits(current_case: number): boolean {return this.init_bits_(20, current_case);}//varint init_bits
		
		public init_bits_(allocate_bytes: number, current_case: number): boolean {
			if (this.len - this.byte < allocate_bytes) {
				this.slot!.state = current_case;
				this.mode        = DONE;
				return false;
			}
			
			this.bits = 0;
			this.bit  = 0;
			
			this.bits_byte = this.byte++;//reserve space
			return true;
		}
		
		
		//checking if enough data has accumulated in bits, then dumping the filled first byte of bits into the output buffer at the bits_byte index
		//and switching to a new bits_byte location
		public put_bits(src: number, len_bits: number): boolean {
			this.bits |= src << this.bit;
			if ((this.bit += len_bits) < 9) return false;     //exactly 9! not 8! to avoid allocating the next byte after the current one is full. what might be redundant
			
			this.buffer!.setUint8(this.bits_byte, this.bits);
			
			this.bits >>= 8;
			this.bit -= 8;
			
			this.bits_byte = this.byte++;
			return true;
		}
		
		public end_bits() {
			if (0 < this.bit) this.buffer!.setUint8(this.bits_byte, this.bits);
			else this.byte = this.bits_byte;//trim byte at bits_byte index isolated but not used
		}
		
		public continue_bits_at(continue_at_case: number) {
			this.state = continue_at_case;
			this.byte  = this.bits_byte;//trim byte at bits_byte index
			this.mode  = BITS;
		}

//endregion

//region single varint
		public put_varint4(src: number, next_case): boolean {
			
			while (this.byte < this.len) {
				if ((src & ~0x7F) == 0) {
					this.buffer!.setUint8(this.byte++, src);
					return true;
				}
				this.buffer!.setUint8(this.byte++, ~0x7F | src & 0x7F);
				src >>= 7;
			}
			
			this.u4    = src;
			this.state = next_case;
			this.mode  = VARINT4;
			return false;
		}
		
		public put_varint8(src: bigint, next_case): boolean {
			if (src < 0x1_0000_0000) return this.put_varint4(Number(src), next_case);
			
			while (this.byte < this.len) {
				if ((src & ~0x7Fn) == 0n) {
					this.buffer!.setUint8(this.byte++, Number(src));
					return true;
				}
				this.buffer!.setUint8(this.byte++, Number(~0x7Fn | src & 0x7Fn));
				src >>= 7n;
			}
			
			this.u8    = src;
			this.state = next_case;
			this.mode  = VARINT4;
			return false;
		}

//endregion
//region varint collection
		private bytes1(src: number): number {return src < 1 << 8 ? 1 : 2;}
		
		public put_varint21(src: number, continue_at_case: number) {
			const bytes = this.bytes1(src);
			return this.put_varint_(bytes - 1, 1, BigInt(src & 0xFFFF), bytes, continue_at_case);
		}
		
		public put_varint211(src: number, continue_at_case: number) {
			const bytes = this.bytes1(src);
			return this.put_varint_(bytes - 1 << 1 | 1, 2, BigInt(src & 0xFFFF), bytes, continue_at_case);
		}
		
		public zig_zag2(src: number): number {return (src << 1 ^ src >> 15) & 0xFFFF;}
		
		private bytes2(src: number) {return src < 1 << 8 ? 1 : src < 1 << 16 ? 2 : 3;}
		
		public put_varint32(src: number, continue_at_case: number) {
			if (src == 0) return this.put_varint(2, continue_at_case);
			const bytes = this.bytes2(src);
			return this.put_varint_(bytes, 2, BigInt(src & 0xFFFF_FF), bytes, continue_at_case);
		}
		
		public put_varint321(src, continue_at_case) {
			if (src == 0) return this.put_varint(3, continue_at_case);
			const bytes = this.bytes2(src);
			return this.put_varint_(bytes << 1 | 1, 3, BigInt(src & 0xFFFF_FF), bytes, continue_at_case);
		}
		
		
		public zig_zag4(src: number) {return (src << 1 ^ src >> 31) & 0xFFFF_FFFF;}
		
		private bytes3(src) {return src < 1 << 16 ? src < 1 << 8 ? 1 : 2 : src < 1 << 24 ? 3 : 4;}
		
		public put_varint42(src, continue_at_case) {
			const bytes = this.bytes3(src);
			return this.put_varint_(bytes - 1, 2, BigInt(src & 0xFFFF_FFFF), bytes, continue_at_case);
		}
		
		public put_varint421(src, continue_at_case) {
			const bytes = this.bytes3(src);
			return this.put_varint_(bytes - 1 << 1 | 1, 3, BigInt(src & 0xFFFF_FFFF), bytes, continue_at_case);
		}
		
		public zig_zag8(src: bigint): bigint {return src << 1n ^ src >> 63n;}
		
		private bytes4(src: number) {
			return src < 1 << 24 ? src < 1 << 16 ? src < 1 << 8 ? 1 : 2 : 3 :
			       src < 1 << 32 ? 4 :
			       src < 1 << 40 ? 5 :
			       src < 1 << 48 ? 6 : 7;
		}
		
		public put_varint73(src, continue_at_case): boolean {
			if (src == 0) return this.put_varint(3, continue_at_case);
			
			const bytes = this.bytes4(src);
			
			return this.put_varint_(bytes, 3, src, bytes, continue_at_case);
		}
		
		public put_varint731(src, continue_at_case): boolean {
			if (src == 0) return this.put_varint(4, continue_at_case);
			
			const bytes = this.bytes4(src);
			
			return this.put_varint_(bytes << 1 | 1, 4, src, bytes, continue_at_case);
		}
		
		private bytes5(src: bigint) {
			return src < 0 ? 8 : src < 1n << 32n ? src < 1n << 16n ? src < 1n << 8n ? 1 : 2 :
			                                       src < 1 << 24 ? 3 : 4 :
			                     src < 1n << 48n ? src < 1n << 40n ? 5 : 6 :
			                     src < 1n << 56n ? 7 : 8;
		}
		
		
		public put_varint83(src: bigint, continue_at_case): boolean {
			const bytes = this.bytes5(src);
			return this.put_varint_(bytes - 1, 3, src, bytes, continue_at_case);
		}
		
		public put_varint831(src, continue_at_case): boolean {
			
			const bytes = this.bytes5(src);
			return this.put_varint_(bytes - 1 << 1 | 1, 4, src, bytes, continue_at_case);
		}
		
		public put_varint84(src, continue_at_case): boolean {
			if (src == 0) return this.put_varint(4, continue_at_case);
			
			const bytes = this.bytes5(src);
			
			return this.put_varint_(bytes, 4, src, bytes, continue_at_case);
		}
		
		public put_varint841(src, continue_at_case): boolean {
			if (src == 0) return this.put_varint(5, continue_at_case);
			
			const bytes = this.bytes5(src);
			
			return this.put_varint_(bytes << 1 | 1, 5, src, bytes, continue_at_case);
		}
		
		
		private put_varint_(bytes_info: number, bits: number, varint: bigint, bytes: number, continue_at_case: number): boolean {
			
			this.data.setBigUint64(0, varint)//fix value
			this.fix_bytes = 8;
			this.fix_byte  = 8 - bytes;
			
			//            break here is OK
			if (this.put_bits(bytes_info, bits) && this.len - this.byte < 25)    //wost case 83: 3 bits x 3times x 8 bytes
			{
				this.state = continue_at_case;
				this.byte  = this.bits_byte;//rollback
				this.mode  = VARINTS;
				return false;
			}
			
			for (let i = this.fix_byte; i < this.fix_bytes; i++) this.buffer!.setUint8(this.byte++, this.data.getUint8(i))
			
			return true;
		}
		
		public put_varint(bits: number, continue_at_case: number): boolean {
			if (!this.put_bits(0, bits) || 20 < this.len - this.byte) return true;
			this.continue_bits_at(continue_at_case);
			return false;
		}


//endregion
		
		public put_len(len: number, bytes, next_case: number): boolean {
			this.slot!.index_max = len;
			this.slot!.index     = 0;
			return this.put_val(len, bytes, next_case);
		}
		
		
		public no_more_items_(key_value_case: number, end_case: number) {
			if (++this.slot!.index < this.slot!.index_max) return false;
			if (0 < this.index2) {
				this.index_max = this.index2;
				this.state     = key_value_case;
			}
			else this.state = end_case;
			return true;
		}
		
		public no_more_items(next_field_case: number): boolean {
			if (0 < (this.index_max = this.index2)) return false;
			
			this.state = next_field_case;
			return true;
		}

//The method is split. cause of items == 0 no more queries!
		public zero_items(items: number, next_field_case: number): boolean {
			if (items == 0) {
				this.put_sbyte(0);
				this.state = next_field_case;
				return true;
			}
			
			this.index_max = items;
			return false;
		}
		
		
		public put_set_info(null_key_present: boolean, next_field_case: number): boolean {
			let items         = this.index_max;
			let null_key_bits = 0;
			
			if (null_key_present) {
				null_key_bits = 1 << 7;
				if (--items == 0) {
					this.put_sbyte(null_key_bits);
					this.state = next_field_case;
					return true;
				}
			}
			
			this.index_max = items;//key-value items
			const bytes    = this.bytes4value(items);
			
			this.put_byte(null_key_bits | bytes);
			this.put_val(items, bytes, 0);
			return false;
		}
		
		public put_map_info(null_key_present: boolean, null_key_has_value: boolean, keys_null_value_count: number, next_case: number, key_val_case: number, next_field_case: number): boolean {
			let items = this.index_max;
			
			let null_key_bits = null_key_has_value ? 1 << 6 : 0;
			
			if (null_key_present) {
				null_key_bits |= 1 << 7;
				if (--items == 0) {
					this.put_sbyte(null_key_bits);
					this.state = next_field_case;
					return true;
				}
			}
			if (0 < keys_null_value_count) {
				this.index_max                  = keys_null_value_count; //keys with undefined value
				let keys_null_value_count_bytes = this.bytes4value(keys_null_value_count);
				items -= keys_null_value_count;
				this.index2                     = items;//key-value items preserve
				let key_val_count_bytes         = this.bytes4value(items);
				this.put_sbyte(null_key_bits | keys_null_value_count_bytes << 3 | key_val_count_bytes);
				if (0 < items) this.put_val(items, key_val_count_bytes, 0);
				this.put_val(keys_null_value_count, keys_null_value_count_bytes, 0);
				this.state = next_case;
				return false;
			}
			
			this.state     = key_val_case;
			this.index_max = items;//key-value items
			let bytes      = this.bytes4value(items);
			
			this.put_sbyte(null_key_bits | bytes);
			this.put_val(items, bytes, 0);
			return true;
		}
		
		
		public put_base_len(base_len: number, bytes: number, next_case: number): boolean {
			this.slot!.base_index_max = base_len;
			this.slot!.base_index     = 0;
			return this.put_val(base_len, bytes, next_case);
		}
		
		public put_val(src: number, bytes: number, next_case: number): boolean {
			if (this.len - this.byte < bytes) {
				this.data!.setUint32(0, src);
				this.fix_bytes = 4
				this.fix_byte  = 4 - bytes;
				while (this.byte < this.len)
					this.buffer!.setUint8(this.byte++, this.data.getUint8(this.fix_byte++))
				this.slot!.state = next_case;
				this.mode        = VAL;
				return false;
			}
			
			this.put_val4(src, bytes);
			return true;
		}
		
		public put_val4(src: number, bytes: number) {
			let byte = this.byte
			this.byte += bytes;
			switch (bytes) {
				case 4:
					this.buffer!.setUint32(byte, src);
					return
				case 3:
					this.buffer!.setUint16(byte, src >>> 8);
					this.buffer!.setUint8(byte + 2, src);
					return;
				case 2:
					this.buffer!.setUint16(byte, src);
					return;
				case 1:
					this.buffer!.setUint8(byte, src);
					return;
			}
		}
		
		public put_string_(str: string, next_case: number) {
			this.fix_byte = 0;
			if (this.encode(str)) return true;
			this.slot!.state     = next_case;
			this.internal_string = str;
			this.mode            = STR;
			return false;
		}
		
		//readonly utf8encoder = new TextEncoder();
		
		public encode(str: string): boolean {
			
			for (let len = str.length; this.fix_byte < len;) {
				if (this.len - this.byte < 5) return false;    //place for the longest character + one byte per 0xFF line terminator
				const ch = str.charCodeAt(this.fix_byte++);
				if (ch < 0x80) this.buffer!.setUint8(this.byte++, ch);    // Have at most seven bits
				else if (ch < 0x800) {
					this.buffer!.setUint8(this.byte++, 0xc0 | ch >> 6);// 2 bytes, 11 bits
					this.buffer!.setUint8(this.byte++, 0x80 | ch & 0x3f);
				}
				else if (0xD800 <= ch && ch <= 0xDFFF) {
					let ch2 = str.charCodeAt(this.fix_byte);
					if (0xD800 <= ch2 && ch2 < 0xDBFF + 1 && this.fix_byte + 1 < str.length) {
						const ch3 = str.charCodeAt(this.fix_byte + 1);
						if (0xDC00 <= ch3 && ch3 < 0xDFFF + 1)
							ch2 = (ch2 << 10) + ch3 + 0x010000 - (0xD800 << 10) - 0xDC00;
					}
					if (ch2 == ch) this.buffer!.setUint8(this.byte++, '?'.charCodeAt(0));
					else {
						this.buffer!.setUint8(this.byte++, 0xf0 | ch2 >> 18);
						this.buffer!.setUint8(this.byte++, 0x80 | ch2 >> 12 & 0x3f);
						this.buffer!.setUint8(this.byte++, 0x80 | ch2 >> 6 & 0x3f);
						this.buffer!.setUint8(this.byte++, 0x80 | ch2 & 0x3f);
						this.fix_byte++;  // 2 chars
					}
				}
				else {
					this.buffer!.setUint8(this.byte++, 0xe0 | ch >> 12);// 3 bytes, 16 bits
					this.buffer!.setUint8(this.byte++, 0x80 | ch >> 6 & 0x3f);
					this.buffer!.setUint8(this.byte++, 0x80 | ch & 0x3f);
				}
			}
			if (this.len - this.byte == 0) return false;
			this.buffer!.setUint8(this.byte++, 0xFF); // line terminator
			this.fix_byte = 0;
			return true;
		}
		
		
		public retry_at(the_case) {
			this.slot!.state = the_case;
			this.mode        = DONE;
		}
		
		
		public bytes4value(value) {return value < 0xFFFF ? value < 0xFF ? value == 0 ? 0 : 1 : 2 : value < 0xFFFFFF ? 3 : 4;}
		
		public put_sbyte_(src: number, next_case: number) {
			if (this.byte < this.len) {
				this.buffer!.setInt8(this.byte++, src);
				return true;
			}
			this.data.setInt8(0, src);
			this.put_(1, next_case);
			return false;
		}
		
		public put_sbyte(src: number) {this.buffer!.setInt8(this.byte++, src);}
		
		public put_byte_(src: number, next_case: number) {
			if (this.byte < this.len) {
				this.buffer!.setUint8(this.byte++, src);
				return true;
			}
			this.data.setUint8(0, src);
			this.put_(1, next_case);
			return false;
		}
		
		public put_byte(src: number) {this.buffer!.setUint8(this.byte++, src);}
		
		
		public put_short_(src: number, next_case: number) {
			if (this.len - this.byte < 2) {
				this.data.setInt16(0, src);
				this.put_(2, next_case);
				return false;
			}
			this.buffer!.setInt16(this.byte, src);
			this.byte += 2
			return true;
		}
		
		public put_short(src: number) {
			this.buffer!.setInt16(this.byte, src);
			this.byte += 2
		}
		
		public put_char_(src: number, next_case: number) {
			if (this.len - this.byte < 2) {
				this.data.setUint16(0, src);
				this.put_(2, next_case);
				return false;
			}
			this.buffer!.setUint16(this.byte, src);
			this.byte += 2
			return true;
		}
		
		public put_char(src: number) {
			this.buffer!.setUint16(this.byte, src);
			this.byte += 2
		}
		
		public put_ushort_(src: number, next_case: number) {
			if (this.len - this.byte < 2) {
				this.data.setUint16(0, src);
				this.put_(2, next_case);
				return false;
			}
			this.buffer!.setUint16(this.byte, src);
			this.byte += 2
			return true;
		}
		
		public put_ushort(src: number) {
			this.buffer!.setUint16(this.byte, src);
			this.byte += 2
		}
		
		public put_int_(src: number, next_case: number) {
			if (this.len - this.byte < 4) {
				this.data.setInt32(0, src);
				this.put_(4, next_case);
				return false;
			}
			this.buffer!.setInt32(this.byte, src);
			this.byte += 4
			return true;
		}
		
		public put_int(src: number) {
			this.buffer!.setInt32(this.byte, src);
			this.byte += 4
		}
		
		public put_uint_(src: number, next_case: number) {
			if (this.len - this.byte < 4) {
				this.data.setUint32(0, src);
				this.put_(4, next_case);
				return false;
			}
			this.buffer!.setUint32(this.byte, src);
			this.byte += 4
			return true;
		}
		
		public put_uint(src: number) {
			this.buffer!.setUint32(this.byte, src);
			this.byte += 4
		}
		
		public put_long_(src: bigint, next_case: number) {
			if (this.len - this.byte < 8) {
				this.data.setBigInt64(0, src);
				this.put_(8, next_case);
				return false;
			}
			this.buffer!.setBigInt64(this.byte, src);
			this.byte += 8
			return true;
		}
		
		public put_long(src: bigint) {
			this.buffer!.setBigInt64(this.byte, src);
			this.byte += 8
		}
		
		
		public put_ulongː(src: bigint, bytes: number, next_case: number) {
			this.data.setBigUint64(0, src);
			
			if (this.len - this.byte < 8) {
				this.put_(bytes, next_case);
				return false;
			}
			
			bytes += this.byte
			for (let i = 0; this.byte < bytes;)
				this.buffer!.setUint8(this.byte++, this.data.getUint8(i++))
			
			return true;
		}
		
		public put_ulong_(src: bigint, next_case: number) {
			if (this.len - this.byte < 8) {
				this.data.setBigUint64(0, src);
				this.put_(8, next_case);
				return false;
			}
			this.buffer!.setBigUint64(this.byte, src);
			this.byte += 8
			return true;
		}
		
		public put_ulong(src: bigint) {
			this.buffer!.setBigUint64(this.byte, src);
			this.byte += 8
		}
		
		
		public put_float_(this: Transmitter, src: number, next_case) {
			if (this.len - this.byte < 4) {
				this.data.setFloat32(0, src);
				this.put_(4, next_case);
				return false;
			}
			this.buffer!.setFloat32(this.byte, src);
			this.byte += 4
			return true;
		}
		
		public put_float(src: number) {
			this.buffer!.setFloat32(this.byte, src);
			this.byte += 4
		}
		
		public put_double_(src: number, next_case) {
			if (this.len - this.byte < 8) {
				this.data.setFloat64(0, src);
				this.put_(8, next_case);
				return false;
			}
			this.buffer!.setFloat64(this.byte, src);
			this.byte += 8
			return true;
		}
		
		public put_double(src: number) {
			this.buffer!.setFloat64(this.byte, src);
			this.byte += 8
		}
		
		
		private put_(bytes: number, next_case: number) {
			this.slot!.state = next_case;
			this.fix_byte    = this.len - this.byte;
			this.fix_bytes   = bytes
			for (let i = 0; this.byte < this.len;)
				this.buffer!.setUint8(this.byte++, this.data.getUint8(i++))
			this.mode = VAL;
		}
	}
	
	export namespace Transmitter {

//region TransmitterSlot
		export class Slot {
			
			public state: number;
			public src: INT.BytesSrc | undefined;
			
			public base_index: number;
			public base_index2: number;
			public base_index_max: number;
			public fields_nulls: number;
			
			public index: number     = 1;
			public index2: number    = 1;
			public index_max: number = 1;
			
			public next: Slot | undefined;
			public prev: Slot | undefined;
			
			constructor(prev: Slot | undefined) {
				this.prev = prev;
				if (prev) prev.next = this;
			}
			
			toString(this: Slot): String {
				let s = this;
				while (s.prev) s = s.prev;
				var str = "\n";
				for (var i = 0; ; i++) {
					for (var ii = i; 0 < ii; ii--) str += "\t";
					str += typeof s.src + "\n";
					if (s == this) break;
					s = s.next!;
				}
				return str;
			}
			
			context_: ContextExt | undefined;
		}

//endregion

//region TransmitterContext
		
		export class ContextExt extends Context {
			
			next: ContextExt | undefined;
			prev: ContextExt | undefined;
			
			constructor(prev: ContextExt | undefined) {
				super();
				this.prev = prev;
				if (prev) prev.next = this;
			}
		}

//endregion
	}
	
	export namespace Network {
		
		export class Loopback {
			protected readonly src_buffer: ArrayBuffer;
			protected readonly src_view: DataView;
			
			protected bytes_dst ?: AdHoc.EXT.BytesDst;
			
			constructor(buff_size: number, pub: AdHoc.EXT.BytesSrc.Producer, dst ?: AdHoc.EXT.BytesDst) {
				this.src_view = new DataView(this.src_buffer = new ArrayBuffer(buff_size));
				pub.subscribe((src: AdHoc.EXT.BytesSrc) => {
					for (let bytes = 0; 0 < (bytes = src.read(this.src_view, 0, this.src_buffer.byteLength));)
						this.bytes_dst?.write(this.src_view, 0, bytes);
				}, undefined)
				this.bytes_dst = dst;
			}
		}
		
		export class Socket extends Loopback {
			
			private websocket ?: WebSocket;
			
			private readonly server_url: string;
			protected bytes_src ?: AdHoc.EXT.BytesSrc;
			
			constructor(server_url: string, buff_size: number, pub: AdHoc.EXT.BytesSrc.Producer, dst ?: AdHoc.EXT.BytesDst) {
				super(buff_size, pub, dst);
				this.server_url = server_url;
				pub.subscribe(this.handle_new_bytes_of, undefined)
				if (this.bytes_dst = dst) this.be_connected();
			}
			
			handle_new_bytes_of(src: AdHoc.EXT.BytesSrc) {
				if (this.bytes_src) return;
				this.bytes_src = src;
				this.sending();
			}
			
			private on_open(ev: Event) { this.sending() }
			
			private sending() {
				if (this.bytes_src) return
				const timer = setInterval(() => {
					if (this.be_connected()) {
						if (this.websocket?.bufferedAmount === 0) {
							let bytes = this.bytes_src?.read(this.src_view, 0, this.src_buffer.byteLength);
							if (bytes == 0) {
								clearInterval(timer);
								this.bytes_src = undefined;
							}
							else this.websocket?.send(bytes != this.src_buffer.byteLength ? new DataView(this.src_buffer, 0, bytes) : this.src_buffer);
						}
					}
					else clearInterval(timer);
				}, 100);
			}
			
			public set(dst: AdHoc.EXT.BytesDst) {
				this.bytes_dst = dst;
				this.be_connected();
			}
			
			private on_receive(event: MessageEvent) {
				if (event.data instanceof ArrayBuffer) {
					const data = new DataView(event.data);
					this.bytes_dst?.write(data, 0, data.byteLength);
				}
				else {
					//unexpected format
					console.log("Unknown data received");
					console.log(event.data);
				}
			}
			
			reconnect() {
				const timer = setInterval(() => {
					if (!this.bytes_dst && !this.bytes_src || this.be_connected()) clearInterval(timer);
				}, 1000)
			}
			
			
			private be_connected(): boolean {
				
				if (this.websocket)
					switch (this.websocket.readyState) {
						case WebSocket.CONNECTING:
							return false;
						case WebSocket.OPEN:
							return true;
						case WebSocket.CLOSED:
						case WebSocket.CLOSING:
							this.dispose();
							this.websocket            = new WebSocket(this.server_url, "AdHoc"); // create new socket and attach handlers
							this.websocket.binaryType = "arraybuffer";
							this.websocket.addEventListener(WebsocketEvents.open, this.on_open);
							this.websocket.addEventListener(WebsocketEvents.close, this.on_close);
							this.websocket.addEventListener(WebsocketEvents.error, this.on_error_close);
							this.websocket.addEventListener(WebsocketEvents.message, this.on_receive);
					}
				return false;
			}
			
			private dispose() {
				if (this.websocket)       // remove all event-listeners from broken socket
				{
					this.websocket.removeEventListener(WebsocketEvents.open, this.on_open);
					this.websocket.removeEventListener(WebsocketEvents.close, this.on_close);
					this.websocket.removeEventListener(WebsocketEvents.error, this.on_error_close);
					this.websocket.removeEventListener(WebsocketEvents.message, this.on_receive);
					this.websocket = undefined;
				}
			}
			
			public onClose ?: (ev: CloseEvent) => void;
			
			private on_close(event: CloseEvent) {
				this.dispose()
				this.onClose?.call(event);
				this.bytes_dst?.close();
			}
			
			private onErrorClose ?: (event: Event) => void;
			
			//The error event is fired when a connection with a WebSocket has been closed due to an error (some data couldn't be sent for example).
			private on_error_close(ev: Event) {
				this.dispose()
				this.onErrorClose?.call(ev);
				this.bytes_dst?.close();
				this.reconnect();
			}
		}
		
		enum WebsocketEvents {
			open    = 'open',
			close   = 'close',
			error   = 'error',
			message = 'message'
		}
		
	}
	
	
	export function equals_strings(a: string | undefined, b: string | undefined) {
		return a === b || a !== undefined && b !== undefined && a.normalize() !== b.normalize();
	}
	
	
	export function equals_arrays<T>(a1: ArrayLike<T> | undefined, a2: ArrayLike<T> | undefined, equals: (v1: T, v2: T) => boolean, size ?: number): boolean {
		if (a1 === a2) return true
		if (a1 === undefined || a2 === undefined) return false
		if (size == undefined) {
			if ((size = a1.length) !== a2.length) return false
		}
		else if (a1.length < size || a2.length < size) return false
		
		while (-1 < --size)
			if (!equals(a1[size], a2[size])) return false
		
		return true;
	}
	
	export function equals_arrays2<T>(aa1: ArrayLike<ArrayLike<T> | undefined> | undefined, aa2: ArrayLike<ArrayLike<T> | undefined> | undefined, equals: (v1: T, v2: T) => boolean, size ?: number): boolean {
		
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
		
		for (let [k, v] of m1)
			if (m2.has(k)) {
				const v1 = m2.get(k);
				if (v !== v1 && ((v === undefined || v1 === undefined || !equals(v, v1)))) return false
			}
			else return false;
		
		return true;
	}
	
	export function equals_maps2<K, V>(am1: ArrayLike<Map<K, V> | undefined> | undefined, am2: ArrayLike<Map<K, V> | undefined> | undefined, equals: (v1: V, v2: V) => boolean, size ?: number): boolean {
		function equals_fn(a1: Map<K, V> | undefined, a2: Map<K, V> | undefined): boolean {
			return equals_maps(a1, a2, equals)
		}
		
		return equals_arrays(am1, am2, equals_fn, size)
	}
	
	
	export function equals_sets<T>(s1: Set<T> | undefined, s2: Set<T> | undefined): boolean {
		if (s1 === s2) return true
		if (s1 === undefined || s2 === undefined || s1.size !== s2.size) return false
		
		for (let k of s1.keys())
			if (!s2.has(k)) return false;
		
		return true;
	}
	
	export function equals_sets2<K>(as1: ArrayLike<Set<K> | undefined> | undefined, as2: ArrayLike<Set<K> | undefined> | undefined, size ?: number): boolean {
		return equals_arrays(as1, as2, equals_sets, size)
	}
	
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
	
	
	export function hash_boolean(hash: number, bool: boolean | undefined) {return mix(hash, bool === undefined ? 0x1b873593 : bool ? 0x42108421 : 0x42108420)}
	
	export function hash_string(hash: number, str: string | undefined) {
		if (!str) return mix(hash, 17163)
		let i = str.length - 1;
		for (; 1 < i; i -= 2) hash = mix(hash, str.charCodeAt(i) << 16 | str.charCodeAt(i + 1));
		if (0 < i) hash = mixLast(hash, str.charCodeAt(0));
		return finalizeHash(hash, str.length);
	}
	
	// Compress arbitrarily large numbers into smi hashes.
	export function hash_number(hash: number, n: number | undefined) {
		if (!n || n !== n || n === Infinity) return hash;
		let h = n | 0;
		if (h !== n)
			for (h ^= n * 0xffffffff; n > 0xffffffff; h ^= n)
				n /= 0xffffffff;
		return mix(hash, h);
	}
	
	const mask = 2n ^ 53n - 1n
	
	export function hash_bigint(hash: number, n: bigint | undefined) {
		return hash_number(hash, Number(n))
	}
	
	export function hash_bytes(hash: number, data: ArrayLike<number>) {
		let len = data.length, i, k = 0;
		for (i = 0; 3 < len; i += 4, len -= 4)
			hash = mix(hash, data[i] & 0xFF
			                 | (data[i + 1] & 0xFF) << 8
			                 | (data[i + 2] & 0xFF) << 16
			                 | (data[i + 3] & 0xFF) << 24);
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
		let a = 0,
		    b = 0,
		    c = 1;
		
		for (const [k, v] of src) {
			let h = AdHoc.mix(hash, hashK(hash, k));
			h     = AdHoc.mix(h, hashV(hash, v));
			h     = AdHoc.finalizeHash(h, 2);
			a += h;
			b ^= h;
			c *= h | 1;
		}
		return AdHoc.finalizeHash(AdHoc.mixLast(AdHoc.mix(AdHoc.mix(hash, a), b), c), src.size);
	}
	
	
	export function hash_map2<K, V>(hash: number, src: ArrayLike<Map<K, V> | undefined>, hashK: (hash: number, k: K) => number, hashV: (hash: number, v: V) => number): number {
		
		function hasher(hash: number, map: Map<K, V>) {return hash_map(hash, map, hashK, hashV)}
		
		return hash_array(hash, src, hasher, src.length)
	}
	
	
	export function hash_set<K>(hash: number, src: Set<K>, hashK: (hash: number, k: K) => number): number {
		let a = 0,
		    b = 0,
		    c = 1;
		
		for (const k of src) {
			const h = hashK(hash, k);
			a += h;
			b ^= h;
			c *= h | 1;
		}
		return AdHoc.finalizeHash(AdHoc.mixLast(AdHoc.mix(AdHoc.mix(hash, a), b), c), src.size);
	}
	
	export function hash_set2<K>(hash: number, src: ArrayLike<Set<K> | undefined>, hashK: (hash: number, k: K) => number): number {
		
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
		
		const initial   = hashV(hash, src[0]);
		let prev        = hashV(hash, src[1]);
		const rangeDiff = prev - initial;
		hash            = AdHoc.mix(hash, initial);
		
		for (let i = 2; i < size; ++i) {
			hash    = AdHoc.mix(hash, prev);
			const k = hashV(hash, src[i]);
			if (rangeDiff !== k - prev) {
				for (hash = AdHoc.mix(hash, k), ++i; i < size; ++i)
					hash = AdHoc.mix(hash, hashV(hash, src[i]));
				return AdHoc.finalizeHash(hash, size);
			}
			prev = k;
		}
		
		return AdHoc.avalanche(AdHoc.mix(AdHoc.mix(hash, rangeDiff), prev));
	}
	
	export function hash_array2<V>(hash: number, src: ArrayLike<ArrayLike<V> | undefined>, hashV: (hash: number, v: V) => number, size ?: number): number {
		function hasher(hash: number, array: ArrayLike<V> | undefined): number {return array ? hash_array(hash, array, hashV, array.length) : 0}
		
		return hash_array(hash, src, hasher, size)
	}
	
	// v8 has an optimization for storing 31-bit signed numbers.
	// Values which have either 00 or 11 as the high order bits qualify.
	// This function drops the highest order bit in a signed number, maintaining the sign bit.
	export function smi(i32: number) {
		return i32 >>> 1 & 0x40000000 | i32 & 0xbfffffff;
	}
	
	//second parameter in JSON.stringify(). Its correctly stringify Maps
	export function JSON_replacer(key, value) {
		return value instanceof Map ?
		       {
			       dataType: 'Map',
			       value   : [...value.entries()].sort((A, B) => A[0] > B[0] ? 1 : A[0] === B[0] ? 0 : -1),
		       } : value;
	}
	
	export function signed(src: number, bytes: number): number {
		if (bytes == 1) return (src & 0x80) == 0 ? src & 0xFF : (src & 0xFF) - 0x100
		if (bytes == 2) return (src & 0x8000) == 0 ? src & 0xFFFF : (src & 0xFFFF) - 0x1_0000
		if (bytes < 5) return (src & 0x8000_0000) == 0 ? src & 0xFFFF_FFFF : (src & 0xFFFF_FFFF) - 0x1_0000_0000
		
		return (src & 0x8000_0000_0000_0000) == 0 ? src & 0xFFFF_FFFF_FFFF_FFFF : (src & 0xFFFF_FFFF_FFFF_FFFF) - 0x1_0000_0000_0000_0000
	}
	
	export function floatToUintBits(float: number): number {
		return new Uint32Array(new Float32Array([float]).buffer)[0]
	}
	
	export function uintBitsToFloat(uintBits: number): number {
		return new Float32Array(new Uint32Array([uintBits]).buffer)[0]
	}
	
}

export default AdHoc;