import Promise from 'bluebird';
import passport from 'passport';
import httpStatus from 'http-status';
import crypto from 'crypto';
import ms from 'ms';

import BaseController from './base.controller';
import APIError from '../helper/api-error';
import JwtManager from '../helper/jwt.manager';
import MailManager from '../helper/mail.manager';
import promiseFor from '../helper/promise-for';
import ac from '../config/rbac.config';
import User from '../models/user.model';

class UserController extends BaseController {
	constructor() {
		super();
		this._jwtManager = new JwtManager();
		this._mailManager = new MailManager();
	}

	/**
	 * Get users list
	 * @role admin
	 * @property {number} req.query.skip - Number of users to be skipped.
	 * @property {number} req.query.limit - Limit number of users to be returned.
	 * @returns {User[]}
	 */
	getUsersList(req, res, next) {
		const { limit = 50, skip = 0 } = req.query;
		UserController.authenticate(req, res, next)
		.then((user) => {
			const permission = ac.can(user.role).readAny('profile');

			if (permission.granted) {
				return User.getUsersList({ limit, skip });
			} else {
				return next(new APIError("Permission denied", httpStatus.FORBIDDEN));
			}
		})
		.then(users => res.json(users))
		.catch((err) => {
			return next(err);
		});
	}

	/**
	 * Get user by id
	 * @role admin, regular user ownself
	 * @property {OjectId} req.params.id - user's id in url path
	 * @returns {User}
	 */
	getUserById(req, res, next) {
		UserController.authenticate(req, res, next)
		.then((user) => {
			let permission;

			if (user.role === 'admin' || user.role === 'god') {
				permission = ac.can(user.role).readAny('profile');
			} else if (req.params.id === user.id.toString()) {
				permission = ac.can(user.role).readOwn('profile');
			}

			if (permission.granted) {
				return res.status(200).json(user);
			} else {
				return next(new APIError("Permission denied", httpStatus.FORBIDDEN));
			}
		}).catch((err) => {
			return next(err);
		});
	}

	/**
	 * Create user
	 * @role admin, regular user ownself
	 * @property {string} req.body.password - user password
	 * @property {string} req.body.passwordConfirmation - user password confirmation
	 * @return {Object<User, token>}
	 */
	createNewUser(req, res, next) {
		if (req.body.password !== req.body.passwordConfirmation)
			return done(new APIError("Passwords do not match", httpStatus.BAD_REQUEST));

		const that = this;
		passport.authenticate('local-register', { session: false }, (err) => {
			if (err) return next(err);

			let data = req.body;
			let username = data.email.substring(0, data.email.lastIndexOf('@'));
			let newUsername;
			let count = 1;

			promiseFor(
				(userExist) => {
					return userExist;
				},
				(username) => {
					return new Promise(function(resolve) {
						User.getByUsername(username).then((user) => {
							if (user) {
								username = username + '-' + crypto.randomBytes(2).toString('hex').substring(0,3);
								resolve(username);
							} else {
								newUsername = username;
								return resolve(false);
							}
						});
					});
				},
				username
			)
			.then(() => {
				let user = new User({
					username: newUsername,
					password: data.password,
					email: data.email,
					lastLoginIp: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
				});
				return user.save();
			})
			.then((savedUser) => {
				req.user = savedUser;
				return that._jwtManager.signToken('refresh', savedUser.id);
			})
			.then((refreshToken) => {
				res.cookie('refresh-token', refreshToken, {
					expires: new Date(Date.now() + ms('60d')),
					httpOnly: true
				});
				return that._jwtManager.signToken('access', req.user.id);
			}).then((accessToken) => {
				return that._mailManager.sendEmailVerification(req.user, accessToken);
			}).then(response => {
				if (response) {
					return res.status(201).json({
						"user": req.user.toJSON(),
						"token": accessToken,
					});
				}
			})
			.catch((error) => {
				return next(error);
			});
		})(req, res, next);
	}

	/**
	 * Update user
	 * @role admin, regular user ownself
	 * @property {string} req.body.firstName - User first name
	 * @property {string} req.body.lastName - User last name
	 * @property {string} req.body.gender - User gender
	 * @property {string} req.body.address - User address
	 * @property {string} req.body.profilePhotoUri - User last name
	 * @return {Object<User, token>}
	 */
	updateUser(req, res, next) {
		UserController.authenticate(req, res, next)
		.then((user) => {
			const permission = (req.params.id === user.id.toString())
			? ac.can(user.role).readOwn('profile')
			: ac.can(user.role).readAny('profile');

			if (permission.granted) {
				return user.update({
					firstName: req.body.firstName || '',
					lastName: req.body.lastName  || '',
					gender: req.body.gender || '',
					address: req.body.address || '',
					profilePhotoUrl: req.body.address || '',
				}, { runValidators: true }).exec();
			} else {
				return next(new APIError("Permission denied", httpStatus.FORBIDDEN));
			}
		}).then((result) => {
			if (result.ok)
				return res.status(204).json(result);
			else return next(new APIError("Update failed", httpStatus.INTERNAL_SERVER_ERROR));
		})
		.catch((err) => {
			return next(err);
		});
	}

	/**
	 * Send change password email
	 * @property {string} req.body.email - User email
	 */
	sendChangePasswordEmail(req, res, next) {
		const email = req.body.email;

		if (email) {
			User.findOne({ "email": email }, (err, user) => {
				if (err) return next(err);

				this._jwtManager.signToken('access', user.id).then(accessToken => {
					return this._mailManager.sendChangePassword(user, accessToken);
				}).then(response => {
					if (response) {
						return res.status(204).json();
					}
				})
				.catch(err => {
					return next(err);
				});
			});
		} else {
			const error = new APIError("Email missing", httpStatus.BAD_REQUEST);
			return next(error);
		}
	}

	/**
	 * Change password
	 */
	changePassword(req, res, next) {
		if (req.body.password !== req.body.passwordConfirmation)
			return done(new APIError("Passwords do not match", httpStatus.BAD_REQUEST));

		const that = this;
		UserController.authenticate(req, res, next)
		.then((user) => {
			const permission = ac.can(user.role).updateOwn('profile');

			if (permission.granted) {
				return user.update({
					"password": req.body.password
				}, { runValidators: true }).exec();
			} else {
				return next(new APIError("Permission denied", httpStatus.FORBIDDEN));
			}
		}).then((result) => {
			if (result.ok)
				return res.status(204).json(result);
			else return next(new APIError("Update failed", httpStatus.INTERNAL_SERVER_ERROR));
		})
		.catch((err) => {
			return next(err);
		});
	}

	/**
	 * Authenticate User
	 * @return {Promise<Object, APIError>}
	 */
	static authenticate(req, res, next) {
		return new Promise((resolve, reject) => {
			passport.authenticate('access-token', (err, user, info) => {
				if (err) return reject(err);
				if (info) return reject(new APIError(info.message, httpStatus.UNAUTHORIZED));

				if (user) {
					// req.user = result.user;
					return resolve(user);
				} else {
					return reject(new APIError("Permission denied", httpStatus.UNAUTHORIZED));
				}
			})(req, res, next);
		});
	}

}

export default UserController;
