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
package collections;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

public interface Generator {
	
	String origin = "BigUint64Array";
	
	static void gen(String src, Path dir, String name) throws IOException {
		src = src.replace(origin, name);
		Path path = dir.resolve(name + "Null.ts");
		if (Files.exists(path)) Files.delete(path);
		Files.writeString(path, src);
	}
	
	static void main(String[] args) {
		Path dir = Paths.get(args[0]);
		try
		{
			String src = Files.readString(dir.resolve(origin + "Null.ts"));
			gen(src, dir, "BigInt64Array");
			src = src.replace("0n", "0").replace("bigint", "number");
			gen(src, dir, "Int8Array");
			gen(src, dir, "Uint8Array");
			gen(src, dir, "Int16Array");
			gen(src, dir, "Uint16Array");
			gen(src, dir, "Int32Array");
			gen(src, dir, "Uint32Array");
			gen(src, dir, "Float32Array");
			gen(src, dir, "Float64Array");
			
		} catch (IOException e)
		{
			e.printStackTrace();
		}
	}
}
