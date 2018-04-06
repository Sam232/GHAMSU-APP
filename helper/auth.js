module.exports = {
  ensureAdminAuthentication: (req, res, next) => {
    if(req.isAuthenticated()){
      return next();
    }
    req.flash("error_msg", "Not Authorised");
    res.redirect("/admin/");
  },
  ensureSubAdminAuthentication: (req, res, next) => {
    if(req.isAuthenticated()){
      return next();
    }
    req.flash("error_msg", "Not Authorised");
    res.redirect("/subadmin/");
  }
}