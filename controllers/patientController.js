const Patient = require("../models/patient");
const sameDay = require("../util/dateUtil").sameDay;
const validateAllFields = require("../util/validation");

exports.home_GET = async function (req, res) {
  const errorMessage = req.query.error;
  const patient = await Patient.findOne({ username: req.user.username }).lean();

  const todaysRecord =
    (await patient.records.find((record) => {
      return sameDay(new Date(record.date), new Date());
    })) || {};

  const glucoseDoesNotExist =
    !("glucose" in todaysRecord) || todaysRecord.glucose == null;
  const weightDoesNotExist =
    !("weight" in todaysRecord) || todaysRecord.weight == null;
  const insulinDoesNotExist =
    !("insulin" in todaysRecord) || todaysRecord.insulin == null;
  const exerciseDoesNotExist =
    !("exercise" in todaysRecord) || todaysRecord.exercise == null;

  const shouldRecordGlucose = patient.shouldRecordGlucose;
  const shouldRecordWeight = patient.shouldRecordWeight;
  const shouldRecordInsulin = patient.shouldRecordInsulin;
  const shouldRecordExercise = patient.shouldRecordExercise;

  const displayGlucose = glucoseDoesNotExist && shouldRecordGlucose;
  const displayWeight = weightDoesNotExist && shouldRecordWeight;
  const displayInsulin = insulinDoesNotExist && shouldRecordInsulin;
  const displayExercise = exerciseDoesNotExist && shouldRecordExercise;

  const formMessage =
    !displayGlucose && !displayWeight && !displayInsulin && !displayExercise
      ? "All your required data has been inputted for today"
      : "";

  res.render("patient_home", {
    ...patient,
    formMessage,
    displayGlucose,
    displayWeight,
    displayInsulin,
    displayExercise,
    errorMessage,
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

  const validation = validateAllFields(
    ["glucose", "weight", "insulin", "exercise"],
    newRecord,
    oldPatient
  );

  if (!validation.valid) {
    const { field, lowerLimit, upperLimit } = validation;
    const errorMessage = `Error: ${field} should be within ${lowerLimit} and ${upperLimit}.`;

    res.redirect(`/patient/home?error=${errorMessage}`);
    return false;
  }

  const todaysRecord = oldPatientRecords.find((record) =>
    sameDay(new Date(record.date), new Date())
  );

  let newPatient;

  if (todaysRecord) {
    console.log("found todays record");
    const modifiedRecord = {
      date: todaysRecord.date,
      glucose: todaysRecord.glucose ? todaysRecord.glucose : newRecord.glucose,
      weight: todaysRecord.weight ? todaysRecord.weight : newRecord.weight,
      insulin: todaysRecord.insulin ? todaysRecord.insulin : newRecord.insulin,
      exercise: todaysRecord.exercise
        ? todaysRecord.exercise
        : newRecord.exercise,
    };

    const patientRecordsWithoutTodays = oldPatientRecords.filter(
      (record) => !sameDay(new Date(record.date), new Date())
    );

    newPatient = await Patient.findOneAndUpdate(
      { username: req.user.username },
      { records: [...patientRecordsWithoutTodays, modifiedRecord] },
      { new: true }
    ).lean();
  } else {
    console.log("did not find todays record");

    newPatient = await Patient.findOneAndUpdate(
      { username: req.user.username },
      { records: [...oldPatientRecords, newRecord] },
      { new: true }
    ).lean();
  }

  res.redirect("/patient/home");
};
