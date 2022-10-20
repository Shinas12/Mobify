


function search(e){
   
   
   
   let showresult =  document.getElementById('showresult')
   let match = e.value.match(/^[a-zA-Z ]*/)
   let match2 = e.value.match(/ */)

   if(match2[0]===e.value){
    showresult.innerHTML ="";
    return;
   }
   
   
   if(match[0]===e.value){
   

    fetch('getProductDetails',{
        method: "POST",
        headers:{"Content-Type" : "application/json"},
        body:JSON.stringify({payload: e.value})
    }).then((res => res.json())).then((data =>{
        let payload  = data.payload
        showresult.innerHTML = ''
        if(payload.length < 1){
            showresult.innerHTML = "No result found"
            return;
        }
        payload.forEach((element,index) => {
            if(index > 0) showresult.innerHTML +="<hr>";
            showresult.innerHTML += `<a href="/product/${element._id}">
            <li style="display:flex">
            <img src="/images/product/${element.img[0]}" style="width: 30px; height: 28px; margin-top:4px"> &nbsp; &nbsp; &nbsp;
            <p> ${element.productname}</p>
            </li>
            </a>`
           
            
        });
        
    }))

    return;

   }
   showresult.innerHTML = "";
   

  
}