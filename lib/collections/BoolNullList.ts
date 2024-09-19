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

import BitsList from "./BitsList";
import AdHoc from "../AdHoc";

export namespace BoolNullList {
    export abstract class R extends BitsList._R {
        protected constructor(size?: number, length?: number, default_value?: boolean | undefined) {
            super(2, default_value == undefined ?
                     2 :
                     default_value ?
                     1 :
                     0, size, length);
        }

        contains(value: boolean | undefined): boolean {
            return -1 < super._indexOf(value === undefined ?
                                       2 :
                                       value ?
                                       1 :
                                       0);
        }

        indexOf(value: boolean | undefined): number {
            return super._indexOf(value === undefined ?
                                  2 :
                                  value ?
                                  1 :
                                  0);
        }

        lastIndexOf(value: boolean | undefined): number {
            return super._lastIndexOf_(this._size, value === undefined ?
                                                   2 :
                                                   value ?
                                                   1 :
                                                   0);
        }

        lastIndexOf_(from: number, value: boolean | undefined) {
            return super._lastIndexOf_(from, value === undefined ?
                                             2 :
                                             value ?
                                             1 :
                                             0);
        }

        get(index: number): boolean | undefined {
            const value = super.get_(index);
            return value == 2 ?
                   undefined :
                   value == 1;
        }

        public raw(index: number): number {
            return super.get_(index);
        }

        get [Symbol.toStringTag]() {
            return "BitsNullList.RW";
        }

        static hash(hash: number, src: R | undefined): number {
            return BitsList._R.hash(AdHoc.hash_number(hash, undefined), src);
        }

        static equals(one: R | undefined, two: R | undefined): boolean {
            return BitsList._R.equals(one, two) && (one === two || one != undefined);
        }
    }

    export class RW extends R {
        public constructor(size?: number, length?: number, default_value?: boolean | undefined) {
            super(size, length, default_value);
        }

        get [Symbol.toStringTag]() {
            return "BitsNullList.RW";
        }

        copy_of(bits_per_item: number, values: Uint8Array): RW {
            let r = new RW(bits_per_item, values.length);
            R.set_(r, 0, values);
            return r;
        }

        add(value: boolean | undefined) {
            BitsList.R.add(this, value === undefined ?
                                 2 :
                                 value ?
                                 1 :
                                 0);
        }

        add_(index: number, value: boolean | undefined) {
            R.add_(this, index, value === undefined ?
                                2 :
                                value ?
                                1 :
                                0);
        }

        removeAt(item: number) {
            R.removeAt(this, item);
        }

        remove() {
            R.removeAt(this, this._size - 1);
        }

        remove_(value: boolean | undefined) {
            R.remove(this, value === undefined ?
                           2 :
                           value ?
                           1 :
                           0);
        }

        get last(): boolean | undefined {
            const value = super.get_(this._size - 1);
            return value == 2 ?
                   undefined :
                   value == 1;
        }

        set last(value: boolean | undefined) {
            R.set(this, this._size - 1, value === undefined ?
                                        2 :
                                        value ?
                                        1 :
                                        0);
        }

        set1(value: boolean | undefined) {
            this.set1_(this.size - 1, value);
        }

        set1_(index: number, value: boolean | undefined) {
            R.set(this, index, value === undefined ?
                               2 :
                               value ?
                               1 :
                               0);
        }

        public raw_(index: number, value: number): void {
            R.set(this, index, value);
        }

        set(index: number, ...src: (boolean | undefined)[]): RW {
            return this.set_(index, src);
        }

        set_(index: number, values: ArrayLike<boolean | undefined>): RW {
            for (let i = values.length; -1 < --i;) {
                const value = values[i];
                R.set(this, index, value === undefined ?
                                   2 :
                                   value ?
                                   1 :
                                   0);
            }
            return this;
        }

        retainAll(chk: R): boolean {
            let fix = this._size;
            let v;
            for (let item = 0; item < this._size; item++) if (!chk.contains((v = this.get(item)))) R.remove(this, v === undefined ?
                                                                                                                  2 :
                                                                                                                  v ?
                                                                                                                  1 :
                                                                                                                  0);
            return fix != this._size;
        }

        clear() {
            super.clear();
        }

        get length(): number {
            return ((this.values.length * BitsList.BITS) / this.bits) | 0;
        }

        set length(items: number) {
            super.set_length(items);
        }

        fit() {
            this.length = -this._size;
        }
    }
}
export default BoolNullList;
