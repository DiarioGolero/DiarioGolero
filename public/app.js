(function(){
  var m=/^#n-([A-Za-z0-9-]+)$/.exec(location.hash);
  if(m){location.replace("/a/"+m[1]);return;}
  var h=DG.h,$=function(s){return document.querySelector(s)};
  var G=["linear-gradient(135deg,#5F0224,#2B0A15)","linear-gradient(135deg,#7A4657,#5F0224)","linear-gradient(135deg,#2B0A15,#7A4657)","linear-gradient(135deg,#8A2547,#5F0224)"];
  var PAGE=13;
  var list=[],views={},results=[],ccounts={},st={type:"all",sec:"Todas",q:"",shown:PAGE};

  function getJson(u,fb){return fetch(u).then(function(r){if(!r.ok)throw 0;return r.json();}).catch(function(){return fb;});}

  function renderResults(){
    var wrap=$("#resWrap"),row=$("#mrow");row.textContent="";
    if(!results.length){wrap.hidden=true;return;}
    wrap.hidden=false;
    results.forEach(function(r){row.appendChild(DG.matchCard(r,list));});
  }
  function ordered(items){
    var s=items.slice().sort(DG.byDate);
    var f=s.filter(function(a){return a.featured;})[0];
    if(f)s=[f].concat(s.filter(function(a){return a!==f;}));
    return s;
  }
  function tile(a,i){
    var ed=a.type==="ed";
    var el=h("a",{class:"tile p"+(i%10)+(ed?" ed":""),href:"/a/"+a.id});
    if(!ed){
      if(a.image)el.style.backgroundImage='url("'+a.image+'")';
      else el.style.setProperty("--g",G[i%4]);
    }
    if(!a.image||ed)el.appendChild(h("span",{class:"wm"},[DG.icon(a.sec)]));
    var nc=ccounts[a.id]||0;
    var by=h("div",{class:"by"},[DG.avatar(a),h("span",{text:(a.author||"Redacción")+" · "+DG.readTime(a.body)+" min"}),nc>0?h("span",{class:"cc"},[DG.icon("Comentarios"),document.createTextNode(String(nc))]):null]);
    el.appendChild(h("div",{class:"tx"},[
      h("div",null,[a.live?h("span",{class:"live",text:"Último minuto"}):null,ed?h("span",{class:"chip",text:"Editorial"}):DG.secChip(a.sec)]),
      h("h3",{text:ed?"“"+a.title+"”":a.title}),
      by
    ]));
    return el;
  }
  function renderMosaic(){
    var box=$("#mosaic");box.textContent="";
    var q=st.q.trim().toLowerCase();
    var all=ordered(list.filter(function(a){
      if(st.type!=="all"&&a.type!==st.type)return false;
      if(st.sec!=="Todas"&&a.sec!==st.sec)return false;
      if(q&&(a.title+" "+a.lead+" "+a.body).toLowerCase().indexOf(q)<0)return false;
      return true;
    }));
    if(!all.length){box.appendChild(h("div",{class:"empty",text:list.length?"No hay notas con este filtro.":"Todavía no hay notas publicadas."}));}
    all.slice(0,st.shown).forEach(function(a,i){box.appendChild(tile(a,i));});
    $("#more").hidden=all.length<=st.shown;
  }
  function renderTop(){
    var ol=$("#top");ol.textContent="";
    var pool=list.slice(),has=pool.some(function(a){return (views[a.id]||0)>0;});
    pool.sort(has?function(a,b){return (views[b.id]||0)-(views[a.id]||0)||b.date-a.date;}:DG.byDate);
    $("#rail").hidden=!pool.length;
    pool.slice(0,5).forEach(function(a){
      var n=views[a.id]||0;
      ol.appendChild(h("li",null,[h("div",null,[DG.secChip(a.sec),h("a",{href:"/a/"+a.id,text:a.title}),n>0?h("span",{class:"by",text:n.toLocaleString("es")+" lecturas"}):null])]));
    });
  }

  /* burbujas verticales: tipo de contenido */
  var bb=$("#bubbles");
  [["all","Todo","Todo"],["news","Noticias","Noticias"],["ed","Editoriales","Editoriales"]].forEach(function(x){
    var b=h("button",{type:"button",class:"bub","aria-pressed":String(x[0]==="all")},[h("span",{class:"c"},[DG.icon(x[2])]),h("span",{text:x[1]})]);
    b.addEventListener("click",function(){
      st.type=x[0];st.shown=PAGE;bb.querySelectorAll(".bub").forEach(function(y){y.setAttribute("aria-pressed",String(y===b));});renderMosaic();
    });
    bb.appendChild(b);
  });
  /* filtro por sección */
  var chipBtns=[];
  ["Todas"].concat(DG.SEC).forEach(function(s){
    var b=h("button",{type:"button",class:"chipbtn","aria-pressed":String(s==="Todas")},[DG.icon(s),document.createTextNode(s)]);
    b.addEventListener("click",function(){
      st.sec=s;st.shown=PAGE;chipBtns.forEach(function(x){x.b.setAttribute("aria-pressed",String(x.s===s));});renderMosaic();
    });
    chipBtns.push({s:s,b:b});$("#secs").appendChild(b);
  });
  $("#q").addEventListener("input",function(e){st.q=e.target.value;st.shown=PAGE;renderMosaic();});
  $("#more").addEventListener("click",function(){st.shown+=12;renderMosaic();});

  Promise.all([
    fetch("/api/articles").then(function(r){if(!r.ok)throw 0;return r.json();}),
    getJson("/api/views",{}),
    getJson("/api/results",[]),
    getJson("/api/comments",{})
  ]).then(function(r){
    list=Array.isArray(r[0])?r[0].map(DG.fixSec):[];
    views=r[1]&&typeof r[1]==="object"?r[1]:{};
    results=Array.isArray(r[2])?r[2]:[];
    ccounts=r[3]&&typeof r[3]==="object"&&!Array.isArray(r[3])?r[3]:{};
    renderResults();renderMosaic();renderTop();
  }).catch(function(){
    var b=$("#mosaic");b.textContent="";
    b.appendChild(h("div",{class:"empty",text:"No pudimos cargar las noticias. Actualiza la página en unos segundos."}));
    $("#rail").hidden=true;
  });
})();
