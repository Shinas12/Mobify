var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var hbs = require('express-handlebars')
var db = require('./config/connection')
var session = require('express-session')
var noCache = require('nocache')
var objectId=require('mongodb').ObjectId
require('dotenv').config()

 

const hbshelper = hbs.create({

  extname:'hbs',
  defaultLayout:'layout',
  layoutsDir:__dirname+'/views/layout/',
  partialDir:__dirname+'/views/partials/',

  helpers:{
    ifEquals:(value1,value2,options)=>{

      if(value1==value2){
         
         return options.fn()
      }else{

          return options.inverse();   
}
},

    ifGotoCart:(userId,CartDetails,ProdId,options)=>{
      

      if(userId){
       
     let UserCartfind = CartDetails.map((element)=>{
          
          
           let uId = objectId(userId).toString()

           if(element.user.toString() == uId){
               return element.product
           }
           

      })
          
      if(UserCartfind[0]){

        let boolean=  UserCartfind[0].some((element)=>{

          
          return element.item.toString() == objectId(ProdId).toString()
          

   })

   
      if(boolean){
        return options.fn()
      }else{
        return options.inverse(); 
      }

      }else{
        return options.inverse(); 
      }
    

     

     
    }else{
      return options.inverse();
    }
  },



  Wish:(userId,Wish,ProdId,options)=>{
  
   
    if(userId){

   let wish = Wish.map((element)=>{
        
        
         let uId = objectId(userId).toString()
  
         if(element.user.toString() == uId){
             return element.product
         }
         
  
    })
  
   
  
  if(wish[0]){

         let boolean=  wish[0].some((element)=>{
  
      
        return element.toString() == objectId(ProdId).toString()
        
  
  })

 
  
  
    if(boolean){
      return options.fn()
    }else{
      return options.inverse(); 
    }

  }else{
     return options.inverse();
  }
  

  
   
  }else{
    return options.inverse();
  }
  
  },

  checkbox:(filteredProduct,categoryid,options)=>{
    
   
    let filtered = filteredProduct.map((element)=>{
              return element.brand

    })

    
    
    let boolean =  filtered.some((element)=>{
        return element.toString() == categoryid.toString()
    })

  

    if(boolean){
       return options.fn()
    }else{
      return options.inverse()
    }

   
  }
  
},



})




var usersRouter = require('./routes/user');
var adminRouter = require('./routes/admin');

var app = express();



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs',hbshelper.engine)
app.use(noCache());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({secret:process.env.secret,cookie:{maxAge:12000000}, resave: false,saveUninitialized: true,}))


 db.connect((err)=>{
  if(err)console.log("connection error")
  else console.log("database connected")
})

app.use('/', usersRouter);

app.use('/admin', adminRouter);

app.use('/admin/*',(req,res)=>{
  res.render('admin/error')
})

app.use('/*',(req,res)=>{
  res.render('user/error')
})



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
