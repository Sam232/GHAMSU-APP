const mongoose = require("mongoose");

var Schema = mongoose.Schema;
var AdminSchema = new Schema({
  username: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: "mainAdmin"
  }
});

var Admin = mongoose.model("admins", AdminSchema);

module.exports = {Admin};