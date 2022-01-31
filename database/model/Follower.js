import mongoose from 'mongoose'
const Schema=mongoose.Schema;

const FollowerScheme=new Schema({
   user:{
       type:Schema.Types.ObjectId,
       ref:'user'
   },

   followers:[
       {
           user:{
            type:Schema.Types.ObjectId,
            ref:'user'
           }
       }
   ],

   following:[
    {
        user:{
         type:Schema.Types.ObjectId,
         ref:'user'
        }
    }
   ]
},{collection: 'Follower'})

const Follower=mongoose.models.Follower||mongoose.model("Follower",FollowerScheme);
export default Follower;