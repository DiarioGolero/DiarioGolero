(function(){
  var h=DG.h,SEC=DG.SEC,$=function(s){return document.querySelector(s)};
  var DK="diario-golero-borradores",PK="diario-golero-clave",AK="diario-golero-autores";
  var STAT=["Final","En vivo","Medio tiempo","Por jugar","Suspendido"];
  var published=[],results=[],comments=[],cmLoaded=false,drafts=readDrafts(),pw="";
  try{pw=sessionStorage.getItem(PK)||"";}catch(e){}
  var st={tab:"pub",editId:null,editSrc:"new",edType:"news",image:"",authorImg:""};

  function readDrafts(){try{var a=JSON.parse(localStorage.getItem(DK));if(Array.isArray(a))return a.map(DG.fixSec);}catch(e){}return [];}
  function saveDrafts(){try{localStorage.setItem(DK,JSON.stringify(drafts));}catch(e){}}
  function readAuthors(){try{var o=JSON.parse(localStorage.getItem(AK));if(o&&typeof o==="object")return o;}catch(e){}return {};}
  function rememberAuthor(n,u){if(!n||!u)return;var o=readAuthors();o[n]=u;try{localStorage.setItem(AK,JSON.stringify(o));}catch(e){}}
  function setStatus(m,bad){var s=$("#status");s.textContent=m||"";s.style.color=bad?"var(--danger)":"var(--muted)";}
  function setBusy(b){["#savePub","#saveDraft","#preview","#new"].forEach(function(s){$(s).disabled=b;});}
  function api(path,method,body){
    var o={method:method,headers:{"Content-Type":"application/json","x-admin-password":pw}};
    if(body)o.body=JSON.stringify(body);
    return fetch(path,o);
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
      var r=await api("/api/articles","POST",{verify:true});
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
      var rs=await Promise.all([fetch("/api/articles"),fetch("/api/results")]);
      if(!rs[0].ok)throw 0;
      var d=await rs[0].json();published=Array.isArray(d)?d.map(DG.fixSec):[];
      var r2=rs[1].ok?await rs[1].json():[];results=Array.isArray(r2)?r2:[];
      setStatus("");
    }catch(e){setStatus("No se pudieron cargar los datos.",true);}
    render();
  }

  /* Guardado en el servidor */
  async function save(list){
    setStatus("Publicando…");setBusy(true);
    try{
      var r=await api("/api/articles","POST",{articles:list});
      if(r.status===401){logout("La clave ya no es válida. Ingresa de nuevo.");setBusy(false);return false;}
      if(!r.ok){var j=await r.json().catch(function(){return {};});throw new Error(j.error||"Error "+r.status);}
      published=list;setStatus("Listo. Los cambios ya se ven en la portada.");setBusy(false);render();return true;
    }catch(e){setStatus("No se pudo publicar: "+e.message,true);setBusy(false);return false;}
  }
  function withFeatured(list,item){
    if(!item.featured)return list;
    return list.map(function(x){return x.id!==item.id&&x.featured?Object.assign({},x,{featured:false}):x;});
  }

  /* Listas */
  function render(){
    var tb=document.querySelectorAll("#tabs button");
    tb[0].textContent="Publicados ("+published.length+")";tb[1].textContent="Borradores ("+drafts.length+")";
    tb[3].textContent="Comentarios"+(cmLoaded?" ("+comments.length+")":"");
    tb.forEach(function(b){b.setAttribute("aria-pressed",String(b.dataset.k===st.tab));});
    var rs=st.tab==="rs",cm=st.tab==="cm";
    $("#results").hidden=!rs;$("#cmList").hidden=!cm;$("#deskList").hidden=rs||cm;
    if(rs){renderResults();return;}
    if(cm){renderComments();return;}
    var pub=st.tab==="pub",list=(pub?published:drafts).slice().sort(DG.byDate);
    var box=$("#deskList");box.textContent="";
    if(!list.length)box.appendChild(h("div",{class:"empty",text:pub?"No hay artículos publicados. Pulsa “Escribir artículo” para crear uno.":"No tienes borradores. Pulsa “Escribir artículo” para empezar uno."}));
    list.forEach(function(a){
      var c=DG.card(a,true,function(x){DG.openReader(x);});
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
    var item=Object.assign({},d,{date:Date.now()});
    var ok=await save(withFeatured([item].concat(published),item));
    if(ok){drafts=drafts.filter(function(x){return x.id!==id;});saveDrafts();render();}
  }
  async function unpublish(id){
    if(!confirm("¿Despublicar este artículo? Dejará de verse en la portada y pasará a borradores."))return;
    var a=published.filter(function(x){return x.id===id;})[0];if(!a)return;
    var ok=await save(published.filter(function(x){return x.id!==id;}));
    if(ok){drafts.unshift(Object.assign({},a,{featured:false}));saveDrafts();render();}
  }
  async function removeArticle(id,pub){
    if(!confirm("¿Eliminar este artículo? No se puede deshacer."))return;
    if(pub)await save(published.filter(function(x){return x.id!==id;}));
    else{drafts=drafts.filter(function(x){return x.id!==id;});saveDrafts();render();}
  }

  /* Comentarios */
  async function loadComments(){
    try{
      var r=await api("/api/comments?all=1","GET");
      if(r.status===401){logout("La clave ya no es válida. Ingresa de nuevo.");return;}
      if(!r.ok)throw 0;
      var d=await r.json();comments=Array.isArray(d)?d:[];
    }catch(e){comments=[];setStatus("No se pudieron cargar los comentarios.",true);}
    cmLoaded=true;if(st.tab==="cm")render();
  }
  function renderComments(){
    var box=$("#cmList");box.textContent="";
    if(!cmLoaded){box.appendChild(h("div",{class:"empty",text:"Cargando comentarios…"}));loadComments();return;}
    box.appendChild(h("p",{class:"hint",text:"Los comentarios se publican al instante. Aquí puedes eliminarlos. Los más reportados aparecen primero."}));
    if(!comments.length){box.appendChild(h("div",{class:"empty",text:"Todavía no hay comentarios."}));return;}
    var titles={};published.forEach(function(a){titles[a.id]=a.title;});
    comments.slice().sort(function(a,b){return (b.reports||0)-(a.reports||0)||b.date-a.date;}).forEach(function(c){
      var acts=[h("button",{class:"btn sm danger",type:"button",text:"Eliminar",onclick:function(){cmAction("delete",c);}})];
      if(c.reports>0)acts.unshift(h("button",{class:"btn sm ghost",type:"button",text:"Descartar reportes",onclick:function(){cmAction("dismiss",c);}}));
      box.appendChild(h("article",{class:"item cmrow"},[
        h("div",{class:"meta"},[
          c.reports>0?h("span",{class:"chip live",text:c.reports+" reporte"+(c.reports>1?"s":"")}):null,
          h("span",{text:c.nick}),
          h("span",{text:new Date(c.date).toLocaleString("es",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})})
        ]),
        h("p",{text:c.text,style:"white-space:pre-wrap"}),
        h("div",{class:"by",text:"En: "+(titles[c.aid]||"(nota eliminada)")}),
        h("div",{class:"rowact"},acts)
      ]));
    });
  }
  async function cmAction(action,c){
    if(action==="delete"&&!confirm("¿Eliminar este comentario?"))return;
    try{
      var r=await api("/api/comments","POST",{action:action,id:c.aid,cid:c.cid});
      if(r.status===401){logout("La clave ya no es válida. Ingresa de nuevo.");return;}
      if(!r.ok)throw 0;
      if(action==="delete")comments=comments.filter(function(x){return x.cid!==c.cid;});else c.reports=0;
      setStatus(action==="delete"?"Comentario eliminado.":"Reportes descartados.");render();
    }catch(e){setStatus("No se pudo completar la acción.",true);}
  }

  /* Resultados */
  function renderResults(){
    var box=$("#results");box.textContent="";
    box.appendChild(h("p",{class:"hint",text:"Estos partidos aparecen en la cinta de resultados de la portada (máximo 12). Deja los goles vacíos si el partido aún no empieza."}));
    if(!results.length)box.appendChild(h("div",{class:"empty",text:"No hay partidos cargados. Pulsa “Agregar partido”."}));
    results.forEach(function(r,i){
      var comp=h("select",{"aria-label":"Competición"});SEC.forEach(function(s){comp.appendChild(h("option",{value:s,text:s}));});
      comp.value=r.comp;comp.addEventListener("change",function(){r.comp=comp.value;});
      function txt(val,ph,key){var e=h("input",{type:"text",class:"tm",maxlength:"40",placeholder:ph,"aria-label":ph});e.value=val||"";e.addEventListener("input",function(){r[key]=e.value;});return e;}
      function num(val,ph,key){var e=h("input",{type:"number",class:"gl",min:"0",max:"99",placeholder:"–","aria-label":ph});e.value=val==null?"":val;
        e.addEventListener("input",function(){r[key]=e.value===""?null:Math.max(0,Math.min(99,parseInt(e.value,10)||0));});return e;}
      var stSel=h("select",{"aria-label":"Estado"});STAT.forEach(function(s){stSel.appendChild(h("option",{value:s,text:s}));});
      stSel.value=r.status||"Final";stSel.addEventListener("change",function(){r.status=stSel.value;});
      box.appendChild(h("div",{class:"rrow"},[comp,txt(r.home,"Local","home"),num(r.hs,"Goles local","hs"),h("span",{text:"–"}),num(r.as,"Goles visitante","as"),txt(r.away,"Visitante","away"),stSel,
        h("button",{class:"btn sm danger",type:"button",text:"Quitar",onclick:function(){results.splice(i,1);renderResults();}})]));
    });
    box.appendChild(h("div",{class:"rowact"},[
      h("button",{class:"btn ghost",type:"button",text:"Agregar partido",onclick:function(){
        if(results.length>=12){setStatus("Máximo 12 partidos.",true);return;}
        results.push({comp:SEC[0],home:"",away:"",hs:null,as:null,status:"Final"});renderResults();}}),
      h("button",{class:"btn",type:"button",text:"Guardar resultados",onclick:saveResults})
    ]));
  }
  async function saveResults(){
    setStatus("Guardando resultados…");
    var items=results.filter(function(r){return String(r.home||"").trim()&&String(r.away||"").trim();});
    try{
      var r=await api("/api/results","POST",{items:items});
      if(r.status===401){logout("La clave ya no es válida. Ingresa de nuevo.");return;}
      if(!r.ok){var j=await r.json().catch(function(){return {};});throw new Error(j.error||"Error "+r.status);}
      results=items;setStatus("Resultados guardados. Ya se ven en la portada.");renderResults();
    }catch(e){setStatus("No se pudieron guardar: "+e.message,true);}
  }

  /* Editor */
  function setEdType(t){
    st.edType=t;
    document.querySelectorAll("#typeSeg button").forEach(function(b){b.setAttribute("aria-pressed",String(b.dataset.t===t));});
    $("#liveRow").style.display=t==="news"?"flex":"none";
  }
  function showImg(){var on=!!st.image;$("#imgBox").hidden=!on;if(on)$("#imgPrev").src=st.image;}
  function showAImg(){var on=!!st.authorImg;$("#aBox").hidden=!on;if(on)$("#aPrev").src=st.authorImg;}
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
    $("#fFeat").checked=a?!!a.featured:false;
    st.image=a&&a.image?a.image:"";showImg();$("#imgMsg").textContent="";$("#fImg").value="";
    st.authorImg=a?(a.authorImg||""):(readAuthors()[au]||"");showAImg();$("#aMsg").textContent="";$("#fAImg").value="";
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
    rememberAuthor(au,st.authorImg);
    return {type:st.edType,live:st.edType==="news"&&$("#fLive").checked,featured:$("#fFeat").checked,title:title,sec:$("#fSec").value,author:au||"Redacción",authorImg:st.authorImg,lead:$("#fLead").value.trim(),body:body,image:st.image};
  }
  function saveAsDraft(){
    var d=collect(false);if(!d)return;
    if(st.editSrc==="dr"){drafts=drafts.map(function(x){return x.id===st.editId?Object.assign({},x,d):x;});}
    else{d.id="a"+Date.now();d.date=Date.now();drafts.unshift(d);}
    saveDrafts();$("#editor").close();st.tab="dr";render();setStatus("Borrador guardado.");
  }
  async function savePublish(){
    var d=collect(true);if(!d)return;
    var wasDraft=st.editSrc==="dr",draftId=st.editId,list;
    if(st.editSrc==="pub"){
      d.id=st.editId;
      list=withFeatured(published.map(function(x){return x.id===d.id?Object.assign({},x,d):x;}),d);
    }else{
      d.id=wasDraft?draftId:"a"+Date.now();d.date=Date.now();
      list=withFeatured([d].concat(published),d);
    }
    var src=st.editSrc;
    $("#editor").close();
    var ok=await save(list);
    if(ok&&wasDraft){drafts=drafts.filter(function(x){return x.id!==draftId;});saveDrafts();render();}
    if(!ok&&src==="new"){drafts.unshift(Object.assign({},d));saveDrafts();st.tab="dr";render();setStatus("No se pudo publicar. Guardamos el texto como borrador.",true);}
  }
  function preview(){var d=collect(false);if(!d)return;d.id="vista-previa";d.date=Date.now();DG.openReader(d);}

  /* Imágenes */
  function toJpeg(file,max){return new Promise(function(res,rej){
    var url=URL.createObjectURL(file),img=new Image();
    img.onload=function(){
      var w=img.naturalWidth,hh=img.naturalHeight,k=Math.min(1,max/Math.max(w,hh));
      var c=document.createElement("canvas");c.width=Math.round(w*k);c.height=Math.round(hh*k);
      var x=c.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,c.width,c.height);x.drawImage(img,0,0,c.width,c.height);
      URL.revokeObjectURL(url);
      c.toBlob(function(b){b?res(b):rej(new Error("No se pudo procesar la imagen."));},"image/jpeg",0.85);
    };
    img.onerror=function(){URL.revokeObjectURL(url);rej(new Error("El archivo no es una imagen válida."));};
    img.src=url;
  });}
  function toB64(blob){return new Promise(function(res,rej){
    var r=new FileReader();r.onload=function(){res(String(r.result).split(",")[1]);};r.onerror=function(){rej(new Error("No se pudo leer la imagen."));};r.readAsDataURL(blob);
  });}
  async function upload(file,max){
    var b64=await toB64(await toJpeg(file,max));
    var r=await fetch("/api/upload",{method:"POST",headers:{"Content-Type":"application/json","x-admin-password":pw},body:JSON.stringify({data:b64})});
    var j=await r.json().catch(function(){return {};});
    if(r.status===401){var e=new Error("clave");e.code=401;throw e;}
    if(!r.ok)throw new Error(j.error||"Error "+r.status);
    return j.url;
  }
  async function pick(inputSel,msgSel,max,assign){
    var f=$(inputSel).files[0];if(!f)return;
    $(msgSel).textContent="Subiendo imagen…";setBusy(true);
    try{assign(await upload(f,max));$(msgSel).textContent="Imagen lista.";}
    catch(e){
      if(e.code===401){$("#editor").close();logout("La clave ya no es válida. Ingresa de nuevo.");}
      else $(msgSel).textContent="No se pudo subir la imagen: "+e.message;
    }
    finally{setBusy(false);}
  }

  /* Eventos */
  SEC.forEach(function(s){$("#fSec").appendChild(h("option",{value:s,text:s}));});
  document.querySelectorAll("#typeSeg button").forEach(function(b){b.addEventListener("click",function(){setEdType(b.dataset.t);});});
  document.querySelectorAll("#tabs button").forEach(function(b){b.addEventListener("click",function(){st.tab=b.dataset.k;render();});});
  $("#new").addEventListener("click",function(){openEditor(null,"new");});
  $("#fImg").addEventListener("change",function(){pick("#fImg","#imgMsg",1600,function(u){st.image=u;showImg();});});
  $("#imgDel").addEventListener("click",function(){st.image="";$("#fImg").value="";showImg();$("#imgMsg").textContent="";});
  $("#fAImg").addEventListener("change",function(){pick("#fAImg","#aMsg",400,function(u){st.authorImg=u;showAImg();});});
  $("#aDel").addEventListener("click",function(){st.authorImg="";$("#fAImg").value="";showAImg();$("#aMsg").textContent="";});
  $("#fAuthor").addEventListener("change",function(){var u=readAuthors()[$("#fAuthor").value.trim()];if(u&&!st.authorImg){st.authorImg=u;showAImg();}});
  $("#cancel").addEventListener("click",function(){$("#editor").close();});
  $("#preview").addEventListener("click",preview);
  $("#saveDraft").addEventListener("click",saveAsDraft);
  $("#savePub").addEventListener("click",savePublish);
  $("#enter").addEventListener("click",login);
  $("#pw").addEventListener("keydown",function(e){if(e.key==="Enter")login();});
  $("#logout").addEventListener("click",function(){logout("");});
  if(pw){start();}
})();
