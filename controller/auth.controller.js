import passport from 'passport';
import httpStatus from 'http-status';
import ms from 'ms';
import _ from 'lodash';
import validator from 'validator';
import SMSClient from '@alicloud/sms-sdk';

import BaseController from './base.controller';
import APIError from '../helper/api-error';
import JwtManager from '../helper/jwt.manager';
import MailManager from '../helper/mail.manager';
import config from '../config/config';
import User from '../models/user.model';
import VerificationCode from '../models/code.model';
import ac from '../config/rbac.config';

class AuthController extends BaseController {
	constructor() {
		super();

		this._jwtManager = new JwtManager();
		this._mailManager = new MailManager();
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

			that._jwtManager.signToken('ACCESS', result.user.id, result.user.role).then((token) => {
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
 		* @role *
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

				that._jwtManager.signToken('REFRESH', savedUser.id, savedUser.role)
					.then((refreshToken) => {
						res.cookie(config.refreshTokenCookieKey, refreshToken, {
							"maxAge": ms(config.refreshTokenOptions.expiresIn),
							"httpOnly": true,
						});

						return user;
					}).then(user => {
						return that._jwtManager.signToken('ACCESS', user.id, user.role);
					}).then((accessToken) => {
						let permission;
						const user = req.user;

						if (user.role === 'admin' || user.role === 'god') {
							permission = ac.can(user.role).readAny('account');
						} else {
							permission = ac.can(user.role).readOwn('account');
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
	 * Send change password email
	 * @property {string} req.params.email - User email
	 */
	sendChangePasswordEmail(req, res, next) {
		const email = req.params.email;

		if (email) {
			User.findOne({ "email": email }, (err, user) => {
				if (err) return next(err);

				if (_.isEmpty(user)) {
					return next(new APIError("Not found", httpStatus.BAD_REQUEST));
				}

				this._jwtManager.signToken('ACCESS', user.id, user.role).then(accessToken => {
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
	 * Send account verification email
	 * @property {string} req.params.email - User email
	 */
	sendAccountVerificationEmail(req, res, next) {
		const email = req.params.email;

		if (email) {
			User.findOne({ "email": email }, (err, user) => {
				if (err) return next(err);

				if (_.isEmpty(user)) {
					return next(new APIError("Not found", httpStatus.BAD_REQUEST));
				}

				this._jwtManager.signToken('ACCESS', user.id, user.role).then(accessToken => {
					return this._mailManager.sendEmailVerification(user, accessToken);
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
	 * Send Phone verification code
	 * @role *
	 * @param {String} req.params.phoneNumber - User's phone number
	 */
	sendPhoneVerificationCode(req, res, next) {
		// Check mobile phone format
		if (!validator.isMobilePhone(req.params.phoneNumber, 'zh-CN')) {
			return next(new APIError("Bad phone number format", httpStatus.BAD_REQUEST));
		}

		VerificationCode.getByPhoneNumber(req.params.phoneNumber).then(codeObj => {
			if (_.isEmpty(codeObj)) {
				let newCode = 0;

				while (newCode < 100000) {
					newCode = Math.floor(Math.random() * 1000000);
				}

				let newCodeObj = new VerificationCode({
					"code": newCode,
					"phoneNumber": req.params.phoneNumber,
				});

				return newCodeObj.save();
			} else {
				codeObj.createdAt = Date.now();
				return codeObj.save();
			}
		}).then(codeObj => {
			req.codeObj = codeObj;
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
		}).then(response => {
			if (response.Code === 'OK') {
				return res.status(204).json();
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
