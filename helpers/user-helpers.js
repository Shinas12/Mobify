
var db=require('../config/connection')
var objectId=require('mongodb').ObjectId
var bcrypt = require('bcrypt')
const Razorpay = require('razorpay')
var Ecommerce = require('../config/collection')
require('dotenv').config()




var instance = new Razorpay({
    key_id: process.env.key_id,
    key_secret: process.env.key_secret,
  });





module.exports={



    userinformation:(userData)=>{
         return new Promise(async(resolve,reject)=>{

            

            userData.password=userData.password.toString()
            userData.password=await bcrypt.hash(userData.password,10)
            db.get().collection(Ecommerce.UserDetailsCollection).insertOne(userData).then((data)=>{
                resolve(data)
            })
                
        })
    
    },


    getUserInfo:()=>{
        return new Promise(async(resolve,reject)=>{
        let getUserInfomration =await db.get().collection(Ecommerce.UserDetailsCollection).find().toArray()
          resolve(getUserInfomration) 
        })
    },

    getSingleUserInfo:(id)=>{
        return new Promise(async(resolve,reject)=>{
        let getUserInfomration =await db.get().collection(Ecommerce.UserDetailsCollection).findOne({_id:objectId(id)})
          resolve(getUserInfomration) 
        })
    },

    getUserInfoforEdit:(usrId)=>{
        return new Promise(async(resolve,reject)=>{
        let getUserInfomration =await db.get().collection(Ecommerce.UserDetailsCollection).find({_id:objectId(usrId)}).toArray()
          resolve(getUserInfomration) 
        })
    },

    

    deleteProduct:(usrId)=>{

        return new Promise((resolve,reject)=>{
            db.get().collection(Ecommerce.ProductDetailsCollection).deleteOne({_id:objectId(usrId)}).then((response)=>{
                resolve(response)
            })
        })


    },

    getProductForEdit:(usrId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(Ecommerce.ProductDetailsCollection).findOne({_id:objectId(usrId)}).then((product)=>{
                resolve(product)
            })
        })
    },

    updateproduct:(usrId,usrDetails)=>{

        let intstock = usrDetails.stockleft
        intstock = parseInt(intstock)
        usrDetails.stockleft = intstock

        return new Promise(async(resolve,reject)=>{
            db.get().collection(Ecommerce.ProductDetailsCollection).updateOne({_id:objectId(usrId)},{
                $set:{
                    productname: usrDetails.productname,
                    price:usrDetails.price,
                    stockleft:usrDetails.stockleft, 
                    brand:objectId(usrDetails.brand),
                    img: usrDetails.img,
                    Description: usrDetails.Description,
                }
            }).then((response)=>{
                resolve()
            })
        })
    },

    updateproductOnlyStock:({_id,stock})=>{

        let intstock = stock
        intstock = parseInt(intstock)
        

        return new Promise(async(resolve,reject)=>{
            db.get().collection(Ecommerce.ProductDetailsCollection).updateOne({_id:objectId(_id)},{
                $set:{
                  
                    stockleft:intstock, 
                    
                }
            }).then((response)=>{
                resolve()
            })
        })
    },

    getOTP:async(userData)=>{
        let response={}
        return new Promise(async(resolve,reject)=>{
            let otpUser= await db.get().collection(Ecommerce.UserDetailsCollection).findOne({number:userData.number})

            if(otpUser){
                if(otpUser.signupstatus==false){
                    response.status=false
                    response.err=" you are blocked"
                    response.err1="exit"
                    resolve(response)
                }else{
                    response.status=true
                    resolve(response) 
                }

            }else{
                response.status=false
                response.err="Enter valid Number"
                resolve(response)
            }
          

        })
    },


    getProductnfo:(limit,skip)=>{

        if(skip){

        }else{
            skip = 0
        }
       
       
      
    
            return new Promise(async(resolve,reject)=>{
                let getProductInfomration =await db.get().collection(Ecommerce.ProductDetailsCollection).aggregate([
                    {
                        $match:{
                            block:false
                        }
                    },{
                        $skip:skip
                    },{
                        $limit:limit
                    }, 
                    {$lookup:
                        {
                            from: Ecommerce.CategoryCollection,
                            localField:"brand",
                            foreignField:"_id",
                            as:"catdetails"
                         }
                 }
                ])
               
                .toArray()
                
                  resolve(getProductInfomration) 
                })
            
           
        
      
    },

    blockUser:(objId)=>{
        id=objectId(objId)
        return new Promise((resolve,reject)=>{
            db.get().collection(Ecommerce.UserDetailsCollection).updateOne({_id:id},{$set:{signupstatus:false}}).then((response)=>{
            resolve() 
            })     
             
        })
    },


    unBlockUser:(objId)=>{
        id=objectId(objId)
        return new Promise((resolve,reject)=>{
             db.get().collection(Ecommerce.UserDetailsCollection).updateOne({_id:id},{$set:{signupstatus:true}}).then((response)=>{
            resolve() 
             })     
             
        })
    },

    AddStatus:(userData)=>{
         return new Promise((resolve,reject)=>{
             db.get().collection(Ecommerce.UserDetailsCollection).updateOne({email:userData.email},{$set:{signupstatus:true}}).then((response)=>{
            resolve()
             })
             
         })
     },

     Addproduct:(productData)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(Ecommerce.ProductDetailsCollection).find().count().then(async(counter)=>{
            console.log(counter++)
            count = counter++;
            console.log(count)
            let stock = productData.stockleft
            stock = parseInt(stock)
            productData.stockleft = stock
            
            let Brandobjectconvert = productData.brand 
            productData.brand = objectId(Brandobjectconvert)
            let category = await db.get().collection(Ecommerce.CategoryCollection).findOne({_id:objectId(Brandobjectconvert)})
            if(category.offerApplied){

                let originalPrice = parseInt(productData.price) 
                let offerprice = originalPrice - ( Math.round(originalPrice*category.offerPercentage/100))

                productData.original=originalPrice
                productData.price = offerprice
                productData.offerPercentage =category.offerPercentage 
                
                
  
                 db.get().collection(Ecommerce.ProductDetailsCollection).insertOne(productData).then((response)=>{
                    resolve(response.insertedId)
                 })

            }else{

                db.get().collection(Ecommerce.ProductDetailsCollection).insertOne(productData).then((response)=>{
                    resolve(response.insertedId)
                })

            }

           
        })
        })
     },


     ProductView:(usrId)=>{

        return new Promise((resolve,reject)=>{
            db.get().collection(Ecommerce.ProductDetailsCollection).findOne({_id:objectId(usrId)}).then((response)=>{
                resolve(response)
            })
        })
    },

    blockProduct:(objId)=>{
        id=objectId(objId)
        return new Promise((resolve,reject)=>{
            db.get().collection(Ecommerce.ProductDetailsCollection).updateOne({_id:id},{$set:{block:true}}).then((response)=>{
            resolve() 
            })     
             
        })
    },

    UnblockProduct:(objId)=>{
        id=objectId(objId)
        return new Promise((resolve,reject)=>{
            db.get().collection(Ecommerce.ProductDetailsCollection).updateOne({_id:id},{$set:{block:false}}).then((response)=>{
            resolve() 
            })     
        })
    },

    getProductnfofull:()=>{
        return new Promise(async(resolve,reject)=>{
        let getProductInfomration =await db.get().collection(Ecommerce.ProductDetailsCollection)
        .aggregate([{
            $lookup:{
                from:Ecommerce.CategoryCollection,
                localField:'brand',
                foreignField:'_id',
                as:'BrandDetails'
            }
        },
    ]).toArray()
          
          resolve(getProductInfomration) 
        })
    },

    ProductCount:(objId)=>{
        id=objectId(objId)
        return new Promise((resolve,reject)=>{
                db.get().collection(Ecommerce.ProductDetailsCollection).updateOne({_id:id},{$set:{count:count}}).then((response)=>{
                    
                    resolve() 
                    })    
           
        })
    },
    Addtocart:async (proId,Usrid)=>{
        let proObj={
            item:objectId(proId),
            quantity:1
        }
        let userfind= await db.get().collection(Ecommerce.CartCollection).findOne({user:objectId(Usrid)})
    
        if(userfind){
            let proExist = await userfind.product.findIndex(check=> check.item==proId)
            return new Promise((resolve,reject)=>{
                if(proExist != -1){
                    db.get().collection(Ecommerce.CartCollection).updateOne({'product.item': objectId(proId),user: objectId(Usrid)},{
                        $inc:{'product.$.quantity':1}
                    })
                    .then((response)=>{
                        resolve()
                    })
                }else{
                    db.get().collection(Ecommerce.CartCollection).updateOne({user: objectId(Usrid)},
                    {$push:{product:proObj}}).then((response)=>{
                        resolve()
                    })
                } 
           
        })

        }else{ 
            let obj={
                user : objectId(Usrid),
                product:[proObj]
            }
            return new Promise((resolve,reject)=>{
                db.get().collection(Ecommerce.CartCollection).insertOne(obj).then((response)=>{
                    resolve()
                })
            })
        }
       
    },

    
    ViewCartDiscount:(Usrid,total)=>{

        let tot = parseInt(total)
       
        
         return new Promise ((resolve,reject)=>{
           db.get().collection(Ecommerce.CartCollection).aggregate(
                [
                    {$match:{user:objectId(Usrid)}},

                
                      {$lookup:
                        {
                            from: Ecommerce.UserDetailsCollection,
                            localField:"user",
                            foreignField:"_id",
                            as:"usrdetails"
                         }
                 },
                 {
                    $project:{userdetails: { $arrayElemAt: [ "$usrdetails", 0 ] }}
                 },
                 {$lookup:
                    {
                        from: Ecommerce.CouponCollection,
                        localField:"userdetails.couponId",
                        foreignField:"_id",
                        as:"Coupondetails"
                     }
             },
             {
                $project:{Coupondetails: { $arrayElemAt: [ "$Coupondetails", 0 ] },userdetails:1}
             },
             {
                $project:{
                   discountedPrice: {$round:[{ $multiply: [ {$divide: [  "$Coupondetails.Discount", 100 ]},tot] },0]},
                   userdetails:1,
                   Coupondetails:1
                }
              },
              {
                $project:{
                   TotalAfterDiscount: { $subtract: [tot,'$discountedPrice' ] },
                   discountedPrice:1,
                   Coupondetails:1
                }
              },
              
              
                ]
            ).toArray()
            .then((find)=>{
              
                resolve(find) 
            })
            
         })       
    },

    ViewCart:(Usrid)=>{
        
        return new Promise ((resolve,reject)=>{
          db.get().collection(Ecommerce.CartCollection).aggregate(
               [
                   {$match:{user:objectId(Usrid)}},

                   {$unwind:"$product"},

                   {$lookup:
                           {
                               from: Ecommerce.ProductDetailsCollection,
                               localField:"product.item",
                               foreignField:"_id",
                               as:"productdetails"
                            }
                    },

                    {
                       $project:{productdetails: { $arrayElemAt: [ "$productdetails", 0 ] },product:1,user:1}
                    },
                    {
                       $addFields: {
                           convertedPrice:{$toInt:"$productdetails.price"},
                           connvertedQty:{$toInt:"$product.quantity"}
                        } 
                     },
                     {
                       $project:{
                          total: { $multiply: [ "$convertedPrice", "$connvertedQty" ]},productdetails:1,product:1,user:1,connvertedQty:1
                       }
                     },
                     {
                        $project:{
                           totalAfteroffer: { $multiply: [ "$productdetails.offerPrice", "$connvertedQty" ]},productdetails:1,product:1,user:1,total:1 
                        }
                      },
                     

               ]
           ).toArray()
           .then((find)=>{
                console.log(find)
               resolve(find) 
           })
           
        })       
   },

    removeCart:({proId,cartId})=>{
          
        return new Promise((resolve,reject)=>{
            db.get().collection(Ecommerce.CartCollection).updateOne({_id:objectId(cartId)},
            {$pull:
            {
                product:{
                    item:objectId(proId) 
                }
            }}).then((response)=>{
                
                resolve(response)
        })
        })

    },
 
    getcartcount:(Usrid)=>{
        return new Promise((resolve,reject)=>{
            let cartcount = null
            db.get().collection(Ecommerce.CartCollection).findOne({user:objectId(Usrid)}).then((response)=>{
                
                if(response){
                   cartcount = response.product.length
                   
                   if(cartcount!==0){
                    resolve(cartcount)
                   }else{
                    resolve()
                   }
            }else{
                resolve()
            }
        })
        })
        
    },

    productCountChange:({cart,proId,count,qty})=>{
        
        count = parseInt(count)
        qty = parseInt(qty)
        return new Promise((resolve,reject)=>{
            let obj = {}
            if(qty == 1 && count == -1){
                obj.checkminus = true 
                    resolve(obj)
            }else{

                if(count !== -1){

                    db.get().collection(Ecommerce.ProductDetailsCollection).findOne({_id:objectId(proId)}).then((prodetails)=>{
                    
                        if( qty >= prodetails.stockleft){
    
                            obj.check = false
                            resolve(obj)
    
                        }else{
    
                            obj.check = true
                            db.get().collection(Ecommerce.CartCollection).updateOne({'product.item': objectId(proId),_id: objectId(cart)},{
                                $inc:{'product.$.quantity':count}
                            })
                            .then((response)=>{    
                                resolve(obj)                     
                            })
    
                        }
                        
                    }) 

                }else{

                    obj.check = true
                            db.get().collection(Ecommerce.CartCollection).updateOne({'product.item': objectId(proId),_id: objectId(cart)},{
                                $inc:{'product.$.quantity':count}
                            })
                            .then((response)=>{    
                                resolve(obj)                     
                            })

                }

                
               
            }
          
        })
    },


        grandTotal:(usrId)=>{
        
        return new Promise ((resolve,reject)=>{
            db.get().collection(Ecommerce.CartCollection).aggregate(
                 [
                     {$match:{user:objectId(usrId)}},
 
                     {$unwind:"$product"},
 
                     {$lookup:
                             {
                                 from: Ecommerce.ProductDetailsCollection,
                                 localField:"product.item",
                                 foreignField:"_id",
                                 as:"productdetails"
                              }
                      },
 
                      {
                         $project:{productdetails: { $arrayElemAt: [ "$productdetails", 0 ] },product:1,user:1}
                      },
                      {
                        $addFields: {
                            convertedPrice:{$toInt:"$productdetails.price"},
                            connvertedQty:{$toInt:"$product.quantity"}
                         } 
                      },{
                        $project:{
                           
                            productdetails:1
                           ,product:1
                           ,user:1
                           ,convertedPrice:1
                           ,connvertedQty:1 
                        }
                      },

                      {
                        $group:{
                            _id:null,
                            grandtotal:{
                                $sum:{
                                    $multiply:['$convertedPrice','$connvertedQty']
                                }
                            }
                            
                        }
                      }
 
                 ]
             ).toArray()
             .then((find)=>{
               
             
                 resolve(find) 
             })
             
          }) 
    },
    CartDetailsforOrders:(usrId)=>{
        return new Promise (async (resolve, reject)=>{
           let cartdetails = await db.get().collection(Ecommerce.CartCollection).findOne({user:objectId(usrId)})
           
            resolve(cartdetails)
           
        })

    },
    Orderdetails:(order,cartDetails,grandTotal,Discount)=>{

        let d = new Date()
        let  month = '' + (d.getMonth() + 1)
        let day = '' + d.getDate()
        let year = d.getFullYear()



         if (month.length < 2) 
             month = '0' + month;
         if (day.length < 2) 
             day = '0' + day;



        let time = [year, month, day].join('-')
        let monthorder = [year, month].join('-')


       return new Promise((resolve,reject)=>{
       
        let obj
        let  Addressobj 

        let status = order.paymentMethod === "cod"?"successfull":"pending";


        let ship = status === 'successfull'?"order Placed":"pending"

        
      
                     if(Discount[0].TotalAfterDiscount){

                         obj = {
                            DeliveryDetails:{
                                CustomerName:order.name,
                                CustomerEmail:order.email,
                                CustomerPhone:order.Phone,
                                Address:{
                                    Housename:order.housename,
                                    LandMark:order.landMark,
                                    Pincode:order.PinCode,
                                    Street:order.streetName,
                                    City:order.City,
                                    State:order.state
                                },
                                },
                                CustomerPaymentMethod:order.paymentMethod,
                                GrandTotal:Discount[0].TotalAfterDiscount,
                                DiscountedAmount:Discount[0].discountedPrice,
                                DiscountPercentage:Discount[0].Coupondetails.Discount,
                                CouponId:objectId(Discount[0].Coupondetails._id),
                                CouponApplied:true,
                                
                              
    
    
                                proEach:cartDetails.product.forEach(object => {
                                    object.shipping = ship;
                                }),
    
                                
                                product:cartDetails.product,
                                status:status,
                                date:time,
                                monthoforder:monthorder,
                                yearoforder: year,
                                userId:objectId(order.userId), 
                                
    
                        }

                         Addressobj = {}
                        Addressobj.AdDetails = obj.DeliveryDetails
                        Addressobj.userId = objectId(order.userId)

                     }else{

                         obj = {
                            DeliveryDetails:{
                                CustomerName:order.name,
                                CustomerEmail:order.email,
                                CustomerPhone:order.Phone,
                                Address:{
                                    Housename:order.housename,
                                    LandMark:order.landMark,
                                    Pincode:order.PinCode,
                                    Street:order.streetName,
                                    City:order.City,
                                    State:order.state
                                },
                                },
                                CustomerPaymentMethod:order.paymentMethod,
                                    GrandTotal:grandTotal[0].grandtotal,
                                    CouponApplied:false,
                                
                              
    
    
                                proEach:cartDetails.product.forEach(object => {
                                    object.shipping = ship;
                                }),
    
                                
                                product:cartDetails.product,
                                status:status,
                                date:time,
                                monthoforder:monthorder,
                                yearoforder: year,
                                userId:objectId(order.userId), 

                                
                                
    
                        }

                         Addressobj = {}
                        Addressobj.AdDetails = obj.DeliveryDetails
                        Addressobj.userId = objectId(order.userId)

                     }

                    


                   


                    let objct = {}

                      db.get().collection(Ecommerce.OrderCollection).insertOne(obj).then((response)=>{
                        objct.id = response.insertedId


                        if(status === "successfull"){
                            db.get().collection(Ecommerce.CartCollection).remove({user:objectId(order.userId)})
                            db.get().collection(Ecommerce.UserDetailsCollection).findOne({_id:objectId(order.userId)}).then((userfind)=>{
                                 
                                db.get().collection(Ecommerce.UserDetailsCollection).updateOne({_id:objectId(order.userId)}
                                ,{$unset:{
                                    couponId:userfind.couponId
                                }})

                            })

                          

                        }
                        
                        db.get().collection(Ecommerce.AddressCollection).insertOne(Addressobj)
                       

                        if(status === "successfull"){


                        db.get().collection(Ecommerce.OrderCollection).aggregate([{
                            $match:{
                                _id:response.insertedId
                            },
                        },{
                            $unwind:"$product"
                        },{
                            $project:{
                                proId:"$product.item",
                               proQuantity: "$product.quantity"
                            }
                        }
                        ]).toArray().then((proId)=>{
                            objct.proId = proId
                        resolve(objct)
                        })


                    }else{
                        resolve(objct) 
                    }


                    })


  
       })
    },

    OrderSummaryDetails:(usrId)=>{
        
        return new Promise (async(resolve,reject)=>{
            let orderDetails = await db.get().collection(Ecommerce.OrderCollection).aggregate([
                 
                {$match:{userId:objectId(usrId)}},
 
                     {$unwind:"$product"},
 
                     {$lookup:
                             {
                                 from: Ecommerce.ProductDetailsCollection,
                                 localField:"product.item",
                                 foreignField:"_id",
                                 as:"productdetails"
                              }
                      },
                      {
                        $project:{
                            productdetails: { $arrayElemAt: [ "$productdetails", 0 ] },
                            userId:1,
                            date:1,
                            GrandTotal:1,
                            CustomerPaymentMethod:1,
                            status:1,
                            product:1,
                            Shipping:1,
                            DiscountPercentage:1,
                            
                        }
                     },
                     {
                        $addFields: {
                            convertedPrice:{$toInt:"$productdetails.price"},
                            connvertedQty:{$toInt:"$product.quantity"}
                         } 
                      },
                      {
                        $project:{
                           total: { 
                            $multiply: [ "$convertedPrice", "$connvertedQty" ]},
                            productdetails:1,
                            userId:1 ,
                            convertedPrice:1,
                            connvertedQty:1,
                            CustomerPaymentMethod:1,
                            status:1,
                            GrandTotal:1,
                            date:1,
                            product:1,
                            Shipping:1,
                            DiscountPercentage:1,
                            
                        }
                      } ,                    
                       {$lookup:
                        {
                            from: Ecommerce.CategoryCollection,
                            localField:"productdetails.brand",
                            foreignField:"_id",
                            as:"catdetails"
                         }
                 }, 
                 {
                    $project:{
                       DiscountedPrice: { 
                        $subtract:  ["$total",{$round:[{$multiply:[{ $divide: [ "$total",100]},"$DiscountPercentage"]},0]}]
                       },
                        total:1,
                        productdetails:1,
                        userId:1 ,
                        convertedPrice:1,
                        connvertedQty:1,
                        CustomerPaymentMethod:1,
                        status:1,
                        GrandTotal:1,
                        date:1,
                        product:1,
                        Shipping:1,
                        DiscountPercentage:1,
                        catdetails:1
                        
                    }
                  },{
                    $sort:{_id:-1}
                  }                     
   
            ]).toArray()
            console.log(orderDetails)

            resolve(orderDetails)

        })

    },
    AdminOrderSummaryDetails:()=>{
        return new Promise (async (resolve,reject)=>{
           let AOsummary = await db.get().collection(Ecommerce.OrderCollection).aggregate([
                 
                     {$unwind:"$product"},
 
                     {$lookup:
                             {
                                 from: Ecommerce.ProductDetailsCollection,
                                 localField:"product.item",
                                 foreignField:"_id",
                                 as:"productdetails"
                              }
                      },
                      {
                        $project:{
                            productdetails: { $arrayElemAt: [ "$productdetails", 0 ] },
                            userId:1,
                            date:1,
                            GrandTotal:1,
                            DeliveryDetails:1,
                            CustomerPaymentMethod:1,
                            status:1,
                            Shipping:1,
                            product:1,
                            DiscountPercentage:1,
                        }
                     },
                     {
                        $addFields: {
                            convertedPrice:{$toInt:"$productdetails.price"},
                            connvertedQty:{$toInt:"$product.quantity"}
                         } 
                      },
                      {
                        $project:{
                           total: { $multiply: [ "$convertedPrice", "$connvertedQty" ]}, 
                           productdetails:1,
                           user:1 ,
                           convertedPrice:1,
                           connvertedQty:1,
                           DeliveryDetails:1,
                           CustomerPaymentMethod:1,
                           status:1,
                           Shipping:1,
                           date:1,
                           product:1,
                           DiscountPercentage:1,
                        }
                      },
                     {$lookup:
                        {
                            from: Ecommerce.CategoryCollection,
                            localField:"productdetails.brand",
                            foreignField:"_id",
                            as:"catdetails"
                         }
                     },         
                      {
                        $project:{
                           DiscountedPrice: { 
                            $round:[{ $divide: [ "$total", "$DiscountPercentage" ]},0]
                           },
                            total:1,
                            productdetails:1,
                            userId:1 ,
                            convertedPrice:1,
                            connvertedQty:1,
                            CustomerPaymentMethod:1,
                            status:1,
                            GrandTotal:1,
                            date:1,
                            product:1,
                            Shipping:1,
                            DiscountPercentage:1,
                            DeliveryDetails:1,
                            
                        }
                      } ,{
                        $sort:{_id:-1}
                      } 
            ]).toArray()
            resolve(AOsummary)
            
        })

    },
    OrderSummaryDetailsGrandTotal:(usrId)=>{
        return new Promise (async(resolve,reject)=>{
            let ordergrandTotal = await db.get().collection(Ecommerce.OrderCollection).aggregate([
                 
                {$match:{userId:objectId(usrId)}},
 
                     {$unwind:"$product"},
 
                     {$lookup:
                             {
                                 from: Ecommerce.ProductDetailsCollection,
                                 localField:"product.item",
                                 foreignField:"_id",
                                 as:"productdetails"
                              }
                      },
                      {
                        $project:{
                            productdetails: { $arrayElemAt: [ "$productdetails", 0 ] },
                            product:1
                            
                        }
                     },
                     {
                        $addFields: {
                            convertedPrice:{$toInt:"$productdetails.price"},
                            connvertedQty:{$toInt:"$product.quantity"}
                         } 
                      },
                      {
                        $group:{
                            _id:null,
                           grandtotal: {
                            $sum:{
                                $multiply: [ "$convertedPrice", "$connvertedQty" ]},    
                            }     
                        }
                      },

            ]).toArray()

            resolve(ordergrandTotal)

        })

    },

    ChangeOrderStatus:({orderId,proId,Ship})=>{
        
        return new Promise((resolve,reject)=>{

            db.get().collection(Ecommerce.OrderCollection).updateOne({_id:objectId(orderId),"product": { $elemMatch: { "item": objectId(proId) }}},
            {$set: { "product.$.shipping": Ship }}
            ).then(()=>{
               resolve()
            })

        })
    },

    Wishlist:(proId,Usrid)=>{
        
        return new Promise(async(resolve,reject)=>{
           
        let ProductId=objectId(proId)
        let userid = objectId(Usrid)
        let userfind =await db.get().collection(Ecommerce.WishlistCollection).findOne({user:userid})
       
        if(!userfind){

            let product = []
            product.push(ProductId)
         
            let obj = {
                user: userid,
                product:product
            }

            db.get().collection(Ecommerce.WishlistCollection).insertOne(obj).then((response)=>{
                console.log(response)
                resolve(true)
            })

        }else{
            
            let proExist = await userfind.product.findIndex(check=> check.toString()==objectId(proId).toString())
            console.log(proExist)

            if(proExist != -1){
               

                db.get().collection(Ecommerce.WishlistCollection).updateOne({user:userid},{$pull:{product:objectId(proId)}}).then((response)=>{
                    console.log(response)
                    resolve(false)
                })


            }else{
                

            db.get().collection(Ecommerce.WishlistCollection).updateOne({user:userid},{$push:{product:objectId(proId)}})
            resolve(true)

            }

            

        }


        })
       
        
       
    },

    Wishlistremove:(proId,Usrid)=>{


       
        
        return new Promise((resolve,reject)=>{
            
           
            let userid = objectId(Usrid)
            console.log(proId)

           

            console.log(userid)
         
         

            db.get().collection(Ecommerce.WishlistCollection).updateOne({user:userid},{$pull:{product:objectId(proId)}}).then((response)=>{
                console.log(response)
                resolve()
            })


        })
       
        
       
    },


    categoryManagement:(Brands)=>{
        
       return new Promise((resolve,reject)=>{

        db.get().collection(Ecommerce.CategoryCollection).findOne({Brand:Brands.Brand}).then((Brandfind)=>{
            if(Brandfind){
                resolve(true)
            }else{
                db.get().collection(Ecommerce.CategoryCollection).insertOne(Brands).then((response)=>{
                  resolve(false)
                })

            }
        })
       
       
       })
    },

    addCategory:()=>{
        return new Promise(async(resolve,reject)=>{
          category= await  db.get().collection(Ecommerce.CategoryCollection).find().toArray()
          resolve(category)
            
        })
    },

     wishlistdeatis:(usrId)=>{
        return new Promise(async (resolve,reject)=>{

           let result = await db.get().collection(Ecommerce.WishlistCollection).aggregate([
                 
                {$match:{user:objectId(usrId)}},
 
                {$unwind:"$product"},

                {$lookup:
                        {
                            from: Ecommerce.ProductDetailsCollection,
                            localField:"product",
                            foreignField:"_id",
                            as:"productdetails"
                         }
                 },
                 {
                    $project:{
                        productdetails: { $arrayElemAt: [ "$productdetails", 0 ] },
                        product:1,
                        user:1,
                        _id:1
                        
                    }
                 }, 
                 {$lookup:
                    {
                        from: Ecommerce.CategoryCollection,
                        localField:"productdetails.brand",
                        foreignField:"_id",
                        as:"catdetails"
                     }
             },


            ]).toArray()
            resolve(result)
            
        })
    },

  

 changePassword:(p,np,usrId)=>{

    

    return new Promise(async(resolve,reject)=>{

        let response = {}

       let userfind = await db.get().collection(Ecommerce.UserDetailsCollection).findOne({_id:objectId(usrId)})
      
       if(userfind){
       
        p=p.toString()

        bcrypt.compare(p,userfind.password).then(async (status)=>{

            if(status){

                response.check = true;

                np=np.toString()
                nbpass=await bcrypt.hash(np,10)

                db.get().collection(Ecommerce.UserDetailsCollection).updateOne({_id:objectId(usrId)},{
                    $set:{
                       password:nbpass 
                    }
                }).then((resp)=>{
                    resolve(response)
                })

            }else{
                response.check=false,
                response.errmessage = "password is not matching"
                 resolve(response)
            }

        })
        
       

      

    }
      
    })
 },

 getUserInfoforChecking:({name,email,number,_id})=>{
    let response = {}
   
    return new Promise(async(resolve,reject)=>{
    let getUserInfomration =await db.get().collection(Ecommerce.UserDetailsCollection).findOne({email:email,_id:{$ne:objectId(_id)}})
      if(getUserInfomration){
         response.boolean=true
         response.errMessage="Email Already Exists"
         resolve(response)
      }else{
        response.boolean=false
        db.get().collection(Ecommerce.UserDetailsCollection).updateOne({_id:objectId(_id)},{
            $set:{
                email:email,
                number:number,
                name:name
            }
        })
        resolve(response)
      }
    })
},

getAddressforfilling:(usrId,Customer,Housename)=>{

    return new Promise(async (resolve,reject)=>{
       let addrss = await db.get().collection(Ecommerce.AddressCollection).aggregate(
            [
                {
                    $match:{
                        $and:[
                            {
                            userId:objectId(usrId)
                            },
                            {
                                'AdDetails.CustomerName':Customer
                            },
                            {
                                'AdDetails.Address.Housename':Housename
                            }
                        ]
                        
                    }
                   
                },
                {
                    $group:{
                      _id:"$AdDetails"
                    }
                }
            ]
        ).toArray()
        resolve(addrss)
    })
},

getAddress:(usrId)=>{
    return new Promise(async (resolve,reject)=>{
       let addrss = await db.get().collection(Ecommerce.AddressCollection).aggregate(
            [
                {
                    $match:{      
                            userId:objectId(usrId)     
                    }
                   
                },
                {
                    $group:{
                      _id:"$AdDetails"
                    }
                },
                {
                   $limit:3
                }
            ]
        ).toArray()
        resolve(addrss)
    })
},

deleteAddress:({Housename,LandMark,Phone,Name,usrId})=>{
   
    return new Promise((resolve,reject)=>{
        db.get().collection(Ecommerce.AddressCollection).deleteMany({

            
                userId:objectId(usrId),
                'AdDetails.CustomerName':Name,
                'AdDetails.Address.Housename':Housename,
                'AdDetails.CustomerPhone':Phone,
                'AdDetails.Address.LandMark':LandMark,

        } ).then((response)=>{
            resolve(response)
        })
    })
},

EditAddress:({Housename,LandMark,Phone,Name,usrId})=>{
   
    return new Promise((resolve,reject)=>{
        db.get().collection(Ecommerce.AddressCollection).findOne({

            
                userId:objectId(usrId),
                'AdDetails.CustomerName':Name,
                'AdDetails.Address.Housename':Housename,
                'AdDetails.CustomerPhone':Phone,
                'AdDetails.Address.LandMark':LandMark,

        } ).then((response)=>{
            resolve(response)
        })
    })
},


getMoreAddress:(usrId)=>{
    return new Promise(async (resolve,reject)=>{
       let addrss = await db.get().collection(Ecommerce.AddressCollection).aggregate(
            [
                {
                    $match:{      
                            userId:objectId(usrId)     
                    }
                   
                },
                {
                    $group:{
                      _id:"$AdDetails"
                    }
                },
            ]
        ).toArray()
        resolve(addrss)
    })
},
productStockDecrement:({_id,proId,proQuantity})=>{
   

    let proQty = parseInt(proQuantity)
     proQty = -Math.abs(proQty)
  

    return new Promise((resolve,reject)=>{
        db.get().collection(Ecommerce.ProductDetailsCollection).updateOne({_id:proId},{
            $inc:{stockleft:proQty}
        })
    })

},

productStockIncrement:({proId,proQnty})=>{
   

    let proQty = parseInt(proQnty)

    return new Promise((resolve,reject)=>{
        db.get().collection(Ecommerce.ProductDetailsCollection).updateOne({_id:objectId(proId)},{
            $inc:{stockleft:proQty}
        })
    })

},

groupOrders:()=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(Ecommerce.OrderCollection).aggregate(
            [{
                $group:{
                    _id:"$userId"
                }

            },{
                $lookup:{
                    from : Ecommerce.UserDetailsCollection,
                    localField:"_id",
                    foreignField:"_id",
                    as:"userdetails"
                }
            },
            {
                $project:{
                    _id:1,
                    user:{ $arrayElemAt: [ "$userdetails", 0 ] }
                }
            }
            ]
        ).toArray().then((groupOrderUserId)=>{
            resolve(groupOrderUserId)
        })
    })
},

getUserwithId:(usrId)=>{
   
    return new Promise(async (resolve,reject)=>{
      let userfindwithId = await  db.get().collection(Ecommerce.UserDetailsCollection).findOne({_id:usrId._id})
      resolve(userfindwithId)
    })
    
},
findOrder:(usrId)=>{
    return new Promise (async (resolve,reject)=>{
       let orderdetails = await  db.get().collection(Ecommerce.OrderCollection).aggregate([
        {
            $match:{
                userId:objectId(usrId)
            }
        },
        {
            $unwind:"$product"
        },{
            $project:{
                product:1,
                userId:1,
                date:1,
                DiscountedAmount:1,
                DiscountPercentage:1,
                CouponId:1,
                CouponApplied:1,

            }
        },
        {
            $lookup:{
                from : Ecommerce.ProductDetailsCollection,
                localField:"product.item",
                foreignField:"_id",
                as:"prodetails"
            }
        },
        {
            $unwind:"$prodetails"
        },
        {
            $project:{
                product:1,
                userId:1,
                date:1,
                prodetails:1,
                DiscountedAmount:1,
                DiscountPercentage:1,
                CouponId:1,
                CouponApplied:1,
            }
        },{
            $lookup:{
                from : Ecommerce.CouponCollection,
                localField:"CouponId",
                foreignField:"_id",
                as:"Coupondetails"
            }
        },{
            $sort:{date:-1}
        }
       ]).toArray()
            

            resolve(orderdetails)
       
    })
},

specificproductdetails: ({odrId,prId})=>{

    

    return new Promise (async (resolve,reject)=>{

        let specificordersdetails = await db.get().collection(Ecommerce.OrderCollection).aggregate([
            {
                $match:{
                    _id:objectId(odrId)
                }
            },{
                $unwind:"$product"
            },{
                $match:{
                    'product.item':objectId(prId)
                }
            }, {
                $lookup:{
                    from : Ecommerce.ProductDetailsCollection,
                    localField:"product.item",
                    foreignField:"_id",
                    as:"prodetails"
                }
            }, {
                $project:{
                    _id:1,
                    prodetail:{ $arrayElemAt: [ "$prodetails", 0 ] },
                    DeliveryDetails:1,
                    product:1,
                    status:1,
                    date:1,
                    userId:1,
                    CustomerPaymentMethod:1,
                    GrandTotal:1,
                    CustomerPaymentMethod:1,
                    DiscountedAmount:1,
                    DiscountPercentage:1,
                    CouponId:1,
                    CouponApplied:1,
                }
            },
            {
                $lookup:{
                    from : Ecommerce.CouponCollection,
                    localField:"CouponId",
                    foreignField:"_id",
                    as:"Coupondetails"
                }
            }
        ]).toArray()

    
        resolve(specificordersdetails)

    })
 
},

   getRazorPay: (ordrId,total,discount)=>{
   
    return new Promise((resolve,reject)=>{

        if(discount[0].TotalAfterDiscount){

            var options = {
                amount: discount[0].TotalAfterDiscount*100,
                currency: "INR",
                receipt: ""+ordrId
           };

        }else{
            var options = {
                amount: total[0].grandtotal*100,
                currency: "INR",
                receipt: ""+ordrId
           };
        }
  
   instance.orders.create(options, function(err, order) {
    if(err){
        console.log(err)
    }else{ 
    resolve(order)
    }
     
   });
                 
    })
},

verifypayment:(details)=>{
    return new Promise((resolve,reject)=>{
        const crypto = require('crypto')
        let hmac = crypto.createHmac('sha256','wDxqeprvXspTVQDSiRmoRki4')
        hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]'])
        hmac = hmac.digest('hex')

        if(hmac == details['payment[razorpay_signature]']){
            resolve()
        }else{
            reject()
        }
    })
},

changePaymentStatus:(orderId)=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(Ecommerce.OrderCollection)
        .updateOne({_id:objectId(orderId)},
        {
            $set:{
                status:"Successfull"
            }
        }).then(()=>{
            resolve()
        })
    })
},

PaymentSuccessParty:(orderId,usrId)=>{
    console.log("its order id da")
    console.log(orderId)
    return new Promise((resolve,reject)=>{

        
        db.get().collection(Ecommerce.CartCollection).remove({user:objectId(usrId)})


        db.get().collection(Ecommerce.UserDetailsCollection).findOne({_id:objectId(usrId)}).then((userfind)=>{
                                 
            db.get().collection(Ecommerce.UserDetailsCollection).updateOne({_id:objectId(usrId)}
            ,{$unset:{
                couponId:userfind.couponId
            }})

        })


        db.get().collection(Ecommerce.OrderCollection).aggregate([{
            $match:{
                _id:objectId(orderId)
            },
        },{
            $unwind:"$product"
        },{
            $project:{
                proId:"$product.item",
            proQuantity: "$product.quantity"
            }
        }
        ]).toArray().then((proId)=>{
            
        resolve(proId)
        })


    })
},

ChangeOrderStatusAfterOnlinePayment:(orderId,{_id,proId,proQuantity})=>{
    return new Promise((resolve,reject)=>{

        db.get().collection(Ecommerce.OrderCollection).updateOne({_id:objectId(orderId),"product": { $elemMatch: { "item": objectId(proId) }}},
        {$set: { "product.$.shipping": "Order Placed" }}
        )

    })
},

getOrderdetailsUsingId:(orderId)=>{
    return new Promise(async (resolve,reject)=>{
      let orderfind = await  db.get().collection(Ecommerce.OrderCollection).aggregate([
        {
            $match:{_id:objectId(orderId)}
        },
         {$lookup:
            {
                from: Ecommerce.CouponCollection,
                localField:"CouponId",
                foreignField:"_id",
                as:"coupondetails"
             }
     },
      ]).toArray()
      
      resolve(orderfind)
    })
   
},

getOrderdetailsAll:()=>{
    return new Promise(async (resolve,reject)=>{
      let orderfind = await  db.get().collection(Ecommerce.OrderCollection).find().sort({_id:-1}).toArray()

      resolve(orderfind)
    })
   
},

OrderSummaryDetailsusingOrderId:(ordrId)=>{
        
    return new Promise (async(resolve,reject)=>{
        let orderDetails = await db.get().collection(Ecommerce.OrderCollection).aggregate([
             
                 {$match:{_id:objectId(ordrId)}},

                 {$unwind:"$product"},

                 {$lookup:
                         {
                             from: Ecommerce.ProductDetailsCollection,
                             localField:"product.item",
                             foreignField:"_id",
                             as:"productdetails"
                          }
                  },
                  {
                    $project:{
                        productdetails: { $arrayElemAt: [ "$productdetails", 0 ] },
                        userId:1,
                        date:1,
                        GrandTotal:1,
                        CustomerPaymentMethod:1,
                        status:1,
                        product:1,
                        Shipping:1,
                        DiscountPercentage:1,
                        DiscountedAmount:1,
                        
                        
                    }
                 },
                 {
                    $addFields: {
                        convertedPrice:{$toInt:"$productdetails.price"},
                        connvertedQty:{$toInt:"$product.quantity"}
                     } 
                  },
                  {
                    $project:{
                       total: { 
                        $multiply: [ "$convertedPrice", "$connvertedQty" ]},
                        productdetails:1,
                        user:1 ,
                        convertedPrice:1,
                        connvertedQty:1,
                        CustomerPaymentMethod:1,
                        status:1,
                        GrandTotal:1,
                        date:1,
                        product:1,
                        Shipping:1,
                        DiscountPercentage:1,
                        DiscountedAmount:1,
                        
                        
                    }
                  },
                  {$lookup:
                    {
                        from: Ecommerce.CategoryCollection,
                        localField:"productdetails.brand",
                        foreignField:"_id",
                        as:"catdetails"
                     }
                   },
                   
        ]).toArray()
        
        resolve(orderDetails)

    })

},

addressfind:(addressId)=>{

 return new Promise (async(resolve,reject)=>{
  let adrsfind =  await db.get().collection(Ecommerce.AddressCollection).findOne({_id:objectId(addressId)})
  resolve(adrsfind)
    })
},

EditAddressLast:(addressId)=>{

    return new Promise ((resolve,reject)=>{
     db.get().collection(Ecommerce.AddressCollection).updateOne({_id:objectId(addressId._id)},{
        $set:{
            'AdDetails.CustomerName':addressId.CustomerName,
            'AdDetails.CustomerEmail':addressId.CustomerEmail,
            'AdDetails.CustomerPhone':addressId.CustomerPhone,
            'AdDetails.Address.Housename':addressId.Housename,
            'AdDetails.Address.LandMark':addressId.LandMark,
            'AdDetails.Address.Pincode':addressId.Pincode,
            'AdDetails.Address.Street':addressId.Street,
            'AdDetails.Address.City':addressId.City,
            'AdDetails.Address.State':addressId.State,
        }
     }).then(()=>{
        resolve()
     })
     
       })
   },

   DeleteAddressLast:(addressId)=>{

    return new Promise ((resolve,reject)=>{
     db.get().collection(Ecommerce.AddressCollection).deleteMany({
       
            'AdDetails.CustomerName':addressId.AdDetails.CustomerName,
            'AdDetails.CustomerEmail':addressId.AdDetails.CustomerEmail,
            'AdDetails.CustomerPhone':addressId.AdDetails.CustomerPhone,
            'AdDetails.Address.Housename':addressId.AdDetails.Address.Housename,
            'AdDetails.Address.LandMark':addressId.AdDetails.Address.LandMark,
            'AdDetails.Address.Pincode':addressId.AdDetails.Address.Pincode,
            'AdDetails.Address.Street':addressId.AdDetails.Address.Street,
            'AdDetails.Address.City':addressId.AdDetails.Address.City,
            'AdDetails.Address.State':addressId.AdDetails.Address.State,
       
     }).then((response)=>{
        
        resolve()
     })
     
       })
   },

   returnObjectStoring:(returndetails)=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(Ecommerce.ReturnCollection).insertOne(returndetails).then((response)=>{
            resolve(response)
        })
    })
   },

   adminReturnOrderfetching:()=>{
    return new Promise(async(resolve,reject)=>{
        let returnfind = await db.get().collection(Ecommerce.ReturnCollection).aggregate([
         {$lookup:
            {
                from: Ecommerce.OrderCollection,
                localField:"orderIdNew",
                foreignField:"_id",
                as:"Orderdetails"
             }
       },
       {
        $project:
        {
            orderdetails: { $arrayElemAt: [ "$Orderdetails", 0 ] }, 
            reason:1,
            proIdNew:1,      
        }
       },
       {
        $unwind:'$orderdetails.product'
       },
       {
        $match:{
            "orderdetails.product.shipping" :{
                $in:[
                    'Return-Requested','Return-Approved'
                ]
            } , 
            
           
            
        }
       },
       {$lookup:
        {
            from: Ecommerce.ProductDetailsCollection,
            localField:"orderdetails.product.item",
            foreignField:"_id",
            as:"Prodetails"
         }
       },
       {
        $project:
        {
            orderdetails: 1,
            Prodetails: { $arrayElemAt: [ "$Prodetails", 0 ] }, 
            reason:1,
            proIdNew:1,     
        }
       },
       {$lookup:
        {
            from: Ecommerce.UserDetailsCollection,
            localField:"orderdetails.userId",
            foreignField:"_id",
            as:"userDetails"
         }
       },
       {
        $project:
        {
            _id:0,
            orderdetails: 1,
            Prodetails: 1,
            proId:"$Prodetails._id",
            proIdNew:1,
            userDetails: { $arrayElemAt: [ "$userDetails", 0 ] }, 
            reason:1    
        }
       },
       {
        $match:{
           
            
            $expr: { $eq: ["$proIdNew" , "$proId"] } 
            
        }
       }
       
       
        ]).toArray()
       
        console.log(returnfind)
          resolve(returnfind)
        })
   },
   adminReturnOrderCount:()=>{
    return new Promise(async(resolve,reject)=>{
        let returnfind = await db.get().collection(Ecommerce.ReturnCollection).aggregate([
         {$lookup:
            {
                from: Ecommerce.OrderCollection,
                localField:"orderIdNew",
                foreignField:"_id",
                as:"Orderdetails"
             }
       },
       {
        $project:
        {
            orderdetails: { $arrayElemAt: [ "$Orderdetails", 0 ] }, 
            reason:1      
        }
       },
       {
        $unwind:'$orderdetails.product'
       },
       {
        $match:{
            "orderdetails.product.shipping" : 'Return-Requested'
        }
       },
       {$lookup:
        {
            from: Ecommerce.ProductDetailsCollection,
            localField:"orderdetails.product.item",
            foreignField:"_id",
            as:"Prodetails"
         }
       },
       {
        $project:
        {
            orderdetails: 1,
            Prodetails: { $arrayElemAt: [ "$Prodetails", 0 ] }, 
            reason:1      
        }
       },
       {$lookup:
        {
            from: Ecommerce.UserDetailsCollection,
            localField:"orderdetails.userId",
            foreignField:"_id",
            as:"userDetails"
         }
       },
       {
        $project:
        {
            orderdetails: 1,
            Prodetails: 1, 
            userDetails: { $arrayElemAt: [ "$userDetails", 0 ] }, 
            reason:1    
        }
       },
       {
        $count: "count"
      }
       
        ]).toArray()
             
            resolve(returnfind)
        })
   },
   getCatProductnfo:(catId)=>{
    // query = parseInt(query)
    

    // let limit = 3
    // let skip = (query-1)*limit

        return new Promise(async(resolve,reject)=>{
           

            let getProductInfomration =await db.get().collection(Ecommerce.ProductDetailsCollection).aggregate([
                {
                    $match:{
                        block:false,brand:objectId(catId)
                    }
                }, 
                {$lookup:
                    {
                        from: Ecommerce.CategoryCollection,
                        localField:"brand",
                        foreignField:"_id",
                        as:"catdetails"
                     }
             }
            ])
           
            .toArray()
            
              resolve(getProductInfomration) 
            
        })
       
    
  
},

getCatProductnfoSpecific:(cat,{_id,offerPercentage})=>{
    
    let intpercentage = parseInt(offerPercentage)
    
    // query = parseInt(query)
    

    // let limit = 3
    // let skip = (query-1)*limit

        return new Promise(async(resolve,reject)=>{
            let getProductInfomration =await db.get().collection(Ecommerce.ProductDetailsCollection).findOne({_id:cat._id})
           
            
             
              let originalPrice = parseInt(getProductInfomration.price) 
              let offerprice = originalPrice - ( Math.round(originalPrice*intpercentage/100))
              
              

               db.get().collection(Ecommerce.ProductDetailsCollection).updateOne({_id:cat._id},{$set:{price:offerprice,offerPercentage:intpercentage,original:originalPrice}}).then(()=>{
                resolve()
               })
              
            })
        
       
    
  
},

deleteofferProductnfoSpecific:(cat,_id,offerPercentage)=>{
    
    
    
    let intpercentage = parseInt(offerPercentage)
    
    // query = parseInt(query)
    

    // let limit = 3
    // let skip = (query-1)*limit

        return new Promise(async(resolve,reject)=>{
            let getProductInfomration =await db.get().collection(Ecommerce.ProductDetailsCollection).findOne({_id:cat._id})
           
            let proId = getProductInfomration._id
           
             
            let originalPrice = parseInt(getProductInfomration.original) 
            let offerprice = originalPrice - ( Math.round(originalPrice*intpercentage/100))
            
              

              db.get().collection(Ecommerce.ProductDetailsCollection).updateOne({_id:cat._id},{$unset:{price:offerprice,offerPercentage:intpercentage}}).then(()=>{
                db.get().collection(Ecommerce.ProductDetailsCollection).updateOne({_id:proId},{$rename:{original:"price"}})
                
               })
                
               
              
                
              
              
              
            })
        

},





getCatProductnfoforDiscountingOffer:({_id,offerPercentage})=>{
             let integerPerc = parseInt(offerPercentage)
   

        return new Promise(async(resolve,reject)=>{
            let getProductInfomration =await db.get().collection(Ecommerce.ProductDetailsCollection).find({brand:objectId(catId)}).
            toArray()
            
              resolve(getProductInfomration) 
            })
        
       
    
  
},
FindCatbeforeEdit:(catId)=>{
   return new Promise (async (resolve,reject)=>{
    let catfind = await db.get().collection(Ecommerce.CategoryCollection).findOne({_id:objectId(catId)})
    resolve(catfind)
   })
},

checkCatusingBrand:(body)=>{

    let obj = {}

    return new Promise (async (resolve,reject)=>{
        let catfind = await db.get().collection(Ecommerce.CategoryCollection).findOne({Brand:body.Brand,
            _id:{
              $ne:  objectId(body.id)
            }
            
        })
        if(catfind){
            obj.errMessage = "This brand is already in use"
            obj.boolean  = true
            resolve(obj)
        }else{
            db.get().collection(Ecommerce.CategoryCollection).updateOne({_id:objectId(body.id)},
           {$set: {
                Brand:body.Brand,
                img:body.img
            }
             })
            obj.successMessage = "Edited Successfully"
            obj.boolean  = false
            resolve(obj) 
        } 
        
       })
    
},

catandproductDelete:({catId})=>{

    return new Promise ((resolve,reject)=>{


        db.get().collection(Ecommerce.CategoryCollection).deleteOne({_id:objectId(catId)}).then((response)=>{
            db.get().collection(Ecommerce.ProductDetailsCollection).deleteMany({brand:objectId(catId)}).then((response)=>{
                resolve(response)
            })

        })
       })

},
deleteAccount:(id)=>{
    
    return new Promise ((resolve,reject)=>{
    db.get().collection(Ecommerce.UserDetailsCollection).deleteOne({_id:objectId(id)}).then((response)=>{
        resolve(response)
    })
})
},
getweeklysalesreportforchart:()=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(Ecommerce.OrderCollection).aggregate([
            {
               $unwind:'$product'
            },
            {
                $match:{
                    'product.shipping':{
                        $nin:['Cancelled']
                    }
                }
            },
            {$lookup:
                {
                    from: Ecommerce.ProductDetailsCollection,
                    localField:"product.item",
                    foreignField:"_id",
                    as:"prodetails"
                 }
         },{
            $project:{
                    date:1,
                   productdetails: { $arrayElemAt: [ "$prodetails", 0 ] },
                   productQty:"$product.quantity"

            }
         },{
            $project:{
                   date:1,
                   productprice:"$productdetails.price",
                   productQty:1, 

            }
         },
         {
            $addFields: {
                convertedPrice:{$toInt:"$productprice"},
                connvertedQty:{$toInt:"$productQty"}
             } 
          },
             {
                    $group :
                      {
                        _id:"$date",
                        weeklySaleAmount: { $sum: {$multiply:["$convertedPrice","$connvertedQty"]}}
                      }
             }, 
             {
                $sort:{
                    '_id': -1
                }
             },
             {
               $limit:7 
             },
             {
                $sort:{
                    '_id': 1
                }
             }
    
        ]).toArray().then((weeklysales)=>{
           

            resolve(weeklysales)
        })
    })
},
getmonthlysalesreportforchart:()=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(Ecommerce.OrderCollection).aggregate([
            {
               $unwind:'$product'
            },
            {
                $match:{
                    'product.shipping':{
                        $nin:['Cancelled']
                    }
                }
            },
            {$lookup:
                {
                    from: Ecommerce.ProductDetailsCollection,
                    localField:"product.item",
                    foreignField:"_id",
                    as:"prodetails"
                 }
         },{
            $project:{
                    monthoforder:1,
                   productdetails: { $arrayElemAt: [ "$prodetails", 0 ] },
                   productQty:"$product.quantity"

            }
         },{
            $project:{
                    monthoforder:1,
                   productprice:"$productdetails.price",
                   productQty:1, 

            }
         },
         {
            $addFields: {
                convertedPrice:{$toInt:"$productprice"},
                connvertedQty:{$toInt:"$productQty"}
             } 
          },
             {
                    $group :
                      {
                        _id : "$monthoforder",
                        MonthlySaleAmount: { $sum: {$multiply:["$convertedPrice","$connvertedQty"]}}
                      }
             }, 
             {
                $sort:{
                    '_id': -1
                }
             },
             {
               $limit:7 
             },
             {
                $sort:{
                    '_id': 1
                }
             }
    
        ]).toArray().then((monthlysales)=>{
             resolve(monthlysales)
        })
    })
},
getyearlysalesreportforchart:()=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(Ecommerce.OrderCollection).aggregate([
            {
               $unwind:'$product'
            },
            {
                $match:{
                    'product.shipping':{
                        $nin:['Cancelled']
                    }
                }
            },
            {$lookup:
                {
                    from: Ecommerce.ProductDetailsCollection,
                    localField:"product.item",
                    foreignField:"_id",
                    as:"prodetails"
                 }
         },{
            $project:{
                yearoforder:1,
                   productdetails: { $arrayElemAt: [ "$prodetails", 0 ] },
                   productQty:"$product.quantity"

            }
         },{
            $project:{
                yearoforder:1,
                   productprice:"$productdetails.price",
                   productQty:1, 

            }
         },
         {
            $addFields: {
                convertedPrice:{$toInt:"$productprice"},
                connvertedQty:{$toInt:"$productQty"}
             } 
          },
             {
                    $group :
                      {
                        _id : "$yearoforder",
                        YearlySaleAmount:{ $sum: {$multiply:["$convertedPrice","$connvertedQty"]}}
                      }
             }, 
             {
                $sort:{
                    '_id': -1
                }
             },
             {
               $limit:7 
             },
             {
                $sort:{
                    '_id': 1
                }
             }
        ]).toArray().then((yearlysales)=>{
            
            resolve(yearlysales)
        })
    })
},
addCoupon:(coupondetails)=>{
    return new Promise((resolve,reject)=>{
        let obj = {} 

        db.get().collection(Ecommerce.CouponCollection).findOne({couponName:coupondetails.couponName}).then((couponfind)=>{
            if(couponfind){
            obj.boolean = true
            obj.errMessage = "The Coupon is already Added"
                 resolve(obj)
            }else{

            
                obj.boolean = false
                obj.successMessage = "Coupon Added Successfully"
                let discount = coupondetails.Discount
                coupondetails.Discount = parseInt(discount)

                db.get().collection(Ecommerce.CouponCollection).insertOne(coupondetails).then((response)=>{
                    resolve(obj)
                })

            }

       
    })
})
},


getallCoupon:()=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(Ecommerce.CouponCollection).find().toArray().then((response)=>{
            resolve(response)
        })
    })
},

deleteCoupon:({couponId})=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(Ecommerce.CouponCollection).deleteOne({_id: objectId(couponId) }).then((response)=>{
            resolve(response)
        })
    })
},

deleteCouponSpecific:(userDetails)=>{
    
    return new Promise((resolve,reject)=>{
       

                 db.get().collection(Ecommerce.UserDetailsCollection).findOne({_id:objectId(userDetails._id)}).then((userfind)=>{

                    db.get().collection(Ecommerce.UsedCouponCollection).deleteOne({usrId: objectId(userfind._id),couponId:objectId(userfind.couponId)}).then((response)=>{
                        db.get().collection(Ecommerce.UserDetailsCollection).updateOne({_id:objectId(userfind._id)}
                        ,{$unset:{
                            couponId:userfind.couponId
                        }})
                       resolve(response)
                    })

                   

                 })               
             
          
        
    })
},
CalculateCoupon:({couponCode},grandTotal,usrId)=>{
    return new Promise((resolve,reject)=>{
        let obj = {}
        db.get().collection(Ecommerce.CouponCollection).findOne({couponName:couponCode}).then((findCoupon)=>{
           
            if(findCoupon){
                obj.findCoupon = true

                let d = new Date()
                let  month = '' + (d.getMonth() + 1)
                let day = '' + d.getDate()
                let year = d.getFullYear()



                if (month.length < 2) 
                    month = '0' + month;
                if (day.length < 2) 
                    day = '0' + day;



                 let time = [year, month, day].join('-')

                 if(time>findCoupon.ExpDate){
                    obj.expired = true
                    obj.errMessage = "Sorry, Coupon Expired"
                    resolve(obj)
                 }else{
                    obj.expired = false
                    db.get().collection(Ecommerce.UsedCouponCollection).findOne({usrId:objectId(usrId),couponId:objectId(findCoupon._id)}).then((find)=>{
                        if(find){
                            
                            obj.alredyused = true
                            obj.errMessage = "Coupon Already Used, Try Another One"
                            
                            resolve(obj)
                        }else{
                             obj.alredyused = false
                            let discountPercentage = findCoupon.Discount
                            let discountPricewillbe = (discountPercentage/100)*grandTotal
                            let TotalafterDiscount = grandTotal-discountPricewillbe
                             obj.TotalafterDiscount = TotalafterDiscount
                             obj.discountPercentage = discountPercentage
                             obj.discountPricewillbe = discountPricewillbe
                            db.get().collection(Ecommerce.UsedCouponCollection).insertOne({usrId:objectId(usrId),couponId:objectId(findCoupon._id)})
                            db.get().collection(Ecommerce.UserDetailsCollection).updateOne({_id:objectId(usrId)},
                            {$set:
                                {couponId:objectId(findCoupon._id)}}
                            )
                            resolve(obj)

                        }
                    })

                    

                 }
                
               
            }else{
                obj.findCoupon = false
                obj.errMessage = "Enter a Valid Coupon"
                resolve(obj)
            }
        })
        
    })
},

getDailysalesreportfordownload:()=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(Ecommerce.OrderCollection).aggregate([
          
           
             {
                    $group :
                      {
                        _id : "$date",
                        DailySaleAmount: { $sum: "$GrandTotal"},
                        count:{$sum:1}

                      
                      }
             }, 
             {
                $sort:{
                    '_id': -1
                }
             },{
                $limit:30
             }
             
    
        ]).toArray().then((getDailysalesreportfordownload)=>{

            console.log(getDailysalesreportfordownload)
         
             resolve(getDailysalesreportfordownload)
        })
    })
},

getMonthlysalesreportfordownload:()=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(Ecommerce.OrderCollection).aggregate([
          
           
             {
                    $group :
                      {
                        _id : "$monthoforder",
                        MonthlySaleAmount: { $sum: "$GrandTotal"},
                        count:{$sum:1}

                      
                      }
             }, 
             {
                $sort:{
                    '_id': -1
                }
             },{
                $limit:12
             }

    
        ]).toArray().then((getMonthlysalesreportfordownload)=>{
           
             resolve(getMonthlysalesreportfordownload)
        })
    })
},

getYearlysalesreportfordownload:()=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(Ecommerce.OrderCollection).aggregate([
          
           
             {
                    $group :
                      {
                        _id : "$yearoforder",
                        YearlySaleAmount: { $sum: "$GrandTotal"},
                        count:{$sum:1}

                      
                      }
             }, 
             {
                $sort:{
                    '_id': -1
                }
             },

    
        ]).toArray().then((getYearlysalesreportfordownload)=>{
           
             resolve(getYearlysalesreportfordownload)
        })
    })
},

getDailysalesreportfordownloadGrandTotal:()=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(Ecommerce.OrderCollection).aggregate([
          
           
             {
                    $group :
                      {
                        _id : "$date",
                        DailySaleAmount: { $sum: "$GrandTotal"},
                        count:{$sum:1}

                      
                      }
             }, 
             {
                $sort:{
                    '_id': -1
                }
             },{
                $limit:30
             },
              {
                $group :
                  {
                    _id : null,
                    GrandTotal: { $sum: "$DailySaleAmount"},
                    

                  
                  }
         }, 
             
    
        ]).toArray().then((getDailysalesreportfordownload)=>{

            console.log(getDailysalesreportfordownload)
         
             resolve(getDailysalesreportfordownload)
        })
    })
},

getMonthlysalesreportfordownloadGrandTotal:()=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(Ecommerce.OrderCollection).aggregate([
          
           
             {
                    $group :
                      {
                        _id : "$monthoforder",
                        MonthlySaleAmount: { $sum: "$GrandTotal"},
                        count:{$sum:1}

                      
                      }
             }, 
             {
                $sort:{
                    '_id': -1
                }
             }, {
                $limit:12
             },
             {
                $group :
                  {
                    _id : null,
                    GrandTotal: { $sum: "$MonthlySaleAmount"},
                    

                  
                  }
         },

    
        ]).toArray().then((getMonthlysalesreportfordownload)=>{
           
             resolve(getMonthlysalesreportfordownload)
        })
    })
},

getYearlysalesreportfordownloadGrandTotal:()=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(Ecommerce.OrderCollection).aggregate([
          
           
             {
                    $group :
                      {
                        _id : "$yearoforder",
                        YearlySaleAmount: { $sum: "$GrandTotal"},
                        count:{$sum:1}

                      
                      }
             }, 
             {
                $sort:{
                    '_id': -1
                }
             }, {
                $group :
                  {
                    _id : null,
                    GrandTotal: { $sum: "$YearlySaleAmount"},
                    

                  
                  }
         },

    
        ]).toArray().then((getYearlysalesreportfordownload)=>{
           
             resolve(getYearlysalesreportfordownload)
        })
    })
},

getuserCount:()=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(Ecommerce.UserDetailsCollection).find().count().then((userCount)=>{
            
            resolve(userCount)
        })
    })
},
TotalNoOfProduct:()=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(Ecommerce.ProductDetailsCollection).aggregate([
            {
                $group:{
                    _id:null,
                    TotalProduct:{$sum:"$stockleft"}
                }
            }
        ]).toArray().then((totalProduct)=>{
            resolve(totalProduct)
        })
    })
},

PaymentChart:()=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(Ecommerce.OrderCollection).aggregate([
            {$unwind:"$product"},
            {$match:{'product.shipping':{$nin:['Cancelled']}}},
            {$group:{_id:{Payment:'$CustomerPaymentMethod',object:"$_id"}}},
            {$group:{_id:"$_id.Payment",Count:{$sum:1}}}
        ]).toArray().then((payment)=>{
            
           
            
            resolve(payment)
        })
    })
},
offerAppliedBrand:()=>{
    return new Promise(async(resolve,reject)=>{
       
       let OfferApplieds = await db.get().collection(Ecommerce.CategoryCollection).find({offerApplied:true}).toArray()
         resolve(OfferApplieds)

            })
            
        
    
},

offerNotAppliedBrand:()=>{
    return new Promise(async(resolve,reject)=>{
       
       let OfferNotApplieds = await db.get().collection(Ecommerce.CategoryCollection).find({ offerApplied: { $exists: false } }).toArray()
         resolve(OfferNotApplieds)

            })
            
        
    
},

offerAppliyingToBrand:({_id,offerPercentage})=>{
    let integerPerc = parseInt(offerPercentage)
    return new Promise((resolve,reject)=>{
       
       db.get().collection(Ecommerce.CategoryCollection).updateOne({_id:objectId(_id)},{$set:{offerApplied:true,offerPercentage:integerPerc}}).then((response)=>{
        resolve(_id)
       })
  })
            
        
    
},



BrandOfferDeleting:(id,percentage)=>{
    
   
    return new Promise((resolve,reject)=>{
       
       db.get().collection(Ecommerce.CategoryCollection).updateOne({_id:objectId(id)},{$unset:{offerApplied:true,offerPercentage:percentage}}).then((response)=>{

        resolve(response)
       })
  })
            
        
    
},

searchProduct:(search)=>{
  
    return new Promise((resolve,reject)=>{
        db.get().collection(Ecommerce.ProductDetailsCollection).find({productname:{ '$regex':search, $options: 'i' }}).toArray().then((searchproduct)=>{
            resolve(searchproduct)
        })
    })
},
getProductsCount:()=>{
    return new Promise(async(resolve, reject) => {
      count= await db.get().collection(Ecommerce.ProductDetailsCollection).countDocuments()
      resolve(count)
})
},

getCartProductArrayOnly:()=>{
    


        return new Promise((resolve,reject)=>{
            db.get().collection(Ecommerce.CartCollection).aggregate([
               {
                    $project:{
                        product:1,
                        user:1
                    }
                }
            ]).toArray().then((cartProductArray)=>{
              
                resolve(cartProductArray)
            })
        })
   

},

findAllWishlist:()=>{
    return new Promise(async(resolve,reject)=>{
       let Allwishlist = await db.get().collection(Ecommerce.WishlistCollection).find().toArray()

       resolve(Allwishlist)
    })
},

filteredProducts:(filter)=>{
 
  return new Promise((resolve,reject)=>{
    let arrayfilter
    if(Array.isArray(filter.filtering)){
        arrayfilter = filter.filtering
    }else{
        arrayfilter = Object.values(filter)
    }

   
    if(arrayfilter[0]){


        let arrayfilterwihtobjectid = arrayfilter.map((element)=>{
            return objectId(element)
        })
    
       
    
        db.get().collection(Ecommerce.ProductDetailsCollection).aggregate([
            {
                $match:{
                    brand:{
                        $in:arrayfilterwihtobjectid
                    }
                }
            }, 
             {$lookup:
                {
                    from: Ecommerce.CategoryCollection,
                    localField:"brand",
                    foreignField:"_id",
                    as:"catdetails"
                 }
         }
        ]).toArray().then((filteredProduct)=>{
            
            resolve(filteredProduct)
        })
     
    }else{
           

       resolve(true)
    }


  })
}




 


} 