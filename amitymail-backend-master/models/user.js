const mongoose = require("mongoose");
const validator = require("validator");
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    // required: true,
  },
  // profile_pic:{
  //     type:String
  // },
  emailId: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: (value) => {
      return validator.isEmail(value);
    },
  },
  password: {
    type: String,
    // required: true
  },
  resettoken: {
    type: String,
  },

  deviceInfo: Object,
  isDisabled: Boolean,
  createdAt: Date,
  updatedAt: Date,
});
let jwt = require("jsonwebtoken");
const secret = require("../private/secret");

userSchema.methods.generateJwt = function () {
  let expiry = new Date();
  expiry.setDate(expiry.getDate() + 1);

  return jwt.sign(
    {
      _id: this._id,
      emailId: this.emailId,
      name: this.name,
      roles: this.roles,
      exp: parseInt(expiry.getTime() / 1000),
    },
    secret
  ); // DO NOT KEEP YOUR SECRET IN THE CODE!
};

module.exports = mongoose.model("users", userSchema);
