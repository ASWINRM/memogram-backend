import mongoose from 'mongoose'
const Schema=mongoose.Schema;

const ChatSchema=new  Schema({

    user:{
        type:Schema.Types.ObjectId,
        ref:'user',
        required:true
    },

    chats:[
        {
            messagesWith:{
                type:Schema.Types.ObjectId,
                ref:'user'
            },

            messages:[
                {
                    msg:{
                        type:String,
                        required:true
                    },
   
                    sender:{
                       type:Schema.Types.ObjectId,
                       required:true,
                       ref:'user',
                       
                    },
                    receiver:{
                        type:Schema.Types.ObjectId,
                        required:true,
                        ref:'user',
                   
                    },
                    date:{
                        type:Date,
                        default:Date.now()
                    } 
                }
               
                ]
        }
       
    ]
})

const Chat=mongoose.models.Chat||mongoose.model('Chat',ChatSchema);
export default Chat;