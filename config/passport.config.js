/**
 * Passport local & Passport jwt Config
 * @export {passport}
 * @version 0.0.1
 */

import passport from 'passport';
import httpStatus from 'http-status';
const LocalStrategy = require('passport-local').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

import config from './config';
import APIError from '../helper/api-error';
import User from '../models/user.model';
import RevokedToken from '../models/revoked-token.model';

const credentialOptions = {
	usernameField: 'email',
	passwordField: 'password',
	session: false,
};

// Sign up passport-local strategy
passport.use('local-signup', new LocalStrategy(credentialOptions, function(email, password, done) {
	User.findOne({ email: email }).exec((err, user) => {
		if (err)
			return done(err);

		if (user) {
			return done(new APIError("The email already exists", httpStatus.CONFLICT));
		} else {
			return done(null);
		}

	}).catch((error) => {
		return done(error);
	});
}));

// Login passport-local strategy
passport.use('local-login', new LocalStrategy(credentialOptions, function(email, password, done) {
	User.findOne({ email: email }).exec((err, user) => {
		if (err)
			return done(err);

		if (!user)
			return done(new APIError("Invalid email or password", httpStatus.UNAUTHORIZED));

		user.isValidPassword(password).then((isMatch) => {
				if (!isMatch) {
					done(new APIError("Invalid email or password", httpStatus.UNAUTHORIZED));
				} else {
					done(null, user);
				}
			});
	}).catch((error) => {
		return done(error);
	});
}));

// Passport-jwt strategy
const jwtOptions = {};
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
jwtOptions.secretOrKey = config.jwtPublicKey;
jwtOptions.algorithm = config.jwtOptions.algorithm;
jwtOptions.issuer = config.jwtOptions.issuer || '';
jwtOptions.audience = config.jwtOptions.audience || '';
jwtOptions.jsonWebTokenOptions = {
	expiresIn: config.jwtOptions.expiresIn
};

passport.use('jwt-rs', new JwtStrategy(jwtOptions, function(jwt_payload, done) {
	User.findById(jwt_payload.uid).exec().then((user) => {
		if (user) {
			return done(null, {
				payload: jwt_payload,
				user: user
			}, false);
		} else {
			return done(new APIError("User do not exists", httpStatus.NOT_FOUND));
		}
	}).catch(err => {
		done(err, false, false)
	});
}));

export default passport;
