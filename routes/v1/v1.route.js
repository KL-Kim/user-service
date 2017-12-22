import Express from 'express';
import userRoute from './user.route';
import authRoute from './auth.route';

const router = Express.Router();

router.use('/user', userRoute);
router.use('/auth', authRoute);

export default router;