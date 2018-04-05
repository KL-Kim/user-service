import Express from 'express';
import validate from 'express-validation';
import multer from 'multer';

import UserController from '../../controller/user.controller';
import paramValidation from '../../config/param-validation';

const router = Express.Router();
const userController = new UserController();
validate.options({
  allowUnknownBody: false,
  allowUnknownHeaders: true,
  allowUnknownQuery: true,
  allowUnknownParams: true,
  allowUnknownCookies: true
});

const storage = multer.diskStorage({
  "destination": (req, file, cb) => {
    cb(null, './avatars/');
  },
  "filename": (req, file, cb) => {
    cb(null, file.originalname + '.avatar.jpeg');
  }
});

const upload = multer({
  "storage": storage,
  "fileFilter": (req, file, cb) => {
    if (file.mimetype === 'image/jpeg') {
      cb(null, true);
    } else {
      cb(new Error("Avatar - Not supported format"));
    }
  }
});

/** POST /api/v1/user/register - Create new user **/
router.post('/register', validate(paramValidation.register), userController.registerNewUser);

/** GET /api/v1/user/verify - Account Verification **/
router.get('/verify', userController.accountVerification);

/** GET /api/v1/user/:id - Get user data **/
router.get('/:id', validate(paramValidation.getUserById), userController.getUserById);

/** PUT /api/v1/user/:id - Edit user profile info **/
router.put('/:id', validate(paramValidation.updateUser), userController.updateUserProfile);

/** PUT /api/v1/user/username/:id - Edit user profile info **/
router.put('/useranme/:id', validate(paramValidation.updateUsername), userController.updateUsername);

/** PUT /api/v1/user/phone/:id - Update user telephone **/
router.post('/phone/:id', validate(paramValidation.updateUserPhone), userController.updateUserPhone);

/** POST /api/v1/user/photo/:id - Update user profile photo **/
router.post('/profilePhoto/:id', upload.single('avatar'), userController.uploadProfilePhoto);

/** POST /api/v1/user/password - Change password **/
router.post('/password', validate(paramValidation.changePassword), userController.changePassword);

/** POST /api/v1/user - Get list of users **/
router.post('/', validate(paramValidation.getUsersList), userController.adminGetUsersList);

/** POST /api/v1/user/admin/:id - Admin edit user data **/
router.post('/admin/:id', validate(paramValidation.adminEditUser), userController.adminEditUser);

export default router;
