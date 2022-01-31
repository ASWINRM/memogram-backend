import mongoose from 'mongoose'
const Schema=mongoose.Schema;

const NotificationModel=new Schema({

    user:{
        type:Schema.Types.ObjectId,
        ref:'user'
    },

    notifications:[
        {
            type:{
                type:String,
                enum:['NewComment','Newlike','NewFollower'],
                trim: true
            },
            user:{
                type:Schema.Types.ObjectId,
                ref:'user'
            },
            post:{
                type:Schema.Types.ObjectId,
                ref:"PostModel"
            },
            commentId:{
                type:String
            },
            text:{
                type:String
        
            },
            read:{
                type:Boolean,
                default:false
            },
            Date:{
                type:Date,
                default:Date.now,
                required:true
            }
        }
      
    ]

  
})

const Notification=mongoose.models.Notification||mongoose.model('Notification',NotificationModel);
export default Notification;