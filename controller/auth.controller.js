/**
 * Authenticate controller
 *
 * @export {Class}
 * @version 0.0.1
 *
 * @author KL-Kim (https://github.com/KL-Kim)
 * @license MIT
 */

import passport from 'passport';
import httpStatus from 'http-status';
import ms from 'ms';
import _ from 'lodash';
import validator from 'validator';
import SMSClient from '@alicloud/sms-sdk';
import { AccessControl } from 'accesscontrol';

import BaseController from './base.controller';
import APIError from '../helper/api-error';
import JwtManager from '../helper/jwt.manager';
import MailManager from '../helper/mail.manager';
import config from '../config/config';
import User from '../models/user.model';
import VerificationCode from '../models/code.model';
import grants from '../config/rbac.config';

class AuthController extends BaseController {
	constructor() {
		super();

		this._jwtManager = new JwtManager();
		this._mailManager = new MailManager();
		this._ac = new AccessControl(grants);
	}

	/**
	 * Issue access Token
	 * @role - *
	 * @since 0.0.1
	 * @returns {token}
	 */
	issueAccessToken(req, res, next) {
		const that = this;
		passport.authenticate('refresh-token', { session: false }, (err, { payload, user } = {}, info) => {
			if (err) return next(err);
			if (info) return next(new APIError(info.message, httpStatus.UNAUTHORIZED));

			that._jwtManager.signToken('ACCESS', user.id, user.role, user.isVerified)
				.then((token) => {
					return res.json({
						"token": token,
					});
				}).catch((err) => {
					return next(err);
				});
		})(req, res, next);
	}

	/**
 	 * User login and return a token
 	 * @role - *
	 * @since 0.0.1
	 * @property {string} req.body.email - Users' Email
	 * @property {string} req.body.password - User's account password
 	 * @returns {User, token}
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

			user.save((err, savedUser) => {
				if (err) return next(err);
				req.user = savedUser;

				that._jwtManager.signToken('REFRESH', savedUser.id, savedUser.role, savedUser.isVerified)
					.then((refreshToken) => {
						res.cookie(config.refreshTokenCookieKey, refreshToken, {
							"maxAge": ms(config.refreshTokenOptions.expiresIn),
							"httpOnly": true,
						});

						return user;
					}).then(user => {
						return that._jwtManager.signToken('ACCESS', user.id, user.role, user.isVerified);
					}).then((accessToken) => {
						let permission;
						const user = req.user;

						if (user.role === 'admin' || user.role === 'god') {
							permission = this._ac.can(user.role).readAny('account');
						} else {
							permission = this._ac.can(user.role).readOwn('account');
						}

						const filteredUser = permission.filter(user.toJSON());
						filteredUser._id = user.id.toString();

						return res.json({
							"user": filteredUser,
							"token": accessToken
						});
					}).catch((err) => {
						return next(err);
					});
			});
		})(req, res, next);
	}

	/**
	 * User log out and revoke token
	 * @role - *
	 * @since 0.0.1
	 * @returns {void}
	 */
	logout(req, res, next) {
		const that = this;
		passport.authenticate('refresh-token', { session: false }, (err, { payload, user } = {}, info) => {
			if (err) return next(err);
			if (info) return next(new APIError(info.message, httpStatus.UNAUTHORIZED));

			that._jwtManager.revokeRefreshToken(payload.tid)
				.then(revokeToken => {
					revokeToken
						return res.status(204).send();
				}).catch((err) => {
					return next(err);
				});
		})(req, res, next);
	}

	/**
	 * Send change password email
	 * @role - *
	 * @since 0.0.1
	 * @property {string} req.params.email - User email
	 * @returns {void}
	 */
	sendChangePasswordEmail(req, res, next) {
		const email = req.params.email;

		if (_.isEmpty(email)) throw new APIError("Email missing", httpStatus.BAD_REQUEST);

		User.getByEmail(req.params.email)
			.then(user => {
				if (_.isEmpty(user)) throw new APIError("Not found", httpStatus.BAD_REQUEST);

				return this._jwtManager.signToken('ACCESS', user.id, user.role, user.isVerified);
			})
			.then(accessToken => {
				return this._mailManager.sendChangePassword(user, accessToken);
			})
			.then(response => {
				return res.status(204).send();
			})
			.catch(err => {
				return next(err);
			});
	}

	/**
	 * Send account verification email
	 * @role - *
	 * @since 0.0.1
	 * @property {string} req.params.email - User email
	 * @returns {void}
	 */
	sendAccountVerificationEmail(req, res, next) {
		const email = req.params.email;

		if (_.isEmpty(email)) throw new APIError("Email missing", httpStatus.BAD_REQUEST);

		User.getByEmail(req.params.email)
			.then(user => {
				if (_.isEmpty(user)) throw new APIError("Not found", httpStatus.BAD_REQUEST);

				return this._jwtManager.signToken('ACCESS', user.id, user.role, user.isVerified);
			})
			.then(accessToken => {
				return this._mailManager.sendEmailVerification(user, accessToken);
			})
			.then(response => {
				return res.status(204).send();
			})
			.catch(err => {
				return next(err);
			});
	}

	/**
	 * Send Phone verification code
	 * @role - *
	 * @since 0.0.1
	 * @param {String} req.params.phoneNumber - User's phone number
	 * @returns {void}
	 */
	sendPhoneVerificationCode(req, res, next) {
		// Check mobile phone format
		if (!validator.isMobilePhone(req.params.phoneNumber, 'zh-CN')) {
			return next(new APIError("Bad phone number format", httpStatus.BAD_REQUEST));
		}

		VerificationCode.getByPhoneNumber(req.params.phoneNumber)
			.then(codeObj => {
				if (codeObj) {
					codeObj.createdAt = Date.now();
					return codeObj.save();
				} else {
					let newCode = 0;

					while (newCode < 100000) {
						newCode = Math.floor(Math.random() * 1000000);
					}

					let newCodeObj = new VerificationCode({
						"code": newCode,
						"phoneNumber": req.params.phoneNumber,
					});

					return newCodeObj.save();
				}
			})
			.then(codeObj => {
				const accessKeyId = config.SMSAccessKey.accessKeyId;
				const secretAccessKey = config.SMSAccessKey.accessKeySecret;

				const smsClient = new SMSClient({
					"accessKeyId": accessKeyId,
					"secretAccessKey": secretAccessKey
				});

				// Simulate Success Response
				return {
					Code: "OK",
				};

				// return smsClient.sendSMS({
				// 	PhoneNumbers: codeObj.phoneNumber,
				// 	SignName: '阿里云短信测试专用',
				// 	TemplateCode: 'SMS_127850153',
				// 	TemplateParam: `{"code": ${codeObj.code}}`
				// });
			})
			.then(response => {
				if (response.Code === 'OK') {
					return res.status(204).send();
				} else {
					const error = new APIError("Send SMS failed");
					return next(error);
				}
			}).catch(err => {
				return next(err);
			});
	}
}

export default AuthController;
