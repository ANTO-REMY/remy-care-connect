import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalize phone number from 07xxxxxxxx to +254xxxxxxxx format
 * Only accepts: 07xxxxxxxx
 * Returns: +254xxxxxxxx
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove all spaces and special characters
  const cleaned = phone.replace(/[^0-9]/g, '');
  
  // Only handle 07xxxxxxxx format
  if (cleaned.startsWith('07') && cleaned.length === 10) {
    // Convert 07xxxxxxxx to +254xxxxxxxx
    return '+254' + cleaned.substring(1);
  }
  
  // Return as-is if not in expected format (will fail validation)
  return phone;
}

/**
 * Validate Kenyan phone number in 07xxxxxxxx format
 */
export function validatePhoneNumber(phone: string): boolean {
  console.log('🔍 validatePhoneNumber input:', phone);
  console.log('🔍 phone type:', typeof phone);
  console.log('🔍 phone length:', phone?.length);
  
  // Remove all spaces and special characters
  const cleaned = phone.replace(/[^0-9]/g, '');
  console.log('🔍 cleaned phone:', cleaned);
  console.log('🔍 cleaned length:', cleaned.length);
  
  // Check if it's exactly 07 followed by 8 digits
  const pattern = /^07[0-9]{8}$/;
  const isValid = pattern.test(cleaned);
  console.log('🔍 validation result:', isValid);
  
  return isValid;
}
