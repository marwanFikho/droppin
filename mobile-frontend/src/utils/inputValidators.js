// Name: only letters and spaces
export function validateName(name) {
  return /^[A-Za-z\u0600-\u06FF ]+$/.test(name);
}

// Phone: Egyptian mobile format 01xxxxxxxxx
export function validatePhone(phone) {
  return /^01\d{9}$/.test(phone);
}

// Sanitize name input (remove numbers/special chars)
export function sanitizeNameInput(value) {
  return value.replace(/[^A-Za-z\u0600-\u06FF ]/g, '');
} 