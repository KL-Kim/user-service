import passport from 'passport';
import httpStatus from 'http-status';
import ms from 'ms';

import BaseController from './base.controller';
import APIError from '../helper/api-error';
import JwtManager from '../helper/jwt.manager';
import config from '../config/config';

class AuthController extends BaseController {
	constructor() {
		super();
		this._jwtManager = new JwtManager();
	}

	/**
 		* User login and return a token
 		* @role *
 		* @returns {token}
 		*/
	login(req, res, next) {
		const that = this;
		passport.authenticate('local-login', { session: false }, (err, user, info) => {
			if (err) return next(err);
			if (info) return next(new APIError(info.message, httpStatus.UNAUTHORIZED));

			const lastLogin = {
				agent: req.useragent.browser,
				ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
			 	time: Date.now(),
			};

			user.lastLogin.push(lastLogin);

			user.save((err, result) => {
				if (err) return next(err);

				that._jwtManager.signToken('refresh', user.id)
					.then((refreshToken) => {
						res.cookie(config.refreshTokenCookieKey, refreshToken, {
							"maxAge": ms(config.refreshTokenOptions.expiresIn),
							"httpOnly": true,
						});

						return user.id;
					}).then((uid) => {
						return that._jwtManager.signToken('access', uid);
					}).then((accessToken) => {
						return res.json({
							"user": user,
							"token": accessToken
						});
					}).catch((err) => {
						return next(err);
					});
			});
		})(req, res, next);
	}

	/**
	 * Issue access Token
	 * @returns {token}
	 */
	 issueAccessToken(req, res, next) {
		const that = this;
		passport.authenticate('refresh-token', { session: false }, (err, result, info) => {
			if (err) return next(err);
			if (info) return next(new APIError(info.message, httpStatus.UNAUTHORIZED));

			that._jwtManager.signToken('access', result.user.id).then((token) => {
				return res.json({
					"token": token,
				});
			}).catch((err) => {
				return next(err);
			});
		})(req, res, next);
	 }

	/**
	 * User log out and revoke token
	 * @role *
	 * @returns {object}
	 */
	logout(req, res, next) {
		const that = this;
		passport.authenticate('refresh-token', { session: false }, (err, result, info) => {
			if (err) return next(err);
			if (info) return next(new APIError(info.message, httpStatus.UNAUTHORIZED));

			if (result) {
				that._jwtManager.revokeRefreshToken(result.payload.tid)
				.then((revokeToken) => {
					if (revokeToken)
						return res.status(204).json({status: 'ok'});
				}).catch((err) => {
					return next(err);
				});
			}
		})(req, res, next);
	}

	/**
	 * Verify account
	 * @role *
	 * @returns {none}
	 */
	accountVerification(req, res, next) {
		// Check jwt token, and account is verified if sign is true.
		passport.authenticate('access-token', { session: false }, (err, user, info) => {
			if (err) return next(err);
			if (info) return next(new APIError(info.message, httpStatus.UNAUTHORIZED));

			if (user.isVerified) {
				return res.status(200).json({
					"user": user
				});
			} else {
				user.update({ isVerified: true }, (err, user) => {
					if (err) return next(err);

					if (user)
						return res.status(200).json({
							"user": user
						});
				});
			}
		})(req, res, next);
	}

	/**
	 * Change password
	 * @role *
	 * @returns {none}
	 */
	changePassword(req, res, next) {
		// Check jwt token, and set new password if sign is true.
		return res.json("change passwore goes here");
	}
}

export default AuthController;
