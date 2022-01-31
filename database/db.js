import mongoose from 'mongoose'

const connectDB= async()=>{

    try{
      const connect= await  mongoose.connect("mongodb+srv://AswinRm:projects@cluster0.47e1x.mongodb.net/memogram?retryWrites=true&w=majority",{
            useNewUrlParser:true,
            useUnifiedTopology:true,
            useFindAndModify: false,
            useCreateIndex: true
        });

        console.log(`mongo db connected to the host ${connect.connection.host}`)

    }catch(e){
        console.log(e);
        console.log("error occured")
    }
}

export default connectDB;