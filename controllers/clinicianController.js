const Patient = require("../models/patient");
const Clinician = require("../models/clinician");
const moment = require("moment");
const patient = require("../models/patient");

exports.home_GET = async function (req, res) {
  const clinicianData = await Clinician.findOne({
    username: req.user.username,
  }).lean();

  const patientPromises = clinicianData.patients.map((patientID) =>
    Patient.findById(patientID)
  );
  const patientData = await Promise.all(patientPromises);

  const patientDataTransformed = patientData.map((patient) => ({
    patientURL: `patient/${patient._id}`,
    name: `${patient.givenName} ${patient.familyName}`,
    mostRecentRecord: patient.records
      .sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
      })
      .map((patient) => ({
        date: new Date(patient.date).toLocaleDateString("en-AU"),
        glucose: patient.glucose ?? "Not Recorded",
        weight: patient.weight ?? "Not Recorded",
        insulin: patient.insulin ?? "Not Recorded",
        exercise: patient.exercise ?? "Not Recorded",
      }))[0],
  }));

  res.render("clinician_home", {
    username: req.user.username,
    patients: patientDataTransformed,
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

exports.patientView_GET = async function (req, res) {
  const patientID = req.params.patientID;
  const patientData = await Patient.findById(patientID);

  console.log(patientData);

  res.render("clinician_patient_view", {
    name: `${patientData.givenName} ${patientData.familyName}`,
    yearOfBirth: new Date(patientData.yearOfBirth).toLocaleDateString("en-AU"),
    bio: patientData.bio,
    records: patientData.records.map((record) => {
      const oldDate = record.date;

      return { ...record, date: oldDate?.toLocaleDateString("en-AU") };
    }),
  });
};
