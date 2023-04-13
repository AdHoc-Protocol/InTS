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
export default class ObjSet<K> implements Set<K> {
    
    #undefinedV_exists = false
    
    
    readonly #map: Map<number, K []> = new Map<number, K[]>()
    readonly #hashK: (hash: number, k: K | undefined) => number
    readonly #equals: (k1: K, k2: K) => boolean
    
    constructor(equals: (k1: K, v2: K) => boolean, hashK: (hash: number, k: K) => number) {
        this.#hashK = hashK
        this.#equals = equals
    }
    
    #_size = 0
    
    get size(): number { return this.#_size }
    
    clear(): void {
        this.#map.clear()
        this.#_size = 0
        this.#undefinedV_exists = false
    }
    
    
    delete(key: K): boolean {
        
        if (!key) {
            if (!this.#undefinedV_exists) return false
            
            this.#undefinedV_exists = false
            this.#_size--
            return true
        }
        
        const hash = this.#hashK(seed, key)
        if (!this.#map.has(hash)) return false;
        
        const ks = this.#map.get(hash)!
        
        if (ks.length == 1)
            if (key === ks[0] || this.#equals(key, ks[0])) {
                this.#map.delete(hash)
                this.#_size--
                return true
            }
            else return false
        
        if (key === ks[ks.length - 1] || this.#equals(key, ks[ks.length - 1])) {
            ks.pop();
            this.#_size--
            return true
        }
        
        for (let k = ks.length - 1; -1 < --k;)
            if (key === ks[k] || this.#equals(key, ks[k])) {
                ks[k] = ks[ks.length - 1];
                ks.pop();
                this.#_size--
                return true;
            }
        
        return false
    }
    
    get [Symbol.toStringTag]() {return 'ObjSet'};
    
    add(key: K): this {
        if (key) {
            const hash = this.#hashK(seed, key)
            
            if (this.#map.has(hash)) {
                const ks = this.#map.get(hash)!
                for (const k of ks)
                    if (key === k || this.#equals(key, k))
                        return this
                
                ks.push(key)
            }
            else this.#map.set(hash, [key])
            
            this.#_size++
            return this;
        }
        
        if (this.#undefinedV_exists) return this;
        this.#_size++
        this.#undefinedV_exists = true;
        return this;
        
    }
    
    has(key: K): boolean {
        if (!key) return this.#undefinedV_exists;
        
        const hash = this.#hashK(seed, key)
        if (!this.#map.has(hash)) return false
        
        for (const k of this.#map.get(hash)!)
            if (this.#equals(key, k))
                return true;
        
        return false
    }
    
    * [Symbol.iterator](): IterableIterator<K> {
        if (this.#undefinedV_exists) yield undefined!;
        for (const ks of this.#map.values()) {
            for (const k of ks)
                yield k;
        }
    }
    
    * entries(): IterableIterator<[K, K]> {
        if (this.#undefinedV_exists) yield [undefined!, undefined!];
        for (const ks of this.#map.values()) {
            for (const k of ks)
                yield [k, k];
        }
    }
    
    * keys(): IterableIterator<K> {
        yield* this[Symbol.iterator]();
    }
    
    * values(): IterableIterator<K> {
        yield* this[Symbol.iterator]();
    }
    
    forEach(callback: (k: K, k2: K, set: Set<K>) => void, thisArg?: any): void {
        if (this.#undefinedV_exists) callback.call(thisArg, undefined, undefined, this);
        
        for (const ks of this.#map) {
            for (const k of ks)
                callback.call(thisArg, k, k, this);
        }
    }
    
    
}

const seed = 40009