(function(){
  var h=DG.h,SEC=DG.SEC,$=function(s){return document.querySelector(s)};
  var DK="diario-golero-borradores",PK="diario-golero-clave";
  var published=[],drafts=readDrafts(),pw="";
  try{pw=sessionStorage.getItem(PK)||"";}catch(e){}
  var st={tab:"pub",editId:null,editSrc:"new",edType:"news"};

  function readDrafts(){try{var a=JSON.parse(localStorage.getItem(DK));if(Array.isArray(a))return a;}catch(e){}return [];}
  function saveDrafts(){try{localStorage.setItem(DK,JSON.stringify(drafts));}catch(e){}}
  function setStatus(m,bad){var s=$("#status");s.textContent=m||"";s.style.color=bad?"var(--danger)":"var(--muted)";}
  function setBusy(b){["#savePub","#saveDraft","#new"].forEach(function(s){$(s).disabled=b;});}
  function api(method,body){
    var o={method:method,headers:{"Content-Type":"application/json","x-admin-password":pw}};
    if(body)o.body=JSON.stringify(body);
    return fetch("/api/articles",o);
  }

  /* Acceso */
  function showDesk(on){$("#login").hidden=on;$("#desk").hidden=!on;$("#logout").hidden=!on;}
  function logout(msg){
    pw="";try{sessionStorage.removeItem(PK);}catch(e){}
    showDesk(false);$("#pw").value="";$("#loginErr").textContent=msg||"";
  }
  async function login(){
    pw=$("#pw").value;
    if(!pw){$("#loginErr").textContent="Escribe la clave de redacción.";return;}
    $("#enter").disabled=true;
    try{
      var r=await api("POST",{verify:true});
      if(r.status===401){$("#loginErr").textContent="La clave no es correcta.";pw="";return;}
      if(!r.ok){var j=await r.json().catch(function(){return {};});$("#loginErr").textContent=j.error||"No se pudo verificar la clave.";pw="";return;}
      try{sessionStorage.setItem(PK,pw);}catch(e){}
      $("#loginErr").textContent="";await start();
    }catch(e){$("#loginErr").textContent="No hay conexión con el servidor.";pw="";}
    finally{$("#enter").disabled=false;}
  }
  async function start(){
    showDesk(true);setStatus("Cargando…");
    try{
      var r=await fetch("/api/articles");if(!r.ok)throw 0;
      var d=await r.json();published=Array.isArray(d)?d:[];setStatus("");
    }catch(e){setStatus("No se pudieron cargar los artículos publicados.",true);}
    render();
  }

  /* Guardado en el servidor */
  async function save(list){
    setStatus("Publicando…");setBusy(true);
    try{
      var r=await api("POST",{articles:list});
      if(r.status===401){logout("La clave ya no es válida. Ingresa de nuevo.");setBusy(false);return false;}
      if(!r.ok){var j=await r.json().catch(function(){return {};});throw new Error(j.error||"Error "+r.status);}
      published=list;setStatus("Listo. Los cambios ya se ven en la portada.");setBusy(false);render();return true;
    }catch(e){setStatus("No se pudo publicar: "+e.message,true);setBusy(false);return false;}
  }

  /* Listas */
  function render(){
    var pub=st.tab==="pub",list=(pub?published:drafts).slice().sort(DG.byDate);
    var tb=document.querySelectorAll("#tabs button");
    tb[0].textContent="Publicados ("+published.length+")";tb[1].textContent="Borradores ("+drafts.length+")";
    tb.forEach(function(b){b.setAttribute("aria-pressed",b.dataset.k===st.tab);});
    var box=$("#deskList");box.textContent="";
    if(!list.length)box.appendChild(h("div",{class:"empty",text:pub?"No hay artículos publicados. Pulsa “Escribir artículo” para crear uno.":"No tienes borradores. Pulsa “Escribir artículo” para empezar uno."}));
    list.forEach(function(a){
      var c=DG.card(a,true,function(x){DG.openReader(x,false);});
      c.appendChild(h("div",{class:"rowact"},[
        h("button",{class:"btn sm ghost",type:"button",text:"Editar",onclick:function(){openEditor(a.id,pub?"pub":"dr");}}),
        h("button",{class:"btn sm",type:"button",text:pub?"Despublicar":"Publicar",onclick:function(){pub?unpublish(a.id):publishDraft(a.id);}}),
        h("button",{class:"btn sm danger",type:"button",text:"Eliminar",onclick:function(){removeArticle(a.id,pub);}})
      ]));
      box.appendChild(c);
    });
  }
  async function publishDraft(id){
    var d=drafts.filter(function(x){return x.id===id;})[0];if(!d)return;
    var ok=await save([Object.assign({},d,{date:Date.now()})].concat(published));
    if(ok){drafts=drafts.filter(function(x){return x.id!==id;});saveDrafts();render();}
  }
  async function unpublish(id){
    if(!confirm("¿Despublicar este artículo? Dejará de verse en la portada y pasará a borradores."))return;
    var a=published.filter(function(x){return x.id===id;})[0];if(!a)return;
    var ok=await save(published.filter(function(x){return x.id!==id;}));
    if(ok){drafts.unshift(a);saveDrafts();render();}
  }
  async function removeArticle(id,pub){
    if(!confirm("¿Eliminar este artículo? No se puede deshacer."))return;
    if(pub)await save(published.filter(function(x){return x.id!==id;}));
    else{drafts=drafts.filter(function(x){return x.id!==id;});saveDrafts();render();}
  }

  /* Editor */
  function setEdType(t){
    st.edType=t;
    document.querySelectorAll("#typeSeg button").forEach(function(b){b.setAttribute("aria-pressed",b.dataset.t===t);});
    $("#liveRow").style.display=t==="news"?"flex":"none";
  }
  function openEditor(id,src){
    var a=id?(src==="pub"?published:drafts).filter(function(x){return x.id===id;})[0]:null;
    st.editId=a?a.id:null;st.editSrc=a?src:"new";
    $("#edTitle").textContent=a?"Editar artículo":"Nuevo artículo";
    $("#fTitle").value=a?a.title:"";
    $("#fSec").value=a?a.sec:SEC[0];
    var au="";try{au=localStorage.getItem("diario-golero-autor")||"";}catch(e){}
    $("#fAuthor").value=a?a.author:au;
    $("#fLead").value=a?a.lead:"";
    $("#fBody").value=a?a.body:"";
    $("#fLive").checked=a?!!a.live:false;
    $("#err").textContent="";
    $("#saveDraft").hidden=st.editSrc==="pub";
    $("#savePub").textContent=st.editSrc==="pub"?"Publicar cambios":"Publicar";
    setEdType(a?a.type:"news");
    $("#editor").showModal();$("#fTitle").focus();
  }
  function collect(needBody){
    var title=$("#fTitle").value.trim(),body=$("#fBody").value.trim();
    if(!title){$("#err").textContent="Escribe un título para continuar.";$("#fTitle").focus();return null;}
    if(needBody&&!body){$("#err").textContent="Escribe el texto del artículo para publicar.";$("#fBody").focus();return null;}
    var au=$("#fAuthor").value.trim();
    try{localStorage.setItem("diario-golero-autor",au);}catch(e){}
    return {type:st.edType,live:st.edType==="news"&&$("#fLive").checked,title:title,sec:$("#fSec").value,author:au||"Redacción",lead:$("#fLead").value.trim(),body:body};
  }
  function saveAsDraft(){
    var d=collect(false);if(!d)return;
    if(st.editSrc==="dr"){drafts=drafts.map(function(x){return x.id===st.editId?Object.assign({},x,d):x;});}
    else{d.id="a"+Date.now();d.date=Date.now();drafts.unshift(d);}
    saveDrafts();$("#editor").close();st.tab="dr";render();setStatus("Borrador guardado.");
  }
  async function savePublish(){
    var d=collect(true);if(!d)return;
    var list,wasDraft=st.editSrc==="dr",draftId=st.editId;
    if(st.editSrc==="pub"){list=published.map(function(x){return x.id===st.editId?Object.assign({},x,d):x;});}
    else{d.id=wasDraft?draftId:"a"+Date.now();d.date=Date.now();list=[d].concat(published);}
    $("#editor").close();
    var ok=await save(list);
    if(ok&&wasDraft){drafts=drafts.filter(function(x){return x.id!==draftId;});saveDrafts();render();}
    if(!ok&&st.editSrc!=="pub"&&!wasDraft){drafts.unshift(Object.assign({},d));saveDrafts();st.tab="dr";render();setStatus("No se pudo publicar. Guardamos el texto como borrador.",true);}
  }

  /* Eventos */
  SEC.forEach(function(s){$("#fSec").appendChild(h("option",{value:s,text:s}));});
  document.querySelectorAll("#typeSeg button").forEach(function(b){b.addEventListener("click",function(){setEdType(b.dataset.t);});});
  document.querySelectorAll("#tabs button").forEach(function(b){b.addEventListener("click",function(){st.tab=b.dataset.k;render();});});
  $("#new").addEventListener("click",function(){openEditor(null,"new");});
  $("#cancel").addEventListener("click",function(){$("#editor").close();});
  $("#saveDraft").addEventListener("click",saveAsDraft);
  $("#savePub").addEventListener("click",savePublish);
  $("#enter").addEventListener("click",login);
  $("#pw").addEventListener("keydown",function(e){if(e.key==="Enter")login();});
  $("#logout").addEventListener("click",function(){logout("");});
  if(pw){start();}
})();
