const Patient = require("../models/patient");
const Clinician = require("../models/clinician");

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
    supportMessage: patient.supportMessage,
    mostRecentRecord: patient.records
      .sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
      })
      .map((record) => ({
        date: new Date(record.date).toLocaleDateString("en-AU"),
        glucose: record.glucose ?? "Not Recorded",
        glucoseComment: record.glucoseComment,
        weight: record.weight ?? "Not Recorded",
        weightComment: record.weightComment,
        insulin: record.insulin ?? "Not Recorded",
        insulinComment: record.insulinComment,
        exercise: record.exercise ?? "Not Recorded",
        exerciseComment: record.exerciseComment,
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

      shouldRecordGlucose: true,
      shouldRecordWeight: true,
      shouldRecordInsulin: true,
      shouldRecordExercise: true,
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

  res.render("clinician_patient_view", {
    patientID,
    name: `${patientData.givenName} ${patientData.familyName}`,
    yearOfBirth: new Date(patientData.yearOfBirth).toLocaleDateString("en-AU"),
    bio: patientData.bio,
    records: patientData.records.map((record) => {
      const oldDate = record.date;

      return {
        date: oldDate?.toLocaleDateString("en-AU"),
        glucose: record.glucose ?? "Not Recorded",
        glucoseComment: record.glucoseComment,
        weight: record.weight ?? "Not Recorded",
        weightComment: record.weightComment,
        insulin: record.insulin ?? "Not Recorded",
        insulinComment: record.insulinComment,
        exercise: record.exercise ?? "Not Recorded",
        exerciseComment: record.exerciseComment,
      };
    }),
    clinicalNotes:
      patientData.clinicalNotes &&
      patientData.clinicalNotes
        .sort((a, b) => {
          return new Date(b.createdAt) - new Date(a.createdAt);
        })
        .map((note) => {
          return {
            date: new Date(note.createdAt).toLocaleString("en-AU"),
            message: note.message,
          };
        }),
  });
};

exports.patientView_POST_fields = async function (req, res) {
  const patientID = req.params.patientID;

  const recordGlucose = req.body.glucose == "on";
  const recordWeight = req.body.weight == "on";
  const recordInsulin = req.body.insulin == "on";
  const recordExercise = req.body.exercise == "on";

  await Patient.findByIdAndUpdate(patientID, {
    shouldRecordGlucose: recordGlucose,
    shouldRecordWeight: recordWeight,
    shouldRecordInsulin: recordInsulin,
    shouldRecordExercise: recordExercise,
  });

  res.redirect(`/clinician/patient/${patientID}`);
};

exports.patientView_POST_limits = async function (req, res) {
  const patientID = req.params.patientID;

  const glucoseLowerLimit = Number(req.body.glucoseLowerLimit);
  const weightLowerLimit = Number(req.body.weightLowerLimit);
  const insulinLowerLimit = Number(req.body.insulinLowerLimit);
  const exerciseLowerLimit = Number(req.body.exerciseLowerLimit);

  const glucoseUpperLimit = Number(req.body.glucoseUpperLimit);
  const weightUpperLimit = Number(req.body.weightUpperLimit);
  const insulinUpperLimit = Number(req.body.insulinUpperLimit);
  const exerciseUpperLimit = Number(req.body.exerciseUpperLimit);

  await Patient.findByIdAndUpdate(patientID, {
    glucoseLowerLimit,
    weightLowerLimit,
    insulinLowerLimit,
    exerciseLowerLimit,
    glucoseUpperLimit,
    weightUpperLimit,
    insulinUpperLimit,
    exerciseUpperLimit,
  });

  res.redirect(`/clinician/patient/${patientID}`);
};

exports.patientView_POST_supportMessage = async function (req, res) {
  const patientID = req.params.patientID;

  const supportMessage = req.body.supportMessage;

  await Patient.findByIdAndUpdate(patientID, {
    supportMessage,
  });

  res.redirect(`/clinician/patient/${patientID}`);
};

exports.patientView_POST_clinicalNote = async function (req, res) {
  const patientID = req.params.patientID;

  const clinicalNote = req.body.clinicalNote;

  if (!clinicalNote) {
    return;
  }

  Patient.findByIdAndUpdate(
    patientID,
    {
      $push: { clinicalNotes: { message: clinicalNote } },
    },
    {},
    (err) => {
      console.error(err);
    }
  );

  res.redirect(`/clinician/patient/${patientID}`);
};

exports.comments_GET = async function (req, res) {
  const clinician = await Clinician.findOne({
    username: req.user.username,
  }).lean();

  const patientPromises = clinician.patients.map((patientID) =>
    Patient.findById(patientID).exec()
  );

  const patients = await Promise.all(patientPromises);

  const intermediatePatients = patients.map((patient) => ({
    records: patient.records,
    name: `${patient.givenName} ${patient.familyName}`,
    patientURL: `/clinician/patient/${patient._id}`,
  }));

  const comments = intermediatePatients
    .map((intermediatePatient) => {
      return intermediatePatient.records
        .map((record) => {
          let commentArray = [];

          ["glucose", "weight", "insulin", "exercise"].forEach((key) => {
            const commentKey = key + "Comment";
            if (record[commentKey]) {
              commentArray.push({
                name: intermediatePatient.name,
                comment: record[commentKey],
                date: new Date(record.date).toLocaleDateString("en-AU"),
                patientURL: intermediatePatient.patientURL,
              });
            }
          });

          return commentArray;
        })
        .filter((commentArr) => commentArr.length > 0)
        .flat();
    })
    .flat();

  res.render("clinician_comments", {
    rows: comments,
  });
};
