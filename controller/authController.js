import asyncHandler from 'express-async-handler';
import db from '../config/database.js';
import {transporter} from '../config/mail.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import md5 from 'md5';

dotenv.config();

export const login = asyncHandler(async(req, res) => {
    let email = req.body.email;
    let password = ""+req.body.password;

    const result = await db.query("select * from users where email=?", [
        email
    ]);

    if (result.length > 0) {
        let user = result[0];
        
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            res.status(404);
            throw new Error('Email or password is invalid');
        }

        delete user.password;

        const token = jwt.sign({
            "id" : user.id,
            "email" : user.email,
            "name": user.name
        }, process.env.JWT_SECRET);

        return res.json({
            success: true, 
            message: 'login success',
            data: {...user, access_token: token}
        });
    }

    res.status(404);
    throw new Error('Email or password is invalid');
});

export const logout = asyncHandler(async(req, res) => {
    return res.status(200).json({
        success: true, 
        message: 'logout success'
    });
});

export const register = asyncHandler(async(req, res) => {
    let name = req.body.name;
    let email = req.body.email;
    let password = `${req.body.password}`;
    let confirmPassword = `${req.body.confirm_password}`;
    
    /* validation */
    if (name === null || name.trim() === "") {
        res.status(400);
        throw new Error('name is required');
    }
    if (email === null || email.trim() === "") {
        res.status(400);
        throw new Error('email is required');
    }
    if (password === null || password.trim() === "") {
        res.status(400);
        throw new Error('password is required');
    }
    if (confirmPassword === null || confirmPassword.trim() === "") {
        res.status(400);
        throw new Error('password confirmation is required');
    }
    if (password.trim() !== confirmPassword.trim()) {
        res.status(400);
        throw new Error('password and confirmation password do not match');
    }
    /* end validation */

    const available = await db.query("select * from users where email = ?", [email]);
    if(available.length > 0) {
        res.status(403);
        throw new Error('email is already registered');
    }

    let verifToken = md5(name) + md5(email);
    password = bcrypt.hashSync(password.trim(), 10);

    const registered = await db.query("insert into users (name, email, password, verif_token) values(?,?,?,?)", [
        name,
        email,
        password,
        verifToken
    ]);

    const host = req.get('host');

    sendEmail(host, registered.insertId);

    return res.json({
        success: true,
        message: 'user has been registered succesfully, please check your mail inbox and spam to verify your email'
    });
});

export const verify = asyncHandler(async(req, res) => {
    let token = req.query.token;
    let result = await db.query("select id from users where verif_token = ? and `status`=0", [token]);
    const user = result[0];
    if (result.length > 0) {
        await db.query("update users set `status`=1 where verif_token=?", [token]);
        await db.query("update users set verif_token=NULL where id=?", [user.id]);

        return res.send('User has been verified successfully.');
    }

    res.status(404);
    throw new Error('not found');
});

export const sendVerification = asyncHandler(async(req, res) => {
    const id = req.body.id
    const host = req.get('host');
    await sendEmail(host, id);

    return res.json({
        success: true, 
        message: "verification email has been sent, please verify your account"
    });
});

export const getUser = asyncHandler(async(req, res) => {
    const id = req.body.id
    const users = await db.query("select * from users where id=?", [id]);
    if (users.length <= 0) {
        res.status(404);
        throw new Error('user not found');
    }

    const user = users[0];

    return res.json({
        success: true, 
        message: "get user success",
        data: user
    });
});

export const updateUser = asyncHandler(async(req, res) => {
    const id = req.body.id
    const users = await db.query("select * from users where id=?", [id]);
    if (users.length <= 0) {
        res.status(404);
        throw new Error('user not found');
    }

    const user = users[0];
    const name = req.body.name ? req.body.name : user.name;
    const password = req.body.password ? bcrypt.hashSync(""+req.body.password.trim(), 10) : user.password;

    await db.query("update users set name = ?, password = ?, updated_at=now() where id = ?", [name, password, id]);
    const updatedUsers = await db.query("select * from users where id=?", [id]);

    return res.json({
        success: true, 
        message: "profile has been updated successfully",
        data: {...updatedUsers[0]}
    });
});

const sendEmail = async (host, id) => {
    const resultUser = await db.query("select * from users where id = ? and `status`=0", [id]);
    if (resultUser.length <= 0) {
        return;
    }

    const user = resultUser[0];
    const link = 'http://' + host + '/auth/verify?token=' + user.verif_token;
    return transporter.sendMail({
        from: `"${process.env.APP_NAME}" <${process.env.MAIL_FROM_NAME}>`, // sender address
        to: user.email, // list of receivers
        subject: `Verify your ${process.env.APP_NAME} account`, // Subject line
        html: `<h1>${process.env.APP_NAME}</h1><h3>Hello, please click link below to verify your account.</h3><a href="${link}">${link}</a>`
    });
}
