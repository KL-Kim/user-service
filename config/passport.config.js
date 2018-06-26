/**
 * Passport local & Passport jwt Config
 *
 * @version 0.0.1
 *
 * @author KL-Kim (https://github.com/KL-Kim)
 * @license MIT
 */

import passport from 'passport';
import httpStatus from 'http-status';
import _ from 'lodash';
const LocalStrategy = require('passport-local').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

import config from './config';
import APIError from '../helper/api-error';
import User from '../models/user.model';

const credentialOptions = {
	usernameField: 'email',
	passwordField: 'password',
	session: false,
};

// Sign up passport-local strategy
passport.use('local-register', new LocalStrategy(credentialOptions, (email, password, done) => {
	User.getByEmail(email)
		.then((user) => {
			if (user) {
				return done(new APIError("The email already exists", httpStatus.CONFLICT));
			} else {
				return done(null);
			}
		}).catch(err => {
			return done(err);
		});
}));

// Login passport-local strategy
passport.use('local-login', new LocalStrategy(credentialOptions, (email, password, done) => {
	const that = {};

	User.getByEmail(email)
		.then((user) => {
			if (_.isEmpty(user))
				return done(new APIError("Invalid email or password", httpStatus.UNAUTHORIZED));

			that.user = user;

			return user.isValidPassword(password);
		})
		.then((isMatch) => {
			if (isMatch) {
				return done(null, that.user);
			} else {
				return done(new APIError("Invalid email or password", httpStatus.UNAUTHORIZED));
			}
		}).catch(err => {
			return done(err);
		});
}));

// Extract refresh token from cookie.
const cookieExtractor = (req) => {
	var token = null;
	if (req && req.cookies) token = req.cookies[config.refreshTokenCookieKey];
	return token;
};

// Passport-jwt refresh token strategy options
const refreshTokenOptions = {
	"jwtFromRequest": cookieExtractor,
	"secretOrKey": config.refreshTokenPublicKey,
	"algorithm": config.refreshTokenOptions.algorithm,
	"issuer": config.refreshTokenOptions.issuer || '',
	"audience": config.refreshTokenOptions.audience || '',
	"jsonWebTokenOptions": {
		"expiresIn": config.refreshTokenOptions.expiresIn,
	},
};

passport.use('refresh-token', new JwtStrategy(refreshTokenOptions, (payload, done) => {
	User.getById(payload.uid)
		.then((user) => {
			if (_.isEmpty(user)) return done(new APIError("User do not exists", httpStatus.NOT_FOUND));
 
			return done(null, {
				payload: payload,
				user: user
			}, false);
		}).catch(err => {
			return done(err);
		});
}));

// Passport-jwt access token strategy options
const accessTokenOptions = {
	"jwtFromRequest": ExtractJwt.fromAuthHeaderAsBearerToken(),
	"secretOrKey": config.accessTokenPublicKey,
	"algorithm": config.accessTokenOptions.algorithm,
	"issuer": config.accessTokenOptions.issuer || '',
	"audience": config.accessTokenOptions.audience || '',
	"jsonWebTokenOptions": {
		"expiresIn": config.accessTokenOptions.expiresIn
	},
};

passport.use('access-token', new JwtStrategy(accessTokenOptions, (payload, done) => {
	User.getById(payload.uid)
		.then(user => {
			if (user) {
				return done(null, user, false);
			} else {
				return done(new APIError("User do not exists", httpStatus.NOT_FOUND));
			}
		}).catch(err => {
			return done(err);
		});
}));

export default passport;
