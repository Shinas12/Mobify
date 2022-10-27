var express = require('express');;
var router = express.Router();
var objectId=require('mongodb').ObjectId
var userHelper=require('../helpers/login-helper');
var LoginHelper= require('../helpers/user-helpers')
const paypal = require('paypal-rest-sdk');
const { ObjectId } = require('mongodb');

require('dotenv').config()

 
paypal.configure({
  'mode': 'sandbox', 
  'client_id': process.env.PayPalCliedId,
  'client_secret': process.env.PayPalSecretId
});
 





const accountSID =process.env.accountSID
const authToken =process.env.authToken
const serviceSID =process.env.serviceSID


var client = require('twilio')(accountSID,authToken)

/* GET home page. */

let errMessage
let errMessage1












let sessionHandle = (req,res,next)=>{
   
  if(req.session.userLoggedIn){
    res.redirect('/')
  }else{
    next();
  }

}

let verify = (req,res,next)=>{
  if(req.session.userLoggedIn){
    next();
  }else{
    res.redirect('/login')
  }
}



  async function paginatedResults(req, res, next) {   
    let page = parseInt(req.query.page) 
   
    const limit =3
    const startIndex = (page - 1) * limit
    const endIndex = page * limit

    const results = {}
    
  
   
   
    let productsCount=await LoginHelper.getProductsCount()
   
  if (endIndex < productsCount) {
      results.next = {
        page: page + 1,
        limit: limit
      }
    }
    
    if (startIndex > 0) {
      results.previous = {
        page: page - 1,
        limit: limit
      }
    }
    try {
      results.products = await LoginHelper.getProductnfo(limit,startIndex) 
      results.pageCount =Math.ceil(parseInt(productsCount)/parseInt(limit)).toString() 
      results.pages =Array.from({length: results.pageCount}, (_, i) => i + 1)    
      results.currentPage =page.toString()
      res.paginatedResults = results  
      next()
  
    } catch (e) {
      res.status(500).json({ message: e.message})
  }
  }


  let GotoCart=async(req,res,next)=>{
    let cartItems = await LoginHelper.getCartProductArrayOnly()
    res.CartItems = cartItems
    next()
  }
  

  let findAllWishlist=async(req,res,next)=>{
    let Wishlist = await LoginHelper.findAllWishlist()
    res.Wishlist = Wishlist
    next() 
  }








//=====================================================================================================
//home
router.get('/',GotoCart, function(req, res, next) {

 

  if(req.session.userLoggedIn){
    LoginHelper.addCategory().then((category)=>{
    LoginHelper.getcartcount(req.session.user._id).then((number)=>{ 
      LoginHelper.getProductnfofull().then((products)=>{ 
        let CartItems = res.CartItems
        let user = req.session.user._id
       
        res.render('user/index-3',{Header:true,homePage:true,userLoggedIn:req.session.userLoggedIn,number,category,cathover:true,products,CartItems,user})
       
       
      })  
      
    })
  })
 
  }else{
    LoginHelper.addCategory().then((category)=>{
      LoginHelper.getProductnfofull().then((products)=>{
        
        let CartItems = res.CartItems
       
        res.render('user/index-3',{Header:true,homePage:true,category,cathover:true,products,CartItems})
        
      
      })
  })
}
});

//=============================================================================================================





//======================================================================================
//countChangeInHome
router.post('/homecountChange',(req,res)=>{
  LoginHelper.Addtocart(req.body.proId,req.session.user._id).then((response)=>{
    console.log(response)
  })
})
//========================================================================================






//==========================================================================================================
//user SignUp router

router.get('/signup',sessionHandle, function(req, res, next) {
    res.render('user/signup',{Header:false,errMessage})
    errMessage=""
});

router.post('/signup', function(req, res, next) {
  userHelper.doSignup(req.body).then((response)=>{

    if(response.userAlreadyExist){
      errMessage = response.errMessage
      res.redirect('/signup')
    }else{
      LoginHelper.AddStatus(req.body).then((resp)=>{
        LoginHelper.getSingleUserInfo(response.id).then((user)=>{
          req.session.userLoggedIn=true
          req.session.user=user
         
         
        res.redirect('/login')
        })
        
      }) 
    }  
  }) 
});
//==============================================================================================================
















//==============================================================================================================
//user Login router

router.get('/login', sessionHandle, function(req, res, next) {
      res.render('user/login',{Header:false,errMessage})
      errMessage=""
});


router.post('/login', function(req, res, next) {
  userHelper.doLogin(req.body).then((response)=>{
    if(response.status){
      req.session.userLoggedIn=true
      req.session.user=response.user
      
      
      res.redirect('/')
    }else{
      errMessage=response.errMessage
      res.redirect('/login')
    }
    
  })
});
//=================================================================================================================

















//=================================================================================================================
//User otp router

router.get('/otp',sessionHandle, function(req, res, next) {
  res.render('user/otp',{Header:false,errMessage,errMessage1})
  errMessage=""
  errMessage1=""
});

router.post('/otp',((req,res)=>{
  req.session.mobile=req.body.number
  const mob = req.session.mobile

  LoginHelper.getOTP(req.body).then((response)=>{
    if(response.status){

    client.verify.services(serviceSID).verifications.create({to:`+91${mob}`,channel:"sms"}).then(()=>{
      res.redirect('/otplast')
    })
  }else{
    errMessage = response.err
    errMessage1 = response.err1
    res.redirect('/otp') 
  }   
  })    
})
)

router.get('/otplast',(req,res)=>{
  res.render('user/otpverify',{Header:false,errMessage})
  errMessage=""
})

router.post('/otplast',((req,res)=>{

  let otp = req.body.otp
  let mob = req.session.mobile
  client.verify.services(serviceSID).verificationChecks.create({to:`+91${mob}`,code:otp}).then(async(response)=>{
    console.log(response)
    if(response.valid){
     let otpuser = await  userHelper.doOtplogin(mob)
     req.session.user=otpuser
      req.session.userLoggedIn=true
      
     
      res.redirect('/')
    }else{
      errMessage="OTP is not matching"
      res.redirect('/otplast')
    }
   
  })

}))

router.get('/resendOtp',(req,res)=>{
  let mob = req.session.mobile
  client.verify.services(serviceSID).verifications.create({to:`+91${mob}`,channel:"sms"}).then(()=>{
    res.redirect('/otplast')
  })
})

//==============================================================================================================











//==============================================================================================================
//user Category router



router.get('/category',paginatedResults,GotoCart,findAllWishlist,function(req, res, next) {
  
  if(req.session.userLoggedIn){
  let products =res.paginatedResults.products
  let next =res.paginatedResults.next
  let previous=res.paginatedResults.previous
  let pages =res.paginatedResults.pages
  let pageCount =res.paginatedResults.pageCount
  let currentPage =res.paginatedResults.currentPage
  let CartItems = res.CartItems
  let Wish = res.Wishlist
  let user = req.session.user._id

  
  
  
  
  
  
    LoginHelper.getcartcount(user).then((number)=>{
      LoginHelper.addCategory().then((category)=>{    
        res.render('user/category',{Header:true,homePage:false,userLoggedIn:req.session.userLoggedIn,products,number,category,next,previous,pages,pageCount,currentPage,CartItems,user,Wish})
      })
 
     
      
    })

  }else{
  let products =res.paginatedResults.products
  let next =res.paginatedResults.next
  let previous=res.paginatedResults.previous
  let pages =res.paginatedResults.pages
  let pageCount =res.paginatedResults.pageCount
  let currentPage =res.paginatedResults.currentPage
  let CartItems = res.CartItems
  let Wish = res.Wishlist

  
   
      LoginHelper.addCategory().then((category)=>{
    res.render('user/category',{Header:true,homePage:false,products,category,next,previous,pages,pageCount,currentPage,CartItems,Wish})
      })
    
 
  }
});

//===============================================================================================================













//==============================================================================================================
//User ProductDetails router



router.get('/product/:id',GotoCart,findAllWishlist,function(req, res, next) {
  
   if(ObjectId.isValid(req.params.id)){

    if(req.session.userLoggedIn){

      LoginHelper.ProductView(req.params.id).then((product)=>{
        LoginHelper.getcartcount(req.session.user._id).then((number)=>{
          let CartItems = res.CartItems
          let user = req.session.user._id
          let Wish = res.Wishlist
      res.render('user/product',{Header:true,homePage:false,userLoggedIn:req.session.userLoggedIn,product,number,CartItems,user,Wish})
        })
    })
    
      }else{
    
        LoginHelper.ProductView(req.params.id).then((product)=>{  
          let CartItems = res.CartItems 
          let Wish = res.Wishlist
        res.render('user/product',{Header:true,homePage:false,product,CartItems,Wish})
          })
    
      }
   
   }else{
    res.redirect('/*')
   }
  
});


//==============================================================================================================






 
 

//===============================================================================================================
//user cart handle router
router.get('/cart',verify,(req,res)=>{

  

  
  if(ObjectId.isValid(req.query.orderId)){

    LoginHelper.Addtocart(req.query.orderId,req.session.user._id).then((response)=>{
      res.redirect('/cartview')
    })

  }else{
    res.redirect('/*')
  }
  
  
})

router.get('/cartview',verify,(req,res)=>{
  console.log(req)
  LoginHelper.ViewCart(req.session.user._id).then(async (product)=>{
    let totalValue = await LoginHelper.grandTotal(req.session.user._id)
    if (totalValue[0]){
      let total = totalValue[0].grandtotal
      LoginHelper.ViewCartDiscount(req.session.user._id,total).then((discount)=>{
        if(discount[0]){
          res.render('user/cart',{Header:true,homePage:false,userLoggedIn:req.session.userLoggedIn,product,total,discount})
        }else{
          res.render('user/cart',{Header:true,homePage:false,userLoggedIn:req.session.userLoggedIn,product,total})
        }
        
      })
      
    }else{
      res.render('user/cart',{Header:true,homePage:false,userLoggedIn:req.session.userLoggedIn,product})
    }
    
   
  })
 
})

//===============================================================================================================












//===============================================================================================================
//user checkout router
router.get('/checkout',verify,(req,res)=>{

  LoginHelper.getcartcount(req.session.user._id).then((number)=>{
     
    if(number>0){

    
          LoginHelper.ViewCart(req.session.user._id).then(async (product)=>{
            let totalValue = await LoginHelper.grandTotal(req.session.user._id)
            if(totalValue[0]){
              
            let total = totalValue[0].grandtotal
            LoginHelper.ViewCartDiscount(req.session.user._id,total).then((discount)=>{
              if(discount[0].TotalAfterDiscount){

                LoginHelper.getAddress(req.session.user._id).then((adrs)=>{
                  LoginHelper.getMoreAddress(req.session.user._id).then((adrsMore)=>{
                    res.render('user/checkout',{Header:true,homePage:false,userLoggedIn:req.session.userLoggedIn,product,discount,total,user:req.session.user,adrs,AcaStyle:true,adrsMore})
                  })
              
                })

              }else{

                LoginHelper.getAddress(req.session.user._id).then((adrs)=>{
                  LoginHelper.getMoreAddress(req.session.user._id).then((adrsMore)=>{
                    res.render('user/checkout',{Header:true,homePage:false,userLoggedIn:req.session.userLoggedIn,product,total,user:req.session.user,adrs,AcaStyle:true,adrsMore})
                  })
              
                })

              }
            })
          
            }
          }) 
        }else{
          res.redirect('/category')
        }
      })
})

router.get('/continueshopping',verify,(req,res)=>{
  res.redirect('/category')
})
//================================================================================================================


 




//==================================================================================================================
//user remove cart item router(not completed)

router.post('/removeProduct/',verify,(req,res)=>{
  LoginHelper.removeCart(req.body).then((response)=>{
    res.json(response)
  }) 
})
//==================================================================================================================







//==================================================================================================================
//producnt count increase
router.post('/productCount',(req,res)=>{
  let obj={}
  console.log(req.body)
  LoginHelper.productCountChange(req.body).then( async (response)=>{
  
    obj.response=response
    obj.totalValue = await LoginHelper.grandTotal(req.body.user)

    LoginHelper.ViewCartDiscount(req.session.user._id,obj.totalValue[0].grandtotal).then((cartDiscount)=>{
      obj.cartDiscnt = cartDiscount
      res.json(obj)
    })

    
    
  }) 
})
//==================================================================================================================











//==================================================================================================================
//checkOut orderSuccess router
router.post('/ordersuccess', (req,res)=>{
 
  
 LoginHelper.CartDetailsforOrders(req.body.userId).then((cartdetails)=>{
  LoginHelper.grandTotal(req.body.userId).then((grandtotal)=>{
    LoginHelper.ViewCartDiscount(req.session.user._id,grandtotal[0].grandtotal).then((Discount)=>{

      LoginHelper.Orderdetails(req.body,cartdetails,grandtotal,Discount).then((objct)=>{

        if(objct.proId){
          let prId =  objct.proId
          
          prId.forEach((element) => {
             LoginHelper.productStockDecrement(element)    
        });
      }
       
    
         if(req.body.paymentMethod === "cod"){
    
          res.json({codsuccess:true})
    
         }else if(req.body.paymentMethod === "RazorPay"){

          LoginHelper.ViewCartDiscount(req.session.user._id,grandtotal[0].grandtotal).then((discount)=>{

            LoginHelper.getRazorPay(objct.id,grandtotal,discount).then((response)=>{
    
              res.json({RazSuccess:true,response})
               
       
              })

          })
          
       
         }else{
          res.json({paypal:true,objct})
         }
         
    
        })

    })
   
  }) 
 
 })
 
}) 

router.post('/verifyPayment',(req,res)=>{
 LoginHelper.verifypayment(req.body).then((response)=>{
  console.log(req.body)
  LoginHelper.changePaymentStatus(req.body['order[receipt]']).then(()=>{
    res.json({status:true})
  })
 }).catch((err)=>{
  res.json({status:false,err:"payment Failed"})
 })
})


router.post('/verifyPaymentOnceMore',(req,res)=>{
  LoginHelper.PaymentSuccessParty(req.body['order[receipt]'],req.session.user._id).then((prId)=>{ 

    
   

      prId.forEach((element) => {
        LoginHelper.productStockDecrement(element) 
        LoginHelper.ChangeOrderStatusAfterOnlinePayment(req.body['order[receipt]'],element)  
     });
      res.json(prId)
         

  })
})

//==================================================================================================================









//==================================================================================================================
//Order details router
router.get('/orderDetails',verify,(req,res)=>{
   LoginHelper.OrderSummaryDetails(req.session.user._id).then((orderDetails)=>{
    LoginHelper.OrderSummaryDetailsGrandTotal(req.session.user._id).then((ordergrandTotal)=>{
     
      orderDetails.forEach(element => {
        if(element.product.shipping === 'Cancelled'){
           element.cancelled = true
        }else{ 
          element.cancelled = false
        }

        if(element.product.shipping === 'Delivered'){
          element.Delivered = true
       }else{
         element.Delivered = false
       }

      if(element.product.shipping === 'Return-Approved' ||element.product.shipping ===  'Return-Requested' || element.product.shipping ===  'Refund-Completed'){
        element.Return = true
     }else{
       element.Return = false
     }
      });

      
      if(ordergrandTotal[0]){
       
        let OgrandTot  = ordergrandTotal[0].grandtotal
    
        res.render('user/order',{Header:true,homePage:false,userLoggedIn:req.session.userLoggedIn,orderDetails,OgrandTot})
      }else{
        res.render('user/order',{Header:true,homePage:false,userLoggedIn:req.session.userLoggedIn,orderDetails})
      }
      
      
    })
   
   })
})


router.get('/returnProduct',verify,(req,res)=>{
  req.session.return = req.query
  console.log(req.session.return)
   res.redirect('/returnProductagain')
})


router.get('/returnProductagain',verify,(req,res)=>{
  LoginHelper.specificproductdetails(req.session.return).then((orderdetails)=>{
   
    res.render('user/returnform',{Header:true,homePage:false,userLoggedIn:req.session.userLoggedIn,orderdetails})
  })
})

router.post('/userorderStatus',(req,res)=>{
  console.log(req.body)
  req.body.orderIdNew = objectId(req.body.orderId)
  req.body.proIdNew = objectId(req.body.proId)
  LoginHelper.returnObjectStoring(req.body).then((response)=>{
  delete req.body.reason
  delete req.body.orderIdNew
  delete req.body.proIdNew
  LoginHelper.ChangeOrderStatus(req.body).then((response)=>{
    console.log(response)
    res.redirect('/orderDetails')
  })
})
}) 


router.post('/productIncrement',(req,res)=>{
  LoginHelper.productStockIncrement(req.body)
})

//==================================================================================================================








//=====================================================================================================================
//Wish list router

router.get('/wishlist',verify,(req,res)=>{

   LoginHelper.Wishlist(req.query.id,req.session.user._id).then((response)=>{
   res.json(response)
})
}) 


router.get('/wishlistView',verify,(req,res)=>{
 LoginHelper.wishlistdeatis(req.session.user._id).then((response)=>{
  
  res.render('user/wishlist',{Header:true,homePage:false,userLoggedIn:req.session.userLoggedIn,response})
 })

})



router.get('/wishlistremove',verify,(req,res)=>{

  if(ObjectId.isValid(req.query.proId)){
    LoginHelper.Wishlistremove(req.query.proId,req.session.user._id).then((response)=>{
      res.redirect('/wishlistView') 
    }) 
  }else{
    res.redirect("/*")
  }
  
  
})
//======================================================================================================================











//=====================================================================================================================
//user my account router
router.get('/myaccount',verify,(req,res)=>{

  res.render('user/myaccount',{Header:true,homePage:false,userLoggedIn:req.session.userLoggedIn})
})
//=====================================================================================================================








//==========================================================================================================================
//select category router  



router.get('/categoryselect',(req,res)=>{
  if(ObjectId.isValid(req.query.category)){

    if(req.session.userLoggedIn){

      LoginHelper.getCatProductnfo(req.query.category).then((products)=>{
        LoginHelper.getcartcount(req.session.user._id).then((number)=>{
          LoginHelper.addCategory().then((category)=>{    
            res.render('user/category',{Header:true,homePage:false,userLoggedIn:req.session.userLoggedIn,products,number,category})
          })
     
         
        })
    })
      }else{
        LoginHelper.getCatProductnfo(req.query.category).then((products)=>{ 
          LoginHelper.addCategory().then((category)=>{
        res.render('user/category',{Header:true,homePage:false,products,category})
          })
        
      })
      } 

  }else{
     res.redirect("/*")
  }
  
})




//==========================================================================================================================








//=======================================================================================================================
//user password Change router
router.get('/changepassword',verify,(req,res)=>{
  res.render('user/changepassword',{Header:true,homePage:false,userLoggedIn:req.session.userLoggedIn,errMessage})
  errMessage = ""
})


router.post('/changepassword',(req,res)=>{
  let p = req.body.password
  let np = req.body.newpass

  LoginHelper.changePassword(p,np,req.session.user._id).then((response)=>{
    if(response.check){
       res.redirect('/myaccount')
    }else{ 
      errMessage = response.errmessage 
      res.redirect('/changepassword')
    }
  })
  
})
//=======================================================================================================================







//========================================================================================================================
//user Editdetails router
router.get('/userEdit',verify,(req,res)=>{
  LoginHelper.getUserInfoforEdit(req.session.user._id).then((user)=>{
    console.log(user)
    res.render('user/userEdit',{Header:true,homePage:false,userLoggedIn:req.session.userLoggedIn,errMessage,user})
    errMessage=""
  })
 
})


router.post('/saveChanges',(req,res)=>{
  req.body._id = req.session.user._id
  LoginHelper.getUserInfoforChecking(req.body).then((response)=>{
    if(response.boolean){
     errMessage = response.errMessage
     res.redirect('/userEdit')
    }else{
      res.redirect('/myaccount')
    }
  })
  
})
//========================================================================================================================











//===============================================================================================================================
//user address router
router.get('/addressadd',(req,res)=>{
  res.render('user/addressadd',{Header:true,homePage:false,userLoggedIn:req.session.userLoggedIn})
})


router.post('/filladdress',(req,res)=>{
  console.log(req.body)

  LoginHelper.getAddressforfilling(req.session.user._id,req.body.Customer,req.body.Housename).then((address)=>{
    console.log(address)
    res.json(address)
  })
})

 

router.get('/addressManagement',verify,(req,res)=>{
  LoginHelper.getMoreAddress(req.session.user._id).then((adrs)=>{
  res.render('user/addressadd',{Header:true,homePage:false,userLoggedIn:req.session.userLoggedIn,adrs,AddrssStyle:true})
  })
})




router.post('/deleteAddress',(req,res)=>{
  console.log(req.body)
  req.body.usrId=req.session.user._id
  console.log(req.body)
  LoginHelper.deleteAddress(req.body).then((resolve)=>{
    res.json(resolve)
  })

})

router.post('/EditAddress',(req,res)=>{
  
  req.body.usrId=req.session.user._id
  
  LoginHelper.EditAddress(req.body).then((resolve)=>{
    res.json(resolve)
  })

})



router.get('/EditAddressPage',verify,(req,res)=>{
   req.session.addressid = req.query.orderId
   res.redirect('/EditAddressPages')
})

router.get('/EditAddressPages',verify,(req,res)=>{
  LoginHelper.addressfind(req.session.addressid).then((addrss)=>{
    req.session.addrsfordeleteafteredit = addrss
    res.render('user/EditaddressPage',{Header:true,homePage:false,userLoggedIn:req.session.userLoggedIn,addrss})
   })
})

router.post('/AddresssaveChanges',(req,res)=>{
 LoginHelper.EditAddressLast(req.body).then(()=>{
   LoginHelper.DeleteAddressLast(req.session.addrsfordeleteafteredit).then((response)=>{
    res.redirect('/addressManagement')
   })
 })
})


//===============================================================================================================================








//=================================================================================================================================
//order Paypal router


router.post('/paypalorderdetailsfetch',(req,res)=>{
  LoginHelper.getOrderdetailsUsingId(req.body.orderId).then((orderdetails)=>{
    res.json(orderdetails)
  })
})



router.post('/p', (req, res) => {
 let orderId =  req.body['name[0][_id]']
 console.log(orderId)
 console.log(req.body['name[0][_id]'])

  const create_payment_json = {
    "intent": "sale",
    "payer": {
        "payment_method": "paypal"
    },
    "redirect_urls": {
        "return_url": "http://localhost:3000/success?orderID="+orderId,
        "cancel_url": "http://localhost:3000/cancel"
    },
    "transactions": [{
        "item_list": {
            "items": [{
                "name": "shinas",
                "sku": "001",
                "price": "25.00",
                "currency": "USD",
                "quantity": 1
            }]
        },
        "amount": {
            "currency": "USD",
            "total": "25.00"
        },
        "description": "Hat for the best team ever"
    }]
};

paypal.payment.create(create_payment_json, function (error, payment) {
  if (error) {
      throw error;
  } else {
      for(let i = 0;i < payment.links.length;i++){
        if(payment.links[i].rel === 'approval_url'){
          res.json(payment.links[i].href);
        }
      }
  }
});

});


router.get('/success',verify, (req, res) => {

 
 
  let ordrId =req.query.orderID
 
 
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;

  const execute_payment_json = {
    "payer_id": payerId,
    "transactions": [{
        "amount": {
            "currency": "USD",
            "total": "25.00"
        }
    }]
  };

  paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
    if (error) {
        console.log(error.response);
        throw error;
    } else {
        console.log(JSON.stringify(payment));
        LoginHelper.PaymentSuccessParty(ordrId,req.session.user._id).then((proId)=>{

          LoginHelper.changePaymentStatus(ordrId).then((response)=>{

            proId.forEach((element) => {
              LoginHelper.productStockDecrement(element) 
              LoginHelper.ChangeOrderStatusAfterOnlinePayment(ordrId,element)  
           });

          })

         

         res.redirect('/orderDetails')

        })
    }
});
});

router.get('/cancel', (req, res) => {
   res.send('Cancelled')
  });

//=====================================================================================================================================



//==============================================================================================
//coupon router


router.post('/couponcalculateroute',(req,res)=>{
  LoginHelper.grandTotal(req.session.user._id).then((grandTotal)=>{
    LoginHelper.CalculateCoupon(req.body,grandTotal[0].grandtotal,req.session.user._id).then((obj)=>{
      res.json(obj)
    })
  })
})

router.get('/deleteCoupon',verify,(req,res)=>{
  LoginHelper.deleteCouponSpecific(req.session.user).then((response)=>{
    res.redirect('/cartview')
  })
})
//===================================================================================================









//=====================================================================================================
//search router
router.get('/search',(req,res)=>{
  
  LoginHelper.searchProduct(req.query.search).then((searchedProducts)=>{
    res.json("its calling")
  })
})
//=====================================================================================================





//=================================================
//search router
router.post('/getProductDetails',(req,res)=>{
  let search = req.body.payload.trim()
  console.log(search)
  LoginHelper.searchProduct(search).then((searchProduct)=>{
    res.send({payload:searchProduct})
  })
})
//==================================================




//=====================================================================
//filter router


router.post('/filteredProduct',findAllWishlist,GotoCart,(req,res)=>{

  
 

 
 


  if(req.session.userLoggedIn){
    // let products =res.paginatedResults.products
    // let next =res.paginatedResults.next
    // let previous=res.paginatedResults.previous
    // let pages =res.paginatedResults.pages
    // let pageCount =res.paginatedResults.pageCount
    // let currentPage =res.paginatedResults.currentPage
    let CartItems = res.CartItems
    let Wish = res.Wishlist
    let user = req.session.user._id

   
    
    
    
    
    
      LoginHelper.getcartcount(user).then((number)=>{
        LoginHelper.addCategory().then((category)=>{    
          LoginHelper.filteredProducts(req.body).then((filteredProduct)=>{
            if(filteredProduct == true){
                res.redirect('/category')
            }else{
              res.render('user/filteredProduct',{Header:true,homePage:false,userLoggedIn:req.session.userLoggedIn,number,category,CartItems,user,Wish,filteredProduct})
            }
          
        })
      })
   
       
      })
  
    }else{
    // let products =res.paginatedResults.products
    // let next =res.paginatedResults.next
    // let previous=res.paginatedResults.previous
    // let pages =res.paginatedResults.pages
    // let pageCount =res.paginatedResults.pageCount
    // let currentPage =res.paginatedResults.currentPage
    let CartItems = res.CartItems
    let Wish = res.Wishlist
  
    
     
        LoginHelper.addCategory().then((category)=>{
          LoginHelper.filteredProducts(req.body).then((filteredProduct)=>{
            if(filteredProduct == true){
              res.redirect('/category')
            }else{
              res.render('user/filteredProduct',{Header:true,homePage:false,category,CartItems,Wish,filteredProduct})
            }

        })
      })
      
   
    }



  

 
})
//====================================================================


//==============================================================================================================
//User Logout router

router.get('/logout', function(req, res, next) {
  req.session.userLoggedIn=false 
  res.redirect('/')
});

//==============================================================================================================







 //===============================================================================================================
 //delete account
 router.delete('/deleteAccount',verify,(req,res)=>{

  LoginHelper.deleteAccount(req.session.user._id).then((response)=>{
  
    req.session.userLoggedIn=false
   
   
    res.json(response)
  })

 })
 //==============================================================================================================







module.exports = router;
