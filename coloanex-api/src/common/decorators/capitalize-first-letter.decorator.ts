import { Transform } from 'class-transformer';

export function CapitalizeFirstLetter() {
  return Transform(({ value }: { value: unknown }): string | string[] => {
    if (typeof value === 'string') {
      if (value.length === 0) return value;
      return value.charAt(0).toUpperCase() + value.slice(1);
    }
    if (Array.isArray(value)) {
      return value.map((v: unknown): string =>
        typeof v === 'string' && v.length > 0
          ? v.charAt(0).toUpperCase() + v.slice(1)
          : String(v),
      );
    }
    return String(value);
  });
}
