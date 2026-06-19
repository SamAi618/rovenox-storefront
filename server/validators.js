export function requireString(value, field) {
  if (typeof value !== "string" || !value.trim()) {
    const error = new Error(`${field} is required`);
    error.status = 400;
    throw error;
  }
  return value.trim();
}

export function requireInteger(value, field) {
  const number = Number(value);
  if (!Number.isInteger(number)) {
    const error = new Error(`${field} must be an integer`);
    error.status = 400;
    throw error;
  }
  return number;
}

export function normalizeStringList(value, field) {
  if (Array.isArray(value)) return value.map((item) => requireString(item, field));
  if (typeof value === "string") {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [];
}
