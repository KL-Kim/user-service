/**
 * User controller
 *
 * @export {Class}
 * @version 0.0.1
 *
 * @author KL-Kim (https://github.com/KL-Kim)
 * @license MIT
 */

import Promise from 'bluebird';
import passport from 'passport';
import grpc from 'grpc';
import httpStatus from 'http-status';
import crypto from 'crypto';
import ms from 'ms';
import fs from 'fs';
import _ from 'lodash';
import validator from 'validator';
import { AccessControl } from 'accesscontrol';
import OSS from 'ali-oss';

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

		// this._grpcClient = new businessProto.BusinessService(
    //   config.businessGrpcServer.host + ':' + config.businessGrpcServer.port,
    //   grpc.credentials.createSsl(
    //     config.rootCert,
    //     config.grpcPrivateKey,
    //     config.grpcPublicKey,
    //   ),
    //   {
    //     'grpc.ssl_target_name_override' : 'ikoreatown.net',
    //     'grpc.default_authority': 'ikoreatown.net'
    //   }
    // );

		this._businessGrpcClient = new businessProto.BusinessService(
      config.businessGrpcServer.host + ':' + config.businessGrpcServer.port,
      grpc.credentials.createInsecure()
    );

		this._businessGrpcClient.waitForReady(Infinity, (err) => {
      if (err) console.error(err);

      console.log("Connected Business gRPC Server!");
    });
	}

	/**
	 * Get single user by id
	 * @role - *
   	 * @since 0.0.1
	 * @property {OjectId} req.params.id - user's id in url path
	 * @property {String} req.query.by - Who get user info,
	 * @returns {User}
	 */
	getMyself(req, res, next) {
		UserController.authenticate(req, res, next)
			.then(user => {
				if (req.params.id !== user._id.toString()) throw new APIError("Forbidden", httpStatus.FORBIDDEN);

				const lastLogin = {
					agent: req.useragent.browser,
					ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
				 	time: Date.now(),
				};

				user.lastLogin.push(lastLogin);

				return user.save();
			})
			.then(user => {
				return res.json(UserController.filterUserData(user, 'OWN'));
			})
			.catch((err) => {
				return next(err);
			});
	}

	/**
	 * Get user by username
   	 * @role - *
   	 * @since 0.0.1
	 * @property {String} name - User's username
   	 * @returns {User}
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
	 * @role - *
     * @since 0.0.1
	 * @property {string} req.body.password - user password
	 * @property {string} req.body.passwordConfirmation - user password confirmation
	 * @returns {User, token}
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
			})
			.then((accessToken) => {
				req.accessToken = accessToken;
				return that._mailManager.sendEmailVerification(req.user, accessToken);
			})
			.then(response => {
				return res.status(201).json({
					"user": UserController.filterUserData(req.user, 'OWN'),
					"token": req.accessToken,
				});
			})
			.catch((error) => {
				return next(error);
			});
		})(req, res, next);
	}

	/**
	 * Verify account
	 * @role - *
     * @since 0.0.1
	 * @returns {User}
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
			})
      .then(user => {
	 			return res.json(UserController.filterUserData(user, 'OWN'));
	 		}).catch(err => {
	 			return next(err);
	 		});
	}

	/**
	 * Update user's profile
	 * @role - *
     * @since 0.0.1
	 * @param {string} req.params.id - User's id
	 * @property {string} req.body.firstName - User first name
	 * @property {string} req.body.lastName - User last name
	 * @property {string} req.body.gender - User gender
	 * @property {string} req.body.address - User address
	 * @property {string} req.body.birthday - User birthday
	 * @returns {User}
	 */
	updateUserProfile(req, res, next) {
		UserController.authenticate(req, res, next)
			.then((user) => {
				if (req.params.id !== user._id.toString()) throw new APIError("Forbidden", httpStatus.FORBIDDEN);

				let	permission = this._ac.can(user.role).updateOwn('account');
				let newUserInfo = permission.filter(req.body);

				return user.update({...newUserInfo}, { runValidators: true }).exec();
			})
			.then(result => {
				return User.getById(req.params.id);
			})
			.then(user => {
				return res.json(UserController.filterUserData(user, 'OWN'));
			}).catch((err) => {
				return next(err);
			});
	}

	/**
	 * Update user's username
	 * @role - *
     * @since 0.0.1
	 * @param {string} req.params.id - User's id
	 * @property {string} req.body.username - User's username
	 * @returns {User}
	 */
	updateUsername(req, res, next) {
		UserController.authenticate(req, res, next)
			.then(user => {
				if (req.params.id !== user._id.toString()) throw new APIError("Forbidden", httpStatus.FORBIDDEN);

				req.user = user;

			  return User.getByUsername(req.body.username);
			})
      .then(user => {
        if (user) throw new APIError("The username already exists", httpStatus.CONFLICT);

        req.user.username = req.body.username;
        return req.user.save();
      })
      .then(user => {
				return res.json(UserController.filterUserData(user, 'OWN'));
			}).catch((err) => {
				return next(err);
			});
	}

	/**
	 * Add or remove user's favorite business
	 * @role - *
     * @since 0.0.1
	 * @param {string} req.params.id - User's id
	 * @property {string} req.body.bid - Business id
     * @returns {User}
	 */
	operateFavor(req, res, next) {
		UserController.authenticate(req, res, next)
			.then((user) => {
				if (req.params.id !== user._id.toString()) throw new APIError("Forbidden", httpStatus.FORBIDDEN);

				const bid = req.body.bid;
				const index = user.favors.indexOf(bid);

				if (index > -1) {
					user.favors.splice(index, 1);

					return new Promise((resolve, reject) => {
						this._businessGrpcClient.removeFromFavoredUser({
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
						this._businessGrpcClient.addToFavoredUser({
							bid: bid,
							uid: user._id.toString(),
						}, (err, response) => {
							if (err) return reject(err);

							return resolve(user);
						});
					});
				}

				return user;
			})
			.then(user => {
				return user.save();
			})
			.then(user => {
				return res.json(UserController.filterUserData(user, 'OWN'));
			})
			.catch(err => {
				return next(err);
			});
	}

	/**
	 * Upload user's profile photo
	 * @role - *
	 * @since 0.0.1
	 * @param {string} req.params.id - User's id
	 * @property {file} req.file - Image file
	 * @returns {User}
	 */
	uploadProfilePhoto(req, res, next) {
		UserController.authenticate(req, res, next)
			.then(user => {
				if (req.params.id !== user._id.toString()) {
					let error = new APIError("Forbidden", httpStatus.FORBIDDEN);
					return next(error);
				}

				req.user = user;

				const client = new OSS({
					accessKeyId: config.OSSAccessKey.accessKeyId,
					accessKeySecret: config.OSSAccessKey.accessKeySecret,
					region: config.OSSRegion,
					bucket: config.OSSBucket,
					secure: true,
				});

				const rs = fs.createReadStream(req.file.path);

				rs.on('error', err => {
					throw err;
				});

				const pathname = 'avatars/' + user._id.toString() + '/avatar.jpg';

				return client.putStream(pathname, rs);
			})
			.then(response => {
				req.user.avatarUrl = response.url;

				return req.user.save();
			})
			.then(user => {
				req.user = user;

				return fs.unlink(req.file.path);
			})
			.then(() => {
				return res.json(UserController.filterUserData(req.user, 'OWN'));
			})
			.catch((err) => {
				return next(err);
			});
	}

	/**
	 * Upload user's mobile phone number
	 * @role - *
     * @since 0.0.1
	 * @param {string} req.params.id - User's id
	 * @property {string} req.body.phoneNumber - User's phone number
	 * @property {number} req.body.code - Phone verification code
	 * @returns {User}
	 */
	updateUserPhone(req, res, next) {
		UserController.authenticate(req, res, next)
			.then((user) => {
				if (req.params.id !== user._id.toString()) throw new APIError("Forbidden", httpStatus.FORBIDDEN);

				const phoneNumber = req.body.phoneNumber;
				const code = req.body.code;

				if (!validator.isMobilePhone(phoneNumber, 'zh-CN') || !validator.isInt(code, {min: 100000, max: 999999})) {
					return next(new APIError("Bad Request Format", httpStatus.BAD_REQUEST));
				}

				return VerificationCode.getByPhoneNumber(phoneNumber)
					.then(codeObj => {
						if (_.isEmpty(codeObj)) {
							return next(new APIError("Code do not exists", httpStatus.UNAUTHORIZED));
						} else {
							if (codeObj.code === code) {
								user.phoneNumber = phoneNumber;
								return user.save();
							} else {
								throw new APIError("Codes do not match", httpStatus.FORBIDDEN);
							}
						}
					});
			})
			.then(user => {
				return res.json(UserController.filterUserData(user, 'OWN'));
			}).catch((err) => {
				return next(err);
			});
	}

	/**
	 * Change password
	 * @role - *
     * @since 0.0.1
	 * @property {string} req.body.password - User's new password
	 * @property {string} req.body.passwordConfirmation - Password confirmation
     * @returns {void}
	 */
	changePassword(req, res, next) {
		if (req.body.password !== req.body.passwordConfirmation)
			throw new APIError("Passwords do not match", httpStatus.BAD_REQUEST);

		const that = this;

		UserController.authenticate(req, res, next)
			.then((user) => {
				return user.update({ "password": req.body.password}, { runValidators: true }).exec();
			})
			.then((result) => {
				return res.status(204).send();
			})
			.catch((err) => {
				return next(err);
			});
	}

	/**
	 * Get users list by admin
	 * @role - admin
     * @since 0.0.1
	 * @property {string} req.query.search - Search user
	 * @property {number} req.query.skip - Number of users to be skipped.
	 * @property {number} req.query.limit - Limit number of users to be returned.
	 * @property {object} req.query.filter - User filter object
	 * @returns {User[], totalCount}
	 */
	getUsersListByAdmin(req, res, next) {
		const { limit, skip, role, status, search } = req.query;

		UserController.authenticate(req, res, next)
			.then(user => {
        if (user.role !== 'manager' && user.role !== 'admin' && user.role !== 'god') throw new APIError("Forbidden", httpStatus.FORBIDDEN);

        return User.getCount({ filter: {
          role: role,
          userStatus: status,
        }, search });
			})
			.then(count => {
				req.count = count;
				return User.getUsersList({
          skip,
          limit,
          search,
          filter: {
            role: role,
            userStatus: status,
          },
         });
			})
			.then(list => {
				return res.json({
					users: list,
					totalCount: req.count,
				});
			})
			.catch((err) => {
				return next(err);
			});
	}

	/**
	 * Get single user data by admin
	 * @role - admin
     * @since 0.0.1
	 * @property {string} req.params.id - Users's id
	 * @returns {User}
	 */
	getSingleUserByAdmin(req, res, next) {
		UserController.authenticate(req, res, next)
			.then(user => {
				if (user.role !== 'manager' && user.role !== 'admin' && user.role !== 'god') throw new APIError("Forbidden", httpStatus.FORBIDDEN);

        return User.getById(req.params.id);
			})
			.then(user => {
				if (_.isEmpty(user)) throw new APIError("Not found", httpStatus.NOT_FOUND);

				return res.json(user);
			})
			.catch(err => {
				return next(err);
			});
	}

	/**
	 * Edit user's role & status by admin
	 * @role - admin
     * @since 0.0.1
	 * @property {string} req.params.id - Users's id
	 * @property {string} req.body.role - User's role
	 * @property {string} req.body.userStatus - Users' status
     * @returns {void}
	 */
	editUserByAdmin(req, res, next) {
		UserController.authenticate(req, res, next)
			.then(user => {
				if (user.role !== 'admin' && user.role !== 'god') throw new APIError("Forbidden", httpStatus.FORBIDDEN);

        return User.getById(req.params.id);
			})
			.then(user => {
				if (_.isEmpty(user)) throw new APIError("Not found", httpStatus.NOT_FOUND);

        const { role, userStatus } = req.body;

				return user.update({ role, userStatus }, { runValidators: true }).exec();
			})
			.then(result => {
				return res.status(204).send();
			})
			.catch((err) => {
				return next(err);
			});
	}

	/**
	 * Authenticate User
     * @since 0.0.1
	 * @returns {Promise<Object, APIError>}
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
     * @since 0.0.1
   	 * @param {Object} user - User object
	 * @param {String} type - Filter type
     * @returns {User} - filtered user data
	 */
	static filterUserData(user, type) {
		let permission;

		const ac = new AccessControl(grants);

		switch (type) {
			case "ANY":
				permission = ac.can(user.role).readAny('account');
				break;

			default:
				permission = ac.can(user.role).readOwn('account');
		}

		const filteredUserData = permission.filter(user.toJSON());
		filteredUserData._id = user.id.toString();

		return filteredUserData;
	}

}

export default UserController;
