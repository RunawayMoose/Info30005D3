const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ClinicalNote = new Schema(
  {
    message: { type: String, required: true },
  },
  { timestamps: true }
);

const Patient = new Schema(
  {
    username: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, required: true },

    givenName: { type: String, required: true },
    familyName: { type: String, required: true },
    screenName: { type: String, required: true },
    yearOfBirth: { type: Date, required: true },
    bio: { type: String, required: true },

    shouldRecordGlucose: { type: Boolean, required: true },
    shouldRecordWeight: { type: Boolean, required: true },
    shouldRecordInsulin: { type: Boolean, required: true },
    shouldRecordExercise: { type: Boolean, required: true },

    // Limits
    glucoseLowerLimit: { type: Number, required: false },
    weightLowerLimit: { type: Number, required: false },
    insulinLowerLimit: { type: Number, required: false },
    exerciseLowerLimit: { type: Number, required: false },

    glucoseUpperLimit: { type: Number, required: false },
    weightUpperLimit: { type: Number, required: false },
    insulinUpperLimit: { type: Number, required: false },
    exerciseUpperLimit: { type: Number, required: false },

    records: [
      {
        date: { type: Date, required: true },

        glucose: { type: Number, required: false },
        glucoseComment: { type: String, required: false },
        weight: { type: Number, required: false },
        weightComment: { type: String, required: false },
        insulin: { type: Number, required: false },
        insulinComment: { type: String, required: false },
        exercise: { type: Number, required: false },
        exerciseComment: { type: String, required: false },

        recordGlucose: { type: Boolean, required: true },
        recordWeight: { type: Boolean, required: true },
        recordInsulin: { type: Boolean, required: true },
        recordExercise: { type: Boolean, required: true },
      },
    ],

    supportMessage: { type: String, required: false },
    clinicalNotes: [ClinicalNote],
  },
  { timestamps: true }
);

Patient.methods.verifyPassword = function (password, callback) {
  bcrypt.compare(password, this.password, (err, valid) => {
    callback(err, valid);
  });
};

// Hash password before saving
Patient.pre("save", function save(next) {
  const user = this;
  // Go to next if password field has not been modified
  if (!user.isModified("password")) {
    return next();
  }
  // Automatically generate salt, and calculate hash
  bcrypt.hash(user.password, process.env.PATIENT_SALT, (err, hash) => {
    if (err) {
      return next(err);
    }
    // Replace password with hash
    user.password = hash;
    next();
  });
});

module.exports = mongoose.model("Patient", Patient);
