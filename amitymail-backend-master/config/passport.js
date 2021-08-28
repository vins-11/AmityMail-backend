let passport = require('passport');
let LocalStrategy = require('passport-local').Strategy;
let db  = require('../private/db');
let UserModel = require('../models/user');
let bcrypt = require('bcryptjs');

passport.use(new LocalStrategy({
        usernameField: 'emailId'
    },
    function(emailId, password, done) {
    console.log(password);
        UserModel.findOne({ $or:[{ emailId: emailId},{ mobNo: emailId}]}, function (err, user) {
            if (err) { return done(err); }
            if (!user) {
                return done(null, false, {
                    message: 'User not found'
                });
            }
            // Return if password is wrong
            console.log(user);
            bcrypt.compare(password, user.password, function(err, result) {
                console.log(err);
                console.log(result);
                console.log("Inside bcrypt");
                if(!result) {
                    return done(null, false, {
                        message: 'Password is wrong'
                    });
                }else{
                    return done(null, user);
                }
            });
            // If credentials are correct, return the user object

        });
    }
));
