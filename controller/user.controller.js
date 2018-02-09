import Promise from 'bluebird';
import passport from 'passport';
import httpStatus from 'http-status';
import crypto from 'crypto';

import BaseController from './base.controller';
import APIError from '../helper/api-error';
import JwtManager from '../helper/jwt.manager';
import promiseFor from '../helper/promise-for';
import ac from '../config/rbac.config';
import User from '../models/user.model';

class UserController extends BaseController {
	constructor() {
		super();
		this._jwtManager = new JwtManager();
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
		.then((result) => {
			const user = result.user;
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
		.then((result) => {
			const user = result.user;
			const permission = (req.params.id === user.id.toString())
			? ac.can(user.role).readOwn('profile')
			: ac.can(user.role).readAny('profile');

			if (permission.granted) {
				return res.json(user);
			} else {
				return next(new APIError("Permission denied", httpStatus.FORBIDDEN))
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
		passport.authenticate('local-register', { session: false }, function(err) {
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
					email: data.email
				});
				return user.save();
			})
			.then((savedUser) => {
				let token = that._jwtManager.signToken(savedUser.id);
				return Promise.all([savedUser, token]);
			})
			.then(([user, token]) => {
				res.cookie('jwt', token, {
					expiresIn: new Date(Date.now() + 60 * 1000),
					httpOnly: true
				});
				return res.status(201).json({
					user: user.toJSON(),
					token: token
				});
			}).catch((error) => {
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
		.then((result) => {
			const user = result.user;
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
				}).exec();
			} else {
				return next(new APIError("Permission denied", httpStatus.FORBIDDEN));
			}
		}).then((result) => {
			if (result.ok)
				return res.json(result);
			else return next(new APIError("Update failed", httpStatus.INTERNAL_SERVER_ERROR));
		})
		.catch((err) => {
			return next(err);
		});
	}

	/**
	 * Authenticate User
	 * @role *
	 * @return {Promise<Object, APIError>}
	 */
	static authenticate(req, res, next) {
		return new Promise((resolve, reject) => {
			passport.authenticate('jwt-rs', function(err, result, info) {
				if (err) return reject(err);
				if (info) return reject(new APIError(info.message, httpStatus.UNAUTHORIZED));

				if (result.user) {
					// req.user = result.user;
					return resolve(result);
				} else {
					return reject(new APIError("Permission denied", httpStatus.UNAUTHORIZED));
				}
			})(req, res, next);
		});
	}

}

export default UserController;
