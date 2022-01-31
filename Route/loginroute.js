import express from 'express'
const router = express.Router()
import asynchandler from 'express-async-handler'
import users from '../database/model/usermodel.js'
import Follower from '../database/model/Follower.js'
import validator from 'validator';
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from 'dotenv';
dotenv.config();
import {authe} from '../Middleware/authe.js'
import Chat from '../database/model/Chatmodel.js'
import MessageNotification from '../database/model/MessageNotificationModel.js'

router.post('/',asynchandler(async(req,res)=>{
    console.log(process.env.jwtsecret)
    const {
        
        email,
        password,
       
       }=req.body.user
    
       
       
       if(!validator.isEmail(email)){
           return res.send(402).status("The email id in not in the correct format");
       }
    
       if(password.length<6){
           return res.status(402).send("The Password must constain atleast 6 characters");
       }
       try{
          
        const user=await users.findOne({email:email.toLowerCase()})
        // if(user){
        //     // console.log(user);
        // }

        
        if(!user){
            return res.status(200).send("The User is not registered");
        }
    
        if(user.password && password){
            // console.log(user.password)
            const salt=await bcrypt.genSalt(10)
            const updatedpasssword= bcrypt.hashSync(password,salt)
            let passwordmatch=await bcrypt.compare(password,user.password);
            // console.log(passwordmatch)
            if(!passwordmatch){
               
                // console.log(updatedpasssword)
                return res.status(200).send("password does'nt match");
            }
        }
    // console.log(process.env.jwtsecret);
    // console.log(user._id)
    const payload={userId: user._id};
    jwt.sign(payload,process.env.jwtsecret,async(err,token)=>{
        if(err){
            throw err;
        }else{
            let chatmodel=await Chat.findOne({user:user._id});
             let  MessageNotificationModel=await  MessageNotification.findOne({user:user._id});

            if(!chatmodel || !MessageNotificationModel ){
                if(!chatmodel){
                    // console.log("no chat")
                    await new Chat({user:user._id,chats:[]}).save();
                }
               
                
                if(!MessageNotificationModel){
                    await new MessageNotification({user:user._id, Notification:[],  TotalLength:0}).save()
                }
               

            }
           
        }
        // await new MessageNotification({user:user._id, Notification:[],  TotalLength:0}).save()
        // console.log("MessageNotificationModel"+MessageNotificationModel)
        // console.log(chatmodel)
        return res.status(200).send({user,token});
    }
    
    )
    
    
       }catch(e){
        //    console.log(e);
          res.status(500).send("Internal Server Error");
       }
    
}
));

// router.get('/profile',authe,asynchandler(async(req,res)=>{
//     const {userId}=req;
//     try{
//         const user=await users.findById(userId);
//         const userfollowStats=await Follower.findOne({user:userId});
//         return res.status(200).send({user,userfollowStats});
//        }catch(e){
//          console.log(e);
//          return res.status(302).send("Server Error");
//        }
    
// }))




export default router;