const mongoose = require("mongoose");

const {Admin} = require("../models/Admin");
const {SubAdmin} = require("../models/SubAdmin");

module.exports = {
  ensureAdminAuthentication: (req, res, next) => {
    if(req.isAuthenticated()){
      Admin.findById(res.locals.mainAdmin._id).then((mainAdmin) => {
        if(mainAdmin){
          return next();
        }
        req.flash("error_msg", "Not Authorised");
        res.redirect("/admin/");
      })
      .catch((err) => {
        if(err){
          console.log("Unable To Fetch Admin\'s Details");
        }
      });
      return next();
    }
    req.flash("error_msg", "Not Authorised");
    res.redirect("/admin/");
  },
  ensureSubAdminAuthentication: (req, res, next) => {
    if(req.isAuthenticated()){
      SubAdmin.findById(res.locals.subAdmin._id).then((subAdmin) => {
        if(subAdmin){
          return next();
        }
        req.flash("error_msg", "Not Authorised");
        res.redirect("/subadmin/");
      })
      .catch((err) => {
        if(err){
          console.log("Unable To Fetch SubAdmin\'s Details");
        }
      });
      return next();
    }
    req.flash("error_msg", "Not Authorised");
    res.redirect("/subadmin/");
  }
}