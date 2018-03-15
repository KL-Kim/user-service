/**
 * Config Environment Properties
 * @export {Object}
 * @version 0.0.1
 */

import fs from 'fs';
import Joi from 'joi';
import ms from 'ms';
import mailAccount from './secret/mail-account';
require('dotenv').config();

function setConfig() {

	/**
	 * Joi Validation Schema
	 */
	const envVarsSchema = Joi.object({
		NODE_ENV: Joi.string()
			.allow('development', 'production', 'test')
			.default('development'),
		SERVER_PORT: Joi.number()
			.default(3001),
		MONGO_HOST: Joi.string().default('localhost'),
		MONGO_PORTS: Joi.number().default(27017),
		WEB_SERVICE_HOST: Joi.string().required(),
		WEB_SERVICE_PORT: Joi.number().default(80),
		REFRESH_JWT_ALGORITHM: Joi.string().default('RS256'),
		REFRESH_JWT_EXPIRATION: Joi.string().default(ms('60d')),
		REFRESH_JWT_ISSUER: Joi.string().allow(''),
		REFRESH_JWT_AUDIENCE: Joi.string().allow(''),
		REFRESH_JWT_KEY: Joi.string().default('id'),
		ACCESS_JWT_ALGORITHM: Joi.string().default('RS256'),
		ACCESS_JWT_ISSUER: Joi.string().allow(''),
		ACCESS_JWT_AUDIENCE: Joi.string().allow(''),
		ACCESS_JWT_EXPIRATION: Joi.string().default(ms('1h')),
		// SESSION_SECRET: Joi.string().required(),
	}).unknown(true);

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
		webService: {
			host: envVars.WEB_SERVICE_HOST,
			port: envVars.WEB_SERVICE_PORT,
			accountVerifyUrl: envVars.WEB_SERVICE_HOST + ':' + envVars.WEB_SERVICE_PORT + '/verify/',
			changePasswordUrl: envVars.WEB_SERVICE_HOST + ':' + envVars.WEB_SERVICE_PORT + '/change-password/',
		},
		// sessionSecret: envVars.SESSION_SECRET,
		refreshTokenCookieKey: envVars.REFRESH_JWT_COOKIE_KEY,
		refreshTokenOptions: {
			algorithm: envVars.REFRESH_JWT_ALGORITHM,
			expiresIn: envVars.REFRESH_JWT_EXPIRATION,
			//issuer: envVars.REFRESH_JWT_ISSUER,
			//audience: envVars.REFRESH_JWT_AUDIENCE,
		},
		accessTokenOptions: {
			algorithm: envVars.ACCESS_JWT_ALGORITHM,
			expiresIn: envVars.ACCESS_JWT_EXPIRATION,
			//issuer: envVars.ACCESS_JWT_ISSUER,
			//audience: envVars.ACCESS_JWT_AUDIENCE,
		},
		mailAccount: mailAccount,
	};

	try {
		config.serverPublicKey = fs.readFileSync(__dirname + '/secret/server.cert.pem', 'utf8');
		config.serverPrivateKey = fs.readFileSync(__dirname + '/secret/server.key.pem', 'utf8');
		config.refreshTokenPrivateKey = fs.readFileSync(__dirname + '/secret/refresh.jwt.key.pem', 'utf8');
		config.refreshTokenPublicKey = fs.readFileSync(__dirname + '/secret/refresh.jwt.cert.pem', 'utf8');
		config.accessTokenPrivateKey = fs.readFileSync(__dirname + '/secret/access.jwt.key.pem', 'utf8');
		config.accessTokenPublicKey = fs.readFileSync(__dirname + '/secret/access.jwt.cert.pem', 'utf8');
	} catch(err) {
		throw err;
	}

	// Read File Async
	// fs.readFile(__dirname + '/secret/server.cert.pem', 'utf8', (err, data) => {
	// 	if (err) throw err;
	// 	config.serverPublicKey = data;
	// 	onsole.log(config.serverPublicKey);
	// fs.readFile(__dirname + '/secret/sever.key.pem', 'utf8', (err, data) => {
	// 	if (err) throw err;
	// 	config.serverPrivateKey = data;
	// });
	// fs.readFile(__dirname + '/secret/jwt.cert.pem', 'utf8', (err, data) => {
	// 	if (err) throw err;
	// 	config.jwtPublicKey = data;
	// });
	// fs.readFile(__dirname + '/secret/jwt.cert.key', 'utf8', (err, data) => {
	// 	if (err) throw err;
	// 	config.jwtPrivateKey = data;
	// });

	// Using Stream & Pipe
	//config.serverPublicKey = fs.createReadStream(__dirname + '/secret/server.cert.pem');

	return config;
}

export default setConfig();
