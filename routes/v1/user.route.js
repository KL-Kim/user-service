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
  allowUnknownParams: false,
  allowUnknownCookies: true
});

const storage = multer.diskStorage({
  "destination": 'tmp/',
  "filename": (req, file, cb) => {
    cb(null, file.originalname + '.jpeg');
  },
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

/** GET /api/v1/user/:id - Get signle user data **/
router.get('/single/:id', validate(paramValidation.getMyself), userController.getMyself);

/** PUT /api/v1/user/:id - Update user profile info **/
router.put('/single/:id', validate(paramValidation.updateUser), userController.updateUserProfile);

/** GET /api/v1/user/username/:name - Get user by username **/
router.get('/username/:name', validate(paramValidation.getUserByUsername), userController.getUserByUsername);

/** PUT /api/v1/user/username/:id - Update username **/
router.put('/username/:id', validate(paramValidation.updateUsername), userController.updateUsername);

/** POST /api/v1/user/favor/:id - Add or delete favorite business **/
router.post('/favor/:id', validate(paramValidation.operateFavor), userController.operateFavor);

/** POST /api/v1/user/phone/:id - Update user telephone **/
router.post('/phone/:id', validate(paramValidation.updateUserPhone), userController.updateUserPhone);

/** POST /api/v1/user/photo/:id - Update user profile photo **/
router.post('/profilePhoto/:id', upload.single('avatar'), userController.uploadProfilePhoto);

/** POST /api/v1/user/password - Change password **/
router.post('/password', validate(paramValidation.changePassword), userController.changePassword);

/** GET /api/v1/user - Admin get users list **/
router.get('/admin', validate(paramValidation.getUsersListByAdmin), userController.getUsersListByAdmin);

/** GET /api/v1/user/admin/:id - Admin get single user **/
router.get('/admin/:id', validate(paramValidation.getSingleUserByAdmin), userController.getSingleUserByAdmin);

/** POST /api/v1/user/admin/:id - Admin edit user **/
router.post('/admin/:id', validate(paramValidation.editUserByAdmin), userController.editUserByAdmin);

export default router;
