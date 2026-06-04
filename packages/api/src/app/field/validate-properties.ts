import type { FieldType } from './field-type';

export function validateProperties(
  type: FieldType,
  properties: unknown,
): string | null {
  if (properties === null || properties === undefined) {
    if (type === 'select' || type === 'radio') {
      return `${type} requires properties with a non-empty "values" array`;
    }
    return null;
  }

  if (typeof properties !== 'object' || Array.isArray(properties)) {
    return 'properties must be an object or null';
  }

  const props = properties as Record<string, unknown>;

  switch (type) {
    case 'text-field':
      return validateOptionalNonNegInt(props, 'min_length') ??
        validateOptionalNonNegInt(props, 'max_length');
    case 'text-area':
      return validateOptionalPositiveInt(props, 'rows');
    case 'number':
      return validateOptionalNonNegInt(props, 'precision') ??
        validateOptionalNonNegInt(props, 'scale');
    case 'select':
    case 'radio':
      return validateValuesArray(props);
    case 'checkbox':
      return validateOptionalString(props, 'label');
    case 'date':
    case 'datetime':
      return validateOptionalString(props, 'format');
    case 'file':
      return validateTypesArray(props);
    default:
      return null;
  }
}

function validateOptionalNonNegInt(
  props: Record<string, unknown>,
  key: string,
): string | null {
  if (!(key in props)) return null;
  const val = props[key];
  if (typeof val !== 'number' || !Number.isInteger(val) || val < 0) {
    return `${key} must be a non-negative integer`;
  }
  return null;
}

function validateOptionalPositiveInt(
  props: Record<string, unknown>,
  key: string,
): string | null {
  if (!(key in props)) return null;
  const val = props[key];
  if (typeof val !== 'number' || !Number.isInteger(val) || val < 1) {
    return `${key} must be a positive integer`;
  }
  return null;
}

function validateOptionalString(
  props: Record<string, unknown>,
  key: string,
): string | null {
  if (!(key in props)) return null;
  if (typeof props[key] !== 'string') {
    return `${key} must be a string`;
  }
  return null;
}

function validateValuesArray(props: Record<string, unknown>): string | null {
  if (!('values' in props)) {
    return 'properties must contain a "values" array';
  }
  const values = props['values'];
  if (!Array.isArray(values) || values.length === 0) {
    return '"values" must be a non-empty array';
  }
  for (let i = 0; i < values.length; i++) {
    const item = values[i];
    if (
      typeof item !== 'object' ||
      item === null ||
      typeof item.label !== 'string' ||
      typeof item.value !== 'string'
    ) {
      return `values[${i}] must be an object with "label" and "value" strings`;
    }
  }
  return null;
}

function validateTypesArray(props: Record<string, unknown>): string | null {
  if (!('types' in props)) return null;
  const types = props['types'];
  if (!Array.isArray(types)) {
    return '"types" must be an array of strings';
  }
  for (let i = 0; i < types.length; i++) {
    if (typeof types[i] !== 'string' || types[i].length === 0) {
      return `types[${i}] must be a non-empty string`;
    }
  }
  return null;
}
