/* =========================================================
   一辈子存档 · 路网规划 / 交通设施数据库（细化版）
   信息架构与云中城 facilities.html 同构
   ========================================================= */
const STORAGE_KEY='worldeternal_network_v2';

const DEFAULT_NETWORK={
  meta:{name:'一辈子存档 · 交通路网与设施数据库',version:2},
  stations:[
    {id:'hub',name:'主城站',world:'主世界',x:400,y:235,icon:'🏰',owner:'',category:'公共设施',output:[],tips:'全服交通枢纽与出生点，各线路以此为中心，设有复活点与物资补给箱。',coords:'X:0,Y:70,Z:0',depend:'—',transport:'出生点正前方即为主城传送点，全服线路由此辐射。'},
    {id:'mob-farm',name:'刷怪塔',world:'主世界',x:150,y:130,icon:'🧟',owner:'',category:'机器',output:['火药','骨头','腐肉','线','箭'],tips:'全自动刷怪塔，适合夜间挂机，请从塔顶挂机点进入。',coords:'X:-561,Y:80,Z:-1076',depend:'主城站',transport:'主城冰道西线，刷怪塔站出站步行至塔底挂机点。'},
    {id:'sea-temple',name:'海神殿',world:'主世界',x:200,y:360,icon:'🌊',owner:'',category:'地标',output:['海绵','海洋之心材料'],tips:'海底神殿遗迹，探索时请备好水下呼吸与夜视。',coords:'X:-495,Y:184,Z:-1214',depend:'主城站',transport:'主城冰道西线尽头，出站后向西南飞行约600格到达。'},
    {id:'iron-farm',name:'刷铁机',world:'主世界',x:640,y:130,icon:'🤖',owner:'',category:'机器',output:['铁锭'],tips:'经典刷铁机，稳定产出铁锭，一人即可维护。',coords:'X:195,Y:67,Z:365',depend:'主城站',transport:'主城冰道东线，刷铁机站出站即达。'},
    {id:'iron-farm-2',name:'刷铁机2',world:'主世界',x:600,y:260,icon:'⚙️',owner:'',category:'机器',output:['铁锭','虞美人'],tips:'双核刷铁机，支持多人同时挂机。',coords:'X:65,Y:96,Z:624',depend:'村民交易所',transport:'冰道东线村民交易所站出站，步行约50格即达。'},
    {id:'trading-hall',name:'村民交易所',world:'主世界',x:625,y:355,icon:'💰',owner:'q2qwq',category:'公共设施',output:['附魔书','绿宝石'],tips:'不要动别的箱子、拉杆和按钮。交易每日刷新，铁砧与工作台齐备。',coords:'X:43,Y:55,Z:574',depend:'主城站',transport:'主城冰道东线，村民交易所站出站即达。'}
  ],
  edges:[['hub','mob-farm'],['hub','sea-temple'],['hub','iron-farm'],['hub','trading-hall'],['trading-hall','iron-farm-2'],['iron-farm','iron-farm-2']]
};

/* ---------- 工具 ---------- */
const $=(s,el=document)=>el.querySelector(s);
const $$=(s,el=document)=>[...el.querySelectorAll(s)];
function toast(m){ const t=$('#toast'); t.textContent=m; t.classList.add('show'); clearTimeout(t._t); t._t=setTimeout(()=>t.classList.remove('show'),2400); }
function esc(s){ return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function norm(st){
  return {
    id:st.id||'s_'+Math.random().toString(36).slice(2,8), name:st.name||'未命名', world:st.world||'主世界',
    x:Math.min(800,Math.max(0,Number(st.x)||400)), y:Math.min(470,Math.max(0,Number(st.y)||235)),
    icon:st.icon||'📍', owner:st.owner||'', category:st.category||'机器',
    output:Array.isArray(st.output)?st.output:(st.output?String(st.output).split(/[,，]/).map(s=>s.trim()).filter(Boolean):[]),
    tips:st.tips||st.desc||'', coords:st.coords||'', depend:st.depend||'', transport:st.transport||'',
  };
}

/* ---------- 数据持久化 ---------- */
let network=loadNetwork();
function loadNetwork(){
  try{ const r=localStorage.getItem(STORAGE_KEY); if(r){ const d=JSON.parse(r); if(d&&Array.isArray(d.stations)&&Array.isArray(d.edges)){ d.stations=d.stations.map(norm); return d; } } }catch(e){}
  return JSON.parse(JSON.stringify(DEFAULT_NETWORK));
}
function saveNetwork(){ localStorage.setItem(STORAGE_KEY,JSON.stringify(network)); }

/* ---------- 状态 ---------- */
let kw='', wf='全部', sel=null;

/* ---------- SVG 路网 ---------- */
const svg=$('#mapSvg'), NS='http://www.w3.org/2000/svg';
function renderMap(){
  svg.innerHTML='';
  const ss=network.stations, es=network.edges;
  ss.forEach(s=>{ const l=document.createElementNS(NS,'text'); l.setAttribute('x',s.x); l.setAttribute('y',s.y-26); l.setAttribute('text-anchor','middle'); l.setAttribute('class','map-label'); l.textContent=s.name; svg.appendChild(l); });
  es.forEach(([a,b])=>{ const A=ss.find(s=>s.id===a),B=ss.find(s=>s.id===b); if(!A||!B) return; const ln=document.createElementNS(NS,'line'); ln.setAttribute('x1',A.x); ln.setAttribute('y1',A.y); ln.setAttribute('x2',B.x); ln.setAttribute('y2',B.y); ln.setAttribute('class','map-edge'); ln.dataset.from=a; ln.dataset.to=b; svg.appendChild(ln); });
  ss.forEach(s=>{ const g=document.createElementNS(NS,'g'); g.setAttribute('class','map-station'); g.dataset.id=s.id; const c=document.createElementNS(NS,'circle'); c.setAttribute('cx',s.x); c.setAttribute('cy',s.y); c.setAttribute('r',16); g.appendChild(c); const i=document.createElementNS(NS,'text'); i.setAttribute('x',s.x); i.setAttribute('y',s.y+5); i.setAttribute('text-anchor','middle'); i.setAttribute('class','st-icon'); i.textContent=s.icon||'📍'; g.appendChild(i); g.addEventListener('click',()=>selectStation(s)); svg.appendChild(g); });
  $('#mapCount').textContent=`${ss.length} 个设施 · ${es.length} 条线路`;
}
function selectStation(s){
  sel=s.id;
  $$('.map-station.active',svg).forEach(n=>n.classList.remove('active'));
  $$('.map-edge.active',svg).forEach(e=>e.classList.remove('active'));
  const g=$(`.map-station[data-id="${s.id}"]`,svg); if(g) g.classList.add('active');
  network.edges.filter(([a,b])=>a===s.id||b===s.id).forEach(([a,b])=>{
    $$(`.map-edge[data-from="${a}"][data-to="${b}"],.map-edge[data-from="${b}"][data-to="${a}"]`,svg).forEach(e=>e.classList.add('active'));
  });
  const card=$(`.facility-card[data-id="${s.id}"]`);
  if(card){ card.scrollIntoView({behavior:'smooth',block:'center'}); card.classList.add('flash'); setTimeout(()=>card.classList.remove('flash'),1600); }
}

/* ---------- 列表 ---------- */
function renderList(){
  const list=$('#facilityList'), lk=kw.trim().toLowerCase();
  const fd=network.stations.filter(s=>{
    if(wf!=='全部'&&s.world!==wf) return false;
    if(!lk) return true;
    return [s.name,s.owner,s.category,s.tips,s.depend,s.transport,s.coords,...(s.output||[])].join(' ').toLowerCase().includes(lk);
  });
  $('#listEmpty').hidden=fd.length!==0;
  $('#listCount').textContent=`共 ${fd.length} 条`;
  list.innerHTML=fd.map(s=>`
    <article class="facility-card card" data-id="${s.id}">
      <div class="facility-head">
        <div class="facility-title">
          <span class="facility-icon">${s.icon||'📍'}</span>
          <div>
            <h3>${esc(s.name)}${s.owner?` <span class="owner-inline">(${esc(s.owner)})</span>`:''}</h3>
            <div class="facility-tags">
              <span class="facility-world-badge">${esc(s.world)}</span>
              <span class="facility-cat-badge">${esc(s.category)}</span>
            </div>
          </div>
        </div>
        <div class="facility-actions">
          ${s.owner?`<button class="owner-chip" data-owner="${esc(s.owner)}">${esc(s.owner)}（点击复制QQ）</button>`:''}
          <button class="icon-del-btn" data-del="${s.id}" title="删除">🗑</button>
        </div>
      </div>
      ${(s.output&&s.output.length)?`<div class="facility-output"><span class="output-key">产出</span><span class="output-chips">${s.output.map(o=>`<span class="out-chip">${esc(o)}</span>`).join('')}</span></div>`:''}
      ${s.tips?`<div class="facility-tips"><p>${esc(s.tips)}</p></div>`:''}
      <div class="facility-meta">
        ${s.coords?`<span class="meta-chip">📍 坐标 ${esc(s.coords)}</span>`:''}
        ${s.depend&&s.depend!=='—'?`<span class="meta-chip">🚉 依赖站点 ${esc(s.depend)}</span>`:''}
      </div>
      ${s.transport?`<div class="facility-transport"><p>${esc(s.transport)}</p></div>`:''}
    </article>
  `).join('');
  $$('.facility-card',list).forEach(card=>{
    card.addEventListener('click',e=>{ if(e.target.closest('.owner-chip')||e.target.closest('.icon-del-btn')) return; const st=network.stations.find(s=>s.id===card.dataset.id); if(st) selectStation(st); });
  });
  $$('.owner-chip',list).forEach(ch=>{ ch.addEventListener('click',()=>{ navigator.clipboard?.writeText(ch.dataset.owner).then(()=>toast(`✅ 已复制 QQ：${ch.dataset.owner}`),()=>toast(`QQ：${ch.dataset.owner}`)); }); });
  $$('.icon-del-btn',list).forEach(b=>{ b.addEventListener('click',e=>{ e.stopPropagation(); const id=b.dataset.del; if(!confirm('确定删除？')) return; network.stations=network.stations.filter(s=>s.id!==id); network.edges=network.edges.filter(([a,b])=>a!==id&&b!==id); saveNetwork(); renderMap(); renderList(); toast('🗑 已删除'); }); });
}

/* ---------- 搜索/筛选 ---------- */
$('#searchInput').addEventListener('input',e=>{ kw=e.target.value; renderList(); });
$$('#worldTabs .tab').forEach(t=>{ t.addEventListener('click',()=>{ $$('#worldTabs .tab').forEach(x=>x.classList.remove('active')); t.classList.add('active'); wf=t.dataset.world; renderList(); }); });

/* ---------- 导入/导出/示例 ---------- */
const importFile=$('#importFile');
$('#importBtn').addEventListener('click',()=>importFile.click());
importFile.addEventListener('change',e=>{
  const f=e.target.files[0]; if(!f) return;
  const r=new FileReader(); r.onload=ev=>{
    try{ const d=JSON.parse(ev.target.result); if(!Array.isArray(d.stations)||!Array.isArray(d.edges)) throw new Error('格式错误'); d.stations=d.stations.map(norm); network=d; saveNetwork(); renderMap(); renderList(); toast(`✅ 已导入：${d.stations.length} 个设施 / ${d.edges.length} 条线路`); }catch{ toast('❌ 格式不正确'); }
  }; r.readAsText(f); e.target.value='';
});
$('#exportBtn').addEventListener('click',()=>{
  const b=new Blob([JSON.stringify(network,null,2)],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download='worldeternal-facilities.json'; a.click(); URL.revokeObjectURL(a.href); toast('📤 已导出');
});
$('#sampleBtn').addEventListener('click',()=>{
  const b=new Blob([JSON.stringify(DEFAULT_NETWORK,null,2)],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download='worldeternal-sample.json'; a.click(); URL.revokeObjectURL(a.href); toast('📄 示例已下载');
});

/* ---------- 弹窗 ---------- */
const overlay=$('#modalOverlay'), form=$('#addForm'), submitBtn=$('#formSubmit');
function openModal(){ overlay.classList.add('open'); document.body.style.overflow='hidden'; }
function closeModal(){ overlay.classList.remove('open'); document.body.style.overflow=''; form.reset(); submitBtn.disabled=false; }
$('#addBtn').addEventListener('click', openModal);
$('#modalClose').addEventListener('click', closeModal);
$('#formCancel').addEventListener('click', closeModal);
overlay.addEventListener('click', e=>{ if(e.target===overlay) closeModal(); });
form.addEventListener('submit', e=>{
  e.preventDefault();
  submitBtn.disabled=true;
  const fd=new FormData(form);
  const st=norm({id:'s_'+Date.now().toString(36),name:fd.get('name'),icon:fd.get('icon'),world:fd.get('world'),category:fd.get('category'),owner:fd.get('owner'),x:Number(fd.get('x')),y:Number(fd.get('y')),coords:fd.get('coords'),output:fd.get('output'),depend:fd.get('depend'),tips:fd.get('tips'),transport:fd.get('transport')});
  network.stations.push(st);
  saveNetwork(); renderMap(); renderList(); closeModal();
  toast(`✅ 已登记：${st.name}`);
  selectStation(st);
});

/* ---------- 侧边导航 ---------- */
const sbar=$('#sidebar'), mbtn=$('#menuBtn'), back=$('#sidebarBackdrop'), cbtn=$('#sidebarClose');
function os(){ sbar.classList.add('open'); back.classList.add('show'); mbtn.classList.add('open'); document.body.style.overflow='hidden'; }
function cs(){ sbar.classList.remove('open'); back.classList.remove('show'); mbtn.classList.remove('open'); document.body.style.overflow=''; }
mbtn.addEventListener('click',os); back.addEventListener('click',cs); cbtn.addEventListener('click',cs);
document.addEventListener('keydown', e=>{ if(e.key==='Escape') cs(); });
$$('.sidebar a,.sidebar button').forEach(el=>el.addEventListener('click',cs));
window.addEventListener('scroll',()=>{ mbtn.classList.toggle('scrolled',window.scrollY>200); },{passive:true});

/* ---------- 滚动进度条 ---------- */
const pbar=$('#scrollProgress');
window.addEventListener('scroll',()=>{ const h=document.documentElement; pbar.style.width=(h.scrollTop/(h.scrollHeight-h.clientHeight)*100)+'%'; },{passive:true});

/* ---------- 启动 ---------- */
renderMap(); renderList();
