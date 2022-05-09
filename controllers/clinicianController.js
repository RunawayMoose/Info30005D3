const Patient = require("../models/patient");
const Clinician = require("../models/clinician");
const moment = require("moment");

exports.home_GET = async function (req, res) {
  res.render("clinician_home", {
    username: req.user.username,
  });
};

exports.registerPatient_GET = async function (req, res) {
  res.render("clinician_register_patient");
};

exports.registerPatient_POST = function (req, res) {
  Patient.create(
    {
      username: req.body.username,
      password: req.body.password,
      givenName: req.body.givenName,
      familyName: req.body.familyName,
      screenName: req.body.screenName,
      yearOfBirth: req.body.yearOfBirth,
      bio: req.body.bio,
      role: "Patient",
    },
    (err, newPatient) => {
      if (err) {
        console.error(err);
      }

      // Save the patient _id to the clinician
      const patientID = newPatient._id;
      const clinicianID = req.user._id;
      const currentPatients = req.user.patients;

      Clinician.updateOne(
        { _id: clinicianID },
        { patients: [...currentPatients, patientID] }
      ).then(() => res.redirect("/clinician/home"));
    }
  );
};
