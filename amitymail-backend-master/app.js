let createError = require("http-errors");
let express = require("express");
let path = require("path");
let cookieParser = require("cookie-parser");
let logger = require("morgan");
let bodyParser = require("body-parser");
let passport = require("passport");
let userRouter = require("./routes/userRoute");
let MailRouter = require("./routes/mailRoutes");
let cors = require("cors");
const multer = require("multer");

require("./config/passport");
let storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, DIR);
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});
let upload = multer({ storage: storage });

let app = express();
app.get("/", (req, res, next) => {
  res.write("All is well!");
  res.end();
});
app.use(cors());

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(passport.initialize({}));

app.use("/user", userRouter);
app.use("/mail", MailRouter);
const DIR = "./public/uploads/images";

app.post("/upload", upload.single("photo"), function (req, res) {
  if (!req.file) {
    console.log("No file received");
    return res.send({
      success: false,
    });
  } else {
    console.log("file received");
    return res.send({
      success: true,
      fileName: req.file.filename,
    });
  }
});

// catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   console.log('error capturedhere');
//   next(createError(404));
// });
app.use(function (err, req, res, next) {
  console.log(err);
  console.log("error capturedhere");
  if (err.name === "UnauthorizedError") {
    console.log("JWT Access Denied");
    res.status(401);
    res.json({ code: 401, name: err.name, msg: err.message });
  }
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
