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
import makepassword from './signuproute.js'

dotenv.config();


router.post('/update',asynchandler(async(req,res)=>{
    try {
        console.log(req.header)
     const {
            bio,
            facebook,
            twitter,
            instagram
           }=req.body.user
           
        let profilepicurl = req.body.profilepicurl
        let userid=req.body.userid
        console.log("profile updatedation");
   
        
           console.log(bio,
            facebook,
            twitter,
            instagram,
            profilepicurl)

          
       
        if (userid) {
            let profilefields = await Profile.findOne({user:userid });
         
        console.log("profilefields")
        console.log(profilefields)
           
            if(bio){
                profilefields['bio']=bio;
                // profile[0].bio=bio;
            }
            
           
           if(facebook){
               profilefields.social.facebook=facebook;
              
            //    profile[0].social.facebook=facebook;
           }
           if(twitter){
               profilefields.social.twitter=twitter;
            //    profile[0].social.twitter=twitter;
           }
           if(instagram){
               profilefields.social.instagram=instagram;
            //    profile[0].social.instagram=instagram;
           }
           await profilefields.save();
            
           console.log("updated profile")
           console.log(profilefields)
    
           if(profilepicurl){
            //    console.log(profile);
               let user=await users.findById(userid);
               user['profilepicurl']=profilepicurl;
               await user.save();
               console.log("profile updation successfull")
               return res.status(200).send("updated");
           }else if(profile){
            
            //    console.log(profile);
            //    console.log("profile updation successfull")
               return res.status(200).send("updated");
           }
           
        } else {
            console.log("updation failed")
            return res.status(200).send("updation failed")
       }
       
    }catch(e){
        // console.log(e);
    }
}))


router.get('/:username',asynchandler(async(req,res)=>{

    try{
        let username=req.params.username;

        let user=await users.find({username:username});
    
        if(!user){
            return res.status(400).send("user not found");
        }
        
        let profile=await Profile.find({user:user[0]._id}).populate('user') 
    
        let profilefollow=await Follower.find({user:user[0]._id})
        
        let profilefollowstats=await Follower.findById(profilefollow[0]._id).populate('following.user followers.user');
    
        if(user && profile && profilefollowstats){
        //    console.log(profilefollowstats);
            return res.status(200).send({
                user:user[0],
                profile:profile[0],
                followingslenght:profilefollowstats.following.length>0?profilefollowstats.following.length:0,
                followerslength:profilefollowstats.followers.length>0?profilefollowstats.followers.length:0,
                userfollowings: profilefollowstats.following,
                userfollowers:profilefollowstats.followers

            });
        }
    }catch(e){
        // console.log(e);
        return res.status(200).send("best path");
    }


   

}))

router.post('/update/password', asynchandler(async (req, res) => {

      const {currentpassword,username,newpassword}=req.body;
let  userid=req.body.userid
    // console.log(currentpassword,newpassword)

    try{
        
        
            let user=await users.findById(userid);
            
           
            
           
             if(user){

                //  console.log(user);
                //  if(username && username.length>0){
                //      user.username=username;
                //  }
                let isPassword=await bcrypt.compare(currentpassword,user.password);
    
                if(isPassword){
                //    console.log("ispassword")
                   
                   const salt=await bcrypt.genSalt(10)
                    const updatedpasssword= bcrypt.hashSync(newpassword,salt)
                   let updateduser=await users.findByIdAndUpdate(userid,{password:updatedpasssword},{new:true});
                   if(updateduser){
                    //    console.log("updated user:",updateduser)
                    //    console.log("password updated")
                       return res.status(200).send("password updated")
                   }
                  
                }else{
                //   console.log("The password does'nt match")
                    return res.status(200).send("The password does'nt match");
                }
             }else{
                 return res.status(400).send("user could not found")
             }
              
            
    
    
    }catch(e){
        console.log(e)
    }
 }))



router.post('/settings/messagepopup',asynchandler(async(req,res)=>{

    try{
        let  userid=req.body.userid;
      

        let user=await users.findById(userid);

        if(user.newMessagepopup){
            user.newMessagepopup=false;
            await user.save();
        }else{
            user.newMessagepopup=true;
            await user.save();
        }

        return res.status(200).send("successfull");


    }catch(e){
        // console.log(e);
       return res.status(500).send("not successfull")
    }
}))

router.get('/finduser/:username', (req, res) => {
    
     let username=req.params.username;

        let user=await users.find({username:username});
    
        if(!user){
            return res.status(400).send("user not found");
        }
        
    return res.status(200).send(user);
})

export default router