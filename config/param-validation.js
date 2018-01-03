/**
 * Parameters Validation Config
 * @export {Object}
 * @version 0.0.1
 */

import Joi from 'joi';

export default {
	/** Post /api/v1/user/signup **/
	createUser: {
		body: {
			username: Joi.string().alphanum().trim().min(3).required(),
			password: Joi.string().min(6).strip().required(),
			passwordConfirmation: Joi.any().valid(Joi.ref('password')).options({ language: { any: { allowOnly: 'Passwords do not match' } } }).required(),
			email: Joi.string().email().required(),
			firstName: Joi.string().alphanum().trim(),
			lastName: Joi.string().alphanum().trim(),
		}
	},

	/** Post /api/v1/auth/login **/
	login: {
		body: {
			email: Joi.string().email().required(),
			password: Joi.string().min(8).strip().required()
		}
	},

	/** Get /api/v1/user/:id **/
	getUserById: {
		params: {
			id: Joi.string().hex().required()
		}
	},

	getUsersList: {
		query: {
			limit: Joi.number(),
			skip: Joi.number()
		}
	}
};