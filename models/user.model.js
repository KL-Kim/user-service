import Promise from 'bluebird';
import mongoose from 'mongoose';
import httpStatus from 'http-status';
import bcrypt from 'bcrypt';

import APIError from '../helper/api-error';

// Salt rounds for bcrypt
const saltRounds = 12;

/**
 * User mongoose schema
 */
const UserSchema = new mongoose.Schema({
	username: {
		type: String,
		required: true,
		index: {
			unique: true
		}
	},
	role: {
		type: String,
		required: true,
		default: 'regular',
		enum: ['god', 'admin', 'manager', 'regular']
	},
	email: {
		type: String,
		unique: true,
		required: true,
		match: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i,
		index: {
			unique: true
		}
	},
	mobileNumber: {
		type: String,
	},
	password: {
		type: String,
		minLength: [8, 'The value of path `{PATH}` (`{VALUE}`) is shorter than the minimum allowed length ({MINLENGTH}).'],
		required: true
	},
	firstName: {
		type: String
	},
	lastName: {
		type: String
	},
	sex: {
		type: String,
		enum: ['male', 'female']
	},
	address: {
		type: String
	},
	point: {
		type: Number,
		default: 0
	},
	createdAt: {
		type: Date,
		default: Date.now
	},
	lastLoginAt: {
		type: Date,
		default: Date.now
	},
	profilePhotoUri: {
		type: String,
		default: ''
	},
	userStatus: {
		type: String,
		enum: ['normal', 'suspened'],
		default: 'normal'
	}
});

/**
 * Virtuals
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

	bcrypt.hash(user.password, saltRounds).then((hash) => {
		user.password = hash;
		next();
	}).catch((err) => {
		next(new APIError("Hashing password failed", httpStatus.INTERNAL_SERVER_ERROR));
	});
});

/**
 * Methods
 */
UserSchema.methods = {
	/**
	 * Verify password validity
	 * @param {string} password
	 * @returns {Promise<boolean, Error>}
	*/
	isValidPassword(password) {
		return new Promise((resolve, reject) => {
			bcrypt.compare(password, this.password).then((res) => {
				resolve(res);
			}).catch((err) => {
				reject(err);
			});
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
UserSchema.statics = {
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

	/**
	 * List users in descending order of 'createdAt' timestamp.
	 * @param {number} skip - Number of users to be skipped.
	 * @param {number} limit - Limit number of users to be returned.
	 * @returns {Promise<User[]>}
	 */
	getUsersList({skip = 0, limit = 50} = {}) {
		return this.find()
			.sort({ createdAt: -1 })
			.skip(+skip)
			.limit(+limit)
			.exec();
	}
};

export default mongoose.model('User', UserSchema);
