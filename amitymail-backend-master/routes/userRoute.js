let express = require("express");
let router = express.Router();
let UserModel = require("../models/user");
let contactUSModel = require("../models/contact");
let db = require("../private/db");
let bcrypt = require("bcryptjs");
var passport = require("passport");
let secret = require("../private/secret");
let jwt = require("express-jwt");
let auth = jwt({
  secret: secret,
  userProperty: "payload",
});

router.post("/register", function (req, res, next) {
  if (req.body.name == "") {
    res.status(401);
    res.json({
      code: 3,
      message: "Name is required.",
    });
    return;
  }
  if (req.body.emailId == "") {
    res.status(401);
    res.json({
      code: 3,
      message: "EmailId is required.",
    });
    return;
  }

  const rex =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  let emailRight = rex.test(String(req.body.emailId).toLowerCase());
  if (emailRight == false) {
    res.status(401);
    res.json({
      code: 3,
      message: "EmailId is not valid.",
    });
    return;
  }
  if (req.body.password == "") {
    res.status(401);
    res.json({
      code: 3,
      message: "Password is required.",
    });
    return;
  }
  var re =
    /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (re.test(req.body.emailId)) {
    //Email valid. Procees to test if it's from the right domain (Second argument is to check that the string ENDS with this domain, and that it doesn't just contain it)
    if (
      req.body.emailId.indexOf(
        "@amity.com",
        req.body.emailId.length - "@amity.com".length
      ) !== -1
    ) {
      //VALID
      console.log("VALID");
      let userData = req.body;
      UserModel.findOne({ emailId: userData.emailId.toLowerCase() }).then(
        (user) => {
          if (user) {
            res.status(401);
            res.json({
              code: 3,
              message: "EmailId already used by other user.",
            });
            return;
          }
        }
      );
      bcrypt
        .hash(userData.password, 10)
        .then((hash) => {
          console.log(hash);
          req.body.createdAt = new Date().toISOString();
          req.body.updatedAt = new Date().toISOString();
          req.body.isDisabled = false;
          req.body.password = hash;
          req.body.emailId = userData.emailId.toLowerCase();
          let user = new UserModel(req.body);
          console.log(req.body);
          user
            .save()
            .then((doc) => {
              res.json(doc);
            })
            .catch((err) => {
              console.log("error");
              console.error(err);
              res.status(400);
              res.json({ code: err.code, name: err.name, msg: err.errmsg });
            });
        })
        .catch((err) => {
          console.log("bcrypt error");
          console.log(err);
          res.status(400);
          res.json({ code: err.code, name: err.name, msg: err.errmsg });
        });
    } else {
      res.status(401);
      res.json({
        code: 3,
        message: "MailId register with @amity.com domain only .",
      });
      return;
    }
  }
});

router.post("/login", function (req, res, next) {
  let loginData = req.body;
  if (req.body.emailId == "") {
    res.status(401);
    res.json({
      code: 3,
      message: "EmailId is required.",
    });
    return;
  }
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  let emailRight = re.test(String(req.body.emailId).toLowerCase());
  if (emailRight == false) {
    res.status(401);
    res.json({
      code: 3,
      message: "EmailId is not valid.",
    });
    return;
  }
  if (req.body.password == "") {
    res.status(401);
    res.json({
      code: 3,
      message: "Password is required.",
    });
    return;
  }
  UserModel.findOne({ emailId: loginData.emailId }).then((user) => {
    if (!user) {
      res.status(401);
      res.json({
        code: 3,
        message: "EmailId not registered, please register.",
      });
      return;
    } else {
      UserModel.findOne({ emailId: loginData.emailId })
        .then((doc) => {
          if (doc) {
            passport.authenticate("local", {}, function (err, user, info) {
              let token;
              if (err) {
                console.log("HIIIIIIIIIIIIIIii");
                console.log(err);
                res.status(404);
                res.json(err);
                return;
              }
              if (user) {
                UserModel.findOneAndUpdate(
                  { emailId: loginData.emailId },
                  {
                    $set: {
                      deviceInfo: loginData.deviceInfo,
                      updatedAt: new Date().toISOString(),
                    },
                  },
                  { new: true, upsert: true }
                )
                  .then((doc) => {
                    token = user.generateJwt();
                    console.log(token);
                    res.status(200);
                    res.json({
                      roles: doc.roles,
                      token: token,
                    });
                  })
                  .catch(() => {
                    token = user.generateJwt();
                    console.log(token);
                    res.status(200);
                    res.json({
                      token: token,
                    });
                  });
              } else {
                console.log(info);
                res.status(401);
                res.json(info);
              }
            })(req, res);
          } else {
            res.status(401);
            res.json({
              code: 3,
              message: "User not found. Please Register.",
            });
          }
        })
        .catch((err) => {
          console.log(err);
          res.status(400);
          res.end("error");
        });
    }
  });
});

router.put("/update_profile", auth, (req, res, next) => {
  if (!req.payload._id) {
    res.status(401).json({
      code: 401,
      name: "UnauthorizedError",
      msg: "Access Denied.",
    });
  } else {
    let data = req.body;
    data.updatedAt = new Date().toISOString();
    UserModel.findOneAndUpdate(
      { _id: req.payload._id },
      { $set: data },
      { new: true }
    )
      .then((doc) => {
        console.log(doc);
        console.log("Document Updated");
        res.json(doc);
      })
      .catch((err) => {
        console.log("Something wrong when updating data!");
        console.log(err);
        res.status(400);
        res.json({ code: err.code, name: err.name, msg: err.errmsg });
      });
  }
});
router.get("/get_profile", auth, (req, res, next) => {
  if (!req.payload._id) {
    res.status(401).json({
      code: 401,
      name: "UnauthorizedError",
      msg: "Access Denied.",
    });
  } else {
    UserModel.findOne({ _id: req.payload._id })
      .then((doc) => {
        console.log(doc);
        console.log("Document Updated");
        res.json(doc);
      })
      .catch((err) => {
        console.log("Something wrong when updating data!");
        console.log(err);
        res.status(400);
        res.json({ code: err.code, name: err.name, msg: err.errmsg });
      });
  }
});
router.post("/changePassword", auth, function (req, res, next) {
  if (!req.payload._id) {
    res.status(401).json({
      code: 401,
      name: "UnauthorizedError",
      msg: "Access Denied.",
    });
  } else {
    if (
      req.body.newPassword.trim() !== "" &&
      req.body.renewPassword.trim() !== ""
    ) {
      if (req.body.newPassword === req.body.renewPassword) {
        bcrypt
          .hash(req.body.newPassword, 10)
          .then((hash) => {
            console.log(hash);
            UserModel.findOneAndUpdate(
              { _id: req.payload._id },
              { $set: { password: hash, updatedAt: new Date().toISOString() } },
              { upsert: true }
            )
              .then(() => {
                console.log("Password changed");
                res
                  .status(200)
                  .json({ code: 0, msg: "Password successfully changed" });
              })
              .catch((err) => {
                console.log("Error occurred in changing password.");
                res.status(401).json({
                  code: 3,
                  msg: "Error occurred in changing password",
                });
              });
          })
          .catch((err) => {
            console.log("bcrypt error");
            console.log(err);
            res.status(400);
            res.json({ code: err.code, name: err.name, msg: err.errmsg });
          });
      } else {
        console.log("Password mismatch");
        res.status(401);
        res.json({ code: 3, msg: "Password mismatch" });
      }
    } else {
      console.log("All fields are mandatory");
      res.status(401);
      res.json({ code: 3, msg: "All fields are mandatory" });
    }
  }
});
router.get("/get_to_addesses", (req, res, next) => {
  let emailId = req.query.emailId.trim().toLowerCase();
  if (emailId == "") {
    res.status(401);
    res.json({
      code: 3,
      message: "EmailId is required.",
    });
    return;
  }
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  let emailRight = re.test(String(emailId).toLowerCase());
  if (emailRight == false) {
    res.status(401);
    res.json({
      code: 3,
      message: "emailId is not valid.",
    });
    return;
  }
  UserModel.findOne({ emailId: emailId })
    .then((doc) => {
      if (!doc) {
        res.status(401);
        res.json({
          code: 3,
          message: "This mailId is not exist in our mail system",
        });
      }
      console.log(doc);
      console.log("Document Updated");
      res.json(doc);
    })
    .catch((err) => {
      console.log("Something wrong when updating data!");
      console.log(err);
      res.status(400);
      res.json({ code: err.code, name: err.name, message: err.errmsg });
    });
});

router.post("/contactUs",  function (req, res, next) {
  if (req.body.name == "") {
    res.status(401);
    res.json({
      code: 3,
      message: "name is required.",
    });
    return;
  }
  if (req.body.emailId == "") {
    res.status(401);
    res.json({
      code: 3,
      message: "emailId is required.",
    });
    return;
  }
  const rex =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  let emailRight = rex.test(String(req.body.emailId).toLowerCase());
  if (emailRight == false) {
    res.status(401);
    res.json({
      code: 3,
      message: "EmailId is not valid.",
    });
    return;
  }
  if (req.body.message == "") {
    res.status(401);
    res.json({
      code: 3,
      message: "message is required.",
    });
    return;
  }
  req.body.createdAt = new Date().toISOString();
  req.body.updatedAt = new Date().toISOString();
  let contact = new contactUSModel(req.body);
  console.log(req.body);
  contact
    .save()
    .then((doc) => {
      res.json(doc);
    })
    .catch((err) => {
      console.log("error");
      console.error(err);
      res.status(400);
      res.json({ code: err.code, name: err.name, msg: err.errmsg });
    });
});

module.exports = router;
