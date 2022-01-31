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

dotenv.config();

//FOLLOW
router.post('/follow',asynchandler(async(req,res)=>{
  let {fu_id}=req.body;

  try{
    let  userid;
    if (req.header('Authorization') || req.header('Authorization').startsWith('Bearer')) {
        // console.log("ENTERED AUTH MIDDLEWARE WITH TOKEN")
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
            userid = userId;
            // console.log(userid);
          
        }else{
        //    console.log("Sorry we could not found user");
        }
    }

    let currentuser=await users.findById(userid.trim());
    let followeruser=await users.findById(fu_id.trim());

    if(followeruser && currentuser){
        // console.log("currentuser :"+currentuser);
        // console.log("followeruser :"+followeruser);
    }else{
        return res.status(404).send("users could not found");
    }


    let user=await Follower.find({user:userid.trim()});
    let usertofollow=await Follower.find({user:fu_id.trim()})
   
    if (!user && !usertofollow){
      return  res.status(200).send("follower list user not found");
    }
     if(user && usertofollow){
        //  console.log(user);
        //  console.log(usertofollow);
         var userfollower_id=user[0]._id.toString();
         var usertofollow_id=usertofollow[0]._id.toString();
         
         user=await Follower.findById(userfollower_id);//sourceuser
         usertofollow=await Follower.findById(usertofollow_id);//destination user

         if(user && usertofollow){

            let isfollowing= Array.isArray(user.following) ?user.following.length>0 && user.following.filter((follow)=>follow.user.toString()==fu_id.trim()).length>0:false;

            if(isfollowing){
                // console.log("User Already Followed");
                return res.status(401).send("User Already Followed");
                   
            }
            else{
            //    console.log(" user: "+user.following.length)
            //    console.log("usertofollow :"+usertofollow.following.length)
               let addedlist1=  user.following
               addedlist1.push({ user: followeruser._id })
               
                            if(addedlist1){
                            
                                console.log("addedlist1"+addedlist1)
                               let newlist1=await Follower.findByIdAndUpdate(user._id,{following:addedlist1},{new:true})
                               if(newlist1){
                                   console.log(newlist1)
                               }
                           }
   
                       let addedlist2= usertofollow.followers
                       addedlist2.push({user: currentuser._id})
   
                          if(addedlist2){
                           console.log(addedlist2)
                           let newlist2=await Follower.findByIdAndUpdate(usertofollow._id,{followers:addedlist2},{new:true})
                             if(newlist2){
                                 console.log(newlist2)
                             }
                           }
   
                           let notification=await axios.post(`http://localhost:5000/api/notification/newFollowerNotification`,{
                             user:currentuser._id,
                             usertoNotify:followeruser._id,
                           })
            //    console.log("updated");

               if(notification){
                return res.status(200).send("updated");
               }
               
             
            }
         }
      

        
     }
   



  }catch(e){
    //   console.log(e);
      return res.status(500).send(e);
  }
   


}))

//FOLLOWINGS
router.get('/followings',asynchandler(async(req,res)=>{
    try{
    //  console.log("followings")
  let  userid;
    if (req.header('Authorization') || req.header('Authorization').startsWith('Bearer')) {
        // console.log("ENTERED AUTH MIDDLEWARE WITH TOKEN")
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
            userid = userId;
            // console.log(userid);
          
        }else{
        //    console.log("Sorry we could not found user");
        }

        var user=await users.findById(userid);

        if(user){
            var followings=await Follower.find({user: userid.trim()})
            if(followings){
                // console.log(followings[0].following);
                res.status(200).send(followings[0].following);
            }
        }
    }else{
        //  console.log("no headers")
         return res.status(500).send("no headers");

    }
}
    catch(e){
        //  console.log(e);
         return res.status(500).send(e);
    }
}))




//FOLLOWERS
router.get('/followers',asynchandler(async(req,res)=>{
    try{

        let  userid;
          if (req.header('Authorization') || req.header('Authorization').startsWith('Bearer')) {
            //   console.log("ENTERED AUTH MIDDLEWARE WITH TOKEN")
              const token = req.header('Authorization').replace('Bearer','').trim();
            //   if(token){
            //       console.log(token);
            //   }
              if (!token) {
                  return res.status(401).send("Not Authorized to access the token");
              }
               const {userId}  =  jwt.verify(token, process.env.jwtsecret);
              if(userId){
                //   console.log(jwt.verify(token, process.env.jwtsecret));
                //   console.log(userId);
                  userid = userId;
                //   console.log(userid);
                
              }else{
                //  console.log("Sorry we could not found user");
              }
      
              var user=await users.findById(userid);
      
              if(user){
                  var followings=await Follower.find({user: userid.trim()})
                  if(followings){
                    //   console.log(followings[0]);
                      res.status(200).send(followings[0].followers);
                  }
              }
          }else{
            //    console.log("no headers")
               return res.status(500).send("no headers");
      
          }
      }
          catch(e){
            //    console.log(e);
               return res.status(500).send(e);
          }
}))

//UNFOLLOW
// let updateduser=await users.findByIdAndUpdate(userid,{password:updatedpasssword},{new:true});
router.post('/unfollow',asynchandler(async(req,res)=>{

    try{
        let  userid;
        let unfollowuser_id=req.body.unfollowuser_id;
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
            
            let currentuser=await users.findById(userid);
            let unfollowuser=await users.findById(unfollowuser_id);

            if(currentuser &&  unfollowuser ){
            //    console.log(currentuser);
            //    console.log(unfollowuser);
            }else{
                return res.status(404).send("users not found");
            }

            let unfollowinguser=await Follower.find({user:currentuser._id});
            let usertounfollow=await Follower.find({user:unfollowuser._id});


            
            if(unfollowinguser &&usertounfollow){
               let user=await Follower.findById(unfollowinguser[0]._id);
               let unfollowuser=await Follower.findById(usertounfollow[0]._id);

               if(user && unfollowuser){
                   let isfollowing=Array.isArray(user.following) ?user.following.length>0 ? user.following.filter((follow)=>follow.user.toString()==unfollowuser_id.trim()).length>0:false:false;

                   if(isfollowing){
                       let filteredlist1=user.following.filter((follow)=>follow.user.toString().trim()!=unfollowuser_id.trim())
                         if(filteredlist1){
                            //  console.log(filteredlist1)
                            let newlist1=await Follower.findByIdAndUpdate(unfollowinguser[0]._id,{following:filteredlist1},{new:true})
                            if(newlist1){
                                // console.log(newlist1)
                            }
                        }
                    let filteredlist2=await  unfollowuser.followers.filter((follow)=>follow.user.toString().trim()!= userid.trim());

                       if(filteredlist2){
                        // console.log(filteredlist2)
                        let newlist2=await Follower.findByIdAndUpdate(usertounfollow[0]._id,{followers:filteredlist2},{new:true})
                          if(newlist2){
                            //   console.log(newlist2)
                          }
                        }



                      
                    }else{
                        // console.log("the user is not in the following list")
                        return res.status(500).send("the user is not in the following list")
                    }
               }else{
                //    console.log("user not found");
                   return res.status(404).send("users not found");
               }



               let notification=await axios.post(`http://localhost:5000/api/notification/removeFollowerNotification`,{
                             user:currentuser._id,
                             usertoNotify:unfollowuser._id,
                           })
               return res.status(200).send("unfollowed succesfully")
            }
        }
    }
    catch(e){
        // console.log(e)
        return res.status(500).send("Internal server error");
    }
}))
export default router;