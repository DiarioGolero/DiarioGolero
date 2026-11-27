(function(){
  var SEC=["Liga","Copa","Selección","Fichajes","Internacional","Otros"];
  function h(tag,props,kids){
    var e=document.createElement(tag);
    if(props)for(var k in props){if(k==="text")e.textContent=props[k];else if(k.slice(0,2)==="on")e.addEventListener(k.slice(2),props[k]);else e.setAttribute(k,props[k]);}
    (kids||[]).forEach(function(c){if(c)e.appendChild(c);});
    return e;
  }
  function fdate(t){return new Date(t).toLocaleDateString("es",{day:"numeric",month:"short",year:"numeric"});}
  function byDate(a,b){return b.date-a.date;}
  function card(a,showType,onOpen){
    var meta=h("div",{class:"meta"},[
      a.live?h("span",{class:"chip live",text:"Último minuto"}):null,
      showType?h("span",{class:"chip",text:a.type==="ed"?"Editorial":"Noticia"}):null,
      h("span",{class:"chip",text:a.sec}),
      h("span",{text:fdate(a.date)})
    ]);
    var t=h("h3",null,[h("button",{type:"button",text:a.title,onclick:function(){onOpen(a);}})]);
    return h("article",{class:"item "+a.type},[a.image?h("img",{class:"thumb",src:a.image,alt:"",loading:"lazy"}):null,meta,t,a.lead?h("p",{text:a.lead}):null,h("div",{class:"by",text:"Por "+(a.author||"Redacción")})]);
  }
  function openReader(a,setHash){
    var dlg=document.getElementById("reader"),body=document.getElementById("readerBody");
    body.textContent="";
    var box=h("div",{class:"reader "+a.type},[
      h("div",{class:"meta"},[
        h("span",{class:"chip",text:a.type==="ed"?"Editorial":"Noticia"}),
        a.live?h("span",{class:"chip live",text:"Último minuto"}):null,
        h("span",{class:"chip",text:a.sec}),
        h("span",{text:fdate(a.date)})
      ]),
      a.image?h("img",{class:"hero",src:a.image,alt:a.title}):null,
      h("h1",{text:a.title}),
      a.lead?h("p",{class:"lead",text:a.lead}):null,
      h("div",{class:"by",text:"Por "+(a.author||"Redacción"),style:"margin-bottom:16px"})
    ]);
    var txt=h("div",{class:"txt"});
    String(a.body).split(/\n\s*\n/).forEach(function(p){if(p.trim())txt.appendChild(h("p",{text:p.trim()}));});
    box.appendChild(txt);body.appendChild(box);
    body.appendChild(h("div",{class:"actions"},[h("button",{class:"btn",type:"button",text:"Cerrar",onclick:function(){dlg.close();}})]));
    if(setHash){try{history.replaceState(null,"","#n-"+a.id);}catch(e){}}
    if(!dlg.open)dlg.showModal();
  }
  document.addEventListener("DOMContentLoaded",function(){
    var dlg=document.getElementById("reader");
    if(dlg)dlg.addEventListener("close",function(){try{if(/^#n-/.test(location.hash))history.replaceState(null,"",location.pathname+location.search);}catch(e){}});
  });
  window.DG={SEC:SEC,h:h,fdate:fdate,byDate:byDate,card:card,openReader:openReader};
})();
