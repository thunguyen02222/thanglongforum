import { ObjectId } from 'mongodb';
import { toFixedNumber2 } from './number';

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function removeVietnameseTones(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

export const checkLengthTrimString = (str: string): string | null => {
  if (!str) return null;
  if (str?.length && str?.trim()) {
    return str.trim();
  }
  return null;
};

export const getPersonName = (member: any): string => {
  if (!member) return 'N/A';
  const memberName =
    checkLengthTrimString(member.name) ||
    checkLengthTrimString(member.username) ||
    'N/A';
  return memberName;
};

export const getNameOrUsernameOrEmail = (member: any): string => {
  if (!member) return 'N/A';

  const name = checkLengthTrimString(member.name);
  const username = checkLengthTrimString(member.username);
  const email = checkLengthTrimString(member.email);

  return name || username || email || 'N/A';
};

export const uniqByObjectId = (ids: ObjectId[]): ObjectId[] => {
  const seen = new Set<string>();
  return ids.filter((id) => {
    if (!id) return false;
    const key = id.toString();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const validText = (text: string): string | null => {
  if (!text) return null;
  const cleanText = text.replace(
    /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,
    ''
  );
  if (!cleanText) return null;

  const isOnlySpecialChars = (textMessage: string) =>
    !/[a-zA-Z0-9À-ỹ]/.test(textMessage.trim());
  const isOnlyDigits = (textMessage: string) =>
    /^\d+$/.test(textMessage.trim());

  if (isOnlySpecialChars(cleanText) || isOnlyDigits(cleanText)) return null;
  return cleanText;
};

const getByteSize = (str: string): number =>
  new TextEncoder().encode(str).length;

export const getObjectSizeInKb = (obj: any): number => {
  const jsonString = JSON.stringify(obj);
  const bytes = getByteSize(jsonString);
  return toFixedNumber2(bytes / 1024);
};

export const limitText = (text: string, limit = 20): string => {
  if (typeof text !== 'string') return '';
  return text.length > limit ? text.slice(0, limit) : text;
};

export const safeParseJSON = <T = any>(jsonString: string): T | null => {
  try {
    return JSON.parse(jsonString);
  } catch {
    return null;
  }
};
