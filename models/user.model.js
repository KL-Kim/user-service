/**
 * User Model
 *
 * @version 0.0.1
 *
 * @author KL-Kim (https://github.com/KL-Kim)
 * @license MIT
 */

import Promise from 'bluebird';
import mongoose, { Schema } from 'mongoose';
import httpStatus from 'http-status';
import bcrypt from 'bcrypt';
import _ from 'lodash';

import APIError from '../helper/api-error';

// Salt rounds for bcrypt
const saltRounds = 12;

/**
 * User mongoose schema
 */
const UserSchema = new Schema({
	"username": {
		type: String,
		required: true,
		trim: true,
		unique: true,
		index: true,
		minLength: [4, 'The value of path `{PATH}` (`{VALUE}`) is shorter than the minimum allowed length ({MINLENGTH}).'],
		maxLength: [30, 'The value of path `{PATH}` (`{VALUE}`) is longer than the maximum allowed length ({MAXLENGTH}).'],
	},
	"email": {
		type: String,
		unique: true,
		required: true,
		trim: true,
		match: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i,
	},
	"phoneNumber": {
		type: String,
		// required: [() => { return this.email == null; }, 'phoneNumber is required if email is not specified'],
	},
	"password": {
		type: String,
		minLength: [8, 'The value of path `{PATH}` (`{VALUE}`) is shorter than the minimum allowed length ({MINLENGTH}).'],
		required: true
	},
	"firstName": {
		type: String
	},
	"lastName": {
		type: String
	},
	"language": {
		type: String
	},
	"gender": {
		type: String,
		enum: ['Male', 'Female', 'Other']
	},
	"birthday": {
		type: Date,
	},
	"address": {
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
			trim: true,
		},
	},
	"generalLocation": {
		name: {
			type: String
		},
		code: {
			type: Number
		} 
	},
	"isVerified": {
		type: Boolean,
		default: false
	},
	"point": {
		type: Number,
		default: 0
	},
	"vip": {
		type: String,
		enum: ['normal', 'copper', 'silver', 'gold', 'premium'],
		default: 'normal',
	},
	"following": [{
		type: Schema.Types.ObjectId,
		ref: 'User'
	}],
	"followers": [{
		type: Schema.Types.ObjectId,
		ref: 'User'
	}],
	"favors": [{
		type: Schema.Types.ObjectId,
		ref: 'Business'
	}],
	"interestedIn":[{
		type: String,
	}],
	"profilePhotoUri": {
		type: String,
		default: ''
	},
	"activeCity": {
		type: Number,
	},
	"lastLogin": [{
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
	"role": {
		type: String,
		required: true,
		default: 'regular',
		enum: ['god', 'admin', 'manager', 'writer', 'owner', 'regular']
	},
	"userStatus": {
		type: String,
		enum: ['normal', 'suspended'],
		default: 'normal'
	},
	"createdAt": {
		type: Date,
		default: Date.now,
		index: true
	},
});

/**
 * Virtuals
 */
UserSchema.virtual('id')
	.get(function() { return this._id });

/**
 * Middleware
 */
UserSchema.pre('save', function(next) {
	let user = this;

	while(user.lastLogin.length > 20) {
		user.lastLogin.shift();
	}

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
			bcrypt.compare(password, this.password)
				.then((res) => {
					return resolve(res);
				})
				.catch((err) => {
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
		if (obj. createdAt) obj.createdAt = obj.createdAt.toLocaleDateString();
		if (obj.birthday) obj.birthday = obj.birthday ? obj.birthday.toLocaleDateString() : '';
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
	 * @returns {Promise<User>}
	 */
	getById(id) {
		return this.findById(id).exec();
	},

	/**
	 * Get user by email
	 * @param {string} email - User's eamil
	 * @returns {Promise<User>}
	 */
	getByEmail(email) {
		return this.findOne({ "email": email }).exec();
	},

	/**
	 * Get user by username
	 * @param {string} username - User's username
	 * @returns {Promise<User>}
	 */
	getByUsername(username) {
		return this.findOne({ 'username': username }).exec();
	},

	/**
	 * List users in descending order of 'createdAt' timestamp.
	 * @param {number} skip - Number of users to be skipped.
	 * @param {number} limit - Limit number of users to be returned.
	 * @param {object} filter - Filter users list
	 * @param {string} search - Search string
	 * @returns {Promise<User[]>}
	 */
	getUsersList({ skip = 0, limit = 20, filter = {}, search } = {}) {
		let conditions,
			searchCondition,
			roleCondition,
			statusCondition;

		if (filter.role) {
			roleCondition = {
				"role": {
					"$in": filter.role
				}
			}
		}

		if (filter.userStatus) {
			statusCondition = {
				"userStatus": {
					"$in": filter.userStatus
				}
			}
		}

		if (search) {
			searchCondition = {
				$or: [
					{
						"username": {
							$regex: search,
							$options: 'i'
						}
					},
					{
						"email": {
							$regex: search,
							$options: 'i'
						}
					}
				]
			}
		}

		if (roleCondition || statusCondition || searchCondition) {
			conditions = {
				"$and": [_.isEmpty(searchCondition) ? {} : searchCondition,
					_.isEmpty(roleCondition) ? {} : roleCondition,
					_.isEmpty(statusCondition) ? {} : statusCondition]
			};
		}

		return this.find(_.isEmpty(conditions) ? {} : conditions, 'email username firstName lastName role userStatus')
			.sort({ createdAt: -1 })
			.skip(+skip)
			.limit(+limit)
			.exec();
	},

	/**
	 * Count of filtered users
	 * @param {object} filter - Filter users list
	 */
	getCount({ filter = {}, search } = {}) {
		let conditions,
			searchCondition,
			roleCondition,
			statusCondition;

		if (!_.isEmpty(filter.role) && filter.role) {
			roleCondition = {
				"role": {
					"$in": filter.role
				}
			}
		}

		if (!_.isEmpty(filter.userStatus) && filter.userStatus) {
			statusCondition = {
				"userStatus": {
					"$in": filter.userStatus
				}
			}
		}

		if (search) {
			const escapedString =  _.escapeRegExp(search)
			searchCondition = {
				$or: [
					{
						"username": {
							$regex: escapedString,
							$options: 'i'
						}
					},
					{
						"email": {
							$regex: escapedString,
							$options: 'i'
						}
					}
				]
			}
		}

		if (roleCondition || statusCondition || searchCondition) {
			conditions = {
				"$and": [_.isEmpty(searchCondition) ? {} : searchCondition,
					_.isEmpty(roleCondition) ? {} : roleCondition,
					_.isEmpty(statusCondition) ? {} : statusCondition]
			};
		}

		return this.count(_.isEmpty(conditions) ? {} : conditions).exec();
	}
};

export default mongoose.model('User', UserSchema);
