// AdHoc protocol - data interchange format and source code generator
// Copyright 2020 Chikirev Sirguy, Unirail Group. All rights reserved.
// al8v5C6HU4UtqE9@gmail.com
// https://github.com/orgs/AdHoc-Protocol
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
//
//     * Redistributions of source code must retain the above copyright
// notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above
// copyright notice, this list of conditions and the following disclaimer
// in the documentation and/or other materials provided with the
// distribution.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

'use strict';
//https: //devdocs.io/javascript/global_objects/uint8clampedarray
import Context from "./Context"


//Use undefined. Do not use undefined. https://github.com/Microsoft/TypeScript/wiki/Coding-guidelines#undefined-and-undefined

export class AdHoc{
	byte: number;
	len: number;
	
	bit: number;
	
	str: string | undefined;
	bits: number;
	buffer: DataView | undefined;
	mode: number;
	
	public readonly tmp = new DataView( new ArrayBuffer( 16 ) );//tmp storage
	tmp_bytes: number;
	
	u4: number;
	u8: bigint;
	bytes_left: number;
}

export namespace AdHoc{
	export namespace EXT{
		export interface BytesSrc{
			subscribe( callback: ( BytesSrc ) => void ): ( BytesSrc ) => void
			
			read( dst ?: DataView, byte ?: number, bytes ?: number ): number
			
			IntBytesSrcProducer( src: AdHoc.INT.BytesSrc.Producer ): AdHoc.INT.BytesSrc.Producer | undefined;
			
			close();
			
			get isOpen(): boolean;
		}
		
		
		export interface BytesDst{
			write( src ?: DataView, byte ?: number, bytes ?: number ): number;
			
			IntBytesDstConsumer( dst: AdHoc.INT.BytesDst.Consumer ): AdHoc.INT.BytesDst.Consumer | undefined;
			
			close();
			
			get isOpen(): boolean;
		}
	}
	export namespace INT{
		export interface BytesDst{
			put_bytes( src: Receiver ): boolean;
		}
		
		export namespace BytesDst{
			export interface Consumer{
				receiving( src: Receiver, id: number ): BytesDst;
				
				received( src: Receiver, dst: BytesDst ): void;
			}
		}
		
		export interface BytesSrc{
			get_bytes( dst: Transmitter ): boolean;
		}
		
		export namespace BytesSrc{
			export interface Producer{
				sending( dst: Transmitter ): BytesSrc | undefined;
				
				sent( dst: Transmitter, src: BytesSrc );
			}
		}
	}
	
	
	function trailingZeros( i: number ): number{
		
		let n = 7;
		i <<= 24;
		let y = i << 4;
		
		if( y != 0 ){
			n -= 4;
			i = y;
		}
		y = i << 2;
		
		return y  ?
		       n - 2 - (y << 1 >>> 31) :
		       n - (i << 1 >>> 31);
	}
	
	
	const OK          = 0xFFFF_FFFF,
	      STR         = OK - 100,
	      RETRY       = STR + 1,
	      VAL4        = RETRY + 1,
	      VAL         = VAL4 + 1,
	      LEN         = VAL + 1,
	      BASE_LEN    = LEN + 1,
	      BITS        = BASE_LEN + 1,
	      BITS_BYTES4 = BITS + 1,
	      BITS_BYTES8 = BITS_BYTES4 + 1,
	      VARINT4     = BITS_BYTES8 + 1,
	      VARINT8     = VARINT4 + 1;
	
	export class Receiver extends AdHoc implements AdHoc.EXT.BytesDst, Context.Provider{
		
		readonly id_bytes: number;//bytes allocated for pack id
		int_dst: AdHoc.INT.BytesDst.Consumer | undefined;
		
		constructor( int_dst: AdHoc.INT.BytesDst.Consumer | undefined, id_bytes: number ){
			super();
			this.bytes_left = 0;
			this.id_bytes   = id_bytes;
			this.int_dst    = int_dst;
		}
		
		IntBytesDstConsumer( dst: AdHoc.INT.BytesDst.Consumer ): AdHoc.INT.BytesDst.Consumer | undefined{
			const tmp    = this.int_dst;
			this.int_dst = dst;
			return tmp;
		}
		
		
		output(): AdHoc.INT.BytesDst | undefined{
			const output         = this.slot!.next!.dst;
			this.slot!.next!.dst = undefined
			return output
		}
		
		
		get state(): number{ return this.slot!.state; }
		
		set state( value: number ){ this.slot!.state = value; }

//region index
		
		get index(): number{ return this.slot!.index }
		
		set index( value: number ){ this.slot!.index = value }
		
		get index_max(): number{ return this.slot!.index_max }
		
		set index_max( len: number ){
			this.slot!.index     = 0
			this.slot!.index_max = len;
		}
		
		index_is_over( is_over_case: number ): boolean{
			if( this.slot!.index < this.slot!.index_max ) return false;
			this.state = is_over_case;
			return true;
		}
		
		next_index(): boolean{ return ++this.slot!.index < this.slot!.index_max; }
		
		next_index_( yes_case: number ): boolean{
			if( ++this.slot!.index < this.slot!.index_max ){
				this.state = yes_case;
				return true;
			}
			return false;
		}

//endregion


//region base_index
		
		get base_index(): number{ return this.slot!.base_index; }
		
		set base_index( value: number ){ this.slot!.base_index = value; }
		
		get base_index_max(): number{ return this.slot!.base_index_max; }
		
		set base_index_max( base_len: number ){
			this.slot!.base_index     = 0;
			this.slot!.base_index_max = base_len;
		}
		
		base_index_is_over( is_over_case: number ): boolean{
			if( this.slot!.base_index < this.slot!.base_index_max ) return false;
			this.state = is_over_case;
			return true;
		}
		
		
		next_base_index(): boolean{ return ++this.slot!.base_index < this.slot!.base_index_max; }
		
		next_base_index_( yes_case: number ): boolean{
			if( ++this.slot!.base_index < this.slot!.base_index_max ){
				this.state = yes_case;
				return true;
			}
			return false;
		}

//endregion
		
		get null_at_index(): boolean{ return !(this.nulls & 1 << (this.index & 7)); }
		
		get nulls(): number{ return this.slot!.items_nulls; }
		
		nulls_( nulls: number, index: number ): void{
			
			this.slot!.index       = index + trailingZeros( nulls );
			this.slot!.items_nulls = nulls;
		}
		
		
		get null_at_base_index(): boolean{ return !(this.base_nulls & 1 << (this.base_index & 7)); }
		
		get base_nulls(): number{ return this.slot!.base_nulls; }
		
		base_nulls_( nulls: number, base_index: number ): void{
			
			this.slot!.base_index = base_index + trailingZeros( nulls );
			this.slot!.base_nulls = nulls;
			
		}
		
		find_exist( index: number ): boolean{
			const nulls = this.buffer!.getUint8( this.byte++ );
			if( !nulls ) return false;
			this.slot!.index       = index + trailingZeros( nulls );
			this.slot!.items_nulls = nulls;
			return true;
		}
		
		find_base_exist( base_index: number ): boolean{
			const nulls = this.buffer!.getUint8( this.byte++ );
			if( !nulls ) return false;
			this.slot!.base_index = base_index + trailingZeros( nulls );
			this.slot!.base_nulls = nulls;
			return true;
		}

//endregion
		get_fields_nulls( this_case: number ): boolean{
			if( this.byte < this.len ){
				this.slot!.fields_nulls = this.buffer!.getUint8( this.byte++ );
				return true;
			}
			
			this.slot!.state = this_case;
			this.mode        = RETRY;
			return false;
		}
		
		is_null( field: number, next_field_case: number ): boolean{
			if( this.slot!.fields_nulls & field ) return false;
			this.state = next_field_case;
			return true;
		}
		
		public is_null_byte( next_field_case: number ): boolean{
			if( this.get_byte() ){
				this.str = "";
				return false;
			}
			this.str   = undefined;
			this.state = next_field_case
			return true;
		}
		
		public is_null_byte_( null_byte: number ): boolean{
			if( (this.buffer === this.cache ?
			     (this.buffer as Receiver.Cache).touch( this.byte ) :
			     this.buffer!.getUint8( this.byte )) === null_byte ){
				
				this.str = undefined;
				this.get_byte()
				return true;
			}
			
			this.str = "";
			return false;
		}
		
		public has_bytes( retry_case: number ): boolean{
			if( this.byte < this.len ) return true;
			this.mode  = RETRY;
			this.state = retry_case;
			return false;
		}

//region Context
		ctx_free: Receiver.ContextExt | undefined;
		ctx_last: Receiver.ContextExt | undefined;
		ctx_ref: WeakRef<Receiver.ContextExt> = new WeakRef( new Receiver.ContextExt() );
		
		public context(): Context{
			
			if( this.slot!.context ) return this.slot!.context;
			
			if( this.ctx_free ) this.slot!.context = this.ctx_free;
			else{
				
				if( this.ctx_last ) return this.slot!.context = this.ctx_last = this.ctx_last.next = new Receiver.ContextExt();
				
				if( !(this.slot!.context = this.ctx_ref.deref()) ){
					this.ctx_ref = new WeakRef( this.slot!.context = this.ctx_last = new Receiver.ContextExt() );
					return this.ctx_last;
				}
				
				for( let s = this.slot!.prev; s; s = s.prev ) if( s.context ) return this.slot!.context = this.ctx_last = s.context.next = new Receiver.ContextExt();
				if( !this.slot!.context.next ) this.ctx_last = this.slot!.context;
			}
			
			this.ctx_free = this.slot!.context.next;
			
			return this.slot!.context;
		}
		
		key(): AdHoc.INT.BytesDst | string | number | bigint | undefined{
			const k                 = this.slot!.context!.key;
			this.slot!.context!.key = undefined
			return k
		}
		
		key_<K extends AdHoc.INT.BytesDst | string | number | bigint | undefined>( key: K ): K{
			this.slot!.context!.key = key;
			return key;
		}
		
		value(): AdHoc.INT.BytesDst | undefined{
			const v                   = this.slot!.context!.value;
			this.slot!.context!.value = undefined;
			return v;
		}
		
		value_( value: AdHoc.INT.BytesDst | undefined ){ this.slot!.context!.value = value; }
		
		
		get_info( the_case: number ): boolean{
			if( this.byte < this.len ){
				this.context();
				this.slot!.context!.info = this.buffer!.getUint8( this.byte++ );
				this.slot!.context!.key  = 0
				return true;
			}
			this.retry_at( the_case );
			return false;
		}
		
		
		get hasNullKey(): boolean{ return (this.slot!.context!.info >> 7 & 1) === 1; }
		
		hasNullKey_( key_val_case: number, end_case: number ): boolean{
			if( this.hasNullKey ) return true;
			this.state = this.index_max ?
			             key_val_case :
			             end_case;
			
			return false;
		}
		
		hasNullKey$( null_values_case: number, key_val_case: number, next_field_case: number ): boolean{
			const hasNullKey = this.hasNullKey;
			if( hasNullKey && this.nullKeyHasValue ) return true;    //not jump. step to send value of key == undefined
			
			//if key == undefined does not exists or it's value == undefined
			//no need to receive value,  so can calculate next jump
			this.state = 0 < this.index_max ?
			             null_values_case : //jump to send keys which value == undefined
			             0 < (this.index_max = this.slot!.context!.key as number) ?
			             key_val_case :// jump to send KV
			             next_field_case;
			
			return hasNullKey;
		}
		
		get nullKeyHasValue(): boolean{ return (this.slot!.context!.info >> 6 & 1) === 1; }
		
		get_items_count( next_case: number ): boolean{ return this.get_len( this.slot!.context!.info & 7, next_case ); }
		
		null_values_count( next_case: number ): boolean{
			this.key_( this.index_max );//preserve total items count
			return this.get_len( this.slot!.context!.info >> 3 & 7, next_case );
		}
		
		get items_count(): number{
			return this.slot!.context!.key as number + this.index_max + (this.hasNullKey ?
			                                                             1 :
			                                                             0);
		}
		
		no_null_values( key_val_case: number, end_case: number ): boolean{
			if( 0 < this.index_max ) return false;     //no keys which value == undefined
			
			this.state = 0 < (this.index_max = this.slot!.context!.key as number) ?
			             key_val_case :
			             end_case;// KV
			return true;
		}
		
		no_key_val( end_case: number ): boolean{
			if( 0 < (this.index_max = this.slot!.context!.key as number) ) return false
			this.state = end_case
			return true
		}

//endregion
		
		u4_: number = 0
		
		get idle(): boolean{ return !this.slot; }
		
		close(){ }
		
		get isOpen(): boolean{ return this.slot !== undefined}


//region Slot
		slot: Receiver.Slot | undefined;
		slot_ref: WeakRef<Receiver.Slot> = new WeakRef( new Receiver.Slot( undefined ) );
		
		free_slot(): void{
			if( !this.slot ) return;
			
			for( let s: Receiver.Slot | undefined = this.slot; s != undefined; s = s.next ) s.dst = undefined;
			
			this.ctx_free = undefined;
			this.ctx_last = undefined;
			this.slot     = undefined;
		}

//endregion
		
		// if src == undefined - clear and reset
		write( src ?: DataView, byte ?: number, bytes ?: number ): number{
			
			if( !src ){
				if( !this.slot ) return 0;
				this.free_slot();
				this.cache.reset();
				
				this.buffer     = undefined;
				this.mode       = OK;
				this.bytes_left = 0;
				this.u4         = 0;
				this.u8         = 0n;
				this.str        = undefined;
				return 0;
			}
			
			this.byte = byte ?
			            byte :
			            0;
			this.len  = bytes ?
			            bytes + this.byte :
			            src.byteLength;
			
			const remaining = this.len - this.byte;
			if( remaining < 1 ) return 0
			
			this.buffer = src;
			write:
				for( ; ; ){
					if( this.slot && this.slot.dst )
						switch( this.mode ){
							case VAL:
								if( this.cache.complete() ) break;
								break write;
							case LEN:
								if( !this.cache.complete() ) break write;
								this.index_max = this.get4();
								break;
							case VARINT4:
								if( this.len - this.byte && this.retry_get_varint4( this.state ) ) break;
								break write;
							case VARINT8:
								if( this.len - this.byte && this.retry_get_varint8( this.state ) ) break;
								break write;
							case BASE_LEN:
								if( !this.cache.complete() ) break write;
								this.base_index_max = this.get4();
								break;
							case STR:
								if( !this.String() ) break write;
								break;
						}
					else{
						if( !this.cache.try_get( this.id_bytes ) ){
							this.free_slot();
							break;
						}
						
						const dst = this.int_dst!.receiving( this, this.get4_( this.id_bytes ) );
						if( !dst ){
							this.free_slot();
							break
						}
						
						if( !this.slot ) if( !(this.slot = this.slot_ref.deref()) ) this.slot_ref = new WeakRef( this.slot = new Receiver.Slot( undefined ) );
						
						this.slot.dst    = dst;
						this.bytes_left  = 0;
						this.u8          = 0n;
						this.slot!.state = 0;
					}
					
					this.mode = OK;
					for( ; ; )
						if( !this.slot!.dst!.put_bytes( this ) ) break write;//data over
						else{
							if( this.slot.context != undefined ){
								this.ctx_free     = this.slot!.context;
								this.slot.context = undefined;
							}
							
							if( this.slot!.prev ) this.slot = this.slot!.prev;
							else break;
						}
					
					this.int_dst!.received( this, this.slot!.dst! );//dispatching
					this.slot!.dst = undefined; //mark ready to receive next package
				}//write:
			
			this.buffer = undefined;
			
			return remaining;
		}
		
		try_get( get_case: number ): boolean{ return this.try_get_( this.bytes_left, get_case ); }
		
		try_get_( bytes: number, get_case: number, mode_on_retry: number = VAL ): boolean{
			
			if( this.cache.try_get( bytes ) ) return true;
			
			this.mode        = mode_on_retry;
			this.slot!.state = get_case;
			return false;
		}
		
		no_items_data( retry_at_case: number, no_items_case: number ): boolean{
			for( let nulls: number; this.byte < this.len; ){
				if( (nulls = this.buffer?.getUint8( this.byte++ )!) != 0 ){
					this.slot!.index += trailingZeros( this.slot!.items_nulls = nulls );
					return false;
				}
				if( this.slot!.index_max <= (this.slot!.index += 8) ){
					this.state = no_items_case;
					return false;
				}
			}
			this.retry_at( retry_at_case );
			return true;
		}
		
		public no_index( on_fail_case: number, on_fail_fix_index: number ): boolean{
			if( this.byte < this.len ) return false;
			this.retry_at( on_fail_case );
			this.index = on_fail_fix_index;
			return true;
		}
		
		public no_base_index( on_fail_case: number, fix_base_index_on_fail: number ): boolean{
			if( this.byte < this.len ) return false;
			this.retry_at( on_fail_case );
			this.base_index = fix_base_index_on_fail;
			return true;
		}
		
		get remaining(): number{ return this.len - this.byte; }
		
		get position(): number{ return this.byte; }
		
		retry_at( the_case: number ){
			this.slot!.state = the_case;
			this.mode        = RETRY;
		}


//region bits
		
		public init_bits()  //bits receiving init
		{
			this.bits = 0;
			this.bit  = 8;
		}
		
		get get_bits(): number{ return this.u4; }
		
		
		public get_bits_( len_bits: number ): number{
			let ret: number;
			if( this.bit + len_bits < 9 ){
				ret = this.bits >> this.bit & 0xFF >> 8 - len_bits;
				this.bit += len_bits;
			}
			else{
				ret      = (this.bits >> this.bit | (this.bits = this.buffer!.getUint8( this.byte++ )) << 8 - this.bit) & 0xFF >> 8 - len_bits;
				this.bit = this.bit + len_bits - 8;
			}
			
			return ret;
		}
		
		public try_get_bits( len_bits: number, this_case: number ): boolean{
			if( this.bit + len_bits < 9 ){
				this.u4 = this.bits >> this.bit & 0xFF >> 8 - len_bits;
				this.bit += len_bits;
			}
			else if( this.byte < this.len ){
				this.u4  = (this.bits >> this.bit | (this.bits = this.buffer!.getUint8( this.byte++ )) << 8 - this.bit) & 0xFF >> 8 - len_bits;
				this.bit = this.bit + len_bits - 8;
			}
			else{
				this.retry_at( this_case );
				return false;
			}
			return true;
		}

//endregion


//region varint
		
		public try_get_varint_bits1( bits: number, this_case: number ): boolean{
			if( !this.try_get_bits( bits, this_case ) ) return false;
			this.bytes_left = this.get_bits + 1;
			return true;
		}
		
		public try_get_varint_bits( bits: number, this_case: number ): boolean{
			if( !this.try_get_bits( bits, this_case ) ) return false;
			this.bytes_left = this.get_bits;
			return true;
		}
		
		
		public try_get_varint4( next_case: number ): boolean{
			this.u4         = 0;
			this.bytes_left = 0;
			
			return this.retry_get_varint4( next_case );
		}
		
		private retry_get_varint4( next_case: number ): boolean{
			
			while( this.byte < this.len ){
				const i = this.buffer!.getInt8( this.byte++ );
				const v = i & 0x7F
				
				if( this.bytes_left + 7 < 33 ) this.u4 |= v << this.bytes_left
				else
					this.u4 = 32 < this.bytes_left ?
					          (~~(this.u4 / 0xFFFF_FFFF) | v << this.bytes_left - 32) * 0x1_0000_0000 + (~~this.u4 >>> 0) :
					          (v >>> 7 - (31 - this.bytes_left)) * 0x1_0000_0000 + ((this.u4 | (v & 0x7F >>> 31 - this.bytes_left) << this.bytes_left) >>> 0)
				
				if( -1 < i ) return true;
				
				this.bytes_left += 7;
			}
			
			this.state = next_case;
			this.mode  = VARINT4;
			return false;
		}
		
		public try_get_varint8( next_case: number ): boolean{
			this.u4         = 0;
			this.bit        = 0;
			this.bytes_left = 28;//28=7 * 4
			this.tmp_bytes  = 0;
			
			return this.retry_get_varint8( next_case );
		}
		
		private retry_get_varint8( next_case: number ): boolean{
			
			while( this.byte < this.len ){
				const b = this.buffer!.getInt8( this.byte++ );
				if( b < 0 ){
					if( this.bit === this.bytes_left ){
						if( this.bytes_left === 31 )
							throw Error( "Alarm. Overflow on decoding varint." )
						
						this.tmp_bytes = (this.u4 | b << 28) >>> 0
						
						this.u4         = b >> 4 & 0x7
						this.bit        = 3
						this.bytes_left = 31 //Alarm bit 31 = 3 + 7 * 4
					}
					else{
						this.u4 |= (b & 0x7F) << this.bit;
						this.bit += 7;
					}
					continue;
				}
				
				this.u4 |= b << this.bit;
				
				if( this.bytes_left === 31 )
					if( this.bit < 14 )// 53(safe bit) = (7 + this.bit + 32)
						this.u8 = BigInt( this.u4 * 0x1_0000_0000 + this.tmp_bytes )
					else{
						// very, very rarely visited place
						this.tmp.setUint32( 0, this.u4 )
						this.tmp.setUint32( 4, this.tmp_bytes )
						this.u8 = this.tmp.getBigUint64( 0 )
					}
				else this.u8 = BigInt( this.u4 )
				
				return true;
			}
			this.state = next_case;
			this.mode  = VARINT8;
			return false;
		}

//endregion
		
		
		public get_sbyte(): number{
			const ret = this.buffer!.getInt8( this.byte );
			this.byte += 1;
			return ret;
		}
		
		public get_byte(): number{
			const ret = this.buffer!.getUint8( this.byte );
			this.byte += 1;
			return ret;
		}
		
		public get_short(): number{
			const ret = this.buffer!.getInt16( this.byte );
			this.byte += 2;
			return ret;
		}
		
		public get_char(): number{
			const ret = this.buffer!.getUint16( this.byte );
			this.byte += 2;
			return ret;
		}
		
		public get_ushort(): number{
			const ret = this.buffer!.getUint16( this.byte );
			this.byte += 2;
			return ret;
		}
		
		public get_int(): number{
			const ret = this.buffer!.getInt32( this.byte );
			this.byte += 4;
			return ret;
		}
		
		public get_uint(): number{
			const ret = this.buffer!.getUint32( this.byte );
			this.byte += 4;
			return ret;
		}
		
		public get_long(): bigint{
			const ret = this.buffer!.getBigInt64( this.byte );
			this.byte += 8;
			return ret;
		}
		
		public to_long( hi: number, lo: number ): bigint{
			this.tmp.setUint32( 0, hi );
			this.tmp.setUint32( 4, lo );
			return this.tmp.getBigInt64( 0 );
		}
		
		public to_long_( hi: number, ulo: number ): number{
			return hi < 0 ?
			       hi * 0x1_0000_0000 - ulo :
			       hi * 0x1_0000_0000 + ulo
		}
		
		public get_ulong(): bigint{
			const ret = this.buffer!.getBigUint64( this.byte );
			this.byte += 8;
			return ret;
		}
		
		
		public to_ulong( hi: number, lo: number ): bigint{
			this.tmp.setUint32( 0, hi );
			this.tmp.setUint32( 4, lo );
			return this.tmp.getBigUint64( 0 );
		}
		
		public intBitsToFloat( bits: number ): number{
			this.tmp.setUint32( 0, bits );
			return this.tmp.getFloat32( 0 );
		}
		
		public get_float(): number{
			const ret = this.buffer!.getFloat32( this.byte );
			this.byte += 4;
			return ret;
		}
		
		public get_double(): number{
			const ret = this.buffer!.getFloat64( this.byte );
			this.byte += 8;
			return ret;
		}
		
		public get4(): number{return this.get4_( this.bytes_left )}
		
		
		public get4_( bytes: number ): number{
			const byte = this.byte
			this.byte += bytes;
			
			switch( bytes ){
				case 7:
					return this.buffer!.getUint8( byte ) * 0x1_0000_0000_0000 + this.buffer!.getUint16( byte + 1 ) * 0x1_0000_0000 + this.buffer!.getUint32( byte + 3 )
				case 6:
					return this.buffer!.getUint16( byte ) * 0x1_0000_0000 + this.buffer!.getUint32( byte + 2 )
				case 5:
					return this.buffer!.getUint8( byte ) * 0x1_0000_0000 + this.buffer!.getUint32( byte + 1 )
				case 4:
					return this.buffer!.getUint32( byte )
				case 3:
					return this.buffer!.getUint16( byte ) << 8 | this.buffer!.getUint8( byte + 2 );
				case 2:
					return this.buffer!.getUint16( byte )
			}
			return this.buffer!.getUint8( byte )
		}
		
		public get4_signed( bytes: number ): number{
			const byte = this.byte
			this.byte += bytes;
			let hi     = 0, lo = 0
			switch( bytes ){
				case 7:
					hi = this.buffer!.getInt8( byte ) * 0x1_0000_0000_0000
					lo = this.buffer!.getUint16( byte + 1 ) * 0x1_0000_0000 + this.buffer!.getUint32( byte + 3 )
					break;
				case 6:
					hi = this.buffer!.getInt16( byte ) * 0x1_0000_0000
					lo = this.buffer!.getUint32( byte + 2 )
					break
				case 5:
					hi = this.buffer!.getInt8( byte ) * 0x1_0000_0000
					lo = this.buffer!.getUint32( byte + 1 )
				case 4:
					return this.buffer!.getInt32( byte )
				case 3:
					return this.buffer!.getInt16( byte ) << 8 | this.buffer!.getUint8( byte + 2 );
				case 2:
					return this.buffer!.getInt16( byte )
				case 1:
					return this.buffer!.getInt8( byte )
			}
			
			return hi < 0 ?
			       hi - lo :
			       hi + lo
			
		}
		
		public get8(): bigint{return this.get8_( this.bytes_left )}
		
		public get8_( bytes: number ): bigint{
			const byte = this.byte
			this.byte += bytes;
			
			switch( bytes ){
				case 8:
					return this.buffer!.getBigUint64( byte );
				case 7:
					this.tmp.setUint8( 0, 0 );
					this.tmp.setUint32( 1, this.buffer!.getUint32( byte ) )
					this.tmp.setUint16( 5, this.buffer!.getUint16( byte + 4 ) )
					this.tmp.setUint8( 7, this.buffer!.getUint8( byte + 6 ) )
					return this.tmp.getBigUint64( 0 );
				case 6:
					this.tmp.setUint16( 0, 0 );
					this.tmp.setUint32( 2, this.buffer!.getUint32( byte ) )
					this.tmp.setUint16( 6, this.buffer!.getUint16( byte + 4 ) )
					return this.tmp.getBigUint64( 0 );
				case 5:
					this.tmp.setUint32( 0, 0 );
					this.tmp.setUint32( 3, this.buffer!.getUint32( byte ) )
					this.tmp.setUint8( 7, this.buffer!.getUint8( byte + 4 ) )
					return this.tmp.getBigUint64( 0 );
				case 4:
					return BigInt( this.buffer!.getUint32( byte ) )
				case 3:
					return BigInt( this.buffer!.getUint16( byte ) << 8 | this.buffer!.getUint8( byte + 2 ) );
				case 2:
					return BigInt( this.buffer!.getUint16( byte ) )
			}
			return BigInt( this.buffer!.getUint8( byte ) )
		}
		
		public get8_signed( bytes: number ): bigint{
			const byte = this.byte
			this.byte += bytes;
			let hi     = 0
			switch( bytes ){
				case 8:
					return this.buffer!.getBigInt64( byte );
				case 7:
					
					this.tmp.setUint8( hi = this.buffer!.getInt32( byte ) < 0 ?
					                        -1 :
					                        0, 0 );
					this.tmp.setUint32( 1, hi )
					this.tmp.setUint16( 5, this.buffer!.getUint16( byte + 4 ) )
					this.tmp.setUint8( 7, this.buffer!.getUint8( byte + 6 ) )
					return this.tmp.getBigInt64( 0 );
				case 6:
					this.tmp.setUint16( hi = this.buffer!.getInt32( byte ) ?
					                         -1 :
					                         0, 0 );
					this.tmp.setUint32( 2, hi )
					this.tmp.setUint16( 6, this.buffer!.getUint16( byte + 4 ) )
					return this.tmp.getBigUint64( 0 );
				case 5:
					this.tmp.setUint32( hi = this.buffer!.getInt32( byte ) ?
					                         -1 :
					                         0, 0 );
					this.tmp.setUint32( 3, hi );
					this.tmp.setUint8( 7, this.buffer!.getUint8( byte + 4 ) )
					return this.tmp.getBigUint64( 0 );
				case 4:
					return BigInt( this.buffer!.getInt32( byte ) )
				case 3:
					return BigInt( this.buffer!.getInt16( byte ) << 8 | this.buffer!.getUint8( byte + 2 ) );
				case 2:
					return BigInt( this.buffer!.getInt16( byte ) )
			}
			return BigInt( this.buffer!.getInt8( byte ) )
		}
		
		
		private readonly cache = new Receiver.Cache( this );
		
		public get_string(): string{//getting result internal loading
			
			const ret = this.str;
			this.str  = undefined;
			return ret!;
		}
		
		public try_get_string( get_string_case: number ): boolean{
			
			this.str        = undefined;
			this.bytes_left = 0;
			const start     = this.byte
			
			while( this.byte < this.len )
				if( this.buffer!.getUint8( this.byte++ ) === 0xFF ){
					if( start < this.byte - 1 ) this.str = this.utf8decoder.decode( this.buffer!.buffer.slice( start, this.byte - 1 ) );
					return true;
				}
			
			this.str = this.utf8decoder.decode( this.buffer!.buffer.slice( start, this.byte ), {stream: true} );
			
			this.slot!.state = get_string_case;
			this.mode        = STR;
			return false;
		}
		
		private readonly utf8decoder = new TextDecoder();
		
		private String(): boolean{
			
			const start = this.byte
			while( this.byte < this.len )
				if( this.buffer!.getUint8( this.byte++ ) === 0xFF ){
					this.str += this.utf8decoder.decode( this.buffer!.buffer.slice( start, this.byte - 1 ) );
					return true
				}
			
			this.str += this.utf8decoder.decode( this.buffer!.buffer.slice( start, this.byte ), {stream: true} );
			
			return false;
		}
		
		
		get_len( bytes: number, next_case: number ): boolean{
			if( !bytes ){
				this.index_max = 0;
				return true;
			}
			if( this.try_get_( bytes, next_case, LEN ) ){
				this.index_max = this.get4_( bytes );
				return true;
			}
			this.bytes_left = bytes;
			return false;
		}
		
		get_base_len( bytes: number, next_case: number ): boolean{
			if( !bytes ){
				this.base_index_max = 0;
				return true;
			}
			
			if( this.try_get_( bytes, next_case, BASE_LEN ) ){
				this.base_index_max = this.get4_( bytes );
				return true;
			}
			
			return false;
		}
		
		get_bytes<T extends INT.BytesDst>( dst: T ): T{
			this.state = 0
			dst.put_bytes( this );
			return dst
		}
		
		get_bytes_<DST extends INT.BytesDst>( dst: DST, next_case: number ): DST | undefined{
			const s                                             = this.slot!;
			(this.slot = s.next ??= new Receiver.Slot( s )).dst = dst;
			this.state                                          = 0
			
			if( dst.put_bytes( this ) ){
				if( this.slot!.context != undefined ){
					this.ctx_free      = this.slot!.context;
					this.slot!.context = undefined;
				}
				this.slot = s;
				return dst
			}
			
			s.state = next_case
			
			return undefined
		}
		
		get root(): INT.BytesDst | undefined{
			let s = this.slot!;
			while( s.prev ) s = s.prev;
			return s.dst
		}
		
		toString( this: Receiver ): string{
			let s = this.slot!;
			while( s.prev ) s = s.prev;
			let str = "Receiver\n";
			for( let i = 0; ; i++ ){
				for( let ii = i; 0 < ii; ii-- ) str += "\t";
				str += `${Object.prototype.toString.call( s.dst )}\t${s.state}\t${s.index}\t${s.base_index} \n`;
				if( s === this.slot ) break;
				s = s.next!;
			}
			return str;
		}
	}
	
	export namespace Receiver{
		
		export function zig_zag( src: number ): number{ return -(src & 1) ^ src >>> 1; }
		
		export function zig_zag4( src: number ): number{
			return src < 2147483648 ?
			       -(src & 1) ^ src >>> 1 :
			       binary( -binary( src, and, 1 ), xor, unary( src, shiftRight, 1 ) )
		}
		
		export function zig_zag8( src: bigint ): bigint{ return -(src & 1n) ^ src >> 1n; }
		
		export class Cache extends DataView{
			
			public readonly dst: AdHoc.Receiver;
			public tail: DataView | undefined;
			
			constructor( dst: AdHoc.Receiver ){
				super( new ArrayBuffer( 16 ) );
				this.dst = dst;
			}
			
			private bytes = 0
			private byte  = 0
			
			public reset(){
				this.bytes = 0
				this.byte  = 0
				this.tail  = undefined
			}
			
			public complete(): boolean{
				if( !this.bytes ) return true
				
				if( this.dst.len - this.dst.byte < this.bytes - this.byte ){
					for( let max = this.dst.len - this.dst.byte; this.byte < max; ) //just store available bytes
						this.setUint8( this.byte++, this.dst.buffer!.getUint8( this.dst.byte++ ) )
					return false
				}
				
				this.dst.byte   = this.bytes = -this.byte
				this.tail       = this.dst.buffer
				this.dst.buffer = this;//flip storage
				return true
			}
			
			public try_get( bytes: number ): boolean{
				if( 0 < this.bytes ) return this.complete()
				
				const available = this.dst.len - this.dst.byte
				
				if( !available ) return false;
				if( bytes <= available ) return true;
				
				this.byte  = 0
				this.bytes = bytes
				while( this.byte < available ) this.setUint8( this.byte++, this.dst.buffer!.getUint8( this.dst.byte++ ) )
				return false
			}
			
			public touch( byte: number ): number{return super.getUint8( byte );}
			
			getInt8( byte: number ): number{return super.getInt8( this.read_from( byte, 1 ) );}
			
			getUint8( byte: number ): number{return super.getUint8( this.read_from( byte, 1 ) );}
			
			getInt16( byte: number, littleEndian ?: boolean ): number{return super.getInt16( this.read_from( byte, 2 ), littleEndian );}
			
			getUint16( byte: number, littleEndian ?: boolean ): number{return super.getUint16( this.read_from( byte, 2 ), littleEndian );}
			
			getInt32( byte: number, littleEndian ?: boolean ): number{return super.getInt32( this.read_from( byte, 4 ), littleEndian );}
			
			getUint32( byte: number, littleEndian ?: boolean ): number{return super.getUint32( this.read_from( byte, 4 ), littleEndian );}
			
			getBigInt64( byte: number, littleEndian ?: boolean ): bigint{return super.getBigInt64( this.read_from( byte, 8 ), littleEndian );}
			
			getBigUint64( byte: number, littleEndian ?: boolean ): bigint{return super.getBigUint64( this.read_from( byte, 8 ), littleEndian );}
			
			getFloat32( byte: number, littleEndian ?: boolean ): number{return super.getFloat32( this.read_from( byte, 4 ), littleEndian );}
			
			getFloat64( byte: number, littleEndian ?: boolean ): number{return super.getFloat64( this.read_from( byte, 8 ), littleEndian );}
			
			private read_from( byte: number, bytes: number ): number{
				if( bytes < -byte ) return byte - this.bytes;
				
				byte = byte - this.bytes
				
				for( let read = 0, write = -this.bytes, write_max = byte + bytes; write < write_max; )
					super.setUint8( write++, this.tail!.getUint8( read++ ) )
				
				this.bytes      = 0;//mark not in use
				this.dst.buffer = this.tail
				this.tail       = undefined
				
				return byte
			}
		}
		
		//region Slot
		export class Slot{
			
			public state: number = 0;
			public dst: INT.BytesDst | undefined;
			
			public base_index: number;
			public base_index_max: number;
			public base_nulls: number;
			
			public fields_nulls: number;
			
			public index: number       = 1;
			public index_max: number   = 1;
			public items_nulls: number = 0;
			
			public next: Slot | undefined;
			public prev: Slot | undefined;
			
			constructor( prev: Slot | undefined ){
				this.prev = prev;
				if( prev ) prev.next = this;
			}
			
			
			context: ContextExt | undefined;
		}

//endregion

//region ContextExt
		export class ContextExt extends Context{
			
			info: number;
			key: INT.BytesDst | string | number | bigint | undefined = 0;
			value: INT.BytesDst | undefined;
			
			next: ContextExt | undefined;
		}

//endregion
		
		
	}
	
	export abstract class Transmitter extends AdHoc implements AdHoc.EXT.BytesSrc, Context.Provider{
		IntBytesSrcProducer( src: AdHoc.INT.BytesSrc.Producer ): AdHoc.INT.BytesSrc.Producer | undefined{
			const tmp    = this.int_src;
			this.int_src = src;
			return tmp;
		}
		
		abstract subscribe( callback: ( BytesSrc ) => void ): ( BytesSrc ) => void
		
		int_src: AdHoc.INT.BytesSrc.Producer;
//region value pack transfer
		int_bigints_src: () => bigint | undefined;
		int_numbers_src: () => number | undefined;
		
		pull4(){
			const value = this.int_numbers_src()
			if( value ){
				this.str = ""
				this.u4  = value
			}
			else this.str = undefined
		}
		
		pull8(){
			const value = this.int_bigints_src()
			if( value ){
				this.str = ""
				this.u8  = value
			}
			else this.str = undefined
		}
		
		put_bytes8_( src: bigint | undefined, handler: INT.BytesSrc, next_case: number ): boolean{
			if( src ){
				this.u8  = src!
				this.str = ""
			}
			else this.str = undefined
			return this.put_bytes_( handler, next_case )
		}
		
		put_bytes8( src: bigint, handler: INT.BytesSrc ){
			this.u8 = src
			return this.put_bytes( handler )
		}
		
		put_bytes4_( src: number | undefined, handler: INT.BytesSrc, next_case: number ): boolean{
			if( src ){
				this.u4  = src!
				this.str = ""
			}
			else this.str = undefined
			return this.put_bytes_( handler, next_case )
		}
		
		put_bytes4( src: number, handler: INT.BytesSrc ){
			this.u4 = src
			return this.put_bytes( handler )
		}

//endregion
		
		put_bytes( src: INT.BytesSrc ){
			
			this.state = 1 //skip write id
			src.get_bytes( this )
		}
		
		put_bytes_( src: INT.BytesSrc, next_case: number ): boolean{
			
			const s = this.slot!;
			
			(this.slot = s.next ??= new Transmitter.Slot( s )).src = src;
			this.slot.state                                        = 1 //skip write id
			
			if( src.get_bytes( this ) ){
				
				if( this.slot!.context != undefined ){
					this.ctx_free      = this.slot!.context;
					this.slot!.context = undefined;
				}
				
				this.slot = s;
				return true
			}
			
			s.state = next_case
			return false
		}
		
		
		constructor( int_src: AdHoc.INT.BytesSrc.Producer, int_numbers_src: () => number | undefined, int_bigints_src: () => bigint | undefined ){
			super();
			this.int_src = int_src;
			
			this.int_numbers_src = int_numbers_src;
			this.int_bigints_src = int_bigints_src;
		}
		
		close(){
		}
		
		get isOpen(): boolean{ return this.slot !== undefined}


//region Context
		
		ctx_free: Transmitter.ContextExt | undefined;
		ctx_last: Transmitter.ContextExt | undefined;
		ctx_ref: WeakRef<Transmitter.ContextExt> = new WeakRef( new Transmitter.ContextExt() );
		
		public context(): Context{
			
			if( this.slot!.context ) return this.slot!.context;
			
			if( this.ctx_free ) this.slot!.context = this.ctx_free;
			else{
				
				if( this.ctx_last ) return this.slot!.context = this.ctx_last = this.ctx_last.next = new Receiver.ContextExt();
				
				if( !(this.slot!.context = this.ctx_ref.deref()) ){
					this.ctx_ref = new WeakRef( this.slot!.context = this.ctx_last = new Receiver.ContextExt() );
					return this.ctx_last;
				}
				
				for( let s = this.slot!.prev; s; s = s.prev ) if( s.context ) return this.slot!.context = this.ctx_last = s.context.next = new Receiver.ContextExt();
				if( !this.slot!.context.next ) this.ctx_last = this.slot!.context;
			}
			
			this.ctx_free = this.slot!.context.next;
			
			return this.slot!.context;
		}

//endregion
		
		
		get state(): number{ return this.slot!.state; }
		
		set state( value: number ){ this.slot!.state = value; }
		
		get position(): number{ return this.byte; }
		
		get remaining(): number{ return this.len - this.byte; }

//region index2
		
		get index2(): number{ return this.slot!.index2 }
		
		set index2( value: number ){ this.slot!.index2 = value }
		
		public next_index2(): boolean{return ++this.slot!.index < this.slot!.index2;}
		
		set base_index2( value: number ){this.slot!.base_index2 = value;}
		
		public next_base_index2(): boolean{return ++this.slot!.base_index < this.slot!.base_index2}

//endregion

//region index
		
		get index(): number{ return this.slot!.index }
		
		set index( value: number ){ this.slot!.index = value }
		
		get index_max(){ return this.slot!.index_max }
		
		set index_max( max: number ){
			this.slot!.index     = 0
			this.slot!.index_max = max;
		}
		
		public index_less_max( jump_case: number ): boolean{
			if( this.slot!.index_max <= this.slot!.index ) return false;
			this.state = jump_case;
			return true;
		}
		
		index_is_over( is_over_case: number ): boolean{
			if( this.slot!.index < this.slot!.index_max ) return false;
			this.state = is_over_case;
			return true;
		}
		
		public next_index(): boolean{return ++this.slot!.index < this.slot!.index_max;}
		
		public next_index_( yes_case: number ): boolean{
			if( ++this.slot!.index < this.slot!.index_max ){
				this.state = yes_case;
				return true;
			}
			return false;
		}
		
		public next_index$( yes_case: number, no_case: number ): boolean{
			
			if( ++this.slot!.index < this.slot!.index_max ){
				this.state = yes_case;
				return true;
			}
			this.state = no_case;
			return false;
		}
		
		
		public index_next( next_state: number ): number{
			++this.slot!.index;
			this.state = this.slot!.index_max === this.slot!.index ?
			             next_state + 1 :
			             next_state;
			return this.slot!.index - 1;
		}

//endregion


//region base_index
		
		get base_index(): number{ return this.slot!.base_index; }
		
		set base_index( value: number ){ this.slot!.base_index = value; }
		
		get base_index_max(): number{ return this.slot!.base_index_max; }
		
		set base_index_max( base_len: number ){
			this.slot!.base_index     = 0;
			this.slot!.base_index_max = base_len;
		}
		
		
		public next_base_index(): boolean{return ++this.slot!.base_index < this.slot!.base_index_max}
		
		public next_base_index_( yes_case: number ): boolean{
			if( ++this.slot!.base_index < this.slot!.base_index_max ){
				this.state = yes_case;
				return true;
			}
			return false;
		}
		
		public base_index_less_max( jump_case: number ): boolean{
			if( this.slot!.base_index_max <= this.slot!.base_index ) return false;
			this.state = jump_case;
			return true;
		}

//endregion
		public init_fields_nulls( field0_bit: number, this_case: number ): boolean{
			if( !this.allocate( 1, this_case ) ) return false;
			this.slot!.fields_nulls = field0_bit;
			return true;
		}
		
		public set_fields_nulls( field: number ){this.slot!.fields_nulls |= field;}
		
		public flush_fields_nulls(){this.buffer!.setUint8( this.byte++, this.slot!.fields_nulls );}
		
		public is_null( field: number, next_field_case: number ){
			if( !(this.slot!.fields_nulls & field) ){
				this.state = next_field_case;
				return true;
			}
			return false;
		}

//region Slot
		
		slot: Transmitter.Slot | undefined;
		slot_ref = new WeakRef( new Transmitter.Slot( undefined ) );
		
		free_slot(): void{
			if( !this.slot ) return;
			
			for( let s: Transmitter.Slot | undefined = this.slot; s != undefined; s = s.next ) s.src = undefined;
			
			this.ctx_free = undefined;
			this.ctx_last = undefined;
			this.slot     = undefined;
		}

//endregion
		
		// if dst == undefined - clean / reset state
		//
		// if 0 < return - bytes read
		// if return == 0 - not enough space available
		// if return == -1 -  no more packets left
		read( dst ?: DataView, byte ?: number, bytes ?: number ): number{
			if( !dst )    //reset
			{
				if( !this.slot ) return -1;
				this.free_slot()
				
				this.buffer     = undefined;
				this.mode       = OK;
				this.bytes_left = 0;
				this.u4         = 0;
				this.u8         = 0n;
				this.str        = undefined;
				return -1;
			}
			this.byte = byte ?
			            byte :
			            0;
			this.len  = bytes ?
			            this.byte + bytes :
			            dst.byteLength;
			
			if( this.len - this.byte < 1 ) return 0;
			
			this.buffer    = dst;
			const position = this.byte;
			read:
				for( ; ; ){
					if( this.slot && this.slot.src )
						switch( this.mode )     //restore transition state
						{
							case STR:
								if( !this.encode( this.str! ) ) break read;      //there is not enough space in the provided buffer for further work
								this.str = undefined;
								break;
							case VAL:
								do{
									this.buffer.setUint8( this.byte++, this.tmp.getUint8( this.bytes_left++ ) )
									if( this.byte === this.len ) break read;
								} while( this.bytes_left < this.tmp_bytes );
								break;
							case BITS_BYTES4:
								if( this.len - this.byte < this.bits_transaction_bytes_ ) break read;    //space for one full transaction
								this.bits_byte = this.byte;//preserve space for bits info
								this.byte++;
								this.put_4( this.u4, this.bytes_left )
								break;
							case BITS_BYTES8:
								if( this.len - this.byte < this.bits_transaction_bytes_ ) break read;    //space for one full transaction
								this.bits_byte = this.byte;//preserve space for bits info
								this.byte++;
								this.put_8( this.u8, this.bytes_left )
								break;
							case VARINT4:
								if( this.byte < this.len && this.put_varint4( this.u4, this.state ) ) break;
								break read;
							case VARINT8:
								if( this.byte < this.len && this.put_varint8( this.u8, this.state ) ) break;
								break read;
							case BITS:
								if( this.len - this.byte < this.bits_transaction_bytes_ ) break read;//space for one full transaction
								this.bits_byte = this.byte;//preserve space for bits info
								this.byte      = this.bits_byte + 1;
								break;
						}
					else{
						const src = this.int_src!.sending( this );
						if( !src ){
							this.free_slot();
							break
						}
						
						if( !this.slot ) if( !(this.slot = this.slot_ref!.deref()) ) this.slot_ref = new WeakRef( this.slot = new Transmitter.Slot( undefined ) );
						
						this.slot.src   = src;
						this.slot.state = 0; //write id request
						this.u4         = 0;
						this.bytes_left = 0;
						this.slot.index = 0;
					}
					
					this.mode = OK;
					for( ; ; )
						if( !this.slot!.src!.get_bytes( this ) ) break read;
						else{
							if( this.slot.context != undefined ){
								this.ctx_free     = this.slot!.context;
								this.slot.context = undefined;
							}
							
							if( this.slot!.prev ) this.slot = this.slot!.prev;
							else break;
						}
					
					this.int_src!.sent( this, this.slot.src! );
					this.slot!.src = undefined; //data request label of the next packet
				}//read:
			
			const ret   = this.byte - position;
			this.buffer = undefined;
			
			return 0 < ret ?
			       ret :
			       -1;
		}
		
		
		public put_bool( src: boolean ){
			this.put_bits( src ?
			               1 :
			               0, 1 );
		}
		
		public put_bool_( src: boolean | undefined ){
			this.put_bits( src == undefined ?
			               0 :
			               src ?
			               1 :
			               2, 2 );
		}
		
		
		public allocate( bytes: number, this_case: number ): boolean{
			this.slot!.state = this_case;//!! set always? and first. used to skip pack.id step in get_bytes of value packs
			if( bytes <= this.remaining ) return true;
			this.mode = RETRY;
			return false;
		}

//region bits
		
		private bits_byte               = -1;
		private bits_transaction_bytes_ = 0
		
		public init_bits_( transaction_bytes: number, this_case: number ): boolean{
			if( (this.bits_transaction_bytes_ = transaction_bytes) <= this.remaining ) return true;
			
			this.state = this_case;
			this.byte  = this.bits_byte;//trim byte at bits_byte index
			
			this.mode = BITS;
			return false;
		}
		
		
		public init_bits( transaction_bytes: number, this_case: number ): boolean{
			if( this.len - this.byte < (this.bits_transaction_bytes_ = transaction_bytes) ){
				this.slot!.state = this_case;
				this.mode        = RETRY;
				return false;
			}
			
			this.bits = 0;
			this.bit  = 0;
			
			this.bits_byte = this.byte++;//allocate space
			return true;
		}
		
		public put_bits( src: number, len_bits: number ): void{
			this.bits |= src << this.bit;
			if( (this.bit += len_bits) < 9 ) return;     //exactly 9! not 8! to avoid allocating the next byte after the current one is full. what might be redundant
			
			this.buffer!.setUint8( this.bits_byte, this.bits );
			
			this.bits >>= 8;
			this.bit -= 8;
			
			this.bits_byte = this.byte++;
		}
		
		public put_bits_( src: number, len_bits: number, continue_at_case: number ): boolean{
			this.bits |= src << this.bit;
			if( (this.bit += len_bits) < 9 ) return true;     //exactly 9! not 8! to avoid allocating the next byte after the current one is full. what might be redundant
			
			this.buffer!.setUint8( this.bits_byte, this.bits );
			
			this.bits >>= 8;
			this.bit -= 8;
			if( this.remaining < this.bits_transaction_bytes_ ){
				this.state = continue_at_case;
				return false;
			}
			this.bits_byte = this.byte++;
			return true;
		}
		
		public end_bits(){
			if( 0 < this.bit ) this.buffer!.setUint8( this.bits_byte, this.bits );
			else this.byte = this.bits_byte;//trim byte at bits_byte index isolated but not used
		}
		
		public put_nulls( nulls: number, nulls_bits: number, continue_at_case: number ): boolean{
			if( this.put_bits_( nulls, nulls_bits, continue_at_case ) ) return true;
			
			this.mode = BITS;
			return false;
		}
		
		public continue_bits_at( continue_at_case: number ){
			this.state = continue_at_case;
			this.byte  = this.bits_byte;//trim byte at bits_byte index
			this.mode  = BITS;
		}

//endregion
		
		public put_bits_bytes4( info: number, info_bits: number, value: number, value_bytes: number, continue_at_case: number ): boolean{
			
			if( this.put_bits_( info, info_bits, continue_at_case ) ){
				this.put_4( value, value_bytes )
				return true;
			}
			
			this.u4         = value;
			this.bytes_left = value_bytes;
			this.state      = continue_at_case;
			this.mode       = BITS_BYTES4;
			return false;
		}
		
		public put_bits_bytes8( info: number, info_bits: number, value: bigint, value_bytes: number, continue_at_case: number ): boolean{
			
			if( this.put_bits_( info, info_bits, continue_at_case ) ){
				this.put_8( value, value_bytes )
				return true;
			}
			
			this.u8         = value;
			this.bytes_left = value_bytes;
			this.state      = continue_at_case;
			this.mode       = BITS_BYTES8;
			return false;
		}


//region varint
		private bytes1( src: number ): number{
			return src < 0x100 ?
			       1 :
			       2;
		}
		
		public put_varint21( src: number, continue_at_case: number ){
			const bytes = this.bytes1( src );
			return this.put_bits_bytes4( bytes - 1, 1, src, bytes, continue_at_case );
		}
		
		public put_varint21_( src: number, continue_at_case: number, nulls: number, nulls_bits: number ){
			const bytes = this.bytes1( src );
			return this.put_bits_bytes4( bytes - 1 << nulls_bits | nulls, nulls_bits + 1, src, bytes, continue_at_case );
		}
		
		
		private bytes2( src: number ){
			return src < 0x100 ?
			       1 :
			       src < 0x1_0000 ?
			       2 :
			       3;
		}
		
		public put_varint32( src: number, continue_at_case: number ){
			const bytes = this.bytes2( src );
			return this.put_bits_bytes4( bytes, 2, src, bytes, continue_at_case );
		}
		
		public put_varint32_( src: number, continue_at_case: number, nulls: number, nulls_bits: number ){
			const bytes = this.bytes2( src );
			return this.put_bits_bytes4( bytes << nulls_bits | nulls, nulls_bits + 2, src, bytes, continue_at_case );
		}
		
		
		private bytes3( src: number ){
			return src < 0x1_0000 ?
			       src < 0x100 ?
			       1 :
			       2 :
			       src < 0x100_0000 ?
			       3 :
			       4;
		}
		
		public put_varint42( src: number, continue_at_case: number ){
			const bytes = this.bytes3( src );
			return this.put_bits_bytes4( bytes - 1, 2, src, bytes, continue_at_case );
		}
		
		public put_varint42_( src: number, continue_at_case: number, nulls: number, nulls_bits: number ){
			const bytes = this.bytes3( src );
			return this.put_bits_bytes4( bytes - 1 << nulls_bits | nulls, nulls_bits + 2, src, bytes, continue_at_case );
		}
		
		
		private bytes4( src: number ){
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
		
		public put_varint73( src: number, continue_at_case: number ): boolean{
			const bytes = this.bytes4( src );
			return this.put_bits_bytes4( bytes, 3, src, bytes, continue_at_case );
		}
		
		public put_varint73_( src: number, continue_at_case: number, nulls: number, nulls_bits: number ): boolean{
			const bytes = this.bytes4( src );
			return this.put_bits_bytes4( bytes << nulls_bits | nulls, nulls_bits + 3, src, bytes, continue_at_case );
		}
		
		private bytes4n( src: bigint ){
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
		
		public put_varint73n( src: bigint, continue_at_case: number ): boolean{
			const bytes = this.bytes4n( src );
			return this.put_bits_bytes8( bytes, 3, src, bytes, continue_at_case );
		}
		
		public put_varint73n_( src: bigint, continue_at_case: number, nulls: number, nulls_bits: number ): boolean{
			const bytes = this.bytes4n( src );
			return this.put_bits_bytes8( bytes << nulls_bits | nulls, nulls_bits + 3, src, bytes, continue_at_case );
		}
		
		private bytes5( src: bigint ): number{
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
		
		
		public put_varint83( src: bigint, continue_at_case: number ): boolean{
			const bytes = this.bytes5( src );
			return this.put_bits_bytes8( bytes - 1, 3, src, bytes, continue_at_case );
		}
		
		public put_varint83_( src: bigint, continue_at_case: number, nulls: number, nulls_bits: number ): boolean{
			const bytes = this.bytes5( src );
			return this.put_bits_bytes8( bytes - 1 << nulls_bits | nulls, nulls_bits + 3, src, bytes, continue_at_case );
		}
		
		public put_varint84( src: bigint, continue_at_case: number ): boolean{
			const bytes = this.bytes5( src );
			return this.put_bits_bytes8( bytes, 4, src, bytes, continue_at_case );
		}
		
		public put_varint84_( src: bigint, continue_at_case: number, nulls: number, nulls_bits: number ): boolean{
			const bytes = this.bytes5( src );
			return this.put_bits_bytes8( bytes << nulls_bits | nulls, nulls_bits + 4, src, bytes, continue_at_case );
		}
		
		
		// src - has value is in 0 to  Number.MAX_SAFE_INTEGER	range
		public put_varint4( src: number, next_case ): boolean{
			
			while( this.byte < this.len ){
				
				if( src < 0x80 ){
					this.buffer!.setUint8( this.byte++, src );
					return true;
				}
				
				this.buffer!.setUint8( this.byte++, 0x80 | src & 0x7F );
				
				if( src < 0xFFFF_FFFF )
					src >>>= 7;
				else
					src = unary( src, shiftRightUnsigned, 7 );
			}
			
			this.u4    = src;
			this.state = next_case;
			this.mode  = VARINT4;
			return false;
		}
		
		public put_varint8( src: bigint, next_case ): boolean{
			if( src < Number.MAX_SAFE_INTEGER ) return this.put_varint4( Number( src ), next_case );
			
			// very, very rarely visited place
			while( this.byte < this.len ){
				if( src < 0x80 ){
					this.buffer!.setUint8( this.byte++, Number( src ) );
					return true;
				}
				this.buffer!.setUint8( this.byte++, Number( 0x80n | src & 0x7Fn ) );
				src >>= 7n;
			}
			
			this.u8    = src;
			this.state = next_case;
			this.mode  = VARINT8;
			return false;
		}

//endregion
		
		public put_len( len: number, bytes, next_case: number ): boolean{
			this.slot!.index_max = len;
			this.slot!.index     = 0;
			return this.put_4_( len, bytes, next_case );
		}
		
		
		public no_more_items_( key_value_case: number, end_case: number ){
			if( ++this.slot!.index < this.slot!.index_max ) return false;
			if( 0 < this.index2 ){
				this.index_max = this.index2;
				this.state     = key_value_case;
			}
			else this.state = end_case;
			return true;
		}
		
		public no_more_items( next_field_case: number ): boolean{
			if( 0 < (this.index_max = this.index2) ) return false;
			
			this.state = next_field_case;
			return true;
		}
		
		
		public zero_items( items: number, next_field_case: number ): boolean{
			if( !items ){
				this.put_sbyte( 0 );
				this.state = next_field_case;
				return true;
			}
			
			this.index_max = items;
			return false;
		}
		
		
		public put_set_info( null_key_present: boolean, next_field_case: number ): boolean{
			let items         = this.index_max;
			let null_key_bits = 0;
			
			if( null_key_present ){
				null_key_bits = 1 << 7;
				if( !--items ){
					this.put_sbyte( null_key_bits );
					this.state = next_field_case;
					return true;
				}
			}
			
			this.index_max = items;//key-value items
			const bytes    = this.bytes4value( items );
			
			this.put_byte( null_key_bits | bytes );
			this.put_4_( items, bytes, 0 );
			return false;
		}
		
		public put_map_info( null_key_present: boolean, null_key_has_value: boolean, keys_null_value_count: number, next_case: number, key_val_case: number, next_field_case: number ): boolean{
			let items = this.index_max;
			
			let null_key_bits = null_key_has_value ?
			                    1 << 6 :
			                    0;
			
			if( null_key_present ){
				null_key_bits |= 1 << 7;
				if( !--items ){
					this.put_sbyte( null_key_bits );
					this.state = next_field_case;
					return true;
				}
			}
			if( 0 < keys_null_value_count ){
				this.index_max                    = keys_null_value_count; //keys with undefined value
				const keys_null_value_count_bytes = this.bytes4value( keys_null_value_count );
				items -= keys_null_value_count;
				this.index2                       = items;//key-value items preserve
				const key_val_count_bytes         = this.bytes4value( items );
				this.put_sbyte( null_key_bits | keys_null_value_count_bytes << 3 | key_val_count_bytes );
				if( 0 < items ) this.put_4_( items, key_val_count_bytes, 0 );
				this.put_4_( keys_null_value_count, keys_null_value_count_bytes, 0 );
				this.state = next_case;
				return false;
			}
			
			this.state     = key_val_case;
			this.index_max = items;//key-value items
			const bytes    = this.bytes4value( items );
			
			this.put_sbyte( null_key_bits | bytes );
			this.put_4_( items, bytes, 0 );
			return true;
		}
		
		
		public put_base_len( base_len: number, bytes: number, next_case: number ): boolean{
			this.slot!.base_index_max = base_len;
			this.slot!.base_index     = 0;
			return this.put_4_( base_len, bytes, next_case );
		}
		
		public put_string( str: string, next_case: number ){
			this.bytes_left = 0;
			if( this.encode( str ) ) return true;
			this.slot!.state = next_case;
			this.str         = str;
			this.mode        = STR;
			return false;
		}
		
		//readonly utf8encoder = new TextEncoder();
		
		private encode( str: string ): boolean{
			
			for( const len = str.length; this.bytes_left < len; ){
				if( this.len - this.byte < 5 ) return false;    //place for the longest character + one byte per 0xFF line terminator
				const ch = str.charCodeAt( this.bytes_left++ );
				if( ch < 0x80 ) this.buffer!.setUint8( this.byte++, ch );    // Have at most seven bits
				else if( ch < 0x800 ){
					this.buffer!.setUint8( this.byte++, 0xc0 | ch >> 6 );// 2 bytes, 11 bits
					this.buffer!.setUint8( this.byte++, 0x80 | ch & 0x3f );
				}
				else if( 0xD800 <= ch && ch <= 0xDFFF ){
					let ch2 = str.charCodeAt( this.bytes_left );
					if( 0xD800 <= ch2 && ch2 < 0xDBFF + 1 && this.bytes_left + 1 < str.length ){
						const ch3 = str.charCodeAt( this.bytes_left + 1 );
						if( 0xDC00 <= ch3 && ch3 < 0xDFFF + 1 ) ch2 = (ch2 << 10) + ch3 + 0x010000 - (0xD800 << 10) - 0xDC00;
					}
					if( ch2 === ch ) this.buffer!.setUint8( this.byte++, '?'.charCodeAt( 0 ) ); else{
						this.buffer!.setUint8( this.byte++, 0xf0 | ch2 >> 18 );
						this.buffer!.setUint8( this.byte++, 0x80 | ch2 >> 12 & 0x3f );
						this.buffer!.setUint8( this.byte++, 0x80 | ch2 >> 6 & 0x3f );
						this.buffer!.setUint8( this.byte++, 0x80 | ch2 & 0x3f );
						this.bytes_left++;  // 2 chars
					}
				}
				else{
					this.buffer!.setUint8( this.byte++, 0xe0 | ch >> 12 );// 3 bytes, 16 bits
					this.buffer!.setUint8( this.byte++, 0x80 | ch >> 6 & 0x3f );
					this.buffer!.setUint8( this.byte++, 0x80 | ch & 0x3f );
				}
			}
			if( !(this.len - this.byte) ) return false;
			this.buffer!.setUint8( this.byte++, 0xFF ); // line terminator
			this.bytes_left = 0;
			return true;
		}
		
		
		public retry_at( the_case ){
			this.slot!.state = the_case;
			this.mode        = RETRY;
		}
		
		
		public bytes4value( value ){
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
		
		public put_sbyte_( src: number, next_case: number ){
			if( this.byte < this.len ){
				this.buffer!.setInt8( this.byte++, src );
				return true;
			}
			this.tmp.setInt8( 0, src );
			this.tmp_to_buffer( 1, next_case );
			return false;
		}
		
		public put_sbyte( src: number ){this.buffer!.setInt8( this.byte++, src );}
		
		public put_byte_( src: number, next_case: number ): boolean{
			if( this.byte < this.len ){
				this.buffer!.setUint8( this.byte++, src );
				return true;
			}
			this.tmp.setUint8( 0, src );
			this.tmp_to_buffer( 1, next_case );
			return false;
		}
		
		public put_byte( src: number ): boolean{
			this.buffer!.setUint8( this.byte++, src );
			return true;
		}
		
		
		public put_short_( src: number, next_case: number ){
			if( this.len - this.byte < 2 ){
				this.tmp.setInt16( 0, src );
				this.tmp_to_buffer( 2, next_case );
				return false;
			}
			this.buffer!.setInt16( this.byte, src );
			this.byte += 2
			return true;
		}
		
		public put_short( src: number ){
			this.buffer!.setInt16( this.byte, src );
			this.byte += 2
		}
		
		public put_char_( src: number, next_case: number ){
			if( this.len - this.byte < 2 ){
				this.tmp.setUint16( 0, src );
				this.tmp_to_buffer( 2, next_case );
				return false;
			}
			this.buffer!.setUint16( this.byte, src );
			this.byte += 2
			return true;
		}
		
		public put_char( src: number ){
			this.buffer!.setUint16( this.byte, src );
			this.byte += 2
		}
		
		public put_ushort_( src: number, next_case: number ){
			if( this.len - this.byte < 2 ){
				this.tmp.setUint16( 0, src );
				this.tmp_to_buffer( 2, next_case );
				return false;
			}
			this.buffer!.setUint16( this.byte, src );
			this.byte += 2
			return true;
		}
		
		public put_ushort( src: number ){
			this.buffer!.setUint16( this.byte, src );
			this.byte += 2
		}
		
		public put_int_( src: number, next_case: number ){
			if( this.len - this.byte < 4 ){
				this.tmp.setInt32( 0, src );
				this.tmp_to_buffer( 4, next_case );
				return false;
			}
			this.buffer!.setInt32( this.byte, src );
			this.byte += 4
			return true;
		}
		
		public put_int( src: number ){
			this.buffer!.setInt32( this.byte, src );
			this.byte += 4
		}
		
		public put_uint_( src: number, next_case: number ){
			if( this.len - this.byte < 4 ){
				this.tmp.setUint32( 0, src );
				this.tmp_to_buffer( 4, next_case );
				return false;
			}
			this.buffer!.setUint32( this.byte, src );
			this.byte += 4
			return true;
		}
		
		public put_uint( src: number ){
			this.buffer!.setUint32( this.byte, src );
			this.byte += 4
		}
		
		public put_4_( src: number, bytes: number, next_case: number ): boolean{
			if( this.len - this.byte < bytes ){
				this.put( src, this.tmp, 0, bytes );
				this.tmp_to_buffer( bytes, next_case );
				return false;
			}
			
			this.put_4( src, bytes );
			return true;
		}
		
		public put_4( src: number, bytes: number ){
			this.put( src, this.buffer!, this.byte, bytes )
			this.byte += bytes;
		}
		
		private put( src: number, dst: DataView, byte: number, bytes: number ){
			switch( bytes ){
				case 7:
					dst.setUint8( byte, src / 0x1_0000_0000_0000 | 0 );
					dst.setUint16( byte + 1, src / 0x1_0000_0000 | 0 );
					dst.setUint32( byte + 3, src );
					return
				case 6:
					dst.setUint16( byte, src / 0x1_0000_0000 | 0 );
					dst.setUint32( byte + 2, src );
					return
				case 5:
					dst.setUint8( byte, src / 0x1_0000_0000 | 0 );
					dst.setUint32( byte + 1, src );
					return;
				case 4:
					dst.setUint32( byte, src );
					return
				case 3:
					dst.setUint16( byte, src >>> 8 );
					dst.setUint8( byte + 2, src );
					return;
				case 2:
					dst.setUint16( byte, src );
					return;
				case 1:
					dst.setUint8( byte, src );
					return;
			}
		}
		
		
		public put_long_( src: bigint, next_case: number ){
			if( this.len - this.byte < 8 ){
				this.tmp.setBigInt64( 0, src );
				this.tmp_to_buffer( 8, next_case );
				return false;
			}
			this.buffer!.setBigInt64( this.byte, src );
			this.byte += 8
			return true;
		}
		
		public put_long( src: bigint ){
			this.buffer!.setBigInt64( this.byte, src );
			this.byte += 8
		}
		
		
		public put_ulong_( src: bigint, next_case: number ){
			if( this.len - this.byte < 8 ){
				this.tmp.setBigUint64( 0, src );
				this.tmp_to_buffer( 8, next_case );
				return false;
			}
			this.buffer!.setBigUint64( this.byte, src );
			this.byte += 8
			return true;
		}
		
		public put_ulong( src: bigint ){
			this.buffer!.setBigUint64( this.byte, src );
			this.byte += 8
		}
		
		public floatToIntBits( float: number ): number{
			this.tmp.setFloat32( 0, float );
			return this.tmp.getUint32( 0 );
		}
		
		public put_float_( this: Transmitter, src: number, next_case ){
			if( this.len - this.byte < 4 ){
				this.tmp.setFloat32( 0, src );
				this.tmp_to_buffer( 4, next_case );
				return false;
			}
			this.buffer!.setFloat32( this.byte, src );
			this.byte += 4
			return true;
		}
		
		public put_float( src: number ){
			this.buffer!.setFloat32( this.byte, src );
			this.byte += 4
		}
		
		public put_double_( src: number, next_case ){
			if( this.len - this.byte < 8 ){
				this.tmp.setFloat64( 0, src );
				this.tmp_to_buffer( 8, next_case );
				return false;
			}
			this.buffer!.setFloat64( this.byte, src );
			this.byte += 8
			return true;
		}
		
		public put_double( src: number ){
			this.buffer!.setFloat64( this.byte, src );
			this.byte += 8
		}
		
		public put_8_( src: bigint, bytes: number, next_case: number ){
			
			if( bytes <= this.len - this.byte ) return this.put_8( src, bytes )
			
			this.tmp.setBigUint64( 0, src );
			this.tmp_to_buffer( 8, next_case, 8 - bytes );
			return false;
		}
		
		public put_8( src: bigint, bytes: number ){
			if( bytes === 8 ){
				this.buffer!.setBigUint64( this.byte, src );
				this.byte += 8;
				return
			}
			this.tmp.setBigUint64( 0, src );
			
			for( let i = 8 - bytes; i < 8; ) this.buffer!.setUint8( this.byte++, this.tmp.getUint8( i++ ) )
			
			return true;
		}
		
		
		private tmp_to_buffer( bytes: number, next_case: number, byte: number = 0 ){
			this.slot!.state = next_case;
			this.bytes_left  = this.len - this.byte;
			this.tmp_bytes   = bytes
			while( this.byte < this.len ) this.buffer!.setUint8( this.byte++, this.tmp.getUint8( byte++ ) )
			this.mode = VAL;
		}
		
		get root(): INT.BytesSrc | undefined{
			let s = this.slot!;
			while( s.prev ) s = s.prev;
			return s.src
		}
		
		toString( this: Transmitter ): string{
			let s = this.slot!;
			while( s.prev ) s = s.prev;
			let str = "Transmitter\n";
			for( let i = 0; ; i++ ){
				for( let ii = i; 0 < ii; ii-- ) str += "\t";
				str += `${Object.prototype.toString.call( s.src )}}\t${s.state}\t${s.index}\t${s.base_index} \n`;
				if( s === this.slot ) break;
				s = s.next!;
			}
			return str;
		}
		
		hi( value: bigint ): number{
			this.tmp.setBigUint64( 0, value )
			return this.tmp.getUint32( 0 )
		}
		
		lo(): number{return this.tmp.getUint32( 4 )}
	}
	
	export namespace Transmitter{
		export function zig_zag( src: number, bits: number ): number{return (src << 1 ^ src >> bits) >>> 0;}
		
		export function zig_zag4( src: number, bits: number ){
			return src < -2147483648 || 2147483647 < src ?
			       binary( unary( src, shiftLeft, 1 ), xor, unary( src, shiftRight, bits ) ) :
			       (src << 1 ^ src >> bits) >>> 0
		}
		
		export function zig_zag8( src: bigint, bits: bigint ): bigint{return src << 1n ^ src >> bits;}

//region TransmitterSlot
		export class Slot{
			
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
			
			constructor( prev: Slot | undefined ){
				this.prev = prev;
				if( prev ) prev.next = this;
			}
			
			context: ContextExt | undefined;
		}

//endregion

//region TransmitterContext
		
		export class ContextExt extends Context{
			
			next: ContextExt | undefined;
		}

//endregion
	}
	
	export namespace Network{
		
		export class Loopback{
			protected readonly src_buffer: ArrayBuffer;
			protected readonly src_view: DataView;
			
			protected bytes_dst ?: AdHoc.EXT.BytesDst;
			
			constructor( buff_size: number, src: AdHoc.EXT.BytesSrc, dst ?: AdHoc.EXT.BytesDst ){
				this.src_view = new DataView( this.src_buffer = new ArrayBuffer( buff_size ) );
				src.subscribe( ( src: AdHoc.EXT.BytesSrc ) => {
					for( let bytes = 0; 0 < (bytes = src.read( this.src_view, 0, this.src_buffer.byteLength )); ) this.bytes_dst?.write( this.src_view, 0, bytes );
				} )
				this.bytes_dst = dst;
			}
		}
		
		export class Socket extends Loopback{
			
			private websocket ?: WebSocket;
			
			private readonly server_url: string;
			protected bytes_src ?: AdHoc.EXT.BytesSrc;
			
			constructor( server_url: string, buff_size: number, src: AdHoc.EXT.BytesSrc, dst ?: AdHoc.EXT.BytesDst ){
				super( buff_size, src, dst );
				this.server_url = server_url;
				src.subscribe( this.handle_new_bytes_of )
				if( this.bytes_dst = dst ) this.be_connected();
			}
			
			handle_new_bytes_of( src: AdHoc.EXT.BytesSrc ){
				if( this.bytes_src ) return;
				this.bytes_src = src;
				this.sending();
			}
			
			private on_open( ev: Event ){ this.sending() }
			
			private sending(){
				if( this.bytes_src ) return
				const timer = setInterval( () => {
					if( this.be_connected() ){
						if( !this.websocket?.bufferedAmount ){
							const bytes = this.bytes_src?.read( this.src_view, 0, this.src_buffer.byteLength );
							if( bytes )
								this.websocket?.send( bytes != this.src_buffer.byteLength ?
								                      new DataView( this.src_buffer, 0, bytes ) :
								                      this.src_buffer );
							else{
								clearInterval( timer );
								this.bytes_src = undefined;
							}
						}
					}
					else clearInterval( timer );
				}, 100 );
			}
			
			public set( dst: AdHoc.EXT.BytesDst ){
				this.bytes_dst = dst;
				this.be_connected();
			}
			
			private on_receive( event: MessageEvent ){
				if( event.data instanceof ArrayBuffer ){
					const data = new DataView( event.data );
					this.bytes_dst?.write( data, 0, data.byteLength );
				}
				else{
					//unexpected format
					console.log( "Unknown data received" );
					console.log( event.data );
				}
			}
			
			reconnect(){
				const timer = setInterval( () => {
					if( !this.bytes_dst && !this.bytes_src || this.be_connected() ) clearInterval( timer );
				}, 1000 )
			}
			
			
			private be_connected(): boolean{
				
				if( this.websocket ) switch( this.websocket.readyState ){
					case WebSocket.CONNECTING:
						return false;
					case WebSocket.OPEN:
						return true;
					case WebSocket.CLOSED:
					case WebSocket.CLOSING:
						this.dispose();
						this.websocket            = new WebSocket( this.server_url, "AdHoc" ); // create new socket and attach handlers
						this.websocket.binaryType = "arraybuffer";
						this.websocket.addEventListener( WebsocketEvents.open, this.on_open );
						this.websocket.addEventListener( WebsocketEvents.close, this.on_close );
						this.websocket.addEventListener( WebsocketEvents.error, this.on_error_close );
						this.websocket.addEventListener( WebsocketEvents.message, this.on_receive );
				}
				return false;
			}
			
			private dispose(){
				if( this.websocket )       // remove all event-listeners from broken socket
				{
					this.websocket.removeEventListener( WebsocketEvents.open, this.on_open );
					this.websocket.removeEventListener( WebsocketEvents.close, this.on_close );
					this.websocket.removeEventListener( WebsocketEvents.error, this.on_error_close );
					this.websocket.removeEventListener( WebsocketEvents.message, this.on_receive );
					this.websocket = undefined;
				}
			}
			
			public onClose ?: ( ev: CloseEvent ) => void;
			
			private on_close( event: CloseEvent ){
				this.dispose()
				this.onClose?.call( event );
				this.bytes_dst?.close();
			}
			
			private onErrorClose ?: ( event: Event ) => void;
			
			//The error event is fired when a connection with a WebSocket has been closed due to an error (some data couldn't be sent for example).
			private on_error_close( ev: Event ){
				this.dispose()
				this.onErrorClose?.call( ev );
				this.bytes_dst?.close();
				this.reconnect();
			}
		}
		
		enum WebsocketEvents{ open = 'open', close = 'close', error = 'error', message = 'message' }
	}
	
	
	export function equals_strings( a: string | undefined, b: string | undefined ){ return a === b || a !== undefined && b !== undefined && a.normalize() !== b.normalize(); }
	
	
	export function equals_arrays<T>( a1: ArrayLike<T> | undefined, a2: ArrayLike<T> | undefined, equals: ( v1: T, v2: T ) => boolean, size ?: number ): boolean{
		if( a1 === a2 ) return true
		if( a1 === undefined || a2 === undefined ) return false
		if( size == undefined ){
			if( (size = a1.length) !== a2.length ) return false
		}
		else if( a1.length < size || a2.length < size ) return false
		
		while( -1 < --size )
			if( !equals( a1[size], a2[size] ) ) return false
		
		return true;
	}
	
	export function equals_arrays2<T>( aa1: ArrayLike<ArrayLike<T> | undefined> | undefined, aa2: ArrayLike<ArrayLike<T> | undefined> | undefined, equals: ( v1: T, v2: T ) => boolean, size ?: number ): boolean{
		
		function equals_fn( a1: ArrayLike<T> | undefined, a2: ArrayLike<T> | undefined ): boolean{
			if( a1 === a2 ) return true
			if( a1 === undefined || a2 === undefined || a1.length !== a2.length ) return false
			return equals_arrays( a1, a2, equals, a1.length )
		}
		
		return equals_arrays( aa1, aa2, equals_fn, size )
	}
	
	export function equals_maps<K, V>( m1: Map<K, V> | undefined, m2: Map<K, V> | undefined, equals: ( v1: V, v2: V ) => boolean ): boolean{
		if( m1 === m2 ) return true
		if( m1 === undefined || m2 === undefined || m1.size !== m2.size ) return false
		
		for( const [k, v] of m1 ){
			if( !m2.has( k ) ) return false;
			const v1 = m2.get( k );
			if( v !== v1 && (v === undefined || v1 === undefined || !equals( v, v1 )) ) return false
		}
		
		return true;
	}
	
	export function equals_maps2<K, V>( am1: ArrayLike<Map<K, V> | undefined> | undefined, am2: ArrayLike<Map<K, V> | undefined> | undefined, equals: ( v1: V, v2: V ) => boolean, size ?: number ): boolean{
		function equals_fn( a1: Map<K, V> | undefined, a2: Map<K, V> | undefined ): boolean{
			return equals_maps( a1, a2, equals )
		}
		
		return equals_arrays( am1, am2, equals_fn, size )
	}
	
	
	export function equals_sets<T>( s1: Set<T> | undefined, s2: Set<T> | undefined ): boolean{
		if( s1 === s2 ) return true
		if( s1 === undefined || s2 === undefined || s1.size !== s2.size ) return false
		
		for( const k of s1.keys() )
			if( !s2.has( k ) ) return false;
		
		return true;
	}
	
	export function equals_sets2<K>( as1: ArrayLike<Set<K> | undefined> | undefined, as2: ArrayLike<Set<K> | undefined> | undefined, size ?: number ): boolean{ return equals_arrays( as1, as2, equals_sets, size ) }
	
	export function mix( hash: number, data: number ){
		const h = mixLast( hash, data );
		return Math.imul( h << 13 | h >>> -13, 5 ) + 0xe6546b64;
	}
	
	export function mixLast( hash: number, data: number ){
		const h = Math.imul( data, 0xcc9e2d51 )
		return Math.imul( hash ^ (h << 15 | h >>> -15), 0x1b873593 );
	}
	
	export function finalizeHash( hash: number, length: number ){
		return avalanche( hash ^ length );
	}
	
	export function avalanche( size: number ){
		size = Math.imul( size ^ size >>> 16, 0x85ebca6b );
		size = Math.imul( size ^ size >>> 13, 0xc2b2ae35 );
		return size ^ size >>> 16;
	}
	
	
	export function hash_boolean( hash: number, bool: boolean | undefined ){
		return mix( hash, bool === undefined ?
		                  0x1b873593 :
		                  bool ?
		                  0x42108421 :
		                  0x42108420 )
	}
	
	export function hash_string( hash: number, str: string | undefined ){
		if( !str ) return mix( hash, 17163 )
		let i = str.length - 1;
		for( ; 1 < i; i -= 2 ) hash = mix( hash, str.charCodeAt( i ) << 16 | str.charCodeAt( i + 1 ) );
		if( 0 < i ) hash = mixLast( hash, str.charCodeAt( 0 ) );
		return finalizeHash( hash, str.length );
	}
	
	// Compress arbitrarily large numbers into smi hashes.
	export function hash_number( hash: number, n: number | undefined ){
		if( !n || n !== n || n === Infinity ) return hash;
		let h = n | 0;
		if( h !== n ) for( h ^= n * 0xffffffff; n > 0xffffffff; h ^= n ) n /= 0xffffffff;
		return mix( hash, h );
	}
	
	export function hash_bigint( hash: number, n: bigint | undefined ){
		return n === undefined ?
		       hash :
		       hash_number( hash, Number( n ) ) + (n < Number.MIN_SAFE_INTEGER || Number.MAX_SAFE_INTEGER < n ?
		                                           Number( n >> 32n ) :
		                                           0)
	}
	
	export function hash_bytes( hash: number, data: ArrayLike<number> ){
		let len = data.length, i, k = 0;
		for( i = 0; 3 < len; i += 4, len -= 4 ) hash = mix( hash, data[i] & 0xFF | (data[i + 1] & 0xFF) << 8 | (data[i + 2] & 0xFF) << 16 | (data[i + 3] & 0xFF) << 24 );
		switch( len ){
			case 3:
				k ^= (data[i + 2] & 0xFF) << 16;
			case 2:
				k ^= (data[i + 1] & 0xFF) << 8;
		}
		return finalizeHash( mixLast( hash, k ^ data[i] & 0xFF ), data.length );
	}
	
	
	//Compute a hash that is symmetric in its arguments - that is a hash
	//where the order of appearance of elements does not matter.
	//This is useful for hashing sets, for example.
	
	export function hash_map<K, V>( hash: number, src: Map<K, V>, hashK: ( hash: number, k: K ) => number, hashV: ( hash: number, v: V ) => number ): number{
		let a = 0, b = 0, c = 1;
		
		for( const [k, v] of src ){
			let h = AdHoc.mix( hash, hashK( hash, k ) );
			h     = AdHoc.mix( h, hashV( hash, v ) );
			h     = AdHoc.finalizeHash( h, 2 );
			a += h;
			b ^= h;
			c *= h | 1;
		}
		return AdHoc.finalizeHash( AdHoc.mixLast( AdHoc.mix( AdHoc.mix( hash, a ), b ), c ), src.size );
	}
	
	
	export function hash_map2<K, V>( hash: number, src: ArrayLike<Map<K, V> | undefined>, hashK: ( hash: number, k: K ) => number, hashV: ( hash: number, v: V ) => number ): number{
		
		function hasher( hash: number, map: Map<K, V> ){return hash_map( hash, map, hashK, hashV )}
		
		return hash_array( hash, src, hasher, src.length )
	}
	
	
	export function hash_set<K>( hash: number, src: Set<K>, hashK: ( hash: number, k: K ) => number ): number{
		let a = 0, b = 0, c = 1;
		
		for( const k of src ){
			const h = hashK( hash, k );
			a += h;
			b ^= h;
			c *= h | 1;
		}
		return AdHoc.finalizeHash( AdHoc.mixLast( AdHoc.mix( AdHoc.mix( hash, a ), b ), c ), src.size );
	}
	
	export function hash_set2<K>( hash: number, src: ArrayLike<Set<K> | undefined>, hashK: ( hash: number, k: K ) => number ): number{
		
		function hasher( hash: number, set: Set<K> ){return hash_set( hash, set, hashK )}
		
		return hash_array( hash, src, hasher, src.length )
	}
	
	export function hash_array<V>( hash: number, src: ArrayLike<V>, hashV: ( hash: number, v: V ) => number, size ?: number ): number{
		
		switch( size ??= src.length ){
			case 0:
				return AdHoc.finalizeHash( hash, 0 );
			case 1:
				return AdHoc.finalizeHash( AdHoc.mix( hash, hashV( hash, src[0] ) ), 1 );
		}
		
		const initial   = hashV( hash, src[0] );
		let prev        = hashV( hash, src[1] );
		const rangeDiff = prev - initial;
		hash            = AdHoc.mix( hash, initial );
		
		for( let i = 2; i < size; ++i ){
			hash    = AdHoc.mix( hash, prev );
			const k = hashV( hash, src[i] );
			if( rangeDiff !== k - prev ){
				for( hash = AdHoc.mix( hash, k ), ++i; i < size; ++i ) hash = AdHoc.mix( hash, hashV( hash, src[i] ) );
				return AdHoc.finalizeHash( hash, size );
			}
			prev = k;
		}
		
		return AdHoc.avalanche( AdHoc.mix( AdHoc.mix( hash, rangeDiff ), prev ) );
	}
	
	export function hash_array2<V>( hash: number, src: ArrayLike<ArrayLike<V> | undefined>, hashV: ( hash: number, v: V ) => number, size ?: number ): number{
		function hasher( hash: number, array: ArrayLike<V> | undefined ): number{
			return array ?
			       hash_array( hash, array, hashV, array.length ) :
			       0
		}
		
		return hash_array( hash, src, hasher, size )
	}
	
	// v8 has an optimization for storing 31-bit signed numbers.
	// Values which have either 00 or 11 as the high order bits qualify.
	// This function drops the highest order bit in a signed number, maintaining the sign bit.
	export function smi( i32: number ){
		return i32 >>> 1 & 0x40000000 | i32 & 0xbfffffff;
	}
	
	export function signed( value: number, negative_bit: number, subs: number ){
		return value < negative_bit ?
		       value :
		       value - subs
	}
	
	
	// call once before JSON.stringify()
	export function JSON_EXT(){
		
		// to overcome...
		//
		// TypeError: Do not know how to serialize a BigInt
		//         at JSON.stringify (<anonymous>)
		//
		// @ts-ignore
		BigInt.prototype.toJSON = function toJson(){
			// @ts-ignore
			return this.toString() + "n";
		};
		
		// correctly stringify Maps ordered by key
		// @ts-ignore
		Map.prototype.toJSON = function toJson(){
			// @ts-ignore
			return [...this.entries()].sort( ( A, B ) => A[0] > B[0] ?
			                                             1 :
			                                             A[0] === B[0] ?
			                                             0 :
			                                             -1 );
		}
	}

//region SAFE_INTEGER bitwise functions
	const mask = 2n ^ 53n - 1n
	
	export function unary( x: number, op: ( lo: number, hi: number, arg: number ) => number, arg: number = 0 ): number{
		let hi = 0
		let lo = 0
		if( x > 0 ) return op( x | 0, x / 0x1_0000_0000 | 0, arg )
		if( !x ) return 0
		
		lo = -x | 0
		hi = -x / 0x1_0000_0000 | 0
		
		return op( lo = ~lo + 1 | 0, ~hi + (lo ?
		                                    0 :
		                                    1) | 0, arg )
	}
	
	export function value( lo: number, hi: number ): number{ return hi * 0x1_0000_0000 + (lo >>> 0) }
	
	
	export function not( lo: number, hi: number, unused: number ): number{ return value( ~lo, ~hi ); }
	
	
	export function negate_( x: number ): number{
		if( x > 0 ) return negate( x | 0, x / 0x1_0000_0000 | 0, 0 )
		
		let lo = -x | 0
		let hi = (-x / 0x1_0000_0000) | 0
		
		return negate( lo = ~lo + 1 | 0, ~hi + (lo ?
		                                        0 :
		                                        1) | 0, 0 )
	}
	
	export function negate( lo: number, hi: number, unused: number = 0 ): number{
		return value( lo = ~lo + 1 | 0, ~hi + (lo ?
		                                       0 :
		                                       1) | 0 )
	}
	
	export function shiftLeft( lo: number, hi: number, bits: number ): number{
		bits &= 63;
		return bits ?
		       bits < 32 ?
		       value( (lo << bits), hi << bits | lo >>> 32 - bits ) :
		       value( 0, lo << bits - 32 ) :
		       value( lo, hi );
		
	}
	
	export function shiftRight( lo: number, hi: number, bits: number ): number{
		bits &= 63;
		return bits ?
		       bits < 32 ?
		       value( lo >>> bits | hi << 32 - bits, hi >> bits ) :
		       value( hi >> bits - 32, hi < 0 ?
		                               -1 :
		                               0 ) :
		       value( lo, hi );
	}
	
	export function shiftRightUnsigned( lo: number, hi: number, bits: number ): number{
		bits &= 63;
		if( !bits ) return value( lo, hi )
		if( bits < 32 ) return value( lo >>> bits | hi << 32 - bits, hi >>> bits );
		if( bits === 32 ) return value( hi, 0 );
		return value( hi >>> bits - 32, 0 );
	}
	
	
	export function binary( x: number, op: ( lo: number, hi: number, lo_: number, hi_: number ) => number, y: number ): number{
		let hi = 0
		let lo = 0
		if( x > 0 ){
			lo = x | 0
			hi = x / 0x1_0000_0000 | 0;
		}
		else if( x < 0 ){
			lo = -x | 0
			hi = -x / 0x1_0000_0000 | 0
			
			lo = ~lo + 1 | 0;
			hi = ~hi + (lo ?
			            0 :
			            1) | 0;
		}
		
		let hi_ = 0
		let lo_ = 0
		if( y > 0 ){
			lo_ = y | 0
			hi_ = y / 0x1_0000_0000 | 0;
		}
		else if( y < 0 ){
			lo_ = -y | 0
			hi_ = -y / 0x1_0000_0000 | 0
			
			lo_ = ~lo_ + 1 | 0;
			hi_ = ~hi_ + (lo_ ?
			              0 :
			              1) | 0;
		}
		
		return op( lo, hi, lo_, hi_ )
	}
	
	export function hi( x: number ): number{
		if( x > 0 ) return x / 0x1_0000_0000 | 0;
		if( !x ) return 0
		
		let lo = -x | 0
		let hi = -x / 0x1_0000_0000 | 0
		
		lo = ~lo + 1 | 0;
		return ~hi + (lo ?
		              0 :
		              1) | 0;
	}
	
	export function lo( x: number ): number{
		
		if( 0 < x ) return x | 0
		if( !x ) return 0
		return ~(-x | 0) + 1 | 0;
	}
	
	export function and( lo: number, hi: number, lo_: number, hi_: number ): number{ return value( lo & lo_, hi & hi_ ); }
	
	export function or( lo: number, hi: number, lo_: number, hi_: number ): number{ return value( lo | lo_, hi | hi_ ); }
	
	export function xor( lo: number, hi: number, lo_: number, hi_: number ): number{ return value( lo ^ lo_, hi ^ hi_ ); }
	
	export function add( lo: number, hi: number, lo_: number, hi_: number ): number{
		
		const a48 = hi >>> 16;
		const a32 = hi & 0xFFFF;
		const a16 = lo >>> 16;
		const a00 = lo & 0xFFFF;
		
		const b48 = hi_ >>> 16;
		const b32 = hi_ & 0xFFFF;
		const b16 = lo_ >>> 16;
		const b00 = lo_ & 0xFFFF;
		
		let c48 = 0, c32 = 0, c16 = 0, c00 = 0;
		c00 += a00 + b00;
		c16 += c00 >>> 16;
		c00 &= 0xFFFF;
		c16 += a16 + b16;
		c32 += c16 >>> 16;
		c16 &= 0xFFFF;
		c32 += a32 + b32;
		c48 += c32 >>> 16;
		c32 &= 0xFFFF;
		c48 += a48 + b48;
		c48 &= 0xFFFF;
		return value( c16 << 16 | c00, c48 << 16 | c32 );
	}
	
	export function subtract( lo: number, hi: number, lo_: number, hi_: number ): number{
		return add( lo, hi, lo_ = ~lo_ + 1 | 0, ~hi_ + (lo_ ?
		                                                0 :
		                                                1) | 0 );
	}
	
	export function multiply_( x: number, lo_: number, hi_: number ): number{
		if( !x || !lo_ && !hi_ ) return 0
		if( x === 1 ) return value( lo_, hi_ )
		if( lo_ === 1 && !hi_ ) return x
		
		if( x > 0 ) return multiply( x | 0, x / 0x1_0000_0000 | 0, lo_, hi_ )
		
		let lo   = -x | 0
		const hi = (-x / 0x1_0000_0000) | 0
		
		return multiply( lo = ~lo + 1 | 0, ~hi + (lo ?
		                                          0 :
		                                          1) | 0, lo_, hi_ )
		
		
	}
	
	export function multiply( lo: number, hi: number, lo_: number, hi_: number ): number{
		if( !lo && !hi || !lo_ && !hi_ ) return 0
		if( lo === 1 && !hi ) return value( lo_, hi_ )
		if( lo_ === 1 && !hi_ ) return value( lo, hi )
		
		
		// Divide each long into 4 chunks of 16 bits, and then add up 4x4 products.
		// We can skip products that would overflow.
		
		const a48 = hi >>> 16;
		const a32 = hi & 0xFFFF;
		const a16 = lo >>> 16;
		const a00 = lo & 0xFFFF;
		
		const b48 = hi_ >>> 16;
		const b32 = hi_ & 0xFFFF;
		const b16 = lo_ >>> 16;
		const b00 = lo_ & 0xFFFF;
		
		
		let c00 = a00 * b00;
		let c16 = c00 >>> 16;
		c00 &= 0xFFFF;
		c16 += a16 * b00;
		let c32 = c16 >>> 16;
		c16 &= 0xFFFF;
		c16 += a00 * b16;
		c32 += c16 >>> 16;
		c16 &= 0xFFFF;
		c32 += a32 * b00;
		let c48 = c32 >>> 16;
		c32 &= 0xFFFF;
		c32 += a16 * b16;
		c48 += c32 >>> 16;
		c32 &= 0xFFFF;
		c32 += a00 * b32;
		c48 += c32 >>> 16;
		c32 &= 0xFFFF;
		c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
		c48 &= 0xFFFF;
		return value( (c16 << 16) | c00, (c48 << 16) | c32 );
	}
	
	export function mod( lo: number, hi: number, lo_: number, hi_: number ): number{
		const d = div( lo, hi, lo_, hi_ )
		const m = multiply_( d, lo_, hi_ )
		
		return subtract( lo, hi, AdHoc.lo( m ), AdHoc.hi( m ) );
	}
	
	export function div( lo: number, hi: number, lo_: number, hi_: number ): number{
		if( !lo_  && !hi_  ) throw new Error( 'division by zero' );
		if( !lo  && !hi  ) return 0
		if( lo_ === 1 && !hi_  ) return value( lo, hi )
		
		
		if( !lo  && hi === 0x8000_0000 ){
			if( (lo_ === 1 && !hi_ ) || (lo_ === -1 && hi_ === -1) ) return value( 0, 0x8000_0000 );
			
			if( !lo_  && hi_ === 0x8000_0000 ) return value( 1, 0 )
			
			// At this point, we have |other| >= 2, so |this/other| < |MIN_VALUE|.
			const halfThis = shiftRight( lo, hi, 1 );
			const approx   = unary( binary( halfThis, div, value( lo_, hi_ ) ), shiftLeft, 1 );
			
			if( !approx  ) return hi_ < 0 ?
			                          value( 1, 0 ) :
			                          value( -1, -1 );
			
			const m   = multiply_( approx, lo_, hi_ )
			const rem = subtract( lo, hi, AdHoc.lo( m ), AdHoc.hi( m ) );
			return binary( approx, add, div( AdHoc.lo( rem ), AdHoc.hi( rem ), lo_, hi, ) );
		}
		
		if( !lo_ && hi_ === 0x8000_0000 ) return 0
		
		
		const x = negate( lo, hi )
		if( hi < 0 ) return hi_ < 0 ?
		                    binary( x, div, negate( lo_, hi_ ) ) :
		                    negate_( div( AdHoc.lo( x ), AdHoc.hi( x ), lo_, hi_ ) );
		
		
		if( hi_ < 0 ){
			const y = negate( lo_, hi_ )
			return unary( div( lo, hi, AdHoc.lo( y ), AdHoc.hi( y ) ), negate );
		}
		
		// Repeat the following until the remainder is less than other:  find a
		// floating-point that approximates remainder / other *from below*, add this
		// into the result, and subtract it from the remainder.  It is critical that
		// the approximate value is less than or equal to the real value so that the
		// remainder never becomes negative.
		let res = 0;
		let rem = value( lo, hi );
		const y = value( lo_, hi_ );
		
		while( y <= rem ){
			// Approximate the result of division. This may be a little greater or
			// smaller than the actual value.
			var approx = Math.max( 1, Math.floor( rem / y ) );
			
			// We will tweak the approximate result by changing it in the 48-th digit
			// or the smallest non-fractional digit, whichever is larger.
			const log2  = Math.ceil( Math.log( approx ) / Math.LN2 );
			const delta = (log2 <= 48) ?
			              1 :
			              Math.pow( 2, log2 - 48 );
			
			// Decrease the approximation until it is smaller than the remainder. Note
			// that if it is too large, the product overflows and is negative.
			let approxRes = approx;
			
			let approxRem = binary( approx, multiply, y );
			
			while( AdHoc.hi( approxRem ) < 0 || approxRem > rem ){
				approx -= delta;
				approxRem = binary( approxRes = approx, multiply, y );
			}
			
			// We know the answer can't be zero... and actually, zero would cause
			// infinite recursion since we would make no progress.
			if( !approxRes ) approxRes = 1
			
			res = binary( res, add, approxRes );
			rem = binary( rem, subtract, approxRem );
		}
		return res;
	}
	
	//endregion
}

export default AdHoc;