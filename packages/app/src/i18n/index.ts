import { en } from "./en";

type TranslationTree = typeof en;
type Primitive = string | number | boolean;

type DeepKeyOf<T> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object ? `${K}` | `${K}.${DeepKeyOf<T[K]>}` : `${K}`;
    }[keyof T & string]
  : never;

const dictionary: TranslationTree = en;

const getValue = (obj: unknown, path: string): unknown => {
  return path.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object" && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
};

export const t = (key: DeepKeyOf<TranslationTree>, params?: Record<string, Primitive>): string => {
  const raw = getValue(dictionary, key);
  if (typeof raw !== "string") return key;
  if (!params) return raw;

  return Object.entries(params).reduce((result, [param, value]) => {
    const token = `{{${param}}}`;
    return result.split(token).join(String(value));
  }, raw);
};
