// Middleware for clinician authenticated routes
module.exports = function clinicianAuthMiddleware(req, res, next) {
  if (!req.isAuthenticated() || !("user" in req)) {
    console.info("redirecting unauthenticated clinician");
    res.redirect("/clinician");
  }

  next();
};
