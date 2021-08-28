const mongoose = require("mongoose");
const validator = require("validator");
const contactSchema = new mongoose.Schema({
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
  message: {
    type: String,
    // required: true
  },
  isDisabled: Boolean,
  createdAt: Date,
  updatedAt: Date,
});

module.exports = mongoose.model("contactUs", contactSchema);
