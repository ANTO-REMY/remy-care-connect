import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalize phone number from 07xxxxxxxx to +254xxxxxxxx format.
 */
export function normalizePhoneNumber(phone: string): string {
  const cleaned = phone.replace(/[^0-9]/g, "");

  if (cleaned.startsWith("07") && cleaned.length === 10) {
    return `+254${cleaned.substring(1)}`;
  }

  return phone;
}

/**
 * Validate Kenyan phone number in 07xxxxxxxx format.
 */
export function validatePhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/[^0-9]/g, "");
  return /^07[0-9]{8}$/.test(cleaned);
}

export function formatKenyanPhoneInput(phone: string): string {
  const digits = phone.replace(/\D/g, "").slice(0, 10);

  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
}

export function countDigits(value: string): number {
  return value.replace(/\D/g, "").length;
}

export function getCursorFromDigitIndex(formattedValue: string, digitIndex: number): number {
  if (digitIndex <= 0) return 0;

  let digitsSeen = 0;
  for (let index = 0; index < formattedValue.length; index += 1) {
    if (/\d/.test(formattedValue[index])) {
      digitsSeen += 1;
    }

    if (digitsSeen >= digitIndex) {
      return index + 1;
    }
  }

  return formattedValue.length;
}
