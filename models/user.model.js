import Promise from 'bluebird';
import mongoose from 'mongoose';
import httpStatus from 'http-status';
import bcrypt from 'bcrypt';

import APIError from '../helper/APIError';

const saltRounds = 12;
const UserSchema = new mongoose.Schema({
	username: {
		type: String,
		required: true,
		index: {
			unique: true
		}
	},
	email: {
		type: String,
		unique: true,
		required: true,
		match: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i
	},
	password: {
		type: String,
		minLength: [6, 'The value of path `{PATH}` (`{VALUE}`) is shorter than the minimum allowed length ({MINLENGTH}).'],
		required: true
	},
	firstName: {
		type: String
	},
	lastName: {
		type: String
	},
	mobileNumber: {
		type: String,
		unique: true
	},
	dateCreated: {
		type: Date,
		default: Date.now
	},
	lastLoginDate: {
		type: Date,
		default: Date.now
	},
	profilePhotoUrl: {
		type: String,
		default: ''
	},
	// userStatus: {
	// 	type: Boolean,
	// 	default: true
	// }
});

/**
 * virtuals
 */
UserSchema.virtual('id')
	.get(function() { return this._id });

/**
 * Pre-save hooks
 */
UserSchema.pre('save', function(next) {
	let user = this

	if (!user.isModified('password')) {
		return next();
	}

	bcrypt.hash(user.password, saltRounds, function(err, hash) {
		if (err) 
				next(new APIError("Hashing password failed", httpStatus.INTERNAL_SERVER_ERROR));
		user.password = hash;
		next();
	});
});

/**
 * Methods
 */
UserSchema.methods = {
	// Verify password validity
	isValidPassword(password, next) {
		bcrypt.compare(password, this.password).then(function(err, isMatch) {
			if (err) return next(new APIError("Verify password failed", httpStatus.INTERNAL_SERVER_ERROR));
			next(null, isMatch);
		});
	},

	toJSON() {
		let obj = this.toObject();
		delete obj.password;
		delete obj.__v;
		return obj;
	}
};
/**
 * Statics
 */
UserSchema.static = {
	// Get user by Id
	getById(id) {
		return this.findById(id)
			.exec()
			.then((user) => {
				if (user) {
					return user;
				}

				const err = new APIError('No such user exists', httpStatus.NOT_FOUND);
				return Promise.reject(err);
			});
	},

	getUsersList({skip = 0, limit = 50} = {}) {
		return this.find()
			.sort({ dateCreated: -1 })
			.skip(+skip)
			.limit(+limit)
			.exec();
	}
};

module.exports = mongoose.model('User', UserSchema);