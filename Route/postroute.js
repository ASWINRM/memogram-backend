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
// import upload from '../Middleware/upload.js'
import mongoose from 'mongoose'
import Grid from 'gridfs-stream'
import cloudinary from 'cloudinary';
import {CloudinaryStorage} from 'multer-storage-cloudinary';
import axios from 'axios'
const Cloudinary=cloudinary.v2
dotenv.config();
const {CLOUD_NAME,
CLOUDINARY_API_KEY,
CLOUDINARY_API_SECRET}=process.env





router.post('/newpost',asynchandler(async(req,res)=>{
    try{
        

        // console.log(req);
        const {text,location,picurl}=req.body

        // console.log( "picurl :"+picurl);
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
       
       
        let posts=await new post({text,location,picurl:picurl,user:userid}).save()
        
        if(posts){
         
          let newpost=await post.find({user:userid,text:text}).sort({ updatedAt:-1}).limit(1).populate('user');
        //   console.log(newpost);
           return res.status(200).send(newpost);
        }else{
          return res.status(401).send("Not able to Post");
        }
      }catch(e){
        // console.log(e);
        return res.status(500).send("Server Error");
      }
}))

router.get('/:pagenumber',asynchandler(async(req,res)=>{
    try{
      
        // console.log(process.env.jwtsecret);
        // console.log("getting post")
        const pagenumber=req.params.pagenumber;
        const size=8;
        let posts;
        let userid;
        const skips=size*(pagenumber-1);
        // console.log(pagenumber);
        if (req.header('Authorization') 
        || req.header('Authorization').startsWith('Bearer')) {
            // console.log("ENTERED AUTH MIDDLEWARE WITH TOKEN")
            // console.log(req.header('Authorization'));
            const token = req.header('Authorization').replace('Bearer ', '')|| req.header('Authorization');
            if(token){
                // console.log(token);
            }
            if (!token) {
                return res.status(401).send("Not Authorized to access the token");
            }
            const  {userId}  = jwt.verify(token, process.env.jwtsecret);
            if(userId){
                // console.log(userId);
                userid = userId;
            }else{
            //    console.log("Sorry we could not found user");
            }
        }

        const loggeduser=await Follower.find({user:userid});
        // if(loggeduser){
        //     console.log(loggeduser)
        // }
       
        if(pagenumber<2 && loggeduser){  
            // console.log("Pagenumber "+pagenumber);
            
             const allfollowing=loggeduser[0].following.map((loguser)=>loguser.user)
             
            
           
             posts=await post.find({user:{$in:[userid,...allfollowing]}}).sort({createdAt:-1}).populate("user").populate("comments.user likes.user");
            //  console.log(posts);
        }else if(pagenumber>1 && loggeduser){
             posts=await post.find({user:userid}).skips(skips).limit(8).sort({createdAt:-1}).populate("user").populate("comments.user");
        }
       
        
        if(posts.length>0){
            // console.log(posts);
            return res.status(200).send(posts);
        }else{
        //   console.log("Noposts");
            return res.status(200).send("NoPosts");
        }

    }catch(e){
        // console.log('inga than error adikithu')
        // console.log(e);
     return res.status(500).send("Internal Server Error");
    }
}))

router.put('/delete/:id',asynchandler(async(req,res)=>{
    const id=req.params.id;
    let userid;
   try{
    if (req.header('Authorization') 
    || req.header('Authorization').startsWith('Bearer')) {
        // console.log("ENTERED AUTH MIDDLEWARE WITH TOKEN")
        // console.log(req.header('Authorization'));
        const token = req.header('Authorization').replace('Bearer ', '')|| req.header('Authorization');
        // if(token){
        //     console.log(token);
        // }
        if (!token) {
            return res.status(401).send("Not Authorized to access the token");
        }
        const  {userId}  = jwt.verify(token, process.env.jwtsecret);
        if(userId){
            // console.log(userId);
            req.userId = userId;
            userid=userId;
        }else{
           console.log("Sorry we could not found user");
        }
    }

    if(id){
        // console.log(id);
        let posts=await post.findById(id).populate("user");

        if( posts && posts.user._id.toString()===userid.toString()){
            let deletepost=await post.deleteOne({_id:id}).populate("user");
            if(deletepost){
            //    console.log("post deleted successfully")
               let allposts=await post.find({}).sort({createdAt:-1}).populate("user").populate("comments.user");
                return res.status(200).send(deletepost);
            }
        }
    }else{
        // console.log("id :"+id)
    }
    
   }catch(e){
    //    console.log(e);
       return res.status(500).send("Internal Server Error");
   }
}))

router.get('/like/:id',authe,asynchandler(async(req,res)=>{
    const id=req.params.id;
    const {userId}=req;
   try{
       
    let posts=await post.findById(id).populate("likes.user");

    if(!posts){
        
        return res.status(401).send("Post not Found");
    }
   
    return res.status(200).send(posts);

   }catch(e){
       
    //    console.log(e);
       return res.status(500).send("Internal Server Error");
   }
   
}))

router.post('/liking/:id',asynchandler(async(req,res)=>{
   let userid;
    const id=req.params.id;

    try{
       console.log("mapla liking kulla irukom")
        if (req.header('Authorization') 
        || req.header('Authorization').startsWith('Bearer')) {
            console.log("ENTERED AUTH MIDDLEWARE WITH TOKEN")
            console.log(req.header('Authorization'));
            const token = req.header('Authorization').replace('Bearer ', '')|| req.header('Authorization');
            // if(token){
            //     console.log(token);
            // }
            if (!token) {
                return res.status(401).send("Not Authorized to access the token");
            }
            const  {userId}  = jwt.verify(token, process.env.jwtsecret);
            if(userId){
                // console.log(userId);
                userid = userId;
            }else{
               console.log("Sorry we could not found user");
            }
        }
        let posts=await post.findById(id);

        let liked=await posts.likes.filter((like)=>like.user.toString()==userid).length>0;

        if(liked){
           
            return res.status(200).send("The post is already liked");
        }
        
        await posts.likes.unshift({user:userid});
        await posts.save();
        
        let notification=await axios.post(`http://localhost:5000/api/notification/newlikenotification`,{
            user:userid,
             usertoNotify:posts.user,
             postId:id
        })

        if(notification){
            // console.log(notification.data);
            return res.status(200).send("successfully liked");
        }

      


    }catch(e){
      
        // console.log(e);
        return res.status(500).send("Server Error");
    }
}))

router.post('/dislike/:id',asynchandler(async(req,res)=>{
    let userid;
    const id=req.params.id;

    try{
       console.log("Mmapla dislike kulla irukom")
        if (req.header('Authorization') 
        || req.header('Authorization').startsWith('Bearer')) {
            // console.log("ENTERED AUTH MIDDLEWARE WITH TOKEN")
            // console.log(req.header('Authorization'));
            const token = req.header('Authorization').replace('Bearer ', '')|| req.header('Authorization');
            // if(token){
            //     console.log(token);
            // }
            if (!token) {
                return res.status(401).send("Not Authorized to access the token");
            }
            const  {userId}  = jwt.verify(token, process.env.jwtsecret);
            if(userId){
                // console.log(userId);
                userid = userId;
            }else{
            //    console.log("Sorry we could not found user");
            }
        }
        let posts=await post.findById(id);
 
        if(posts){
            console.log("mappi post ye kandupiduchutom")
            console.log(posts.likes)
            let unliked=await posts.likes.filter((like)=>like.user.toString()==userid.toString()).length===0;

            if(unliked){
                
                return res.status(200).send("The post is not yet liked");
            }
    
            let index=await posts.likes.map((like)=>like.user.toString()).indexOf(userid);
    
            await posts.likes.splice(index,1);
            await posts.save();

            let notification=await axios.post(`https://memogramapp.herokuapp.com/api/notification/removeLikeNotification`,{
            user:userid,
             usertoNotify:posts.user,
             postId:id
           })
            // console.log("successfully disliked")
            return res.status(200).send("Successfully disliked");
        }
        
    }catch(e){
        
        // console.log(e);
        return res.status(500).send("Server error");
    }
}))

router.get('/comment/:id',asynchandler(async(req,res)=>{
   
    const id=req.params.id;
let userid;
    try{
        if (req.header('Authorization') 
        || req.header('Authorization').startsWith('Bearer')) {
            // console.log("ENTERED AUTH MIDDLEWARE WITH TOKEN")
            // console.log(req.header('Authorization'));
            const token = req.header('Authorization').replace('Bearer ', '')|| req.header('Authorization');
            // if(token){
            //     console.log(token);
            // }
            if (!token) {
                return res.status(401).send("Not Authorized to access the token");
            }
            const  {userId}  = jwt.verify(token, process.env.jwtsecret);
            if(userId){
                // console.log(userId);
                userid = userId;
            }else{
               console.log("Sorry we could not found user");
            }
        }
        let posts=await post.findById(id);

        if(!posts){
          
            return res.status(404).send("Post not found");
        }

        if(posts.comments.length===0){
       
          return res.status(404).send("");
        }

        
        return res.status(200).send(posts.comments);
    }catch(e){
    
        // console.log(e);
        return res.status(500).send("Server Error");
    }
}))

router.post('/commenting/:id',asynchandler(async(req,res)=>{
    let userid;
    const {text}=req.body;
    const id=req.params.id;
    
console.log("mapla in commenting")
    try{
        if (req.header('Authorization') 
        || req.header('Authorization').startsWith('Bearer')) {
            // console.log("ENTERED AUTH MIDDLEWARE WITH TOKEN")
            // console.log(req.header('Authorization'));
            const token = req.header('Authorization').replace('Bearer ', '')|| req.header('Authorization');
            // if(token){
            //     console.log(token);
            // }
            if (!token) {
                return res.status(401).send("Not Authorized to access the token");
            }
            const  {userId}  = jwt.verify(token, process.env.jwtsecret);
            if(userId){
                // console.log(userId);
                userid = userId;
            }else{
            //    console.log("Sorry we could not found user");
            }
        }
        let posts=await post.findById(id);

        if(!posts){
            
            return res.status(404).send("Post not found");
        }

        const newcomment={
            id:uuidv4(),
            user:userid,
            text:text,
            date:Date.now()
        }

        posts.comments.unshift(newcomment);
        await posts.save();


        let notification=await axios.post(`http://localhost:5000/api/notification/newCommentNotification`,{
             user:userid.toString(),
             usertoNotify:posts.user,
             postId:id,
             text:text,
             commentId:newcomment.id
           })
        if(notification){
            let newres=await axios.get(`http://localhost:5000/api/chat/finduser/${userid}` , {
                headers: {
                    "Content-Type": "application/json"
                }
            })
            // console.log(notification)
            if(newres){
                console.log(newres)
                const newfun={ id:newcomment.id,
                    user:newres.data,
                    text:newcomment.text,
                    date:newcomment.date}
                
                return res.status(200).json(newfun);
            }
          
        }
       
    }catch(e){
        console.log(e)
    //    console.log(e);
       return res.status(500).send("Server Error");
    }
}))

router.put('/comment/delete/:postid/:commentid',asynchandler(async(req,res)=>{
   
    const postid=req.params.postid;
    const commentid=req.params.commentid;
    let userid;
    try{
        if (req.header('Authorization') 
        || req.header('Authorization').startsWith('Bearer')) {
            // console.log("ENTERED AUTH MIDDLEWARE WITH TOKEN")
            // console.log(req.header('Authorization'));
            const token = req.header('Authorization').replace('Bearer ', '')|| req.header('Authorization');
            // if(token){
            //     console.log(token);
            // }
            if (!token) {
                return res.status(401).send("Not Authorized to access the token");
            }
            const  {userId}  = jwt.verify(token, process.env.jwtsecret);
            if(userId){
                // console.log(userId);
                userid = userId;
            }else{
            //    console.log("Sorry we could not found user");
            }
        }
        
        let posts=await post.findById(postid);
        if(posts){
            // console.log(posts.comments);
            // console.log(commentid);
            let comment=await posts.comments.find((comment)=>comment.id.toString().trim()===commentid.toString().trim());

            if(!comment){
                // console.log(comment);
                return res.status(404).send("Comment Not Found");
            }
            
            let user=await users.findById(userid);
    
            if(user._id.toString()===comment.user.toString()||user.role=="root"){
             let index=await posts.comments.map((comment)=>comment.id.toString()).indexOf(commentid);
             await posts.comments.splice(index,1);
             await posts.save();
            //  console.log("Comment Deleted Successfully");
             let notification=await axios.post(`http://localhost:5000/api/notification/newCommentNotification`,{
                user:userid.toString(),
                 usertoNotify:posts.user,
                 postId:postid,
                 text:comment.text,
                 commentId:comment.id
               })
               if(notification){
                return res.status(200).send("Comment Deleted Successfully");

               }
           
                return res.status(200).send("Comment Deleted Successfully");

              
            }else{
               
                return res.status(401).send("you are not allowed to delete this comment");
            }
        }
        
        

       

    }catch(e){
      console.log(e)
      return res.status(500).send("Server Error");
    }
}))




// var storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, '/images')


//     },
//     filename: function (req, file, cb) {
//         console.log(file)
//         cb(null, `${file.originalname.slice(0, file.originalname.length - 4)} ${Date.now()}${path.extname(
//             file.originalname
//         )}`)
//     }
// })



// const upload = multer({
//     storage: storage,
//     fileFilter: function (req, file, cb) {
//         if (file.originalname.match(/\.(jpg|jpeg|png|mp4|mp3)$/)) {
//             return cb(null, true)
//         }
//     }
// })

// router.post('/post/image', upload.single('image'), (req, res) => {
//     console.log(req.file)
//     res.status(200).send(`${req.file.filename}`)
// })

Cloudinary.config({
    cloud_name:CLOUD_NAME,
    api_key:CLOUDINARY_API_KEY,
    api_secret:CLOUDINARY_API_SECRET
})

const storage = new CloudinaryStorage({
    cloudinary: Cloudinary,
    params: {
      folder: "memogram",
    },
  });


  const upload = multer({ storage: storage });
// const upload=(file,folder)=>{
//     return new Promise(resolve=>{
//         Cloudinary.uploader.upload(file,(result)=>{
//             resolve({
//                 url:result.url,
//                 if:result.public_id
//             })
//         },{
//             resource_type:"auto",
//             folder:folder
//         })
//     })
// }

router.post("/upload", upload.single("file"), asynchandler(async (req, res) => {
    console.log(CLOUD_NAME,
        CLOUDINARY_API_KEY,
        CLOUDINARY_API_SECRET);
   
    if (req.file === undefined) return res.send("you must select a file.");
    // const imgUrl = `http://localhost:5000/api/post/upload/${req.file.filename}`;
    // return res.send(imgUrl);
    return res.status(200).send(req.file.path );
   
}));

// let gfs;
// const conn = mongoose.createConnection("mongodb+srv://AswinRm:projects@cluster0.47e1x.mongodb.net/memogram?retryWrites=true&w=majority");
// conn.once("open", function () {
//     gfs = Grid(conn.db, mongoose.mongo);
//     gfs.collection("photos");
// });

// router.get("/upload/:filename", async (req, res) => {
//     try {
//         const file = await gfs.files.findOne({ filename: req.params.filename },(err,file)=>{
//             if (file.contentType === 'image/jpeg' || file.contentType === 'image/png' ||file.contentType === 'image/jpg') {
//                 // Read output to browser
//                 const readStream = gfs.createReadStream(file.filename);
//                 readStream.pipe(res);
//               } else {
//                 res.status(404).json({
//                   err: 'Not an image'
//                 });
//               }
//         });
        
//     } catch (error) {
//         res.send("not found");
//     }
// });

// router.delete("/upload/:filename", async (req, res) => {
//     try {
//         await gfs.files.deleteOne({ filename: req.params.filename });
//         res.send("success");
//     } catch (error) {
//         console.log(error);
//         res.send("An error occured.");
//     }
// });


router.get('/userdId/:id',asynchandler(async(req,res)=>{
    const id=req.params.id;
    let user=await users.findById(id);

    if(user){
        res.send(user);
    }
}))


router.get(`/userpost`,asynchandler(async(req,res)=>{
    let userid;
    try{
        if (req.header('Authorization') 
        || req.header('Authorization').startsWith('Bearer')) {
            // console.log("ENTERED AUTH MIDDLEWARE WITH TOKEN")
            // console.log(req.header('Authorization'));
            const token = req.header('Authorization').replace('Bearer ', '')|| req.header('Authorization');
            // if(token){
            //     console.log(token);
            // }
            if (!token) {
                return res.status(401).send("Not Authorized to access the token");
            }
            const  {userId}  = jwt.verify(token, process.env.jwtsecret);
            if(userId){
                // console.log(userId);
                userid = userId;
            }else{
            //    console.log("Sorry we could not found user");
            }
        }

        let posts=await post.find({user:userid})
        
        if(posts.length>0){
           return res.status(200).send(posts);
        }else{
            return res.status(500).send("noposts");
        }
    }catch(e){
        console.log(e);
        return res.status(500).send("Internal Server Error");
    }
        
}))

router.get(`/userpost/:username`,asynchandler(async(req,res)=>{
    const username=req.params.username;
    try{
        // console.log(username);
         let postuser=await users.find({username:username});
         if(postuser){
            //  console.log(postuser);

            let posts=await post.find({user:postuser[0]._id}).populate('user');
            if(posts.length>0){
                return res.status(200).send(posts);
             }else{
                 return res.status(200).send("noposts");
             }
         }else{
             return res.status(500).send("user not found");
         }
     
        
       
    }catch(e){
        // console.log(e);
        return res.status(500).send("Internal Server Error");
    }
        
}))


router.get('/postById/:id',asynchandler(async(req,res)=>{
    const id=req.params.id;
    try{
        // console.log(id);
           let foundpost=await post.findById(id).populate('user likes.user comments.user');
            if(foundpost){
                return res.status(200).send(foundpost);
             }else{
                 return res.status(200).send("noposts");
             }
   
    }catch(e){
        // console.log(e);
        return res.status(500).send("Internal Server Error");
    }

}))
export default router;