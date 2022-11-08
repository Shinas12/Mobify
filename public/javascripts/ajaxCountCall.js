
  
  function changecount(cartId,productId,count,user){
    console.log(user)
    let qty = document.getElementById(productId).innerHTML
    qty = parseInt(qty)
  
    
    $.ajax({
        url:'/productCount',
        data:{
            cart:cartId,
            proId:productId,
            count:count,
            qty:qty,
            user:user
        },
        method:'post',
        success:((response)=>{
            console.log(response)
            if(response.response.checkminus){
                console.log('minus and one quantity')

                document.getElementById('minus'+productId).disabled = true
                document.getElementById('ptag'+productId).style.display = "none"

            }else{

                if(response.response.check){

                    document.getElementById(productId).innerHTML = qty+count;
                    let price = document.getElementById(productId+'price').innerHTML
                    price = parseInt(price)
                    let total = document.getElementById(productId+'total').innerHTML
                    total = parseInt(total)
                    let grandtotal = document.getElementById(productId).innerHTML* price
                    document.getElementById(productId+'total').innerHTML = grandtotal
                    document.getElementById('subtotal').innerHTML = response.totalValue[0].grandtotal
                    document.getElementById('subtotal2').innerHTML =response.totalValue[0].grandtotal
                    document.getElementById('plus'+productId).disabled = false
                    document.getElementById('ptag'+productId).style.display = "none"
                    document.getElementById('minus'+productId).disabled = false

                    document.getElementById('DiscountPercentage').innerHTML = response.cartDiscnt[0].discountedPrice
                   

                   
                     document.getElementById('subtotal2').innerHTML =  response.cartDiscnt[0].TotalAfterDiscount
 
                    


                }else{
                      if(!response.response.check){

                        document.getElementById('plus'+productId).disabled = true
                        document.getElementById('ptag'+productId).style.display = "inline"

                      }
                        
                   
                    }

               
                }  

            })
        })
    }



function removeProduct(proId,cartId){
    $.ajax({
        url:'/removeProduct',
        data:{
            proId:proId,
            cartId:cartId
        },
        method:'post',
        success:((response)=>{
            location.reload()
        })
    })
}


$('#form').submit((e)=>{
    e.preventDefault()
    $.ajax({
        url:'/ordersuccess',
        method:'post',
        data:$('#form').serialize(),
        success:(response)=>{

            if(response.codsuccess){
                location.href="/orderDetails"

            }else if(response.RazSuccess){

               razorpay(response.response)

            }else{
                
                paypal(response.objct.id)
            }
        }
    })
})


function razorpay(order){
    var options = {
        "key":"rzp_test_WnTnSS9k30uWX0", 
        "amount": order.amount,
        "currency": "INR",
        "name": "Mobify",
        "description": "Test Transaction",
        "image": "assets/images/logo.png",
        "order_id": order.id, 
        "handler": function (response){
            verifyPayment(response,order)
        },
        "prefill": {
            "name": "Gaurav Kumar",
            "email": "gaurav.kumar@example.com",
            "contact": "9999999999"
        },
        "notes": {
            "address": "Razorpay Corporate Office"
        },
        "theme": {
            "color": "#3399cc"
        }
    };

    var rzp1 = new Razorpay(options);
    rzp1.open();
}


function verifyPayment(payment,order){
    $.ajax({
        url:'/verifyPayment',
        data:{
            payment,
            order
        },
        method:'post',
        success:(response)=>{
            if(response.status){

                $.ajax({
                    url:'/verifyPaymentOnceMore',
                    data:{
                
                        order
                    },
                    method:'post',
                    success:(response)=>{
                    location.href="/orderDetails"
                    }

            })
                
            }else{
                alert('syma pani paali')
            }
        }
    })

}

function paypal(orderId){

    
    $.ajax({
        url:'/paypalorderdetailsfetch',
        data:{
             orderId
        },
        method:'post',
        success:(response)=>{
            pay(response)
          
        }

})
    

}

function pay(orderdetails){

    $.ajax({
        url:'/p',
        data:{
            name:orderdetails
        },
        method:'post',
        success:(response)=>{
            location.href = response
          
        }

})
    
}

 


function Shipping (odrId,productId){
    console.log(odrId,productId)
    let Hello = document.getElementById('shipping'+odrId+productId).value
    console.log(Hello)


         
   $.ajax({
      url:'/admin/orderStatus',
      data:{
          orderId:odrId,
          proId:productId, 
          Ship:Hello
      },
      method:'post',
      success:(response)=>{
            location.reload()
  }
  }) 


  }


  function ShippingUser (odrId,productId,Hello,proQuantity){
   

         
   $.ajax({
      url:'/admin/orderStatus',
      data:{
          orderId:odrId,
          proId:productId,
          Ship:Hello
      },
      method:'post',
      success:(response)=>{
          location.reload()
          incrementstock(proQuantity,productId)
  }
  }) 


  }

  function incrementstock(proQuantity,productId){

  

    $.ajax({
        url:'/productIncrement',
        data:{
            proId:productId,
            proQnty:proQuantity
        },
        method:'post',
        success:(response)=>{        
    }
    }) 
    
  }




function Addressfill (Customer,Housename){
  
    $.ajax({
        url:'/filladdress',
        data:{
             Customer:Customer,
             Housename:Housename
        },
        method:'post',
        success:(address)=>{
             document.getElementById('name').value = address[0]._id.CustomerName;
             document.getElementById('housename').value = address[0]._id.Address.Housename;
             document.getElementById('streetName').value = address[0]._id.Address.Street;
             document.getElementById('landMark').value = address[0]._id.Address.LandMark;
             document.getElementById('City').value = address[0]._id.Address.City;
             document.getElementById('state').value = address[0]._id.Address.State;
             document.getElementById('PinCode').value = address[0]._id.Address.Pincode;
             document.getElementById('Phone').value = address[0]._id.CustomerPhone;
             document.getElementById('email').value = address[0]._id.CustomerEmail;
    }
    }) 
    
}




function deleteAddress(Housename,LandMark,Phone,Name){
    console.log("card"+Housename,LandMark,Phone)
    console.log(LandMark)
    console.log(Phone)
    console.log(Name)
    var div = document.getElementById("add"+Housename+"phn"+Phone+"name"+Name)
    console.log(div)
    
    $.ajax({
        url:'/deleteAddress',
        data:{
            Housename:Housename,
            LandMark:LandMark,
            Phone:Phone,
            Name:Name
        },
        method:'post',
        success:(response)=>{
        div.style.display="none"
             
    }
    }) 
}


function EditAddress(Housename,LandMark,Phone,Name){ 
    $.ajax({
        url:'/EditAddress',
        data:{
            Housename:Housename,
            LandMark:LandMark,
            Phone:Phone,
            Name:Name
        },
        method:'post',
        success:(response)=>{
            let id = response._id
            location.href = "/EditAddressPage/?orderId="+id
            
    }
    }) 
}






function getmoreaddress(){

    document.getElementById('adrsMore').style.display="block"
    document.getElementById('adrsLess').style.display="none"
} 


function getlessaddress(){

    document.getElementById('adrsMore').style.display="none"
    document.getElementById('adrsLess').style.display="block"
}


function specificorder(orderId,proId){
    console.log(orderId)
    console.log(proId)

    $.ajax({
        url:'/admin/redirectspecificproductdetails',
        data:{
            odrId:orderId,
            prId:proId
        },
        method:'post',
        success:(response)=>{
        location.href='/admin/redirectspecificproductdetail'
             
    }
    }) 
}

function addToWishlist(id){
    console.log(id)
    $.ajax({
        url:'/wishlist',
        data:{
            id:id,
   
        },
        method:'get',
        success:(response)=>{
            console.log(response)
        if(response == true){
          
           let icon = document.getElementById('heartIcon'+id)
           icon.classList.remove("fa", "fa-heart-o")
           icon.classList.add("fa", "fa-heart", "heartI")
           

        }else{

            let icon = document.getElementById('heartIcon'+id)
            icon.classList.remove("fa", "fa-heart", "heartI")
           icon.classList.add("fa", "fa-heart-o")
           
         
        }
             
    }
    }) 
}







