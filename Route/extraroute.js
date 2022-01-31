import express from 'express'
const router = express.Router()
import asynchandler from 'express-async-handler'
import users from '../database/model/usermodel.js'
import Follower from '../database/model/Follower.js'
import Profile from '../database/model/profile.js'
import post from '../database/model/PostModel.js'
import validator from 'validator';
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from 'dotenv';
const regex=/^(?!.*\.\.)(?!.*\.$)[^\W][\w.]{0,29}$/;
import {authe} from '../Middleware/authe.js'
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';
dotenv.config();




router.get('/:pagenumber',authe,asynchandler(async(req,res)=>{
    try{
        const pagenumber=req.params.pagenumber;
        const size=8;
        let posts;
        const skips=size*(pagenumber-1);
        // console.log(pagenumber);
        if(pagenumber<2){  
            // console.log("Pagenumber "+pagenumber);
             posts=await post.find({}).sort({createdAt:-1}).populate("user").populate("comments.user");
        }else if(pagenumber>1){
             posts=await post.find({}).skips(skips).limit(8).sort({createdAt:-1}).populate("user").populate("comments.user");
        }
       
        
        if(posts){
            // console.log(posts);
            return res.status(200).send(posts);
        }else if(!posts){
          
            return res.status(200).send("NoPosts");
        }

    }catch(e){
        // console.log(e);
     return res.status(500).send("Internal Server Error");
    }
}))

router.post('/settings/updatepassword',asynchandler(async(req,res)=>{
    try{

        let currentpassword=req.body.currentpassword;
        let newpassword=req.body.newpassword;

        let  userid;
        if (req.header('Authorization') || req.header('Authorization').startsWith('Bearer')) {
            // console.log("ENTERED AUTH MIDDLEWARE WITH TOKEN")
            const token = req.header('Authorization').replace('Bearer','').trim();
            if(token){
                // console.log(token);
            }
            if (!token) {
                return res.status(401).send("Not Authorized to access the token");
            }
             const {userId}  =  jwt.verify(token, process.env.jwtsecret);
            if(userId){
                // console.log(jwt.verify(token, process.env.jwtsecret));
                // console.log(userId);
                userid = userId;
                // console.log(userid);
              
            }else{
            //    console.log("Sorry we could not found user");
            }
        }

        let user=await users.findById(userid).select("+password");

        const ispassword=await bcrypt.compare(currentpassword,user.password)

        if(ispassword){
            user.password=await bcrypt.hash(newpassword,10);
            await user.save();
            return res.status(200).send("password updated");
        }else{
            // console.log("password incorrect")
            return res.status(401).send("Entered password is incorrect");
        }


    }catch(e){
        // console.log(e);
        return res.status(500).send("Internal server error");
    }
}))



router.post('/settings/newmessagepopup',asynchandler(async(req,res)=>{

    try{

        let  userid;
        if (req.header('Authorization') || req.header('Authorization').startsWith('Bearer')) {
            console.log("ENTERED AUTH MIDDLEWARE WITH TOKEN")
            const token = req.header('Authorization').replace('Bearer','').trim();
            if(token){
                // console.log(token);
            }
            if (!token) {
                return res.status(401).send("Not Authorized to access the token");
            }
             const {userId}  =  jwt.verify(token, process.env.jwtsecret);
            if(userId){
                // console.log(jwt.verify(token, process.env.jwtsecret));
                // console.log(userId);
                userid = userId;
                // console.log(userid);
              
            }else{
            //    console.log("Sorry we could not found user");
            }
        }

        const user=await users.findById(userid);

        if(user.newMessagepopup){
            user.newMessagepopup=false;
            await user.save();
        }else{
            user.newMessagepopup=true;
            await user.save();
        }
       
        return res.status(200).send("successfully updated");
    }catch(e){
     console.log(e);
     return res.status(500).send("Internal server error");
    }
}))
export default router;