import httpStatus from 'http-status';

const User = require('../models/user.model.js');
import BaseController from './base.controller';
import APIError from '../helper/APIError';
import JwtManager from '../config/jwt.manager';

class UserController extends BaseController {
	constructor() {
		super();
		this._passport = require('passport');
	}

	get(req, res, next) {
		res.send("get user list") ;
	}

	createNewUser(req, email, password, done) {
		if (req.body.password !== req.body.passwordConfirmation) 
			return done(new APIError("Passwords do not match", httpStatus.BAD_REQUEST));

		User.findOne({ email: email }, function(err, user) {
			if (err)
				return done(err);

			if (user) {
				return done(new APIError("The email already exists"), httpStatus.CONFLICT);
			} else {
				const data = req.body;
				let user = new User({
					username: data.username,
					password: data.password,
					email: data.email,
					firstName: data.firstName,
					lastName: data.lastName
				});
				user.save().then(function(user) {
					let jwtManager = new JwtManager({id: user.id});
					jwtManager.signToken().then((token) => {
						return done(null, {
							user: user.toJSON(),
							token: token
						});	
					}).catch((err) => {
						return done(err);
					});
				});
			}
		});
	}

	list(req, res, next) {
		res.json("get Users List");
	}

}

export default UserController;