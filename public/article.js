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

(function(){
  var id=document.body.getAttribute("data-id"),T0=Date.now();
  var form=document.getElementById("cform");if(!form)return;
  var listBox=document.getElementById("clist"),msg=document.getElementById("cmsg"),cnt=document.getElementById("ccount");
  var nickIn=document.getElementById("cnick"),textIn=document.getElementById("ctext"),web=document.getElementById("cweb"),btn=document.getElementById("csend");
  var items=[];
  try{nickIn.value=localStorage.getItem("dg-nick")||"";}catch(e){}
  function say(t,bad){msg.textContent=t||"";msg.style.color=bad?"var(--danger)":"var(--muted)";}
  function when(t){return new Date(t).toLocaleString("es",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});}
  function render(){
    listBox.textContent="";cnt.textContent=items.length?"("+items.length+")":"";
    if(!items.length){var p0=document.createElement("p");p0.className="by";p0.textContent="Todavía no hay comentarios. Sé el primero.";listBox.appendChild(p0);return;}
    items.forEach(function(c){
      var box=document.createElement("div");box.className="cm";
      var head=document.createElement("div");head.className="ch";
      var b=document.createElement("b");b.textContent=c.nick;
      var s=document.createElement("span");s.textContent=when(c.date);
      var rb=document.createElement("button");rb.type="button";rb.className="lnk";
      var done=false;try{done=!!localStorage.getItem("dg-rep-"+c.cid);}catch(e){}
      rb.textContent=done?"Reportado":"Reportar";rb.disabled=done;
      rb.addEventListener("click",function(){report(c,rb);});
      head.appendChild(b);head.appendChild(s);head.appendChild(rb);
      var p=document.createElement("p");p.textContent=c.text;
      box.appendChild(head);box.appendChild(p);listBox.appendChild(box);
    });
  }
  function load(){
    fetch("/api/comments?id="+encodeURIComponent(id)).then(function(r){if(!r.ok)throw 0;return r.json();})
      .then(function(d){items=Array.isArray(d)?d:[];render();}).catch(function(){say("No se pudieron cargar los comentarios.",true);});
  }
  function report(c,b){
    if(!confirm("¿Reportar este comentario a la redacción?"))return;
    fetch("/api/comments",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"report",id:id,cid:c.cid})}).then(function(r){
      if(!r.ok)throw 0;b.textContent="Reportado";b.disabled=true;try{localStorage.setItem("dg-rep-"+c.cid,"1");}catch(e){}
    }).catch(function(){say("No se pudo enviar el reporte.",true);});
  }
  form.addEventListener("submit",function(e){
    e.preventDefault();say("");
    var nick=nickIn.value.trim(),text=textIn.value.trim();
    if(nick.length<2){say("Escribe un nickname de al menos 2 caracteres.",true);nickIn.focus();return;}
    if(text.length<2){say("Escribe tu comentario.",true);textIn.focus();return;}
    btn.disabled=true;say("Publicando…");
    fetch("/api/comments",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:id,nick:nick,text:text,website:web.value,elapsed:Date.now()-T0})})
      .then(function(r){return r.json().catch(function(){return {};}).then(function(j){return {ok:r.ok,j:j};});})
      .then(function(x){
        if(!x.ok){say(x.j.error||"No se pudo publicar tu comentario.",true);return;}
        try{localStorage.setItem("dg-nick",nick);}catch(e){}
        if(x.j.comment){items.unshift(x.j.comment);render();}
        textIn.value="";say("¡Comentario publicado!");
      }).catch(function(){say("No hay conexión. Inténtalo de nuevo.",true);})
      .then(function(){btn.disabled=false;});
  });
  load();
})();
