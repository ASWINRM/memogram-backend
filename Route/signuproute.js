import express from 'express'
const router = express.Router()
import asynchandler from 'express-async-handler'
import users from '../database/model/usermodel.js'
import Follower from '../database/model/Follower.js'
import Profile from '../database/model/profile.js'
import validator from 'validator';
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from 'dotenv';
import Chat from '../database/model/Chatmodel.js'
import MessageNotification from '../database/model/MessageNotificationModel.js'
import Notification from '../database/model/Notification.js'
const regex=/^(?!.*\.\.)(?!.*\.$)[^\W][\w.]{0,29}$/;
dotenv.config();

router.get('/:username',asynchandler(async(req,res)=>{
    const username=req.params.username;
   
    if(username){
        // console.log(username);
        try{
    
            if(username.length<1){
                return res.status(200).send("Invalid")
            }
    
            if(!regex.test(username)){
                return res.status(200).send("Invalid")
            }
            
            const user=await users.findOne({name:username.toLowerCase()})
            if(user){
                
                return res.status(200).send("Not Available");
            }
            
            return res.status(202).send("Available")
        }catch(e){
        //    console.log(e);
           
           return res.status(500).send("Internal Server Error")
        }
    }else{
        return res.status(404).send("no username found");
    }
        
}))

router.post('/',asynchandler(async(req,res)=>{
    try{

        const {
            name,
            email,
            password,
            confirmpassword,
            username,
            bio,
            facebook,
            twitter,
            instagram,
            profilepicurl
           }=req.body.user

        //    if(profilepicurl){
        //        console.log(profilepicurl);
        //    }
       if(!validator.isEmail(email)){
        return res.send(402).status("The email id in not in the correct format");
    }
 
    if(password.length<6){
        return res.status(402).send("The Password must constain atleast 6 characters");
    }
        let existinguser=await users.findOne({email:email.toLowerCase()})
    
        if(existinguser){
            return res.status(402).send("The Email is already registered");
        }
    
        if(password && confirmpassword){
         
            let passwordmatch=bcrypt.compare(password,confirmpassword);
    
            if(!passwordmatch){
                return res.status(401).send("password does'nt match");
            }
        }else{
            return res.status(404).send("please enter both password and confirm password");
        }

       let newuser= await  new users({
            name:username,
            email:email.toLowerCase(),
            password:password,
            username:username,
            profilepicurl:profilepicurl 
        }).save();
         await users.updateOne({username:username},{$set:{password: await makepassword(password)}});

    
     let profilefields={}
    
     profilefields.user=newuser._id;
     profilefields.bio=bio;
    profilefields.social={
        facebook:"",
        twitter:"",
        instagram:""
    }
    if(facebook){
        profilefields.social.facebook=facebook;
    }
    if(twitter){
        profilefields.social.twitter=twitter;
    }
    if(instagram){
        profilefields.social.instagram=instagram;
    }
    
    await new Profile({
        user:newuser._id,
        bio:bio,
        social:profilefields.social   
     }).save();
    
    await new Follower({user:newuser._id,followers:[],following:[]}).save();

    await new Notification({user:newuser._id,notifications:[]}).save()

    await new Chat({user:newuser._id,chats:[]}).save();

    await new MessageNotification({user:newuser._id, Notification:[],  TotalLength:0}).save()
    
    const payload={userId:newuser._id};
    jwt.sign(payload,process.env.jwtsecret,(err,token)=>{
        if(err){
            throw err;
        }else{
            // console.log(token);
            return res.status(200).json(token);
        }
    })
    
    
    }catch(e){

        // console.error(e)
     
          return res.status(500).send(e);
       }
}))


export const makepassword=async(enteredpassword)=>{
    const salt=await bcrypt.genSalt(10)
    return  bcrypt.hashSync(enteredpassword,salt)
}



export default router;