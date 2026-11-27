(function(){
  var h=DG.h,$=function(s){return document.querySelector(s)};
  var list=[],st={type:"all",sec:"Todas",q:""};
  function open(a){DG.openReader(a,true);}
  function column(title,items,cls,emptyMsg){
    var c=h("section",null,[h("h2",{class:"col-title "+(cls||""),text:title})]);
    if(!items.length)c.appendChild(h("div",{class:"empty",text:emptyMsg}));
    items.forEach(function(a){c.appendChild(DG.card(a,false,open));});
    return c;
  }
  function render(){
    var l=$("#layout");l.textContent="";
    var q=st.q.trim().toLowerCase();
    var all=list.filter(function(a){
      if(st.sec!=="Todas"&&a.sec!==st.sec)return false;
      if(q&&(a.title+" "+a.lead+" "+a.body).toLowerCase().indexOf(q)<0)return false;
      return true;
    }).sort(DG.byDate);
    var news=all.filter(function(a){return a.type==="news";});
    var eds=all.filter(function(a){return a.type==="ed";});
    if(st.type==="all"){
      l.className="layout two";
      l.appendChild(column("Noticias",news,"","Todavía no hay noticias publicadas."));
      l.appendChild(column("Editoriales",eds,"ed","Todavía no hay editoriales publicadas."));
    }else{
      l.className="layout";var n=st.type==="news";
      l.appendChild(column(n?"Noticias":"Editoriales",n?news:eds,n?"":"ed","No hay artículos con este filtro."));
    }
  }
  function fromHash(){
    var m=/^#n-([A-Za-z0-9-]+)$/.exec(location.hash);
    if(!m)return;
    var a=list.filter(function(x){return x.id===m[1];})[0];
    if(a)DG.openReader(a,false);
  }
  var chipBtns=[];
  ["Todas"].concat(DG.SEC).forEach(function(s){
    var b=h("button",{type:"button",class:"chipbtn","aria-pressed":String(s==="Todas")},[DG.icon(s),document.createTextNode(s)]);
    b.addEventListener("click",function(){
      st.sec=s;chipBtns.forEach(function(x){x.b.setAttribute("aria-pressed",String(x.s===s));});render();
    });
    chipBtns.push({s:s,b:b});$("#secs").appendChild(b);
  });
  document.querySelectorAll("#fType button").forEach(function(b){b.addEventListener("click",function(){
    st.type=b.dataset.t;document.querySelectorAll("#fType button").forEach(function(x){x.setAttribute("aria-pressed",x===b);});render();});});
  $("#q").addEventListener("input",function(e){st.q=e.target.value;render();});
  window.addEventListener("hashchange",fromHash);
  fetch("/api/articles").then(function(r){if(!r.ok)throw 0;return r.json();}).then(function(d){
    list=Array.isArray(d)?d.map(DG.fixSec):[];render();fromHash();
  }).catch(function(){
    var l=$("#layout");l.className="layout";l.textContent="";
    l.appendChild(h("div",{class:"empty",text:"No pudimos cargar las noticias. Actualiza la página en unos segundos."}));
  });
})();
