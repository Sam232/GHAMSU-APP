const express = require("express");
const {mongooseConnect} = require("./config/database");
const exphbs = require("express-handlebars");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const path = require("path");

const admin = require("./routes/admin");
const subAdmin = require("./routes/subAdmin");

require("./config/passport")(passport);

const app = express();

mongooseConnect();

//Express Handlebars Middleware
app.engine("handlebars", exphbs({
  defaultLayout: "main"
}));

app.set("view engine", "handlebars");

//Body Parser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

//Connect Flash Middleware
app.use(flash());

//Express Session Middleware
app.use(session({
  secret: "secret",
  resave: true,
  saveUninitialized: true
}));

//Passport Initialization
app.use(passport.initialize());
app.use(passport.session());

//Method Override Middleware
app.use(methodOverride("_method"));

//Express Static Directory
app.use(express.static(path.join(__dirname, "/public")));

//Global Variables
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  res.locals.deletedSubAdmin = req.flash("delete_msg"); 
 
  if(req.user){
    if(req.user.role === "mainAdmin"){
      res.locals.mainAdmin = req.user;
      res.locals.subAdmin = false;
      res.locals.noUser = true;
      return next();
    }
    if(req.user.role === "SubAdmin"){
      res.locals.subAdmin = req.user;
      res.locals.mainAdmin = false;
      res.locals.noUser = true;
      return next();
    }
  }
  
  res.locals.noUser = false;
  next();
});
                                                                                                  
//Express Router
app.use("/admin", admin);
app.use("/subadmin", subAdmin);

//404 Not Found
app.use((req, res, next) => {
  res.status(404).render("notFound");
})

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});