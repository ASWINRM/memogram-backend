import mongoose from 'mongoose'
const Schema=mongoose.Schema;
import connectDB from '../db.js';
connectDB();
const UserSchema=new Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password :{
        type:String,
        required:true,
        select:true
    },
    username:{
        type:String,
        required:true,
    },
    profilepicurl:{
        type:String
       
    },
    
    newMessagepopup:{
        type:Boolean,
        default:true
    },
    unreadMessage:{
        type:Boolean,
        default:false
    },
    unreadNotification:{
        type:Boolean,
        default:false
    },
    role:{
        type:String,
        default:"user",
        enum:["user","root"]
    },
    resetToken:{
        type:String

    },
    expireToken:{
        type:Date
    }
},{timestamps:true},{collection: 'user'})



const users= mongoose.models.user||mongoose.model("user",UserSchema);

export default users;