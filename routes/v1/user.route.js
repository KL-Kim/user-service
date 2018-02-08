import Express from 'express';
import validate from 'express-validation';

import UserController from '../../controller/user.controller';
import paramValidation from '../../config/param-validation';

const router = Express.Router();
const userController = new UserController();

/** POST /api/v1/user/signup - Create new user **/
router.post('/register', validate(paramValidation.createUser), userController.createNewUser);

/** GET /api/v1/user - Get list of users **/
router.get('/', validate(paramValidation.getUsersList), userController.getUsersList);

/** GET /api/v1/user/:id - Get user data **/
router.get('/:id', validate(paramValidation.getUserById), userController.getUserById);

/** Put /api/v1/user/:id - Edit user info **/
router.put('/:id', validate(paramValidation.updateUser), userController.updateUser);

export default router;
