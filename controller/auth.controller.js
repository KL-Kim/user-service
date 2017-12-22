import httpStatus from 'http-status';

const User = require('../models/user.model.js');
import BaseController from './base.controller';
import APIError from '../helper/APIError';

class AuthController extends BaseController {
	constructor() {
		super();
		this._passport = require('passport');
		this._jwt = require('jsonwebtoken');
	}

	login(req, email, password, done) {
		User.findOne({ email: email }, function(err, user) {
			if (err)
				return done(err);

			if (!user)
				return done(new APIError("User not found", httpStatus.NOT_FOUND));

			if (user.isValidPassword(password, done)) {
				// sign new token
			}
		});
	}

}

export default AuthController;