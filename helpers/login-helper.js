var db= require('../config/connection')
var bcrypt = require('bcrypt')
var Ecommerce = require('../config/collection')

module.exports={
    doSignup:(userData)=>{

        let response={}
        
        return new Promise(async(resolve,reject)=>{

            let usercheck =await db.get().collection(Ecommerce.UserDetailsCollection).findOne({$or:[{email:userData.email},{number:userData.number}]})
            if(usercheck){
                if(usercheck.email===userData.email){
                    response.errMessage="Email Already Exist"
                    response.userAlreadyExist =true;
                    resolve(response) 
                }else{
                    response.errMessage="Number Already Exist"
                    response.userAlreadyExist =true;
                    resolve(response) 
                }
               
            }else{
                 response.userAlreadyExist=false;
                 
             userData.password=userData.password.toString()
            userData.password=await bcrypt.hash(userData.password,10)
            db.get().collection(Ecommerce.UserDetailsCollection).insertOne(userData).then((data)=>{
                response.id = data.insertedId
                resolve(response)
            })
        }
                
        })
    
    },
    doLogin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            let response={}
           let userchecking =await db.get().collection(Ecommerce.UserDetailsCollection).findOne({email:userData.email})
          
           if(userchecking){
            if(userchecking.signupstatus){
            userData.password=userData.password.toString()
            bcrypt.compare(userData.password,userchecking.password).then((status)=>{
                if(status){
                    console.log("success")
                    response.user=userchecking;
                    response.status=true;
                    resolve(response)

                }else{
                    response.status=false
                    response.errMessage="Incorrect Password"
                    resolve(response)
                }

            })
              }else{
            response.status=false
            response.errMessage="you are blocked"
            resolve(response)
             }
           }else{
            response.status=false
            response.errMessage="Incorrect Email"
            resolve(response)
           }
        
        })
    },
    doOtplogin:(number)=>{
        return new Promise(async(resolve,reject)=>{
           let user = await db.get().collection(Ecommerce.UserDetailsCollection).findOne({number:number})
           resolve(user)
        })
    }
}