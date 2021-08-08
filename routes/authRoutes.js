import express from 'express';
import {apiTokenMiddleware,jwtTokenMiddleware} from '../middleware/authMiddleware.js';
import { 
    login, register, verify, 
    logout, sendVerification, getUser, updateUser 
} from '../controller/authController.js';

const router = express.Router();

router.post('/register', [apiTokenMiddleware], register);
router.get('/verify', verify);
router.post('/login', [apiTokenMiddleware], login);
router.post('/logout', [jwtTokenMiddleware], logout);
router.post('/send-verification', [jwtTokenMiddleware], sendVerification);
router.post('/get-user', [jwtTokenMiddleware], getUser);
router.post('/update-user', [jwtTokenMiddleware], updateUser);

export default router;