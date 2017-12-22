import Joi from 'joi';

export default {
	// Post /api/v1/user/signup
	createUser: {
		body: {
			username: Joi.string().alphanum().trim().min(3).required(),
			password: Joi.string().min(6).strip().required(),
			passwordConfirmation: Joi.any().valid(Joi.ref('password')).options({ language: { any: { allowOnly: 'Passwords do not match' } } }),
			email: Joi.string().email().required(),
			firstName: Joi.string().alphanum().trim(),
			lastName: Joi.string().alphanum().trim(),
		}
	},

	login: {
		body: {
			email: Joi.string().email().required(),
			password: Joi.string().min(6).strip().required()
		}
	}
};