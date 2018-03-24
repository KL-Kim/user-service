import Express from 'express';
import validate from 'express-validation';

import AuthController from '../../controller/auth.controller';
import paramValidation from '../../config/param-validation';

const router = Express.Router();
const authController = new AuthController();

/** Post /api/v1/auth/login - User login **/
router.post('/login', validate(paramValidation.login), authController.login);

/** GET /api/v1/auth/logout - User logout **/
router.get('/logout', authController.logout);

/** GET /api/v1/auth/token - Issue access token **/
router.get('/token', authController.issueAccessToken);

/** GET /api/v1/auth/phoneVerificationCode/:phoneNumber - Send Verification Code **/
router.get('/phoneVerificationCode/:phoneNumber', 
	validate(paramValidation.sendVerificationCode), 
	authController.sendPhoneVerificationCode
);

/** GET /api/v1/auth/mail/verify/:email - Send account verification email **/
router.get('/mail/verify/:email', validate(paramValidation.sendEmail), authController.sendAccountVerificationEmail);

/** GET /api/v1/auth/mail/password/:email - Send changing password email **/
router.get('/mail/password/:email', validate(paramValidation.sendEmail), authController.sendChangePasswordEmail);

export default router;
