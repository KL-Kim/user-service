/**
 * Parameters Validation Config
 * @export {Object}
 * @version 0.0.1
 */
import Joi from 'joi';

export default {
	
	/** POST /api/v1/user/signup **/
	"register": {
		"body": {
			email: Joi.string().email().required(),
			password: Joi.string().min(8).strip().required(),
			passwordConfirmation: Joi.any().valid(Joi.ref('password')).options({ language: { any: { allowOnly: 'Passwords do not match' } } }).required(),
		}
	},

	/** POST /api/v1/auth/login **/
	"login": {
		body: {
			email: Joi.string().email().required(),
			password: Joi.string().min(8).strip().required()
		}
	},

	/** GET /api/v1/user/:id **/
	"getUserById": {
		"params": {
			id: Joi.string().hex().required()
		}
	},

	/** GET /api/v1/user/ **/
	"getUsersList": {
		"query": {
			limit: Joi.number(),
			skip: Joi.number()
		}
	},

	/** PUT /api/v1/user/:id **/
	"updateUser": {
		"params": {
			id: Joi.string().hex().required()
		},
		"body": {
			firstName: Joi.string().trim().allow(''),
			lastName: Joi.string().trim().allow(''),
			gender: Joi.string().valid(['Male', 'Female', 'Other']),
			address: {
				province: {
					name: Joi.string(),
					code: Joi.number(),
				},
				city:{
					name: Joi.string(),
					code: Joi.number(),
				},
				area: {
					name: Joi.string(),
					code: Joi.number(),
				},
				street: Joi.string().trim(),
			},
			birthday: Joi.date(),
		}
	},

	/** PUT /api/v1/user/username/:id **/
	"updateUsername": {
		"params": {
			id: Joi.string().hex().required(),
		},
		"body": {
			username: Joi.string().trim().alphanum().min(4).max(30).required(),
		}
	},

	/** POST /api/v1/user/phone/:id **/
	"updateUserPhone": {
		"params": {
			id: Joi.string().hex().required(),
		},
		"body": {
			phoneNumber: Joi.string().trim().length(11).required(),
			code: Joi.string().trim().length(6).required()
		},
	},

	/** GET /api/v1/auth/mail/* **/
	"sendEmail": {
		"params": {
			email: Joi.string().email().required(),
		}
	},

	/** GET /api/v1/user/phoneVerificationCode/* **/
	"sendVerificationCode": {
		"params": {
			phoneNumber: Joi.string().alphanum().length(11).required(),
		}
	},

	/** POST /api/v1/user/password **/
	"changePassword": {
		"body": {
			password: Joi.string().min(8).strip().required(),
			passwordConfirmation: Joi.any().valid(Joi.ref('password')).options({ language: { any: { allowOnly: 'Passwords do not match' } } }).required(),
		}
	},

	/** POST /api/v1/user/admin/:id **/
	"adminEditUser": {
		"params": {
			id: Joi.string().hex().required(),
		},
		"body": {
			role: Joi.string().valid(['regular', 'manager', 'admin']),
			userStatus: Joi.string().valid(['normal', 'suspended']),
		},
	}
};
