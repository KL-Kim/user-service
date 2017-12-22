'use strict';

//require('babel-register');

import Express from 'express';
import mongoose from 'mongoose';
import compression from 'compression';
import bodyParser from 'body-parser';
import session from 'express-session';
// import flash from 'connect-flash';
// For security concern
// import csurf from 'csurf';
// import helmet from 'helmet';

// For debugging and monitoring
import logger from 'morgan';

import config from './config/config';
import passport from './config/passport';
import routes from './routes/index.route';

// make bluebird as default Promise
Promise = require('bluebird');

const app = new Express();

app.use(compression());
// app.use(logger('combined'));
app.use(bodyParser.json({ limit: '20mb' }));
// app.use(csurf());

// Set native promises as mongoose promise
mongoose.Promise = Promise;
const mongoUri = config.mongo.host + ':' + config.mongo.port + '/user-serivce';
mongoose.connect(mongoUri, { 
	useMongoClient: true,
	promiseLibrary: Promise,
	keepAlive: 3000000,
}).catch((error) => {
	throw new Error(`unable to connect to database: ${mongoUri}`);
});

//app.use(session({ secret: 'ilovescotchscotchyscotchscotch' }));
app.use(passport.initialize());
app.use(passport.session())
// //app.use(flash());

app.use('/api', routes);

app.listen(config.port, () => {
	console.log("Server is listening on port: " + config.port);
});
