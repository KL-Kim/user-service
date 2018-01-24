import passport from 'passport';
import httpStatus from 'http-status'

import BaseController from './base.controller';
import APIError from '../helper/api-error';
import JwtManager from '../helper/jwt.manager';

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
		passport.authenticate('local-login', { session: false }, function(err, user, info) {
			if (err) return next(err);
			if (info) return next(new APIError(info.message, httpStatus.UNAUTHORIZED));

			user.update({ lastLoginAt: Date.now() })
				.exec((err, result) => {
					if (err) next(err);

					that._jwtManager.signToken(user.id)
						.then((token) => {
							res.cookie('jwt', token, {
								expires: new Date(Date.now() + 60 * 1000),
								httpOnly: true
							});
							return res.json({
								user: user,
								token: token
							});
					});
				})
				.catch((err) => {
					return next(err);
				});
		})(req, res, next);
	}

	/**
	 * User log out and revoke token
	 * @role *
	 * @returns {true}
	 */
	logout(req, res, next) {
		const that = this;
		passport.authenticate('jwt-rs', function(err, result, info) {
			if (err) return next(err);
			if (info) return next(new APIError(info.message, httpStatus.UNAUTHORIZED));

			if (result) {
				that._jwtManager.revokeToken(result.payload.tid)
				.then((revokeToken) => {
					if (revokeToken)
						return res.json({ok: 1});
				}).catch((err) => {
					return next(err);
				});
			}
			return ;
		})(req, res, next);
	}
}

export default AuthController;
