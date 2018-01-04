'use strict';

import Express from 'express';
import compression from 'compression';
import bodyParser from 'body-parser';
import methodOverride from 'method-override';

// For security concern
// import csurf from 'csurf';
// import helmet from 'helmet';

// For debugging and monitoring
import logger from 'morgan';
import errorHandler from './helper/error-handler.js'

import config from './config/config';
import passport from './config/passport.config';
// import session from './config/session';
import routes from './routes/index.route';

// make bluebird as native Promise
Promise = require('bluebird');

const app = new Express();

if (process.env.NODE_ENV === 'development') {
	app.use(logger('dev'));
} else if (process.env.NODE_ENV === 'production') {
	app.use(compress());
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: '20mb' }));
app.use(methodOverride());
// app.use(session);
// app.use(csurf());
// app.user(helmet());

// The sessionID should never be cached
app.use((req, res, next) => {
	res.header('Cache-Control', 'no-cache="Set-Cookie, Set-Cookie2"');
	next();
});

// Check session hijacking
// app.use((req, res, next) => {
// 	// User should be have a session
// 	if (!req.session) {
// 		next(new Error('Session object messing'));
// 		return ;
// 	}

// 	// Guest skip cheking ip and user agent
// 	if (!req.session.isLoggedIn()) {
// 		next();
// 		return;
// 	}

// 	// Check ip match
// 	if (req.session._ip !== req.ip) {
// 		// User account may be hijacked
// 		next(new Error('The request IP did not match session IP'));

// 		// Generate a new unauthenticated session
// 		req.session.regenerate(() => next());
// 		return ;
// 	}

// 	// Check user agent match
// 	if (req.session._ua !== req.headers['user-agent']) {
// 		// User account may be hijacked
// 		next(new Error('The request user agent did not match session user agent'));

// 		// Generate a new unauthenticated session
// 		req.session.regenerate(() => next());
// 		return ;
// 	}
// 	next();
// });

// Passport related
app.use(passport.initialize());
// app.use(passport.session());

// Connect MongoDB
require('./config/db.config');

// App routes
app.use('/api', routes);

app.use(errorHandler);

app.listen(config.port, () => {
	console.log("Server is listening on port: " + config.port);
});

// Export for App testing
export default app;