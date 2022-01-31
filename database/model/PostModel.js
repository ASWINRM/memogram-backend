import mongoose from 'mongoose'
const Schema=mongoose.Schema;

const PostModel=new Schema({
    text:{
        type:String,
        required:true
    },
    location:{
        type:String
    },
    picurl:{
        type:String,
        required:true
    },
    user:{
        type:mongoose.Types.ObjectId,
        ref:"user"
    },
    likes:[{user:{
        type:mongoose.Types.ObjectId,
        ref:"user"
    }}],
    comments:[
        {
            id:{
                type:String,
                required:true
            },
            user:{
                type:mongoose.Types.ObjectId,
                required:true,
                ref:"user"
            },
            text:{
                type:String,
                required:true
            },
            date:{
                type:Date,
                default:Date.now
            }
        }
        
    ]
},{timestamps:true});

const post=mongoose.models.PostModel||mongoose.model('PostModel',PostModel);
export default post;