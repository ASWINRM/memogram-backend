import mongoose from 'mongoose'
const Schema=mongoose.Schema;

const MessageNotificationModel=new Schema({

    user:{
        type:Schema.Types.ObjectId,
        ref:'user'
    },
    Notification:[
        {
           sender:{
            type:Schema.Types.ObjectId,
            ref:'user'
           } ,

           messagesLength:{
               type:Number
           }
        }
    ],

    TotalLength:{
        type:Number,
        default:0
    }
})

const MessageNotification=mongoose.models.MessageNotification||mongoose.model('MessageNotification',MessageNotificationModel);
export default MessageNotification;