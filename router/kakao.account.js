const express = require('express');
const router = express.Router();

const jwt = require('jsonwebtoken');

const verifyKakaoToken = require('../module/verify-kakaoToken');
const db = require('../data/database');
const query = require('./account.sql');

require("dotenv").config(); //환경변수

router.get('/callback', async (req,res) => {
    const result = {
        "success": false,
        "message": null,
        "data":{

        }
    }
    const kakaoToken = req.query.accessToken;
    const email = req.query.email;
    const errorMessage = await verifyKakaoToken(kakaoToken);
    if(errorMessage){ //카카오 토큰 검사 불통과
        result.message = errorMessage;
        res.json(result);
        return;
    }
    
    let user;
    try{
        user = await db.query(query.findUserByEmail, email);
    } catch(error) {
        result.message = "Can't connect to database";
        res.json(result);
        return;
    }
    result.data.isSignin = false;
    result.success = true;

    if(user[0].length!==0){ //tape에 가입한 유저
        const token = {
            isAuth: true,
            uid: user[0][0].id,
        }
        res.cookie("token", jwt.sign(token, process.env.JWT_SECRET_KEY));
        result.data.isSignin = true;
        res.json(result);
    } else { //tape에 가입해야하는 유저
        const userData = {
            email : email,
        };
        res.cookie("userData", jwt.sign(userData, process.env.JWT_SECRET_KEY));
        res.json(result);
    }

    return;
});

module.exports = router;