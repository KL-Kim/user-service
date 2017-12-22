import fs from 'fs';
const Joi = require('joi');
require('dotenv').config();

const envVarsSchema = Joi.object({
	NODE_ENV: Joi.string()
		.allow('development', 'production', 'test')
		.default('development'),
	SERVER_PORT: Joi.number()
		.default(3000),
	MONGO_HOST: Joi.string().required().default('localhost'),
	MONGO_PORTS: Joi.number().default(27017),
	JWT_ALGORITHM: Joi.string(),
	JWT_ISSUER: Joi.string(),
	JWT_AUDIENCE: Joi.string(),
}).unknown().required();

const {error, value: envVars} = Joi.validate(process.env, envVarsSchema);

if (error) {
	throw new Error(`Config validation error: ${error.message}`);
}

const config = {
	env: envVars.NODE_ENV,
	port: envVars.SERVER_PORT,
	mongo: {
		host: envVars.MONGO_HOST,
		port: envVars.MONGO_PORTS
	},
	jwtOptions: {
		algorithm: envVars.JWT_ALGORITHM,
		issuer: envVars.JWT_ISSUER,
		audience: envVars.JWT_AUDIENCE,
	},
	jwtPrivateKey: fs.readFileSync(__dirname + '/secret/private.key.pem', 'utf8'),
	jwtPublicKey: fs.readFileSync(__dirname + '/secret/public.key.pub', 'utf8')
};

export default config;