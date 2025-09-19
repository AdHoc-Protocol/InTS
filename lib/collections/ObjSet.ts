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

/**
 * A custom Set implementation that uses hashing for elements, allowing for custom
 * equality and hashing functions for elements.
 *
 * This implementation is suitable for scenarios where:
 * - Elements may not be primitive types and require custom equality checks.
 * - Efficient element lookup via hashing is desired.
 * - Handling of `undefined` as an element is needed.
 *
 * @template KEY The type of elements in the set.
 * @implements {Set<KEY>}
 */
export default class ObjSet<KEY> implements Set<KEY>{
  /**
   * @private
   * Flag to indicate if the `undefined` element exists in the set.
   * `undefined` is handled separately as it cannot be reliably used as a key
   * in standard JavaScript hash-based structures or may require special treatment.
   */
  #undefined_Key_exists = false;

  /**
   * @private
   * A map to store hash codes as keys and arrays of actual elements (keys) as values.
   * Used for efficient lookup and collision handling.
   */
  readonly #hash_to_items: Map<number, KEY[]> = new Map<number, KEY[]>();

  /**
   * @private
   * Hash function to compute hash codes for elements.
   * Provided in the constructor to allow custom hashing logic.
   */
  readonly #hash: ( hash: number, k: KEY ) => number;

  /**
   * @private
   * Equality function to compare elements for equality.
   * Provided in the constructor to allow custom element equality logic.
   */
  readonly #equals: ( k1: KEY, k2: KEY ) => boolean;

  /**
   * Creates a new ObjSet instance.
   *
   * @param equals - Function to determine if two elements are equal.
   * @param hash - Function to generate a hash code for an element.
   */
  constructor( equals: ( k1: KEY, k2: KEY ) => boolean, hash: ( hash: number, k: KEY ) => number ){
      this.#hash = hash;
      this.#equals = equals;
  }

  /**
   * @private
   * Internal counter to keep track of the number of elements in the set.
   */
  #_size = 0;

  /**
   * {@inheritDoc Set.size}
   * @returns {number} The number of elements in the set.
   */
  get size(): number{ return this.#_size; }

  /**
   * {@inheritDoc Set.clear}
   * Removes all elements from the set.
   */
  clear(): void{
      this.#hash_to_items.clear();
      this.#_size = 0;
      this.#undefined_Key_exists = false;
  }

  /**
   * {@inheritDoc Set.delete}
   * Removes the specified element from the set.
   *
   * @param {KEY} key - The element to remove from the set.
   * @returns {boolean} - Returns `true` if the element was successfully removed; otherwise `false` if the element is not in the set.
   */
  delete( key: KEY ): boolean{
      if( key === undefined ){
          if( !this.#undefined_Key_exists ) return false;
          this.#undefined_Key_exists = false;
          this.#_size--;
          return true;
      }

      const hash = this.#hash( seed, key );
      const items = this.#hash_to_items.get( hash );
      if( !items ) return false;

      if( items.length === 1 ){
          if( key === items[0] || this.#equals( key, items[0] ) ){
              this.#hash_to_items.delete( hash );
              this.#_size--;
              return true;
          }
          return false;
      }

      // Optimized removal for the last item in the collision list
      if( key === items[items.length - 1] || this.#equals( key, items[items.length - 1] ) ){
          items.pop();
          this.#_size--;
          return true;
      }

      // Iterate backwards for efficient removal and to avoid index issues when splicing.
      for( let k = items.length - 1; k >= 0; k-- )
          if( key === items[k] || this.#equals( key, items[k] ) ){
              // Efficiently remove the element by replacing it with the last element and then popping.
              items[k] = items[items.length - 1];
              items.pop();
              this.#_size--;
              return true;
          }

      return false;
  }

  /**
   * {@inheritDoc Set[Symbol.toStringTag]}
   * @returns {string} - The string tag "ObjSet".
   */
  get [Symbol.toStringTag](){ return "ObjSet"; }

  /**
   * Converts the set to a JSON array. Called automatically by `JSON.stringify`.
   *
   * @returns {KEY[]} - An array containing the elements in the set.
   */
  toJSON(): KEY[]{
      const ret: KEY[] = [];
      if( this.#undefined_Key_exists ) ret.push( undefined as any );
      for( const items of this.#hash_to_items.values() )
          ret.push( ...items );
      return ret;
  }

  /**
   * {@inheritDoc Set.add}
   * Adds a new element to the set if it is not already present.
   *
   * @param {KEY} key - The element to add to the set.
   * @returns {this} - Returns the `ObjSet` object.
   */
  add( key: KEY ): this{
      if( key !== undefined ){
          const hash = this.#hash( seed, key );
          let items = this.#hash_to_items.get( hash );

          if( items ){
              for( const existingKey of items )
                  if( key === existingKey || this.#equals( key, existingKey ) ) return this;
              items.push( key );
          }else
              this.#hash_to_items.set( hash, [ key ] );

          this.#_size++;
          return this;
      }

      // Handle undefined element
      if( this.#undefined_Key_exists ) return this;
      this.#_size++;
      this.#undefined_Key_exists = true;
      return this;
  }

  /**
   * {@inheritDoc Set.has}
   * Checks if an element is present in the set.
   *
   * @param {KEY} key - The element to check for in the set.
   * @returns {boolean} - Returns `true` if an element with the specified value is present in the set; otherwise `false`.
   */
  has( key: KEY ): boolean{
      if( key === undefined ) return this.#undefined_Key_exists;

      const hash = this.#hash( seed, key );
      const items = this.#hash_to_items.get( hash );
      if( !items ) return false;

      for( const k of items )
          if( key === k || this.#equals( key, k ) ) return true; // Standard Set uses SameValueZero equality, here we use strict equality or custom #equals.

      return false;
  }

  /**
   * {@inheritDoc Set[Symbol.iterator]}
   * Returns an iterator for all elements in the set.
   * @returns {SetIterator<KEY>} - An iterator of the values in the set.
   */
  * [Symbol.iterator](): SetIterator<KEY>{
      if( this.#undefined_Key_exists ) yield undefined!;
      for( const items of this.#hash_to_items.values() )
          yield* items; // Use yield* for better performance and readability

  }

  /**
   * {@inheritDoc Set.entries}
   * Returns an iterator for entries in the set, which are [value, value] pairs.
   * @returns {SetIterator<[KEY, KEY]>} - An iterator of [value, value] pairs for every element in the set.
   */
  * entries(): SetIterator<[ KEY, KEY ]>{
      if( this.#undefined_Key_exists ) yield [ undefined!, undefined! ];
      for( const items of this.#hash_to_items.values() )
          for( const item of items ) yield [ item, item ];

  }

  /**
   * {@inheritDoc Set.keys}
   * Returns an iterator for the values in the set. (Same as `values()` and `[Symbol.iterator]()` for Set).
   * @returns {SetIterator<KEY>} - An iterator of values in the set.
   */
  * keys(): SetIterator<KEY>{
      yield* this[Symbol.iterator]();
  }

  /**
   * {@inheritDoc Set.values}
   * Returns an iterator for the values in the set. (Same as `keys()` and `[Symbol.iterator]()` for Set).
   * @returns {SetIterator<KEY>} - An iterator of values in the set.
   */
  * values(): SetIterator<KEY>{
      yield* this[Symbol.iterator]();
  }

  /**
   * {@inheritDoc Set.forEach}
   * Executes a provided function once for each value in the set, in insertion order.
   *
   * @param callbackfn - Function to execute for each element, taking value, same value (key), and set as arguments.
   * @param [thisArg] - Value to use as `this` when executing callbackfn.
   */
  forEach( callbackfn: ( value: KEY, value2: KEY, set: Set<KEY> ) => void, thisArg?: any ): void{
      if( this.#undefined_Key_exists ) callbackfn.call( thisArg, undefined as any, undefined as any, this );

      for( const items of this.#hash_to_items.values() )
          for( const item of items ) callbackfn.call( thisArg, item, item, this );
  }

  /**
   * Returns a new ObjSet containing elements that are in this set but not in the `other` set (set difference).
   * The new set uses the same equality and hash functions as this set.
   *
   * @template U The type of elements in the `other` set.
   * @param {Set<U>} other - The set to compare against.
   * @returns {ObjSet<KEY>} - A new ObjSet containing the difference of the two sets.
   */
  difference<U>( other: Set<U> ): ObjSet<KEY>{
      const resultSet = new ObjSet<KEY>( this.#equals, this.#hash );
      for( const key of this )
          if( !other.has( key as unknown as U ) )
              resultSet.add( key );
      return resultSet;
  }

  /**
   * Returns a new ObjSet containing elements that are in both this set and the `other` set (set intersection).
   * The new set's equality and hash functions are taken from this set; care should be taken if `KEY` and `U` types differ significantly.
   *
   * @template U The type of elements in the `other` set.
   * @param {Set<U>} other - The set to intersect with.
   * @returns {ObjSet<KEY & U>} - A new ObjSet containing the intersection of the two sets.
   */
  intersection<U>( other: Set<U> ): ObjSet<KEY & U>{
      const resultSet = new ObjSet<KEY & U>( this.#equals as any, this.#hash as any );
      for( const key of this )
          if( other.has( key as unknown as U ) )
              resultSet.add( key as unknown as KEY & U );
      return resultSet;
  }

  /**
   * Checks if this set is disjoint from the `other` set, meaning they have no elements in common.
   *
   * @param {Set<unknown>} other - The set to check disjointness against.
   * @returns {boolean} - `true` if the sets are disjoint; otherwise `false`.
   */
  isDisjointFrom( other: Set<unknown> ): boolean{
      for( const key of this )
          if( other.has( key ) ) return false;
      return true;
  }

  /**
   * Checks if this set is a subset of the `other` set, meaning all elements in this set are also in the `other` set.
   *
   * @param {Set<unknown>} other - The set to check if it's a superset.
   * @returns {boolean} - `true` if this set is a subset of the `other` set; otherwise `false`.
   */
  isSubsetOf( other: Set<unknown> ): boolean{
      for( const key of this )
          if( !other.has( key ) ) return false;
      return true;
  }

  /**
   * Checks if this set is a superset of the `other` set, meaning this set contains all elements in the `other` set.
   *
   * @param {Set<unknown>} other - The set to check if it's a subset.
   * @returns {boolean} - `true` if this set is a superset of the `other` set; otherwise `false`.
   */
  isSupersetOf( other: Set<unknown> ): boolean{
      for( const key of other )
          if( !this.has( key as KEY ) ) return false;
      return true;
  }

  /**
   * Returns a new ObjSet with elements that are in either of this set or the `other` set, but not in both (symmetric difference).
   * The new set's equality and hash functions are taken from this set; care should be taken if `KEY` and `U` types differ significantly.
   *
   * @template U The type of elements in the `other` set.
   * @param {Set<U>} other - The set to compute symmetric difference with.
   * @returns {ObjSet<KEY | U>} - A new ObjSet containing the symmetric difference of the two sets.
   */
  symmetricDifference<U>( other: Set<U> ): ObjSet<KEY | U>{
      const resultSet = new ObjSet<KEY | U>( this.#equals as any, this.#hash as any );
      for( const key of this )
          if( !other.has( key as unknown as U ) )
              resultSet.add( key );
      for( const key of other )
          if( !this.has( key as any ) ) // Cast to any if U is not directly assignable to KEY for `this.has`
              resultSet.add( key as unknown as KEY | U );
      return resultSet;
  }

  /**
   * Returns a new ObjSet containing all elements from both this set and the `other` set (set union).
   * The new set's equality and hash functions are taken from this set; care should be taken if `KEY` and `U` types differ significantly.
   *
   * @template U The type of elements in the `other` set.
   * @param {Set<U>} other - The set to compute union with.
   * @returns {ObjSet<KEY | U>} - A new ObjSet containing the union of the two sets.
   */
  union<U>( other: Set<U> ): ObjSet<KEY | U>{
      const resultSet = new ObjSet<KEY | U>( this.#equals as any, this.#hash as any );
      for( const key of this )
          resultSet.add( key );
      for( const key of other )
          resultSet.add( key as unknown as KEY | U );
      return resultSet;
  }
}

/**
* @private
* Seed value for the hash function. Can be adjusted if needed.
*/
const seed = 40009;
