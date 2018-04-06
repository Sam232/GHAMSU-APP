const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");

const {Admin} = require("../models/Admin");
const {SubAdmin} = require("../models/SubAdmin");

module.exports = (passport) => {
  passport.use("local-admin", new LocalStrategy({usernameField: "username"}, (username, password, done) => {
    Admin.findOne({username}).then((user) => {
      if(user){
        return bcrypt.compare(password, user.password).then((res) => {
          if(res === true){
            return done(null, user);
          }
          done(null, false, {message: "Incorrect Admin Username Or Password Provided"});
        })
        .catch((err) => {
          done(null, false, {message: "Error Logging in, Try Again"});
        });
      }
      done(null, false, {message: "Incorrect Admin Username Or Password Provided"});
      })
      .catch((err) => {
        done(null, false, {message: "Error Logging in, Try Again"});
      });
    })
  );

  passport.use("local-subAdmin", new LocalStrategy({usernameField: "username"}, (username, password, done) => {
    SubAdmin.findOne({username}).then((user) => {
      if(user){
        return bcrypt.compare(password, user.password).then((res) => {
          if(res){
            return done(null, user);
          }
          done(null, false, {message: "Incorrect SubAdmin Username Or Password Provided"});
        });
      }
      done(null, false, {message: "Incorrect SubAdmin Username Or Password Provided"});
    })
    .catch((err) => {
      if(err){
        console.log(err);
      }
    });
  }));

  passport.serializeUser((user, done) => {
    done(null, {id: user.id, role: user.role});
  });

  passport.deserializeUser(({id, role}, done) => {
    if(role === "mainAdmin"){
      return Admin.findById(id, (err, user) => {
        done(err, user);
      });
    }

    SubAdmin.findById(id, (err, user) => {
      done(err, user);
    });    
  });
}

