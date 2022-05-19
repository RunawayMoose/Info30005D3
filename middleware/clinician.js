// Middleware for clinician authenticated routes
module.exports = function clinicianAuthMiddleware(req, res, next) {
  if (!req.isAuthenticated() || !("user" in req)) {
    res.redirect("/clinician");
  }

  next();
};
