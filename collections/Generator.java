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
