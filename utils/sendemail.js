import nodemailer from 'nodemailer'

 const sendemail=async (options)=>{
    console.log("sendemail"+"  "+options.to)
    
    const transporter=nodemailer.createTransport({
        // host:"smtp.gmail.com",
        // port:"2525",
        // host: "https://simpleshopping-cart.netlify.app/",
       
        // secure: false,
        service: 'smtp.office365.com',
        host: 'smtp.office365.com',
        starttls: {
            enable: true
        },
        secureConnection: true,
         service:"gmail",
         port: 587,
        auth:{
            user:"memogram22@gmail.com",
            pass:"nimf mguc adln vabm"
        },
        
         
        
       
    })
    try{
         transporter.sendMail({
            from:"memogram22@gmail.com",
            to:options.to,
            subject:options.subject,
            html:options.message
        },function(error,res){
        //  if(error){
        //      console.log(error)
        //  }
        //  console.log(res)
        })

        
    }catch(e){
    //    console.log(e)
    }
   
}
export default sendemail