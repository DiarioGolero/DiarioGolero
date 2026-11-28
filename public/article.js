(function(){
  var id=document.body.getAttribute("data-id");
  document.querySelectorAll("[data-sec]").forEach(function(c){c.insertBefore(DG.icon(c.getAttribute("data-sec")),c.firstChild);});
  try{
    var k="dg-visto-"+id,t=Number(localStorage.getItem(k))||0;
    if(Date.now()-t>6*3600*1000){
      localStorage.setItem(k,String(Date.now()));
      fetch("/api/views",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:id})}).catch(function(){});
    }
  }catch(e){}
  var cp=document.getElementById("copy");
  if(cp)cp.addEventListener("click",function(){
    var done=function(){cp.textContent="¡Enlace copiado!";setTimeout(function(){cp.textContent="Copiar enlace";},2000);};
    if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(location.href).then(done,function(){});
    else{var i=document.createElement("input");i.value=location.href;document.body.appendChild(i);i.select();try{document.execCommand("copy");done();}catch(e){}i.remove();}
  });
  var nat=document.getElementById("native");
  if(nat&&navigator.share){nat.hidden=false;nat.addEventListener("click",function(){navigator.share({title:document.title,url:location.href}).catch(function(){});});}
})();
