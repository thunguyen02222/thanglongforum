export const isPlainObject = (val: any): boolean =>
  val && typeof val === 'object' && !Array.isArray(val);

export const isEmptyObject = (obj: any): boolean =>
  isPlainObject(obj) && Object.keys(obj).length === 0;

export const pick = <T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  keys.forEach((key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
};

export const omit = <T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> => {
  const result = { ...obj };
  keys.forEach((key) => {
    delete result[key];
  });
  return result as Omit<T, K>;
};

export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  return JSON.parse(JSON.stringify(obj));
};

type PromiseSettledResult<T> =
  | { status: 'fulfilled'; value: T }
  | { status: 'rejected'; reason: any };

export function mapSettledValues<T>(
  results: PromiseSettledResult<T>[]
): (T | null)[] {
  return results.map((r) =>
    r && r.status === 'fulfilled' ? r.value : null
  );
}

