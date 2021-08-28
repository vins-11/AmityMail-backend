const mongoose = require("mongoose");
const validator = require("validator");
var Schema = mongoose.Schema,
  ObjectId = Schema.ObjectId;
const mailSchema = new mongoose.Schema({
  to: {
    type: ObjectId,
    required: true,
    ref: "users",
  },
  from: {
    type: ObjectId,
    required: true,
    ref: "users",
  },
  subject: {
    type: String,
    required: true,
  },
  body: {
    type: String,
    required: true,
  },
  is_read: {
    type: Boolean,
    default: false,
  },
  is_from_read: {
    type: Boolean,
    default: false,
  },
  is_starred: {
    type: Boolean,
    default: false,
  },
  is_deleted: {
    type: Boolean,
    default: false,
  },
  createdAt: Date,
  updatedAt: Date,
});
var autoPopulateListing = function (next) {
  this.populate("to");
  this.populate("from");
  return next();
};
mailSchema
  .pre("findOne", autoPopulateListing)
  .pre("find", autoPopulateListing)
  .pre("findOneAndUpdate", autoPopulateListing);
module.exports = mongoose.model("mails", mailSchema);
