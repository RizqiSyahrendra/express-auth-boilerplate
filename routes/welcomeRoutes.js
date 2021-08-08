import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
    return res.send({success: true, message: `Welcome to ${process.env.APP_NAME} API`});
});

export default router;