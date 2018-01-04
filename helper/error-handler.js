/**
 * Error Handler
 * @version 0.0.1
 */

function errorHandler(err, req, res, next) {

	if (req.app.get('env') !== 'development') {
		delete err.stack;
	}

	if (err)
		res.status(err.statusCode || 500).json(err.message);
	else next();
}

export default errorHandler;