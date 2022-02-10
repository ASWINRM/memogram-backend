import express from 'express'
const router = express.Router()
import asynchandler from 'express-async-handler'
import users from '../database/model/usermodel.js'
import Follower from '../database/model/Follower.js'
import Profile from '../database/model/profile.js'
import post from '../database/model/PostModel.js'
import Notification from '../database/model/Notification.js'
import jwt from "jsonwebtoken";
import mongoose from 'mongoose'
import dotenv from 'dotenv';
dotenv.config();
router.post('/SetNotificationtoUnRead',asynchandler(async(req,res)=>{

    const {usertoNotify}=req.body

    try{
      
      let user=await users.findById(usertoNotify);

      if(user){
          if(!user.unreadNotification){
            let updateduser=await users.findByIdAndUpdate(usertoNotify,{unreadNotification:true},{new:true});
              return res.status(200).send("updated")
        }
      }

    }catch(e){
        //    console.log(e)
           return res.status(500).send("Internal Server Error");
    }
}))

router.post('/SetNotificationsRead',asynchandler(async(req,res)=>{


    let  usertoNotify;
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
            usertoNotify = userId;
            // console.log(usertoNotify);
          
        }else{
        //    console.log("Sorry we could not found user");
        }
    }
    try{
      
        let user=await users.findById(usertoNotify);
  
        if(user){
            if(user.unreadNotification){
              let updateduser=await users.findByIdAndUpdate(usertoNotify,{unreadNotification:false},{new:true});
                return res.status(200).send("updated")
          }
        }
  
      }catch(e){
            //  console.log(e)
             return res.status(500).send("Internal Server Error");
      }
}))

router.get('/getuserNotifications',asynchandler(async(req,res)=>{
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

    let notifications=await Notification.findOne({user:userid}).populate("notifications.user  notifications.post").sort({Date:-1})


    if(notifications){
        // console.log(notifications);

        if(notifications.notifications.length<=0){
            return res.status(200).send("no notifications")
        }
        
        return res.status(200).send(notifications.notifications);
    }

}))


router.get('/notificationlength',asynchandler(async(req,res)=>{
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

        let notifications=await Notification.findOne({user:userid})

        if(notifications){
           
                let unreadNotification=notifications.notifications.filter((noti)=>noti.read===false)
                 return res.status(200).send(unreadNotification.length.toString());
         
        }
    }catch(e){
        // console.log(e)

    }
}))


router.post('/makeNotificationsRead',asynchandler(async(req,res)=>{
    try{
        let {notificationLength}=req.body
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
                console.log(jwt.verify(token, process.env.jwtsecret));
                console.log(userId);
                userid = userId;
                console.log(userid);
              
            }else{
            //    console.log("Sorry we could not found user");
            }
        }

        let notifications=await Notification.findOne({user:userid})
       

        if(notifications){
                    while(notificationLength>0){
                        let newnotificationlist=await Notification.updateMany({'notifications.read':false,user:userid},{$set: {'notifications.$.read': true}},{multi: true});
                        // if(newnotificationlist){
                        //     console.log(newnotificationlist)
                        // }
                        notificationLength--;
                    }
                    
                     return res.status(200).send("updated");
    
        }
    }catch(e){
        // console.log(e)
        return res.status(500).send("Internal Server Error")

    }
}))

router.post('/newlikenotification',asynchandler(async(req,res)=>{
    const {usertoNotify,user,postId}=req.body

    try{
       
     let userofNotify=await users.findById(usertoNotify) 
     
let notify=await Notification.findOne({user:userofNotify._id})
let userId=await users.findById(user);
let posts=await post.findById(postId);


        let newNotification={
            type:'Newlike',
            user:userId._id,
            post:posts._id,
            Date:Date.now()
        }

        if(notify){
            let newnotificationlist=await Notification.updateOne({user:usertoNotify},{$push:{"notifications":newNotification}},{new:true});
                  if(newnotificationlist){
                    let updateduser=await users.findByIdAndUpdate(usertoNotify,{unreadNotification:true},{new:true});
                    // console.log(newnotificationlist)
                   return res.status(200).send({newNotification,notifyuser:userId});
                 }

        }else{
                 let newnotificationlist=await new Notification({
                   user:usertoNotify,
                  notifications:newNotification
                  }).save()

                  if(newnotificationlist){
                    let updateduser=await users.findByIdAndUpdate(usertoNotify,{unreadNotification:true},{new:true});
                    //   console.log(newnotificationlist)
                      return res.status(200).send({newNotification,notifyuser:userId})
                  }
        }
    
        
    }catch(e){
    //    console.log(e);
       return res.status(500).send("Internal server Error");
    }
}))

router.post('/removeLikeNotification',asynchandler(async(req,res)=>{
    const {user,usertoNotify,postId}=req.body
    try{
        console.log(user,usertoNotify,postId)
        let userId=await users.findById(user);
        let posts=await post.findById(postId);
        let userofNotify=await users.findById(usertoNotify) 
        let usernotifications=await Notification.findOne({user:userofNotify._id});
        if(usernotifications){
           const NotificationToRemove=await usernotifications.notifications.find((notification)=>notification.type==="Newlike"&&
                                                                           notification.user.toString()===user &&
                                                                           notification.post.toString()===postId);

        if(NotificationToRemove){
            console.log(NotificationToRemove)
            // console.log(usernotifications.notifications)
            const index=usernotifications.notifications.map(a => a._id.toString()).indexOf(NotificationToRemove._id.toString());
      
            // console.log(index)
            const updatedNotification=null;
            // let newlist=null;
            if(index>=0){
                await usernotifications.notifications.splice(index,1);
                await  usernotifications.save()
                console.log("updated")
                return res.status(200).send("updated")
                //    console.log(updatedNotification)
                // newlist=await Notification.findByIdAndUpdate(usernotifications._id,{notifications:updatedNotification},{new:true})

            }
            }
        }

    }catch(e){
        console.log(e);
        return res.status(200).send("Internal Server Error")
        
    }
}))

router.post('/newCommentNotification',asynchandler(async(req,res)=>{

    try{
        let {user,usertoNotify,text,postId,commentId}=req.body
        // console.log("userid"+user)
        let posts=await post.findById(postId);
        let userId=await users.findById(user);
        let userofNotify=await users.findById(usertoNotify);

     
        // let commentId=await postId.comments.map(comment=>comment.text===text);
    
        // if(commentId){
        //     console.log(commentId);
        // }
        
        let newnotification={
            type:'NewComment',
            user:  userId._id,
            post: posts._id,
            commentId:commentId,
            text:text,
            Date:Date.now()
        }
    
        let Notifications=await Notification.findOne({user:userofNotify._id})
    
        if(Notifications){
            let newlist=await Notification.updateOne({user:userofNotify._id},{$push:{"notifications":newnotification}},{new:true});
            if(newlist){
              let updateduser=await users.findByIdAndUpdate(usertoNotify,{unreadNotification:true},{new:true});
            //   console.log(newlist)
             return res.status(200).send({newnotification,notifyuser:userId})
           }
        }else{
            let newlist=await new Notification({
                user:userofNotify._id,
                notifications:newnotification
            }).save()
    
            if(newlist){
                let updateduser=await users.findByIdAndUpdate(usertoNotify,{unreadNotification:true},{new:true});
                //   console.log(newlist)
                  return res.status(200).send({newnotification,notifyuser:userId})
              }
        }
       
    }catch(e){
    //  console.log(e)
     return res.status(500).send("Internal Server Error")
    }
   
}))


router.post('/removeCommentNotification',asynchandler(async(req,res)=>{
    let {user,usertoNotify,text,postid,commentId}=req.body
    let postId=await post.findById(postid);
    let userId=await users.findById(user);
    let userofNotify=await users.findById(usertoNotify);

    let usernotifications=await Notification.findOne({user:userofNotify._id});
  

    try{
        if(usernotifications){
            // console.log(usernotifications)
            const NotificationToRemove=await usernotifications.notifications.find((notification)=>notification.type==="NewComment"&&
                                                                            notification.user.toString()===user &&
                                                                            notification.post.toString()===postid&&
                                                                            notification.commentId.toString()===commentId) 
 
         if(NotificationToRemove){
            //  console.log(NotificationToRemove)
            //  console.log(usernotifications.notifications)
             const index=usernotifications.notifications.findIndex(a=>a._id===NotificationToRemove._id)
            //  console.log(index)
             const updatedNotification=null
             let newlist=null;
             if(index>0){
                updatedNotification =usernotifications.notifications.splice(index,1);
                 newlist=await Notification.findByIdAndUpdate(usernotifications._id,{notifications:updatedNotification},{new:true})
                // console.log(updatedNotification)
             }else{
                
                   
                  newlist=await Notification.findByIdAndUpdate(usernotifications._id,{notifications:[]},{new:true})

            
             }
          
             if(newlist){

                // console.log(newlist);
                return res.status(200).send("updated")
             }
             }
         }

    }catch(e){
        // console.log(e);
        return res.status(200).send("Internal Server Error")
        
    }
    
}))


router.post('/newFollowerNotification',asynchandler(async(req,res)=>{
    const {usertoNotify,user}=req.body

    try{
        let userofNotify=await users.findById(usertoNotify) 
        let notify=await Notification.findOne({user:userofNotify._id})
        let userId=await users.findById(user);
        let newNotification={
            type:'NewFollower',
            user:userId._id,
            Date:Date.now()
        }
        if(notify){
           

            let newnotificationlist=await Notification.updateOne({user:usertoNotify},{$push:{"notifications":newNotification}},{new:true});
                  if(newnotificationlist){
                    let updateduser=await users.findByIdAndUpdate(usertoNotify,{unreadNotification:true},{new:true});
                    // console.log(newnotificationlist)
                   return res.status(200).send("updated");
                 }
        }else{
            let newnotificationlist=await new Notification({
                user:userofNotify._id,
                notifications:newNotification
            }).save()

            // console.log(newNotification);
            return res.status(200).send("updated")
        }
    }catch(e){
        // console.log(e)
        return res.status(200).send("Internal Server error")
    }
   



}))


router.post('/removeFollowerNotification',asynchandler(async(req,res)=>{
    try{
        let {usertoNotify,user}=req.body;
        let userofNotify=await users.findById(usertoNotify) 
        let userId=await users.findById(user);
        let notify=await Notification.findOne({user:userofNotify._id})
      
       
        if(notify){
           let NotificationToRemove=await notify.notifications.map((notification)=>notification.user.toString()===user&& notification.type==='NewFollower');
            
           let index=notify.notifications.findIndex(a=>a._id===NotificationToRemove._id);
          let newListNotification=null;
           if(index>0){
               let updatednotification=notify.notifications.splice(index,1);
             newListNotification=await Notification.updateOne({user:userofNotify._id},{notifications:updatednotification},{new:true})
            //    console.log(newListNotification);
            }else{
                let newListNotification=await  Notification.updateOne({user:userofNotify._id},{notifications:[]},{new:true})
                // console.log(newListNotification);
            }

            return res.status(200).send("updated");
        }
    }catch(e){
        // console.log(e)
        return res.status(200).send("Internal Server error")
    }
}))

export default router;