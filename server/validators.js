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

export function normalizePrice(value, field = "price") {
  if (typeof value === "number") return requireInteger(value, field);
  if (typeof value !== "string") {
    const error = new Error(`${field} must be an integer or range like 200-700`);
    error.status = 400;
    throw error;
  }

  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) return requireInteger(trimmed, field);
  const range = trimmed.match(/^(\d+)\s*[-–]\s*(\d+)$/);
  if (range) {
    const min = requireInteger(range[1], field);
    const max = requireInteger(range[2], field);
    if (min > max) {
      const error = new Error(`${field} range must start with the lower price`);
      error.status = 400;
      throw error;
    }
    return `${min}-${max}`;
  }

  const error = new Error(`${field} must be an integer or range like 200-700`);
  error.status = 400;
  throw error;
}

export function normalizeStringList(value, field) {
  if (Array.isArray(value)) return value.map((item) => requireString(item, field));
  if (typeof value === "string") {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [];
}
