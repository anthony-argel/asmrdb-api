//passport.js

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

const passportJWT = require("passport-jwt");
const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;

const User = require('./models/user');

passport.use(new JWTStrategy({
        jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
        secretOrKey : process.env.SECRET
    },
    function (jwtPayload, cb) {
        return User.findById(jwtPayload.user._id)
            .then(user => {
                return cb(null, user);
            })
            .catch(err => {
                return cb(err);
            });
    }
));

passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password'
    },
    (username, password, done) => {
        User.findOne({email :username }, function (err, user) {
            if(err) {return done(err);}
            if(!user) {return done(null, false);}
            bcrypt.compare(password, user.password, (err, res) => {
                if(err) {return done(null, false, {message:'failed to compare passwords'})}
                if(res) {
                    return done(null, user);
                }
                else {
                    return done(null, false, {message:'incorrect password'});
                }
            });
        })
    }
))
