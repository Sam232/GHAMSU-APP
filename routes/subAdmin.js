const router = require("express").Router();
const passport = require("passport");
const bcrypt = require("bcryptjs");
const {ObjectID} = require("mongodb");
const multer = require("multer"); 
const fs = require("fs");
const path = require("path");

const {SubAdmin} = require("../models/SubAdmin");
const {Members} = require("../models/Members");

const {ensureSubAdminAuthentication} = require("../helper/auth");

var uploadedFile;
var storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, "./public/img/user-images/members-image");
  },
  filename: (req, file, callback) => {
    uploadedFile = file.fieldname + "-" + Date.now() + path.extname(file.originalname);
    callback(null, uploadedFile);
  }
});

router.get("/", (req, res) => {
  res.render("subAdmin/login");
});

router.get("/welcome", ensureSubAdminAuthentication, (req, res) => {
  Members.find({institution: res.locals.subAdmin.institution}).then((members) => {
    if(members){
      return res.render("subAdmin/members", {
        members
      });
    }
    res.render("subAdmin/members");
  })
  .catch((err) => {
    if(err){
      console.log("Unable To Fetch Members", err);
    }
  })
});

router.get("/add/new/member", ensureSubAdminAuthentication, (req, res) => {
  res.render("subAdmin/addMember");
});

router.get("/member/:id", ensureSubAdminAuthentication, (req, res) => {
  var memberId = req.params.id;

  if(ObjectID.isValid(memberId)){
    return Members.findById(memberId).then((memberDetails) => {
      if(memberDetails){
        return res.render("subAdmin/memberDetails", {
          memberDetails,
          imagePath: "/img/user-images/members-image/"+memberDetails.imagePath
        });
      }
      req.flash("error_msg", "Member Does Not Exist");
      res.render("subAdmin/memberDetails");
    })
    .catch((err) => {
      if(err){
        console.log("Unable To Fetch Member Details", err);
      }
    });
  }
  req.flash("error_msg", "Invalid Member Id Provided");
  res.redirect("/subadmin/welcome");
});

router.get("/update/member/:id", ensureSubAdminAuthentication, (req, res) => {
  var memberId = req.params.id;

  if(ObjectID.isValid(memberId)){
    return Members.findById(memberId).then((memberDetails) => {
      if(memberDetails){
        return res.render("subAdmin/updateMember", {memberDetails});
      }
      req.flash("error_msg", "Unable To Fetch Member Details, Try Again");
      res.render("subAdmin/updateMember");
    })
    .catch((err) => {
      if(err){
        console.log("Unable To Fetch Member Details", err);
      }
    });    
  }
  req.flash("error_msg", "Invalid Member ID Provided");
  res.redirect("/subAdmin/welcome");  
});

router.get("/manage", ensureSubAdminAuthentication, (req, res) => {
  var subAdminId = res.locals.subAdmin._id;
  res.render("subAdmin/updateLoginDetails", {subAdminId})
});

router.get("/logout", ensureSubAdminAuthentication, (req, res) => {
  req.logout();
  req.flash("success_msg", "Logout Successful");
  res.redirect("/subadmin/");
});

router.post("/login", (req, res, next) => {
  var userDetails = {
    username: req.body.username,
    password: req.body.password
  };

  if(!userDetails.username && !userDetails.password){
    req.flash("error_msg", "Username And Password Are Required");
    return res.redirect("/subadmin/");
  }

  else if(!userDetails.username){
    req.flash("error_msg", "Username Is Required");
    return res.redirect("/subadmin/");
  }

  else if(!userDetails.password){
    req.flash("error_msg", "Password Is Required");
    return res.redirect("/subadmin/");
  }

  else{
    passport.authenticate("local-subAdmin", {
      successRedirect: "/subadmin/welcome",
      failureRedirect: "/subadmin/",
      failureFlash: true
    })(req, res, next);
  }
});

router.post("/add/new/member", ensureSubAdminAuthentication, (req, res) => {
  var upload = multer({storage, fileFilter: (req, file, callback) => {
    var extname = path.extname(file.originalname);
    if(extname == ".jpg" || extname == ".png" || extname == ".jpeg"){
      return callback(null, true);
    }
    callback(new Error("A Valid File With The Extension(.jpg, or .jpeg or .png) Should Be Uploaded"));
  }}).single("memberImage");

  upload(req, res, (err) => {
    if(err){
      req.flash("error_msg", "A Valid File With The Extension(.jpg, or .jpeg or .png) Should Be Uploaded");
      return res.render("subadmin/addmember", {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        programme: req.body.programme,
        nationality: req.body.nationality,
        city: req.body.city,
        dob: req.body.dob,
        email: req.body.email,
        mobileNumber: req.body.mobileNumber,
        portfolio: req.body.portfolio
      });
    }

    if(req.body.mobileNumber.length === 10 && req.body.mobileNumber.substring(0, 1) === "0"){
      var memberDetails = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        gender: req.body.gender,
        institution: res.locals.subAdmin.institution,
        programme: req.body.programme,
        nationality: req.body.nationality,
        city: req.body.city,
        dob: req.body.dob,
        email: req.body.email,
        mobileNumber: req.body.mobileNumber,
        portfolio: req.body.portfolio
      }
  
      return Members.findOne({
        $or: [
          {email: memberDetails.email},
          {mobileNumber: memberDetails.mobileNumber}
        ]
      }).then((member) => {
        if(member){
          fs.unlink("public/img/user-images/members-image/"+uploadedFile, (err) => {
            if(err){
              req.flash("error_msg", "An Error Occured, Try Again");
              return res.render("subAdmin/addmember", {
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                programme: req.body.programme,
                nationality: req.body.nationality,
                city: req.body.city,
                dob: req.body.dob,
                email: req.body.email,
                mobileNumber: req.body.mobileNumber,
                portfolio: req.body.portfolio
              });
            }
            req.flash("error_msg", "Member Detail(s) Already Exist");
            res.render("subAdmin/addmember", {
              firstName: req.body.firstName,
              lastName: req.body.lastName,
              programme: req.body.programme,
              nationality: req.body.nationality,
              city: req.body.city,
              dob: req.body.dob,
              email: req.body.email,
              mobileNumber: req.body.mobileNumber,
              portfolio: req.body.portfolio
            });
          });
        }
  
        memberDetails.imagePath = uploadedFile;          
        var newMember = new Members(memberDetails);
        return newMember.save().then((member) => {
          if(member){
            return Members.count({institution: res.locals.subAdmin.institution}).then((membersNumber) => {
              if(membersNumber){
                return SubAdmin.findByIdAndUpdate(res.locals.subAdmin._id, {
                  $set: {
                    members: membersNumber
                  }
                }, {new: true}).then((SubAdmin) => {
                  res.locals.subAdmin.members = SubAdmin.members;  
                  req.flash("success_msg", "New Member Added Successfully");
                  return res.redirect("/subadmin/welcome");
                })
                .catch((err) => {
                  if(err){
                    console.log("Unable To Fetch Members", err);
                  }
                }); 
              }
              req.flash("success_msg", "Unable To Add New Member");
              res.redirect("/subadmin/welcome");
            })
            .catch((err) => {
              console.log("Unable To Count Number of Members", err);
            });         
          }
          req.flash("error_msg", "Unable To Add New Member");
          res.render("subAdmin/addmember", {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            programme: req.body.programme,
            nationality: req.body.nationality,
            city: req.body.city,
            dob: req.body.dob,
            email: req.body.email,
            mobileNumber: req.body.mobileNumber,
            portfolio: req.body.portfolio
          });
        })
        .catch((err) => {
          if(err){
            console.log("Unable To Add New Member", err);
          }
        });
      })
      .catch((err) => {
        if(err){
          console.log("Member Detail(s) Already Exist", err);
        }
      });

    }
    
    fs.unlink("public/img/user-images/members-image/"+uploadedFile, (err) => {
      if(err){
        req.flash("error_msg", "An Error Occured, Try Again");
        return res.render("subAdmin/addmember", {
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          programme: req.body.programme,
          nationality: req.body.nationality,
          city: req.body.city,
          dob: req.body.dob,
          email: req.body.email,
          mobileNumber: req.body.mobileNumber,
          portfolio: req.body.portfolio
        });
      }
      req.flash("error_msg", "Invalid Mobile Number Provided");
      res.render("subAdmin/addmember", {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        programme: req.body.programme,
        nationality: req.body.nationality,
        city: req.body.city,
        dob: req.body.dob,
        email: req.body.email,
        mobileNumber: req.body.mobileNumber,
        portfolio: req.body.portfolio
      });
    });    
  });
});

router.put("/update/sub_admin/:id", (req, res) => {
  var subAdminDetails = {
    _id: req.params.id,
    username: req.body.username,
    mobileNumber: req.body.mobileNumber,
    oldPassword: req.body.oldPassword,
    newPassword: req.body.newPassword
  };

  if(subAdminDetails.newPassword.length < 8 && subAdminDetails.oldPassword.length < 8){
    req.flash("error_msg", "Passwords Must Be Greater Than 7");
    return res.redirect("/subadmin/manage");
  }

  if(subAdminDetails.oldPassword.length < 8){
    req.flash("error_msg", "old Password Must Be Greater Than 7");
    return res.redirect("/subadmin/manage");
  }

  if(subAdminDetails.newPassword.length < 8){
    req.flash("error_msg", "New Password Must Be Greater Than 7");
    return res.redirect("/subadmin/manage");
  }

  if(subAdminDetails.newPassword === subAdminDetails.oldPassword){
    req.flash("error_msg", "Passwords Must Not Match");
    return res.redirect("/subadmin/manage");
  }

  if(subAdminDetails.mobileNumber.length != 10 || req.body.mobileNumber.substring(0, 1) != "0"){
    req.flash("error_msg", "Invalid Mobile Number Provided");
    return res.redirect("/subadmin/manage");
  }

  if(ObjectID.isValid(subAdminDetails._id)){
    return SubAdmin.findById(subAdminDetails._id).then((subAdmin) => {
      if(subAdmin){
        return bcrypt.compare(subAdminDetails.oldPassword, subAdmin.password).then((response) => {
          if(response){
            return SubAdmin.find({
              _id: {$ne: subAdmin._id}
            }).then((subAdmins) => {
              if(subAdmins.length > 0){
                return subAdmins.forEach((subAdmin, index) => {
                  if(subAdmin.username === subAdminDetails.username){
                    req.flash("error_msg", "Username Already Exist");
                    return res.redirect("/subadmin/manage");
                  }

                  if(subAdmin.mobileNumber === "+233"+subAdminDetails.mobileNumber.substring(1, 10)){
                    req.flash("error_msg", "Mobile Number Already Exist");
                    return res.redirect("/subadmin/manage");
                  }

                  bcrypt.genSalt(10, (err, salt) => {
                    if(err){
                      req.flash("error_msg", "Unable To Update Login Credentials");
                      return res.redirect("/subadmin/manage");
                    }

                    bcrypt.hash(subAdminDetails.newPassword, salt, (err, hash) => {
                      if(err){
                        req.flash("error_msg", "Unable To Update Login Credentials");
                        return res.redirect("/subadmin/manage");
                      }

                      subAdminDetails.newPassword = hash;
                      SubAdmin.findByIdAndUpdate(subAdminDetails._id, {
                        $set: {
                          username: subAdminDetails.username,
                          mobileNumber: "+233"+subAdminDetails.mobileNumber.substring(1, 10),
                          password: subAdminDetails.newPassword
                        }
                      }, {new: true}).then((subAdmin) => {
                        if(subAdmin){
                          req.flash("success_msg", "Update Successfully, Login With Your New Credentials");
                          req.logout();
                          return res.redirect("/subadmin/");
                        }
                        req.flash("error_msg", "Unable To Update Login Credentials");
                        return res.redirect("/subadmin/manage");
                      })
                      .catch((err) => {
                        if(err){
                          console.log("Unable To Fetch Updated SubAdmin Details", err);
                        }
                      });
                    });
                  });
                });
              }

              bcrypt.genSalt(10, (err, salt) => {
                if(err){
                  req.flash("error_msg", "Unable To Update Login Credentials");
                  return res.redirect("/subadmin/manage");
                }

                bcrypt.hash(subAdminDetails.newPassword, salt, (err, hash) => {
                  if(err){
                    req.flash("error_msg", "Unable To Update Login Credentials");
                    return res.redirect("/subadmin/manage");
                  }

                  subAdminDetails.newPassword = hash;
                  SubAdmin.findByIdAndUpdate(subAdminDetails._id, {
                    $set: {
                      username: subAdminDetails.username,
                      mobileNumber: "+233"+subAdminDetails.mobileNumber.substring(1, 10),
                      password: subAdminDetails.newPassword
                    }
                  }, {new: true}).then((subAdmin) => {
                    if(subAdmin){
                      req.flash("success_msg", "Update Successfully, Login With Your New Credentials");
                      req.logout();
                      return res.redirect("/subadmin/");
                    }
                    req.flash("error_msg", "Unable To Update Login Credentials");
                    return res.redirect("/subadmin/manage");
                  })
                  .catch((err) => {
                    if(err){
                      console.log("Unable To Fetch Updated SubAdmin Details", err);
                    }
                  });
                });
              });
            })
            .catch((err) => {
              if(err){
                console.log("Unable To Fetch SubAdmins", err);
              }
            });
          }
          req.flash("error_msg", "Incorrect Old Password Provided");
          res.redirect("/subadmin/manage");
        })
        .catch((err) => {
          if(err){
            console.log("Unable To Compare Passwords", err);
          }
        });
      }
      req.flash("error_msg", "No SubAdmin's ID Matches The Provided ID");
      res.redirect("subadmin/members");
    })
    .catch((err) => {
      if(err){
        console.log("Unable To Fetch SubAdmin Details", err);
      }
    });
  }
  req.flash("error_msg", "Invalid ID Provided");
  res.redirect("subadmin/welcome");

});

router.delete("/delete/member", ensureSubAdminAuthentication, (req, res) => {
  var memberId = req.body.memberId;

  if(ObjectID.isValid(memberId)){ 
    return Members.findById(memberId).then((member) => {
      if(member){
        return Members.findByIdAndRemove(memberId).then((deleteMember) => {
          if(deleteMember){
            req.flash("error_msg", "Member Deleted Successfully");
            return res.redirect("/subadmin/welcome");    
          }
          req.flash("error_msg", "Unable To Delete Member");
          res.redirect("subadmin/welcome");
        })
        .catch((err) => {
          if(err){
            console.log("Unable To Delete Member Details", err);
          }
        });
      }
      req.flash("error_msg", "Member ID Does Not Exist");
      res.redirect("/subadmin/welcome");
    })
    .catch((err) => {
      if(err){
        console.log("Unable To Fetch Member Id", err);
      }
    });
  }
  req.flash("error_msg", "Invalid Member ID Provided");
  res.redirect("/subadmin/welcome");
});

module.exports = router;