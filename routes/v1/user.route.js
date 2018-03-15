import Express from 'express';
import validate from 'express-validation';

import UserController from '../../controller/user.controller';
import paramValidation from '../../config/param-validation';

const router = Express.Router();
const userController = new UserController();

/** POST /api/v1/user/register - Create new user **/
router.post('/register', validate(paramValidation.createUser), userController.createNewUser);

/** GET /api/v1/user - Get list of users **/
router.get('/', validate(paramValidation.getUsersList), userController.getUsersList);

/** GET /api/v1/user/:id - Get user data **/
router.get('/:id', validate(paramValidation.getUserById), userController.getUserById);

/** PUT /api/v1/user/:id - Edit user profile info **/
router.put('/:id', validate(paramValidation.updateUser), userController.updateUserProfile);

/** PUT /api/v1/user/username/:id - Edit user profile info **/
router.put('/useranme/:id', validate(paramValidation.updateUsername), userController.updateUsername);

/** POST /api/v1/user/mail/verify - Send account verification email **/
router.post('/mail/verify', validate(paramValidation.sendEmail), userController.sendAccountVerificationEmail);

/** POST /api/v1/user/mail/password - Send changing password email **/
router.post('/mail/password', validate(paramValidation.sendEmail), userController.sendChangePasswordEmail);

/** post /api/v1/auth/password - Change password **/
router.post('/password', validate(paramValidation.changePassword), userController.changePassword);

export default router;
