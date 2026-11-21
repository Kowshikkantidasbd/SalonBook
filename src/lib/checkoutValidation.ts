export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'discover' | 'unknown';

export interface CheckoutPaymentFormValues {
  email: string;
  cardNumber: string;
  expiry: string;
  cvc: string;
  cardholderName: string;
  country: string;
  postalCode: string;
}

export type CheckoutFieldErrors = Partial<Record<keyof CheckoutPaymentFormValues, string>>;

export function stripNonDigits(raw: string): string {
  return raw.replace(/\D+/g, '');
}

export function detectCardBrand(rawNumber: string): CardBrand {
  const digits = stripNonDigits(rawNumber);
  if (!digits) return 'unknown';
  if (digits.startsWith('4')) return 'visa';
  if (/^3[47]/.test(digits)) return 'amex';
  if (/^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[01]|2720)/.test(digits)) return 'mastercard';
  if (/^(6011|65|64[4-9])/.test(digits)) return 'discover';
  return 'unknown';
}

export function formatCardNumber(raw: string): string {
  const digits = stripNonDigits(raw);
  const brand = detectCardBrand(digits);
  if (brand === 'amex') {
    const trimmed = digits.slice(0, 15);
    const parts = [trimmed.slice(0, 4), trimmed.slice(4, 10), trimmed.slice(10, 15)].filter(Boolean);
    return parts.join(' ');
  }
  const trimmed = digits.slice(0, 16);
  return trimmed.replace(/(\d{4})(?=\d)/g, '$1 ');
}

export function formatCardExpiry(raw: string): string {
  const digits = stripNonDigits(raw).slice(0, 4);
  if (digits.length === 0) return '';
  if (digits.length === 1 && Number(digits) > 1) {
    return `0${digits} / `;
  }
  if (digits.length <= 2) {
    return digits;
  }
  return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
}

export function formatCardCvc(raw: string, brand: CardBrand = 'unknown'): string {
  const maxLen = brand === 'amex' ? 4 : 3;
  return stripNonDigits(raw).slice(0, maxLen);
}

export function passesLuhnCheck(rawNumber: string): boolean {
  const digits = stripNonDigits(rawNumber);
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = Number(digits[i]);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

export function isDeclinedTestCard(rawNumber: string): boolean {
  const digits = stripNonDigits(rawNumber);
  return digits === '4000000000000002' || digits === '4000000000000341';
}

export function validateCheckoutPaymentForm(
  values: CheckoutPaymentFormValues,
  nowDate: Date = new Date()
): { valid: boolean; errors: CheckoutFieldErrors } {
  const errors: CheckoutFieldErrors = {};

  const email = values.email.trim();
  if (!email) {
    errors.email = 'Please enter your email address.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Please enter a valid email address.';
  }

  const cardDigits = stripNonDigits(values.cardNumber);
  const brand = detectCardBrand(cardDigits);
  const expectedLength = brand === 'amex' ? 15 : 16;
  if (!cardDigits) {
    errors.cardNumber = 'Please enter your card number.';
  } else if (cardDigits.length < expectedLength || !passesLuhnCheck(cardDigits)) {
    errors.cardNumber = 'Your card number is incomplete or invalid.';
  }

  const expDigits = stripNonDigits(values.expiry);
  if (!expDigits) {
    errors.expiry = 'Enter expiration date.';
  } else if (expDigits.length !== 4) {
    errors.expiry = 'Use MM / YY format.';
  } else {
    const month = Number(expDigits.slice(0, 2));
    const year = 2000 + Number(expDigits.slice(2, 4));
    const currentYear = nowDate.getFullYear();
    const currentMonth = nowDate.getMonth() + 1;
    if (month < 1 || month > 12) {
      errors.expiry = 'Invalid expiration month.';
    } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
      errors.expiry = 'Your card has expired.';
    }
  }

  const cvcDigits = stripNonDigits(values.cvc);
  const requiredCvc = brand === 'amex' ? 4 : 3;
  if (!cvcDigits) {
    errors.cvc = 'Enter CVC.';
  } else if (cvcDigits.length < requiredCvc) {
    errors.cvc = `Enter ${requiredCvc}-digit security code.`;
  }

  if (!values.cardholderName.trim() || values.cardholderName.trim().length < 2) {
    errors.cardholderName = 'Please enter the full name on the card.';
  }

  if (!values.country.trim()) {
    errors.country = 'Please select your country or region.';
  }

  if (!values.postalCode.trim() || values.postalCode.trim().length < 3) {
    errors.postalCode = 'Please enter a valid ZIP or postal code.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
