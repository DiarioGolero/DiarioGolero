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
    "Fichajes":'<path d="M4 8h14M14 4l4 4-4 4M20 16H6M10 12l-4 4 4 4"/>',
    "Comentarios":'<path d="M4 5h16v11H9l-5 4z"/>',
    "Noticias":'<rect x="4" y="5" width="13" height="14" rx="2"/><path d="M17 9h3v8a2 2 0 0 1-2 2h-1M7.5 9h6M7.5 12h6M7.5 15h3"/>',
    "Editoriales":'<path d="M9.5 8H7a1.5 1.5 0 0 0-1.5 1.5V12A1.5 1.5 0 0 0 7 13.5h2.5V16a2 2 0 0 1-2 2M18.5 8H16a1.5 1.5 0 0 0-1.5 1.5V12A1.5 1.5 0 0 0 16 13.5h2.5V16a2 2 0 0 1-2 2"/>'
  };
  ICONS["Todo"]=ICONS["Todas"];
  function h(tag,props,kids){
    var e=document.createElement(tag);
    if(props)for(var k in props){if(k==="text")e.textContent=props[k];else if(k.slice(0,2)==="on")e.addEventListener(k.slice(2),props[k]);else e.setAttribute(k,props[k]);}
    (kids||[]).forEach(function(c){if(c)e.appendChild(c);});
    return e;
  }
  function icon(name){
    var s=document.createElement("span");s.className="ico";
    s.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(ICONS[name]||ICONS["LaLiga"])+'</svg>';
    return s;
  }
  function secChip(name){var c=h("span",{class:"chip sec"});c.appendChild(icon(name));c.appendChild(document.createTextNode(name));return c;}
  function fdate(t){return new Date(t).toLocaleDateString("es",{day:"numeric",month:"short",year:"numeric"});}
  function byDate(a,b){return b.date-a.date;}
  function readTime(body){var n=String(body||"").trim().split(/\s+/).filter(Boolean).length;return Math.max(1,Math.ceil(n/200));}
  function initials(n){return String(n||"R").split(/\s+/).filter(Boolean).slice(0,2).map(function(w){return w[0];}).join("").toUpperCase()||"R";}
  function avatar(a){
    if(a.authorImg)return h("img",{class:"av",src:a.authorImg,alt:""});
    return h("span",{class:"av",text:initials(a.author)});
  }
  function card(a,showType,onOpen){
    var meta=h("div",{class:"meta"},[
      a.live?h("span",{class:"chip live",text:"Último minuto"}):null,
      a.featured?h("span",{class:"chip",text:"En portada"}):null,
      showType?h("span",{class:"chip",text:a.type==="ed"?"Editorial":"Noticia"}):null,
      secChip(a.sec),
      h("span",{text:fdate(a.date)}),
      h("span",{text:readTime(a.body)+" min"})
    ]);
    var t=h("h3",null,[h("button",{type:"button",text:a.title,onclick:function(){onOpen(a);}})]);
    return h("article",{class:"item "+a.type},[a.image?h("img",{class:"thumb",src:a.image,alt:"",loading:"lazy"}):null,meta,t,a.lead?h("p",{text:a.lead}):null,h("div",{class:"by",text:"Por "+(a.author||"Redacción")})]);
  }
  /* Vista previa en ventana (la usa la sala de redacción) */
  function openReader(a){
    var dlg=document.getElementById("reader"),body=document.getElementById("readerBody");
    body.textContent="";
    var box=h("div",{class:"reader "+a.type},[
      h("div",{class:"meta"},[
        h("span",{class:"chip",text:a.type==="ed"?"Editorial":"Noticia"}),
        a.live?h("span",{class:"chip live",text:"Último minuto"}):null,
        secChip(a.sec),
        h("span",{text:fdate(a.date)}),
        h("span",{text:readTime(a.body)+" min de lectura"})
      ]),
      a.image?h("img",{class:"hero",src:a.image,alt:a.title}):null,
      h("h1",{text:a.title}),
      a.lead?h("p",{class:"lead",text:a.lead}):null,
      h("div",{class:"byline"},[avatar(a),h("span",{text:"Por "+(a.author||"Redacción")})])
    ]);
    var txt=h("div",{class:"txt"});
    String(a.body||"").split(/\n\s*\n/).forEach(function(p){if(p.trim())txt.appendChild(h("p",{text:p.trim()}));});
    box.appendChild(txt);body.appendChild(box);
    body.appendChild(h("div",{class:"actions"},[h("button",{class:"btn",type:"button",text:"Cerrar vista previa",onclick:function(){dlg.close();}})]));
    if(!dlg.open)dlg.showModal();
  }
  var CREST_COLORS=["#5F0224","#1F4E8C","#2E6B4F","#B8862B","#7A4657","#8A2547"];
  function crest(name,img){
    var s=h("span",{class:"crest"});
    if(img){s.appendChild(h("img",{src:img,alt:""}));return s;}
    var n=String(name||"?"),k=0;for(var i=0;i<n.length;i++)k=(k*31+n.charCodeAt(i))%997;
    s.innerHTML='<svg viewBox="0 0 40 46" aria-hidden="true"><path d="M20 2l16 6v14c0 11-7 19-16 22C11 41 4 33 4 22V8z" fill="'+CREST_COLORS[k%CREST_COLORS.length]+'"/></svg>';
    s.appendChild(h("b",{text:initials(n.trim()==="" ? "?" : n)}));
    return s;
  }
  function matchCard(m,arts){
    var sc=(m.hs==null||m.as==null)?"vs":m.hs+"–"+m.as,live=m.status==="En vivo";
    var art=m.articleId?(arts||[]).filter(function(a){return a.id===m.articleId;})[0]:null;
    function team(n,img){return h("div",{class:"team"},[crest(n,img),document.createTextNode(n||"")]);}
    var top=h("div",{class:"mt"},[h("span",null,[icon(m.comp),document.createTextNode(m.comp)]),h("span",{class:live?"lv":"",text:m.status})]);
    var teams=h("div",{class:"teams"},[team(m.home,m.homeImg),h("div",{class:"score",text:sc}),team(m.away,m.awayImg)]);
    var nw=art?h("a",{class:"nw",href:"/a/"+art.id},[h("small",null,[icon("Noticias"),document.createTextNode("Crónica")]),document.createTextNode(art.title)])
      :h("span",{class:"nw no",text:"Aún sin crónica"});
    return h("article",{class:"mcard"},[top,teams,nw]);
  }
  window.DG={crest:crest,matchCard:matchCard,SEC:SEC,h:h,icon:icon,secChip:secChip,fdate:fdate,byDate:byDate,readTime:readTime,avatar:avatar,card:card,openReader:openReader,fixSec:fixSec};
})();
