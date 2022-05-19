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

function validateUserBounds(fields, record, limits) {
  let results = {};

  for (let i = 0; i < fields.length; i++) {
    let field = fields[i];
    const lowerLimit = limits[field + "LowerLimit"];
    const upperLimit = limits[field + "UpperLimit"];
    const value = record[field];

    if (!validateField(value, lowerLimit, upperLimit)) {
      results[field] = false;
    } else {
      results[field] = true;
    }
  }

  return results;
}

const reasonableValues = {
  glucoseLowerLimit: 0,
  glucoseUpperLimit: 10,

  weightLowerLimit: 30,
  weightUpperLimit: 300,

  insulinLowerLimit: 0,
  insulinUpperLimit: 20,

  exerciseLowerLimit: 0,
  exerciseUpperLimit: 100000,
};

module.exports = {
  validateAllFields,
  reasonableValues,
  validateUserBounds,
};
