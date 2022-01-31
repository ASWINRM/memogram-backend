import jwt from 'jsonwebtoken'
import asynchandler from 'express-async-handler'

export  const authe = asynchandler(async (req, res, next)=>{
    if (req.header('Authorization') && req.header('Authorization').startsWith('Bearer')) {
        console.log("ENTERED AUTH MIDDLEWARE WITH TOKEN")
        const token = req.header('Authorization').replace('Bearer ', '')
        if(token){
            console.log(token);
        }
        if (!token) {
            return res.status(401).send("Not Authorized to access the token");
        }
        const  {userId}  = jwt.verify(token, process.env.jwtsecret);
        if(userId){
            console.log(userId);
            req.userId = userId;
        }else{
           console.log("Sorry we could not found user");
        }
        
        
        next();
    }
})