export default class ObjMap<K, V> implements Map<K, V> {
    
    #undefinedV_exists = false
    
    #undefinedV: V | undefined
    
    readonly #map: Map<number, [K, V][]> = new Map<number, [K, V][]>()
    readonly #hashK: (hash: number, k: K | undefined) => number
    readonly #hashV: (hash: number, v: V | undefined) => number
    readonly #equalsK: (k1: K, k2: K) => boolean
    readonly #equalsV: (v1: V, v2: V) => boolean
    
    constructor(equalsK: (k1: K, k2: K) => boolean, hashK: (hash: number, k: K) => number, equalsV: (v1: V, v2: V) => boolean, hashV: (hash: number, v: V) => number) {
        this.#equalsK = equalsK
        this.#hashK = hashK
        
        this.#equalsV = equalsV
        this.#hashV = hashV
    }
    
    #_size = 0
    
    get size(): number { return this.#_size }
    
    clear(): void {
        this.#map.clear()
        this.#_size = 0
        this.#undefinedV_exists = false
        this.#undefinedV = undefined
    }
    
    
    delete(key: K): boolean {
        
        if (!key) {
            if (!this.#undefinedV_exists) return false
            
            this.#undefinedV = undefined
            this.#undefinedV_exists = false
            this.#_size--
            return true
        }
        
        const hash = this.#hashK(seed, key)
        if (!this.#map.has(hash)) return false;
        
        const kv = this.#map.get(hash)!
        
        if (kv.length == 1)
            if (key === kv[0][0] || this.#equalsK(key, kv[0][0])) {
                this.#map.delete(hash)
                this.#_size--
                return true
            }
            else return false
        
        if (key === kv[kv.length - 1][0] || this.#equalsK(key, kv[kv.length - 1][0])) {
            kv.pop();
            this.#_size--
            return true
        }
        
        for (let k = kv.length - 1; -1 < --k;)
            if (key === kv[k][0] || this.#equalsK(key, kv[k][0])) {
                kv[k] = kv[kv.length - 1];
                kv.pop();
                this.#_size--
                return true;
            }
        
        return false
    }
    
    get [Symbol.toStringTag]() {return 'ObjMap'};
    
    get(key: K): V | undefined {
        if (!key) return this.#undefinedV_exists ? this.#undefinedV : undefined;
        
        const hash = this.#hashK(seed,key)
        if (!this.#map.has(hash)) return undefined
        
        for (const kv of this.#map.get(hash)!)
            if (key === kv[0] || this.#equalsK(key, kv[0]))
                return kv[1];
        
        return undefined
    }
    
    set(key: K, value: V): this {
        
        if (key) {
            const hash = this.#hashK(seed,key)
            
            if (this.#map.has(hash)) {
                const kvs = this.#map.get(hash)!
                for (const kv of kvs)
                    if (key === kv[0] || this.#equalsK(key, kv[0])) {
                        kv[1] = value;
                        return this
                    }
                
                kvs.push([key, value])
            }
            else this.#map.set(hash, [[key, value]])
            
            this.#_size++
            return this;
        }
        
        if (!this.#undefinedV_exists) this.#_size++
        this.#undefinedV_exists = true;
        this.#undefinedV = value;
        return this;
        
    }
    
    has(key: K): boolean {
        if (!key) return this.#undefinedV_exists;
        
        const hash = this.#hashK(seed,key)
        if (!this.#map.has(hash)) return false
        
        for (const kv of this.#map.get(hash)!)
            if (key === kv[0] || this.#equalsK(key, kv[0]))
                return true;
        
        return false
    }
    
    * [Symbol.iterator](): IterableIterator<[K, V]> {
        if (this.#undefinedV_exists) yield [undefined!, this.#undefinedV!];
        for (const kvs of this.#map.values()) {
            for (const kv of kvs)
                yield kv;
        }
    }
    
    * entries(): IterableIterator<[K, V]> {
        yield* this[Symbol.iterator]();
    }
    
    * keys(): IterableIterator<K> {
        if (this.#undefinedV_exists) yield undefined!;
        for (const kvs of this.#map.values()) {
            for (const kv of kvs)
                yield kv[0];
        }
    }
    
    * values(): IterableIterator<V> {
        if (this.#undefinedV_exists) yield this.#undefinedV!!;
        for (const kvs of this.#map.values()) {
            for (const kv of kvs)
                yield kv[1];
        }
    }
    
    forEach(callback: (value: V, key: K, map: Map<K, V>) => void, thisArg?: any): void {
        if (this.#undefinedV_exists) callback.call(thisArg, undefined, this.#undefinedV, this);
        
        for (const kvs of this.#map) {
            for (const kv of kvs)
                callback.call(thisArg, kv[1], kv[0], this);
        }
    }
    
    
}

const seed = 99041;
