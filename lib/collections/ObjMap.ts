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
 * A custom Map implementation that utilizes hashing for keys, allowing for custom
 * equality and hashing functions for keys, and custom equality for values.
 *
 * This implementation is designed for scenarios where:
 * - Keys may not be primitive types and require custom equality checks.
 * - Efficient key lookup via hashing is desired.
 * - Handling of `undefined` as a key is needed.
 *
 * @template K The type of keys in the map.
 * @template V The type of values in the map.
 * @implements {Map<K, V>}
 */
export default class ObjMap<K, V> implements Map<K, V>{
    /**
     * @private
     * Indicates if the key `undefined` is present in the map. This key is handled specially,
     * separate from the hash-based storage.
     */
    #undefinedK_exists = false;

    /**
     * @private
     * Stores the value associated with the `undefined` key.
     */
    #undefinedK_Value: V | undefined;

    /**
     * @private
     * Internal Map to store key-value pairs, where keys are hash codes of the actual keys.
     * Values in this Map are arrays of [K, V] pairs to handle hash collisions.
     */
    readonly #hash_to_items: Map<number, [ K, V ][]> = new Map<number, [ K, V ][]>();

    /**
     * @private
     * Function to generate a hash code for a given key.
     * This function is provided in the constructor to allow custom hashing logic.
     */
    readonly #hashK: ( hash: number, k: K ) => number;

    /**
     * @private
     * Function to compare two keys for equality.
     * This function is provided in the constructor to allow custom key equality logic.
     */
    readonly #equalsK: ( k1: K, k2: K ) => boolean;

    /**
     * @private
     * Function to compare two values for equality. Defaults to `Object.is` if not provided.
     * This function is used in methods like `ObjMap.equals` to compare values.
     */
    readonly #equalsV: ( v1: V, v2: V ) => boolean;

    /**
     * Creates a new ObjMap instance.
     *
     * @param equalsK - Function to determine if two keys are equal.
     * @param hashK - Function to generate a hash code for a key.
     * @param [equalsV=Object.is] - Function to determine if two values are equal. Defaults to `Object.is`.
     */
    constructor(
        equalsK: ( k1: K, k2: K ) => boolean,
        hashK: ( hash: number, k: K ) => number,
        equalsV: ( v1: V, v2: V ) => boolean = Object.is
    ){
        this.#equalsK = equalsK;
        this.#hashK = hashK;

        this.#equalsV = equalsV;
    }

    /**
     * @private
     * Internal counter to keep track of the number of key-value pairs in the map.
     */
    #_size = 0;

    /**
     * {@inheritDoc Map.size}
     * @returns {number} The number of key-value pairs in the map.
     */
    get size(): number{
        return this.#_size;
    }

    /**
     * {@inheritDoc Map.clear}
     * Removes all key-value pairs from the map.
     */
    clear(): void{
        this.#hash_to_items.clear();
        this.#_size = 0;
        this.#undefinedK_exists = false;
        this.#undefinedK_Value = undefined;
    }

    /**
     * {@inheritDoc Map.delete}
     * Removes the key-value pair with the specified key from the map.
     *
     * @param {K} key - The key of the element to remove.
     * @returns {boolean} - Returns `true` if an element in the Map existed and was removed, or `false` if the element does not exist.
     */
    delete( key: K ): boolean{
        if( key === undefined ){
            if( !this.#undefinedK_exists ) return false;

            this.#undefinedK_Value = undefined;
            this.#undefinedK_exists = false;
            this.#_size--;
            return true;
        }

        const hash = this.#hashK( seed, key );
        const items = this.#hash_to_items.get( hash );
        if( !items ) return false;

        if( items.length === 1 ){
            if( key === items[0][0] || this.#equalsK( key, items[0][0] ) ){
                this.#hash_to_items.delete( hash );
                this.#_size--;
                return true;
            }
            return false;
        }

        // Optimized removal for the last item in the collision list
        if( key === items[items.length - 1][0] || this.#equalsK( key, items[items.length - 1][0] ) ){
            items.pop();
            this.#_size--;
            return true;
        }

        // Iterate backwards for efficient removal from array and to avoid index issues when splicing.
        for( let k = items.length - 1; k >= 0; k-- ){
            if( key === items[k][0] || this.#equalsK( key, items[k][0] ) ){
                // Efficiently remove the element by replacing it with the last element and then popping.
                items[k] = items[items.length - 1];
                items.pop();
                this.#_size--;
                return true;
            }
        }

        return false;
    }

    /**
     * {@inheritDoc Map[Symbol.toStringTag]}
     * @returns {string} - The string tag "ObjMap".
     */
    get [Symbol.toStringTag](){
        return "ObjMap";
    }

    /**
     * {@inheritDoc Map.get}
     * Returns the value associated with the specified key.
     *
     * @param {K} key - The key of the element to return.
     * @returns {V | undefined} - Returns the value associated with the key, or `undefined` if the key is not found.
     */
    get( key: K ): V | undefined{
        if( key === undefined ) return this.#undefinedK_exists ?
                                       this.#undefinedK_Value :
                                       undefined;

        const hash = this.#hashK( seed, key );
        const items = this.#hash_to_items.get( hash );
        if( !items ) return undefined;

        for( const kv of items )
            if( key === kv[0] || this.#equalsK( key, kv[0] ) ) return kv[1];

        return undefined;
    }

    /**
     * {@inheritDoc Map.set}
     * Adds or updates a key-value pair in the map.
     *
     * @param {K} key - The key of the element to add or update.
     * @param {V} value - The value of the element to add or update.
     * @returns {this} - Returns the `ObjMap` object.
     */
    set( key: K, value: V ): this{
        if( key !== undefined ){
            const hash = this.#hashK( seed, key );
            let items = this.#hash_to_items.get( hash );

            if( items ){
                for( const kv of items ){
                    if( key === kv[0] || this.#equalsK( key, kv[0] ) ){
                        kv[1] = value;
                        return this;
                    }
                }
                items.push( [ key, value ] );
            }else
                this.#hash_to_items.set( hash, [ [ key, value ] ] );

            this.#_size++;
            return this;
        }

        // Handle undefined key
        if( !this.#undefinedK_exists ) this.#_size++;
        this.#undefinedK_exists = true;
        this.#undefinedK_Value = value;
        return this;
    }

    /**
     * {@inheritDoc Map.has}
     * Checks if a key exists in the map.
     *
     * @param {K} key - The key to search for.
     * @returns {boolean} - Returns `true` if an element with the specified key exists in the Map, otherwise `false`.
     */
    has( key: K ): boolean{
        if( key === undefined ) return this.#undefinedK_exists;

        const hash = this.#hashK( seed, key );
        const items = this.#hash_to_items.get( hash );
        if( !items ) return false;

        for( const kv of items )
            if( key === kv[0] || this.#equalsK( key, kv[0] ) ) return true;

        return false;
    }

    /**
     * {@inheritDoc Map[Symbol.iterator]}
     * Returns an iterator for key-value pairs in the map.
     *
     * @returns {IterableIterator<[K, V]>} - An iterator of [key, value] pairs for every entry in the map.
     */
    * [Symbol.iterator](): MapIterator<[ K, V ]>{
        if( this.#undefinedK_exists ) yield [ undefined as any, this.#undefinedK_Value! ]; // Type assertion to satisfy iterator type for undefined key
        for( const kvs of this.#hash_to_items.values() )
            yield* kvs; // Use yield* for better performance and readability when yielding from nested iterables.
    }

    /**
     * {@inheritDoc Map.entries}
     * Returns an iterator for key-value pairs in the map.
     * @returns {IterableIterator<[K, V]>} - An iterator of [key, value] pairs for every entry in the map.
     */
    * entries(): MapIterator<[ K, V ]>{
        yield* this[Symbol.iterator]();
    }

    /**
     * {@inheritDoc Map.keys}
     * Returns an iterator for keys in the map.
     * @returns {IterableIterator<K>} - An iterator of keys for every element in the map.
     */
    * keys(): MapIterator<K>{
        if( this.#undefinedK_exists ) yield undefined as any; // Type assertion for undefined key in iterator
        for( const kvs of this.#hash_to_items.values() )
            for( const kv of kvs ) yield kv[0];
    }

    /**
     * {@inheritDoc Map.values}
     * Returns an iterator for values in the map.
     * @returns {IterableIterator<V>} - An iterator of values for every element in the map.
     */
    * values(): MapIterator<V>{
        if( this.#undefinedK_exists ) yield this.#undefinedK_Value!;
        for( const kvs of this.#hash_to_items.values() )
            for( const kv of kvs ) yield kv[1];
    }

    /**
     * {@inheritDoc Map.forEach}
     * Executes a provided function once for each key-value pair in the map.
     *
     * @param callbackfn - Function to execute for each element, taking value, key, and map as arguments.
     * @param [thisArg] - Value to use as `this` when executing callback.
     */
    forEach( callbackfn: ( value: V, key: K, map: Map<K, V> ) => void, thisArg?: any ): void{
        if( this.#undefinedK_exists ) callbackfn.call( thisArg, this.#undefinedK_Value as V, undefined as any, this ); // Type assertion for undefined key in callback

        for( const kvs of this.#hash_to_items.values() )
            for( const kv of kvs ) callbackfn.call( thisArg, kv[1], kv[0], this );
    }

    /**
     * Converts the map to an array of key-value pairs for JSON serialization.
     * This method is automatically called by `JSON.stringify`.
     *
     * @returns {[K, V][]} - An array of [key, value] pairs representing the map's entries.
     */
    toJSON(): [ K, V ][]{
        const result: [ K, V ][] = [];
        if( this.#undefinedK_exists ) result.push( [ undefined as any, this.#undefinedK_Value! ] ); // Type assertion for undefined key in JSON
        for( const kvs of this.#hash_to_items.values() )
            result.push( ...kvs );
        return result;
    }

    /**
     * Checks if two ObjMap instances are equal.
     * Two ObjMaps are considered equal if they have the same number of entries and
     * each key-value pair in one map is present in the other map with the values being considered equal
     * based on the `equalsV` function of the first map (`m1`).
     *
     * @template K The key type of the ObjMaps.
     * @template V The value type of the ObjMaps.
     * @param {ObjMap<K, V> | undefined} m1 - The first ObjMap to compare.
     * @param {ObjMap<K, V> | undefined} m2 - The second ObjMap to compare.
     * @returns {boolean} - Returns `true` if the two ObjMaps are equal, `false` otherwise.
     */
    static equals<K, V>( m1: ObjMap<K, V> | undefined, m2: ObjMap<K, V> | undefined ): boolean{
        return m1 === m2 || ( m1 != undefined && m2 != undefined && AdHoc.equals_maps( m1, m2, m1.#equalsV ) );
    }

    /**
     * Returns a new ObjMap with the results of calling a provided function on every value in the calling ObjMap.
     * The keys of the new Map are the same as the original Map. The new map uses `Object.is` for value equality.
     *
     * @template U The value type of the new ObjMap after mapping.
     * @param callbackfn - Function that produces an element of the new Map, taking value, key, and map as arguments.
     * @param [thisArg] - Value to use as `this` when executing callbackfn.
     * @returns {ObjMap<K, U>} A new ObjMap with the results of the callback function.
     */
    mapValues<U>( callbackfn: ( value: V, key: K, map: ObjMap<K, V> ) => U, thisArg?: any ): ObjMap<K, U>{
        const newMap = new ObjMap<K, U>( this.#equalsK, this.#hashK, Object.is ); // Default Object.is for value equality in new map
        this.forEach( ( v, k ) =>
            newMap.set( k, callbackfn.call( thisArg, v, k, this ) )
        );
        return newMap;
    }

    /**
     * Returns a new ObjMap containing all entries of the calling ObjMap for which the provided filtering function returns true.
     * The new map uses the same key and value equality functions as the original map.
     *
     * @param callbackfn - Function to test each element of the ObjMap. Return true to keep the element, false otherwise, taking value, key, and map as arguments.
     * @param [thisArg] - Value to use as `this` when executing callbackfn.
     * @returns {ObjMap<K, V>} A new ObjMap containing only the elements that pass the test.
     */
    filter( callbackfn: ( value: V, key: K, map: ObjMap<K, V> ) => boolean, thisArg?: any ): ObjMap<K, V>{
        const newMap = new ObjMap<K, V>( this.#equalsK, this.#hashK, this.#equalsV );
        this.forEach( ( v, k ) => {
            if( callbackfn.call( thisArg, v, k, this ) ) newMap.set( k, v );
        } );
        return newMap;
    }

    /**
     * Reduces the ObjMap to a single value by applying a function against an accumulator and each value of the ObjMap (as encountered in iteration order).
     *
     * @template R The type of the accumulated value.
     * @param callbackfn - Function to execute on each value in the ObjMap, taking accumulator, current value, current key, and map as arguments.
     * @param initialValue - Value to use as the first argument to the first call of the callbackfn.
     * @returns {R} The single value that results from the reduction.
     */
    reduce<R>( callbackfn: ( accumulator: R, currentValue: V, key: K, map: ObjMap<K, V> ) => R, initialValue: R ): R{
        let accumulator = initialValue;
        this.forEach( ( v, k ) =>
            accumulator = callbackfn.call( undefined, accumulator, v, k, this ) // thisArg is intentionally undefined as per common reduce pattern
        );
        return accumulator;
    }
}

/**
 * @private
 * Seed value used for hashing keys. Can be adjusted if needed.
 */
const seed = 99041;
