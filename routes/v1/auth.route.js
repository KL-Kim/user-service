import Express from 'express';
import passport from 'passport';
import validate from 'express-validation';

import AuthController from '../../controller/auth.controller';
import paramValidation from '../../config/paramValidation';

const router = Express.Router();
const authController = new AuthController();

router.post('/login', validate(paramValidation.login), function(req, res, next) {
	passport.authenticate('local-signup', function(err, token) {
		if (err) next(err);
		if (token)
			res.json(token);
		next();
	})(req, res, next);
});

export default router;