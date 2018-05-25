import Promise from 'bluebird';
import passport from 'passport';
import grpc from 'grpc';
import httpStatus from 'http-status';
import crypto from 'crypto';
import ms from 'ms';
import _ from 'lodash';
import validator from 'validator';
import { AccessControl } from 'accesscontrol';

import BaseController from './base.controller';
import APIError from '../helper/api-error';
import JwtManager from '../helper/jwt.manager';
import MailManager from '../helper/mail.manager';
import promiseFor from '../helper/promise-for';
import grants from '../config/rbac.config';
import User from '../models/user.model';
import VerificationCode from '../models/code.model';
import config from '../config/config';
import businessProto from '../config/grpc.client';

class UserController extends BaseController {
	constructor() {
		super();

		this._jwtManager = new JwtManager();
		this._mailManager = new MailManager();
		this._ac = new AccessControl(grants);
		this._grpcClient = new businessProto.BusinessService(
      config.businessGrpcServer.host + ':' + config.businessGrpcServer.port,
      grpc.credentials.createSsl(
        config.rootCert,
        config.grpcPrivateKey,
        config.grpcPublicKey,
      ),
      {
        'grpc.ssl_target_name_override' : 'ikoreatown.net',
        'grpc.default_authority': 'ikoreatown.net'
      }
    );
	}

	/**
	 * Get single user by id
	 * @role admin, regular user ownself
	 * @property {OjectId} req.params.id - user's id in url path
	 * @property {String} req.query.by - Who get user info,
	 * @returns {User}
	 */
	getSingleUser(req, res, next) {
		UserController.authenticate(req, res, next)
			.then(user => {

				req.user = user;

				return User.getById(req.params.id);
			})
			.then(user => {
				let permission, isOwn;

				if (req.user._id.toString() === user._id.toString()) {
					isOwn = true;
					permission = this._ac.can(user.role).readOwn('account');
				} else {
					if (req.user.role === 'admin' || req.user.role === 'god') {
						isOwn = false;
						permission = this._ac.can(user.role).readAny('account');

						return user;
					} else {
						throw new APIError("Forbidden", httpStatus.FORBIDDEN);
					}
				}

				if (isOwn) {
					const lastLogin = {
						agent: req.useragent.browser,
						ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
					 	time: Date.now(),
					};

					user.lastLogin.push(lastLogin);
				}

				return user.save();
			})
			.then(user => {
				let filteredUser;
				if (req.user.role === 'admin' || req.user.role === 'god') {
					filteredUser = user;
				} else {
					filteredUser = UserController.filterUserData(user)
				}

				return res.json(filteredUser);
			})
			.catch((err) => {
				return next(err);
			});
	}

	/**
	 * Get user by username
	 * @property {String} name - User's username
	 */
	getUserByUsername(req, res, next) {
		User.getByUsername(req.params.name)
			.then(user => {
				if (_.isEmpty(user)) throw new APIError("Not found", httpStatus.NOT_FOUND);

				const ac = new AccessControl(grants);

				let permission = ac.can("guest").readAny("account");

				return res.json({
					user: permission.filter(user.toJSON()),
				});
			})
			.catch(err => {
				return next(err);
			});
	}

	/**
	 * Create new user
	 * @role *
	 * @property {string} req.body.password - user password
	 * @property {string} req.body.passwordConfirmation - user password confirmation
	 * @return {Object<User, token>}
	 */
	registerNewUser(req, res, next) {
		if (req.body.password !== req.body.passwordConfirmation)
			return done(new APIError("Passwords do not match", httpStatus.BAD_REQUEST));

		const that = this;
		passport.authenticate('local-register', { session: false }, (err) => {
			if (err) return next(err);

			let data = req.body;
			let username = data.email.substring(0, data.email.lastIndexOf('@'));
			let newUsername;

			const lastLogin = {
				agent: req.useragent.browser,
				ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
			 	time: Date.now(),
			};

			promiseFor(
				(userExist) => {
					return userExist;
				},
				(username) => {
					return new Promise(function(resolve) {
						User.getByUsername(username).then((user) => {
							if (user) {
								username = username + 'X' + crypto.randomBytes(2).toString('hex').substring(0,3);
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
				});
				user.lastLogin.push(lastLogin);

				return user.save();
			})
			.then((savedUser) => {
				req.user = savedUser;
				return that._jwtManager.signToken('REFRESH', savedUser.id, savedUser.role, savedUser.isVerified);
			})
			.then((refreshToken) => {
				res.cookie(config.refreshTokenCookieKey, refreshToken, {
					expires: new Date(Date.now() + ms('60d')),
					httpOnly: true
				});
				return that._jwtManager.signToken('ACCESS', req.user.id, req.user.role, req.user.isVerified);
			}).then((accessToken) => {
				req.accessToken = accessToken;
				return that._mailManager.sendEmailVerification(req.user, accessToken);
			}).then(response => {
				if (response) {
					return res.status(201).json({
						"user": UserController.filterUserData(req.user),
						"token": req.accessToken,
					});
				} else {
					throw new APIError("Sending Email Failed", httpStatus.INTERNAL_SERVER_ERROR);
				}
			})
			.catch((error) => {
				return next(error);
			});
		})(req, res, next);
	}

	/**
	 * Verify account
	 * @role *
	 * @returns {none}
	 */
	accountVerification(req, res, next) {
		// Check jwt token, and account is verified if sign is true.
		UserController.authenticate(req, res, next)
			.then((user) => {
				if (user.isVerified) {
					return user;
				} else {
					user.isVerified = true;
					return user.save();
				}
			}).then(user => {
	 			return res.json(UserController.filterUserData(user));
	 		}).catch(err => {
	 			return next(err);
	 		});
	}

	/**
	 * Update user's profile
	 * @role *
	 * @param {string} req.params.id - User's id
	 * @property {string} req.body.firstName - User first name
	 * @property {string} req.body.lastName - User last name
	 * @property {string} req.body.gender - User gender
	 * @property {string} req.body.address - User address
	 * @property {string} req.body.birthday - User birthday
	 * @return {Object<User>}
	 */
	updateUserProfile(req, res, next) {
		UserController.authenticate(req, res, next)
			.then((user) => {
				if (req.params.id !== user._id.toString()) {
					let error = new APIError("Forbidden", httpStatus.FORBIDDEN);
					return next(error);
				}

				let	permission = this._ac.can(user.role).updateOwn('account');
				let newUserInfo = permission.filter(req.body);

				return user.update({...newUserInfo}, { runValidators: true }).exec();
			})
			.then((result) => {
				if (result.ok) {
					return result;
				} else {
					throw new APIError("Update user failed", httpStatus.INTERNAL_SERVER_ERROR);
				}
			})
			.then(result => {
				return User.getById(req.params.id);
			})
			.then(user => {
				return res.json(UserController.filterUserData(user));
			}).catch((err) => {
				return next(err);
			});
	}

	/**
	 * Update user's username
	 * @role *
	 * @param {string} req.params.id - User's id
	 * @property {string} req.body.username - User's username
	 * @return {Object<User>}
	 */
	updateUsername(req, res, next) {
		UserController.authenticate(req, res, next)
			.then((user) => {
				if (req.params.id !== user._id.toString()) {
					let error = new APIError("Forbidden", httpStatus.FORBIDDEN);
					return next(error);
				}

				return User.getByUsername(req.body.username).then(newUser => {
					if (newUser) {
						const error = new APIError("The username already exists", httpStatus.CONFLICT);
						return next(error);
					}
					user.username = req.body.username;
					return user.save();
				});
			}).then(user => {
				return res.json(UserController.filterUserData(user));
			}).catch((err) => {
				return next(err);
			});
	}

	/**
	 * Add or remove user's favorite business
	 * @role *
	 * @param {string} req.params.id - User's id
	 * @property {string} req.body.bid - Business id
	 */
	operateFavor(req, res, next) {
		UserController.authenticate(req, res, next)
			.then((user) => {
				if (req.params.id !== user._id.toString()) {
					let error = new APIError("Forbidden", httpStatus.FORBIDDEN);
					return next(error);
				}

				const bid = req.body.bid;
				const index = user.favors.indexOf(bid);

				if (index > -1) {
					user.favors.splice(index, 1);

					return new Promise((resolve, reject) => {
						this._grpcClient.removeFromFavoredUser({
							bid: bid,
							uid: user._id.toString(),
						}, (err, response) => {
							if (err) return reject(err);

							return resolve(user);
						});
					});

				} else {
					user.favors.push(bid);

					return new Promise((resolve, reject) => {
						this._grpcClient.addToFavoredUser({
							bid: bid,
							uid: user._id.toString(),
						}, (err, response) => {
							if (err) return reject(err);

							return resolve(user);
						});
					});
				}

				return user.save();
			})
			.then(user => {
				return user.save();
			})
			.then(user => {
				return res.json(UserController.filterUserData(user));
			})
			.catch(err => {
				return next(err);
			});
	}

	/**
	 * Upload user's profile photo
	 * @role admin, regular user ownself
	 * @param {string} req.params.id - User's id
	 * @property {file} req.file - Image file
	 * @return {Object<User>}
	 */
	uploadProfilePhoto(req, res, next) {
		UserController.authenticate(req, res, next)
			.then((user) => {
				if (req.params.id !== user._id.toString()) {
					let error = new APIError("Forbidden", httpStatus.FORBIDDEN);
					return next(error);
				}

				user.profilePhotoUri = req.file.path;
				//return user.update({ profilePhotoUri: req.file.path }).exec();
				return user.save();
			})
			.then(user => {
				return res.json(UserController.filterUserData(user));
			})
			.catch((err) => {
				return next(err);
			});
	}

	/**
	 * Upload user's mobile phone number
	 * @role admin, regular user ownself
	 * @param {string} req.params.id - User's id
	 * @property {string} req.body.phoneNumber - User's phone number
	 * @property {number} req.body.code - Phone verification code
	 * @return {Object<User>}
	 */
	updateUserPhone(req, res, next) {
		UserController.authenticate(req, res, next)
			.then((user) => {
				if (req.params.id !== user._id.toString()) {
					return next(new APIError("Forbidden", httpStatus.FORBIDDEN));
				}

				const phoneNumber = req.body.phoneNumber;
				const code = req.body.code;

				if (!validator.isMobilePhone(phoneNumber, 'zh-CN') || !validator.isInt(code, {min: 100000, max: 999999})) {
					return next(new APIError("Bad Request Format", httpStatus.BAD_REQUEST));
				}

				return VerificationCode.getByPhoneNumber(phoneNumber).then(codeObj => {
					if (_.isEmpty(codeObj)) {
						return next(new APIError("Code do not exists", httpStatus.UNAUTHORIZED));
					} else {
						if (codeObj.code === code) {
							user.phoneNumber = phoneNumber;
							return user.save();
							// return user.update({ "phoneNumber": phoneNumber }).exec();
						} else {
							return next(new APIError("Codes do not match", httpStatus.FORBIDDEN));
						}
					}
				})
			})
			.then(user => {
				return res.json(UserController.filterUserData(user));
			}).catch((err) => {
				return next(err);
			});
	}

	/**
	 * Change password
	 * @property {string} req.body.password - User's new password
	 * @property {string} req.body.passwordConfirmation - Password confirmation
	 */
	changePassword(req, res, next) {
		if (req.body.password !== req.body.passwordConfirmation)
			return done(new APIError("Passwords do not match", httpStatus.BAD_REQUEST));

		const that = this;

		UserController.authenticate(req, res, next)
			.then((user) => {
				return user.update({ "password": req.body.password}, { runValidators: true }).exec();
			}).then((result) => {
				if (result.ok)
					return res.status(204).json(result);
				else
					return next(new APIError("Update user failed", httpStatus.INTERNAL_SERVER_ERROR));
			})
			.catch((err) => {
				return next(err);
			});
	}

	/**
	 * Get users list
	 * @role admin
	 * @property {string} req.query.search - Search user
	 * @property {number} req.body.skip - Number of users to be skipped.
	 * @property {number} req.body.limit - Limit number of users to be returned.
	 * @property {object} req.body.filter - User filter object
	 * @returns {User[]}
	 */
	adminGetUsersList(req, res, next) {
		const { limit = 20, skip = 0, filter } = req.body;
		const search = req.query.search;
		UserController.authenticate(req, res, next)
			.then((user) => {
				const permission = this._ac.can(user.role).readAny('account');

				if (permission.granted) {
					return User.filteredCount({ filter, search });
				} else {
					throw new APIError("Forbidden", httpStatus.FORBIDDEN);
				}
			})
			.then(count => {
				req.count = count;
				return User.getUsersList({ skip, limit, filter, search });
			})
			.then(users => {
				return res.json({
					users: users,
					totalCount: req.count,
				});
			})
			.catch((err) => {
				return next(err);
			});
	}

	/**
	 * Admin edit user data
	 * @role admin
	 * @property {string} req.params.id - Users's id
	 * @property {string} req.body.role - User's role
	 * @property {string} req.body.userStatus - Users' status
	 */
	adminEditUser(req, res, next) {
		UserController.authenticate(req, res, next)
			.then((user) => {
				req.permission = this._ac.can(user.role).updateAny('account');

				if (req.permission.granted) {
					return User.getById(req.params.id);
				} else {
					throw new APIError("Forbidden", httpStatus.FORBIDDEN);
				}
			})
			.then(user => {
				if (_.isEmpty(user)) throw new APIError("User do not exists", httpStatus.NOT_FOUND);

				let newUserInfo = req.permission.filter(req.body);
				return user.update({...newUserInfo}, { runValidators: true }).exec();
			})
			.then((result) => {
				if (result.ok) {
					return res.status(204).send();
				} else {
					throw new APIError("Update user failed", httpStatus.INTERNAL_SERVER_ERROR);
				}
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
					return resolve(user);
				} else {
					return reject(new APIError("Unauthorized", httpStatus.UNAUTHORIZED));
				}
			})(req, res, next);
		});
	}

	/**
	 * Filter user data
	 */
	static filterUserData(user) {
		let permission;

		const ac = new AccessControl(grants);

		if (user.role === 'admin' || user.role === 'god') {
			permission = ac.can(user.role).readAny('account');
		} else {
			permission = ac.can(user.role).readOwn('account');
		}

		const filteredUserData = permission.filter(user.toJSON());
		filteredUserData._id = user.id.toString();

		return filteredUserData;
	}

}

export default UserController;
