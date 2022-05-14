const express = require("express");
const mongoose = require("mongoose");
const handlebars = require("handlebars");
const exphbs = require("express-handlebars");
const {
  allowInsecurePrototypeAccess,
} = require("@handlebars/allow-prototype-access");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");
const path = require("path");
const flash = require("express-flash");

// Routes
const patient = require("./routes/patient");
const clinician = require("./routes/clinician");
const about = require("./routes/about");

// Models
const Patient = require("./models/patient");
const Clinician = require("./models/clinician");

require("dotenv").config();

const app = express();
const port = process.env.PORT || 3002;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

mongoose
  .connect(process.env.DB_CONNECTION_STRING)
  .then(() => console.log("MongoDB Connected..."))
  .catch((err) => console.error(err));

const hbs = exphbs.create({
  defaultLayout: "main",
  extname: ".hbs",
  handlebars: allowInsecurePrototypeAccess(handlebars),
});
app.engine("hbs", hbs.engine);
app.set("view engine", "hbs");
app.set("views", [
  path.join(__dirname, "views/patient"),
  path.join(__dirname, "views/clinician"),
  path.join(__dirname, "views/about"),
]);

app.use(flash());

// Set up passport.js
app.use(
  session({
    secret: "asuhdkuajshdasdasdas",
    resave: true,
    saveUninitialized: true,
    cookie: { maxAge: 60 * 60 * 1000 }, // 1 hour
  })
);

passport.use(
  "patient-local",
  new LocalStrategy((username, password, done) => {
    Patient.findOne({ username }, {}, {}, (err, user) => {
      if (err) {
        return done(undefined, false, {
          message: "Unknown error has occurred",
        });
      }

      if (!user) {
        return done(undefined, false, {
          message: "Incorrect username or password",
        });
      }

      // Check password
      user.verifyPassword(password, (err, valid) => {
        if (err) {
          return done(undefined, false, {
            message: "Unknown error has occurred",
          });
        }

        if (!valid) {
          return done(undefined, false, {
            message: "Incorrect username or password",
          });
        }

        // If user exists and password matches the hash in the database
        return done(undefined, user);
      });
    });
  })
);

passport.use(
  "clinician-local",
  new LocalStrategy((username, password, done) => {
    Clinician.findOne({ username }, {}, {}, (err, user) => {
      if (err) {
        return done(undefined, false, {
          message: "Unknown error has occurred a",
        });
      }

      if (!user) {
        return done(undefined, false, {
          message: "Incorrect username or password",
        });
      }

      // Check password
      user.verifyPassword(password, (err, valid) => {
        if (err) {
          return done(undefined, false, {
            message: `Unknown error has occurred: ${err}`,
          });
        }

        if (!valid) {
          return done(undefined, false, {
            message: "Incorrect username or password",
          });
        }

        // If user exists and password matches the hash in the database
        return done(undefined, user);
      });
    });
  })
);

passport.serializeUser((user, done) => {
  done(undefined, { _id: user.id, role: user.role });
});

passport.deserializeUser((login, done) => {
  if (login.role === "Clinician") {
    Clinician.findById(login, function (err, user) {
      if (user) done(null, user);
      else done(err, { message: "Clinician not found" });
    });
  } else if (login.role === "Patient") {
    Patient.findById(login, (err, admin) => {
      if (admin) done(null, admin);
      else done(err, { message: "Patient not found" });
    });
  } else {
    done({ message: "No entity found (incorrect role)" }, null);
  }
});

app.use(passport.initialize());
app.use(passport.session());

// Use routes
app.use("/patient", patient);
app.use("/clinician", clinician);
app.use("/", about);

app.use(express.static("public"));

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
