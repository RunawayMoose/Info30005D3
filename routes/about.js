const express = require("express");
const router = express.Router();

// Root Route
router.get("/", (req, res) => {
  res.redirect("/about_diabetes");
});

router.get("/about_diabetes", (req, res) => {
  res.render("about_diabetes");
});

router.get("/about_website", (req, res) => {
  res.render("about_website");
});

module.exports = router;
