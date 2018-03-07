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
passport.use('local-register', new LocalStrategy(credentialOptions, (email, password, done) => {
	User.getByEmail(email).then((user) => {
		if (user) {
			return done(new APIError("The email already exists", httpStatus.CONFLICT));
		} else {
			return done();
		}
	});
}));

// Login passport-local strategy
passport.use('local-login', new LocalStrategy(credentialOptions, (email, password, done) => {
	User.getByEmail(email).then((user) => {
		if (!user)
			return done(new APIError("Invalid email or password", httpStatus.UNAUTHORIZED));

		user.isValidPassword(password).then((isMatch) => {
			if (!isMatch) {
				return done(new APIError("Invalid email or password", httpStatus.UNAUTHORIZED));
			} else {
				return done(null, user);
			}
		});
	});

	// User.findOne({ email: email }, (err, user) => {
	// 	if (err) return done(err);
  //
	// 	user.isValidPassword(password).then((isMatch) => {
	// 		if (!isMatch) {
	// 			return done(new APIError("Invalid email or password", httpStatus.UNAUTHORIZED));
	// 		} else {
	// 			return done(null, user);
	// 		}
	// 	});
	// });
}));

// Extract refresh token from cookie.
const cookieExtractor = (req) => {
	var token = null;
	if (req && req.cookies) token = req.cookies['refresh-token'];
	return token;
};

// Passport-jwt refresh token strategy options
const refreshTokenOptions = {};
refreshTokenOptions.jwtFromRequest = cookieExtractor;
refreshTokenOptions.secretOrKey = config.refreshTokenPublicKey;
refreshTokenOptions.algorithm = config.refreshTokenOptions.algorithm;
refreshTokenOptions.issuer = config.refreshTokenOptions.issuer || '';
refreshTokenOptions.audience = config.refreshTokenOptions.audience || '';
refreshTokenOptions.jsonWebTokenOptions = {
	expiresIn: config.refreshTokenOptions.expiresIn
};

passport.use('refresh-token', new JwtStrategy(refreshTokenOptions, (payload, done) => {
	User.getById(payload.uid).then((user) => {
		if (user) {
			return done(null, {
				payload: payload,
				user: user
			}, false);
		} else {
			return done(new APIError("User do not exists", httpStatus.NOT_FOUND));
		}
	});
}));

// Passport-jwt access token strategy options
const accessTokenOptions = {};
accessTokenOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
accessTokenOptions.secretOrKey = config.accessTokenPublicKey;
accessTokenOptions.algorithm = config.accessTokenOptions.algorithm;
accessTokenOptions.issuer = config.accessTokenOptions.issuer || '';
accessTokenOptions.audience = config.accessTokenOptions.audience || '';
accessTokenOptions.jsonWebTokenOptions = {
	expiresIn: config.accessTokenOptions.expiresIn
};

passport.use('access-token', new JwtStrategy(accessTokenOptions, (payload, done) =>{
	User.getById(payload.uid).then((user) => {
		if (user) {
			return done(null, user, false);
		} else {
			return done(new APIError("User do not exists", httpStatus.NOT_FOUND));
		}
	});
}));

export default passport;
