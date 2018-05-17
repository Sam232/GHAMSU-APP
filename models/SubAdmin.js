const mongoose = require("mongoose");

var Schema = mongoose.Schema;

var SubAdminSchema = new Schema({
  username: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  institution: {
    type: String,
    required: true
  },
  mobileNumber: {
    type: String,
    required: true
  },
  imagePath: {
    type: String,
    required: true
  },
  members: {
    type: Number,
    required: false,
    default: 0
  },
  role: {
    type: String,
    default: "SubAdmin"
  }
});

var SubAdmin = mongoose.model("subadmin", SubAdminSchema);

module.exports = {SubAdmin};