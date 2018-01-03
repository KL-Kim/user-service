import passport from 'passport';

import BaseController from './base.controller';
import APIError from '../helper/APIError';
import JwtManager from '../config/jwt.config';
const User = require('../models/user.model');

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
			if (err || info) return next(err || info);

			user.update({ lastLoginAt: Date.now() })
				.exec((err, result) => {
					if (err) next(err);

					that._jwtManager.signToken(user.id)
						.then((token) => {
							return res.json({
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
			if (err || info) return next(err || info);

			if (result) {
				that._jwtManager.revokeToken(result.payload.tid)
				.then((revokeToken) => {
					if (revokeToken)
						return res.json("Log out successfully");
					else
						return next();
				}).catch((err) => {
					return next(err);
				});
			}
			return ;
		})(req, res, next);
	}
}

export default AuthController;