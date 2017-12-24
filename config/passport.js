import passport from 'passport';
const LocalStrategy = require('passport-local').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

import UserController from '../controller/user.controller';
import AuthController from '../controller/auth.controller';
import User from '../models/user.model';

const userController = new UserController();
const authController = new AuthController();

const credentialOptions = {
	usernameField: 'email',
	passwordField: 'password',
	session: false,
	passReqToCallback: true
};

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

// used to deserialize the user
passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

// Sign up passport-local strategy
passport.use('local-signup', new LocalStrategy({
	usernameField: 'email',
	passwordField: 'password',
	session: false,
	passReqToCallback: true
}, userController.createNewUser));

// Login passport-local strategy
passport.use('local-login', new LocalStrategy({
	usernameField: 'email',
	passwordField: 'password',
	session: false,
}, authController.login));

export default passport;