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
import AdHoc from "../AdHoc";

export default class ObjMap<K, V> implements Map<K, V>{
	
	// Indicates if an undefined key with a value exists in the map.
	#undefinedK_exists = false
	
	// Stores the value associated with an undefined key.
	#undefinedK_Value: V | undefined
	
	// Internal map to store key-value pairs with their hashed keys.
	readonly #hash_to_items: Map<number, [K, V][]> = new Map<number, [K, V][]>()
	
	// Function to generate a hash for a given key.
	readonly #hashK: ( hash: number, k: K | undefined ) => number
	
	// Function to compare two keys for equality.
	readonly #equalsK: ( k1: K, k2: K ) => boolean
	
	// Function to compare two values for equality.
	readonly #equalsV: ( v1: V, v2: V ) => boolean
	
	constructor( equalsK: ( k1: K, k2: K ) => boolean, hashK: ( hash: number, k: K ) => number, equalsV: ( v1: V, v2: V ) => boolean = Object.is ){
		this.#equalsK = equalsK
		this.#hashK   = hashK
		
		this.#equalsV = equalsV
	}
	
	// Internal counter to keep track of the size of the map.
	#_size = 0
	
	// Returns the number of key-value pairs in the map.
	get size(): number{ return this.#_size }
	
	// Removes all key-value pairs from the map.
	clear(): void{
		this.#hash_to_items.clear()
		this.#_size             = 0
		this.#undefinedK_exists = false
		this.#undefinedK_Value        = undefined
	}
	
	// Removes the specified key and its associated value from the map.
	delete( key: K ): boolean{
		
		if( !key ){
			if( !this.#undefinedK_exists ) return false
			
			this.#undefinedK_Value        = undefined
			this.#undefinedK_exists = false
			this.#_size--
			return true
		}
		
		const hash = this.#hashK( seed, key )
		if( !this.#hash_to_items.has( hash ) ) return false;
		
		const kv = this.#hash_to_items.get( hash )!
		
		if( kv.length == 1 )
			if( key === kv[0][0] || this.#equalsK( key, kv[0][0] ) ){
				this.#hash_to_items.delete( hash )
				this.#_size--
				return true
			}
			else return false
		
		if( key === kv[kv.length - 1][0] || this.#equalsK( key, kv[kv.length - 1][0] ) ){
			kv.pop();
			this.#_size--
			return true
		}
		
		for( let k = kv.length - 1; -1 < --k; )
			if( key === kv[k][0] || this.#equalsK( key, kv[k][0] ) ){
				kv[k] = kv[kv.length - 1];
				kv.pop();
				this.#_size--
				return true;
			}
		
		return false
	}
	
	// Returns the string tag of the object.
	get [Symbol.toStringTag]() { return 'ObjMap' }
	
	// Returns the value associated with the specified key.
	get( key: K ): V | undefined{
		if( !key ) return this.#undefinedK_exists ?
		                  this.#undefinedK_Value :
		                  undefined;
		
		const hash = this.#hashK( seed, key )
		if( !this.#hash_to_items.has( hash ) ) return undefined
		
		for( const kv of this.#hash_to_items.get( hash )! )
			if( key === kv[0] || this.#equalsK( key, kv[0] ) )
				return kv[1];
		
		return undefined
	}
	
	// Adds or updates a key-value pair in the map.
	set( key: K, value: V ): this{
		
		if( key ){
			const hash = this.#hashK( seed, key )
			
			if( this.#hash_to_items.has( hash ) ){
				const kvs = this.#hash_to_items.get( hash )!
				for( const kv of kvs )
					if( key === kv[0] || this.#equalsK( key, kv[0] ) ){
						kv[1] = value;
						return this
					}
				
				kvs.push( [key, value] )
			}
			else this.#hash_to_items.set( hash, [[key, value]] )
			
			this.#_size++
			return this;
		}
		
		if( !this.#undefinedK_exists ) this.#_size++
		this.#undefinedK_exists = true;
		this.#undefinedK_Value        = value;
		return this;
		
	}
	
	// Checks if a key exists in the map.
	has( key: K ): boolean{
		if( !key ) return this.#undefinedK_exists;
		
		const hash = this.#hashK( seed, key )
		if( !this.#hash_to_items.has( hash ) ) return false
		
		for( const kv of this.#hash_to_items.get( hash )! )
			if( key === kv[0] || this.#equalsK( key, kv[0] ) )
				return true;
		
		return false
	}
	
	// Iterable for key-value pairs in the map.
	* [Symbol.iterator](): IterableIterator<[K, V]>{
		if( this.#undefinedK_exists ) yield [undefined!, this.#undefinedK_Value!];
		for( const kvs of this.#hash_to_items.values() ){
			for( const kv of kvs )
				yield kv;
		}
	}
	
	// Iterable for key-value pairs in the map.
	* entries(): IterableIterator<[K, V]>{
		yield* this[Symbol.iterator]();
	}
	
	// Iterable for keys in the map.
	* keys(): IterableIterator<K>{
		if( this.#undefinedK_exists ) yield undefined!;
		for( const kvs of this.#hash_to_items.values() ){
			for( const kv of kvs )
				yield kv[0];
		}
	}
	
	// Iterable for values in the map.
	* values(): IterableIterator<V>{
		if( this.#undefinedK_exists ) yield this.#undefinedK_Value!!;
		for( const kvs of this.#hash_to_items.values() ){
			for( const kv of kvs )
				yield kv[1];
		}
	}
	
	// Executes a provided function once for each key-value pair in the map.
	forEach( callback: ( value: V, key: K, map: Map<K, V> ) => void, thisArg?: any ): void{
		if( this.#undefinedK_exists ) callback.call( thisArg, undefined, this.#undefinedK_Value, this );
		
		for( const kvs of this.#hash_to_items ){
			for( const kv of kvs )
				callback.call( thisArg, kv[1], kv[0], this );
		}
	}
	
	// Converts the map to an array of key-value pairs for JSON serialization.
	toJSON(): [K, V][] {
		const result: [K, V][] = []
		if (this.#undefinedK_exists) result.push([undefined!, this.#undefinedK_Value!])
		for (const kvs of this.#hash_to_items.values()) {
			result.push(...kvs)
		}
		return result
	}
	
	// Compares two ObjMap instances for equality.
	static equals<K, V>( m1: ObjMap<K, V>, m2: ObjMap<K, V> ): boolean{
		return m1 == undefined ?
		       m2 == undefined :
		       AdHoc.equals_maps( m1, m2, m1.#equalsV );
	}
	
}

const seed = 99041;
