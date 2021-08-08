import dotenv from 'dotenv';
dotenv.config();

const notFoundMiddleware = (req, res, next) => {
    const error = new Error('not found');
    res.status(404);
    return res.json({success: false, message: error.message});
};

const errorMiddleware = (error, req, res, next) => {
    const statusCode = res.statusCode == 200 ? 500 : res.statusCode;
    const message = process.env.APP_ENV == 'production' && statusCode == 500 ?
                    'something went wrong' :
                    error.message;
    
    let response = {
        success: false,
        message: message
    };
    if (process.env.APP_ENV !== 'production') {
        response.stack = error.stack;
    }

    return res.status(statusCode).json(response);
};

export {errorMiddleware, notFoundMiddleware};