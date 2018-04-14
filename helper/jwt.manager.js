/**
 * Json Web Token Manager
 * @export {Class}
 * @version 0.0.1
 */

import httpStatus from 'http-status';
import Promise from 'bluebird';
import jwt from 'jsonwebtoken';
import uuid from 'uuid';

import config from '../config/config.js';
import APIError from './api-error';
import RevokedToken from '../models/revoked-token.model';
import BaseAutoBindedClass from './base-autobind.js';

class jwtManager extends BaseAutoBindedClass {
	constructor() {
		super();

		// Refresh Token related
		this._refreshTokenPrivateKey = this._provideRefreshTokenPrivateKey();
		this._refreshTokenPublickKey = this._provideRefreshTokenPublicKey();
		this._refreshTokenOptions = this._provideRefreshTokenOptions();

		// Access Token related
		this._accessTokenPrivateKey = this._provideAccessTokenPrivateKey();
		this._accessTokenPublicKey = this._provideAccessTokenPublicKey();
		this._accessTokenOptions = this._provideAccessTokenOptions();

	}

	/**
	 * Sign new refresh token
	 * @param {string} type - Json web token type
	 * @param {ObjectId} uid - The objectId of user
	 * @returns {Promise<token, APIError>}
	 */
	signToken(type, uid, role = "regular", isVerified = "false") {
		const that = this;
		return new Promise((resolve, reject) => {
			if (!uid || !type) return reject(new APIError("Bad params"), httpStatus.INTERNAL_SERVER_ERROR, true);

			let payload = {
				"tid": uuid.v1(),
				"uid": uid,
				"role": role,
				"isVerified": isVerified,
			};
			let privateKey, options;

			switch (type) {
				case "REFRESH":
					privateKey = that._refreshTokenPrivateKey;
					options = that._refreshTokenOptions;
					break;

				case "ACCESS":
					privateKey = that._accessTokenPrivateKey;
					options = that._accessTokenOptions;
					break;

				default:
					return reject(new APIError("Type missing"), httpStatus.INTERNAL_SERVER_ERROR, true);
			}

			if (privateKey && options) {
				jwt.sign(payload, privateKey, options, (err, token) => {
					if (err) return reject(err);

					if (token) {
						return resolve(token);
					} else {
						reject(new APIError("Sign new token faild", httpStatus.INTERNAL_SERVER_ERROR, true));
					}
				});
			}
		});
	}

	/**
	 * Revoke refresh token and save to db
	 * @property {string} tid - token's id
	 * @returns {Promise<RevokedToken, Error>}
	 */
	revokeRefreshToken(tid) {
		return new Promise((resolve, reject) => {
			RevokedToken.findOne({ id: tid }, (err, result) => {
				if (err) return reject(err);

				if (result) {
					reject(new APIError("Token already revoked", httpStatus.BAD_REQUEST));
				} else {
					let revokedToken = new RevokedToken({
						id: tid
					});
					revokedToken.save().then((revokedToken) => {
						resolve(revokedToken);
					});
				}
			});
		});
	}

	/**
	 * Get refresh token public key
	 * @returns {string}
	 */
	_provideRefreshTokenPublicKey() {
		return config.refreshTokenPublicKey;
	}

	/**
	 * Get refresh token private key
	 * @returns {string}
	 */
	_provideRefreshTokenPrivateKey() {
		return config.refreshTokenPrivateKey;
	}

	/**
	 * Get refresh token options
	 * @returns {Object}
	 */
	_provideRefreshTokenOptions() {
		return config.refreshTokenOptions;
	}

	/**
	 * Get refresh token public key
	 * @returns {string}
	 */
	_provideAccessTokenPublicKey() {
		return config.accessTokenPublicKey;
	}

	/**
	 * Get refresh token private key
	 * @returns {string}
	 */
	_provideAccessTokenPrivateKey() {
		return config.accessTokenPrivateKey;
	}

	/**
	 * Get refresh token options
	 * @returns {Object}
	 */
	_provideAccessTokenOptions() {
		return config.accessTokenOptions;
	}

	// /**
	//  * Verify refresh token (Unused by passport-jwt)
	//  * @param {string} token - user's token
	//  * @param {function} callback - callback function
	//  * @returns {*}
	//  */
	// verifyToken(type, token) {
	// 	const that = this;
	// 	return new Promise((resolve, reject) => {
	// 		let publicKey;
	// 		let options;
  //
	// 		if (type === 'refresh') {
	// 			publicKey = that._refreshTokenPublicKey;
	// 			options = that._refreshTokenOptions;
	// 		} else if (type === 'access'){
	// 			publicKey = that._accessTokenPublicKey;
	// 			options = that._accessTokenOptions;
	// 		}
  //
	// 		if (publicKey && options) {
	// 			jwt.verify(token, publicKey, options, (err, decoded) => {
	// 				if (err) return reject(err);
	// 				else return resolve(decoded);
	// 			});
	// 		} else {
	// 			reject(new APIError("Invalid token type", httpStatus.INTERNAL_SERVER_ERROR, true));
	// 		}
	// 	});
	// }

}

export default jwtManager;
