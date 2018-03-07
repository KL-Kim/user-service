/**
 * Error Handler
 * @version 0.0.1
 */

function errorHandler(err, req, res, next) {

	if (process.env.NODE_ENV !== 'development') {
		delete err.stack;
	}

	if (err.code === 'EBADCSRFTOKEN') {
		// handle CSRF token errors here
	  res.status(403)
	  res.send('form tampered with')
	}

	if (err)
		res.status(err.status || 500).json(err.message);
	else next();
}

export default errorHandler;
