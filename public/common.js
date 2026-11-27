(function(){
  var SEC=["LaLiga","Copa del Rey","UEFA Champions League","UEFA Europa League","Premier League","Serie A","Copa Libertadores","Internacional","Fichajes"];
  var LEGACY={"Liga":"LaLiga","Copa":"Copa del Rey","Selección":"Internacional","Otros":"Internacional"};
  function fixSec(a){return LEGACY[a.sec]?Object.assign({},a,{sec:LEGACY[a.sec]}):a;}
  var ICONS={
    "Todas":'<rect x="4" y="4" width="6.5" height="6.5" rx="1.2"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.2"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.2"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.2"/>',
    "LaLiga":'<circle cx="12" cy="12" r="9"/><path d="M12 8l3.5 2.5-1.3 4.1H9.8l-1.3-4.1z"/><path d="M12 3v5M15.5 10.5L20 9M14.2 14.6l2.6 3.7M9.8 14.6l-2.6 3.7M8.5 10.5L4 9"/>',
    "Copa del Rey":'<path d="M4 18h16M5 18L4 8l5 4 3-6 3 6 5-4-1 10"/>',
    "UEFA Champions League":'<circle cx="12" cy="12" r="2.6"/><g fill="currentColor" stroke="none"><circle cx="19.5" cy="12" r="1.3"/><circle cx="17.3" cy="17.3" r="1.3"/><circle cx="12" cy="19.5" r="1.3"/><circle cx="6.7" cy="17.3" r="1.3"/><circle cx="4.5" cy="12" r="1.3"/><circle cx="6.7" cy="6.7" r="1.3"/><circle cx="12" cy="4.5" r="1.3"/><circle cx="17.3" cy="6.7" r="1.3"/></g>',
    "UEFA Europa League":'<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5v1a3 3 0 0 0 3 3M16 6h3v1a3 3 0 0 1-3 3M12 13v4M9 20h6M10 17h4"/>',
    "Premier League":'<path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/>',
    "Serie A":'<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M9.3 5v14M14.7 5v14"/>',
    "Copa Libertadores":'<path d="M12 3c2 2.5 3 4 3 5.5a3 3 0 0 1-6 0C9 7 10 5.5 12 3z"/><path d="M9 13h6l-1 8h-4z"/>',
    "Internacional":'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
    "Fichajes":'<path d="M4 8h14M14 4l4 4-4 4M20 16H6M10 12l-4 4 4 4"/>'
  };
  function icon(name){
    var s=document.createElement("span");s.className="ico";
    s.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(ICONS[name]||ICONS["LaLiga"])+'</svg>';
    return s;
  }
  function secChip(name){var c=document.createElement("span");c.className="chip sec";c.appendChild(icon(name));c.appendChild(document.createTextNode(name));return c;}
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
      secChip(a.sec),
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
        secChip(a.sec),
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
  window.DG={SEC:SEC,h:h,fdate:fdate,byDate:byDate,card:card,openReader:openReader,icon:icon,fixSec:fixSec};
})();
