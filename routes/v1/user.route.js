import Express from 'express';
import passport from 'passport';
import validate from 'express-validation';

import UserController from '../../controller/user.controller';
import paramValidation from '../../config/paramValidation';

const router = Express.Router();
const userController = new UserController();

/** GET /api/v1/user - Get list of users */
router.get('/', userController.list)
  
/** POST /api/v1/user/signup - Create new user */
router.post('/signup', validate(paramValidation.createUser), function(req, res, next) {
	passport.authenticate('local-signup', function(err, user) {
		if (err) next(err);
		if (user)
			res.json(user);
		next();
	})(req, res, next);
});

export default router;