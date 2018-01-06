import Promise from 'bluebird';
import Express from 'express';
import compression from 'compression';
import bodyParser from 'body-parser';
import methodOverride from 'method-override';

// For security concern
import helmet from 'helmet';
import csp from 'helmet-csp';
// import csurf from 'csurf';

// For debugging and monitoring
import logger from 'morgan';
import errorHandler from '../helper/error-handler.js'

import config from './config';
import passport from './passport.config';
import routes from '../routes/index.route';

// make bluebird as native Promise
// Promise = require('bluebird');

const app = new Express();

if (process.env.NODE_ENV === 'development') {
	app.use(logger('combined'));
} else if (process.env.NODE_ENV === 'production') {
	app.use(compress());
}

app.use(methodOverride());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: '20mb' }));

// app.use(csurf());
app.use(helmet());
app.use(helmet.hidePoweredBy());

app.use(csp({
  // Specify directives as normal.
  directives: {
    defaultSrc: ["'self'", 'default.com'],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ['style.com'],
    fontSrc: ["'self'", 'fonts.com'],
    imgSrc: ['img.com', 'data:'],
    sandbox: ['allow-forms', 'allow-scripts'],
    reportUri: '/report-violation',
    objectSrc: ["'none'"],
    upgradeInsecureRequests: true
  },

  // This module will detect common mistakes in your directives and throw errors
  // if it finds any. To disable this, enable "loose mode".
  loose: false,

  // Set to true if you only want browsers to report errors, not block them.
  // You may also set this to a function(req, res) in order to decide dynamically
  // whether to use reportOnly mode, e.g., to allow for a dynamic kill switch.
  reportOnly: false,

  // Set to true if you want to blindly set all headers: Content-Security-Policy,
  // X-WebKit-CSP, and X-Content-Security-Policy.
  setAllHeaders: false,

  // Set to true if you want to disable CSP on Android where it can be buggy.
  disableAndroid: false,

  // Set to false if you want to completely disable any user-agent sniffing.
  // This may make the headers less compatible but it will be much faster.
  // This defaults to `true`.
  browserSniff: true
}));

// The sessionID should never be cached
app.use((req, res, next) => {
	res.header('Cache-Control', 'no-cache="Set-Cookie, Set-Cookie2"');
	next();
});

// Passport related
app.use(passport.initialize());

// Connect MongoDB
require('./db.config');

// App routes
app.use('/api', routes);

// Error Handler
if (process.env.NODE_ENV !== 'development') app.use(errorHandler);

export default app;
