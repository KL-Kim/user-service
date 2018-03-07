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
	role: {
		type: String,
		required: true,
		default: 'regular',
		enum: ['god', 'admin', 'manager', 'regular']
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
	gender: {
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
	userStatus: {
		type: String,
		enum: ['normal', 'suspened'],
		default: 'normal'
	},
	isVerified: {
		type: Boolean,
		default: false
	},
	profilePhotoUri: {
		type: String,
		default: ''
	},
	lastLoginIp: {
		type: String
	},
	lastLoginAt: {
		type: Date,
		default: Date.now
	},
	createdAt: {
		type: Date,
		default: Date.now
	},
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
		return next();
	}).catch((err) => {
		return next(new APIError("Hashing password failed", httpStatus.INTERNAL_SERVER_ERROR));
	});
});

UserSchema.pre('update', function(next) {
	let query = this;
	let update = query.getUpdate();

	if (!update.password) {
		return next();
	}

	bcrypt.hash(update.password, saltRounds).then((hash) => {
		update.password = hash;
		return next();
	}).catch((err) => {
		return next(new APIError("Hashing password failed", httpStatus.INTERNAL_SERVER_ERROR));
	});
})

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
				return resolve(res);
			}).catch((err) => {
				return reject(err);
			});
		});
	},

	toJSON() {
		let obj = this.toObject();
		delete obj.password;
		delete obj.__v;
		return obj;
	},
};

/**
 * Statics
 */
UserSchema.statics = {
	// Get user by Id
	getById(id) {
		return this.findById(id).exec();
	},

	// Get user by name
	getByEmail(email) {
		return this.findOne({ email: email }).exec();
	},

	// Get user by username
	getByUsername(username) {
		return this.findOne({ username: username }).exec();
	},

	// Get user by username
	/**
	 * Get user by username
	 * @param {string} username - User's usernameField
	 * @returns {<User>, false}
	 */
	getByUsername(username) {
		return this.findOne({ 'username': username }).exec();
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
