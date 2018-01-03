/**
 * Database Config
 * @export {Mongoose}
 * @version 0.0.1
 */

import Promise from 'bluebird';
import mongoose from 'mongoose';
import config from './config';

mongoose.Promise = Promise;
const mongoUri = config.mongo.host + ':' + config.mongo.port + '/user-serivce';
mongoose.connect(mongoUri, { 
	useMongoClient: true,
	promiseLibrary: Promise,
	keepAlive: 3000000,
}).catch((error) => {
	throw error;
});

export default mongoose;