const PNG_DATA_URL_PREFIX = "data:image/png;base64,";
const PNG_TEXT_CHUNKS = new Set(["tEXt", "zTXt", "iTXt"]);

const readUint32 = (binary: string, offset: number) =>
  (
    (binary.charCodeAt(offset) & 0xff) * 0x1000000 +
    ((binary.charCodeAt(offset + 1) & 0xff) << 16) +
    ((binary.charCodeAt(offset + 2) & 0xff) << 8) +
    (binary.charCodeAt(offset + 3) & 0xff)
  ) >>> 0;

const appendBinaryRange = (target: number[], binary: string, start: number, end: number) => {
  for (let index = start; index < end; index += 1) {
    target.push(binary.charCodeAt(index) & 0xff);
  }
};

const bytesToBinary = (bytes: number[]) => {
  let binary = "";
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.slice(index, index + chunkSize));
  }

  return binary;
};

export const stripPngTextChunks = (dataUrl: string) => {
  if (
    !dataUrl.startsWith(PNG_DATA_URL_PREFIX) ||
    typeof atob !== "function" ||
    typeof btoa !== "function"
  ) {
    return dataUrl;
  }

  try {
    const binary = atob(dataUrl.slice(PNG_DATA_URL_PREFIX.length));
    if (!binary.startsWith("\x89PNG\r\n\x1a\n")) return dataUrl;

    const output: number[] = [];
    appendBinaryRange(output, binary, 0, 8);

    let offset = 8;
    while (offset + 12 <= binary.length) {
      const length = readUint32(binary, offset);
      const type = binary.slice(offset + 4, offset + 8);
      const chunkEnd = offset + 12 + length;

      if (chunkEnd > binary.length) return dataUrl;
      if (!PNG_TEXT_CHUNKS.has(type)) {
        appendBinaryRange(output, binary, offset, chunkEnd);
      }

      offset = chunkEnd;
      if (type === "IEND") break;
    }

    return `${PNG_DATA_URL_PREFIX}${btoa(bytesToBinary(output))}`;
  } catch {
    return dataUrl;
  }
};
