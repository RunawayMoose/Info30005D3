// for server side validation
function validateField(value, lowerLimit, upperLimit) {
  if (!value) return true;

  if (value < lowerLimit || value > upperLimit) {
    return false;
  }

  return true;
}

function validateAllFields(fields, record, limits) {
  for (let i = 0; i < fields.length; i++) {
    let field = fields[i];
    const lowerLimit = limits[field + "LowerLimit"];
    const upperLimit = limits[field + "UpperLimit"];
    const value = record[field];

    if (!validateField(value, lowerLimit, upperLimit)) {
      return {
        valid: false,
        field,
        lowerLimit,
        upperLimit,
      };
    }
  }

  return { valid: true };
}

module.exports = validateAllFields;
