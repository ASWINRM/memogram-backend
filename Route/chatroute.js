import express from 'express'
const router = express.Router()
import asynchandler from 'express-async-handler'
import users from '../database/model/usermodel.js'
import Follower from '../database/model/Follower.js'
import Profile from '../database/model/profile.js'
import post from '../database/model/PostModel.js'
import Chat from '../database/model/Chatmodel.js'
import MessageNotification from '../database/model/MessageNotificationModel.js'
import validator from 'validator';
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from 'dotenv';
const regex=/^(?!.*\.\.)(?!.*\.$)[^\W][\w.]{0,29}$/;
import {authe} from '../Middleware/authe.js'
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import { AsyncLocalStorage } from 'async_hooks'
dotenv.config();

//GET ALL CHATS
router.get('/',asynchandler(async(req,res)=>{
    try{
        let  userid;
        if (req.header('Authorization') || req.header('Authorization').startsWith('Bearer')) {
            console.log("ENTERED AUTH MIDDLEWARE WITH TOKEN")
            const token = req.header('Authorization').replace('Bearer','').trim();
            // if(token){
            //     console.log(token);
            // }
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

        let userchat=await Chat.findOne({user:userid}).populate('user chats.messagesWith');

        if(userchat.chats.length>0){

            let ChatsToBeSent=await userchat.chats.map((chat)=>{
                return (
                    {
                        messagesWith: chat.messagesWith._id,
                        name: chat.messagesWith.name,
                        profilepicurl: chat.messagesWith.profilepicurl,
                        lastMessage: chat.messages[chat.messages.length - 1].msg,
                        date: chat.messages[chat.messages.length - 1].date
                      }
                )
            })

            if(ChatsToBeSent){
                return res.status(200).send({ChatsToBeSent,about:"chats found"})
            }
        }else{
            var user=await users.findById(userid);
      
            if(user){
                var followings=await Follower.find({user: userid.trim()}).populate('following.user')
                if(followings && following[0].following.length>0){
                    console.log(followings[0].following);

                    let  ChatsToBeSent=await followings[0].following.map((fol)=>{
                        return (
                            {
                                messagesWith: fol.user._id,
                                name: fol.user.name,
                                profilepicurl: fol.user.profilepicurl,
                                lastMessage:"",
                                date: ""
                              }
                        )
                    })
                    if(ChatsToBeSent){
                        return res.status(200).send({ChatsToBeSent,about:"chats not found"});
                    }
                  
                }else{
                    let ChatsToBeSent=[{
                        messagesWith: user._id,
                        name: user.name,
                        profilepicurl: user.profilepicurl,
                        lastMessage:"",
                        date: ""
                    }]
                    if(ChatsToBeSent){
                        return res.status(200).send({ChatsToBeSent,about:"chats not found"});
                    }
                }
            }
            
        }
    }catch(e){
        console.log(e)
        return res.status(500).send("Internal Server Error")
    }
   

}))

router.get("/summa",asynchandler(async(req,res)=>{

    let {userId,messagesWith}=req.body

    if(userId,messagesWith){
        try{
            let response=await Chat.findOne({user:userId}).populate("chats.messagesWith chats.messages")
      
            if(response){
             
                let messages=await response.chats.find((chat)=>chat.messagesWith._id.toString()===messagesWith);
                
                if(!messages){
                   return ("no messages found")
                }
                // if(messages){
                //     console.log(messages)
                // }
                return res.status(200).send ({chat:messages})
            }else{
                return {chat:""}
            }
          }catch(e){
            //    console.log(e)
               return {error:e}
          }
    }
}))


router.post('/newmsg',asynchandler(async(req,res)=>{
    try{

        let {userId,msgToId,msg}=req.body;
     
        let user=await await Chat.findOne({user:userId}).populate("chats.messagesWith chats.messages")

        let receiver=await Chat.findOne({user:msgToId}).populate("chats.messagesWith chats.messages")

        

        let newmsg={
            msg:msg,
            sender:user.user,
            receiver:receiver.user,
            date:Date.now()
        }
       
        let previouschat=user.chats.find((chat)=>chat.messagesWith._id.toString()===msgToId)

        if(previouschat){
            // console.log(previouschat)
            previouschat.messages.push(newmsg)
            // console.log(previouschat)
        }

       await user.save()

        let Receivepreviouschat=receiver.chats.find((chat)=>chat.messagesWith._id.toString()===userId)

        if(Receivepreviouschat){
            Receivepreviouschat.messages.push(newmsg)
        }
       await receiver.save()
      return {newChat:newmsg}
    }catch(e){
        // console.log(e);
        return {error:e}
    }
}))



router.get('/finduser/:userid',asynchandler(async(req,res)=>{
    let userid=req.params.userid
   
    // console.log(userid)
    try{
        if(userid==="nochats"){
            return res.status(200).send("nochats");
        }
        // console.log("In finding users")
        let user=await users.findById(userid)
        // console.log(userid)

        if(user){
            // console.log({name:user.username,profilepicurl:user.profilepicurl})
            return res.status(200).send({name:user.username,profilepicurl:user.profilepicurl,_id:user._id})
        }else{
            console.log("no user found")
        }
    }catch(e){
    //   console.log(e)
      return res.status(400).send("Internal server error")
    }
}))

router.get('/MessageNotification',asynchandler(async(req,res)=>{
    try{
        let  userid;
        if (req.header('Authorization') || req.header('Authorization').startsWith('Bearer')) {
            console.log("ENTERED AUTH MIDDLEWARE WITH TOKEN")
            const token = req.header('Authorization').replace('Bearer','').trim();
            // if(token){
            //     console.log(token);
            // }
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

        let usermsg=await MessageNotification.findOne({user:userid})
        // console.log(usermsg)
        return res.status(200).send({TotalLength:usermsg.TotalLength})
    }catch(e){
        // console.log(e)
        return res.status(500).send(e)
    }
 
       

}))

router.post('/setNotificationRead',asynchandler(async(req,res)=>{
    
    if (req.header('Authorization') || req.header('Authorization').startsWith('Bearer')) {
        console.log("ENTERED AUTH MIDDLEWARE WITH TOKEN")
        const token = req.header('Authorization').replace('Bearer','').trim();
        if(token){
            console.log(token);
        }
        if (!token) {
            return res.status(401).send("Not Authorized to access the token");
        }
         const {userId}  =  jwt.verify(token, process.env.jwtsecret);
        if(userId){
            // console.log(jwt.verify(token, process.env.jwtsecret));
            // console.log(userId);
            usertoNotify = userId;
            // console.log(usertoNotify);
          
        }else{
        //    console.log("Sorry we could not found user");
        }
    }
    try{
      
        let user=await users.findById(usertoNotify);
  
        if(user){
            if(user.unreadMessage){
              let updateduser=await users.findByIdAndUpdate(usertoNotify,{unreadMessage:false},{new:true});
                return res.status(200).send("updated")
          }else{
              return res.status(200).send("updated")
          }
        }
  
      }catch(e){
            //  console.log(e)
             return res.status(500).send("Internal Server Error");
      }
}))


router.post('/NotifyLengthZero',asynchandler(async(req,res)=>{
    try{
        let  userid;
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
                // console.log(jwt.verify(token, process.env.jwtsecret));
                // console.log(userId);
                userid = userId;
                // console.log(userid);
              
            }else{
            //    console.log("Sorry we could not found user");
            }
        }

        let usermsg=await MessageNotification.findOne({user:userid})
         usermsg.TotalLength=0
         usermsg.save()

         return res.status(200).send("updated")
    }catch(e){
        // console.log(e)
        return res.status(500).send(e)
    }
}))


router.post("/deleteChat",asynchandler(async(req,res)=>{
    let {messagesWith}=req.body
    // console.log(messagesWith)
    try{
        let  userid;
        if (req.header('Authorization') || req.header('Authorization').startsWith('Bearer')) {
            console.log("ENTERED AUTH MIDDLEWARE WITH TOKEN")
            const token = req.header('Authorization').replace('Bearer','').trim();
            // if(token){
            //     console.log(token);
            // }
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

        let userchat=await Chat.findOne({user:userid}).populate('user chats.messagesWith');
        if(userchat){
            // console.log(userchat.chats)
            let parchat= await userchat.chats.find((chat)=>chat.messagesWith._id.toString()===messagesWith)
            // console.log(parchat)
            let index=userchat.chats.indexOf(parchat)
            userchat.chats.splice(index,1)
            userchat.save()
        }
         

        return res.status(200).send("updated");
    }catch(e){
           console.log(e)
           return res.status(500).send("InternalServer error")
    }
}))
export default router;