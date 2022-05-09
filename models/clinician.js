const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Clinician = new Schema(
  {
    username: { type: String, required: true },
    password: { type: String, required: true },
    patients: { type: [Schema.Types.ObjectId], required: true },
    role: { type: String, required: true },
  },
  { timestamps: true }
);

Clinician.methods.verifyPassword = function (password, callback) {
  bcrypt.compare(password, this.password, (err, valid) => {
    callback(err, valid);
  });
};

// Hash password before saving
Clinician.pre("save", function save(next) {
  const user = this;
  // Go to next if password field has not been modified
  if (!user.isModified("password")) {
    return next();
  }
  // Automatically generate salt, and calculate hash
  bcrypt.hash(user.password, process.env.CLINICIAN_SALT, (err, hash) => {
    if (err) {
      return next(err);
    }
    // Replace password with hash
    user.password = hash;
    next();
  });
});

module.exports = mongoose.model("Clinician", Clinician);
