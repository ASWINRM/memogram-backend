import express from 'express'
const router = express.Router()
import asynchandler from 'express-async-handler'
import users from '../database/model/usermodel.js'
import Follower from '../database/model/Follower.js'
import validator from 'validator';
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import axios from 'axios'
import twillio from 'twilio'

const {ACCT_SID, AUTH,PHONE}=process.env
const client=new twillio(ACCT_SID, AUTH);

router.post('/otpgenerate',asynchandler(async(req,res)=>{

    const phone = req.body.phone;
    // console.log(phone)
	const otp = Math.floor(100000 + Math.random() * 900000);

    client.messages
		.create({
			body: `Your One Time Login Password For CFM is ${otp}`,
			from: PHONE,
			to: phone
		})
		.then((messages) => console.log(messages))
		.catch((err) => console.error(err));

        return res.status(200).send("otp send successfully")

}))

export default router