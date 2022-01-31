import mongoose from 'mongoose'
const Schema=mongoose.Schema;

const ProfileSchema=new Schema({

    user:{
        type:mongoose.Types.ObjectId,
        ref:"user"
    },

    bio:{
        type:String,
        required:true
    },

    social:{
        twitter:{
            type:String
        },
        facebook:{
            type:String
        },
        instagram:{
            type:String
        }
    }
},{timestamps:true},{collection: 'profile'})

const Profile=mongoose.models.profile||mongoose.model("profile",ProfileSchema);
export default Profile;