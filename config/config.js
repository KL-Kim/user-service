/**
 * Config Environment Properties
 * @export {Object}
 * @version 0.0.1
 */

import fs from 'fs';
import Joi from 'joi';
import ms from 'ms';
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
		}
	};

	try {
		config.serverPublicKey = fs.readFileSync(__dirname + '/secret/server.cert.pem', 'utf8'),
		config.serverPrivateKey = fs.readFileSync(__dirname + '/secret/server.key.pem', 'utf8'),
		config.jwtPrivateKey = fs.readFileSync(__dirname + '/secret/jwt.key.pem', 'utf8'),
		config.jwtPublicKey = fs.readFileSync(__dirname + '/secret/jwt.cert.pem', 'utf8')
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
