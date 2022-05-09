// Middleware for patient authenticated routes
module.exports = function patientAuthMiddleware(req, res, next) {
  if (!req.isAuthenticated() || !("user" in req)) {
    console.info("redirecting unauthenticated patient");
    res.redirect("/patient");
  }

  next();
};
