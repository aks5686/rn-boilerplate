/**
 * Framework-agnostic String utilities used across features.
 * Free functions (not String.prototype patches) to keep the global scope clean.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isEmpty(value: string | null | undefined): boolean {
  return value == null || value.length === 0;
}

export function isBlank(value: string | null | undefined): boolean {
  return isEmpty(value) || value!.trim().length === 0;
}

export function isNotBlank(value: string | null | undefined): value is string {
  return !isBlank(value);
}

export function capitalize(value: string): string {
  if (value.length === 0) return value;
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export function capitalizeWords(value: string): string {
  return value
    .split(' ')
    .map(word => (word.length > 0 ? capitalize(word) : word))
    .join(' ');
}

export function truncate(value: string, maxLength: number, suffix: string = '...'): string {
  if (value.length <= maxLength) return value;
  return value.slice(0, Math.max(0, maxLength - suffix.length)) + suffix;
}

export function toCamelCase(value: string): string {
  return value
    .replace(/[-_\s]+(.)?/g, (_, char: string | undefined) => (char ? char.toUpperCase() : ''))
    .replace(/^([A-Z])/, match => match.toLowerCase());
}

export function toSnakeCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toLowerCase();
}

export function toKebabCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[_\s]+/g, '-')
    .toLowerCase();
}

export function toTitleCase(value: string): string {
  return value.replace(
    /\w\S*/g,
    word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
  );
}

export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim());
}

export function maskEmail(value: string): string {
  const [local, domain] = value.split('@');
  if (!domain) return value;
  const visibleChars = Math.min(2, local.length);
  const masked = local.slice(0, visibleChars) + '*'.repeat(Math.max(local.length - visibleChars, 0));
  return `${masked}@${domain}`;
}

export function stripWhitespace(value: string): string {
  return value.replace(/\s+/g, '');
}

export function removeDiacritics(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function slugify(value: string): string {
  return removeDiacritics(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function initials(fullName: string, maxInitials: number = 2): string {
  return fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, maxInitials)
    .map(part => part.charAt(0).toUpperCase())
    .join('');
}

export function randomString(length: number = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function equalsIgnoreCase(a: string, b: string): boolean {
  return a.localeCompare(b, undefined, { sensitivity: 'accent' }) === 0;
}
