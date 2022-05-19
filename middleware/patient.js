// Middleware for patient authenticated routes
module.exports = function patientAuthMiddleware(req, res, next) {
  if (!req.isAuthenticated() || !("user" in req)) {
    res.redirect("/patient");
  }

  next();
};
