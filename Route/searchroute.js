import express from 'express'
const router = express.Router()
import asynchandler from 'express-async-handler'
import users from '../database/model/usermodel.js'
import dotenv from 'dotenv';
import {authe} from '../Middleware/authe.js'
import jwt from "jsonwebtoken";
dotenv.config();

router.get('/:searchtext',asynchandler(async(req,res)=>{
    const {searchtext}=req.params;
    let userid;
    if(searchtext.length===0) return;
    try{
        if (req.header('Authorization') || req.header('Authorization').startsWith('Bearer')) {
            // console.log("ENTERED AUTH MIDDLEWARE WITH TOKEN")
            const token = req.header('Authorization').replace('Bearer','').trim();
            // if(token){
            //     console.log(token);
            // }
            if (!token) {
                return res.status(401).send("Not Authorized to access the token");
            }
             const {userId}  =  jwt.verify(token, process.env.jwtsecret);
            if(userId){
                console.log(jwt.verify(token, process.env.jwtsecret));
                console.log(userId);
                userid = userId;
                console.log(userid);
              
            }else{
            //    console.log("Sorry we could not found user");
            }
        }
       
        
        let userPattern = new RegExp(`^${searchtext}`);
        let user=await users.find({username:{ $regex: userPattern, $options: "i" }},'_id name profilepicurl');
        
        if(user){
        //    console.log(user);
           
            return res.status(200).send(user);
        }else{
            return res.status(200).send("");
        }
        
    }catch(e){
        // console.log(e);
      
       return res.status(500).send("Server Error");
    }
}))

export default router;