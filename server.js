import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import path from 'path';
import users from './database/model/usermodel.js'
import axios from 'axios'
const app = express();
// import http from 'http'
// const servers=http.Server(app)
// import socketio from 'socket.io'
// const io=new socketio(servers);

app.use(cors())
app.use(express.json())
import connectDB from './database/db.js'
dotenv.config('./config.env');
connectDB();
const __dirname = path.resolve();
app.use('/images', express.static(path.join(__dirname, 'images')))
import loginroute from './Route/loginroute.js'
import signuproute from './Route/signuproute.js'
import postroute from './Route/postroute.js'
import searchroute from './Route/searchroute.js'
import extraroute from './Route/extraroute.js'
import followroute from './Route/followroute.js'
import profileroute from './Route/profileroute.js'
import otproute from './Route/otproute.js'
import forgotroute from './Route/forgotroute.js'
import NotificationRoute from './Route/NotificationsRoute.js'
import chatroute from './Route/chatroute.js'
import {adduser,removeuser,loadmessage,sendmsg,AllConnectedUsers} from './utils/roomAction.js'
import MessageNotification from './database/model/MessageNotificationModel.js';

import  {Server}  from 'socket.io';
import { createServer } from 'http';
const router = express.Router()
const server = createServer(app); 
const io = new Server(server,{cors: {
    origin: "*"
  }
});
app.get('/',(req,res)=>{
    res.status(200).send("API is Running")
})
app.use('/api',router)
app.use('/api/login',loginroute);
app.use('/api/signup',signuproute);
app.use('/api/extra',extraroute);
app.use('/api/post',postroute);
app.use('/api/search',searchroute);
app.use('/api/followtask',followroute);
app.use('/api/profile',profileroute);
app.use('/api/otp',otproute)
app.use('/api/forgot',forgotroute)
app.use('/api/notification',NotificationRoute)
app.use('/api/chat',chatroute)



io.sockets.on('connection',(socket)=>{

    socket.on('join',async({userId})=>{
        const users=await adduser(userId,socket.id)
        console.log("userid"+userId)
        console.log(users)
        let ruser= await usersconnected.find((user)=>user.userId===userId);
        console.log("connect ruser:"+ruser)
        setInterval(()=>{
           io.to(ruser.socketId).emit("connectedusers",{users:users})
        },10000)
    })

    socket.on("loadmessage",async({userId,messagesWith})=>{
        let {chat}=await loadmessage(userId,messagesWith);
        let usersconnected=AllConnectedUsers();
        // console.log(usersconnected)
        let ruser= await usersconnected.find((user)=>user.userId===userId);

        console.log("ruser"+ruser)
        if(chat!=="no messages found"){
            // console.log("***********************************************************************")
            // console.log("chat"+ chat)
            io.to(ruser.socketId).emit("messageloaded",chat)
        }else{
            // console.log("no msg found")
            io.emit("nomsgfound")
        }
    })

    socket.on("sendmessage",async({userId,msgToId,msg})=>{

        let {newChat}=await sendmsg(userId,msgToId,msg)

        if(newChat){
            // console.log("newChat"+newChat)
            // io.emit("messagesent",newChat)

            let usersconnected=AllConnectedUsers();
            console.log("sendinguser"+ usersconnected)
            let receiveruser= await usersconnected.find((user)=>user.userId===msgToId);
         
            if(receiveruser){
                console.log("receiveruser"+receiveruser)
                // console.log("readmsg")
                
                    io.to(receiveruser.socketId).emit("newmsgreceived",newChat)

                
           
            }else{
                // console.log("unreadmsg")
                let receiver=await  users.findById(msgToId);
                let updateduser=await users.findByIdAndUpdate(receiver._id,{unreadMessage:true},{new:true});

                if(updateduser){
                    console.log(updateduser)
                    // io.emit("newmsgreceived",newChat)
                }
                
            }
        }
    })


   socket.on('likepost',async({userId,postId})=>{
    let usersconnected=AllConnectedUsers();
    console.log(usersconnected)
    try{
       
            
         console.log(userId)
          let resp=await axios.post(`https://memogramapp.herokuapp.com/api/post/liking/${postId}`,{userId:userId});
           console.log(resp.data);
           if(resp && resp.data.comment==="successfully liked"){
            io.emit('postliked');
            console.log(usersconnected)
            let receiveruser= await usersconnected.find((user)=>user.userId.toString()===resp.data.user.toString());
            
            if(receiveruser){
                 console.log(receiveruser)
                io.to(receiveruser.socketId).emit('newlikenotification',{data:resp.data})
             }
            
           }
        
        
    }catch(e){
           console.log(e);
     }
    })

    socket.on('dislikepost',async({userId,postId})=>{
        try{
            console.log(userId)
            let resp=await axios.post(`https://memogramapp.herokuapp.com/api/post/dislike/${postId}`,{userId:userId});
            console.log(resp.data)
            if(resp && resp.data==="Successfully disliked"){
                io.emit('postdisliked')
            }
        }catch(e){
            console.log(e)
        }
      
        
    })

   socket.on("deletecomment",async({userId,commentId,postId})=>{
       console.log("delete comment")
       try{
        var res=await axios.put(`https://memogramapp.herokuapp.com/api/post/comment/delete/`+postId+'/'+commentId,{userid:userId});
        if(res.data==="Comment Deleted Successfully"){
            io.emit("commentdeleted")
        }
       }catch(e){
           console.log(e)
       }
   })

   socket.on('commentpost',async({postId, user, text})=>{
    try{
        console.log("commentpost")
        const res=await axios.post('https://memogramapp.herokuapp.com/api/post/commenting/'+postId,{text,userid:user._id})
        if(res){
            console.log(res.data)
            let usersconnected=AllConnectedUsers();
            
            let receiveruser= await usersconnected.find((user)=>user.userId.toString()===res.data.user.toString());
            console.log(receiveruser);
            io.emit('commented',{data:res.data.comment});
            io.to(receiveruser.socketId).emit('newcommentNotification',{data:res.data})
          }
       }catch(e){
           console.log(e)
       }
   })

   socket.on('followrequest',async({userid,fu_id})=>{
       try{
        const res=await axios.post(`https://memogramapp.herokuapp.com/api/followtask/follow`,{userid:userid,fu_id:fu_id});

        if(res){
            
            let usersconnected=AllConnectedUsers();
            
            let receiveruser= await usersconnected.find((user)=>user.userId.toString()===fu_id);
            console.log(receiveruser);
            
            io.to(receiveruser.socketId).emit('followerNotification',{data:res.data})
        }
       }catch(e){
           console.log(e)
       }
   })


    socket.on('disconnec',({userId})=>{
        console.log(userId)
        let usersconnected=AllConnectedUsers();
        console.log(usersconnected)
        let receiveruser= usersconnected.find((user)=>user.userId.toString()===userId.toString());
        console.log(receiveruser);
        removeuser(receiveruser.socketId)
        socket.disconnect();
        console.log("user disconnected")
    })

})



server.listen(process.env.PORT || 5000, (req, res) => {
    console.log("Server is running on the port 5000")
})




process.on('unhandledRejection', (err, Promise) => {
    // console.log("logged error " + err)
    server.close(() => process.exit(1))
})

export default server