import express from 'express'
const router = express.Router()
import asynchandler from 'express-async-handler'
import users from '../database/model/usermodel.js'
import Follower from '../database/model/Follower.js'
import validator from 'validator';
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from 'dotenv';
import sendemail from '../utils/sendemail.js'
import crypto from 'crypto'

dotenv.config();
router.post('/forgotpassword',async(req,res)=>{
    const {email}=req.body
    try{
      
     
        const user=await users.findOne({email:email})

        if (!user) {
            return res.status(404).send("User not found");
          }
    // if(!user){
    //     res.status(404).send("There is no user found with this email Id")
    // }
    if(user ){
        const token = crypto.randomBytes(32).toString("hex");
        let updatedresetToken=await users.findByIdAndUpdate(user._id,{resetToken:token},{new:true});
        let updatedExpiresToken=await users.findByIdAndUpdate(user._id,{expireToken:Date.now() + 3600000},{new:true});
        


   const href=`https://aswinmemogram.netlify.app/resetpassword/${token}`
     const message=`<p>Hey ${user.name
        .split(" ")[0]
        .toString()}, There was a request for password reset. <a href=${href}>Click this link to reset the password </a>   </p>
      <p>This token is valid for only 1 hour.</p>
                     `
     
      
      try{
        sendemail({
            to:email,
            subject:"requested to reset a password",
            message:message
        })
        res.status(200).send("The email has sent successfully")
      }catch(e){
          // consoel.log(e);
         res.status(401).send("email could'nt send")
      }
        
    }else{
       res.status(401).send("No user found with this Email id") 
    }
    
    }catch(e){
       res.send(e)
    }
   

})


router.post("/token", async (req, res) => {
    try {
      const { token, password } = req.body;
  
      if (!token) {
        return res.status(401).send("Unauthorized");
      }
      console.log(token);
      if (password.length < 6) {
        console.log(password);
        return res.status(401).send("Password must be atleast 6 characters");

       }

  
      const user = await users.findOne({ resetToken: token });
  
      if (!user) {
        console.log(user);
        return res.status(404).send("User not found");
      }
  
      if (Date.now() > user.expireToken) {
        console.log(token+" user expire")
        return res.status(401).send("Token expired.Generate new one");
      }
      console.log(user);
      const salt=await bcrypt.genSalt(10)
      const updatedpasssword= bcrypt.hashSync(password,salt)
       let updateduser=await users.findByIdAndUpdate(user._id,{password:updatedpasssword},{new:true});
        let updatedresetToken=await users.findByIdAndUpdate(user._id,{resetToken:""},{new:true});
        let updatedExpiresToken=await users.findByIdAndUpdate(user._id,{expireToken:undefined},{new:true});
  
      return res.status(200).send("Password updated");
    } catch (error) {
      console.error(error);
      return res.status(500).send("Server Error");
    }
  });

  export default router;
  