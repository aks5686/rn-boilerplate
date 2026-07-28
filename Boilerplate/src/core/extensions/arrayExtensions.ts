/**
 * Framework-agnostic Array utilities used across features.
 * Kept as free functions (rather than prototype patches) to avoid polluting
 * global Array.prototype, which is unsafe in a shared RN app + third-party libs.
 */

export function unique<T>(array: readonly T[]): T[] {
  return Array.from(new Set(array));
}

export function uniqueBy<T, K>(array: readonly T[], keySelector: (item: T) => K): T[] {
  const seen = new Set<K>();
  const result: T[] = [];
  for (const item of array) {
    const key = keySelector(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
}

export function chunk<T>(array: readonly T[], size: number): T[][] {
  if (size <= 0) {
    throw new RangeError('chunk size must be a positive integer');
  }
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

export function groupBy<T, K extends PropertyKey>(
  array: readonly T[],
  keySelector: (item: T) => K,
): Record<K, T[]> {
  return array.reduce((acc, item) => {
    const key = keySelector(item);
    (acc[key] ??= []).push(item);
    return acc;
  }, {} as Record<K, T[]>);
}

export function sortBy<T>(
  array: readonly T[],
  keySelector: (item: T) => number | string,
  direction: 'asc' | 'desc' = 'asc',
): T[] {
  const sorted = [...array].sort((a, b) => {
    const keyA = keySelector(a);
    const keyB = keySelector(b);
    if (keyA < keyB) return -1;
    if (keyA > keyB) return 1;
    return 0;
  });
  return direction === 'desc' ? sorted.reverse() : sorted;
}

export function isEmpty<T>(array: readonly T[] | null | undefined): boolean {
  return !array || array.length === 0;
}

export function isNotEmpty<T>(array: readonly T[] | null | undefined): array is T[] {
  return !isEmpty(array);
}

export function first<T>(array: readonly T[]): T | undefined {
  return array[0];
}

export function last<T>(array: readonly T[]): T | undefined {
  return array[array.length - 1];
}

export function compact<T>(array: readonly (T | null | undefined | false | 0 | '')[]): T[] {
  return array.filter(Boolean) as T[];
}

export function sum(array: readonly number[]): number {
  return array.reduce((total, value) => total + value, 0);
}

export function average(array: readonly number[]): number {
  return isEmpty(array) ? 0 : sum(array) / array.length;
}

export function partition<T>(
  array: readonly T[],
  predicate: (item: T) => boolean,
): [T[], T[]] {
  const truthy: T[] = [];
  const falsy: T[] = [];
  for (const item of array) {
    (predicate(item) ? truthy : falsy).push(item);
  }
  return [truthy, falsy];
}

export function shuffle<T>(array: readonly T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function move<T>(array: readonly T[], fromIndex: number, toIndex: number): T[] {
  const result = [...array];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
}
