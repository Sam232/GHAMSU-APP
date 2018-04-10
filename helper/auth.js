const mongoose = require("mongoose");

const {Admin} = require("../models/Admin");
const {SubAdmin} = require("../models/SubAdmin");

module.exports = {
  ensureAdminAuthentication: (req, res, next) => {
    if(!req.isAuthenticated()){
      req.flash("error_msg", "Not Authorised");
      return res.redirect("/admin/");
    }
    if(res.locals.mainAdmin === false){
      req.flash("error_msg", "Not Authorised");
      return res.redirect("/admin/"); 
    }
    Admin.findById(res.locals.mainAdmin._id || null).then((mainAdmin) => {
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
  },
  ensureSubAdminAuthentication: (req, res, next) => {
    if(!req.isAuthenticated()){
      req.flash("error_msg", "Not Authorised");
      return res.redirect("/subadmin/");      
    }
    if(res.locals.subAdmin === false){
      req.flash("error_msg", "Not Authorised");
      return res.redirect("/subadmin/");
    }
    SubAdmin.findById(res.locals.subAdmin._id || null).then((subAdmin) => {
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
  }
}