const passport = require("passport");
const express = require("express");
const router = express.Router();

const patientController = require("../controllers/patientController");
const authMiddleware = require("../middleware/patient");

// Root Route
router.get("/", (req, res) => {
  res.redirect("/patient/login");
});

// Authentication Routes
router.get("/login", (req, res) => {
  res.render("patient_login", { flash: req.flash("error") });
});

router.post(
  "/login",
  passport.authenticate("patient-local", {
    successRedirect: "/patient/home",
    failureRedirect: "/patient",
    failureFlash: true,
  })
);

router.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/patient");
});

// Regular Routes
router.get("/home", authMiddleware, patientController.home_GET);
router.post("/home", authMiddleware, patientController.home_POST);
router.post(
  "/home/changePassword",
  authMiddleware,
  patientController.changePassword
);

module.exports = router;
