let express = require("express");
let router = express.Router();
let MailModel = require("../models/mail");
let UserModel = require("../models/user");
let secret = require("../private/secret");
let jwt = require("express-jwt");
const mail = require("../models/mail");
let auth = jwt({
  secret: secret,
  userProperty: "payload",
});

router.post("/sendMail", auth, function (req, res, next) {
  if (req.body.to == "") {
    res.status(401);
    res.json({
      code: 3,
      message: "To is required.",
    });
    return;
  }
  if (req.body.subject == "") {
    res.status(401);
    res.json({
      code: 3,
      message: "Subject is required.",
    });
    return;
  }
  if (req.body.body == "") {
    res.status(401);
    res.json({
      code: 3,
      message: "Message is required.",
    });
    return;
  }
  req.body.createdAt = new Date().toISOString();
  req.body.updatedAt = new Date().toISOString();
  req.body.from = req.payload._id;
  let mail = new MailModel(req.body);
  console.log(req.body);
  mail
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

router.get("/inboxMail", auth, async (req, res, next) => {
  if (!req.payload._id) {
    res.status(401).json({
      code: 401,
      name: "UnauthorizedError",
      msg: "Access Denied.",
    });
  } else {
    var { pageNo = 1, size = 1000, skip, limit, ...params } = req.query;
    pageNo = req.query.hasOwnProperty("pageNo")
      ? parseInt(req.query.pageNo)
      : 1;
    size = req.query.size ? parseInt(req.query.size) : 1000;
    if (pageNo <= 0) {
      pageNo = 1;
    }
    if (req.query.limit) {
      limit = size = parseInt(req.query.limit);
    } else {
      limit = size;
    }
    skip = size * (pageNo - 1);
    let whereData = {};
    for (const [key, value] of Object.entries(params)) {
      whereData[key] = value;
    }
    whereData.to = req.payload._id;
    whereData.is_deleted = false;
    let unreadCount = await MailModel.count({
      to: req.payload._id,
      is_deleted: false,
      is_read: false,
    });
    let count = await MailModel.count({
      to: req.payload._id,
      is_deleted: false,
    });
    MailModel.find(whereData)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .then((doc) => {
        res.json({ mails: doc, unreadCount: unreadCount, count: count });
      })
      .catch((err) => {
        console.log("Something wrong when updating data!");
        console.log(err);
        res.status(400);
        res.json({ code: err.code, name: err.name, msg: err.errmsg });
      });
  }
});
router.get("/getsentMail", auth, async (req, res, next) => {
  if (!req.payload._id) {
    res.status(401).json({
      code: 401,
      name: "UnauthorizedError",
      msg: "Access Denied.",
    });
  } else {
    var { pageNo = 1, size = 1000, skip, limit, ...params } = req.query;
    pageNo = req.query.hasOwnProperty("pageNo")
      ? parseInt(req.query.pageNo)
      : 1;
    size = req.query.size ? parseInt(req.query.size) : 1000;
    if (pageNo <= 0) {
      pageNo = 1;
    }
    if (req.query.limit) {
      limit = size = parseInt(req.query.limit);
    } else {
      limit = size;
    }
    skip = size * (pageNo - 1);
    let whereData = {};
    for (const [key, value] of Object.entries(params)) {
      whereData[key] = value;
    }
    whereData.from = req.payload._id;
    whereData.is_deleted = false;
    let unreadCount = await MailModel.count({
      to: req.payload._id,
      is_deleted: false,
      is_read: false,
    });
    let count = await MailModel.count({
      to: req.payload._id,
      is_deleted: false,
    });
    MailModel.find(whereData)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .then((doc) => {
        res.json({ mails: doc, unreadCount: unreadCount, count: count });
      })
      .catch((err) => {
        console.log("Something wrong when updating data!");
        console.log(err);
        res.status(400);
        res.json({ code: err.code, name: err.name, msg: err.errmsg });
      });
  }
});

router.get("/mail_view", auth, (req, res, next) => {
  if (!req.payload._id) {
    res.status(401).json({
      code: 401,
      name: "UnauthorizedError",
      msg: "Access Denied.",
    });
  } else {
    let mailId = req.query.mailId;
    MailModel.findOne({ _id: mailId })
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

router.post("/update_mail", auth, (req, res, next) => {
  if (!req.payload._id) {
    res.status(401).json({
      code: 401,
      name: "UnauthorizedError",
      msg: "Access Denied.",
    });
  } else {
    let mailId = req.body.mailId;
    MailModel.findOneAndUpdate(
      { _id: mailId },
      { $set: { is_starred: true } },
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

module.exports = router;
