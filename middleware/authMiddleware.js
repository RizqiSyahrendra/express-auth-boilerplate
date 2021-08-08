import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
dotenv.config();

export const apiTokenMiddleware = (req, res, next) => {
    if (req.body.token != process.env.API_SECRET) {
        res.status(401);
        return next(new Error('unauthorized'));
    }
    return next();
}

export const jwtTokenMiddleware = (req, res, next) => {
    const token = req.body.token;
    if(!token){
        res.status(401);
        return next(new Error('unauthorized'));
    }

    let user_login = {};
    try {
        user_login = jwt.verify(token, process.env.JWT_SECRET);
        req.user_login = user_login;
        return next();
    } catch (error) {
        res.status(401);
        return next(new Error(error.message));
    }
}
