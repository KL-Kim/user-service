import httpStatus from 'http-status';
import Promise from 'bluebird';
import jwt from 'jsonwebtoken';

import config from './config.js';
import APIError from '../helper/APIError';

class jwtManager {
	constructor(payload) {
		this._privateKey = this._providePrivateKey(),
		this._publicKey = this._providePublicKey(),
		this._options = this._provideOptions(),
		this._payload = payload
	}

	signToken() {
		let self = this;
		return new Promise(function (resolve, reject) {
			let token = jwt.sign(self._payload, self._privateKey, self._options);
			if (!token) {
				reject(new APIError("Sign Token failed"));
			} else {
				resolve(token);
			}
		});
	}

	_providePublicKey() {
		return config.jwtPublicKey;
	}

	_providePrivateKey() {
		return config.jwtPrivateKey;
	}

	_provideOptions() {
		return config.jwtOptions;
	}

	static _verify(token, callback) {
		return jwt.verify(token, this._publicKey, this._options, callback);
	}

}

export default jwtManager;