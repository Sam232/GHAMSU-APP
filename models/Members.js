const mongoose = require("mongoose");

var Schema = mongoose.Schema;

var MembersSchema = new Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  gender: {
    type: String,
    required: true
  },
  institution:{
    type: String,
    required: true
  },
  programme: {
    type: String,
    required: true
  },
  nationality: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  dob: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  mobileNumber: {
    type: String,
    required: true
  },
  portfolio: {
    type: String,
    required: true
  },
  imagePath: {
    type: String,
    required: true
  }
});

var Members = mongoose.model("members", MembersSchema);

module.exports = {Members};