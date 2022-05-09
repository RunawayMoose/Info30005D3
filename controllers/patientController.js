const Patient = require("../models/patient");

exports.home_GET = async function (req, res) {
  let patient = await Patient.findOne({ username: req.user.username }).lean();

  res.render("patient_home", {
    ...patient,
    records: patient.records.map((record) => {
      const oldDate = record.date;

      return { ...record, date: oldDate?.toLocaleDateString("en-AU") };
    }),
  });
};

// add a new health record
exports.home_POST = async function (req, res) {
  const newRecord = {
    date: new Date().toISOString().split("T")[0],
    glucose: req.body.glucose,
    glucoseComment: req.body.glucoseComment,
    weight: req.body.weight,
    weightComment: req.body.weightComment,
    insulin: req.body.insulin,
    insulinComment: req.body.insulinComment,
    exercise: req.body.exercise,
    exerciseComment: req.body.exerciseComment,
  };

  const oldPatient = await Patient.findOne({
    username: req.user.username,
  }).lean();
  const oldPatientRecords = oldPatient.records;

  const newPatient = await Patient.findOneAndUpdate(
    { username: req.user.username },
    { records: [...oldPatientRecords, newRecord] },
    { new: true }
  ).lean();

  res.render("patient_home", {
    ...newPatient,
    records: newPatient.records.map((record) => {
      const oldDate = record.date;

      return { ...record, date: oldDate?.toLocaleDateString("en-AU") };
    }),
  });
};
