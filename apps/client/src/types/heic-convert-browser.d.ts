declare module 'heic-convert/browser' {
  const convert: (options: Record<string, unknown>) => Promise<Blob | ArrayBuffer | Uint8Array>;
  export default convert;
}
