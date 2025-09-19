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

"use strict";
//https: //devdocs.io/javascript/global_objects/uint8clampedarray
import Base from "../gen/Base";

//Use undefined. Do not use undefined. https://github.com/Microsoft/TypeScript/wiki/Coding-guidelines#undefined-and-undefin
export namespace org.unirail.AdHoc{

//#region SAFE_INTEGER bitwise functions
	
	/**
	 * Provides bitwise operations for numbers that exceed 32 bits, up to JavaScript's safe integer limit of 53 bits.
	 * It achieves this by internally representing a number as two 32-bit parts: a high part (`hi`) and a low part (`lo`).
	 */
	export class _33_53{
		/** The upper 21 bits of the 53-bit number, stored as a 32-bit signed integer. */
		hi: number;
		/** The lower 32 bits of the 53-bit number, stored as a 32-bit signed integer. */
		lo: number;
		
		constructor(){
			this.hi = 0;
			this.lo = 0;
		}
		
		/**
		 * Decomposes the provided number into `hi` and `lo` 32-bit parts and sets them on the instance.
		 * This method correctly handles both positive and negative numbers using two's complement arithmetic for negatives.
		 *
		 * @param x The number to set (up to 53 bits).
		 * @returns The current `_33_53` instance for method chaining.
		 */
		set( x: number ): _33_53{
			if( x > 0 ){
				this.lo = x | 0; // Extracts the lower 32 bits.
				this.hi = ( x / 0x1_0000_0000 ) | 0; // Extracts the upper bits.
			}else if( x < 0 ){
				// Handle negative numbers using two's complement.
				const lo = -x | 0;
				const hi = ( -x / 0x1_0000_0000 ) | 0;
				
				this.lo = ( ~lo + 1 ) | 0; // Apply two's complement to the low part.
				// Apply two's complement to the high part, adding 1 if a borrow from the low part occurred.
				this.hi = ( ~hi + ( lo ?
				                    0 :
				                    1 ) ) | 0;
			}else{
				this.lo = 0;
				this.hi = 0;
			}
			
			return this;
		}
		
		/**
		 * Reconstructs and returns the full number from its `hi` and `lo` parts.
		 * @returns The combined 53-bit number.
		 */
		get(): number{ return this.hi * 0x1_0000_0000 + ( this.lo >>> 0 ); }
		
		/**
		 * Performs a bitwise AND operation between this instance and another `_33_53` instance.
		 * The result is stored in this instance.
		 *
		 * @param other The other `_33_53` object to AND with.
		 * @returns The current `_33_53` instance for method chaining.
		 */
		and( other: _33_53 ): _33_53{
			this.lo &= other.lo;
			this.hi &= other.hi;
			return this;
		}
		
		/**
		 * Performs a bitwise AND operation between this instance and a standard number.
		 * The result is stored in this instance.
		 *
		 * @param x The number to AND with.
		 * @returns The current `_33_53` instance for method chaining.
		 */
		and_( x: number ): _33_53{
			// Prepare high and low parts based on the input number
			let hi = 0;
			let lo = 0;
			if( x > 0 ){
				lo = x | 0;
				hi = ( x / 0x1_0000_0000 ) | 0;
			}else if( x < 0 ){
				lo = -x | 0;
				hi = ( -x / 0x1_0000_0000 ) | 0;
				
				lo = ( ~lo + 1 ) | 0;
				hi = ( ~hi + ( lo ?
				               0 :
				               1 ) ) | 0;
			}
			
			this.lo &= lo;
			this.hi &= hi;
			return this;
		}
		
		/**
		 * Performs a bitwise AND operation between two numbers, storing the result in this instance.
		 *
		 * @param x The first number.
		 * @param y The second number.
		 * @returns The current `_33_53` instance for method chaining.
		 */
		and__( x: number, y: number ): _33_53{
			return this.set( x ).and_( y );
		}
		
		/**
		 * Performs a bitwise OR operation between this instance and another `_33_53` instance.
		 * The result is stored in this instance.
		 *
		 * @param src The other `_33_53` object to OR with.
		 * @returns The current `_33_53` instance for method chaining.
		 */
		or( src: _33_53 ): _33_53{
			this.lo |= src.lo;
			this.hi |= src.hi;
			return this;
		}
		
		/**
		 * Performs a bitwise OR operation between this instance and a standard number.
		 * The result is stored in this instance.
		 *
		 * @param x The number to OR with.
		 * @returns The current `_33_53` instance for method chaining.
		 */
		or_( x: number ): _33_53{
			let hi = 0;
			let lo = 0;
			if( x > 0 ){
				lo = x | 0;
				hi = ( x / 0x1_0000_0000 ) | 0;
			}else if( x < 0 ){
				lo = -x | 0;
				hi = ( -x / 0x1_0000_0000 ) | 0;
				
				lo = ( ~lo + 1 ) | 0;
				hi = ( ~hi + ( lo ?
				               0 :
				               1 ) ) | 0;
			}
			
			this.lo |= lo;
			this.hi |= hi;
			return this;
		}
		
		/**
		 * Performs a bitwise OR operation between two numbers, storing the result in this instance.
		 *
		 * @param x The first number.
		 * @param y The second number.
		 * @returns The current `_33_53` instance for method chaining.
		 */
		or__( x: number, y: number ): _33_53{
			return this.set( x ).or_( y );
		}
		
		/**
		 * Performs a bitwise XOR operation between this instance and another `_33_53` instance.
		 * The result is stored in this instance.
		 *
		 * @param src The other `_33_53` object to XOR with.
		 * @returns The current `_33_53` instance for method chaining.
		 */
		xor( src: _33_53 ): _33_53{
			this.lo ^= src.lo;
			this.hi ^= src.hi;
			return this;
		}
		
		/**
		 * Performs a bitwise XOR operation between this instance and a standard number.
		 * The result is stored in this instance.
		 *
		 * @param x The number to XOR with.
		 * @returns The current `_33_53` instance for method chaining.
		 */
		xor_( x: number ): _33_53{
			let hi = 0;
			let lo = 0;
			if( x > 0 ){
				lo = x | 0;
				hi = ( x / 0x1_0000_0000 ) | 0;
			}else if( x < 0 ){
				lo = -x | 0;
				hi = ( -x / 0x1_0000_0000 ) | 0;
				
				lo = ( ~lo + 1 ) | 0;
				hi = ( ~hi + ( lo ?
				               0 :
				               1 ) ) | 0;
			}
			
			this.lo ^= lo;
			this.hi ^= hi;
			return this;
		}
		
		/**
		 * Performs a bitwise XOR operation between two numbers, storing the result in this instance.
		 *
		 * @param x The first number.
		 * @param y The second number.
		 * @returns The current `_33_53` instance for method chaining.
		 */
		xor__( x: number, y: number ): _33_53{
			return this.set( x ).xor_( y );
		}
		
		/**
		 * Negates a number using two's complement and stores the result in this instance.
		 *
		 * @param x The number to negate.
		 * @returns The current `_33_53` instance for method chaining.
		 */
		neg_( x: number ): _33_53{
			return this.set( x ).neg();
		}
		
		/**
		 * Negates the number currently held by this instance using two's complement.
		 *
		 * @returns The current `_33_53` instance for method chaining.
		 */
		neg(): _33_53{
			this.lo = ( ~this.lo + 1 ) | 0; // Two's complement for low part
			this.hi = ( ~this.hi + ( this.lo ?
			                         0 :
			                         1 ) ) | 0; // Adjust high part for borrow
			return this;
		}
		
		/**
		 * Performs a left shift operation on the number.
		 *
		 * @param bits The number of bits to shift left (0-63).
		 * @returns The current `_33_53` instance for method chaining.
		 */
		shl( bits: number ): _33_53{
			if( !( bits &= 63 ) ) return this;
			
			const lo = this.lo;
			const hi = this.hi;
			
			if( bits < 32 ){
				this.lo = lo << bits; // Shift low part
				this.hi = ( hi << bits ) | ( lo >>> ( 32 - bits ) ); // Shift high, carrying over bits from low.
			}else{
				this.lo = 0;
				this.hi = lo << ( bits - 32 ); // Low part is shifted into high part.
			}
			return this;
		}
		
		/**
		 * Performs a left shift on a number and stores the result in this instance.
		 *
		 * @param x The number to shift.
		 * @param bits The number of bits to shift left.
		 * @returns The current `_33_53` instance for method chaining.
		 */
		shl_( x: number, bits: number ): _33_53{ return this.set( x ).shl( bits ); }
		
		
		/**
		 * Performs a signed (arithmetic) right shift operation on the number.
		 *
		 * @param bits The number of bits to shift right (0-63).
		 * @returns The current `_33_53` instance for method chaining.
		 */
		shr( bits: number ): _33_53{
			if( !( bits &= 63 ) ) return this;
			const lo = this.lo;
			const hi = this.hi;
			
			if( bits < 32 ){
				this.lo = ( lo >>> bits ) | ( hi << ( 32 - bits ) ); // Shift low, carrying over bits from high.
				this.hi = hi >> bits; // Signed shift preserves the sign bit.
			}else{
				this.lo = hi >> ( bits - 32 ); // High part is shifted into low part.
				this.hi = hi < 0 ?
				          -1 :
				          0; // Sign-extend the high part.
			}
			
			return this;
		}
		
		/**
		 * Performs a signed right shift on a number and stores the result in this instance.
		 *
		 * @param x The number to shift.
		 * @param bits The number of bits to shift right.
		 * @returns The current `_33_53` instance for method chaining.
		 */
		shr_( x: number, bits: number ): _33_53{ return this.set( x ).shr( bits ); }
		
		
		/**
		 * Performs an unsigned (logical) right shift operation on the number.
		 *
		 * @param bits The number of bits to shift right (0-63).
		 * @returns The current `_33_53` instance for method chaining.
		 */
		shru( bits: number ): _33_53{
			if( !( bits &= 63 ) ) return this;
			const lo = this.lo;
			const hi = this.hi;
			
			if( bits < 32 ){
				this.lo = ( lo >>> bits ) | ( hi << ( 32 - bits ) ); // Shift low, carrying over bits from high.
				this.hi = hi >>> bits; // Unsigned shift fills with zeros.
			}else if( bits === 32 ){
				this.lo = hi;
				this.hi = 0;
			}else{
				this.lo = hi >>> ( bits - 32 );
				this.hi = 0;
			}
			return this;
		}
		
		/**
		 * Performs an unsigned right shift on a number and stores the result in this instance.
		 *
		 * @param x The number to shift.
		 * @param bits The number of bits to shift right.
		 * @returns The current `_33_53` instance for method chaining.
		 */
		shru_( x: number, bits: number ): _33_53{
			return this.set( x ).shru( bits );
		}
		
		/**
		 * Performs a bitwise NOT operation (inverts all bits) on the number.
		 *
		 * @returns The current `_33_53` instance for method chaining.
		 */
		not(): _33_53{
			this.lo = ~this.lo;
			this.hi = ~this.hi;
			return this;
		}
	}
	
	/** A reusable instance of the `_33_53` class for performance-critical operations. */
	export const p = new _33_53();
	/** A second reusable instance of the `_33_53` class for operations requiring two temporary objects. */
	export const q = new _33_53();
	
	/**
	 * Counts the number of set bits (1s) in a 32-bit integer using a parallel bitwise algorithm.
	 *
	 * @param v The 32-bit integer.
	 * @returns The number of set bits (population count).
	 */
	export function bitCount( v: number ): number{
		v = v - ( ( v >> 1 ) & 0x55555555 );
		v = ( v & 0x33333333 ) + ( ( v >> 2 ) & 0x33333333 );
		return ( ( ( v + ( v >> 4 ) ) & 0xf0f0f0f ) * 0x1010101 ) >> 24;
	}
	
	/**
	 * Counts the number of set bits (1s) in a number up to 52 bits.
	 *
	 * @param v The number.
	 * @returns The number of set bits.
	 */
	export function bitCount52( v: number ): number{ return bitCount( v / 0x1_0000_0000 ) + bitCount( v | 0 ); }
	
	/**
	 * Counts the number of leading zero bits in a 32-bit integer.
	 *
	 * @param v The 32-bit integer.
	 * @returns The number of leading zeros.
	 */
	export function numberOfLeadingZeros( v: number ): number{ return Math.clz32( v ); }
	
	
	/**
	 * Counts the number of leading zero bits in a number up to 52 bits.
	 *
	 * @param v The number.
	 * @returns The number of leading zeros.
	 */
	export function numberOfLeadingZeros52( v: number ): number{
		const hi = numberOfLeadingZeros( v / 0x1_0000_0000 ); // Leading zeros in high part.
		// If the high part is all zeros, count zeros in the low part; otherwise, the count from the high part is the answer.
		return hi === 32 ?
		       numberOfLeadingZeros( v ) :
		       hi;
	}
	
	/**
	 * Counts the number of leading zero bits in a 32-bit integer, starting from a specified bit position.
	 *
	 * @param v The 32-bit integer.
	 * @param from_bit The bit position to start counting from (0-31, from right to left).
	 * @returns The number of leading zeros from the specified position.
	 */
	export function numberOfLeadingZeros_( v: number, from_bit: number ): number{ return numberOfLeadingZeros( v << ( 31 - from_bit ) ); }
	
	/**
	 * Counts the number of leading zero bits in a 52-bit number, starting from a specified bit position.
	 *
	 * @param v The 52-bit number.
	 * @param from_bit The bit position to start counting from (0-51, from right to left).
	 * @returns The number of leading zeros from the specified position.
	 */
	export function numberOfLeadingZeros52_( v: number, from_bit: number ): number{
		if( from_bit < 32 ) return numberOfLeadingZeros_( v >>> 0, from_bit );
		const hi = ( v / 0x1_0000_0000 ) >>> 0;
		
		return hi === 0 ?
		       32 + numberOfLeadingZeros_( v, from_bit - 32 ) :
		       63 - from_bit + numberOfLeadingZeros_( hi, from_bit - 32 );
	}
	
	/**
	 * Counts the number of leading zero bits in a `bigint`, starting from a specified bit position.
	 *
	 * @param v The bigint.
	 * @param from_bit The starting bit position.
	 * @returns The number of leading zeros from the specified position.
	 */
	export function numberOfLeadingZeros__( v: bigint, from_bit: number ): number{
		if( v < 0 ) return 0;
		if( from_bit < 32 ) return numberOfLeadingZeros_( Number( v ), from_bit );
		if( from_bit < 52 || v < Number.MAX_VALUE ) return numberOfLeadingZeros52_( Number( v ), from_bit );
		
		return 52 + numberOfLeadingZeros_( Number( v >> 52n ), from_bit - 52 );
	}
	
	/**
	 * Counts the number of trailing zero bits in a 32-bit integer.
	 *
	 * @param v The 32-bit integer.
	 * @returns The number of trailing zeros.
	 */
	export function numberOfTrailingZeros( v: number ): number{ return bitCount( ( v & -v ) - 1 ); }
	
	/**
	 * Counts the number of trailing zero bits in a 52-bit number.
	 *
	 * @param v The 52-bit number.
	 * @returns The number of trailing zeros.
	 */
	export function numberOfTrailingZeros52( v: number ): number{
		return v >>> 0 === 0 ?
		       32 + numberOfTrailingZeros( v / 0x1_0000_0000 ) :
		       bitCount( ( v & -v ) - 1 );
	}
	
	/**
	 * Optimizes a 32-bit integer for V8's Small Integer (SMI) representation by ensuring it fits within 31 bits.
	 * This is a specific micro-optimization that may improve performance in certain JavaScript engines.
	 *
	 * @param i32 A 32-bit integer.
	 * @returns A 31-bit signed integer potentially optimized for V8.
	 */
	export function smi( i32: number ): number{ return ( ( i32 >>> 1 ) & 0x40000000 ) | ( i32 & 0xbfffffff ); }
	
	/**
	 * Adjusts a value to be signed based on a specified negative bit boundary.
	 *
	 * @param value The value to adjust.
	 * @param negative_bit The threshold; values greater than or equal to this are considered negative.
	 * @param subs The value to subtract to bring the number into the negative range.
	 * @returns The adjusted signed value.
	 */
	export function signed( value: number, negative_bit: number, subs: number ): number{
		return value < negative_bit ?
		       value :
		       value - subs;
	}

//#endregion
	
	/**
	 * Defines a contract for a source of bytes that can be read for transmission.
	 */
	export interface BytesSrc{
		/**
		 * Subscribes a function to be called when new bytes become available for reading.
		 *
		 * @param subscriber The function to be called. It receives the `BytesSrc` instance as an argument.
		 * @returns A function that, when called, unsubscribes the provided subscriber.
		 */
		subscribe_on_new_bytes_to_transmit_arrive( subscriber: ( src: BytesSrc ) => void ): ( src: BytesSrc ) => void;
		
		/**
		 * Reads bytes from this source into a destination `DataView`.
		 *
		 * @param dst The destination `DataView` to write bytes into.
		 * @param byte The starting byte index in the destination.
		 * @param bytes The maximum number of bytes to read.
		 * @returns The number of bytes actually read.
		 */
		read( dst: DataView, byte: number, bytes: number ): number;
		
		/**
		 * Gets a value indicating whether the byte source is open and available for reading.
		 */
		get isOpen(): boolean;
		
		/**
		 * Closes the byte source and releases any associated resources.
		 */
		close(): void;
	}
	
	/**
	 * Defines a contract for a destination that can receive and process bytes.
	 */
	export interface BytesDst{
		/**
		 * Writes bytes from a source `DataView` to this destination.
		 *
		 * @param src The source `DataView` to read bytes from.
		 * @param byte The starting byte index in the source.
		 * @param bytes The number of bytes to write.
		 * @returns The number of bytes actually written.
		 */
		write( src: DataView, byte: number, bytes: number ): number;
		
		/**
		 * Gets a value indicating whether the byte destination is open and available for writing.
		 */
		get isOpen(): boolean;
		
		/**
		 * Closes the byte destination and releases any associated resources.
		 */
		close(): void;
	}
	
	/**
	 * Defines the contracts for a communication channel that bridges an external I/O resource
	 * (e.g., a network socket) with the application's internal byte stream handling system.
	 *
	 * This design separates the channel's responsibilities into two distinct interfaces:
	 * - `Channel.External`: The public-facing **control plane** for managing the channel's lifecycle
	 *   and operational parameters (e.g., timeouts, closing). This is the interface a consumer uses.
	 * - `Channel.Internal`: The backend interface for **wiring up** the data streams (`BytesSrc`, `BytesDst`)
	 *   and handling events. This is implemented by the system that constructs the channel.
	 */
	export namespace Channel{
		
		/**
		 * Represents the public-facing control plane of a communication channel.
		 *
		 * @remarks
		 * This interface provides the API to manage the channel's lifecycle (closing, aborting)
		 * and configure operational parameters like timeouts. It is the primary interface
		 * that consumers of the channel will interact with once it is fully constructed.
		 *
		 * This interface deliberately abstracts away the direct handling of byte streams.
		 */
		export interface External{
			
			/**
			 * Gets or sets the timeout for receive operations, in milliseconds.
			 *
			 * @remarks
			 * A negative value initiates a graceful close, using its absolute value as the timeout for the operation.
			 * The current value will also be negative if a graceful close is in progress.
			 * Use a very large number (e.g., `Number.MAX_SAFE_INTEGER`) for no timeout.
			 */
			get receiveTimeout(): number;
			
			set receiveTimeout( timeout: number );
			
			/**
			 * Gets or sets the timeout for transmit operations, in milliseconds.
			 *
			 * @remarks
			 * A negative value schedules a graceful close after the current transmission completes,
			 * using its absolute value as the timeout for the operation.
			 * Use a very large number (e.g., `Number.MAX_SAFE_INTEGER`) for no timeout.
			 */
			get transmitTimeout(): number;
			
			set transmitTimeout( timeout: number );
			
			/**
			 * A link to the internal (provider-side) half of the channel.
			 *
			 * @remarks
			 * This property is primarily used during the channel's construction phase by the
			 * system that creates and wires together the external and internal components.
			 * It is not typically used by the end consumer of the channel.
			 */
			get Internal(): Internal;
			
			set Internal( value: Internal );
			
			/**
			 * Gracefully closes the communication channel.
			 * This allows pending transmissions to complete before closing.
			 */
			close(): void;
			
			/**
			 * Immediately terminates the connection, cancelling any pending I/O operations.
			 * This may result in data loss.
			 */
			abort(): void;
			
			/**
			 * Permanently closes the communication channel and releases all associated resources.
			 * After this is called, the channel instance is no longer usable.
			 */
			closeAndDispose(): void;
		}
		
		/**
		 * Represents the internal backend of a communication channel, providing the data sources,
		 * sinks, and an event callback.
		 *
		 * @remarks
		 * This interface is implemented by the system that constructs and manages the channel.
		 * It bridges the channel's low-level I/O logic with the application's high-level
		 * data streams (`BytesSrc`, `BytesDst`).
		 *
		 * ### Data Flow:
		 * - **Receiving (External ▶ Internal):** The channel implementation reads data from the external source
		 *   and pushes it into the `BytesDst` instance provided by this interface.
		 * - **Transmitting (External ◀ Internal):** The channel implementation pulls data from the `BytesSrc`
		 *   instance and sends it to the external source.
		 */
		export interface Internal{
			/**
			 * Gets the `BytesDst` instance that serves as the internal destination (sink)
			 * for data received from the external source.
			 */
			get BytesDst(): BytesDst | undefined;
			
			/**
			 * Gets the `BytesSrc` instance that serves as the internal source of data
			 * to be transmitted to the external destination.
			 *
			 * @remarks
			 * The channel implementation must efficiently retrieve data from this source
			 * by subscribing to notifications via `BytesSrc.subscribe_on_new_bytes_to_transmit_arrive`
			 * and calling `BytesSrc.read` when notified.
			 */
			get BytesSrc(): BytesSrc | undefined;
			
			/**
			 * A callback for the external channel implementation to report significant lifecycle events
			 * (e.g., connection established, lost, errors) to the internal system that manages it.
			 *
			 * @param channel The `External` channel instance that is the source of the event.
			 * @param event A numeric code representing the event type. An enum is recommended for implementations.
			 */
			OnExternalEvent( channel: External, event: number ): void;
		}
		
		
		/**
		 * Represents a single, stateful stage in a data processing pipeline for a communication channel.
		 *
		 * @remarks
		 * Each stage can inspect, modify, or react to data as it is transmitted or received. Implementations
		 * define the logic for various events in the channel's lifecycle, such as activation, transmission,
		 * reception, and timeouts.
		 *
		 * @template CTX The type of the context object, holding stateful data for the pipeline instance.
		 * @template SND The type of the packet headers used on sending.
		 * @template RCV The type of the packet headers used on receiving.
		 */
		export interface Stage<CTX, SND, RCV>{
			
			/**
			 * A lifecycle callback invoked when the stage becomes active in the pipeline.
			 * This is the ideal place for initialization, resource allocation, or setting up initial state.
			 *
			 * @param context The shared context object for this pipeline instance.
			 * @param prevStage The preceding stage in the pipeline, or `undefined` if this is the first stage.
			 * @param sendHeaders The packet headers that initiated this activation, if driven by a transmission.
			 * @param sendPack The outgoing packet source.
			 * @param receiveHeaders The packet headers that initiated this activation, if driven by a reception.
			 * @param receivePack The incoming packet destination.
			 */
			OnActivate( context: CTX, prevStage: Stage<CTX, SND, RCV> | undefined, sendHeaders: SND | undefined, sendPack: Transmitter.BytesSrc | undefined, receiveHeaders: RCV | undefined, receivePack: Receiver.BytesDst | undefined ): void;
			
			
			/**
			 * Handles a failure event within the pipeline, such as an error, timeout, or disconnection.
			 * This allows the stage to perform cleanup or logging.
			 *
			 * @param context The shared context object for this pipeline instance.
			 * @param reason The reason for the failure.
			 * @param description A human-readable description of the failure.
			 * @param sendHeaders The headers of the packet being sent at the time of failure, if any.
			 * @param sendPack The packet being sent at the time of failure, if any.
			 * @param receiveHeaders The headers of the packet being received at the time of failure, if any.
			 * @param receivePack The packet being received at the time of failure, if any.
			 */
			OnFailure( context: CTX, reason: Stages.FailureReason, description: string | undefined, sendHeaders?: SND | undefined, sendPack?: Transmitter.BytesSrc | undefined, receiveHeaders?: RCV | undefined, receivePack?: Receiver.BytesDst | undefined ): void;
			
			/**
			 * A hook invoked just before a packet is serialized into its byte representation.
			 * This provides a final opportunity to validate or modify the packet object before it is converted to bytes.
			 *
			 * @param context The pipeline context.
			 * @param headers The headers for the outgoing packet.
			 * @param pack The packet object to be serialized.
			 * @returns An error message string to abort the serialization process, or `undefined` to proceed.
			 */
			OnSerializing( context: CTX, headers: SND | undefined, pack: Transmitter.BytesSrc ): string | undefined;
			
			/**
			 * A callback invoked after a packet has been fully serialized into the send buffer.
			 *
			 * @remarks
			 * Due to the streaming nature of data flow, parts of the packet's bytes
			 * may have already been sent over the network when this hook is called.
			 * This event guarantees that the entire logical packet has been processed and written to the
			 * buffer, not that it has been acknowledged by the remote peer.
			 *
			 * @param context The pipeline context.
			 * @param headers The headers of the packet that was just serialized.
			 * @param pack The original packet object that was serialized.
			 */
			OnSerialized( context: CTX, headers: SND | undefined, pack: Transmitter.BytesSrc ): void;
			
			/**
			 * Processes an incoming packet's header before its body is received.
			 * This allows the stage to inspect the header and decide whether to accept or reject the packet.
			 *
			 * @param context The pipeline context.
			 * @param headers The headers of the incoming packet.
			 * @param pack The destination for the incoming packet, which is initially empty.
			 * @returns An error message string to reject the packet, or `undefined` to accept it and proceed.
			 */
			OnReceiving( context: CTX, headers: RCV | undefined, pack: Receiver.BytesDst ): string | undefined;
			
			/**
			 * Handles a fully received packet, including its header and body.
			 * This is the final step in the reception process where the complete data is available.
			 *
			 * @param context The pipeline context.
			 * @param headers The headers of the fully received packet.
			 * @param pack The destination containing the received packet data.
			 */
			OnReceived( context: CTX, headers: RCV | undefined, pack: Receiver.BytesDst ): void;
			
		}
		
		export namespace Stages{
			/**
			 * Enumerates the reasons for a pipeline failure or connection termination.
			 */
			export enum FailureReason{
				/** The connection was terminated by the local application or pipeline logic. */
				LocalDisconnect = 'LocalDisconnect',
				
				/** The connection was terminated by the remote peer. */
				RemoteDisconnect = 'RemoteDisconnect',
				
				/** An operation did not complete within its allotted time. */
				Timeout = 'Timeout',
				
				/** Received data violates the expected communication protocol (e.g., a malformed packet). */
				ProtocolError = 'ProtocolError',
				
				/** An unexpected or unhandled error occurred within the pipeline's logic. */
				InternalError = 'InternalError',
			}
		}
		
		
		/**
		 * An abstract base class for deserializing byte streams into structured packets.
		 * It implements a state machine to handle partial data and various data encodings.
		 */
		export abstract class Receiver extends Base.Receiver implements AdHoc.BytesDst{
			/** The number of bytes allocated for the packet ID. */
			readonly id_bytes: number;
			/** An optional event handler for receive-related events. */
			handler: AdHoc.Channel.Receiver.EventsHandler | undefined;
			
			/**
			 * Constructs a `Receiver`.
			 *
			 * @param handler The event handler for `OnReceiving` and `OnReceived` events.
			 * @param id_bytes The number of bytes used for the packet identifier.
			 */
			constructor( handler: AdHoc.Channel.Receiver.EventsHandler | undefined, id_bytes: number ){
				super();
				this.bytes_left = 0;
				this.id_bytes = id_bytes;
				this.handler = handler;
			}
			
			/**
			 * Replaces the current event handler with a new one.
			 *
			 * @param handler The new event handler.
			 * @returns The previous event handler, or `undefined` if none was set.
			 */
			exchange( handler: AdHoc.Channel.Receiver.EventsHandler ): AdHoc.Channel.Receiver.EventsHandler | undefined{
				const tmp = this.handler;
				this.handler = handler;
				return tmp;
			}
			
			/**
			 * Retrieves the output `BytesDst` from the current slot and clears the slot's destination.
			 * Used for handling nested data structures.
			 *
			 * @returns The output `BytesDst`, or `undefined` if not available.
			 */
			output(): AdHoc.Channel.Receiver.BytesDst | undefined{
				const output = this.slot!.next!.dst;
				this.slot!.next!.dst = undefined;
				return output;
			}

//#region is null
			
			/**
			 * Reads a byte containing null-field bitmasks from the stream.
			 * If the byte is not available, it sets the state machine to retry.
			 *
			 * @param this_case The state to transition to if a retry is needed.
			 * @returns `true` if the byte was read, `false` if a retry is scheduled.
			 */
			get_fields_nulls( this_case: number ): boolean{
				if( this.byte < this.byte_max ){
					this.slot!.fields_nulls = this.buffer!.getUint8( this.byte++ );
					return true;
				}
				
				this.slot!.state = this_case;
				this.mode = RETRY;
				return false;
			}
			
			/**
			 * Checks if a specific field is marked as null in the last read null-field byte.
			 *
			 * @param field The bitmask for the field to check.
			 * @param if_null_case The state to transition to if the field is null.
			 * @returns `false` if the field is not null, `true` if it is null (and the state is updated).
			 */
			is_null( field: number, if_null_case: number ): boolean{
				if( this.slot!.fields_nulls & field ) return false;
				this.slot.state = if_null_case;
				return true;
			}
			
			/**
			 * Checks if the most recently read bit(s) represent a null value (0).
			 *
			 * @param if_null_case The state to transition to if the value is null.
			 * @returns `false` if not null, `true` if null (and the state is updated).
			 */
			bit_null( if_null_case: number ): boolean{
				if( this.get_bits === 0 ) return false;
				this.slot.state = if_null_case;
				return true;
			}
			
			/**
			 * Checks if the next byte in the stream is null (0).
			 *
			 * @param if_null_case The state to transition to if the value is null.
			 * @returns `false` if not null, `true` if null (and the state is updated).
			 */
			public is_null_byte( if_null_case: number ): boolean{
				if( this.get_byte() === 0 ) return false;
				this.slot.state = if_null_case;
				return true;
			}

//#endregion
			
			/**
			 * Ensures that at least one byte is available in the buffer.
			 * If not, it sets the state machine to retry.
			 *
			 * @param retry_case The state to transition to if a retry is needed.
			 * @returns `true` if bytes are available, `false` otherwise.
			 */
			public has_bytes( retry_case: number ): boolean{
				if( this.byte < this.byte_max ) return true;
				this.mode = RETRY;
				this.slot.state = retry_case;
				return false;
			}
			
			// @ts-ignore
			slot: Receiver.Slot;
			
			/**
			 * Gets a value indicating whether the receiver is active and ready to process data.
			 */
			get isOpen(): boolean{ return this.slot !== undefined; }
			
			/** A weak reference to a `Slot` instance for potential reuse. */
			slot_ref: WeakRef<Receiver.Slot> = new WeakRef( new Receiver.Slot( this, undefined ) );
			
			/**
			 * Closes the receiver, resetting its state.
			 */
			close(): void{ this.reset(); }
			
			/**
			 * Resets the receiver to its initial state, clearing all slots, buffers, and state variables.
			 */
			reset(): void{
				if( !this.slot ) return;
				
				for( let s: Receiver.Slot | undefined = this.slot; s !== undefined; s = s.next ) s.dst = undefined;
				this.slot = undefined!;
				
				this.#cache.reset();
				
				this.buffer = undefined;
				this.mode = OK;
				this.bytes_left = 0;
				this.u4 = 0;
				this.u8 = 0n;
				this.str = undefined;
			}
			
			/**
			 * An abstract factory method that must be implemented by subclasses. It is called when a new packet ID
			 * is read from the stream and should return a destination object to hold the packet's data.
			 *
			 * @param id The packet ID read from the stream.
			 * @returns A `BytesDst` implementation for the corresponding packet type.
			 * @throws An error if the packet ID is unknown or invalid.
			 */
			protected abstract _OnReceiving( id: number ): AdHoc.Channel.Receiver.BytesDst;
			
			/**
			 * An abstract method called after a packet has been fully deserialized.
			 * Subclasses can implement this to perform post-processing on the completed packet.
			 *
			 * @param received The destination object containing the fully deserialized packet.
			 */
			protected abstract _OnReceived( received: AdHoc.Channel.Receiver.BytesDst ): void;
			
			/**
			 * The main entry point for writing data into the receiver. It drives the internal state machine
			 * to parse the incoming byte stream.
			 *
			 * @param src The source `DataView` containing bytes to process.
			 * @param byte The starting index in the source `DataView`.
			 * @param bytes The number of bytes to process.
			 * @returns The number of bytes consumed, or -1 if the receiver was closed during processing.
			 */
			write( src: DataView, byte: number, bytes: number ): number{
				this.byte = byte;
				this.byte_max = byte + bytes;
				
				const remaining = this.byte_max - this.byte;
				if( remaining < 1 ) return 0;
				
				this.buffer = src;
				write: {
					for( ; this.byte_max - this.byte; ){
						if( this.slot && this.slot.dst )
							switch( this.mode ){
								case VAL:
									if( this.#cache.complete() ) break;
									break write;
								case LEN0:
									if( !this.#cache.complete() ) break write;
									this.slot.check_len0( this.get4() );
									break;
								case LEN1:
									if( !this.#cache.complete() ) break write;
									this.slot.check_len1( this.get4() );
									break;
								case LEN2:
									if( !this.#cache.complete() ) break write;
									this.slot.check_len2( this.get4() );
									break;
								case VARINT4:
									if( this.#retry_get_varint4( this.slot.state ) ) break;
									break write;
								case VARINT8:
									if( this.#retry_get_varint8( this.slot.state ) ) break;
									break write;
								case STR:
									if( !this.#varint() ) break write;
									
									if( this.u4_ == -1 ){
										if( !this.#check_length_and_getting_string() ) break write;
									}else{
										this.#chs![this.u4_++] = this.u4;
										if( !this.#getting_string() ) break write;
									}
									break;
							}
						else
							try{
								if( !this.#cache.try_get( this.id_bytes ) ) break write;
								
								const dst = this._OnReceiving( this.get4_( this.id_bytes ) );
								if( !this.slot ) if( !( this.slot = this.slot_ref.deref()! ) ) this.slot_ref = new WeakRef( ( this.slot = new Receiver.Slot( this, undefined ) ) );
								
								this.slot.dst = dst;
								this.bytes_left = 0;
								this.u8 = 0n;
								this.u8_ = 0n;
								this.u4 = 0;
								this.u4_ = 0;
								this.slot!.state = 0;
								this.handler?.OnReceiving( this, dst );
								if( this.slot == undefined ) return -1;
							}catch( ex ){
								this.reset();
								AdHoc.Channel.Receiver.error_handler( this, AdHoc.Channel.Receiver.OnError.INVALID_ID );
								break;
							}
						
						this.mode = OK;
						for( ; ; )
							if( !this.slot!.dst!.__put_bytes( this ) )
								break write;
							else{
								if( this.slot!.prev ) this.slot = this.slot!.prev;
								else break;
							}
						
						this._OnReceived( this.slot!.dst! );
						this.handler?.OnReceived( this, this.slot!.dst! );
						if( this.slot == undefined ) return -1;
						this.slot!.dst = undefined;
					}
					
					if( !this.slot || !this.slot.dst ) this.reset();
				} //write:
				this.buffer = undefined;
				
				return remaining;
			}
			
			/**
			 * Attempts to read a specified number of bytes from the stream, buffering if necessary.
			 * The number of bytes is determined by the `bytes_left` property.
			 *
			 * @param get_case The state to transition to if a retry is needed.
			 * @returns `true` if the bytes are available, `false` if a retry is scheduled.
			 */
			try_get( get_case: number ): boolean{ return this.try_get_( this.bytes_left, get_case ); }
			
			/**
			 * Attempts to read a specified number of bytes from the stream, buffering if necessary.
			 *
			 * @param bytes The number of bytes to read.
			 * @param get_case The state to transition to if a retry is needed.
			 * @param mode_on_retry The mode to set on retry (defaults to `VAL`).
			 * @returns `true` if the bytes are available, `false` if a retry is scheduled.
			 */
			try_get_( bytes: number, get_case: number, mode_on_retry: number = VAL ): boolean{
				if( this.#cache.try_get( bytes ) ) return true;
				
				this.bytes_left = bytes;
				this.mode = mode_on_retry;
				this.slot!.state = get_case;
				return false;
			}
			
			/**
			 * Gets the number of bytes remaining in the current input buffer chunk.
			 */
			get remaining(): number{ return this.byte_max - this.byte; }
			
			/**
			 * Gets the current read position within the input buffer chunk.
			 */
			get position(): number{ return this.byte; }
			
			/**
			 * Manually sets the state machine to retry at a specified state.
			 *
			 * @param the_case The state to retry from.
			 */
			retry_at( the_case: number ){
				this.slot!.state = the_case;
				this.mode = RETRY;
			}

//#region bits
			
			/**
			 * Initializes the state for reading packed bits from the stream.
			 */
			public init_bits(){
				this.bits = 0;
				this.bit = 8;
			}
			
			/**
			 * Gets the most recently read bits, stored in the internal `u4` register.
			 */
			get get_bits(): number{
				return this.u4;
			}
			
			/**
			 * Reads a specified number of bits from the stream. Assumes bytes are available.
			 *
			 * @param len_bits The number of bits to read (1-8).
			 * @returns The extracted bits as a number.
			 */
			public get_bits_( len_bits: number ): number{
				let ret: number;
				if( this.bit + len_bits < 9 ){
					ret = ( this.bits >> this.bit ) & ( 0xff >> ( 8 - len_bits ) );
					this.bit += len_bits;
				}else{
					ret = ( ( this.bits >> this.bit ) | ( ( this.bits = this.buffer!.getUint8( this.byte++ ) ) << ( 8 - this.bit ) ) ) & ( 0xff >> ( 8 - len_bits ) );
					this.bit = this.bit + len_bits - 8;
				}
				
				return ret;
			}
			
			/**
			 * Attempts to read a specified number of bits, scheduling a retry if insufficient bytes are available.
			 * The result is stored in the internal `u4` register.
			 *
			 * @param len_bits The number of bits to read (1-8).
			 * @param this_case The state to transition to if a retry is needed.
			 * @returns `true` if the bits were read successfully, `false` otherwise.
			 */
			public try_get_bits( len_bits: number, this_case: number ): boolean{
				if( this.bit + len_bits < 9 ){
					this.u4 = ( this.bits >> this.bit ) & ( 0xff >> ( 8 - len_bits ) );
					this.bit += len_bits;
				}else if( this.byte < this.byte_max ){
					this.u4 = ( ( this.bits >> this.bit ) | ( ( this.bits = this.buffer!.getUint8( this.byte++ ) ) << ( 8 - this.bit ) ) ) & ( 0xff >> ( 8 - len_bits ) );
					this.bit = this.bit + len_bits - 8;
				}else{
					this.retry_at( this_case );
					return false;
				}
				return true;
			}

//#endregion
//#region varint
			
			/**
			 * Reads a varint-encoded length prefix from the bit stream. The actual length is `value + 1`.
			 *
			 * @param bits The number of bits used for the length prefix.
			 * @param this_case The state to transition to if a retry is needed.
			 * @returns `true` if successful, `false` on retry.
			 */
			public try_get_varint_bits1( bits: number, this_case: number ): boolean{
				if( !this.try_get_bits( bits, this_case ) ) return false;
				this.bytes_left = this.get_bits + 1;
				return true;
			}
			
			/**
			 * Reads a varint-encoded length prefix from the bit stream.
			 *
			 * @param bits The number of bits used for the length prefix.
			 * @param this_case The state to transition to if a retry is needed.
			 * @returns `true` if successful, `false` on retry.
			 */
			public try_get_varint_bits( bits: number, this_case: number ): boolean{
				if( !this.try_get_bits( bits, this_case ) ) return false;
				this.bytes_left = this.get_bits;
				return true;
			}
			
			/**
			 * Attempts to read a varint-encoded 32-bit integer from the stream.
			 * The result is stored in the internal `u4` register.
			 *
			 * @param next_case The state to transition to on completion or retry.
			 * @returns `true` if the varint was fully read, `false` if a retry is scheduled.
			 */
			public try_get_varint4( next_case: number ): boolean{
				this.u4 = 0;
				this.bytes_left = 0;
				
				return this.#retry_get_varint4( next_case );
			}
			
			/**
			 * Continues reading a varint-encoded 32-bit integer.
			 * @param next_case The state to transition to on completion or retry.
			 * @returns `true` if the varint was fully read, `false` if a retry is scheduled.
			 */
			#retry_get_varint4( next_case: number ): boolean{
				while( this.byte < this.byte_max ){
					const i = this.buffer!.getInt8( this.byte++ );
					const v = i & 0x7f;
					
					if( this.bytes_left + 7 < 33 ) this.u4 |= v << this.bytes_left;
					else this.u4 = 32 < this.bytes_left ?
					               ( ~~( this.u4 / 0xffff_ffff ) | ( v << ( this.bytes_left - 32 ) ) ) * 0x1_0000_0000 + ( ~~this.u4 >>> 0 ) :
					               ( v >>> ( 7 - ( 31 - this.bytes_left ) ) ) * 0x1_0000_0000 + ( ( this.u4 | ( ( v & ( 0x7f >>> ( 31 - this.bytes_left ) ) ) << this.bytes_left ) ) >>> 0 );
					
					if( -1 < i ) return true;
					
					this.bytes_left += 7;
				}
				
				this.slot.state = next_case;
				this.mode = VARINT4;
				return false;
			}
			
			/**
			 * Reads a varint-encoded integer (used for string processing).
			 * @returns `true` if the varint was fully read, `false` otherwise.
			 */
			#varint(): boolean{
				for( let b = 0; this.byte < this.byte_max; this.u4 |= ( b & 0x7f ) << this.bytes_left, this.bytes_left += 7 )
					if( ( b = this.buffer!.getUint8( this.byte++ ) ) < 0x80 ){
						this.u4 |= b << this.bytes_left;
						return true;
					}
				return false;
			}
			
			/**
			 * Attempts to read a varint-encoded 64-bit integer from the stream.
			 * The result is stored in the internal `u8` register.
			 *
			 * @param next_case The state to transition to on completion or retry.
			 * @returns `true` if the varint was fully read, `false` if a retry is scheduled.
			 */
			public try_get_varint8( next_case: number ): boolean{
				this.u4 = 0;
				this.bit = 0;
				this.bytes_left = 28; //28=7 * 4
				this.tmp_bytes = 0;
				
				return this.#retry_get_varint8( next_case );
			}
			
			/**
			 * Continues reading a varint-encoded 64-bit integer.
			 * @param next_case The state to transition to on completion or retry.
			 * @returns `true` if the varint was fully read, `false` if a retry is scheduled.
			 */
			#retry_get_varint8( next_case: number ): boolean{
				while( this.byte < this.byte_max ){
					const b = this.buffer!.getInt8( this.byte++ );
					if( b < 0 ){
						if( this.bit === this.bytes_left ){
							if( this.bytes_left === 31 ) throw Error( "Alarm. Overflow on decoding varint." );
							
							this.tmp_bytes = ( this.u4 | ( b << 28 ) ) >>> 0;
							
							this.u4 = ( b >> 4 ) & 0x7;
							this.bit = 3;
							this.bytes_left = 31; // 31 = 3 + 7 * 4
						}else{
							this.u4 |= ( b & 0x7f ) << this.bit;
							this.bit += 7;
						}
						continue;
					}
					
					this.u4 |= b << this.bit;
					
					if( this.bytes_left === 31 )
						if( this.bit < 14 )
							this.u8 = BigInt( this.u4 * 0x1_0000_0000 + this.tmp_bytes );
						else{
							this.tmp.setUint32( 0, this.tmp_bytes, true );
							this.tmp.setUint32( 4, this.u4, true );
							this.u8 = this.tmp.getBigUint64( 0, true );
						}
					else this.u8 = BigInt( this.u4 );
					
					return true;
				}
				this.slot.state = next_case;
				this.mode = VARINT8;
				return false;
			}

//#endregion
			
			/** Reads a boolean (1 byte) from the stream. */
			public get_bool(): boolean{
				const ret = this.buffer!.getUint8( this.byte ) == 1;
				this.byte += 1;
				return ret;
			}
			
			/** Reads a nullable boolean (1 byte) from the stream (0=false, 1=true, 2=undefined). */
			public get_booL(): boolean | undefined{
				const ret = this.buffer!.getUint8( this.byte );
				this.byte += 1;
				return ret == 2 ?
				       undefined :
				       ret == 1;
			}
			
			/** Reads a signed byte (int8) from the stream. */
			public get_sbyte(): number{
				const ret = this.buffer!.getInt8( this.byte );
				this.byte += 1;
				return ret;
			}
			
			/** Reads an unsigned byte (uint8) from the stream. */
			public get_byte(): number{
				const ret = this.buffer!.getUint8( this.byte );
				this.byte += 1;
				return ret;
			}
			
			/** Reads a signed short (int16, little-endian) from the stream. */
			public get_short(): number{
				const ret = this.buffer!.getInt16( this.byte, true );
				this.byte += 2;
				return ret;
			}
			
			/** Reads a char (uint16, little-endian) from the stream. */
			public get_char(): number{
				const ret = this.buffer!.getUint16( this.byte, true );
				this.byte += 2;
				return ret;
			}
			
			/** Reads an unsigned short (uint16, little-endian) from the stream. */
			public get_ushort(): number{
				const ret = this.buffer!.getUint16( this.byte, true );
				this.byte += 2;
				return ret;
			}
			
			/** Reads a signed integer (int32, little-endian) from the stream. */
			public get_int(): number{
				const ret = this.buffer!.getInt32( this.byte, true );
				this.byte += 4;
				return ret;
			}
			
			/** Reads an unsigned integer (uint32, little-endian) from the stream. */
			public get_uint(): number{
				const ret = this.buffer!.getUint32( this.byte, true );
				this.byte += 4;
				return ret;
			}
			
			/** Reads a signed long (int64, little-endian) from the stream. */
			public get_long(): bigint{
				const ret = this.buffer!.getBigInt64( this.byte, true );
				this.byte += 8;
				return ret;
			}
			
			/**
			 * Converts high and low 32-bit signed integers into a `bigint`.
			 * @param hi The high 32 bits.
			 * @param lo The low 32 bits.
			 * @returns The combined `bigint` value.
			 */
			public to_long( hi: number, lo: number ): bigint{
				this.tmp.setUint32( 0, lo, true );
				this.tmp.setUint32( 4, hi, true );
				return this.tmp.getBigInt64( 0, true );
			}
			
			/**
			 * Combines a high 32-bit signed integer and a low 32-bit unsigned integer into a `number`.
			 * @param hi The high 32 bits.
			 * @param ulo The unsigned low 32 bits.
			 * @returns The combined number.
			 */
			public to_long_( hi: number, ulo: number ): number{
				return hi < 0 ?
				       hi * 0x1_0000_0000 - ulo :
				       hi * 0x1_0000_0000 + ulo;
			}
			
			/** Reads an unsigned long (uint64, little-endian) from the stream. */
			public get_ulong(): bigint{
				const ret = this.buffer!.getBigUint64( this.byte, true );
				this.byte += 8;
				return ret;
			}
			
			/**
			 * Converts high and low 32-bit unsigned integers into an unsigned `bigint`.
			 * @param hi The high 32 bits.
			 * @param lo The low 32 bits.
			 * @returns The combined unsigned `bigint` value.
			 */
			public to_ulong( hi: number, lo: number ): bigint{
				this.tmp.setUint32( 0, lo, true );
				this.tmp.setUint32( 4, hi, true );
				return this.tmp.getBigUint64( 0, true );
			}
			
			/** Reads a float (float32, little-endian) from the stream. */
			public get_float(): number{
				const ret = this.buffer!.getFloat32( this.byte, true );
				this.byte += 4;
				return ret;
			}
			
			/** Reads a double (float64, little-endian) from the stream. */
			public get_double(): number{
				const ret = this.buffer!.getFloat64( this.byte, true );
				this.byte += 8;
				return ret;
			}
			
			/** Reads a variable-length integer (1-7 bytes) from the stream, with length determined by `bytes_left`. */
			public get4(): number{
				return this.get4_( this.bytes_left );
			}
			
			/**
			 * Reads a variable-length integer (1-7 bytes) from the stream.
			 *
			 * @param bytes The number of bytes to read for the integer.
			 * @returns The extracted integer value.
			 */
			public get4_( bytes: number ): number{
				const byte = this.byte;
				this.byte += bytes;
				
				switch( bytes ){
					case 7:
						return this.buffer!.getUint32( byte, true ) + this.buffer!.getUint16( byte + 4, true ) * 0x1_0000_0000 + this.buffer!.getUint8( byte + 6 ) * 0x1_0000_0000_0000;
					case 6:
						return this.buffer!.getUint32( byte, true ) + this.buffer!.getUint16( byte + 4, true ) * 0x1_0000_0000;
					case 5:
						return this.buffer!.getUint32( byte, true ) + this.buffer!.getUint8( byte + 4 ) * 0x1_0000_0000;
					case 4:
						return this.buffer!.getUint32( byte, true );
					case 3:
						return this.buffer!.getUint8( byte ) + ( this.buffer!.getUint16( byte + 1, true ) << 8 );
					case 2:
						return this.buffer!.getUint16( byte, true );
				}
				return this.buffer!.getUint8( byte );
			}
			
			/**
			 * Reads a signed variable-length integer (1-7 bytes) from the stream.
			 *
			 * @param bytes The number of bytes to read for the signed integer.
			 * @returns The extracted signed integer value.
			 */
			public get4_signed( bytes: number ): number{
				const byte = this.byte;
				this.byte += bytes;
				let hi = 0;
				
				switch( bytes ){
					case 7:
						hi = this.buffer!.getUint16( byte + 4, true ) * 0x1_0000_0000 + this.buffer!.getInt8( byte + 6 ) * 0x1_0000_0000_0000;
						break;
					case 6:
						hi = this.buffer!.getInt16( byte + 4, true ) * 0x1_0000_0000;
						break;
					case 5:
						hi = this.buffer!.getInt8( byte + 4 ) * 0x1_0000_0000;
						break;
					case 4:
						return this.buffer!.getInt32( byte, true );
					case 3:
						return this.buffer!.getUint8( byte ) | ( this.buffer!.getInt16( byte + 1, true ) << 8 );
					case 2:
						return this.buffer!.getInt16( byte, true );
					case 1:
						return this.buffer!.getInt8( byte );
				}
				
				return hi < 0 ?
				       hi - this.buffer!.getUint32( byte, true ) :
				       hi + this.buffer!.getUint32( byte, true );
			}
			
			/** Reads a variable-length long (1-8 bytes) from the stream, with length determined by `bytes_left`. */
			public get8(): bigint{
				return this.get8_( this.bytes_left );
			}
			
			/**
			 * Reads a variable-length long (1-8 bytes) from the stream.
			 *
			 * @param bytes The number of bytes to read for the long integer.
			 * @returns The extracted `bigint` value.
			 */
			public get8_( bytes: number ): bigint{
				const byte = this.byte;
				
				switch( bytes ){
					case 8:
						this.byte += bytes;
						return this.buffer!.getBigUint64( byte, true );
					case 7: //56 bits
						this.byte += bytes;
						this.tmp.setUint32( 0, this.buffer!.getUint32( byte, true ), true );
						this.tmp.setUint32( 4, this.buffer!.getUint16( byte + 4, true ) | ( this.buffer!.getUint8( byte + 6 ) << 16 ), true );
						return this.tmp.getBigUint64( 0, true );
				}
				return BigInt( this.get4_( bytes ) );
			}
			
			/**
			 * Reads a signed variable-length long (1-8 bytes) from the stream.
			 *
			 * @param bytes The number of bytes to read for the signed long integer.
			 * @returns The extracted signed `bigint` value.
			 */
			public get8_signed( bytes: number ): bigint{
				const byte = this.byte;
				
				switch( bytes ){
					case 8:
						this.byte += bytes;
						return this.buffer!.getBigInt64( byte, true );
					case 7: //56 bits
						this.byte += bytes;
						this.tmp.setUint32( 0, this.buffer!.getUint32( byte, true ), true );
						this.tmp.setUint32( 4, this.buffer!.getUint16( byte + 4, true ) | ( this.buffer!.getInt8( byte + 6 ) << 16 ), true );
						return this.tmp.getBigInt64( 0, true );
				}
				return BigInt( this.get4_signed( bytes ) );
			}
			
			/** An internal cache for buffering bytes when a read operation cannot be completed in one chunk. */
			readonly #cache = new Receiver.Cache( this );

//#region string
			
			/**
			 * Gets the fully decoded string after a successful `try_get_string` operation.
			 *
			 * @returns The decoded string.
			 */
			public get_string(): string{
				const ret = this.str;
				this.str = undefined;
				return ret!;
			}
			
			/** A weak reference to a `Uint16Array` for string decoding to allow for memory reuse. */
			#chs_ref: WeakRef<Uint16Array> = new WeakRef( new Uint16Array( 255 ) );
			/** The `Uint16Array` used for storing decoded string characters. */
			#chs: Uint16Array | undefined;
			
			/** The maximum number of characters allowed for the current string read operation. */
			#max_items = 0;
			
			/**
			 * Attempts to read a string from the stream. The string is encoded with a varint length prefix
			 * followed by varint-encoded characters.
			 *
			 * @param max_chars The maximum number of characters allowed in the string to prevent overflow attacks.
			 * @param get_string_case The state to transition to on completion or retry.
			 * @returns `true` if the string was fully read, `false` if a retry is scheduled.
			 */
			public try_get_string( max_chars: number, get_string_case: number ): boolean{
				this.#max_items = max_chars;
				this.u4_ = -1;
				
				this.u4 = 0;
				this.bytes_left = 0;
				
				if(
					this.#varint() &&
					this.#check_length_and_getting_string()
				)
					return true;
				
				this.slot!.state = get_string_case;
				this.mode = STR;
				return false;
			}
			
			/**
			 * Checks the decoded string length and begins reading characters.
			 * @returns `true` if character reading started, `false` otherwise.
			 */
			#check_length_and_getting_string(): boolean{
				if( this.#max_items < this.u4 ) Receiver.error_handler( this, Receiver.OnError.OVERFLOW, Error( "In check_length_and_getting_string(): boolean{} max_items < u4 : " + this.#max_items + " < " + this.u4 ) );
				
				if( ( !this.#chs && !( this.#chs = this.#chs_ref.deref() ) ) || this.#chs.length < this.u4 ) this.#chs_ref = new WeakRef<Uint16Array>( ( this.#chs = new Uint16Array( this.u4 ) ) );
				
				this.#max_items = this.u4;
				this.u4_ = 0;
				
				return this.#getting_string();
			}
			
			#decoder = new TextDecoder( "utf-16" );
			
			/**
			 * Continues reading varint-encoded characters and decodes the final string.
			 * @returns `true` if the string is complete, `false` if more data is needed.
			 */
			#getting_string(): boolean{
				while( this.u4_ < this.#max_items ){
					this.u4 = 0;
					this.bytes_left = 0;
					
					if( this.#varint() ) this.#chs![this.u4_++] = this.u4;
					else return false;
				}
				this.str = this.#decoder.decode( this.#chs!.subarray( 0, this.#max_items ) );
				return true;
			}

//#endregion
			
			/**
			 * Initiates reading a nested data structure from the stream.
			 *
			 * @typeparam DST The type of the nested `BytesDst`.
			 * @param dst The destination object for the nested structure.
			 * @returns The destination object.
			 */
			get_bytes<DST extends Receiver.BytesDst>( dst: DST ): DST{
				this.slot.state = 0;
				dst.__put_bytes( this );
				return dst;
			}
			
			/**
			 * Attempts to read a nested data structure from the stream, scheduling a retry if necessary.
			 *
			 * @typeparam DST The type of the nested `BytesDst`.
			 * @param dst The destination object for the nested structure.
			 * @param next_case The state to transition to on completion or retry.
			 * @returns The destination object if successful, or `undefined` if a retry is scheduled.
			 */
			try_get_bytes<DST extends Receiver.BytesDst>( dst: DST, next_case: number ): DST | undefined{
				const s = this.slot!;
				( this.slot = s.next ??= new Receiver.Slot( this, s ) ).dst = dst;
				this.slot.state = 0;
				this.u4_ = 0;
				this.u8_ = 0n;
				if( dst.__put_bytes( this ) ){
					this.slot = s;
					return dst;
				}
				
				s.state = next_case;
				
				return undefined;
			}
			
			/**
			 * Reads a sequence of raw bytes from the stream into a destination array.
			 *
			 * @param dst The destination `Uint8Array` to write bytes into.
			 * @param dst_byte The starting byte offset in the destination array.
			 * @param dst_bytes The number of bytes to read.
			 * @param retry_case The state to transition to if a retry is needed.
			 * @returns The number of bytes actually copied to `dst`.
			 */
			public get_bytes__( dst: Uint8Array, dst_byte: number, dst_bytes: number, retry_case: number ): number{
				
				if( this.remaining < dst_bytes ){
					dst_bytes = this.remaining;
					this.retry_at( retry_case );
				}
				new Uint8Array(
					dst.buffer,
					dst.byteOffset,
					dst.byteLength ).set(
					new Uint8Array(
						this.buffer!.buffer,
						this.buffer!.byteOffset + this.byte,
						dst_bytes
					), dst_byte );
				
				this.byte += dst_bytes
				return dst_bytes;
			}

// region dims
			/** An array to store dimension sizes when reading multi-dimensional arrays. */
			public dims: number[] = [];
			
			/**
			 * Reads a dimension size from the stream, checking against a maximum allowed value.
			 *
			 * @param max The maximum allowed size for this dimension.
			 * @param bytes The number of bytes encoding the dimension size.
			 * @returns The dimension size, or 0 if it exceeds the maximum.
			 */
			public dim( max: number, bytes: number ): number{
				const dim = this.get4_( bytes );
				if( max < dim ){
					AdHoc.Channel.Receiver.error_handler( this, AdHoc.Channel.Receiver.OnError.OVERFLOW, Error( "In dim(max: number, bytes: number): number{}  max < dim : " + max + " < " + dim ) );
					return 0;
				}
				
				this.dims.push( dim );
				return dim;
			}
			
			/**
			 * Reads a length value from the stream, checking against a maximum allowed value.
			 *
			 * @param max The maximum allowed length.
			 * @param bytes The number of bytes encoding the length.
			 * @returns The length, or 0 if it exceeds the maximum.
			 */
			public length( max: number, bytes: number ): number{
				const len = this.get4_( bytes );
				if( max < len ){
					AdHoc.Channel.Receiver.error_handler( this, AdHoc.Channel.Receiver.OnError.OVERFLOW, Error( "In length(max: number, bytes: number): number{} max < len : " + max + " < " + len ) );
					return 0;
				}
				return len;
			}

// endregion
			
			/**
			 * Returns a string representation of the `Receiver`'s current state, including its slot chain.
			 */
			toString( this: Receiver ): string{
				let str = "Receiver\n";
				if( !this.slot ) return str + " slot === undefined";
				let s = this.slot!;
				while( s.prev ) s = s.prev;
				for( let i = 0; ; i++ ){
					for( let ii = i; 0 < ii; ii-- ) str += "\t";
					str += `${ Object.prototype.toString.call( s.dst ) }\t${ s.state }\t${ s["index0"] }\t${ s["index1"] }\t${ s["index2"] } \n`;
					if( s === this.slot ) break;
					s = s.next!;
				}
				return str;
			}
			
			/** A temporary `DataView` for internal operations, avoiding frequent allocations. */
			tmp = new DataView( new ArrayBuffer( 16 ) );
		}
		
		export namespace Receiver{
			/**
			 * Defines the contract for a destination object that can be deserialized by a `Receiver`.
			 */
			export interface BytesDst{
				/**
				 * Called by the `Receiver` to populate this object with data from the stream.
				 * The implementation should read its fields from the `src` receiver.
				 *
				 * @param src The `Receiver` instance providing the byte stream and deserialization methods.
				 * @returns `true` if deserialization is complete, `false` if more data is needed for a nested object.
				 */
				__put_bytes( src: Receiver ): boolean;
				
				/**
				 * Gets the unique identifier for this packet type.
				 */
				get __id(): number;
			}
			
			/**
			 * Defines the contract for an event handler that can subscribe to `Receiver` events.
			 */
			export interface EventsHandler{
				/**
				 * Called when a new packet is identified but before its body is deserialized.
				 *
				 * @param src The `Receiver` instance.
				 * @param dst The newly created (but not yet populated) destination object for the packet.
				 */
				OnReceiving( src: Receiver, dst: BytesDst ): void;
				
				/**
				 * Called after a packet has been fully deserialized.
				 *
				 * @param src The `Receiver` instance.
				 * @param dst The fully populated destination object.
				 */
				OnReceived( src: Receiver, dst: BytesDst ): void;
			}
			
			/**
			 * Performs zig-zag encoding on a signed 32-bit integer.
			 * This maps small signed integers (e.g., -1, 1, -2, 2) to small unsigned integers,
			 * which is efficient for varint encoding.
			 *
			 * @param src The signed integer to encode.
			 * @returns The zig-zag encoded unsigned integer.
			 */
			export function zig_zag( src: number ): number{ return -( src & 1 ) ^ ( src >>> 1 ); }
			
			/**
			 * Performs zig-zag encoding on a signed number up to 53 bits.
			 * @param src The signed number to encode.
			 * @returns The zig-zag encoded unsigned number.
			 */
			export function zig_zag4( src: number ): number{
				return src < 0x8000_0000
				       ?
				       -( src & 1 ) ^ ( src >>> 1 )
				       :
				       p.set( src ).and( q.set( 1 ) ).neg().xor( q.set( src ).shru( 1 ) ).get();
			}
			
			/**
			 * Performs zig-zag encoding on a signed 64-bit `bigint`.
			 * @param src The signed `bigint` to encode.
			 * @returns The zig-zag encoded unsigned `bigint`.
			 */
			export function zig_zag8( src: bigint ): bigint{ return -( src & 1n ) ^ ( src >> 1n ); }
			
			/**
			 * A configurable error handler for `Receiver` events. The default implementation throws an error.
			 */
			export let error_handler: OnError.Handler = ( src: AdHoc.BytesDst, error_id: number, err?: Error ) => {
				switch( error_id ){
					case OnError.OVERFLOW:
						debugger
						throw new Error( "OVERFLOW at " + src + ( !err ?
						                                          "" :
						                 err! + err!.stack! ) );
					case OnError.INVALID_ID:
						debugger
						throw new Error( "INVALID_ID at " + src + ( !err ?
						                                            "" :
						                 err! + err!.stack! ) );
					case OnError.REJECTED:
						debugger
						throw new Error( "REJECTED at " + src + ( !err ?
						                                          "" :
						                 err! + err!.stack! ) );
				}
			};
			
			export namespace OnError{
				/** Error code: A received length or count exceeds a predefined maximum. */
				export const OVERFLOW = 0;
				/** Error code: A packet ID was received that does not correspond to a known packet type. */
				export const INVALID_ID = 1;
				/** Error code: A received packet was rejected by application logic (e.g., a pipeline stage). */
				export const REJECTED = 3
				/** Error code: A timeout occurred during packet reception. */
				export const TIMEOUT = 4;
				/** Error code: A generic or unexpected error occurred. */
				export const ERROR = 5;
				/** The type definition for a `Receiver` error handler function. */
				export type Handler = ( dst: AdHoc.BytesDst, error_id: number, err?: Error ) => void;
			}
			
			/**
			 * A cache for buffering incoming bytes for a `Receiver`. It seamlessly handles cases
			 * where a multi-byte value is split across two separate chunks of incoming data.
			 */
			export class Cache extends DataView<ArrayBuffer>{
				/** The `Receiver` instance that owns this cache. */
				public readonly dst: AdHoc.Channel.Receiver;
				/** A reference to the main data chunk when the cache holds the initial part of a value. */
				public tail: DataView | undefined;
				
				/**
				 * Constructs a `Cache`.
				 * @param dst The `Receiver` instance that will use this cache.
				 */
				constructor( dst: AdHoc.Channel.Receiver ){
					super( new ArrayBuffer( 16 ) );
					this.dst = dst;
				}
				
				/** The number of bytes required to complete the buffered value. */
				#bytes = 0;
				/** The current write position within the cache's internal buffer. */
				#byte = 0;
				
				/**
				 * Resets the cache to its initial empty state.
				 */
				public reset(){
					this.#bytes = 0;
					this.#byte = 0;
					this.tail = undefined;
				}
				
				/**
				 * Attempts to complete a buffered read by consuming bytes from the `Receiver`'s main buffer.
				 *
				 * @returns `true` if the buffered value is now complete, `false` if more data is still needed.
				 */
				public complete(): boolean{
					if( !this.#bytes ) return true;
					
					if( this.dst.byte_max - this.dst.byte < this.#bytes - this.#byte ){
						for(
							let max = this.dst.byte_max - this.dst.byte;
							this.#byte < max;
						)
							this.setUint8( this.#byte++, this.dst.buffer!.getUint8( this.dst.byte++ ) );
						return false;
					}
					
					this.dst.byte = this.#bytes = -this.#byte;
					this.tail = this.dst.buffer;
					this.dst.buffer = this;
					return true;
				}
				
				/**
				 * Attempts to read a specified number of bytes. If the bytes are available directly,
				 * it returns `true`. If not, it buffers the available bytes and returns `false`.
				 *
				 * @param bytes The total number of bytes required for the next read operation.
				 * @returns `true` if the bytes are fully available, `false` if buffering occurred.
				 */
				public try_get( bytes: number ): boolean{
					if( 0 < this.#bytes ) return this.complete();
					
					const available = this.dst.byte_max - this.dst.byte;
					
					if( !available ) return false;
					if( bytes <= available ) return true;
					
					this.#byte = 0;
					this.#bytes = bytes;
					while( this.#byte < available ) this.setUint8( this.#byte++, this.dst.buffer!.getUint8( this.dst.byte++ ) );
					return false;
				}
				
				/**
				 * Accesses a byte in the cache's internal buffer directly.
				 *
				 * @param byte The byte index to access.
				 * @returns The byte value at the specified index.
				 */
				public touch( byte: number ): number{ return super.getUint8( byte ); }
				
				/** Gets a signed byte (int8) from the cache, handling buffer transitions. */
				getInt8( byte: number ): number{ return super.getInt8( this.#read_from( byte, 1 ) ); }
				
				/** Gets an unsigned byte (uint8) from the cache, handling buffer transitions. */
				getUint8( byte: number ): number{ return super.getUint8( this.#read_from( byte, 1 ) ); }
				
				/** Gets a signed short (int16) from the cache, handling buffer transitions. */
				getInt16( byte: number, littleEndian?: boolean ): number{ return super.getInt16( this.#read_from( byte, 2 ), littleEndian ); }
				
				/** Gets an unsigned short (uint16) from the cache, handling buffer transitions. */
				getUint16( byte: number, littleEndian?: boolean ): number{ return super.getUint16( this.#read_from( byte, 2 ), littleEndian ); }
				
				/** Gets a signed integer (int32) from the cache, handling buffer transitions. */
				getInt32( byte: number, littleEndian?: boolean ): number{ return super.getInt32( this.#read_from( byte, 4 ), littleEndian ); }
				
				/** Gets an unsigned integer (uint32) from the cache, handling buffer transitions. */
				getUint32( byte: number, littleEndian?: boolean ): number{ return super.getUint32( this.#read_from( byte, 4 ), littleEndian ); }
				
				/** Gets a signed long (int64) from the cache, handling buffer transitions. */
				getBigInt64( byte: number, littleEndian?: boolean ): bigint{
					return super.getBigInt64( this.#read_from( byte, 8 ), littleEndian );
				}
				
				/** Gets an unsigned long (uint64) from the cache, handling buffer transitions. */
				getBigUint64( byte: number, littleEndian?: boolean ): bigint{ return super.getBigUint64( this.#read_from( byte, 8 ), littleEndian ); }
				
				/** Gets a float (float32) from the cache, handling buffer transitions. */
				getFloat32( byte: number, littleEndian?: boolean ): number{ return super.getFloat32( this.#read_from( byte, 4 ), littleEndian ); }
				
				/** Gets a double (float64) from the cache, handling buffer transitions. */
				getFloat64( byte: number, littleEndian?: boolean ): number{ return super.getFloat64( this.#read_from( byte, 8 ), littleEndian ); }
				
				/**
				 * Internal helper to manage reading a value that may span the cache and the main buffer.
				 * @param byte The starting byte index of the value.
				 * @param bytes The number of bytes in the value.
				 * @returns The adjusted byte index after buffer transition.
				 */
				#read_from( byte: number, bytes: number ): number{
					if( bytes < -byte ) return byte - this.#bytes;
					
					byte = byte - this.#bytes;
					
					for( let read = 0, write = -this.#bytes, write_max = byte + bytes; write < write_max; ) this.setUint8( write++, this.tail!.getUint8( read++ ) );
					
					this.#bytes = 0;
					this.dst.buffer = this.tail;
					this.tail = undefined;
					
					return byte;
				}
			}

//#region Slot
			/**
			 * Manages the state for deserializing a single packet or nested data structure within a `Receiver`.
			 * Slots are linked together to handle nested objects.
			 */
			export class Slot extends Base.Receiver.Slot{
				/** The destination object being populated by this slot. */
				dst: BytesDst | undefined;
				
				public dst_( dst: BytesDst ): BytesDst{
					this.state = 0;
					return this.dst = dst;
				}
				
				/** The last read byte containing null-field bitmasks. */
				fields_nulls = 0;
				
				/**
				 * Gets the `BytesDst` object associated with the next slot in the chain.
				 * @typeparam DST The type of `BytesDst`.
				 * @returns The `BytesDst` object of the next slot.
				 */
				get_bytes<DST extends Receiver.BytesDst>( dst: DST ): DST{ return <DST> this.next!.dst; }
				
				/** A reference to the next slot in the chain (for nested objects). */
				next: Slot | undefined;
				/** A reference to the previous slot in the chain. */
				readonly prev: Slot | undefined;
				
				/**
				 * Constructs a `Slot`.
				 * @param dst The `Receiver` that owns this slot.
				 * @param prev The previous slot in the chain, or `undefined` if this is the root.
				 */
				constructor( dst: Receiver, prev: Slot | undefined ){
					super( dst, undefined );
					this.prev = prev;
					if( prev !== undefined )
						prev.next = this;
				}
			}

//#endregion
		}
		
		/**
		 * An abstract base class for serializing structured packets into a byte stream.
		 * It implements a state machine to produce bytes on demand for a consumer.
		 */
		export abstract class Transmitter extends Base.Transmitter implements AdHoc.BytesSrc{
			/** An optional event handler for transmit-related events. */
			handler: AdHoc.Channel.Transmitter.EventsHandler | undefined;
			
			/**
			 * Replaces the current event handler with a new one.
			 *
			 * @param handler The new event handler.
			 * @returns The previous event handler, or `undefined` if none was set.
			 */
			exchange( handler: AdHoc.Channel.Transmitter.EventsHandler ): AdHoc.Channel.Transmitter.EventsHandler | undefined{
				const tmp = this.handler;
				this.handler = handler;
				return tmp;
			}

//#region value pack transfer
			
			/**
			 * Schedules a `bigint` to be serialized as a nested value.
			 *
			 * @param src The `bigint` value to send.
			 * @param handler The `BytesSrc` object that will serialize the value.
			 * @param next_case The state to transition to on completion or retry.
			 * @returns `true` if the value was serialized immediately, `false` if a retry is scheduled.
			 */
			put_bytes8_( src: bigint, handler: Transmitter.BytesSrc, next_case: number ): boolean{
				this.u8 = src;
				return this.put_bytes_( handler, next_case );
			}
			
			/**
			 * Schedules a `bigint` to be serialized as a nested value.
			 *
			 * @param src The `bigint` value to send.
			 * @param handler The `BytesSrc` object that will serialize the value.
			 */
			put_bytes8( src: bigint, handler: Transmitter.BytesSrc ){
				this.u8 = src;
				return this.put_bytes( handler );
			}
			
			/**
			 * Schedules a `number` to be serialized as a nested value.
			 *
			 * @param src The `number` value to send.
			 * @param handler The `BytesSrc` object that will serialize the value.
			 * @param next_case The state to transition to on completion or retry.
			 * @returns `true` if the value was serialized immediately, `false` if a retry is scheduled.
			 */
			put_bytes4_( src: number, handler: Transmitter.BytesSrc, next_case: number ): boolean{
				this.u4 = src;
				return this.put_bytes_( handler, next_case );
			}
			
			/**
			 * Schedules a `number` to be serialized as a nested value.
			 *
			 * @param src The `number` value to send.
			 * @param handler The `BytesSrc` object that will serialize the value.
			 */
			put_bytes4( src: number, handler: Transmitter.BytesSrc ){
				this.u4 = src;
				return this.put_bytes( handler );
			}

//#endregion
			/**
			 * Schedules a nested data structure (`BytesSrc`) for serialization.
			 *
			 * @param src The `BytesSrc` object to serialize.
			 */
			put_bytes( src: Transmitter.BytesSrc ){
				this.slot.state = 1; // Skip writing the ID for nested objects.
				src.__get_bytes( this );
			}
			
			/**
			 * Schedules a nested data structure for serialization, with retry support.
			 *
			 * @param src The `BytesSrc` object to serialize.
			 * @param next_case The state to transition to on completion or retry.
			 * @returns `true` if serialization was successful, `false` if a retry is scheduled.
			 */
			put_bytes_( src: Transmitter.BytesSrc, next_case: number ): boolean{
				const s = this.slot!;
				
				( this.slot = s.next ??= new Transmitter.Slot( this, s ) ).src = src;
				this.slot.state = 1;
				
				if( src.__get_bytes( this ) ){
					this.slot = s;
					return true;
				}
				
				s.state = next_case;
				return false;
			}
			
			/**
			 * Writes a sequence of raw bytes from a source array into the output buffer.
			 *
			 * @param src The source `Uint8Array` to read bytes from.
			 * @param src_byte The starting byte offset in the source array.
			 * @param src_bytes The number of bytes to write.
			 * @param retry_case The state to transition to if the output buffer is full.
			 * @returns The number of bytes actually written to the output buffer.
			 */
			public put_bytes__( src: Uint8Array, src_byte: number, src_bytes: number, retry_case: number ): number{
				if( this.remaining < src_bytes ){
					src_bytes = this.remaining
					this.retry_at( retry_case );
				}
				new Uint8Array(
					this.buffer!.buffer,
					this.buffer!.byteOffset,
					this.buffer!.byteLength
				).set(
					new Uint8Array(
						src.buffer,
						src.byteOffset + src_byte,
						src_bytes
					), this.byte );
				
				this.byte += src_bytes
				return src_bytes;
			}
			
			
			/**
			 * Constructs a `Transmitter`.
			 * @param handler The event handler for `OnSerializing` and `OnSerialized` events.
			 */
			constructor( handler: AdHoc.Channel.Transmitter.EventsHandler | undefined ){
				super();
				this.handler = handler!;
			}
			
			subscriber: ( src: AdHoc.BytesSrc ) => void = ( src ) => {};
			
			/**
			 * Subscribes a function to be called when the transmitter is ready to produce more bytes.
			 *
			 * @param subscriber The function to call when new bytes can be produced.
			 * @returns The previous subscriber function.
			 */
			subscribe_on_new_bytes_to_transmit_arrive( subscriber: ( src: BytesSrc ) => void ): ( src: BytesSrc ) => void{
				const tmp = this.subscriber;
				this.subscriber = subscriber;
				this.notify_subscribers();
				return tmp;
			}
			
			/** Notifies the subscriber if the transmitter is idle and can produce more data. */
			notify_subscribers(): void{ if( this.subscriber && this.IsIdle() ) this.subscriber( this ); }

//#region sending
			
			/**
			 * An abstract method that must be implemented by subclasses. It should return the next
			 * packet object (`BytesSrc`) to be serialized from the outgoing queue.
			 *
			 * @returns The next packet to serialize, or `undefined` if the queue is empty.
			 */
			protected abstract _OnSerializing(): AdHoc.Channel.Transmitter.BytesSrc | undefined;
			
			/**
			 * An abstract method called after a packet has been fully serialized into the byte stream.
			 *
			 * @param transmitted The packet object that was just serialized.
			 */
			protected abstract _OnSerialized( transmitted: Transmitter.BytesSrc ): void;
			
			/**
			 * An abstract method that must indicate whether the transmitter has pending data to send.
			 * @returns `true` if the transmitter is idle, `false` otherwise.
			 */
			abstract IsIdle(): boolean;

//#endregion
			
			/**
			 * Gets the current write position within the output buffer chunk.
			 */
			get position(): number{
				return this.byte;
			}
			
			/**
			 * Gets the number of bytes remaining in the current output buffer chunk.
			 */
			get remaining(): number{
				return this.byte_max - this.byte;
			}

//#region nulls
			
			/**
			 * Allocates space for a null-field byte and initializes it.
			 *
			 * @param field0_bit The initial bitmask for the null fields.
			 * @param this_case The state to transition to if a retry is needed.
			 * @returns `true` if successful, `false` on retry.
			 */
			public init_fields_nulls( field0_bit: number, this_case: number ): boolean{
				if( !this.allocate( 1, this_case ) ) return false;
				this.slot!.fields_nulls = field0_bit;
				return true;
			}
			
			/**
			 * Sets a bit in the current null-field byte, marking a field as not null.
			 *
			 * @param field The bitmask for the field to set.
			 */
			public set_fields_nulls( field: number ): void{ this.slot!.fields_nulls |= field; }
			
			/**
			 * Writes the accumulated null-field byte to the output buffer.
			 */
			public flush_fields_nulls(): void{ this.buffer!.setUint8( this.byte++, this.slot!.fields_nulls ); }
			
			/**
			 * Checks if a field is marked as null. If so, it transitions the state machine.
			 *
			 * @param field The bitmask for the field to check.
			 * @param next_field_case The state to transition to if the field is *not* null.
			 * @returns `true` if the field is null, `false` otherwise.
			 */
			public is_null( field: number, next_field_case: number ){
				if( !( this.slot!.fields_nulls & field ) ){
					this.slot.state = next_field_case;
					return true;
				}
				return false;
			}

//#endregion
//#region Slot
			
			// @ts-ignore
			slot: Transmitter.Slot;
			
			/**
			 * Gets a value indicating whether the transmitter is active.
			 */
			get isOpen(): boolean{
				return this.slot !== undefined;
			}
			
			/** A weak reference to a `Slot` instance for potential reuse. */
			slot_ref = new WeakRef( new Transmitter.Slot( this, undefined ) );
			
			/**
			 * Closes the transmitter, resetting its state.
			 */
			close(): void{
				this.reset();
			}
			
			/**
			 * Resets the transmitter to its initial state, clearing all slots, buffers, and state variables.
			 */
			reset(): void{
				if( !this.slot ) return;
				
				for( let s: Transmitter.Slot | undefined = this.slot; s != undefined; s = s.next ) s.src = undefined!;
				this.slot = undefined!;
				this.buffer = undefined;
				this.mode = OK;
				this.bytes_left = 0;
				this.u4 = 0;
				this.u8 = 0n;
				this.str = undefined;
			}

//#endregion
			
			/**
			 * Implements the `BytesSrc.read` method. Fills the destination `dst` buffer with serialized
			 * data from the transmitter's internal queue. This method is called by a consumer of the byte stream.
			 *
			 * @param dst The destination `DataView` to fill.
			 * @param byte The starting index in the destination.
			 * @param bytes The maximum number of bytes to write.
			 * @returns The number of bytes written, or -1 if there are no more packets to serialize.
			 */
			read( dst: DataView, byte: number, bytes: number ): number{
				this.byte = byte;
				this.byte_max = this.byte + bytes;
				
				if( this.byte_max - this.byte < 1 ) return 0;
				
				this.buffer = dst;
				const position = this.byte;
				read: for( ; ; ){
					if( this.slot && this.slot.src )
						switch( this.mode ){
							case STR:
								if( !this.#varint( this.u4_ ) ) break read;
								
								if( this.bytes_left == -1 ) this.bytes_left = 0;
								
								while( this.bytes_left < this.str!.length ) if( !this.#varint( this.str!.charCodeAt( this.bytes_left++ ) ) ) break read;
								
								this.str = undefined;
								break;
							case VAL:
								do{
									this.buffer.setUint8( this.byte++, this.tmp.getUint8( this.bytes_left++ ) );
									if( this.byte === this.byte_max ) break read;
								}while( this.bytes_left < this.tmp_bytes );
								break;
							case BITS_BYTES:
								if( this.byte_max - this.byte < this.#bits_transaction_bytes_ ) break read;
								this.#bits_byte = this.byte;
								this.byte++;
								
								for( let i = 0; i < this.bytes_left; i++ ) this.buffer?.setUint8( this.byte++, this.tmp.getUint8( i ) );
								break;
							case BITS_BYTES4:
								if( this.byte_max - this.byte < this.#bits_transaction_bytes_ ) break read;
								this.#bits_byte = this.byte;
								this.byte++;
								this.put_4( this.u4_, this.bytes_left );
								break;
							case BITS_BYTES8:
								if( this.byte_max - this.byte < this.#bits_transaction_bytes_ ) break read;
								this.#bits_byte = this.byte;
								this.byte++;
								this.put_8( this.u8, this.bytes_left );
								break;
							case VARINT4:
								if( this.put_varint4( this.u4_, this.slot.state ) ) break;
								break read;
							case VARINT8:
								if( this.put_varint8( this.u8_, this.slot.state ) ) break;
								break read;
							case BITS:
								if( this.byte_max - this.byte < this.#bits_transaction_bytes_ ) break read;
								this.#bits_byte = this.byte;
								this.byte = this.#bits_byte + 1;
								break;
						}
					else{
						this.u4 = 0;
						this.u8 = 0n;
						
						const src = this._OnSerializing();
						if( !src ){
							this.reset();
							break;
						}
						
						if( !this.slot ) if( !( this.slot = this.slot_ref!.deref()! ) ) this.slot_ref = new WeakRef( ( this.slot = new Transmitter.Slot( this, undefined ) ) );
						
						this.slot.src = src;
						this.slot.state = 0;
						this.bytes_left = 0;
						this.handler?.OnSerializing( this, src );
						if( this.slot == undefined ) return -1;
					}
					
					this.mode = OK;
					for( ; ; )
						if( !this.slot!.src!.__get_bytes( this ) ) break read;
						else{
							if( this.slot!.prev ) this.slot = this.slot!.prev;
							else break;
						}
					
					this._OnSerialized( this.slot.src! );
					this.handler?.OnSerialized( this, this.slot.src! );
					if( this.slot == undefined ) return -1;
					this.slot!.src = undefined!;
				} //read:
				
				this.buffer = undefined;
				
				return 0 < this.byte - position ?
				       this.byte - position :
				       -1;
			}
			
			/** Writes a boolean value as a single bit. Use within `init_bits`/`end_bits`. */
			public put_bool( src: any ): void{
				this.put_bits( src ?
				               1 :
				               0, 1 );
			}
			
			/**
			 * Writes a boolean value as a full byte (0 or 1).
			 * @param src The boolean value.
			 * @param next_case The state to transition to if the buffer is full.
			 * @returns `true` if successful, `false` on retry.
			 */
			public put_bool_( src: any, next_case: number ): boolean{
				return this.put_byte_( src ?
				                       1 :
				                       0, next_case );
			}
			
			/** Writes a nullable boolean as two bits (00=false, 01=true, 10=undefined). Use within `init_bits`/`end_bits`. */
			public put_booL( src: number ): void{
				this.put_bits( src === undefined ?
				               2 :
				               src ?
				               1 :
				               0, 2 );
			}
			
			/**
			 * Writes a nullable boolean as a full byte (0=false, 1=true, 2=undefined).
			 * @param src The nullable boolean value.
			 * @param next_case The state to transition to if the buffer is full.
			 * @returns `true` if successful, `false` on retry.
			 */
			public put_booL_( src: number, next_case: number ): boolean{
				return this.put_byte_( src === undefined ?
				                       2 :
				                       src ?
				                       1 :
				                       0, next_case );
			}
			
			/**
			 * Ensures a specified number of bytes are available in the output buffer.
			 *
			 * @param bytes The number of bytes to allocate.
			 * @param this_case The state to transition to if the buffer is full.
			 * @returns `true` if space is available, `false` if a retry is scheduled.
			 */
			public allocate( bytes: number, this_case: number ): boolean{
				this.slot!.state = this_case;
				if( bytes <= this.remaining ) return true;
				this.mode = RETRY;
				return false;
			}

//#region bits
			
			/** The buffer index where the current bit-packing byte is being written. */
			#bits_byte = -1;
			/** The total size in bytes of the current bit-packing transaction (header + data). */
			#bits_transaction_bytes_ = 0;
			
			/**
			 * Pre-allocates space for a bit-packing transaction, scheduling a retry if needed.
			 *
			 * @param transaction_bytes The total number of bytes for the entire transaction (header + data).
			 * @param this_case The state to transition to if the buffer is full.
			 * @returns `true` if space is available, `false` otherwise.
			 */
			public init_bits_( transaction_bytes: number, this_case: number ): boolean{
				if( ( this.#bits_transaction_bytes_ = transaction_bytes ) <= this.remaining ) return true;
				
				this.slot.state = this_case;
				this.byte = this.#bits_byte;
				
				this.mode = BITS;
				return false;
			}
			
			/**
			 * Initializes bit-packing mode.
			 *
			 * @param transaction_bytes The total number of bytes for the entire transaction (header + data).
			 * @param this_case The state to transition to if the buffer is full.
			 * @returns `true` if space is available, `false` otherwise.
			 */
			public init_bits( transaction_bytes: number, this_case: number ): boolean{
				if( this.byte_max - this.byte < ( this.#bits_transaction_bytes_ = transaction_bytes ) ){
					this.slot!.state = this_case;
					this.mode = RETRY;
					return false;
				}
				
				this.bits = 0;
				this.bit = 0;
				
				this.#bits_byte = this.byte++;
				return true;
			}
			
			/**
			 * Writes a specified number of bits to the output stream.
			 *
			 * @param src The bits to write.
			 * @param len_bits The number of bits to write (1-8).
			 */
			public put_bits( src: number, len_bits: number ): void{
				this.bits |= src << this.bit;
				if( ( this.bit += len_bits ) < 9 ) return;
				
				this.buffer!.setUint8( this.#bits_byte, this.bits );
				
				this.bits >>= 8;
				this.bit -= 8;
				
				this.#bits_byte = this.byte++;
			}
			
			/**
			 * Writes a specified number of bits to the output stream, with retry support.
			 *
			 * @param src The bits to write.
			 * @param len_bits The number of bits to write (1-8).
			 * @param continue_at_case The state to transition to if the buffer is full.
			 * @returns `true` if successful, `false` on retry.
			 */
			public put_bits_( src: number, len_bits: number, continue_at_case: number ): boolean{
				this.bits |= src << this.bit;
				if( ( this.bit += len_bits ) < 9 ) return true;
				
				this.buffer!.setUint8( this.#bits_byte, this.bits );
				
				this.bits >>= 8;
				this.bit -= 8;
				if( this.remaining < this.#bits_transaction_bytes_ ){
					this.slot.state = continue_at_case;
					return false;
				}
				this.#bits_byte = this.byte++;
				return true;
			}
			
			/**
			 * Finalizes bit-packing mode, writing any remaining bits to the buffer.
			 */
			public end_bits(){
				if( 0 < this.bit ) this.buffer!.setUint8( this.#bits_byte, this.bits );
				else this.byte = this.#bits_byte;
			}
			
			/**
			 * Writes nullability bits, with retry support.
			 * @param nulls The bitmask of nulls.
			 * @param nulls_bits The number of bits in the mask.
			 * @param continue_at_case The state to transition to if the buffer is full.
			 * @returns `true` if successful, `false` on retry.
			 */
			public put_nulls( nulls: number, nulls_bits: number, continue_at_case: number ): boolean{
				if( this.put_bits_( nulls, nulls_bits, continue_at_case ) ) return true;
				
				this.mode = BITS;
				return false;
			}
			
			/**
			 * Schedules a retry for a bit-packing operation.
			 * @param continue_at_case The state to retry from.
			 */
			public continue_bits_at( continue_at_case: number ){
				this.slot.state = continue_at_case;
				this.byte = this.#bits_byte;
				this.mode = BITS;
			}

//#endregion
			
			/**
			 * Writes a bit-packed header followed by a variable-length integer.
			 *
			 * @param info The header bits.
			 * @param info_bits The number of header bits.
			 * @param value The integer value to write.
			 * @param value_bytes The number of bytes for the integer value.
			 * @param continue_at_case The state to transition to on retry.
			 * @returns `true` if successful, `false` on retry.
			 */
			public put_bits_bytes4( info: number, info_bits: number, value: number, value_bytes: number, continue_at_case: number ): boolean{
				if( this.put_bits_( info, info_bits, continue_at_case ) ){
					this.put_4( value, value_bytes );
					return true;
				}
				
				this.u4_ = value;
				this.bytes_left = value_bytes;
				this.slot.state = continue_at_case;
				this.mode = BITS_BYTES4;
				return false;
			}
			
			/**
			 * Writes a bit-packed header followed by a nested data structure.
			 *
			 * @param info The header bits.
			 * @param info_bits The number of header bits.
			 * @param value The `BytesSrc` object to serialize.
			 * @param value_bytes The number of bytes for the nested object.
			 * @param continue_at_case The state to transition to on retry.
			 * @returns `true` if successful, `false` on retry.
			 */
			public put_bits_bytes( info: number, info_bits: number, value: Transmitter.BytesSrc, value_bytes: number, continue_at_case: number ): boolean{
				if( this.put_bits_( info, info_bits, continue_at_case ) ){
					this.put_bytes_( value, continue_at_case );
					return true;
				}
				
				if( Transmitter.tmp.slot === undefined ) Transmitter.tmp.slot = new Transmitter.Slot( Transmitter.tmp, undefined );
				Transmitter.tmp.slot.state = 1;
				Transmitter.tmp.byte = 0;
				Transmitter.tmp.byte_max = this.tmp.byteLength;
				Transmitter.tmp.buffer = this.tmp;
				
				value.__get_bytes( Transmitter.tmp );
				
				this.bytes_left = value_bytes;
				this.slot.state = continue_at_case;
				this.mode = BITS_BYTES;
				return false;
			}
			
			/**
			 * Writes a bit-packed header followed by a double-precision float.
			 * @returns `true` if successful, `false` on retry.
			 */
			public put_bits_bytes_double( info: number, info_bits: number, double: number, continue_at_case: number ): boolean{
				if( this.put_bits_( info, info_bits, continue_at_case ) ){
					this.put_double( double );
					return true;
				}
				this.tmp.setFloat64( 0, double )
				
				this.bytes_left = 8;
				this.slot.state = continue_at_case;
				this.mode = BITS_BYTES;
				return false;
			}
			
			/**
			 * Writes a bit-packed header followed by a single-precision float.
			 * @returns `true` if successful, `false` on retry.
			 */
			public put_bits_bytes_float( info: number, info_bits: number, float: number, continue_at_case: number ): boolean{
				if( this.put_bits_( info, info_bits, continue_at_case ) ){
					this.put_float( float );
					return true;
				}
				this.tmp.setFloat32( 0, float )
				
				this.bytes_left = 4;
				this.slot.state = continue_at_case;
				this.mode = BITS_BYTES;
				return false;
			}
			
			/**
			 * Writes a bit-packed header followed by a variable-length long.
			 *
			 * @param info The header bits.
			 * @param info_bits The number of header bits.
			 * @param value The `bigint` value to write.
			 * @param value_bytes The number of bytes for the long value.
			 * @param continue_at_case The state to transition to on retry.
			 * @returns `true` if successful, `false` on retry.
			 */
			public put_bits_bytes8( info: number, info_bits: number, value: bigint, value_bytes: number, continue_at_case: number ): boolean{
				if( this.put_bits_( info, info_bits, continue_at_case ) ){
					this.put_8( value, value_bytes );
					return true;
				}
				
				this.u8 = value;
				this.bytes_left = value_bytes;
				this.slot.state = continue_at_case;
				this.mode = BITS_BYTES8;
				return false;
			}

//#region varint
			/** Determines bytes needed for varint21 encoding. */
			#bytes1( src: number ): number{
				return src < 0x100 ?
				       1 :
				       2;
			}
			
			/** Writes a number using varint21 encoding (1 bit for length, 1-2 bytes for value). */
			public put_varint21( src: number, continue_at_case: number ){
				const bytes = this.#bytes1( src );
				return this.put_bits_bytes4( bytes - 1, 1, src, bytes, continue_at_case );
			}
			
			/** Writes a number using varint21 encoding, plus additional null bits. */
			public put_varint21_( src: number, continue_at_case: number, nulls: number, nulls_bits: number ){
				const bytes = this.#bytes1( src );
				return this.put_bits_bytes4( ( ( bytes - 1 ) << nulls_bits ) | nulls, nulls_bits + 1, src, bytes, continue_at_case );
			}
			
			/** Determines bytes needed for varint32 encoding. */
			#bytes2( src: number ): number{
				return src < 0x100 ?
				       1 :
				       src < 0x1_0000 ?
				       2 :
				       3;
			}
			
			/** Writes a number using varint32 encoding (2 bits for length, 1-3 bytes for value). */
			public put_varint32( src: number, continue_at_case: number ){
				const bytes = this.#bytes2( src );
				return this.put_bits_bytes4( bytes, 2, src, bytes, continue_at_case );
			}
			
			/** Writes a number using varint32 encoding, plus additional null bits. */
			public put_varint32_( src: number, continue_at_case: number, nulls: number, nulls_bits: number ){
				const bytes = this.#bytes2( src );
				return this.put_bits_bytes4( ( bytes << nulls_bits ) | nulls, nulls_bits + 2, src, bytes, continue_at_case );
			}
			
			/** Determines bytes needed for varint42 encoding. */
			#bytes3( src: number ): number{
				return src < 0x1_0000 ?
				       ( src < 0x100 ?
				         1 :
				         2 ) :
				       src < 0x100_0000 ?
				       3 :
				       4;
			}
			
			/** Writes a number using varint42 encoding (2 bits for length, 1-4 bytes for value). */
			public put_varint42( src: number, continue_at_case: number ){
				const bytes = this.#bytes3( src );
				return this.put_bits_bytes4( bytes - 1, 2, src, bytes, continue_at_case );
			}
			
			/** Writes a number using varint42 encoding, plus additional null bits. */
			public put_varint42_( src: number, continue_at_case: number, nulls: number, nulls_bits: number ){
				const bytes = this.#bytes3( src );
				return this.put_bits_bytes4( ( ( bytes - 1 ) << nulls_bits ) | nulls, nulls_bits + 2, src, bytes, continue_at_case );
			}
			
			/** Determines bytes needed for varint73 encoding. */
			#bytes4( src: number ): number{
				return src < 0x100_0000 ?
				       ( src < 0x1_0000 ?
				         ( src < 0x100 ?
				           1 :
				           2 ) :
				         3 ) :
				       src < 0x1_0000_0000 ?
				       4 :
				       src < 0x100_0000_0000 ?
				       5 :
				       src < 0x1_0000_0000_0000n ?
				       6 :
				       7;
			}
			
			/** Writes a number using varint73 encoding (3 bits for length, 1-7 bytes for value). */
			public put_varint73( src: number, continue_at_case: number ): boolean{
				const bytes = this.#bytes4( src );
				return this.put_bits_bytes4( bytes, 3, src, bytes, continue_at_case );
			}
			
			/** Writes a number using varint73 encoding, plus additional null bits. */
			public put_varint73_( src: number, continue_at_case: number, nulls: number, nulls_bits: number ): boolean{
				const bytes = this.#bytes4( src );
				return this.put_bits_bytes4( ( bytes << nulls_bits ) | nulls, nulls_bits + 3, src, bytes, continue_at_case );
			}
			
			/** Determines bytes needed for varint73 encoding for a `bigint`. */
			#bytes4n( src: bigint ): number{
				return src < 0x100_0000 ?
				       ( src < 0x1_0000 ?
				         ( src < 0x100 ?
				           1 :
				           2 ) :
				         3 ) :
				       src < 0x1_0000_0000 ?
				       4 :
				       src < 0x100_0000_0000 ?
				       5 :
				       src < 0x1_0000_0000_0000n ?
				       6 :
				       7;
			}
			
			/** Writes a `bigint` using varint73n encoding (3 bits for length, 1-7 bytes for value). */
			public put_varint73n( src: bigint, continue_at_case: number ): boolean{
				const bytes = this.#bytes4n( src );
				return this.put_bits_bytes8( bytes, 3, src, bytes, continue_at_case );
			}
			
			/** Writes a `bigint` using varint73n encoding, plus additional null bits. */
			public put_varint73n_( src: bigint, continue_at_case: number, nulls: number, nulls_bits: number ): boolean{
				const bytes = this.#bytes4n( src );
				return this.put_bits_bytes8( ( bytes << nulls_bits ) | nulls, nulls_bits + 3, src, bytes, continue_at_case );
			}
			
			/** Determines bytes needed for varint83/84 encoding. */
			#bytes5( src: bigint ): number{
				return src < 0 ?
				       8 :
				       src < 0x1_0000_0000 ?
				       ( src < 0x1_0000 ?
				         ( src < 0x100 ?
				           1 :
				           2 ) :
				         src < 0x100_0000 ?
				         3 :
				         4 ) :
				       src < 0x1_0000_0000_0000n ?
				       ( src < 0x100_0000_0000 ?
				         5 :
				         6 ) :
				       src < 0x100_0000_0000_0000n ?
				       7 :
				       8;
			}
			
			/** Writes a `bigint` using varint83 encoding (3 bits for length, 1-8 bytes for value). */
			public put_varint83( src: bigint, continue_at_case: number ): boolean{
				const bytes = this.#bytes5( src );
				return this.put_bits_bytes8( bytes - 1, 3, src, bytes, continue_at_case );
			}
			
			/** Writes a `bigint` using varint83 encoding, plus additional null bits. */
			public put_varint83_( src: bigint, continue_at_case: number, nulls: number, nulls_bits: number ): boolean{
				const bytes = this.#bytes5( src );
				return this.put_bits_bytes8( ( ( bytes - 1 ) << nulls_bits ) | nulls, nulls_bits + 3, src, bytes, continue_at_case );
			}
			
			/** Writes a `bigint` using varint84 encoding (4 bits for length, 1-8 bytes for value). */
			public put_varint84( src: bigint, continue_at_case: number ): boolean{
				const bytes = this.#bytes5( src );
				return this.put_bits_bytes8( bytes, 4, src, bytes, continue_at_case );
			}
			
			/** Writes a `bigint` using varint84 encoding, plus additional null bits. */
			public put_varint84_( src: bigint, continue_at_case: number, nulls: number, nulls_bits: number ): boolean{
				const bytes = this.#bytes5( src );
				return this.put_bits_bytes8( ( bytes << nulls_bits ) | nulls, nulls_bits + 4, src, bytes, continue_at_case );
			}
			
			/**
			 * Writes a standard varint-encoded number to the stream.
			 * @param src The number to encode.
			 * @param next_case The state to transition to on retry.
			 * @returns `true` if successful, `false` on retry.
			 */
			public put_varint4( src: number, next_case: number ): boolean{
				while( this.byte < this.byte_max ){
					if( src < 0x80 ){
						this.buffer!.setUint8( this.byte++, src );
						return true;
					}
					
					this.buffer!.setUint8( this.byte++, 0x80 | src );
					
					if( src < 0xffff_ffff ) src >>>= 7;
					else src = p.set( src ).shru( 7 ).get();
				}
				
				this.u4_ = src;
				this.slot.state = next_case;
				this.mode = VARINT4;
				return false;
			}
			
			/**
			 * Writes a standard varint-encoded `bigint` to the stream.
			 * @param src The `bigint` to encode.
			 * @param next_case The state to transition to on retry.
			 * @returns `true` if successful, `false` on retry.
			 */
			public put_varint8( src: bigint, next_case: number ): boolean{
				if( src < Number.MAX_SAFE_INTEGER ) return this.put_varint4( Number( src ), next_case );
				
				while( this.byte < this.byte_max ){
					if( src < 0x80 ){
						this.buffer!.setUint8( this.byte++, Number( src ) );
						return true;
					}
					this.buffer!.setUint8( this.byte++, Number( 0x80n | ( src & 0x7fn ) ) );
					src >>= 7n;
				}
				
				this.u8_ = src;
				this.slot.state = next_case;
				this.mode = VARINT8;
				return false;
			}

//#endregion
//#region string
			
			/**
			 * Writes a string to the stream using a varint length prefix and varint-encoded characters.
			 * @param src The string to write.
			 * @param next_case The state to transition to on retry.
			 * @returns `true` if successful, `false` on retry.
			 */
			public put_string( src: string, next_case: number ): boolean{
				put: {
					this.bytes_left = -1;
					if( !this.#varint( src.length ) ) break put;
					this.bytes_left = 0;
					
					while( this.bytes_left < src.length ) if( !this.#varint( src.charCodeAt( this.bytes_left++ ) ) ) break put;
					
					return true;
				}
				
				this.slot!.state = next_case;
				this.str = src;
				this.mode = STR;
				return false;
			}
			
			/** Helper to write a single varint-encoded number. */
			#varint( src: number ): boolean{
				for( ; this.byte < this.byte_max; this.buffer!.setUint8( this.byte++, 0x80 | src ), src >>>= 7 )
					if( src < 0x80 ){
						this.buffer!.setUint8( this.byte++, src );
						return true;
					}
				
				this.u4_ = src;
				return false;
			}

//#endregion
			
			/**
			 * Manually sets the state machine to retry from a specified state.
			 * @param the_case The state to retry from.
			 */
			public retry_at( the_case: number ): void{
				this.slot!.state = the_case;
				this.mode = RETRY;
			}
			
			/**
			 * Determines the minimum number of bytes needed to represent a number.
			 * @param value The number to measure.
			 * @returns The number of bytes required (0-4).
			 */
			public bytes4value( value: number ): number{
				return value < 0xffff ?
				       ( value < 0xff ?
				         ( value === 0 ?
				           0 :
				           1 ) :
				         2 ) :
				       value < 0xffffff ?
				       3 :
				       4;
			}
			
			/**
			 * Writes a signed byte (int8) to the stream, with retry support.
			 * @returns `true` if successful, `false` on retry.
			 */
			
			public put_sbyte_( src: number, next_case: number ): boolean{
				if( this.byte < this.byte_max ){
					this.buffer!.setInt8( this.byte++, src );
					return true;
				}
				this.tmp.setInt8( 0, src );
				this.#tmp_to_buffer( 1, next_case );
				return false;
			}
			
			/** Writes a signed byte (int8) to the stream. */
			public put_sbyte( src: number ): void{ this.buffer!.setInt8( this.byte++, src ); }
			
			/**
			 * Writes an unsigned byte (uint8) to the stream, with retry support.
			 * @returns `true` if successful, `false` on retry.
			 */
			public put_byte_( src: number, next_case: number ): boolean{
				if( this.byte < this.byte_max ){
					this.buffer!.setUint8( this.byte++, src );
					return true;
				}
				this.tmp.setUint8( 0, src );
				this.#tmp_to_buffer( 1, next_case );
				return false;
			}
			
			/** Writes an unsigned byte (uint8) to the stream. */
			public put_byte( src: number ): boolean{
				this.buffer!.setUint8( this.byte++, src );
				return true;
			}
			
			/**
			 * Writes a signed short (int16, little-endian) to the stream, with retry support.
			 * @returns `true` if successful, `false` on retry.
			 */
			public put_short_( src: number, next_case: number ): boolean{
				
				if( this.byte_max - this.byte < 2 ){
					this.tmp.setInt16( 0, src, true );
					this.#tmp_to_buffer( 2, next_case );
					return false;
				}
				this.buffer!.setInt16( this.byte, src, true );
				this.byte += 2;
				return true;
			}
			
			/** Writes a signed short (int16, little-endian) to the stream. */
			public put_short( src: number ): void{
				
				this.buffer!.setInt16( this.byte, src, true );
				this.byte += 2;
			}
			
			/**
			 * Writes a char (uint16, little-endian) to the stream, with retry support.
			 * @returns `true` if successful, `false` on retry.
			 */
			public put_char_( src: number, next_case: number ): boolean{
				
				if( this.byte_max - this.byte < 2 ){
					this.tmp.setUint16( 0, src, true );
					this.#tmp_to_buffer( 2, next_case );
					return false;
				}
				this.buffer!.setUint16( this.byte, src, true );
				this.byte += 2;
				return true;
			}
			
			/** Writes a char (uint16, little-endian) to the stream. */
			public put_char( src: number ): void{
				
				this.buffer!.setUint16( this.byte, src, true );
				this.byte += 2;
			}
			
			/**
			 * Writes an unsigned short (uint16, little-endian) to the stream, with retry support.
			 * @returns `true` if successful, `false` on retry.
			 */
			public put_ushort_( src: number, next_case: number ): boolean{
				
				if( this.byte_max - this.byte < 2 ){
					this.tmp.setUint16( 0, src, true );
					this.#tmp_to_buffer( 2, next_case );
					return false;
				}
				this.buffer!.setUint16( this.byte, src, true );
				this.byte += 2;
				return true;
			}
			
			/** Writes an unsigned short (uint16, little-endian) to the stream. */
			public put_ushort( src: number ): void{
				
				this.buffer!.setUint16( this.byte, src, true );
				this.byte += 2;
			}
			
			/**
			 * Writes a signed integer (int32, little-endian) to the stream, with retry support.
			 * @returns `true` if successful, `false` on retry.
			 */
			public put_int_( src: number, next_case: number ): boolean{
				
				if( this.byte_max - this.byte < 4 ){
					this.tmp.setInt32( 0, src, true );
					this.#tmp_to_buffer( 4, next_case );
					return false;
				}
				this.buffer!.setInt32( this.byte, src, true );
				this.byte += 4;
				return true;
			}
			
			/** Writes a signed integer (int32, little-endian) to the stream. */
			public put_int( src: number ): void{
				
				this.buffer!.setInt32( this.byte, src, true );
				this.byte += 4;
			}
			
			/**
			 * Writes an unsigned integer (uint32, little-endian) to the stream, with retry support.
			 * @returns `true` if successful, `false` on retry.
			 */
			public put_uint_( src: number, next_case: number ): boolean{
				
				if( this.byte_max - this.byte < 4 ){
					this.tmp.setUint32( 0, src, true );
					this.#tmp_to_buffer( 4, next_case );
					return false;
				}
				this.buffer!.setUint32( this.byte, src, true );
				this.byte += 4;
				return true;
			}
			
			/** Writes an unsigned integer (uint32, little-endian) to the stream. */
			public put_uint( src: number ): void{
				
				this.buffer!.setUint32( this.byte, src, true );
				this.byte += 4;
			}
			
			/**
			 * Writes a variable-length integer (1-7 bytes) to the stream, with retry support.
			 * @returns `true` if successful, `false` on retry.
			 */
			public put_4_( src: number, bytes: number, next_case: number ): boolean{
				if( this.byte_max - this.byte < bytes ){
					this.#put( src, this.tmp, 0, bytes );
					this.#tmp_to_buffer( bytes, next_case );
					return false;
				}
				
				this.put_4( src, bytes );
				return true;
			}
			
			/** Writes a variable-length integer (1-7 bytes) to the stream. */
			public put_4( src: number, bytes: number ): void{
				this.#put( src, this.buffer!, this.byte, bytes );
				this.byte += bytes;
			}
			
			/** Helper to write a variable-length integer to a `DataView`. */
			#put( src: number, dst: DataView, byte: number, bytes: number ): void{
				switch( bytes ){
					case 7:
						dst.setUint32( byte, src, true );
						dst.setUint16( byte + 4, ( src / 0x1_0000_0000 ) | 0, true );
						dst.setUint8( byte + 6, ( src / 0x1_0000_0000_0000 ) | 0 );
						return;
					case 6:
						dst.setUint32( byte, src, true );
						dst.setUint16( byte + 4, ( src / 0x1_0000_0000 ) | 0, true );
						return;
					case 5:
						dst.setUint32( byte, src, true );
						dst.setUint8( byte + 4, ( src / 0x1_0000_0000 ) | 0 );
						return;
					case 4:
						dst.setUint32( byte, src, true );
						return;
					case 3:
						dst.setUint16( byte, src, true );
						dst.setUint8( byte + 2, src >>> 16 );
						return;
					case 2:
						dst.setUint16( byte, src, true );
						return;
					case 1:
						dst.setUint8( byte, src );
						return;
				}
			}
			
			/**
			 * Writes a signed long (int64, little-endian) to the stream, with retry support.
			 * @returns `true` if successful, `false` on retry.
			 */
			public put_long_( src: bigint, next_case: number ): boolean{
				
				if( this.byte_max - this.byte < 8 ){
					this.tmp.setBigInt64( 0, src, true );
					this.#tmp_to_buffer( 8, next_case );
					return false;
				}
				this.buffer!.setBigInt64( this.byte, src, true );
				this.byte += 8;
				return true;
			}
			
			/** Writes a signed long (int64, little-endian) to the stream. */
			public put_long( src: bigint ){
				this.buffer!.setBigInt64( this.byte, src, true );
				this.byte += 8;
			}
			
			/**
			 * Writes an unsigned long (uint64, little-endian) to the stream, with retry support.
			 * @returns `true` if successful, `false` on retry.
			 */
			public put_ulong_( src: bigint, next_case: number ){
				if( this.byte_max - this.byte < 8 ){
					this.tmp.setBigUint64( 0, src, true );
					this.#tmp_to_buffer( 8, next_case );
					return false;
				}
				this.buffer!.setBigUint64( this.byte, src, true );
				this.byte += 8;
				return true;
			}
			
			/** Writes an unsigned long (uint64, little-endian) to the stream. */
			public put_ulong( src: bigint ){
				this.buffer!.setBigUint64( this.byte, src, true );
				this.byte += 8;
			}
			
			/**
			 * Writes a float (float32, little-endian) to the stream, with retry support.
			 * @returns `true` if successful, `false` on retry.
			 */
			public put_float_( src: number, next_case: number ){
				if( this.byte_max - this.byte < 4 ){
					this.tmp.setFloat32( 0, src, true );
					this.#tmp_to_buffer( 4, next_case );
					return false;
				}
				this.buffer!.setFloat32( this.byte, src, true );
				this.byte += 4;
				return true;
			}
			
			/** Writes a float (float32, little-endian) to the stream. */
			public put_float( src: number ){
				this.buffer!.setFloat32( this.byte, src, true );
				this.byte += 4;
			}
			
			/**
			 * Writes a double (float64, little-endian) to the stream, with retry support.
			 * @returns `true` if successful, `false` on retry.
			 */
			public put_double_( src: number, next_case: number ){
				if( this.byte_max - this.byte < 8 ){
					this.tmp.setFloat64( 0, src, true );
					this.#tmp_to_buffer( 8, next_case );
					return false;
				}
				this.buffer!.setFloat64( this.byte, src, true );
				this.byte += 8;
				return true;
			}
			
			/** Writes a double (float64, little-endian) to the stream. */
			public put_double( src: number ): void{
				this.buffer!.setFloat64( this.byte, src, true );
				this.byte += 8;
			}
			
			/**
			 * Writes a variable-length long (1-8 bytes) to the stream, with retry support.
			 * @returns `true` if successful, `false` on retry.
			 */
			public put_8_( src: bigint, bytes: number, next_case: number ): boolean{
				if( bytes <= this.byte_max - this.byte ){
					this.put_8( src, bytes );
					return true;
				}
				
				this.tmp.setBigUint64( 0, src, true );
				this.#tmp_to_buffer( bytes, next_case );
				return false;
			}
			
			/** Writes a variable-length long (1-8 bytes) to the stream. */
			public put_8( src: bigint, bytes: number ): void{
				this.buffer!.setBigUint64( this.byte, src, true );
				this.byte += bytes;
			}
			
			/** Helper to handle writes that cross buffer boundaries. */
			#tmp_to_buffer( bytes: number, next_case: number ){
				this.slot!.state = next_case;
				this.bytes_left = this.byte_max - this.byte;
				this.tmp_bytes = bytes;
				
				for( let i = 0; this.byte < this.byte_max; ) this.buffer!.setUint8( this.byte++, this.tmp.getUint8( i++ ) );
				this.mode = VAL;
			}
			
			/**
			 * Gets the root `BytesSrc` object in the current slot chain.
			 */
			get root(): Transmitter.BytesSrc | undefined{
				let s = this.slot!;
				while( s.prev ) s = s.prev;
				return s.src;
			}
			
			/**
			 * Returns a string representation of the `Transmitter`'s current state, including its slot chain.
			 */
			toString( this: Transmitter ): string{
				let str = "Transmitter\n";
				if( !this.slot ) return str + " slot === undefined";
				let s = this.slot!;
				
				while( s.prev ) s = s.prev;
				for( let i = 0; ; i++ ){
					for( let ii = i; 0 < ii; ii-- ) str += "\t";
					str += `${ Object.prototype.toString.call( s.src ) }}\t${ s.state }\t${ s["index0"] }\t${ s["index1"] }\t${ s["index2"] } \n`;
					if( s === this.slot ) break;
					s = s.next!;
				}
				return str;
			}
			
			/**
			 * Extracts the high 32 bits of a `bigint` value.
			 * @param value The `bigint` value.
			 * @returns The high 32 bits as a number.
			 */
			hi( value: bigint ): number{
				this.tmp.setBigUint64( 0, value, true );
				return this.tmp.getUint32( 0 );
			}
			
			/**
			 * Extracts the low 32 bits of a `bigint` value previously set using `hi()`.
			 * @returns The low 32 bits as a number.
			 */
			lo(): number{ return this.tmp.getUint32( 4 ); }
			
			/** A temporary `DataView` for internal operations, avoiding frequent allocations. */
			tmp = new DataView( new ArrayBuffer( 16 ) );
		}
		
		export namespace Transmitter{
			/**
			 * A configurable error handler for `Transmitter` events. The default implementation throws an error.
			 */
			export let error_handler: OnError.Handler = ( src: AdHoc.BytesSrc | undefined, error_id: number, err?: Error ) => {
				switch( error_id ){
					case OnError.OVERFLOW:
						debugger
						throw new Error( "OVERFLOW at " + src + ( !err ?
						                                          "" :
						                 err! + err!.stack! ) );
					case OnError.REJECTED:
						debugger
						throw new Error( "REJECTED at " + src + ( !err ?
						                                          "" :
						                 err! + err!.stack! ) );
				}
			};
			
			export namespace OnError{
				/** Error code: A packet was rejected by application logic before being sent. */
				export const REJECTED = 0;
				/** Error code: A value to be serialized exceeds a predefined maximum length or size. */
				export const OVERFLOW = 1;
				/** Error code: A timeout occurred during packet transmission. */
				export const TIMEOUT = 2;
				/** Error code: A generic or unexpected error occurred. */
				export const ERROR = 3;
				
				/** The type definition for a `Transmitter` error handler function. */
				export type Handler = ( src: AdHoc.BytesSrc | undefined, error_id: number, err?: Error ) => void;
			}
			
			/**
			 * Defines the contract for a source object that can be serialized by a `Transmitter`.
			 */
			export interface BytesSrc{
				/**
				 * Called by the `Transmitter` to serialize this object into the byte stream.
				 * The implementation should write its fields to the `dst` transmitter.
				 *
				 * @param dst The `Transmitter` instance providing the byte stream and serialization methods.
				 * @returns `true` if serialization is complete, `false` if more data is needed for a nested object.
				 */
				__get_bytes( dst: Transmitter ): boolean;
				
				/**
				 * Gets the unique identifier for this packet type.
				 */
				get __id(): number;
			}
			
			/**
			 * Defines the contract for an event handler that can subscribe to `Transmitter` events.
			 */
			export interface EventsHandler{
				/**
				 * Called just before a packet is serialized.
				 *
				 * @param dst The `Transmitter` instance.
				 * @param src The source object about to be serialized.
				 */
				OnSerializing( dst: Transmitter, src: BytesSrc ): void;
				
				/**
				 * Called after a packet has been fully serialized.
				 *
				 * @param dst The `Transmitter` instance.
				 * @param src The source object that was just serialized.
				 */
				OnSerialized( dst: Transmitter, src: BytesSrc ): void;
			}
			
			/**
			 * Performs zig-zag encoding on a signed integer.
			 * @param src The signed integer to encode.
			 * @param bits The number of bits in the integer's type (e.g., 31 for a 32-bit signed int).
			 * @returns The zig-zag encoded unsigned integer.
			 */
			export function zig_zag( src: number, bits: number ): number{ return ( ( src << 1 ) ^ ( src >> bits ) ) >>> 0; }
			
			/**
			 * Performs zig-zag encoding on a signed number up to 53 bits.
			 * @param src The signed number to encode.
			 * @param bits The number of bits in the integer's type.
			 * @returns The zig-zag encoded unsigned number.
			 */
			export function zig_zag4( src: number, bits: number ){
				return src < -2147483648 || 2147483647 < src || 31 < bits ?
				       p.set( src ).shl( 1 ).xor( q.set( src ).shr( bits ) ).get() :
				       ( ( src << 1 ) ^ ( src >> bits ) ) >>> 0;
			}
			
			/**
			 * Performs zig-zag encoding on a signed 64-bit `bigint`.
			 * @param src The signed `bigint` to encode.
			 * @param bits The number of bits in the bigint's type (e.g., 63 for a 64-bit signed int).
			 * @returns The zig-zag encoded unsigned `bigint`.
			 */
			export function zig_zag8( src: bigint, bits: bigint ): bigint{
				return ( src << 1n ) ^ ( src >> bits );
			}

//#region Slot
			/**
			 * Manages the state for serializing a single packet or nested data structure within a `Transmitter`.
			 * Slots are linked together to handle nested objects.
			 */
			export class Slot extends Base.Transmitter.Slot{
				// @ts-ignore
				src: BytesSrc;
				
				public src_( src: BytesSrc ): BytesSrc{
					this.state = 1;
					return this.src = src;
				}
				
				/** The current byte containing null-field bitmasks being built. */
				fields_nulls = 0;
				/** A reference to the next slot in the chain (for nested objects). */
				next: Slot | undefined;
				/** A reference to the previous slot in the chain. */
				readonly prev: Slot;
				
				/**
				 * Constructs a `Slot`.
				 * @param src The `Transmitter` that owns this slot.
				 * @param prev The previous slot in the chain, or `undefined` if this is the root.
				 */
				constructor( src: Transmitter, prev: Slot | undefined ){
					super( src, undefined );
					this.prev = prev!;
					if( prev !== undefined )
						prev.next = this;
				}
			}

//#endregion
			/** Internal `Transmitter` instance used for temporary operations. */
			class Tmp extends Transmitter{
				protected _OnSerializing(): AdHoc.Channel.Transmitter.BytesSrc | undefined{ return undefined; }
				
				protected _OnSerialized( transmitted: AdHoc.Channel.Transmitter.BytesSrc ): void{ }
				
				IsIdle(): boolean{ return false; }
			}
			
			export const tmp = new Tmp( undefined );
		}
	}
	
	/**
	 * Constants defining the internal states and modes for the `Receiver` and `Transmitter` state machines.
	 */
	export const OK = Number.MAX_SAFE_INTEGER - 10; // Default state, ready for next operation.
	export const STR = OK - 100; // State for processing a string.
	export const RETRY = STR + 1; // Mode indicating a read/write could not complete and should be retried.
	export const VAL4 = RETRY + 1; // Mode for handling a 4-byte value that crosses a buffer boundary.
	export const VAL = VAL4 + 1; // Mode for handling a generic value that crosses a buffer boundary.
	export const LEN0 = VAL + 1; // Mode for processing a length of 0.
	export const LEN1 = LEN0 + 1; // Mode for processing a length of 1.
	export const LEN2 = LEN1 + 1; // Mode for processing a length of 2.
	export const BITS = LEN2 + 1; // Mode for bit-level operations.
	export const BITS_BYTES = BITS + 1; // Mode for bit-level operations followed by raw bytes.
	export const BITS_BYTES4 = BITS_BYTES + 1; // Mode for bit-level operations followed by a 4-byte value.
	export const BITS_BYTES8 = BITS_BYTES4 + 1; // Mode for bit-level operations followed by an 8-byte value.
	export const VARINT4 = BITS_BYTES8 + 1; // Mode for processing a 4-byte varint.
	export const VARINT8 = VARINT4 + 1; // Mode for processing an 8-byte varint.
	
	
	/**
	 * Compares two floating-point numbers for equality, accounting for `float32` precision.
	 *
	 * @param a The first number.
	 * @param b The second number.
	 * @returns `true` if the numbers are equal or their `float32` representations are equal.
	 */
	export function equals_floats( a: number | undefined, b: number | undefined ){
		return a === b || ( a !== undefined && b !== undefined && Math.fround( a ) === Math.fround( b ) );
	}
	
	/**
	 * Compares two strings for equality, optionally using Unicode normalization.
	 *
	 * @param a The first string.
	 * @param b The second string.
	 * @returns `true` if the strings are equal after normalization.
	 */
	export function equals_strings( a: string | undefined, b: string | undefined ){
		return a === b || ( a !== undefined && b !== undefined && a.normalize() === b.normalize() );
	}
	
	/**
	 * Compares two arrays of strings for equality.
	 *
	 * @param a1 The first array of strings.
	 * @param a2 The second array of strings.
	 * @param size The number of elements to compare. If undefined, compares entire arrays.
	 * @returns `true` if the arrays are equal.
	 */
	export function equals_strings_arrays( a1: ArrayLike<string | undefined> | undefined, a2: ArrayLike<string | undefined> | undefined, size?: number ): boolean{
		return equals_arrays( a1, a2, equals_strings, size );
	}
	
	/**
	 * Compares two arrays for element-wise equality using a custom comparison function.
	 *
	 * @typeparam T The type of array elements.
	 * @param a1 The first array.
	 * @param a2 The second array.
	 * @param equals The function to use for comparing elements. Defaults to `Object.is`.
	 * @param size The number of elements to compare. If undefined, compares entire arrays.
	 * @returns `true` if the arrays are equal.
	 */
	export function equals_arrays<T>( a1: ArrayLike<T> | undefined, a2: ArrayLike<T> | undefined, equals: ( v1: T, v2: T ) => boolean = Object.is, size?: number ): boolean{
		if( a1 === a2 ) return true;
		if( a1 === undefined || a2 === undefined ) return false;
		if( size == undefined ){
			if( ( size = a1.length ) !== a2.length ) return false;
		}else if( a1.length < size || a2.length < size ) return false;
		
		while( -1 < --size ) if( !equals( a1[size], a2[size] ) ) return false;
		
		return true;
	}
	
	/**
	 * Compares two arrays of arrays for deep equality.
	 *
	 * @typeparam T The type of the inner array elements.
	 * @param aa1 The first array of arrays.
	 * @param aa2 The second array of arrays.
	 * @param equals The function to use for comparing the innermost elements.
	 * @param size The number of outer arrays to compare.
	 * @returns `true` if the arrays of arrays are equal.
	 */
	export function equals_arrays_<T>( aa1: ArrayLike<ArrayLike<T> | undefined> | undefined, aa2: ArrayLike<ArrayLike<T> | undefined> | undefined, equals: ( v1: T, v2: T ) => boolean, size?: number ): boolean{
		function equals_fn( a1: ArrayLike<T> | undefined, a2: ArrayLike<T> | undefined ): boolean{
			if( a1 === a2 ) return true;
			if( a1 === undefined || a2 === undefined || a1.length !== a2.length ) return false;
			return equals_arrays( a1, a2, equals, a1.length );
		}
		
		return equals_arrays( aa1, aa2, equals_fn, size );
	}
	
	/**
	 * Compares two `Map` objects for equality.
	 *
	 * @typeparam K The type of Map keys.
	 * @typeparam V The type of Map values.
	 * @param m1 The first Map.
	 * @param m2 The second Map.
	 * @param equals The function to use for comparing Map values.
	 * @returns `true` if the Maps are equal.
	 */
	export function equals_maps<K, V>( m1: Map<K, V> | undefined, m2: Map<K, V> | undefined, equals: ( v1: V, v2: V ) => boolean ): boolean{
		if( m1 === m2 ) return true;
		if( m1 === undefined || m2 === undefined || m1.size !== m2.size ) return false;
		
		for( const [ k, v ] of m1 ){
			if( !m2.has( k ) ) return false;
			const v1 = m2.get( k );
			if( v !== v1 && ( v === undefined || v1 === undefined || !equals( v, v1 ) ) ) return false;
		}
		
		return true;
	}
	
	/**
	 * Compares two arrays of `Map` objects for equality.
	 *
	 * @typeparam K The type of Map keys.
	 * @typeparam V The type of Map values.
	 * @param am1 The first array of Maps.
	 * @param am2 The second array of Maps.
	 * @param equals The function to use for comparing Map values.
	 * @param size The number of elements to compare.
	 * @returns `true` if the arrays of Maps are equal.
	 */
	export function equals_maps_<K, V>( am1: ArrayLike<Map<K, V> | undefined> | undefined, am2: ArrayLike<Map<K, V> | undefined> | undefined, equals: ( v1: V, v2: V ) => boolean, size?: number ): boolean{
		function equals_fn( a1: Map<K, V> | undefined, a2: Map<K, V> | undefined ): boolean{
			return equals_maps( a1, a2, equals );
		}
		
		return equals_arrays( am1, am2, equals_fn, size );
	}
	
	/**
	 * Compares two `Set` objects for equality.
	 *
	 * @typeparam T The type of Set elements.
	 * @param s1 The first Set.
	 * @param s2 The second Set.
	 * @returns `true` if the Sets are equal.
	 */
	export function equals_sets<T>( s1: Set<T> | undefined, s2: Set<T> | undefined ): boolean{
		if( s1 === s2 ) return true;
		if( s1 === undefined || s2 === undefined || s1.size !== s2.size ) return false;
		
		for( const k of s1.keys() ) if( !s2.has( k ) ) return false;
		
		return true;
	}
	
	/**
	 * Compares two arrays of `Set` objects for equality.
	 *
	 * @typeparam K The type of Set elements.
	 * @param as1 The first array of Sets.
	 * @param as2 The second array of Sets.
	 * @param size The number of elements to compare.
	 * @returns `true` if the arrays of Sets are equal.
	 */
	export function equals_sets_<K>( as1: ArrayLike<Set<K> | undefined> | undefined, as2: ArrayLike<Set<K> | undefined> | undefined, size?: number ): boolean{
		return equals_arrays( as1, as2, equals_sets, size );
	}
	
	/**
	 * Mixes a new data value into an existing hash using a MurmurHash3-like mixing function.
	 *
	 * @param hash The current hash value.
	 * @param data The data to mix in.
	 * @returns The updated hash value.
	 */
	export function mix( hash: number, data: number ): number{
		const h = mixLast( hash, data );
		return Math.imul( ( h << 13 ) | ( h >>> -13 ), 5 ) + 0xe6546b64;
	}
	
	/**
	 * Performs the final mixing step for a data value in a MurmurHash3-like algorithm.
	 *
	 * @param hash The current hash value.
	 * @param data The last piece of data to mix in.
	 * @returns The updated hash value.
	 */
	export function mixLast( hash: number, data: number ): number{
		const h = Math.imul( data, 0xcc9e2d51 );
		return Math.imul( hash ^ ( ( h << 15 ) | ( h >>> -15 ) ), 0x1b873593 );
	}
	
	/**
	 * Finalizes a hash value using the MurmurHash3 avalanche function.
	 *
	 * @param hash The hash value to finalize.
	 * @param length The total length of the data that was hashed.
	 * @returns The finalized hash value.
	 */
	export function finalizeHash( hash: number, length: number ): number{ return avalanche( hash ^ length ); }
	
	/**
	 * Performs an avalanche mixing function on a hash value to improve bit distribution.
	 *
	 * @param hash The hash value to process.
	 * @returns The avalanched hash value.
	 */
	export function avalanche( hash: number ): number{
		let size = hash;
		size = Math.imul( size ^ ( size >>> 16 ), 0x85ebca6b );
		size = Math.imul( size ^ ( size >>> 13 ), 0xc2b2ae35 );
		return size ^ ( size >>> 16 );
	}
	
	/**
	 * Mixes a boolean value into a hash.
	 *
	 * @param hash The current hash value.
	 * @param bool The boolean value to hash.
	 * @returns The updated hash value.
	 */
	export function hash_boolean( hash: number, bool: boolean | undefined ): number{
		return mix( hash, bool === undefined ?
		                  0x1b873593 :
		                  bool ?
		                  0x42108421 :
		                  0x42108420 );
	}
	
	/**
	 * Hashes an array of booleans.
	 *
	 * @param hash The initial hash value.
	 * @param src The array of booleans to hash.
	 * @param size The number of elements to hash.
	 * @returns The final hash value.
	 */
	export function hash_booleans_array( hash: number, src: ArrayLike<boolean>, size?: number ): number{
		return hash_array( hash, src, hash_boolean, size );
	}
	
	/**
	 * Mixes a string value into a hash.
	 *
	 * @param hash The current hash value.
	 * @param str The string to hash.
	 * @returns The updated hash value.
	 */
	export function hash_string( hash: number, str: string | undefined ): number{
		if( !str ) return mix( hash, 17163 );
		let i = str.length - 1;
		for( ; 1 < i; i -= 2 ) hash = mix( hash, ( str.charCodeAt( i ) << 16 ) | str.charCodeAt( i + 1 ) );
		if( 0 < i ) hash = mixLast( hash, str.charCodeAt( 0 ) );
		return finalizeHash( hash, str.length );
	}
	
	/**
	 * Hashes an array of strings.
	 *
	 * @param hash The initial hash value.
	 * @param src The array of strings to hash.
	 * @param size The number of elements to hash.
	 * @returns The final hash value.
	 */
	export function hash_strings_array( hash: number, src: ArrayLike<string | undefined>, size?: number ): number{
		return hash_array( hash, src, hash_string, size );
	}
	
	/**
	 * Mixes a floating-point number into a hash, rounding to `float32` precision first.
	 *
	 * @param hash The current hash value.
	 * @param n The number to hash.
	 * @returns The updated hash value.
	 */
	export function hash_float( hash: number, n: number | undefined ): number{
		return hash_number( hash, n === undefined ?
		                          undefined :
		                          Math.fround( n ) );
	}
	
	/**
	 * Mixes a number into a hash.
	 *
	 * @param hash The current hash value.
	 * @param n The number to hash.
	 * @returns The updated hash value.
	 */
	export function hash_number( hash: number, n: number | undefined ): number{
		if( !n || n !== n || n === Infinity ) return hash;
		let h = n | 0;
		if( h !== n ) for( h ^= n * 0xffffffff; n > 0xffffffff; h ^= n ) n /= 0xffffffff;
		return mix( hash, h );
	}
	
	/**
	 * Hashes an array of numbers.
	 *
	 * @param hash The initial hash value.
	 * @param src The array of numbers to hash.
	 * @param size The number of elements to hash.
	 * @returns The final hash value.
	 */
	export function hash_numbers_array( hash: number, src: ArrayLike<number>, size?: number ): number{
		return hash_array( hash, src, hash_number, size );
	}
	
	/**
	 * Mixes a `bigint` into a hash.
	 *
	 * @param hash The current hash value.
	 * @param n The `bigint` to hash.
	 * @returns The updated hash value.
	 */
	export function hash_bigint( hash: number, n: bigint | undefined ): number{
		return n === undefined ?
		       hash :
		       hash_number( hash, Number( n ) ) + ( n < Number.MIN_SAFE_INTEGER || Number.MAX_SAFE_INTEGER < n ?
		                                            Number( n >> 32n ) :
		                                            0 );
	}
	
	/**
	 * Hashes an array of bigints.
	 *
	 * @param hash The initial hash value.
	 * @param src The array of bigints to hash.
	 * @param size The number of elements to hash.
	 * @returns The final hash value.
	 */
	export function hash_bigints_array( hash: number, src: ArrayLike<bigint>, size?: number ): number{
		return hash_array( hash, src, hash_bigint, size );
	}
	
	/**
	 * Hashes an array of bytes using a MurmurHash3-like algorithm.
	 *
	 * @param hash The initial hash value.
	 * @param data The array-like object of bytes to hash.
	 * @returns The finalized hash value.
	 */
	export function hash_bytes( hash: number, data: ArrayLike<number> ): number{
		let len = data.length,
			i,
			k = 0;
		for( i = 0; 3 < len; i += 4, len -= 4 ) hash = mix( hash, ( data[i] & 0xff ) | ( ( data[i + 1] & 0xff ) << 8 ) | ( ( data[i + 2] & 0xff ) << 16 ) | ( ( data[i + 3] & 0xff ) << 24 ) );
		switch( len ){
			case 3:
				k ^= ( data[i + 2] & 0xff ) << 16;
			case 2:
				k ^= ( data[i + 1] & 0xff ) << 8;
		}
		return finalizeHash( mixLast( hash, k ^ ( data[i] & 0xff ) ), data.length );
	}
	
	/**
	 * Computes a symmetric (order-independent) hash for a `Map`.
	 *
	 * @typeparam K The type of Map keys.
	 * @typeparam V The type of Map values.
	 * @param hash The initial hash value.
	 * @param src The `Map` to hash.
	 * @param hashK A function to hash the Map's keys.
	 * @param hashV A function to hash the Map's values.
	 * @returns The final hash value.
	 */
	export function hash_map<K, V>( hash: number, src: Map<K, V>, hashK: ( hash: number, k: K ) => number, hashV: ( hash: number, v: V ) => number ): number{
		let a = 0,
			b = 0,
			c = 1;
		
		for( const [ k, v ] of src ){
			let h = AdHoc.mix( hash, hashK( hash, k ) );
			h = AdHoc.mix( h, hashV( hash, v ) );
			h = AdHoc.finalizeHash( h, 2 );
			a += h;
			b ^= h;
			c *= h | 1;
		}
		return AdHoc.finalizeHash( AdHoc.mixLast( AdHoc.mix( AdHoc.mix( hash, a ), b ), c ), src.size );
	}
	
	/**
	 * Hashes an array of `Map` objects.
	 *
	 * @typeparam K The type of Map keys.
	 * @typeparam V The type of Map values.
	 * @param hash The initial hash value.
	 * @param src The array of Maps to hash.
	 * @param hashK A function to hash the Map's keys.
	 * @param hashV A function to hash the Map's values.
	 * @returns The final hash value.
	 */
	export function hash_map_<K, V>( hash: number, src: ArrayLike<Map<K, V> | undefined>, hashK: ( hash: number, k: K ) => number, hashV: ( hash: number, v: V ) => number ): number{
		function hasher( hash: number, map: Map<K, V> | undefined ){
			return map ?
			       hash_map( hash, map, hashK, hashV ) :
			       hash;
		}
		
		return hash_array( hash, src, hasher, src.length );
	}
	
	/**
	 * Computes a symmetric (order-independent) hash for a `Set`.
	 *
	 * @typeparam K The type of Set elements.
	 * @param hash The initial hash value.
	 * @param src The `Set` to hash.
	 * @param hashK A function to hash the Set's elements.
	 * @returns The final hash value.
	 */
	export function hash_set<K>( hash: number, src: Set<K>, hashK: ( hash: number, k: K ) => number ): number{
		let a = 0,
			b = 0,
			c = 1;
		
		for( const k of src ){
			const h = hashK( hash, k );
			a += h;
			b ^= h;
			c *= h | 1;
		}
		return AdHoc.finalizeHash( AdHoc.mixLast( AdHoc.mix( AdHoc.mix( hash, a ), b ), c ), src.size );
	}
	
	/**
	 * Hashes an array of `Set` objects.
	 *
	 * @typeparam K The type of Set elements.
	 * @param hash The initial hash value.
	 * @param src The array of Sets to hash.
	 * @param hashK A function to hash the Set's elements.
	 * @returns The final hash value.
	 */
	export function hash_set_<K>( hash: number, src: ArrayLike<Set<K> | undefined>, hashK: ( hash: number, k: K ) => number ): number{
		function hasher( hash: number, set: Set<K> | undefined ){
			return set ?
			       hash_set( hash, set, hashK ) :
			       hash;
		}
		
		return hash_array( hash, src, hasher, src.length );
	}
	
	/**
	 * Hashes an array using a provided element hashing function.
	 * Includes an optimization for arrays of numbers in an arithmetic progression.
	 *
	 * @typeparam V The type of array elements.
	 * @param hash The initial hash value.
	 * @param src The array to hash.
	 * @param hashV A function to hash the array's elements.
	 * @param size The number of elements to hash.
	 * @returns The final hash value.
	 */
	export function hash_array<V>( hash: number, src: ArrayLike<V>, hashV: ( hash: number, v: V ) => number, size?: number ): number{
		switch( ( size ??= src.length ) ){
			case 0:
				return AdHoc.finalizeHash( hash, 0 );
			case 1:
				return AdHoc.finalizeHash( AdHoc.mix( hash, hashV( hash, src[0] ) ), 1 );
		}
		
		const initial = hashV( hash, src[0] );
		let prev = hashV( hash, src[1] );
		const rangeDiff = prev - initial;
		hash = AdHoc.mix( hash, initial );
		
		for( let i = 2; i < size; ++i ){
			hash = AdHoc.mix( hash, prev );
			const k = hashV( hash, src[i] );
			if( rangeDiff !== k - prev ){
				for( hash = AdHoc.mix( hash, k ), ++i; i < size; ++i ) hash = AdHoc.mix( hash, hashV( hash, src[i] ) );
				return AdHoc.finalizeHash( hash, size );
			}
			prev = k;
		}
		
		return AdHoc.avalanche( AdHoc.mix( AdHoc.mix( hash, rangeDiff ), prev ) );
	}
	
	/**
	 * Hashes an array of arrays.
	 *
	 * @typeparam V The type of the inner array elements.
	 * @param hash The initial hash value.
	 * @param src The array of arrays to hash.
	 * @param hashV A function to hash the inner array's elements.
	 * @param size The number of outer arrays to hash.
	 * @returns The final hash value.
	 */
	export function hash_array_<V>( hash: number, src: ArrayLike<ArrayLike<V> | undefined>, hashV: ( hash: number, v: V ) => number, size?: number ): number{
		function hasher( hash: number, array: ArrayLike<V> | undefined ): number{
			return array ?
			       hash_array( hash, array, hashV, array.length ) :
			       0;
		}
		
		return hash_array( hash, src, hasher, size );
	}
	
	/**
	 * Extends `JSON.stringify` to support `BigInt` and `Map` types.
	 * This function should be called once at application startup.
	 */
	export function JSON_EXT(): void{
		// Overcomes: TypeError: Do not know how to serialize a BigInt
		// @ts-ignore
		BigInt.prototype.toJSON = function toJson(){ return this.toString() + "n"; };
		
		// Stringifies Maps as sorted key-value pair arrays for consistent output.
		// @ts-ignore
		Map.prototype.toJSON = function toJson(){
			// @ts-ignore
			return [ ...this.entries() ].sort( ( A, B ) => ( A[0] > B[0] ?
			                                                 1 :
			                                                 A[0] === B[0] ?
			                                                 0 :
			                                                 -1 ) );
		};
	}
	
	
	/**
	 * Reinterprets the bits of a 32-bit integer as a `float32` value.
	 *
	 * @param bits The integer bits.
	 * @returns The resulting `float32` number.
	 */
	export function intBitsToFloat( bits: number ): number{
		const tmp = new DataView( new ArrayBuffer( 4 ) );
		tmp.setUint32( 0, bits, true );
		return tmp.getFloat32( 0 );
	}
	
	/**
	 * Reinterprets the bits of a `float32` number as a 32-bit integer.
	 *
	 * @param float The `float32` number.
	 * @returns The integer representation of the float's bits.
	 */
	export function floatToIntBits( float: number ): number{
		const tmp = new DataView( new ArrayBuffer( 4 ) );
		tmp.setFloat32( 0, float );
		return tmp.getUint32( 0, true );
	}
	
	/**
	 * Calculates the number of bytes required to encode a `Uint16Array` using varint encoding.
	 *
	 * @param src The `Uint16Array` to measure.
	 * @param src_from The starting index in the array (inclusive).
	 * @param src_to The ending index in the array (exclusive).
	 * @returns The total number of bytes required.
	 */
	function varint_bytes( src: Uint16Array, src_from: number = 0, src_to: number = src.length ): number{
		let bytes = 0;
		let ch;
		while( src_from < src_to )
			bytes += ( ch = src[src_from++] ) < 0x80 ?
			         1 :
			         ch < 0x4000 ?
			         2 :
			         3;
		
		return bytes;
	}
	
	/**
	 * Counts the number of characters represented by a varint-encoded `Uint8Array`.
	 *
	 * @param src The `Uint8Array` containing varint encoded data.
	 * @param src_from The starting index in the array (inclusive).
	 * @param src_to The ending index in the array (exclusive).
	 * @returns The number of characters represented by the bytes.
	 */
	function varint_chars( src: Uint8Array, src_from: number = 0, src_to: number = src.length ): number{
		let chars = 0;
		while( src_from < src_to )
			if( src[src_from++] < 0x80 ) chars++;
		
		return chars;
	}
	
	/**
	 * Encodes a portion of a string into a `Uint8Array` using variable-length integer (varint) encoding for each character.
	 *
	 * @param src The source string to encode.
	 * @param src_from The starting index in the source string.
	 * @param dst The destination `Uint8Array` to store the encoded bytes.
	 * @param dst_from The starting index in the destination array.
	 * @returns A packed number containing two values: the high 21 bits are the next source index to process,
	 * and the low 32 bits are the number of bytes written to the destination.
	 */
	function varint_encode( src: string, src_from: number, dst: Uint8Array, dst_from: number ): number{
		for( let max = dst.length, ch; src_from < max; src_from++ )
			if( ( ch = src.charCodeAt( src_from ) ) < 0x80 ){
				if( dst_from === max ) break;
				
				dst[dst_from++] = ch;
			}else if( ch < 0x4_000 ){
				if( max - dst_from < 2 ) break;
				
				dst[dst_from++] = 0x80 | ch;
				dst[dst_from++] = ch >> 7;
			}else{
				if( max - dst_from < 3 ) break;
				
				dst[dst_from++] = 0x80 | ch;
				dst[dst_from++] = 0x80 | ( ch >> 7 );
				dst[dst_from++] = ch >> 14;
			}
		
		return src_from * 0x1_0000_0000 + dst_from;
	}
	
	/**
	 * Decodes a portion of a varint-encoded `Uint8Array` into a `Uint16Array`.
	 *
	 * @param src The source `Uint8Array` to decode.
	 * @param src_from The starting index in the source array.
	 * @param src_to The ending index (exclusive) in the source array.
	 * @param ret The state from a previous call, containing partial character data.
	 * @param dst The destination `Uint16Array` to store decoded characters.
	 * @param dst_from The starting index in the destination array.
	 * @returns A new state value, which can be used in a subsequent call to continue decoding.
	 * The value is packed and contains the next destination index, partial character, and bits processed.
	 */
	function varint_decode( src: Uint8Array, src_from: number, src_to: number, ret: number, dst: Uint16Array, dst_from: number | undefined ): number{
		if( dst_from === undefined ) dst_from = ( ret / 0x100_0000 ) | 0;
		const max = dst.length;
		if( max <= dst_from ) return ret;
		
		let ch = ret & 0xffff;
		let s = ( ret >> 16 ) & 0xff;
		let b = 0;
		while( src_from < src_to )
			if( ( b = src[src_from++] ) < 0x80 ){
				dst[dst_from++] = ( b << s ) | ch;
				s = 0;
				ch = 0;
				if( dst_from == max ) break;
			}else{
				ch |= ( b & 0x7f ) << s;
				s += 7;
			}
		
		return dst_from * 0x100_0000 + ( ( s << 16 ) | ch );
	}
	
	/**
	 * Packs a specified number of bits from a 32-bit number into a byte array at a given bit offset.
	 *
	 * @param src The source 32-bit number.
	 * @param dst The destination byte array.
	 * @param dst_bit  The starting bit position in the destination array.
	 * @param dst_bits The number of bits to pack.
	 */
	export function pack32( src: number, dst: Uint8Array, dst_bit: number, dst_bits: number ): void{
		
		let i = dst_bit >> 3;
		dst_bit &= 7;
		
		let done = Math.min( dst_bits, 8 - dst_bit );
		let mask = ( 1 << done ) - 1;
		dst[i] = dst[i] & ~( mask << dst_bit ) | ( src & mask ) << dst_bit;
		src >>= done;
		dst_bits -= done;
		i++;
		
		for( ; 7 < dst_bits; dst_bits -= 8, src >>= 8, i++ ) dst[i] = src;
		
		if( dst_bits === 0 ) return;
		mask = ( 1 << dst_bits ) - 1;
		dst[i] = dst[i] & ~mask | src & mask;
	}
	
	/**
	 * Unpacks a specified number of bits from a byte array into a 32-bit number.
	 *
	 * @param src The source byte array.
	 * @param src_bit  The starting bit position in the source array.
	 * @param src_bits The number of bits to unpack.
	 * @returns The unpacked bits as a 32-bit number.
	 */
	export function unpack32( src: Uint8Array, src_bit: number, src_bits: number ): number{
		
		let i = src_bit >> 3;
		src_bit &= 7;
		
		let done = Math.min( src_bits, 8 - src_bit );
		let result = src[i] >> src_bit & ( 1 << done ) - 1;
		
		src_bits -= done;
		i++;
		
		for( ; 7 < src_bits; done += 8, src_bits -= 8, i++ ) result |= src[i] << done;
		
		return ( src_bits === 0 ?
		         result :
		         result | ( src[i] & ( 1 << src_bits ) - 1 ) << done ) >>> 0;
	}
	
	/**
	 * Packs a 64-bit float (double) into a byte array at a specified bit offset.
	 *
	 * @param src      The source double value to pack.
	 * @param dst      The destination byte array.
	 * @param dst_bit  The starting bit offset in the destination array.
	 */
	export function packDouble( src: number, dst: Uint8Array, dst_bit: number ): void{
		const tmp = new DataView( new ArrayBuffer( 8 ) );
		tmp.setFloat64( 0, src, true );
		pack32( tmp.getUint32( 0, true ), dst, dst_bit, 32 );
		pack32( tmp.getUint32( 4, true ), dst, dst_bit + 32, 32 );
	}
	
	/**
	 * Unpacks a 64-bit float (double) from a byte array at a specified bit offset.
	 *
	 * @param src      The source byte array.
	 * @param src_bit  The starting bit offset in the source array.
	 * @returns The unpacked double value.
	 */
	export function unpackDouble( src: Uint8Array, src_bit: number ): number{
		const tmp = new DataView( new ArrayBuffer( 8 ) );
		tmp.setUint32( 0, unpack32( src, src_bit, 32 ), true );
		tmp.setUint32( 4, unpack32( src, src_bit + 32, 32 ), true );
		return tmp.getFloat64( 0, true );
	}
	
	/**
	 * Packs a specified number of bits from a number (up to 53 bits) into a byte array.
	 *
	 * @param src The source number.
	 * @param dst The destination byte array.
	 * @param dst_bit  The starting bit position in the destination array.
	 * @param dst_bits The number of bits to pack.
	 */
	export function pack53( src: number, dst: Uint8Array, dst_bit: number, dst_bits: number ): void{
		p.set( src );
		
		let i = dst_bit >> 3;
		dst_bit &= 7;
		
		let done = Math.min( dst_bits, 8 - dst_bit );
		let mask = ( 1 << done ) - 1;
		dst[i] = dst[i] & ~( mask << dst_bit ) | ( p.lo & mask ) << dst_bit;
		
		p.shru( done );
		dst_bits -= done;
		i++;
		
		for( ; 7 < dst_bits; dst_bits -= 8, p.shru( 8 ), i++ ) dst[i] = p.lo;
		
		if( dst_bits === 0 ) return;
		mask = ( 1 << dst_bits ) - 1;
		dst[i] = dst[i] & ~mask | p.lo & mask;
	}
	
	/**
	 * Unpacks a specified number of bits from a byte array into a number (up to 53 bits).
	 *
	 * @param src The source byte array.
	 * @param src_bit  The starting bit position in the source array.
	 * @param src_bits The number of bits to unpack.
	 * @returns The unpacked bits as a number.
	 */
	export function unpack53( src: Uint8Array, src_bit: number, src_bits: number ): number{
		let i = src_bit >> 3;
		src_bit &= 7;
		
		let done = Math.min( src_bits, 8 - src_bit );
		p.set( ( src[i] >> src_bit ) & ( ( 1 << done ) - 1 ) );
		
		src_bits -= done;
		i++;
		
		for( ; 7 < src_bits; done += 8, src_bits -= 8, i++ )
			p.or( q.set( src[i] ).shl( done ) );
		
		return src_bits === 0 ?
		       p.get() :
		       p.or( q.set( src[i] & ( ( 1 << src_bits ) - 1 ) ).shl( done ) ).get();
	}
	
	/**
	 * Packs a specified number of bits from a `bigint` value into a byte array.
	 *
	 * @param src The source `bigint`.
	 * @param dst The destination byte array.
	 * @param dst_bit  The starting bit position in the destination array.
	 * @param dst_bits The number of bits to pack.
	 */
	export function pack( src: bigint, dst: Uint8Array, dst_bit: number, dst_bits: number ): void{
		
		let i = dst_bit >> 3;
		dst_bit &= 7;
		
		let done = Math.min( dst_bits, 8 - dst_bit );
		let mask = ( 1n << BigInt( done ) ) - 1n;
		dst[i] = ( dst[i] & ~( Number( mask ) << dst_bit ) ) | Number( ( src & mask ) << BigInt( dst_bit ) );
		src >>= BigInt( done );
		dst_bits -= done;
		i++;
		
		for( ; 7 < dst_bits; dst_bits -= 8, src >>= 8n, i++ ) dst[i] = Number( src & 0xFFn );
		
		if( dst_bits === 0 ) return;
		mask = ( 1n << BigInt( dst_bits ) ) - 1n;
		dst[i] = ( dst[i] & ~Number( mask ) ) | Number( src & mask );
	}
	
	/**
	 * Unpacks a specified number of bits from a byte array into a `bigint` value.
	 *
	 * @param src The source byte array.
	 * @param src_bit  The starting bit position in the source array.
	 * @param src_bits The number of bits to unpack.
	 * @returns The unpacked bits as a `bigint`.
	 */
	export function unpack( src: Uint8Array, src_bit: number, src_bits: number ): bigint{
		
		let i = src_bit >> 3;
		src_bit &= 7;
		
		let done = Math.min( src_bits, 8 - src_bit );
		let result = BigInt( ( src[i] >> src_bit ) & ( ( 1 << done ) - 1 ) );
		
		src_bits -= done;
		i++;
		
		for( ; 7 < src_bits; done += 8, src_bits -= 8, i++ ){
			result |= BigInt( src[i] ) << BigInt( done );
		}
		
		return src_bits === 0 ?
		       result :
		       result | ( BigInt( src[i] & ( ( 1 << src_bits ) - 1 ) ) << BigInt( done ) );
	}
	
	/**
	 * A generic event handling class that allows subscribing and unsubscribing functions and interface-based handlers.
	 * @template F The function signature for function-based handlers.
	 * @template H The object type for interface-based handlers.
	 */
	export class Event<F extends ( ...args: any[] ) => any, H extends object>{
		
		protected functions: F [] = [];
		protected interfaces: H[] = [];
		
		/**
		 * Subscribes a handler to this event. The handler is not added if it is already subscribed.
		 * @param handler The handler to add, either as a function or an object implementing the handler interface.
		 * @returns `true` if subscribed successfully, `false` if already subscribed.
		 */
		subscribe( handler: H | F ): boolean{
			if( typeof handler === 'function' ){
				if( this.functions.includes( handler ) ) return false;
				this.functions.push( handler );
			}else{
				if( this.interfaces.includes( handler ) ) return false;
				this.interfaces.push( handler );
			}
			
			return true
		}
		
		/**
		 * Unsubscribes a handler from this event.
		 * @param handler The handler to remove.
		 * @returns `true` if the handler was found and removed, `false` otherwise.
		 */
		unsubscribe( handler: H | F ): boolean{
			
			if( typeof handler === 'function' ){
				const arr = this.functions;
				for( let i = 0; i < arr.length; i++ )
					if( arr[i] === handler ){
						arr[i] = arr[arr.length - 1];
						arr.pop();
						return true;
					}
			}else{
				const arr = this.interfaces;
				for( let i = 0; i < arr.length; i++ )
					if( arr[i] === handler ){
						arr[i] = arr[arr.length - 1];
						arr.pop();
						return true;
					}
			}
			return false
		}
	}
	
}
import AdHoc = org.unirail.AdHoc;

export default AdHoc;
