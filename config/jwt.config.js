/**
 * Json Web Token Manager
 * @export {Class}
 * @version 0.0.1
 */

import httpStatus from 'http-status';
import Promise from 'bluebird';
import jwt from 'jsonwebtoken';
import uuid from 'uuid';

import config from './config.js';
import APIError from '../helper/api-error';
import RevokedToken from '../models/revoked-token.model';
import BaseAutoBindedClass from '../helper/base-autobind.js';

class jwtManager extends BaseAutoBindedClass {
	constructor() {
		super();
		this._privateKey = this._providePrivateKey();
		this._publicKey = this._providePublicKey();
		this._options = this._provideOptions();
	}

	/**
	 * Sign new token
	 * @param {ObjectId} uid - The objectId of user.
	 * @returns {Promise<token, APIError>}
	 */
	signToken(uid) {
		const that = this;
		return new Promise((resolve, reject) => {
			let payload = {
				uid: uid,
				tid: uuid.v1()
			};
			let token = jwt.sign(payload, that._privateKey, that._options);
			if (token) {
				resolve(token);
			} else {
				reject(new APIError("Sign new token faild", httpStatus.INTERNAL_SERVER_ERROR));
			}
		});
	}

	/**
	 * Revoke token and save to db1
	 * @property {string} tid - token's id
	 * @returns {Promise<RevokedToken, Error>}
	 */
	revokeToken(tid) {
		return new Promise((resolve, reject) => {
			RevokedToken.findOne({ id: tid }).exec((err, result) => {
				if (err) return reject(err);

				if (result) {
					reject(new APIError("Token already revoked", httpStatus.INTERNAL_SERVER_ERROR));
				} else {
					let revokedToken = new RevokedToken({
						id: tid
					});
					revokedToken.save().then((revokedToken) => {
						resolve(revokedToken);
					});
				}
			}).catch((err) => {
				reject(err);
			});
		});
	}

	/**
	 * Get jwt public key
	 * @returns {string}
	 */
	_providePublicKey() {
		return config.jwtPublicKey;
	}

	/**
	 * Get jwt private key
	 * @returns {string}
	 */
	_providePrivateKey() {
		return config.jwtPrivateKey;
	}

	/**
	 * Get jwt options
	 * @returns {Object}
	 */
	_provideOptions() {
		return config.jwtOptions;
	}

	/**
	 * Verify token
	 * @param {string} token - user's token
	 * @param {function} callback - callback function
	 * @returns {*}
	 */
	_verify(token) {
		return new Promise((resolve, reject) => {
			jwt.verify(token, this._publicKey, this._options, (err, decoded) => {
				if (err) return reject(err);
				else return resolve(decoded);
			});
		});
	}

}

export default jwtManager;
