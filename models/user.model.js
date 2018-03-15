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
		minLength: [4, 'The value of path `{PATH}` (`{VALUE}`) is shorter than the minimum allowed length ({MINLENGTH}).'],
		maxLength: [30, 'The value of path `{PATH}` (`{VALUE}`) is longer than the maximum allowed length ({MINLENGTH}).'],
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
		enum: ['Male', 'Female', 'Other']
	},
	birthday: {
		type: Date,
	},
	address: {
		province: {
			name: {
				type: String
			},
			code: {
				type: Number
			}
		},
		city: {
			name: {
				type: String
			},
			code: {
				type: Number
			}
		},
		area: {
			name: {
				type: String
			},
			code: {
				type: Number
			}
		},
		street: {
			type: String,
		},
	},
	isVerified: {
		type: Boolean,
		default: false
	},
	userStatus: {
		type: String,
		enum: ['normal', 'suspended'],
		default: 'normal'
	},
	point: {
		type: Number,
		default: 0
	},
	following: [{
		id: {
			type: String,
		},
		username: {
			type: String
		}
	}],
	followers: [{
		id: {
			type: String,
		},
		username: {
			type: String
		}
	}],
	interestedIn:[{
		type: String,
	}],
	profilePhotoUri: {
		type: String,
		default: ''
	},
	lastLogin: [{
		agent: {
			type: String
		},
		ip: {
			type: String
		},
		time: {
			type: Date,
			default: Date.now
		},
	}],
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
	let user = this;

	// if (user.lastLogin.length > 2) {
	// 	user.lastLogin.shift();
	// }

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

	// console.log(update);

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

	/**
	 * Remove unnecessary info
	 */
	toJSON() {
		let obj = this.toObject();
		delete obj.password;
		delete obj.__v;
		delete obj.lastLogin;
		delete obj.createdAt;
		obj.birthday = obj.birthday ? obj.birthday.toLocaleDateString() : '';
		return obj;
	},
};

/**
 * Statics
 */
UserSchema.statics = {
	/**
	 * Get user by id
	 * @param {string} id - User's Id
	 * @returns {<User>, false}
	 */
	getById(id) {
		return this.findById(id).exec();
	},

	/**
	 * Get user by email
	 * @param {string} email - User's eamil
	 * @returns {<User>, false}
	 */
	getByEmail(email) {
		return this.findOne({ email: email }).exec();
	},

	/**
	 * Get user by username
	 * @param {string} username - User's username
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
