
import Chat from '../database/model/Chatmodel.js';
import Follower from '../database/model/Follower.js';
import MessageNotification from '../database/model/MessageNotificationModel.js';
const users=[]

export const adduser=async (userId,socketId)=>{

    const user=users.find(user=>user.userId===userId);

    if(user && user.socketId===socketId){
        await removeusers(socketId)
    }

    let newuser={
        userId:userId,
        socketId:socketId
    }

    users.push(newuser)

    return users
}


export const removeuser=async(socketId)=>{

    const index=users.filter((user)=>user.socketId).indexOf(socketId)

    await users.splice(index,1)

    return ;
}

export const loadmessage=async(userId,messagesWith)=>{
    
    try{
        let response=await Chat.findOne({user:userId}).populate("chats.messagesWith chats.messages")
  
        if(response){
         
            let messages=await response.chats.find((chat)=>chat.messagesWith._id.toString()===messagesWith);
            
            if(!messages){
               return {chat:"no messages found"}
            }
            if(messages){
                console.log("messages :"+messages)
            }
          return {chat:messages}
        }else{
           return {chat:""}
        }
      }catch(e){
           console.log(e)
           return {error:e}
      }
}


export const sendmsg=async(userId,msgToId,msg)=>{
    try{

        // console.log(userId,msgToId)

        if(userId===msgToId){
            return resizeBy.status(400).send("same user")
        }
     
        let user=await  Chat.findOne({user:userId}).populate("chats.messagesWith chats.messages")

        let receiver=await Chat.findOne({user:msgToId}).populate("chats.messagesWith chats.messages")

        // console.log(user);
        // console.log(receiver);

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
            }else{
                // console.log("newchat")
                let chat={
                    messagesWith:receiver.user,
                    messages:[newmsg]
                }
                // console.log(chat)
                user.chats.unshift(chat)
            }
          
           await user.save()

           let msgNotify=await MessageNotification.findOne({user:receiver.user})

           let senderNotify=msgNotify.Notification.find((notify)=>notify.sender.toString()===user.user.toString())

           if(senderNotify){
               senderNotify.messagesLength +=1
           }else{
               let newNotify={
                   sender:user.user,
                   messagesLength:1
               }
            msgNotify.Notification.push(newNotify)

           }
           msgNotify.TotalLength +=1
           await msgNotify.save()
    
            let Receivepreviouschat=receiver.chats.find((chat)=>chat.messagesWith._id.toString()===userId)
    
            if(Receivepreviouschat){
                Receivepreviouschat.messages.push(newmsg)
            }else{
                // console.log("newchat")
                let chat={
                    messagesWith:user.user,
                    messages:[newmsg]
                }
                // console.log(chat)
                receiver.chats.unshift(chat)
            }
           await receiver.save()
          return {newChat:newmsg}
       
       
    }catch(e){
        // console.log(e);
        return {error:e}
    }
}

export const getchats=async(userId)=>{
    try{
        let user=await await Chat.findOne({user:userId}).populate("chats.messagesWith chats.messages")


    }catch(e){
        // console.log(e)
    }
}

export const AllConnectedUsers=()=>{
   return users;
}

