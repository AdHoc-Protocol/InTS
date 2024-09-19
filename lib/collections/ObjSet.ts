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
import { json } from "node:stream/consumers";

export default class ObjSet<KEY> implements Set<KEY> {
  // Flag to indicate if an undefined key exists in the set.
  #undefined_Key_exists = false;

  // A map to store the hash values and their corresponding items.
  readonly #hash_to_items: Map<number, KEY[]> = new Map<number, KEY[]>();

  // Hash function to compute hash values for keys.
  readonly #hash: (hash: number, k: KEY) => number;

  // Equality function to compare keys.
  readonly #equals: (k1: KEY, k2: KEY) => boolean;

  // Constructor to initialize the hash and equals functions.
  constructor(equals: (k1: KEY, k2: KEY) => boolean, hash: (hash: number, k: KEY) => number) {
    this.#hash = hash;
    this.#equals = equals;
  }

  // Internal counter to keep track of the number of elements in the set.
  #_size = 0;

  // Returns the number of elements in the set.
  get size(): number {
    return this.#_size;
  }

  // Clears all elements from the set.
  clear(): void {
    this.#hash_to_items.clear();
    this.#_size = 0;
    this.#undefined_Key_exists = false;
  }

  // Deletes a specified key from the set.
  delete(key: KEY): boolean {
    if (!key) {
      if (!this.#undefined_Key_exists) return false;
      this.#undefined_Key_exists = false;
      this.#_size--;
      return true;
    }

    const hash = this.#hash(seed, key);
    if (!this.#hash_to_items.has(hash)) return false;

    const ks = this.#hash_to_items.get(hash)!;

    if (ks.length === 1)
      if (key === ks[0] || this.#equals(key, ks[0])) {
        this.#hash_to_items.delete(hash);
        this.#_size--;
        return true;
      } else return false;

    if (key === ks[ks.length - 1] || this.#equals(key, ks[ks.length - 1])) {
      ks.pop();
      this.#_size--;
      return true;
    }

    for (let k = ks.length - 1; k >= 0; k--)
      if (key === ks[k] || this.#equals(key, ks[k])) {
        ks[k] = ks[ks.length - 1];
        ks.pop();
        this.#_size--;
        return true;
      }

    return false;
  }

  // Returns the string tag of the object.
  get [Symbol.toStringTag]() {
    return "ObjSet";
  }

  // Converts the set to a JSON array.
  toJSON(): KEY[] {
    const json: KEY[] = [];
    if (this.#undefined_Key_exists) json.push(undefined!);
    for (const ks of this.#hash_to_items.values()) json.push(...ks);

    return json;
  }

  // Adds a key to the set.
  add(key: KEY): this {
    if (key) {
      const hash = this.#hash(seed, key);

      if (this.#hash_to_items.has(hash)) {
        const ks = this.#hash_to_items.get(hash)!;
        for (const k of ks) if (key === k || this.#equals(key, k)) return this;
        ks.push(key);
      } else this.#hash_to_items.set(hash, [key]);

      this.#_size++;
      return this;
    }

    if (this.#undefined_Key_exists) return this;
    this.#_size++;
    this.#undefined_Key_exists = true;
    return this;
  }

  // Checks if a key exists in the set.
  has(key: KEY): boolean {
    if (!key) return this.#undefined_Key_exists;

    const hash = this.#hash(seed, key);
    if (!this.#hash_to_items.has(hash)) return false;

    for (const k of this.#hash_to_items.get(hash)!) if (this.#equals(key, k)) return true;

    return false;
  }

  // Returns an iterator for the set.
  *[Symbol.iterator](): SetIterator<KEY> {
    if (this.#undefined_Key_exists) yield undefined!;
    for (const ks of this.#hash_to_items.values()) for (const k of ks) yield k;
  }

  // Returns an iterator for the entries in the set.
  *entries(): SetIterator<[KEY, KEY]> {
    if (this.#undefined_Key_exists) yield [undefined!, undefined!];
    for (const ks of this.#hash_to_items.values()) for (const k of ks) yield [k, k] ;
  }

  // Returns an iterator for the keys in the set.
  *keys(): SetIterator<KEY> {
    yield* this[Symbol.iterator]();
  }

  // Returns an iterator for the values in the set.
  *values(): SetIterator<KEY> {
    yield* this[Symbol.iterator]();
  }

  // Executes a provided function once for each value in the set.
  forEach(callback: (k: KEY, k2: KEY, set: Set<KEY>) => void, thisArg?: any): void {
    // @ts-ignore
    if (this.#undefined_Key_exists) callback.call(thisArg, undefined, undefined, this);

    for (const ks of this.#hash_to_items.values()) for (const k of ks) callback.call(thisArg, k, k, this);
  }

  // Returns a set containing elements that are in the current set but not in the other set.
  difference<U>(other: Set<U>): Set<KEY> {
    const result = new ObjSet<KEY>(this.#equals, this.#hash);
    for (const key of this) if (!other.has(key as unknown as U)) result.add(key);
    return result;
  }

  // Returns a set containing elements that are present in both sets.
  intersection<U>(other: Set<U>): Set<KEY & U> {
    const result = new ObjSet<KEY & U>(this.#equals as any, this.#hash as any);
    for (const key of this) if (other.has(key as unknown as U)) result.add(key as unknown as KEY & U);
    return result;
  }

  // Checks if two sets have no elements in common.
  isDisjointFrom(other: Set<unknown>): boolean {
    for (const key of this) if (other.has(key)) return false;
    return true;
  }

  // Checks if all elements of the current set are in the other set.
  isSubsetOf(other: Set<unknown>): boolean {
    for (const key of this) if (!other.has(key)) return false;
    return true;
  }

  // Checks if the current set contains all elements of the other set.
  isSupersetOf(other: Set<unknown>): boolean {
    for (const key of other) if (!this.has(key as KEY)) return false;
    return true;
  }

  // Returns a set containing elements that are in either of the sets but not in both.
  symmetricDifference<U>(other: Set<U>): Set<KEY | U> {
    const result = new ObjSet<KEY | U>(this.#equals as any, this.#hash as any);
    for (const key of this) if (!other.has(key as unknown as U)) result.add(key);
    for (const key of other) if (!this.has(key as any)) result.add(key as unknown as KEY | U);
    return result;
  }

  // Returns a set containing all elements from both sets.
  union<U>(other: Set<U>): Set<KEY | U> {
    const result = new ObjSet<KEY | U>(this.#equals as any, this.#hash as any);
    for (const key of this) result.add(key);
    for (const key of other) result.add(key as unknown as KEY | U);
    return result;
  }
}

// A seed value for the hash function.
const seed = 40009;
