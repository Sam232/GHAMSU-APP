const router = require("express").Router();
const passport = require("passport");
const bcrypt = require("bcryptjs");
const passwordGen = require("password-generator");
const Nexmo = require("nexmo"); 
const {ObjectID} = require("mongodb"); 
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {isNull, isObject} = require("util");

const {Admin} = require("../models/Admin");
const {SubAdmin} = require("../models/SubAdmin");
const {Members} = require("../models/Members");

const {ensureAdminAuthentication} = require("../helper/auth");

const nexmo = new Nexmo({
  apiKey: "c5a11e28",
  apiSecret: "5Z2cCEsdSpiNuw99"
});

router.get("/", (req, res) => {
  res.render("admin/login");
});

router.get("/logout", ensureAdminAuthentication, (req, res) => {
  req.logout();
  req.flash("success_msg", "Logout Successful");
  res.redirect("/admin/");
});

router.get("/welcome", ensureAdminAuthentication, (req, res) => {
  Members.find({}).then((members) => {
    if(members){
      return res.render("admin/members", {members});
    }
    res.render("admin/members");
  })
  .catch((err) => {
    if(err){
      console.log("Unable To Fetch Members", err);
    }
  });

});

router.get("/add_sub_admins", ensureAdminAuthentication, (req, res) => {
  res.render("admin/addSubAdmin");
});

router.get("/manage/sub_admins", ensureAdminAuthentication, (req, res) => {
  SubAdmin.find({}).then((response) => {
    if(response){
      return res.render("admin/manageSubAdmin", {
        subAdmins: response
      });
    }

    res.render("admin/manageSubAdmin");
  })
  .catch((err) => {
    if(err){
      console.log("Unable To Fetch SubAdmins", err);
    }
  });
});

router.get("/manage/admin", ensureAdminAuthentication, (req, res) => {
  res.render("admin/mainAdmin");
});

router.get("/update/sub_admin/:id", ensureAdminAuthentication, (req, res) => {
  var subAdminId = req.params.id;

  if(ObjectID.isValid(subAdminId)){
    return SubAdmin.findById(subAdminId).then((subAdmin) => {
      if(subAdmin){
        res.render("admin/updateSubAdmin", {
          subAdminId,
          subAdminImage: subAdmin.imagePath
        });
      }
    })
    .catch((err) => {
      if(err){
        console.log("Unable To Fetch SubAdmin\'s Details", err);
      }
    });
  }

  req.flash("error_msg", "Invalid Object ID Provided");  
  res.redirect("/manage/sub_admins");  
});

router.get("/member/:id", ensureAdminAuthentication, (req, res) => {
  var memberId = req.params.id;

  if(ObjectID.isValid(memberId)){
    return Members.findById(memberId).then((memberDetails) => {
      if(memberDetails){
        return res.render("admin/memberDetails", {
          memberDetails,
          imagePath: "/img/user-images/members-image/"+memberDetails.imagePath
        });
      }
      req.flash("error_msg", "Member Does Not Exist");
      res.redirect("/admin/welcome");
    })
    .catch((err) => {
      if(err){
        console.log("Error Fetching Member Details", err);
      }
    });
  }

  req.flash("error_msg", "Invalid Member ID Provided");
  res.redirect("/admin/welcome");  
});

router.get("/view/subadmin/:id", ensureAdminAuthentication, (req, res) => {
  var subAdminId = req.params.id;

  if(ObjectID.isValid(subAdminId)){
    return SubAdmin.findById(subAdminId).then((subAdmin) => {
      if(subAdmin){
        return res.render("admin/subAdminDetails", {
          imagePath: "/img/user-images/subAdmins-image/"+subAdmin.imagePath,
          subAdminDetails: subAdmin
        });
      }
      req.flash("error_msg", "SubAdmin Not Found");
      res.redirect("/admin/manage/subadmin");
    })
    .catch((err) => {
      if(err){
        console.log("Unable To Fetch SubAdmin\'s Details", err);
      }
    });
  }
  req.flash("error_msg", "Valid SubAdmin ID Is Required");
  res.redirect("/admin/manage/subadmin");
});

router.post("/login", (req, res, next) => {
  if(!req.body.username && !req.body.password){
    req.flash("error_msg", "Username And Password Are Required");
    return res.redirect("/admin");
  }

  if(!req.body.username){
    req.flash("error_msg", "Username Is Required");
    return res.redirect("/admin");
  }

  if(!req.body.password){
    req.flash("error_msg", "Password Is Required");
    return res.redirect("/admin");
  }

  else{
    passport.authenticate("local-admin", {
      successRedirect: "/admin/welcome",
      failureRedirect: "/admin/",
      failureFlash: true
    })(req, res, next);
  }

});

router.post("/add_sub_admin", ensureAdminAuthentication, (req, res) => {
  var imageName;

  var upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, callback) => {
        callback(null, "./public/img/user-images/subAdmins-image/");
      },
      filename: (req, file, callback) => {
        imageName = file.fieldname + "-" + Date.now() + path.extname(file.originalname); 
        callback(null, imageName);
      }
    }),
    fileFilter: (req, file, callback) => {
      var extname = path.extname(file.originalname);
      if(extname === ".jpg" || extname === ".jpeg" || extname === ".png"){
        return callback(null, true);
      }
      callback(new Error("A Valid File With The Extension(.jpg, or .jpeg or .png) Should Be Uploaded"));
    }
  }).single("subAdminImage");

  upload(req, res, (err) => {
    if(err){
      req.flash("error_msg", "A Valid File With The Extension(.jpg, or .jpeg or .png) Should Be Uploaded");
      return res.render("admin/addSubAdmin", {
        username: req.body.username,
        institution: req.body.institution,
        phoneNumber: req.body.phoneNumber
      });
    }

    if(req.body.phoneNumber.length === 10 && req.body.phoneNumber.substring(0, 1) === "0"){
      var subAdminDetails = {
        username: req.body.username,
        institution: req.body.institution,
        password: passwordGen(8, false),
        mobileNumber: req.body.phoneNumber.substring(1, 10)
      }
    
      var password = subAdminDetails.password;
    
      return SubAdmin.findOne({
        $or: [
          {username: subAdminDetails.username},
          {institution: subAdminDetails.institution},
          {mobileNumber: "+233"+subAdminDetails.mobileNumber}
        ]    
      }).then((response) => {
        if(response){
          return fs.unlink("./public/img/user-images/subAdmins-image/"+imageName, (err) => {
            if(err){
              req.flash("error_msg", "An Error Occured, Try Again");
              return res.render("admin/addSubAdmin", {
                username: req.body.username,
                institution: req.body.institution,
                phoneNumber: req.body.phoneNumber
              });
            }
      
            req.flash("error_msg", "Provided Detail(s) Already Exist");
            res.render("admin/addSubAdmin", {
              username: req.body.username,
              institution: req.body.institution,
              phoneNumber: req.body.phoneNumber
            });
          });
        }
    
        bcrypt.genSalt(10, (err, salt) => {
          if(err){
            return fs.unlink("./public/img/user-images/subAdmins-image/"+imageName, (err) => {
              if(err){
                req.flash("error_msg", "An Error Occured, Try Again");
                return res.render("admin/addSubAdmin", {
                  username: req.body.username,
                  institution: req.body.institution,
                  phoneNumber: req.body.phoneNumber
                });
              }
        
              req.flash("error_msg", "Unable To Add New Admin");
              res.render("admin/addSubAdmin", {
                username: req.body.username,
                institution: req.body.institution,
                phoneNumber: req.body.phoneNumber
              });
            });
          }
    
          bcrypt.hash(subAdminDetails.password, salt).then((hash) => {
            if(hash){
              subAdminDetails.password = hash;
              subAdminDetails.mobileNumber = "+233"+subAdminDetails.mobileNumber
              subAdminDetails.imagePath = imageName;
              var newSubAdmin = new SubAdmin(subAdminDetails);
              return newSubAdmin.save().then((response) => {
                if(response){
                  var from = "GHAMSU-MGR";
                  var to = subAdminDetails.mobileNumber;
                  var text = "Dear "+subAdminDetails.username+", you are now a subadmin representing your institution on the GHAMSU app. Your new login password is "+password+". You can change the password after logging in.";
    
                  return nexmo.message.sendSms(from, to, text, (err, response) => {
                    if(err){
                      req.flash("success_msg", "New SubAdmin Added Successful And The New Password Is "+password);
                      return res.redirect("/admin/manage/sub_admins");
                    }
                    else if(response.messages[0].status != "0"){
                      console.log(response.messages)
                      req.flash("success_msg", "New SubAdmin Added Successful And The New Password Is "+password);
                      return res.redirect("/admin/manage/sub_admins");
                    }
    
                    req.flash("success_msg", "New SubAdmin Added Successful And Generated Login Password Has Been Delivered To The SubAdmin\'s Mobile Number ");
                    res.redirect("/admin/manage/sub_admins");
                  });              
                }
                req.flash("error_msg", "Unable To Add New SubAmin");
                res.redirect("/admin/add_sub_admins");
              })
              .catch((err) => {
                if(err){
                  console.log("Unable To Add New SubAdmin", err);
                }
              });
            }

            fs.unlink("./public/img/user-images/subAdmins-image/"+imageName, (err) => {
              if(err){
                req.flash("error_msg", "An Error Occured, Try Again");
                return res.render("admin/addSubAdmin", {
                  username: req.body.username,
                  institution: req.body.institution,
                  phoneNumber: req.body.phoneNumber
                });
              }
        
              req.flash("error_msg", "Unable To Add New Admin");
              res.render("admin/addSubAdmin", {
                username: req.body.username,
                institution: req.body.institution,
                phoneNumber: req.body.phoneNumber
              });
            });
          })
          .catch((err) => {
            console.log("Unable To Add New SubAdmin", err);
          });
        });
      })
      .catch((err) => {
        if(err){
          console.log("Unable To Add New SubAdmin", err);
        }
      });
    }

    fs.unlink("./public/img/user-images/subAdmins-image/"+imageName, (err) => {
      if(err){
        console.log(err)
        req.flash("error_msg", "An Error Occured, Try Again");
        return res.render("admin/addSubAdmin", {
          username: req.body.username,
          institution: req.body.institution,
          phoneNumber: req.body.phoneNumber
        });
      }

      req.flash("error_msg", "A Valid Mobile Number Is Required");
      res.render("admin/addSubAdmin", {
        username: req.body.username,
        institution: req.body.institution,
        phoneNumber: req.body.phoneNumber
      });
    });
  });
});

// router.post("/delete/undo", (req, res) => {
//   res.send({
//     data: req.body.subAdminDetails
//   })
// });

router.put("/manage/admin", ensureAdminAuthentication, (req, res) => {
  var mainAdminImage;

  var upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, callback) => {
        callback(null, "./public/img/user-images/mainAdmin-image");
      },
      filename: (req, file, callback) => {
        mainAdminImage = file.fieldname + "-" + Date.now() + path.extname(file.originalname);
        callback(null, mainAdminImage);
      }
    }),
    fileFilter: (req, file, callback) => {
      var extname = path.extname(file.originalname);
      if(extname === ".jpg" || extname === ".jpeg" || extname === ".png"){
        return callback(null, true);
      }
      callback(new Error("A Valid File With The Extension(.jpg, or .jpeg or .png) Should Be Uploaded"));
    }
  }).single("mainAdminImage");

  upload(req, res, (err) => {
    var adminDetails = {
      username: req.body.username,
      oldPassword: req.body.oldPassword,
      newPassword: req.body.newPassword,
      imagePath: mainAdminImage
    };

    if(err){
      req.flash("error_msg", "A Valid File With The Extension(.jpg, or .jpeg or .png) Should Be Uploaded");
      return res.render("admin/mainAdmin", {
        username: adminDetails.username
      });
    }

    if(isObject(req.file)){
      if((adminDetails.newPassword.length < 8) && (adminDetails.oldPassword.length < 8)){
        return fs.unlink("./public/img/user-images/mainAdmin-image/"+mainAdminImage, (err) => {
          if(err){
            console.log("Unable To Delete Main Admin\'s Image", err);
            req.flash("error_msg", "Length of Passwords Must Be Greater Than 7");
            return res.render("admin/mainAdmin", {
              username: adminDetails.username
            });
          }
          req.flash("error_msg", "Length of Passwords Must Be Greater Than 7");
          res.render("admin/mainAdmin", {
            username: adminDetails.username
          });
        });        
      }
    
      if(adminDetails.oldPassword.length < 8){
        return fs.unlink("./public/img/user-images/mainAdmin-image/"+mainAdminImage, (err) => {
          if(err){
            console.log("Unable To Delete Main Admin\'s Image", err);
            req.flash("error_msg", "Length of Old Password Must Be Greater Than 7");
            return res.render("admin/mainAdmin", {
              username: adminDetails.username
            });
          }
          req.flash("error_msg", "Length of Old Password Must Be Greater Than 7");
          res.render("admin/mainAdmin", {
            username: adminDetails.username
          });
        }); 
      }
    
      if(adminDetails.newPassword.length < 8){
        return fs.unlink("./public/img/user-images/mainAdmin-image/"+mainAdminImage, (err) => {
          if(err){
            console.log("Unable To Delete Main Admin\'s Image", err);
            req.flash("error_msg", "Length of New Password Must Be Greater Than 7");
            return res.render("admin/mainAdmin", {
              username: adminDetails.username
            });
          }
          req.flash("error_msg", "Length of New Password Must Be Greater Than 7");
          res.render("admin/mainAdmin", {
            username: adminDetails.username
          });
        }); 
      }
    
      if(adminDetails.newPassword === adminDetails.oldPassword){
        return fs.unlink("./public/img/user-images/mainAdmin-image/"+mainAdminImage, (err) => {
          if(err){
            console.log("Unable To Delete Main Admin\'s Image", err);
            req.flash("error_msg", "Passwords Must Not Match");
            return res.render("admin/mainAdmin", {
              username: adminDetails.username
            });
          }
          req.flash("error_msg", "Passwords Must Not Match");
          res.render("admin/mainAdmin", {
            username: adminDetails.username
          });
        }); 
      }

      Admin.findOne({username: adminDetails.username}).then((user) => {
        if(user){
          return bcrypt.compare(adminDetails.oldPassword, user.password).then((response) => {
            if(response === true){
              return bcrypt.genSalt(10, (err, salt) => {
                if(err){
                  return fs.unlink("./public/img/user-images/mainAdmin-image/"+mainAdminImage, (err) => {
                    if(err){
                      console.log("Unable To Delete Main Admin\'s Image", err);
                      req.flash("error_msg", "Error Updating Admin Details, Try Again");
                      return res.render("admin/mainAdmin", {
                        username: adminDetails.username
                      });
                    }
                    req.flash("error_msg", "Error Updating Admin Details, Try Again");
                    res.render("admin/mainAdmin", {
                      username: adminDetails.username
                    });
                  });
                }
    
                bcrypt.hash(adminDetails.newPassword, salt, (err, hash) => {
                  if(err){
                    return fs.unlink("./public/img/user-images/mainAdmin-image/"+mainAdminImage, (err) => {
                      if(err){
                        console.log("Unable To Delete Main Admin\'s Image", err);
                        req.flash("error_msg", "Error Updating Admin Details, Try Again");
                        return res.render("admin/mainAdmin", {
                          username: adminDetails.username
                        });
                      }
                      req.flash("error_msg", "Error Updating Admin Details, Try Again");
                      res.render("admin/mainAdmin", {
                        username: adminDetails.username
                      });
                    });
                  }
    
                  adminDetails.newPassword = hash;
    
                  Admin.findByIdAndUpdate(user._id, {
                    $set: {
                      username: adminDetails.username,
                      password: adminDetails.newPassword,
                      imagePath: adminDetails.imagePath
                    }
                  },{new: true}).then((updatedDetails) => {
                    if(updatedDetails){
                      req.flash("success_msg", "Update Successful, Login Again With Your Credentials");
                      req.logout();
                      return res.redirect("/admin/");
                    }
    
                    fs.unlink("./public/img/user-images/mainAdmin-image/"+mainAdminImage, (err) => {
                      if(err){
                        console.log("Unable To Delete Main Admin\'s Image", err);
                        req.flash("error_msg", "Error Updating Admin Details, Try Again");
                        return res.render("admin/mainAdmin", {
                          username: adminDetails.username
                        });
                      }
                      req.flash("error_msg", "Error Updating Admin Details, Try Again");
                      res.render("admin/mainAdmin", {
                        username: adminDetails.username
                      });
                    });               
                  })
                  .catch((err) => {
                    if(err){
                      console.log("error_msg", "Error Updating Admin Details, Try Again ");
                    }
                  });
                });
              });          
            }
            else{
              fs.unlink("./public/img/user-images/mainAdmin-image/"+mainAdminImage, (err) => {
                if(err){
                  console.log("Unable To Delete Main Admin\'s Image", err);
                  req.flash("error_msg", "Incorrect Admin Details Provided");
                  return res.render("admin/mainAdmin", {
                    username: adminDetails.username
                  });
                }
                req.flash("error_msg", "Incorrect Admin Details Provided");
                res.render("admin/mainAdmin", {
                  username: adminDetails.username
                });
              }); 
            }            
          })  
          .catch((err) => {
            if(err){
              console.log("error_msg", err);
            }
          });
        }

        bcrypt.compare(adminDetails.oldPassword, res.locals.mainAdmin.password).then((response) => {
          if(response === true){
            return bcrypt.genSalt(10, (err, salt) => {
              if(err){
                return fs.unlink("./public/img/user-images/mainAdmin-image/"+mainAdminImage, (err) => {
                  if(err){
                    console.log("Unable To Delete Main Admin\'s Image", err);
                    req.flash("error_msg", "Error Updating Admin Details, Try Again");
                    return res.render("admin/mainAdmin", {
                      username: adminDetails.username
                    });
                  }
                  req.flash("error_msg", "Error Updating Admin Details, Try Again");
                  res.render("admin/mainAdmin", {
                    username: adminDetails.username
                  });
                });
              }
        
              bcrypt.hash(adminDetails.newPassword, salt, (err, hash) => {
                if(err){
                  return fs.unlink("./public/img/user-images/mainAdmin-image/"+mainAdminImage, (err) => {
                    if(err){
                      console.log("Unable To Delete Main Admin\'s Image", err);
                      req.flash("error_msg", "Error Updating Admin Details, Try Again");
                      return res.render("admin/mainAdmin", {
                        username: adminDetails.username
                      });
                    }
                    req.flash("error_msg", "Error Updating Admin Details, Try Again");
                    res.render("admin/mainAdmin", {
                      username: adminDetails.username
                    });
                  });
                }
        
                adminDetails.newPassword = hash;
                
                Admin.remove({}).then((response) => {
                  if(response.n){
                    var newAdmin = new Admin({
                      username: adminDetails.username,
                      password: adminDetails.newPassword,
                      imagePath: adminDetails.imagePath
                    });
        
                    return newAdmin.save().then((user) => {
                      if(user){
                        return fs.unlink("./public/img/user-images/mainAdmin-image/"+res.locals.mainAdmin.imagePath, (err) => {
                          if(err){
                            console.log("Unable To Delete Main Admin\'s Image", err);
                            req.flash("success_msg", "Update Successful, Login Again With Your Credentials");
                            req.logout();
                            return res.redirect("/admin/");
                          }
                          req.flash("error_msg", "Error Updating Admin Details, Try Again");
                          res.render("admin/mainAdmin", {
                            username: adminDetails.username
                          });
                        });
                      }
    
                      fs.unlink("./public/img/user-images/mainAdmin-image/"+adminDetails.imagePath, (err) => {
                        if(err){
                          console.log("Unable To Delete Main Admin\'s Image", err);
                          req.flash("error_msg", "Error Updating Admin Details, Try Again");
                          return res.render("admin/mainAdmin", {
                            username: adminDetails.username
                          });
                        }
                        req.flash("error_msg", "Error Updating Admin Details, Try Again");
                        res.render("admin/mainAdmin", {
                          username: adminDetails.username
                        });
                      });      
                    })
                    .catch((err) => {
                      if(err){
                        console.log("error_msg", err);
                      }
                    });
                  }
                  fs.unlink("./public/img/user-images/mainAdmin-image/"+adminDetails.imagePath, (err) => {
                    if(err){
                      console.log("Unable To Delete Main Admin\'s Image", err);
                      req.flash("error_msg", "Error Updating Admin Details, Try Again");
                      return res.render("admin/mainAdmin", {
                        username: adminDetails.username
                      });
                    }
                    req.flash("error_msg", "Error Updating Admin Details, Try Again");
                    res.render("admin/mainAdmin", {
                      username: adminDetails.username
                    });
                  });                      
                })
                .catch((err) => {
                  if(err){
                    console.log("error_msg", "Error Updating Admin Details, Try Again ");
                  }
                });                
              });
            }); 
          }
          fs.unlink("./public/img/user-images/mainAdmin-image/"+mainAdminImage, (err) => {
            if(err){
              console.log("Unable To Delete Main Admin\'s Image", err);
              req.flash("error_msg", "Incorrect Admin Details Provided");
              return res.render("admin/mainAdmin", {
                username: adminDetails.username
              });
            }
            req.flash("error_msg", "Incorrect Admin Details Provided");
            res.render("admin/mainAdmin", {
              username: adminDetails.username
            });
          }); 
        })
        .catch((err) => {
          if(err){
            console.log("error_msg", "Unable To Update Admin Details, Try Again ");
          }
        });
      })
      .catch((err) => {
        if(err){
          console.log("error_msg", "Unable To Update Admin Details, Try Again ");
        }
      });
    }
    else{
      if((adminDetails.newPassword.length < 8) && (adminDetails.oldPassword.length < 8)){
        req.flash("error_msg", "Length of Passwords Must Be Greater Than 7 ");
        return res.redirect("/admin/manage/admin");
      }
    
      if(adminDetails.oldPassword.length < 8){
        req.flash("error_msg", "Length of Old Password Must Be Greater Than 7 ");
        return res.redirect("/admin/manage/admin");
      }
    
      if(adminDetails.newPassword.length < 8){
        req.flash("error_msg", "Length of New Password Must Be Greater Than 7 ");
        return res.redirect("/admin/manage/admin");
      }
    
      if(adminDetails.newPassword == adminDetails.oldPassword){
        req.flash("error_msg", "Passwords Must Not Match ");
        return res.redirect("/admin/manage/admin");
      }

      Admin.findOne({username: adminDetails.username}).then((user) => {
        if(user){
          return bcrypt.compare(adminDetails.oldPassword, user.password).then((response) => {
            if(response === true){
              return bcrypt.genSalt(10, (err, salt) => {
                if(err){
                  req.flash("error_msg", "Error Updating Admin Details, Try Again ");
                  return res.render("admin/mainAdmin", {
                    username: adminDetails.username
                  });
                }
    
                bcrypt.hash(adminDetails.newPassword, salt, (err, hash) => {
                  if(err){
                    req.flash("error_msg", "Error Updating Admin Details, Try Again ");
                    return res.render("admin/mainAdmin", {
                      username: adminDetails.username
                    });
                  }
    
                  adminDetails.newPassword = hash;
    
                  Admin.findByIdAndUpdate(user._id, {
                    $set: {
                      username: adminDetails.username,
                      password: adminDetails.newPassword
                    }
                  },{new: true}).then((updatedDetails) => {
                    if(updatedDetails){
                      req.flash("success_msg", "Update Successful, Login Again With Your Credentials");
                      req.logout();
                      return res.redirect("/admin/");
                    }
    
                    req.flash("error_msg", "Error Updating Admin Details, Try Again ");
                    res.render("admin/mainAdmin", {
                      username: adminDetails.username
                    });               
                  })
                  .catch((err) => {
                    if(err){
                      console.log("error_msg", "Error Updating Admin Details, Try Again ");
                    }
                  });
                });
              });          
            }
            else{
              req.flash("error_msg", "Incorrect Admin Details Provided");
              res.render("admin/mainAdmin", {
                username: adminDetails.username
              });  
            }
            
          })  
          .catch((err) => {
            if(err){
              console.log("error_msg", err);
            }
          });
        }

        bcrypt.compare(adminDetails.oldPassword, res.locals.mainAdmin.password).then((response) => {
          if(response){
            return bcrypt.genSalt(10, (err, salt) => {
              if(err){
                req.flash("error_msg", "Error Updating Admin Details, Try Again ");
                return res.render("admin/mainAdmin", {
                  username: adminDetails.username
                });
              }
        
              bcrypt.hash(adminDetails.newPassword, salt, (err, hash) => {
                if(err){
                  req.flash("error_msg", "Error Updating Admin Details, Try Again ");
                  return res.render("admin/mainAdmin", {
                    username: adminDetails.username
                  });
                }
        
                adminDetails.newPassword = hash;
                
                Admin.remove({}).then((response) => {
                  if(response.n){
                    var newAdmin = new Admin({
                      username: adminDetails.username,
                      password: adminDetails.newPassword,
                      imagePath: res.locals.mainAdmin.imagePath
                    });
        
                    return newAdmin.save().then((user) => {
                      if(user){
                        req.flash("success_msg", "Update Successful, Login Again With Your Credentials");
                        req.logout();
                        return res.redirect("/admin/");
                      }
                      req.flash("error_msg", "Error Updating Admin Details, Try Again ");
                      res.render("admin/mainAdmin", {
                        username: adminDetails.username
                      });   
                    })
                    .catch((err) => {
                      if(err){
                        console.log("error_msg", err);
                      }
                    });
                  }
                  req.flash("error_msg", "Error Updating Admin Details, Try Again ");
                  res.render("admin/mainAdmin", {
                    username: adminDetails.username
                  });                         
                })
                .catch((err) => {
                  if(err){
                    console.log("error_msg", "Error Updating Admin Details, Try Again ");
                  }
                }); 
              });
            });
          }
          req.flash("error_msg", "Incorrect Admin Details Provided");
          res.render("admin/mainAdmin", {
            username: adminDetails.username
          });
        })
        .catch((err) => {
          if(err){
            console.log("Unable To Compare Passwords", err);
          }
        });        
      })
      .catch((err) => {
        if(err){
          console.log("error_msg", "Unable To Update Admin Details, Try Again ");
        }
      });
    }
  });
});

router.put("/update/sub_admin/:id", ensureAdminAuthentication, (req, res) => {
  var imageName;
  var upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, callback) => {
        callback(null, "./public/img/user-images/subAdmins-image");
      },
      filename: (req, file, callback) => {
        imageName = file.fieldname + "-" + Date.now() + path.extname(file.originalname); 
        callback(null, imageName);
      }
    }),
    fileFilter: (req, file, callback) => {
      var extname = path.extname(file.originalname);
      if(extname === ".jpg" || extname === ".jpeg" || extname === ".png"){
        return callback(null, true);
      }
      callback(new Error("A Valid File With The Extension(.jpg, or .jpeg or .png) Should Be Uploaded"));
    }
  }).single("subAdminImage");
  
  upload(req, res, (err) => {
    var updateDetails = {
      username: req.body.userName,
      mobileNumber: req.body.phone,
      password: passwordGen(8, false)
    };

    if(err){
      req.flash("error_msg", "A Valid File With The Extension(.jpg, or .jpeg or .png) Should Be Uploaded");
      return res.render("admin/updateSubAdmin", {
        username: req.body.userName,
        phoneNumber: req.body.phone,
        subAdminId: req.params.id
      });
    }

    if(updateDetails.mobileNumber.length !== 10 && updateDetails.mobileNumber.substring(0, 1) !== 0){               
      return fs.unlink("./public/img/user-images/subAdmins-image/"+imageName, (err) => {
        if(err){
          req.flash("error_msg", "An Error Occured, Try Again");
          return res.render("admin/updateSubAdmin", {
            username: req.body.userName,
            phoneNumber: req.body.phone,
            subAdminId: req.params.id
          });
        }
        req.flash("error_msg", "Valid Mobile Number Required");
        res.render("admin/updateSubAdmin", {
          username: req.body.userName,
          phoneNumber: req.body.phone,
          subAdminId: req.params.id
        });
      });
    }

    if(!ObjectID.isValid(req.params.id)){
      return fs.unlink("./public/img/user-images/subAdmins-image/"+imageName, (err) => {
        if(err){
          req.flash("error_msg", "An Error Occured, Try Again");
          return res.render("admin/updateSubAdmin", {
            username: req.body.userName,
            phoneNumber: req.body.phone,
            subAdminId: req.params.id
          });
        }
        req.flash("error_msg", "Valid SubAdmin ID Is Required");
        res.render("admin/updateSubAdmin", {
          username: req.body.userName,
          phoneNumber: req.body.phone,
          subAdminId: req.params.id
        });
      });
    }
    
    if(isObject(req.file)){
      var subAdminId = req.params.id;  
      var password = updateDetails.password;
      var mobileNumber = updateDetails.mobileNumber.substring(1, 10);
  
      return SubAdmin.find({"_id": {$ne: subAdminId}}).then((subAdmins) => {
        if(subAdmins.length > 0){
          var newSubAdmins = subAdmins.filter(subAdmin => subAdmin.username === updateDetails.username || subAdmin.mobileNumber === "+233"+mobileNumber);
          if(newSubAdmins.length === 0){        
            return bcrypt.genSalt(10, (err, salt) => {
              if(err){
                return fs.unlink("./public/img/user-images/subAdmins-image/"+imageName, (err) => {
                  if(err){
                    req.flash("error_msg", "An Error Occured, Try Again");
                    return res.render("admin/updateSubAdmin", {
                      username: req.body.userName,
                      phoneNumber: req.body.phone,
                      subAdminId: req.params.id
                    });
                  }
                  req.flash("error_msg", "Unable To Update SubAdmin\'s Details, Try Again");
                  res.render("admin/updateSubAdmin", {
                    username: req.body.userName,
                    phoneNumber: req.body.phone,
                    subsubAdminId: req.params.idAdminId
                  });
                });
              }
          
              bcrypt.hash(updateDetails.password, salt, (err, hash) => {
                if(err){
                  return fs.unlink("./public/img/user-images/subAdmins-image/"+imageName, (err) => {
                    if(err){
                      req.flash("error_msg", "An Error Occured, Try Again");
                      return res.render("admin/updateSubAdmin", {
                        username: req.body.userName,
                        phoneNumber: req.body.phone,
                        subAdminId: req.params.id
                      });
                    }
                    req.flash("error_msg", "Unable To Update SubAdmin\'s Details, Try Again");
                    res.render("admin/updateSubAdmin", {
                      username: req.body.userName,
                      phoneNumber: req.body.phone,
                      subAdminId: req.params.id
                    });
                  });
                }
          
                updateDetails.password = hash;
                
                SubAdmin.findByIdAndUpdate(subAdminId, {
                  $set: {
                    username: updateDetails.username,
                    mobileNumber: "+233"+updateDetails.mobileNumber.substring(1, 10),
                    password: updateDetails.password,
                    imagePath: imageName
                  }
                }, {new: true}).then((updatedDetails) => {
                  if(updatedDetails){
                    var to = "+233"+updateDetails.mobileNumber.substring(1, 10);
                    var from = "GHAMSU-MGR";
                    var text = "Dear "+updateDetails.username+", Your Account On The Ghamsu App Has Been Updated. Your New Password Is "+password+". You Can Change The Password When You Login."
              
                    return fs.unlink("./public/img/user-images/subAdmins-image/"+req.body.subAdminImagePath, (err) => {
                      if(err){
                        console.log("Unable To Remove SubAdmins\'s Image", err);
                        return nexmo.message.sendSms(from, to, text, (err, response) => {
                          if(err){
                            req.flash("success_msg", "SubAdmin Details Updated Successfully. New Password Is "+password);
                            return res.redirect("/admin/manage/sub_admins");
                          }
                          if(response.messages[0].status != "0"){
                            req.flash("success_msg", "SubAdmin Details Updated Successfully. New Password Is "+password);
                            return res.redirect("/admin/manage/sub_admins");
                          }
                          req.flash("success_msg", "SubAdmin Details Updated Successfully");
                          res.redirect("/admin/manage/sub_admins");
                        }); 
                      }
                      
                      nexmo.message.sendSms(from, to, text, (err, response) => {
                        if(err){
                          req.flash("success_msg", "SubAdmin Details Updated Successfully. New Password Is "+password);
                          return res.redirect("/admin/manage/sub_admins");
                        }
                        if(response.messages[0].status != "0"){
                          req.flash("success_msg", "SubAdmin Details Updated Successfully. New Password Is "+password);
                          return res.redirect("/admin/manage/sub_admins");
                        }
                        req.flash("success_msg", "SubAdmin Details Updated Successfully");
                        res.redirect("/admin/manage/sub_admins");
                      }); 
                    });                
                  }
          
                  req.flash("error_msg", "Unable To Update SubAdmin Details, Try Again.");
                  res.redirect("/admin/manage/sub_admins");
          
                })
                .catch((err) => {
                  if(err){
                    console.log("Unable To Update SubAdmin Details, Try Again ", err);
                  }
                });
              });
            });
          }
  
          req.flash("error_msg", "Provided Detail(s) Already Exist");
          res.render("admin/updateSubAdmin", {
            username: req.body.userName,
            phoneNumber: req.body.phone,
            subAdminId: req.params.id
          });
        }

        var newSubAdmins = subAdmins.filter(subAdmin => subAdmin.username === updateDetails.username || subAdmin.mobileNumber === "+233"+mobileNumber);
          if(newSubAdmins.length === 0){        
            return bcrypt.genSalt(10, (err, salt) => {
              if(err){
                return fs.unlink("./public/img/user-images/subAdmins-image/"+imageName, (err) => {
                  if(err){
                    req.flash("error_msg", "An Error Occured, Try Again");
                    return res.render("admin/updateSubAdmin", {
                      username: req.body.userName,
                      phoneNumber: req.body.phone,
                      subAdminId: req.params.id
                    });
                  }
                  req.flash("error_msg", "Unable To Update SubAdmin\'s Details, Try Again");
                  res.render("admin/updateSubAdmin", {
                    username: req.body.userName,
                    phoneNumber: req.body.phone,
                    subsubAdminId: req.params.idAdminId
                  });
                });
              }
          
              bcrypt.hash(updateDetails.password, salt, (err, hash) => {
                if(err){
                  return fs.unlink("./public/img/user-images/subAdmins-image/"+imageName, (err) => {
                    if(err){
                      req.flash("error_msg", "An Error Occured, Try Again");
                      return res.render("admin/updateSubAdmin", {
                        username: req.body.userName,
                        phoneNumber: req.body.phone,
                        subAdminId: req.params.id
                      });
                    }
                    req.flash("error_msg", "Unable To Update SubAdmin\'s Details, Try Again");
                    res.render("admin/updateSubAdmin", {
                      username: req.body.userName,
                      phoneNumber: req.body.phone,
                      subAdminId: req.params.id
                    });
                  });
                }
          
                updateDetails.password = hash;
                
                SubAdmin.findByIdAndUpdate(subAdminId, {
                  $set: {
                    username: updateDetails.username,
                    mobileNumber: "+233"+updateDetails.mobileNumber.substring(1, 10),
                    password: updateDetails.password,
                    imagePath: imageName
                  }
                }, {new: true}).then((updatedDetails) => {
                  if(updatedDetails){
                    var to = "+233"+updateDetails.mobileNumber.substring(1, 10);
                    var from = "GHAMSU-MGR";
                    var text = "Dear "+updateDetails.username+", Your Account On The Ghamsu App Has Been Updated. Your New Password Is "+password+". You Can Change The Password When You Login."
              
                    return fs.unlink("./public/img/user-images/subAdmins-image/"+req.body.subAdminImagePath, (err) => {
                      if(err){
                        return nexmo.message.sendSms(from, to, text, (err, response) => {
                          if(err){
                            req.flash("success_msg", "SubAdmin Details Updated Successfully. New Password Is "+password);
                            return res.redirect("/admin/manage/sub_admins");
                          }
                          if(response.messages[0].status != "0"){
                            req.flash("success_msg", "SubAdmin Details Updated Successfully. New Password Is "+password);
                            return res.redirect("/admin/manage/sub_admins");
                          }
                          req.flash("success_msg", "SubAdmin Details Updated Successfully");
                          res.redirect("/admin/manage/sub_admins");
                        }); 
                      }
                      
                      nexmo.message.sendSms(from, to, text, (err, response) => {
                        if(err){
                          req.flash("success_msg", "SubAdmin Details Updated Successfully. New Password Is "+password);
                          return res.redirect("/admin/manage/sub_admins");
                        }
                        if(response.messages[0].status != "0"){
                          req.flash("success_msg", "SubAdmin Details Updated Successfully. New Password Is "+password);
                          return res.redirect("/admin/manage/sub_admins");
                        }
                        req.flash("success_msg", "SubAdmin Details Updated Successfully");
                        res.redirect("/admin/manage/sub_admins");
                      }); 
                    });                
                  }
          
                  req.flash("error_msg", "Unable To Update SubAdmin Details, Try Again.");
                  res.redirect("/admin/manage/sub_admins");
          
                })
                .catch((err) => {
                  if(err){
                    console.log("Unable To Update SubAdmin Details, Try Again ", err);
                  }
                });
              });
            });
          }
  
          req.flash("error_msg", "Provided Detail(s) Already Exist");
          res.render("admin/updateSubAdmin", {
            username: req.body.userName,
            phoneNumber: req.body.phone,
            subAdminId: req.params.id
          });
      })
      .catch((err) => {
        if(err){
          console.log("Unable To Fetch SubAdmin Details", err);
        }
      });
    }
    
    if(isObject(req.file) === false){
      var subAdminId = req.params.id;    
      var password = updateDetails.password;
      var mobileNumber = updateDetails.mobileNumber.substring(1, 10);

      return SubAdmin.find({"_id": {$ne: subAdminId}}).then((subAdmins) => {
        if(subAdmins.length > 0){
          var newSubAdmins = subAdmins.filter(subAdmin => subAdmin.username === updateDetails.username || subAdmin.mobileNumber === "+233"+mobileNumber);

          if(newSubAdmins.length === 0){        
            return bcrypt.genSalt(10, (err, salt) => {
              if(err){
                req.flash("error_msg", "Unable To Update SubAdmin Details, Try Again.");
                return res.redirect("/admin/manage/sub_admins");
              }
          
              bcrypt.hash(updateDetails.password, salt, (err, hash) => {
                if(err){
                  req.flash("error_msg", "Unable To Update SubAdmin Details, Try Again.");
                  return res.redirect("/admin/manage/sub_admins");
                }
          
                updateDetails.password = hash;
          
                SubAdmin.findByIdAndUpdate(subAdminId, {
                  $set: {
                    username: updateDetails.username,
                    mobileNumber: "+233"+updateDetails.mobileNumber.substring(1, 10),
                    password: updateDetails.password
                  }
                }, {new: true}).then((updatedDetails) => {
                  if(updatedDetails){
                    var to = "+233"+updateDetails.mobileNumber.substring(1, 10);
                    var from = "GHAMSU-MGR";
                    var text = "Dear "+updateDetails.username+", Your Account On The Ghamsu App Has Been Updated. Your New Password Is "+password+". You Can Change The Password When You Login."
              
                    return nexmo.message.sendSms(from, to, text, (err, response) => {
                      if(err){
                        req.flash("success_msg", "SubAdmin Details Updated Successfully. New Password Is "+password);
                        return res.redirect("/admin/manage/sub_admins");
                      }
                      if(response.messages[0].status != "0"){
                        req.flash("success_msg", "SubAdmin Details Updated Successfully. New Password Is "+password);
                        return res.redirect("/admin/manage/sub_admins");
                      }
                      req.flash("success_msg", "SubAdmin Details Updated Successfully");
                      res.redirect("/admin/manage/sub_admins");
                    });             
                  }
          
                  req.flash("error_msg", "Unable To Update SubAdmin Details, Try Again.");
                  res.redirect("/admin/manage/sub_admins");
          
                })
                .catch((err) => {
                  if(err){
                    console.log("Unable To Update SubAdmin Details, Try Again ", err);
                  }
                });
              });
            });
          }

          req.flash("error_msg", "Provided Detail(s) Already Exist");
          res.render("admin/updateSubAdmin", {
            username: req.body.userName,
            phoneNumber: req.body.phone,
            subAdminId: req.params.id
          });
        }

        var newSubAdmins = subAdmins.filter(subAdmin => subAdmin.username === updateDetails.username || subAdmin.mobileNumber === "+233"+mobileNumber);

          if(newSubAdmins.length === 0){        
            return bcrypt.genSalt(10, (err, salt) => {
              if(err){
                req.flash("error_msg", "Unable To Update SubAdmin Details, Try Again.");
                return res.redirect("/admin/manage/sub_admins");
              }
          
              bcrypt.hash(updateDetails.password, salt, (err, hash) => {
                if(err){
                  req.flash("error_msg", "Unable To Update SubAdmin Details, Try Again.");
                  return res.redirect("/admin/manage/sub_admins");
                }
          
                updateDetails.password = hash;
          
                SubAdmin.findByIdAndUpdate(subAdminId, {
                  $set: {
                    username: updateDetails.username,
                    mobileNumber: "+233"+updateDetails.mobileNumber.substring(1, 10),
                    password: updateDetails.password
                  }
                }, {new: true}).then((updatedDetails) => {
                  if(updatedDetails){
                    var to = "+233"+updateDetails.mobileNumber.substring(1, 10);
                    var from = "GHAMSU-MGR";
                    var text = "Dear "+updateDetails.username+", Your Account On The Ghamsu App Has Been Updated. Your New Password Is "+password+". You Can Change The Password When You Login."
              
                    return nexmo.message.sendSms(from, to, text, (err, response) => {
                      if(err){
                        req.flash("success_msg", "SubAdmin Details Updated Successfully. New Password Is "+password);
                        return res.redirect("/admin/manage/sub_admins");
                      }
                      if(response.messages[0].status != "0"){
                        req.flash("success_msg", "SubAdmin Details Updated Successfully. New Password Is "+password);
                        return res.redirect("/admin/manage/sub_admins");
                      }
                      req.flash("success_msg", "SubAdmin Details Updated Successfully");
                      res.redirect("/admin/manage/sub_admins");
                    });             
                  }
          
                  req.flash("error_msg", "Unable To Update SubAdmin Details, Try Again.");
                  res.redirect("/admin/manage/sub_admins");
          
                })
                .catch((err) => {
                  if(err){
                    console.log("Unable To Update SubAdmin Details, Try Again ", err);
                  }
                });
              });
            });
          }

          req.flash("error_msg", "Provided Detail(s) Already Exist");
          res.render("admin/updateSubAdmin", {
            username: req.body.userName,
            phoneNumber: req.body.phone,
            subAdminId: req.params.id
          });
      })
      .catch((err) => {
        if(err){
          console.log("Unable To Fetch SubAdmin Details", err);
        }
      });
    }
  });  
});

router.delete("/delete/sub_admin", ensureAdminAuthentication, (req, res) => {
  var subAdminId = req.body.subAdminId;

  SubAdmin.findByIdAndRemove(subAdminId).then((response) => {
    if(response){
      return fs.unlink("./public/img/user-images/subAdmins-image/"+response.imagePath, (err) => {
        if(err){
          console.log("Unable To Remove SubAdmins\'s Image", err);
          req.flash("success_msg", "SubAdmin Deleted Successfully");
          return res.redirect("/admin/manage/sub_admins");
        }
        req.flash("success_msg", "SubAdmin Deleted Successfully");
        res.redirect("/admin/manage/sub_admins");
      });
    }
    req.flash("error_msg", "Unable To Delete SubAdmin, Try Again");
    res.redirect("/admin/manage/sub_admins");
  })
  .catch((err) => {
    if(err){
      console.log("Error Removing SubAdmin", err);
    }
  });
});

module.exports = router;