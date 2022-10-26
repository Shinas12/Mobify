
var express = require('express');
var router = express.Router();
var adminHelper =require('../helpers/user-helpers');
const{upload}= require('../public/javascripts/fileupload')
require('dotenv').config()




const accountSID =process.env.accountSID
const authToken =process.env.authToken
const serviceSID =process.env.serviceSID


var client = require('twilio')(accountSID,authToken)


  


/* GET users listing. */

const credential={
  email:process.env.email,
  password :process.env.password,
  number : process.env.number
}



let id
let errMessage
let specificordersdetails
let successMessage

let adminlogin = (req,res,next)=>{
  if(req.session.admin){
    next()
  }else{
    res.redirect('/admin')
  }
}





//============================================================================================================
//admin home page
router.get('/', function(req, res, next) {
  if(req.session.admin){
     res.redirect('/admin/home')
  }else{
    
    res.render('admin/login',{Header:false,errMessage,adminlogin:false})
  errMessage=""
  }
  
});
//============================================================================================================












//===============================================================================================================
//Admin email and password checking 
router.post('/login',((req,res)=>{
  console.log(req.body);
  if(credential.email==req.body.email){

    if(credential.password==req.body.password){
      req.session.admin=true
      res.redirect('/admin/home')
    }else{
      console.log('password incorrect')
      errMessage="password Incorrect"
      res.redirect('/admin')
    }

  }else{
    console.log('email incorrect')
    errMessage="email incorrect"
    res.redirect('/admin')
  }

})
)
//===================================================================================================================












//=====================================================================================================================
//admin home page 

router.get('/home',adminlogin, function(req, res, next) {
  adminHelper.adminReturnOrderCount().then((count)=>{
    if(count[0]){
      adminHelper.getweeklysalesreportforchart().then((weeklysales)=>{
        adminHelper.getmonthlysalesreportforchart().then((monthlysales)=>{
          adminHelper.getyearlysalesreportforchart().then((yearlysales)=>{
            adminHelper.getuserCount().then((usercount)=>{
              adminHelper.TotalNoOfProduct().then((totalProduct)=>{
                adminHelper.PaymentChart().then((PaymentChart)=>{
                 
                  res.render('admin/index',{Header:false,adminlogin:true,count,weeklysales,monthlysales,yearlysales,usercount,totalProduct,PaymentChart})
                })
                

              })


            })
            
          })
        })
      })
      
    }else{
      adminHelper.getweeklysalesreportforchart().then((weeklysales)=>{
        adminHelper.getmonthlysalesreportforchart().then((monthlysales)=>{
          adminHelper.getyearlysalesreportforchart().then((yearlysales)=>{
            adminHelper.getuserCount().then((usercount)=>{
              adminHelper.TotalNoOfProduct().then((totalProduct)=>{
                adminHelper.PaymentChart().then((PaymentChart)=>{
                 
                res.render('admin/index',{Header:false,adminlogin:true,weeklysales,monthlysales,yearlysales,usercount,totalProduct,PaymentChart})
              })
              })
            
          })
          })
        })
      })
    }
    
  })
  
});

//======================================================================================================================













//=======================================================================================================================
//admin otp handle
router.get('/otp',adminlogin, function(req, res, next) {
  res.render('admin/otp',{errMessage,Header:false,adminlogin:false})
  errMessage=""
});

router.post('/otp',((req,res)=>{
  if(credential.number==req.body.number){
    let mob= credential.number
    
      client.verify.services(serviceSID).verifications.create({to:`+91${mob}`,channel:"sms"}).then(()=>{
      res.render('admin/otpverify',{Header:false,adminlogin:false})
      
  })
   }else{
    errMessage="invalid number"
    res.redirect('/admin/otp')
   }
  
})
)

router.get('/otplast',adminlogin,(req,res)=>{
  res.render('admin/otpverify',{Header:false,errMessage,adminlogin:false})
  errMessage=""
})

router.post('/otplast',((req,res)=>{
  let otp =req.body.otp
  let mob = credential.number

  client.verify.services(serviceSID).verificationChecks.create({to:`+91${mob}`,code:otp}).then((response)=>{
    console.log(response)
    if(response.valid){
      console.log("how are you da")
      req.session.admin=true
      res.redirect('/admin')
    }else{
      errMessage="OTP is not matching"
      res.redirect('/admin/otplast')
    }
   
  })
  

  res.redirect('/admin/home')
})
)
//========================================================================================================================












//=========================================================================================================================
//admin product handle
router.get('/product',((req,res)=>{
  if(req.session.admin){
    adminHelper.getProductnfofull().then((getProductInfomration)=>{
      res.render('admin/product',{Header:false,adminlogin:true,getProductInfomration})
    })
  }else{
    res.redirect('/admin')
  }
 
})
)


router.get('/addproduct',adminlogin,(req,res)=>{
  adminHelper.addCategory().then((category)=>{
    res.render('admin/addproducts',{Header:false,adminlogin:true,category})
  })
  
})

router.post('/addproduct',upload.array('image'),(req,res)=>{

  const files = req.files

  const fileName = files.map((file)=>{
      return file.filename
  })
  const product = req.body
  product.img = fileName

 
  adminHelper.Addproduct(product).then((id)=>{
  
    adminHelper.UnblockProduct(id).then((response)=>{
      adminHelper.ProductCount(id).then((response)=>{
        res.redirect('/admin/product')
      })
      
    })
    
  })
})
//=========================================================================================================================










//=========================================================================================================================
//admin userDetails
router.get('/userDetails',adminlogin,((req,res)=>{
  if(req.session.admin){
    adminHelper.getUserInfo().then((getUserInfomration)=>{
      res.render('admin/userDetails',{Header:false,adminlogin:true,getUserInfomration})
    }) 
  }else{
    res.redirect('/admin')
  } 
})
)
//=========================================================================================================================












//==========================================================================================================================
//blocking user router
router.get('/block/:id',adminlogin,(req,res)=>{
  let id = req.params.id
  adminHelper.blockUser(id).then((response)=>{
    res.redirect('/admin/userDetails')
  })
})
//===========================================================================================================================









//==========================================================================================================================
//unblocking user router
router.get('/unblock/:id',adminlogin,(req,res)=>{
  let id = req.params.id
  adminHelper.unBlockUser(id).then((response)=>{
    res.redirect('/admin/userDetails')
  })
})
//===========================================================================================================================






//==========================================================================================================================
//Delete product router
router.get('/delete-user/:id',adminlogin,(req,res)=>{
   id = req.params.id
  adminHelper.deleteProduct(id).then((response)=>{
    res.redirect('/admin/product')
  })
  
})
//=========================================================================================================================











//======================================================================================================================
//Edit Product router
router.get('/edit-user/:id',adminlogin,(req,res)=>{
  id = req.params.id
 res.redirect('/admin/edit')
 
})

router.get('/edit',adminlogin,(req,res)=>{
  adminHelper.getProductForEdit(id).then((product)=>{
    adminHelper.addCategory().then((category)=>{
      res.render('admin/editproduct',{Header:false,adminlogin:true,product,category})
    })
   
  })
})

router.post('/edit-Stock',(req,res)=>{
  adminHelper.updateproductOnlyStock(req.body).then(()=>{
    res.redirect('/admin/product')
})
})
 





router.post('/updateProduct',upload.array('image'),(req,res)=>{
  adminHelper.getProductForEdit(id).then((products)=>{

    if(req.files!=0){

    var files = req.files

  var file = files.map((file)=>{
      return file
  })
 
  var fileName = file.map((file)=>{
      return file.filename
  })

  var product = req.body
  product.img = fileName

    }else{
     
      var product = req.body
      product.img = products.img
     
    }

    adminHelper.updateproduct(id,product).then((response)=>{
      res.redirect('/admin/product')
    })
 
  })


})


//=======================================================================================================================















//======================================================================================================================
// block product router
router.get('/block-user/:id',adminlogin,(req,res)=>{
  id =req.params.id
  adminHelper.blockProduct(id).then((response)=>{
    res.redirect('/admin/product')
  })
})
//=======================================================================================================================








//======================================================================================================================
// unblock product router
router.get('/unblock-user/:id',adminlogin,(req,res)=>{
  id =req.params.id
  adminHelper.UnblockProduct(id).then((response)=>{
    res.redirect('/admin/product')
  })
})
//=======================================================================================================================







//====================================================================================================
//admin order router
router.get('/orders',adminlogin,(req,res)=>{
  adminHelper.AdminOrderSummaryDetails().then((AdminorderSummarry)=>{
    res.render('admin/orderDetails',{Header:false,adminlogin:true,AdminorderSummarry})
  })
 
})

router.get('/vieworders',adminlogin,(req,res)=>{
  adminHelper.getOrderdetailsAll().then((allorders)=>{
    res.render('admin/viewOrders',{Header:false,adminlogin:true,order:true,allorders})
  })
  })


  router.get('/detailedorderstatus',adminlogin,(req,res)=>{
    req.session.queryId = req.query.orderid
     res.redirect('/admin/detailedorderstat')
  })



  router.get('/detailedorderstat',adminlogin,(req,res)=>{
    adminHelper.OrderSummaryDetailsusingOrderId(req.session.queryId).then((product)=>{
     
    
      product.forEach(element => {
        if(element.product.shipping === 'Cancelled' || element.product.shipping ===  'Refund-Completed' ||  element.product.shipping ===  'Return-Requested'  ){
          element.cancelled = true;
        }else{
          element.cancelled = false
        }

        if( element.product.shipping === 'Return-Approved'){
          element.Return = true
       }else{
         element.Return = false
       }
      });
      
    
      
      adminHelper.getOrderdetailsUsingId(req.session.queryId).then((order)=>{
        res.render('admin/productdisplayorder',{Header:false,adminlogin:true,product,order})
      })
      
      
    })

  })
  
//====================================================================================================






//===================================================================================================
//admin order ViewMore details
router.get('/viewMore/:id',adminlogin,(req,res)=>{
  id = req.params.id
  res.redirect('/admin/viewMoreDetails')
})

router.get('/viewMoreDetails',adminlogin,(req,res)=>{
  adminHelper.AdminOrderSummaryDetails().then((AdminorderSummarryOneUser)=>{
    console.log(AdminorderSummarryOneUser)
    res.render('admin/viewMoreDetails',{Header:false,adminlogin:true,AdminorderSummarryOneUser})
  })
 
})
//==================================================================================================


 






//=========================================================================================================
//admin change OrderStatus
router.post('/orderStatus',(req,res)=>{
   adminHelper.ChangeOrderStatus(req.body).then(()=>{
    res.json("how are you")
   })
}) 
//=========================================================================================================





//=========================================================================================================
//admin Category management router
router.get('/seecategories',adminlogin,(req,res)=>{
  adminHelper.addCategory().then((category)=>{
  res.render('admin/seecategory',{Header:false,adminlogin:true,category})
  })  
})




router.get('/categoryManagement',adminlogin,(req,res)=>{
  res.render('admin/categoryManagement',{Header:false,adminlogin:true,errMessage,successMessage})
  errMessage = ""
  successMessage= ""
  
})


router.post('/categoryadd',upload.any('image'),(req,res)=>{

  const files = req.files

  const file = files.map((file)=>{
      return file
  })
 
  const fileName = file.map((file)=>{
      return file.filename
  })
  const product = req.body
  product.img = fileName

  adminHelper.categoryManagement(product).then((brandfind)=>{
     if(brandfind){
      errMessage = "Category Already Added"
      res.redirect('/admin/categoryManagement')   
     }else{
      successMessage = "Category Added Successfully"
      res.redirect('/admin/categoryManagement')
     }
  })
})

router.get('/edit-brand',(req,res)=>{
  adminHelper.FindCatbeforeEdit(req.query.catId).then((catfind)=>{
    res.render('admin/editCategories',{Header:false,adminlogin:true,errMessage,successMessage,catfind})
    errMessage = ""
    successMessage = ""
  })
  
})


router.post('/edit-brand',upload.any('image'),(req,res)=>{
  console.log("req.body")
  console.log(req.body)
  console.log('===================================================================')

  const files = req.files

  console.log('req.files')
  console.log(req.files)
  console.log('===================================================================')

  const file = files.map((file)=>{
      return file
  })

  console.log('file')
  console.log(file)
  console.log('===================================================================')
 
  const fileName = file.map((file)=>{
      return file.filename
  })

  console.log('fileName')
  console.log(fileName)
  console.log('===================================================================')


  const product = req.body
  product.img = fileName

  console.log('product')
  console.log(product)
  console.log('===================================================================')

    adminHelper.checkCatusingBrand(product).then((obj)=>{
      if(obj.boolean){
            errMessage = obj.errMessage
           res.redirect('/admin/edit-brand/?catId='+product.id)
      }else{
        successMessage = obj.successMessage
        res.redirect('/admin/edit-brand/?catId='+product.id)
      }
    })

})


router.delete('/deleteCat',(req,res)=>{
  console.log('--------------------------------------------------------------------------')
  console.log(req.body)
  adminHelper.catandproductDelete(req.body).then((response)=>{
    res.json(response)
  })
})

//=========================================================================================================







//==================================================================================================================
//return router
router.get('/returnAlert',adminlogin,(req,res)=>{
  adminHelper.adminReturnOrderfetching().then((returndetails)=>{

    returndetails.forEach(element => {
      if(element.orderdetails.product.shipping == 'Return-Approved'){
           element.boolean = false
      }else{
            element.boolean = true
      }
    });

  

    res.render('admin/returnPage',{Header:false,adminlogin:true,return:true,returndetails})
  })

  
}) 

router.post('/returnconfirmed',(req,res)=>{
  console.log(req.body)
  adminHelper.ChangeOrderStatus(req.body).then((response)=>{
    res.redirect('/admin/returnAlert')
  })
})
//=================================================================================================================






//===========================================================================================================================
//admin logout router

router.get('/logout',(req,res)=>{
  req.session.admin=false;
  res.redirect('/admin')
})
//===========================================================================================================================



router.get('/testing',(req,res)=>{
   adminHelper.AdminOrderSummaryDetails().then((AdminorderSummarry)=>{
    

    AdminorderSummarry.forEach(element => {
      if(element.product.shipping === 'Cancelled'||  element.product.shipping ===  'Refund-Completed' || element.product.shipping === 'Return-Requested'  ){
        element.cancelled = true;
      }else{
        element.cancelled = false
      }

      if(  element.product.shipping === 'Return-Approved' ){
        element.Return = true
     }else{
       element.Return = false
     }
    });


   res.render('admin/testing',{AdminorderSummarry,Header:false,adminlogin:true})
  
  })
})





//testing
router.get('/viewtesting',adminlogin,(req,res)=>{
  res.render('admin/ordertesting',{Header:false,adminlogin:true,vieworder:true})
})


router.get('/grouporders',adminlogin,(req,res)=>{
  adminHelper.groupOrders().then((groupOrdersuserId)=>{
        res.render('admin/ordergrpbyUser',{Header:false,adminlogin:true,groupOrdersuserId,admincss:true})
      
    
  })

})

router.get('/getuserfullOrder/:id',adminlogin,(req,res)=>{ 
  req.session.adminusercheck = req.params.id
  res.redirect('/admin/getuserfullOrders')
  
})

router.get('/getuserfullOrders',adminlogin,(req,res)=>{
  adminHelper.findOrder(req.session.adminusercheck).then((orderdetails)=>{
    res.render('admin/getuserfullOrder',{Header:false,adminlogin:true,admincss2:true,orderdetails})
  })

})



router.post('/redirectspecificproductdetails',adminlogin,(req,res)=>{
  console.log(req.body)
  adminHelper.specificproductdetails(req.body).then((obj)=>{
   specificordersdetails = obj;
   res.json(obj)  
  })
})

router.get('/redirectspecificproductdetail',adminlogin,(req,res)=>{
  
  if(specificordersdetails[0].product.shipping === 'Cancelled'  || specificordersdetails[0].product.shipping ===  'Refund-Completed' || specificordersdetails[0].product.shipping ===  'Return-Requested'){
    specificordersdetails[0].cancelled = true
  }else{
    specificordersdetails[0].cancelled = false
  }

  if(  specificordersdetails[0].product.shipping === 'Return-Approved' ){
    specificordersdetails[0].Return = true
 }else{
    specificordersdetails[0].Return = false
 }
  res.render('admin/specificordersdetails',{Header:false,adminlogin:true,specificordersdetails})
})






//====================================================================================================
//sales report router
router.get('/SalesReport',adminlogin,(req,res)=>{
  adminHelper.getDailysalesreportfordownload().then((DailySalesforDownload)=>{
    adminHelper.getMonthlysalesreportfordownload().then((MonthlySalesforDownload)=>{
      adminHelper.getYearlysalesreportfordownload().then((YearlySalesforDownload)=>{
        adminHelper.getDailysalesreportfordownloadGrandTotal().then((totalDaily)=>{
         adminHelper.getMonthlysalesreportfordownloadGrandTotal().then((monthtotal)=>{
          adminHelper.getYearlysalesreportfordownloadGrandTotal().then((yearlyTotal)=>{
            res.render('admin/salesreport',{Header:false,adminlogin:true,DailySalesforDownload,YearlySalesforDownload,MonthlySalesforDownload,totalDaily,monthtotal,yearlyTotal})

          })

         })
        })

    
      })
    })

  })

})
//====================================================================================================














//====================================================================================================
//Coupen Management router
router.get('/CoupenManagement',adminlogin,(req,res)=>{
  res.render('admin/CoupenManagement',{Header:false,adminlogin:true,coupen:true})
})

router.get('/addEditCoupenManagement',adminlogin,(req,res)=>{
  adminHelper.getallCoupon().then((response)=>{
    res.render('admin/addEditCoupenManagement',{Header:false,adminlogin:true,response,errMessage,successMessage})
    errMessage = ""
    successMessage = ""
  })

})

router.get('/addEditOfferManagement',adminlogin,(req,res)=>{
  adminHelper.offerAppliedBrand().then((offer)=>{
    adminHelper.offerNotAppliedBrand().then((offerNot)=>{

     
      
      res.render('admin/addofferManagement',{Header:false,adminlogin:true,offer,offerNot})

    })

  

    
  })
 
   

})

router.post('/addCoupon',(req,res)=>{
  adminHelper.addCoupon(req.body).then((response)=>{
    if(response.boolean){
      errMessage = response.errMessage
      res.redirect('/admin/addEditCoupenManagement')
    }else{
      successMessage = response.successMessage
      res.redirect('/admin/addEditCoupenManagement')
    }
    
  })
})


router.delete('/deleteCoupon',(req,res)=>{
  adminHelper.deleteCoupon(req.body).then((response)=>{
    res.json(response)
  })
})


router.post('/offerAdd',(req,res)=>{
  adminHelper.offerAppliyingToBrand(req.body).then((categoryId)=>{
    adminHelper.getCatProductnfo(categoryId).then((categorywiseProduct)=>{
      categorywiseProduct.forEach(element => {
           adminHelper.getCatProductnfoSpecific(element,req.body)
      });
      res.redirect('/admin/addEditOfferManagement')
    })
    
  
  })
})

router.get('/deleteOffer',(req,res)=>{
  let id = req.query.Brandid
  let percentage = req.query.percentage
  
  adminHelper.BrandOfferDeleting(id,percentage).then(()=>{
    adminHelper.getCatProductnfo(id).then((categorywiseProduct)=>{
      categorywiseProduct.forEach(element => {
           adminHelper.deleteofferProductnfoSpecific(element,id,percentage)
      });
      res.redirect('/admin/addEditOfferManagement')
    })
  }) 
})




//====================================================================================================

module.exports = router;
