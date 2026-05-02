declare module 'date-fns' {
  export type DateArg = Date | number | string;
  export function format(date: DateArg, formatStr: string, options?: unknown): string;
  export function getDay(date: DateArg): number;
}

declare module 'date-fns/locale' {
  export const es: unknown;
}
