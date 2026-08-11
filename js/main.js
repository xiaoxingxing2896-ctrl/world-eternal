/* =========================================================
   一辈子存档 WorldEternal · 主页逻辑（细化版）
   ========================================================= */
const CONFIG = {
  serverName:'一辈子存档 WorldEternal',
  serverIp:'worldeternal.xyz',
  maxPlayers:120,
  qqGroup:'https://qm.qq.com/q/YOUR_GROUP_CODE',
  feedbackUrl:'mailto:admin@worldeternal.xyz',
  mapUrl:'',
  statusApi:'',
  statusPingApi:'',
  refreshInterval:10000,
};

/* ---------- DOM 工具 ---------- */
const $  = (s,el=document) => el.querySelector(s);
const $$ = (s,el=document) => [...el.querySelectorAll(s)];

/* =========================================================
   侧边灵动抽屉导航（公共逻辑）
   ========================================================= */
const sidebar   = $('#sidebar');
const menuBtn   = $('#menuBtn');
const backdrop  = $('#sidebarBackdrop');
const closeBtn  = $('#sidebarClose');

function openSidebar(){
  sidebar.classList.add('open');
  backdrop.classList.add('show');
  menuBtn.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeSidebar(){
  sidebar.classList.remove('open');
  backdrop.classList.remove('show');
  menuBtn.classList.remove('open');
  document.body.style.overflow = '';
}
menuBtn.addEventListener('click', openSidebar);
backdrop.addEventListener('click', closeSidebar);
closeBtn.addEventListener('click', closeSidebar);
document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeSidebar(); });
$$('.sidebar a, .sidebar button').forEach(el=>el.addEventListener('click', closeSidebar));

/* 菜单按钮滚动变半透明 */
window.addEventListener('scroll', ()=>{
  menuBtn.classList.toggle('scrolled', window.scrollY>200);
}, {passive:true});

/* ---------- 滚动进度条 + 侧边激活项 ---------- */
const progress = $('#scrollProgress');
const sections = $$('section[id]');
const navItems = $$('.sidebar-nav a[data-scroll]');

function onScroll(){
  const h = document.documentElement;
  progress.style.width = (h.scrollTop/(h.scrollHeight-h.clientHeight)*100)+'%';
  let cur = '';
  for(const sec of sections) if(window.scrollY >= sec.offsetTop-140) cur = sec.id;
  navItems.forEach(a=>a.classList.toggle('active', a.getAttribute('href')==='#'+cur));
}
window.addEventListener('scroll', onScroll, {passive:true});
onScroll();

/* ---------- 按钮涟漪 ---------- */
document.addEventListener('click', e=>{
  const btn = e.target.closest('.btn');
  if(!btn) return;
  const r = btn.getBoundingClientRect();
  const span = document.createElement('span');
  span.className='ripple';
  span.style.left=(e.clientX-r.left)+'px';
  span.style.top=(e.clientY-r.top)+'px';
  btn.appendChild(span);
  setTimeout(()=>span.remove(), 600);
});

/* ---------- 滚动渐入 ---------- */
const io = new IntersectionObserver(entries=>{
  entries.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } });
},{threshold:.12});
$$('.reveal').forEach((el,i)=>{ el.style.transitionDelay=Math.min((i%6)*70,350)+'ms'; io.observe(el); });

/* ---------- 数字滚动 ---------- */
const cio = new IntersectionObserver(entries=>{
  entries.forEach(en=>{
    if(!en.isIntersecting) return;
    const el=en.target, tgt=+el.dataset.count, d=1400, t0=performance.now();
    function step(t){ const p=Math.min((t-t0)/d,1), e=1-Math.pow(1-p,3); el.textContent=Math.round(tgt*e).toLocaleString(); if(p<1) requestAnimationFrame(step); }
    requestAnimationFrame(step); cio.unobserve(el);
  });
},{threshold:.4});
$$('.stat-num').forEach(el=>cio.observe(el));

/* ---------- 复制 IP ---------- */
function copyIp(btn, label='📋 复制地址'){
  const ok=()=>{
    toast('✅ worldeternal.xyz 已复制');
    if(btn){ btn.textContent='✓ 已复制'; setTimeout(()=>{ btn.textContent=label; },1800); }
  };
  if(navigator.clipboard) navigator.clipboard.writeText(CONFIG.serverIp).then(ok).catch(()=>fallback(ok));
  else fallback(ok);
}
function fallback(ok){
  const ta=document.createElement('textarea'); ta.value=CONFIG.serverIp;
  ta.style.cssText='position:fixed;opacity:0'; document.body.appendChild(ta); ta.select();
  try{document.execCommand('copy'); ok()}catch(e){toast('❌ 手动复制：'+CONFIG.serverIp)} ta.remove();
}
function toast(msg){
  const t=$('#toast'); t.textContent=msg; t.classList.add('show');
  clearTimeout(t._timer); t._timer=setTimeout(()=>t.classList.remove('show'),2200);
}
$('#heroCopyIp').addEventListener('click', e=>copyIp(e.currentTarget));
$('#guideCopyIp').addEventListener('click', e=>copyIp(e.currentTarget,'📋 worldeternal.xyz'));
$('#sidebarCopyIp').addEventListener('click', e=>copyIp(e.currentTarget,'📋 复制地址'));

/* ---------- 实时状态 ---------- */
const els={
  st:$('#statusText'), sd:$('#statusDot'), sp:$('#statusPing'), spl:$('#statusPlayers'), stps:$('#statusTps'),
  hp:$('#heroPlayers'), ht:$('#heroTps'), hst:$('#heroStatusText'),
};
function apply(s){
  const on=s.online!==false;
  els.sd.className='dot '+(on?'dot-green pulse':'dot-gray');
  els.st.textContent=on?'在线':'维护中'; els.hst.textContent=on?'在线':'维护中';
  if(s.players){ els.spl.textContent=s.players.online??'--'; els.hp.textContent=s.players.online??'--'; }
  if(s.tps!=null){ const t=Number(s.tps); els.stps.textContent=isFinite(t)?t.toFixed(1):'--'; els.ht.textContent=isFinite(t)?t.toFixed(1):'--'; }
  if(s.delay!=null) els.sp.textContent=Math.round(Number(s.delay));
}
async function fj(u){ const r=await fetch(u,{mode:'cors'}); if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); }
function refresh(){
  const m={};
  const t=[];
  if(CONFIG.statusApi) t.push(fj(CONFIG.statusApi).then(d=>{ m.online=(d.online??true)!==false; m.players=d.players; m.tps=d.tps; }).catch(()=>{}));
  if(CONFIG.statusPingApi) t.push(fj(CONFIG.statusPingApi).then(d=>{ if(m.online===undefined) m.online=d.online!==false; m.players=m.players||d.players; if(m.delay===undefined) m.delay=d.delay; }).catch(()=>{}));
  if(!t.length){ sim(); return; }
  Promise.allSettled(t).then(()=>{ if(!Object.keys(m).length){ sim(); return; } apply(m); });
}
function sim(){ apply({online:true,players:{online:Math.floor(3+Math.random()*15)},tps:19.7+Math.random()*.3,delay:8+Math.random()*18}); }
refresh(); setInterval(refresh, CONFIG.refreshInterval);

/* ---------- 3D 倾斜（仅桌面 hover 设备） ---------- */
if(window.matchMedia('(hover:hover) and (pointer:fine)').matches){
  $$('.tilt').forEach(card=>{
    card.addEventListener('mousemove', e=>{
      const r=card.getBoundingClientRect(), x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5;
      card.style.transform=`perspective(900px) rotateY(${x*6}deg) rotateX(${-y*6}deg) translateY(-5px)`;
    });
    card.addEventListener('mouseleave', ()=>{ card.style.transform=''; });
  });
}

/* ---------- 外链 / 占位 ---------- */
function resolve(k){
  const map={qq:CONFIG.qqGroup,feedback:CONFIG.feedbackUrl,map:CONFIG.mapUrl||CONFIG.feedbackUrl};
  return map[k]||'#';
}
$$('[data-href]').forEach(el=>{
  el.addEventListener('click', e=>{ const u=resolve(el.dataset.href); if(u==='#'){ e.preventDefault(); toast('⚠️ 请在 CONFIG 中配置该链接'); } });
});

/* ---------- FAQ 手风琴 ---------- */
$$('.acc-item').forEach(it=>{
  const h=$('.acc-head',it), b=$('.acc-body',it);
  h.addEventListener('click', ()=>{
    const o=it.classList.contains('open');
    $$('.acc-item.open').forEach(x=>{ x.classList.remove('open'); $('.acc-body',x).style.maxHeight='0px'; });
    if(!o){ it.classList.add('open'); b.style.maxHeight=b.scrollHeight+'px'; }
  });
});

/* ---------- 实时地图嵌入 ---------- */
(function(){
  const frame=$('#mapFrame');
  if(CONFIG.mapUrl){
    const iframe=document.createElement('iframe');
    iframe.src=CONFIG.mapUrl;
    iframe.style.cssText='width:100%;height:520px;border:0;display:block';
    iframe.setAttribute('loading','lazy');
    iframe.setAttribute('referrerpolicy','no-referrer-when-downgrade');
    $('#mapPlaceholder').remove();
    frame.appendChild(iframe);
  }
})();

/* ---------- 年份 ---------- */
$('#year').textContent=new Date().getFullYear();
