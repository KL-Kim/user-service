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

/** GET /api/v1/auth/verify - Account Verification **/
router.get('/verify', authController.accountVerification);

export default router;
