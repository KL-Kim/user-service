/**
 * Config Environment Properties
 * @export {Object}
 * @version 0.0.1
 */

import fs from 'fs';
import Joi from 'joi';
import ms from 'ms';
require('dotenv').config();

/**
 * Joi Validation Schema
 */
const envVarsSchema = Joi.object({
	NODE_ENV: Joi.string()
		.allow('development', 'production', 'test')
		.default('development'),
	SERVER_PORT: Joi.number()
		.default(3000),
	MONGO_HOST: Joi.string().default('localhost'),
	MONGO_PORTS: Joi.number().default(27017),
	JWT_ALGORITHM: Joi.string().default('RS256'),
	JWT_EXPIRATION: Joi.string().default(ms('2d')),
	JWT_ISSUER: Joi.string().allow(''),
	JWT_AUDIENCE: Joi.string().allow(''),
	// SESSION_SECRET: Joi.string().required(),
}).unknown();

const {error, value: envVars} = Joi.validate(process.env, envVarsSchema);

if (error) {
	throw new Error(`Config Validation Error: ${error.message}`);
}

const config = {
	env: envVars.NODE_ENV,
	port: envVars.SERVER_PORT,
	mongo: {
		host: envVars.MONGO_HOST,
		port: envVars.MONGO_PORTS
	},
	// sessionSecret: envVars.SESSION_SECRET,
	jwtOptions: {
		algorithm: envVars.JWT_ALGORITHM,
		expiresIn: envVars.JWT_EXPIRATION,
		//issuer: envVars.JWT_ISSUER,
		//audience: envVars.JWT_AUDIENCE,
	},
	jwtPrivateKey: fs.readFileSync(__dirname + '/secret/private.key.pem', 'utf8'),
	jwtPublicKey: fs.readFileSync(__dirname + '/secret/public.key.pub', 'utf8')
};

export default config;