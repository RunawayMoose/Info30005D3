const passport = require("passport");
const express = require("express");
const router = express.Router();

const clinicianController = require("../controllers/clinicianController");
const Clinician = require("../models/clinician");
const authMiddleware = require("../middleware/clinician");

// Root Route
router.get("/", (req, res) => {
  res.redirect("/clinician/login");
});

// Authentication Routes
router.get("/login", (req, res) => {
  res.render("clinician_login", { flash: req.flash("error") });
});

router.post(
  "/login",
  passport.authenticate("clinician-local", {
    successRedirect: "/clinician/home",
    failureRedirect: "/clinician",
    failureFlash: true,
  })
);

router.get("/register", (req, res) => {
  res.render("clinician_register");
});

router.post("/register", function (req, res) {
  const newClinician = new Clinician({
    username: req.body.username,
    password: req.body.password,
    patients: [],
    role: "Clinician",
  });

  newClinician.save((err) => {
    if (err) {
      console.error(err);
    }

    // The new clinician has been saved
    res.redirect("/clinician/login");
  });
});

router.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/clinician");
});

// Regular Routes
router.get("/home", authMiddleware, clinicianController.home_GET);

router.get(
  "/register_patient",
  authMiddleware,
  clinicianController.registerPatient_GET
);

router.post(
  "/register_patient",
  authMiddleware,
  clinicianController.registerPatient_POST
);

router.get(
  "/patient/:patientID",
  authMiddleware,
  clinicianController.patientView_GET
);

router.post(
  "/patient/:patientID/requiredFields",
  authMiddleware,
  clinicianController.patientView_POST_fields
);

router.post(
  "/patient/:patientID/recordLimits",
  authMiddleware,
  clinicianController.patientView_POST_limits
);

router.post(
  "/patient/:patientID/requiredFields",
  authMiddleware,
  clinicianController.patientView_POST_fields
);

router.post(
  "/patient/:patientID/supportMessage",
  authMiddleware,
  clinicianController.patientView_POST_supportMessage
);

module.exports = router;
