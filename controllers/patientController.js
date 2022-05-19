const { registerDecorator } = require("handlebars");
const Patient = require("../models/patient");
const sameDay = require("../util/dateUtil").sameDay;
const validateAllFields = require("../util/validation").validateAllFields;
const reasonableValues = require("../util/validation").reasonableValues;
const validateUserBounds = require("../util/validation").validateUserBounds;

exports.home_GET = async function (req, res) {
  const errorMessage = req.query.error;
  const username = req.user.username;
  const patient = await Patient.findOne({ username }).lean();

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

  const engagementRate = await calculateEngagementRate(username);

  const allPatients = await Patient.find();
  const allPromises = allPatients.map((patient) =>
    calculateEngagementRate(patient.username).then((rate) => ({
      engagementRate: rate.toFixed(2),
      screenName: patient.screenName,
    }))
  );

  const rowsWithoutRanks = await Promise.all(allPromises);
  const leaderboard = rowsWithoutRanks
    .filter((row) => !isNaN(row.engagementRate))
    .sort((a, b) => b.engagementRate - a.engagementRate)
    .map((element, index) => ({
      ...element,
      rank: index + 1,
    }))
    .slice(0, 5);

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

      // validate input is within user-set bounds
      const validation = validateUserBounds(
        ["glucose", "weight", "insulin", "exercise"],
        record,
        patient
      );

      return {
        ...record,
        date: oldDate?.toLocaleDateString("en-AU"),
        insideSafetyThreshold: validation,
      };
    }),

    validation: reasonableValues,
    showEngagementBadge: engagementRate > 80,
    leaderboard,
  });
};

// add a new health record
exports.home_POST = async function (req, res) {
  const patientJSON = await Patient.findOne({
    username: req.user.username,
  }).lean();

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

    recordGlucose: patientJSON.shouldRecordGlucose,
    recordWeight: patientJSON.shouldRecordWeight,
    recordInsulin: patientJSON.shouldRecordInsulin,
    recordExercise: patientJSON.shouldRecordExercise,
  };

  // validate input is within reasonable bounds
  const validation = validateAllFields(
    ["glucose", "weight", "insulin", "exercise"],
    newRecord,
    reasonableValues
  );

  if (!validation.valid) {
    const { field, lowerLimit, upperLimit } = validation;
    const errorMessage = `Error: ${field} should be within ${lowerLimit} and ${upperLimit}.`;

    res.redirect(`/patient/home?error=${errorMessage}`);
    return false;
  }

  const patientRecords = patientJSON.records;

  const todaysRecord = patientRecords.find((record) =>
    sameDay(new Date(record.date), new Date())
  );

  if (todaysRecord) {
    const modifiedRecord = {
      date: todaysRecord.date,
      glucose: todaysRecord.glucose ? todaysRecord.glucose : newRecord.glucose,
      weight: todaysRecord.weight ? todaysRecord.weight : newRecord.weight,
      insulin: todaysRecord.insulin ? todaysRecord.insulin : newRecord.insulin,
      exercise: todaysRecord.exercise
        ? todaysRecord.exercise
        : newRecord.exercise,

      recordGlucose: patientJSON.shouldRecordGlucose,
      recordWeight: patientJSON.shouldRecordWeight,
      recordInsulin: patientJSON.shouldRecordInsulin,
      recordExercise: patientJSON.shouldRecordExercise,
    };

    const patientRecordsWithoutTodays = patientRecords.filter(
      (record) => !sameDay(new Date(record.date), new Date())
    );

    newPatient = await Patient.findOneAndUpdate(
      { username: req.user.username },
      { records: [...patientRecordsWithoutTodays, modifiedRecord] },
      { new: true }
    ).lean();
  } else {
    newPatient = await Patient.findOneAndUpdate(
      { username: req.user.username },
      { records: [...patientRecords, newRecord] },
      { new: true }
    ).lean();
  }

  res.redirect("/patient/home");
};

// change patient password
exports.changePassword = async function (req, res) {
  const patient = await Patient.findOne({ username: req.user.username });
  const newPassword = req.body.newPassword;

  patient.password = newPassword;

  patient.save((err) => {
    if (err) {
      console.error("ERROR CHANGING PASSWORD: ");
      console.error(err);
    }
  });

  res.redirect("/patient/home");
};

async function calculateEngagementRate(username) {
  const patient = await Patient.findOne({ username }).lean();
  const numRecords = patient.records.length;

  const engagementRate =
    patient.records
      .map((record) => {
        // Map each record to a number between 0 and 1
        // indicating what proportion of records were
        // fulfilled that day.

        function capitalize(word) {
          const lower = word.toLowerCase();
          return word.charAt(0).toUpperCase() + lower.slice(1);
        }

        let wereRecordedAndRequested = 0;
        let wereRequested = 0;

        ["glucose", "weight", "insulin", "exercise"].forEach((fieldName) => {
          const shouldRecordIndicator = "record" + capitalize(fieldName);

          if (record[shouldRecordIndicator]) {
            wereRequested += 1;
            if (record[fieldName]) {
              wereRecordedAndRequested += 1;
            }
          }
        });

        return wereRecordedAndRequested / wereRequested;
      })
      .reduce((a, b) => a + b, 0) / numRecords;

  return engagementRate * 100;
}
