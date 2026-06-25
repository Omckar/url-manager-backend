const BASE62_CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const ID_OFFSET = 100000000; // Ensures short codes have a consistent length (starts at 5 characters)

export function encodeBase62(num: number): string {
  let val = num + ID_OFFSET;
  if (val === 0) return BASE62_CHARS[0];
  
  let result = '';
  while (val > 0) {
    result = BASE62_CHARS[val % 62] + result;
    val = Math.floor(val / 62);
  }
  return result;
}

export function decodeBase62(str: string): number {
  let num = 0;
  for (let i = 0; i < str.length; i++) {
    const charIndex = BASE62_CHARS.indexOf(str[i]);
    if (charIndex === -1) {
      throw new Error(`Invalid Base62 character: ${str[i]}`);
    }
    num = num * 62 + charIndex;
  }
  return num - ID_OFFSET;
}
