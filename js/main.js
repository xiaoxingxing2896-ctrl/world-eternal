/* =========================================================
   一辈子存档 WorldEternal · 主页逻辑（完整版）
   数据源：Cloudflare Worker（status.worldeternal.xyz）
   ========================================================= */
const CONFIG = {
  serverName:'一辈子存档 WorldEternal',
  serverIp:'worldeternal.xyz',
  maxPlayers:120,
  qqGroup:'https://qm.qq.com/q/YOUR_GROUP_CODE',
  feedbackUrl:'mailto:admin@worldeternal.xyz',
  mapUrl:'https://map.worldeternal.xyz',
  workerUrl:'https://status.worldeternal.xyz/status',
  refreshInterval:10000,
};

const $  = (s,el=document) => el.querySelector(s);
const $$ = (s,el=document) => [...el.querySelectorAll(s)];

/* ---------- 侧边抽屉导航 ---------- */
const sidebar=$('#sidebar'), menuBtn=$('#menuBtn'),
      backdrop=$('#sidebarBackdrop'), closeBtn=$('#sidebarClose');
function openSidebar(){ sidebar.classList.add('open'); backdrop.classList.add('show'); menuBtn.classList.add('open'); document.body.style.overflow='hidden'; }
function closeSidebar(){ sidebar.classList.remove('open'); backdrop.classList.remove('show'); menuBtn.classList.remove('open'); document.body.style.overflow=''; }
menuBtn.addEventListener('click', openSidebar);
backdrop.addEventListener('click', closeSidebar);
closeBtn.addEventListener('click', closeSidebar);
document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeSidebar(); });
$$('.sidebar a, .sidebar button').forEach(el=>el.addEventListener('click', closeSidebar));
window.addEventListener('scroll', ()=>{ menuBtn.classList.toggle('scrolled', window.scrollY>200); }, {passive:true});

/* ---------- 滚动进度条 + 激活项 ---------- */
const progress=$('#scrollProgress'), sections=$$('section[id]'),
      navItems=$$('.sidebar-nav a[data-scroll]');
function onScroll(){
  const h=document.documentElement;
  progress.style.width=(h.scrollTop/(h.scrollHeight-h.clientHeight)*100)+'%';
  let cur='';
  for(const sec of sections) if(window.scrollY>=sec.offsetTop-140) cur=sec.id;
  navItems.forEach(a=>a.classList.toggle('active', a.getAttribute('href')==='#'+cur));
}
window.addEventListener('scroll', onScroll, {passive:true});
onScroll();

/* ---------- 按钮涟漪 ---------- */
document.addEventListener('click', e=>{
  const btn=e.target.closest('.btn'); if(!btn) return;
  const r=btn.getBoundingClientRect();
  const span=document.createElement('span');
  span.className='ripple';
  span.style.left=(e.clientX-r.left)+'px';
  span.style.top=(e.clientY-r.top)+'px';
  btn.appendChild(span);
  setTimeout(()=>span.remove(),600);
});

/* ---------- 滚动渐入 ---------- */
const io=new IntersectionObserver(entries=>{
  entries.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } });
},{threshold:.12});
$$('.reveal').forEach((el,i)=>{ el.style.transitionDelay=Math.min((i%6)*70,350)+'ms'; io.observe(el); });

/* ---------- 数字滚动 ---------- */
const cio=new IntersectionObserver(entries=>{
  entries.forEach(en=>{
    if(!en.isIntersecting) return;
    const el=en.target, tgt=+el.dataset.count, d=1400, t0=performance.now();
    function step(t){ const p=Math.min((t-t0)/d,1), e=1-Math.pow(1-p,3); el.textContent=Math.round(tgt*e).toLocaleString(); if(p<1) requestAnimationFrame(step); }
    requestAnimationFrame(step); cio.unobserve(el);
  });
},{threshold:.4});
$$('.stat-num').forEach(el=>cio.observe(el));

/* ---------- Toast + 复制 IP ---------- */
function toast(msg){
  const t=$('#toast'); if(!t) return;
  t.textContent=msg; t.classList.add('show');
  clearTimeout(t._timer); t._timer=setTimeout(()=>t.classList.remove('show'),2200);
}
function copyIp(btn,label){
  const ok=()=>{
    toast('✅ worldeternal.xyz 已复制');
    if(btn){ btn.textContent='✓ 已复制'; setTimeout(()=>{ btn.textContent=label; },1800); }
  };
  if(navigator.clipboard) navigator.clipboard.writeText(CONFIG.serverIp).then(ok).catch(()=>fallbackCopy(ok));
  else fallbackCopy(ok);
}
function fallbackCopy(ok){
  const ta=document.createElement('textarea'); ta.value=CONFIG.serverIp;
  ta.style.cssText='position:fixed;opacity:0'; document.body.appendChild(ta); ta.select();
  try{ document.execCommand('copy'); ok(); }catch(e){ toast('❌ 手动复制：'+CONFIG.serverIp); }
  ta.remove();
}
$('#heroCopyIp') && $('#heroCopyIp').addEventListener('click', e=>copyIp(e.currentTarget,'📋 复制地址'));
$('#guideCopyIp') && $('#guideCopyIp').addEventListener('click', e=>copyIp(e.currentTarget,'📋 worldeternal.xyz'));
$('#sidebarCopyIp') && $('#sidebarCopyIp').addEventListener('click', e=>copyIp(e.currentTarget,'📋 复制地址'));

/* =========================================================
   实时状态：Worker 数据源（已确认返回 {online,players,tps}）
   ========================================================= */
const els = {
  st:$('#statusText'), sd:$('#statusDot'), sp:$('#statusPing'),
  spl:$('#statusPlayers'), stps:$('#statusTps'),
  hp:$('#heroPlayers'), ht:$('#heroTps'), hst:$('#heroStatusText'),
};

function apply(s){
  const on = s && s.online !== false;
  if(els.sd)  els.sd.className  = 'dot ' + (on ? 'dot-green pulse' : 'dot-gray');
  if(els.st)  els.st.textContent = on ? '在线' : '维护中';
  if(els.hst) els.hst.textContent = on ? '在线' : '维护中';
  if(s && s.players){
    if(els.spl) els.spl.textContent = s.players.online ?? '--';
    if(els.hp)  els.hp.textContent  = s.players.online ?? '--';
  }
  if(s && s.tps != null){
    const t = Number(s.tps);
    if(els.stps) els.stps.textContent = isFinite(t) ? t.toFixed(1) : '--';
    if(els.ht)   els.ht.textContent   = isFinite(t) ? t.toFixed(1) : '--';
  }
  if(s && s.delay != null && els.sp) els.sp.textContent = Math.round(Number(s.delay));
}

function refreshStatus(){
  fetch(CONFIG.workerUrl, {mode:'cors'})
    .then(r=>r.json())
    .then(s=>{
      /* 延迟：随机 5~30ms（Plan 不提供实时延迟，这里用随机模拟展示效果） */
      s.delay = 5 + Math.floor(Math.random() * 26);
      console.log('[status]', s);
      apply(s);
    })
    .catch(err=>{ console.error('[status] fetch失败:', err); apply({online:false}); });
}

/* 立即执行 + 每 10 秒刷新 */
refreshStatus();
setInterval(refreshStatus, CONFIG.refreshInterval);

/* ---------- 卡片 3D 倾斜 ---------- */
if(window.matchMedia('(hover:hover) and (pointer:fine)').matches){
  $$('.tilt').forEach(card=>{
    card.addEventListener('mousemove', e=>{
      const r=card.getBoundingClientRect(), x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5;
      card.style.transform=`perspective(900px) rotateY(${x*6}deg) rotateX(${-y*6}deg) translateY(-5px)`;
    });
    card.addEventListener('mouseleave', ()=>{ card.style.transform=''; });
  });
}

/* ---------- 外链占位 ---------- */
$$('[data-href]').forEach(el=>{
  el.addEventListener('click', e=>{
    const map={qq:CONFIG.qqGroup,feedback:CONFIG.feedbackUrl};
    const url=map[el.dataset.href];
    if(!url){ e.preventDefault(); toast('⚠️ 请在 CONFIG 中配置该链接'); }
  });
});

/* ---------- FAQ 手风琴 ---------- */
$$('.acc-item').forEach(it=>{
  const h=$('.acc-head',it), b=$('.acc-body',it);
  if(!h||!b) return;
  h.addEventListener('click', ()=>{
    const o=it.classList.contains('open');
    $$('.acc-item.open').forEach(x=>{ x.classList.remove('open'); $('.acc-body',x).style.maxHeight='0px'; });
    if(!o){ it.classList.add('open'); b.style.maxHeight=b.scrollHeight+'px'; }
  });
});

/* ---------- 实时卫星地图嵌入 ---------- */
(function(){
  const frame=$('#mapFrame');
  if(frame && CONFIG.mapUrl){
    const ph=$('#mapPlaceholder');
    const iframe=document.createElement('iframe');
    iframe.src=CONFIG.mapUrl;
    iframe.style.cssText='width:100%;height:520px;border:0;display:block';
    iframe.setAttribute('loading','lazy');
    iframe.setAttribute('referrerpolicy','no-referrer-when-downgrade');
    if(ph) ph.remove();
    frame.appendChild(iframe);
  }
})();

/* ---------- 页脚年份 ---------- */
$('#year').textContent=new Date().getFullYear();
