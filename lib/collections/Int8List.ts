import AdHoc from "../AdHoc";

export namespace Int8List{
	
	// Read-only class to handle a list of Int8 values with a default value.
	export class R{
		readonly default_value: number;
		values: Int8Array;
		protected _size: number = 0;
		get size(){ return this._size;}
		
		// Returns the length of the underlying Int8Array.
		get length(){return this.values.length;}
		
		protected constructor( default_value: number ){ this.default_value = default_value; }
		
		// Gets the value at the specified index.
		get( index: number ): number{return this.values[index];}
		
		// Compares two R instances for equality.
		static equals( one: R | undefined, two: R | undefined ): boolean{
			if( one === two ) return true
			return !!one && !!two && one.size === two.size && AdHoc.equals_arrays( one.values, two.values, Object.is, one.size );
		}
		
		// Generates a hash for an R instance.
		static hash( hash: number, src: R | undefined ): number{
			return src ?
			       AdHoc.mix( hash, AdHoc.hash_array( hash, src.values, AdHoc.hash_number, src._size ) ) :
			       hash
		}
		
		
	}
	
	// An empty Int8Array constant.
	const O = new Int8Array( 0 );
	
	// Read-write class to handle a list of Int8 values with a default value.
	export class RW extends R{
		constructor( lengthOrArray: number | ArrayLike<number>, default_value?: number, size?: number ){
			super( default_value ?? 0 );
			if( typeof lengthOrArray === 'number' ){
				this.values = (lengthOrArray > 0) ?
				              new Int8Array( lengthOrArray ) :
				              O;
				
				if( default_value === undefined || !size || (this._size = Math.abs(size))<1 || size<1) return;
				

				if( default_value === 0 )
					this.set( size - 1, 0 )
				else
					while( -1 < --size ) this.set( size, default_value )
			}
			else{
				
				this.values = (lengthOrArray.length > 0) ?
				              new Int8Array( lengthOrArray.length ) :
				              O;
				this.set_( 0, lengthOrArray )
				
			}
		}
		
		// Adds a single value to the list.
		add1( value: number ): RW{
			return this.add1_( this._size, value );
		}
		
		// Adds a single value at a specific index.
		add1_( index: number, value: number ): RW{
			const max          = Math.max( index, this._size + 1 );
			this._size         = RW.resize_( this.values, this.values.length <= max ?
			                                              this.values = new Int8Array( max + max / 2 ) :
			                                              this.values, index, this._size, 1 );
			this.values[index] = value;
			return this;
		}
		
		// Adds multiple values to the list.
		add( ...src: number[] ): RW{ return this.add_( this._size, src, 0, src.length ); }
		
		// Adds multiple values starting at a specific index.
		add_( index: number, src: number[], src_index: number, len: number ): RW{
			const max  = Math.max( index, this._size ) + len;
			this._size = RW.resize_( this.values, this.values.length < max ?
			                                      this.values = new Int8Array( max + max / 2 ) :
			                                      this.values, index, this._size, len );
			for( let i = 0; i < len; i++ ){
				this.values[index + i] = src[src_index + i];
			}
			return this;
		}
		
		// Sets a single value.
		set1( value: number ): RW{ return this.set1_( this._size-1, value ); }
		
		// Sets a single value at a specific index.
		set1_( index: number, value: number ): RW{
			if( this._size <= index ){
				
				if( this.values.length <= index ) this.values = RW.resize( this.values, index + index / 2 );
				
				if( this.default_value !== 0 ){
					for( let i = this._size; i < index; i++ ){
						this.values[i] = this.default_value;
					}
				}
				
				this._size = index + 1;
			}
			
			this.values[index] = value;
			return this;
		}
		
		// Sets multiple values starting at a specific index.
		set( index: number, ...src: number[] ): RW{ return this.set_( index, src, 0, src.length ); }
		
		// Sets multiple values from a source array starting at a specific index.
		set_( index: number, src: ArrayLike<number>, src_index: number = 0, len: number = src.length ): RW{
	
			const max = index + len;
			if( this._size < max ){
				
				this.values = RW.resize( this.values, max + max / 2 );
				
				if( this.default_value !== 0 )
					for( let i = this._size; i < index; i++ )
						this.values[i] = this.default_value;
				
				this._size = max;
			}
			
			for( let i = 0; i < len; i++ )
				this.values[index + i] = src[src_index + i];
			
			return this;
		}
		
		// Swaps two values at the specified indices.
		swap( index1: number, index2: number ): RW{
			const tmp           = this.values[index1];
			this.values[index1] = this.values[index2];
			this.values[index2] = tmp;
			return this;
		}
		
		// Removes all occurrences of values from another RW instance.
		removeAll( src: RW ): number{
			const fix = this._size;
			
			for( let i = 0; i < src._size; i++ ){
				const value = src.values[i];
				const index = this.values.findIndex( ( v ) => v === value );
				if( index !== -1 ){
					if( this._size < 1 || this._size <= index )continue;
					this.values[index] = this.values[--this._size];
				}
			}
			
			return fix - this._size;
		}
		
		// Removes the last value from the list.
		remove(): RW{ return this.remove_( this._size - 1 ); }
		
		// Removes the value at the specified index.
		remove_( index: number ): RW{
			if( this._size < 1 || this._size < index ) return this;
			if( index === this._size - 1 ) this._size--;
			else this._size = RW.resize_( this.values, this.values, index, this._size, -1 );
			
			return this;
		}
		
		// Removes a range of values starting at the specified index.
		remove__( index: number, len: number ): RW{
			if( this._size < 1 || this._size < index ) return this;
			if( index === this._size - 1 ){
				this._size--;
			}
			else{
				this._size = RW.resize_( this.values, this.values, index, this._size, -len );
			}
			return this;
		}
		
		// Removes all occurrences of a specific value.
		removeAll_( src: number ): RW{
			
			for( let index = 0; (index = this.values.indexOf( src, index )) !== -1; )
				this.remove_( index );
			
			return this;
		}
		
		// Removes all occurrences of a specific value with a faster method.
		removeAll_fast( src: number ): RW{
			
			for( let index = 0; (index = this.values.indexOf( src, index )) !== -1; )
				this.values[index] = this.values[--this._size];
			
			return this;
		}
		
		// Removes a value at a specific index with a faster method.
		remove_fast( index: number ): RW{
			if( this._size < 1 || this._size <= index ) return this;
			
			this.values[index] = this.values[--this._size];
			return this;
		}
		
		// Retains only the values present in another RW instance.
		retainAll( chk: RW ): RW{
			
			for( let index = 0; index < this._size; index++ )
				if( chk.values.indexOf( this.values[index] ) )
					this.remove_( index );
			return this;
		}
		
		// Clears all values from the list.
		clear(): RW{
			if( this._size < 1 ) return this;
			this.values.fill( this.default_value, 0, this._size - 1 );
			this._size = 0;
			return this;
		}
		
		// Adjusts the length of the underlying array to fit the size of the list.
		fit(): RW{
			this.length = this._size;
			return this;
		}
		
		// Gets the length of the underlying Int8Array.
		get length(){return this.values.length;}
		
		// Sets the length of the underlying Int8Array.
		set length( items: number ){
			if( this.values.length !== items ){
				if( items < 1 ){
					this.values = O;
					this._size  = 0;
				}
				else{
					this.values = this.values.slice( 0, items );
					if( items < this._size ) this._size = items;
				}
			}
		}
		
		// Gets the current size of the list.
		get size(){ return this._size;}
		
		// Sets the size of the list.
		set size( size: number ){
			if( size < 1 ) this.clear();
			else if( this._size < size ) this.set1_( size - 1, this.default_value );
			else this._size = size;
		}
		
		// Resizes a Int8Array to a new size.
		private static resize( src: Int8Array, new_size: number ): Int8Array{
			const dst = new Int8Array( new_size );
			dst.set( src.subarray( 0, Math.min( src.length, new_size ) ) );
			return dst;
		}
		
		// Resizes a Int8Array and adjusts elements within the array.
		private static resize_( src: Int8Array, dst: Int8Array, index: number, size: number, resize: number ): number{
			if( resize < 0 ){
				if( index + (-resize) < size ){
					dst.set( src.subarray( index + (-resize), size ), index );
					if( src !== dst ) dst.set( src.subarray( 0, index ), 0 );
					return size + resize;
				}
				return index;
			}
			const new_size = Math.max( index, size ) + resize;
			if( size > 0 ){
				if( index < size ){
					if( index === 0 ){
						dst.set( src.subarray( 0, size ), resize );
					}
					else{
						if( src !== dst ) dst.set( src.subarray( 0, index ), 0 );
						dst.set( src.subarray( index, size ), index + resize );
					}
				}
				else if( src !== dst ){
					dst.set( src.subarray( 0, size ), 0 );
				}
			}
			return new_size;
		}
	}
}

export default Int8List;