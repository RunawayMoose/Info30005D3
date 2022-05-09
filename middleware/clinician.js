// Middleware for clinician authenticated routes
module.exports = function clinicianAuthMiddleware(req, res, next) {
  if (!req.isAuthenticated()) {
    res.redirect("/clinician");
  }

  next();
};
