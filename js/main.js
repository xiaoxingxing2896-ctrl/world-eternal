/* =========================================================
   云屿 CloudIsle · 交互逻辑
   顶部 CONFIG 为自定义配置区，部署时请替换为你的真实信息
   ========================================================= */

const CONFIG = {
  serverName: '云屿 CloudIsle',
  serverIp: 'play.cloudisle.example',      // ← 替换为你的服务器地址
  serverPort: 25565,                        // 基岩版端口（如启用 Geyser）
  mcVersion: '1.20.x - 1.21.x',             // 支持的版本
  maxPlayers: 120,                          // 最大玩家数
  // ↓ 替换为你的真实链接
  qqGroup: 'https://qm.qq.com/q/YOUR_GROUP_CODE',
  quizUrl: 'https://quiz.your-server.com/quiz',
  docsUrl: 'https://docs.qq.com/doc/YOUR_DOC_ID',
  feedbackUrl: 'mailto:admin@your-server.com',
  supportUrl: 'https://afdian.com/a/your-server',   // 赞助入口（爱发电等）
  mapUrl: '',                               // 留空显示占位；填入 Dynmap/BlueMap 地址后自动嵌入
  // 状态 API：留空 = 演示模式（模拟数据）；填写后自动请求
  // 期望返回 JSON: { online:bool, players:{online:int,max:int}, tps:number, ms:number }
  statusApi: '',
  refreshInterval: 10000,                   // 状态刷新间隔（毫秒）
};

/* ---------- 工具 ---------- */
const $  = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => [...el.querySelectorAll(s)];

function toast(msg){
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(()=>t.classList.remove('show'), 2200);
}

/* 外链统一处理（data-href 指向 CONFIG 键） */
function resolveHref(key){
  const map = {
    qq: CONFIG.qqGroup, quiz: CONFIG.quizUrl, docs: CONFIG.docsUrl,
    feedback: CONFIG.feedbackUrl, support: CONFIG.supportUrl, map: CONFIG.mapUrl || CONFIG.feedbackUrl,
  };
  return map[key] || '#';
}

/* ---------- 导航栏滚动效果 + 滚动进度 + 激活链接 ---------- */
const navbar = $('#navbar');
const progress = $('#scrollProgress');
const sections = $$('section[id]');
const navAnchors = $$('.nav-links a, .mobile-menu nav a');

function onScroll(){
  navbar.classList.toggle('scrolled', window.scrollY > 30);
  const h = document.documentElement;
  const pct = h.scrollTop / (h.scrollHeight - h.clientHeight);
  progress.style.width = (pct * 100) + '%';

  let current = '';
  for(const sec of sections){
    if(window.scrollY >= sec.offsetTop - 160) current = sec.id;
  }
  navAnchors.forEach(a=>{
    a.classList.toggle('active', a.getAttribute('href') === '#' + current);
  });
}
window.addEventListener('scroll', onScroll, {passive:true});
onScroll();

/* ---------- 汉堡菜单 ---------- */
const hamburger = $('#hamburger');
const mobileMenu = $('#mobileMenu');
function closeMenu(){ hamburger.classList.remove('open'); mobileMenu.classList.remove('open'); }
hamburger.addEventListener('click', ()=>{
  hamburger.classList.toggle('open');
  mobileMenu.classList.toggle('open');
});
$$('.mobile-menu a').forEach(a=>a.addEventListener('click', closeMenu));
document.addEventListener('click', e=>{
  if(mobileMenu.classList.contains('open') && !mobileMenu.contains(e.target) && !hamburger.contains(e.target)) closeMenu();
});

/* ---------- 按钮涟漪（点击反馈） ---------- */
$$('.btn').forEach(btn=>{
  btn.addEventListener('click', e=>{
    const r = btn.getBoundingClientRect();
    const span = document.createElement('span');
    span.className = 'ripple';
    span.style.left = (e.clientX - r.left) + 'px';
    span.style.top  = (e.clientY - r.top) + 'px';
    btn.appendChild(span);
    setTimeout(()=>span.remove(), 600);
  });
});

/* ---------- 滚动渐入（含错落延迟） ---------- */
const io = new IntersectionObserver(entries=>{
  entries.forEach(en=>{
    if(en.isIntersecting){
      en.target.classList.add('in');
      io.unobserve(en.target);
    }
  });
},{threshold:.12});

$$('.reveal').forEach((el,i)=>{
  el.style.transitionDelay = Math.min((i % 6) * 70, 350) + 'ms';
  io.observe(el);
});

/* ---------- 数字滚动 ---------- */
const counterIO = new IntersectionObserver(entries=>{
  entries.forEach(en=>{
    if(!en.isIntersecting) return;
    const el = en.target, target = +el.dataset.count, dur = 1400, t0 = performance.now();
    function step(t){
      const p = Math.min((t - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString();
      if(p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
    counterIO.unobserve(el);
  });
},{threshold:.4});
$$('.stat-num').forEach(el=>counterIO.observe(el));

/* ---------- 复制服务器地址 ---------- */
function copyIp(btn){
  const ok = ()=>{
    if(btn) btn.textContent = '✓ 已复制';
    toast('✅ 服务器地址已复制到剪贴板');
    setTimeout(()=>{ if(btn) btn.textContent = '📋 复制服务器地址'; }, 1800);
  };
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(CONFIG.serverIp).then(ok).catch(()=>fallbackCopy(ok));
  } else fallbackCopy(ok);
}
function fallbackCopy(ok){
  const ta = document.createElement('textarea');
  ta.value = CONFIG.serverIp;
  ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.select();
  try{ document.execCommand('copy'); ok(); }catch(e){ toast('❌ 复制失败，请手动复制：' + CONFIG.serverIp); }
  ta.remove();
}
$('#copyIpBtn').addEventListener('click', e=>copyIp(e.currentTarget));
$('#heroCopyIp').addEventListener('click', ()=>copyIp());

/* ---------- 服务器状态（演示模式 / API 模式） ---------- */
const els = {
  statusText: $('#statusText'), statusDot: $('#statusDot'),
  statusPing: $('#statusPing'), statusPlayers: $('#statusPlayers'),
  statusMax: $('#statusMax'), statusTps: $('#statusTps'),
  heroPlayers: $('#heroPlayers'), heroMax: $('#heroMax'),
  heroTps: $('#heroTps'), heroStatusText: $('#heroStatusText'),
};
els.statusMax.textContent = CONFIG.maxPlayers;
els.heroMax.textContent = CONFIG.maxPlayers;

function applyStatus({online, players, tps, ms}){
  const isOnline = online !== false;
  els.statusText.textContent = isOnline ? '在线' : '维护中';
  els.statusDot.className = 'dot ' + (isOnline ? 'dot-green pulse' : 'dot-gray');
  els.statusPing.textContent = isOnline ? ('~' + Math.round(ms) + 'ms') : '—';
  els.heroStatusText.textContent = isOnline ? '在线' : '维护中';
  els.statusPlayers.textContent = players?.online ?? 0;
  els.heroPlayers.textContent = players?.online ?? 0;
  const tpsV = (tps ?? 20).toFixed(1);
  els.statusTps.textContent = tpsV;
  els.heroTps.textContent = tpsV;
}

function refreshStatus(){
  if(CONFIG.statusApi){
    fetch(CONFIG.statusApi, {mode:'cors'})
      .then(r=>r.json())
      .then(applyStatus)
      .catch(()=>simulateStatus());
  } else {
    simulateStatus();
  }
}
function simulateStatus(){
  const online = Math.floor(24 + Math.random() * 50);
  applyStatus({
    online: true,
    players: {online, max: CONFIG.maxPlayers},
    tps: 19.7 + Math.random() * 0.3,
    ms: 8 + Math.random() * 18,
  });
}
refreshStatus();
setInterval(refreshStatus, CONFIG.refreshInterval);

/* ---------- 卡片 3D 倾斜（仅桌面悬停设备） ---------- */
if(window.matchMedia('(hover:hover) and (pointer:fine)').matches){
  $$('.tilt').forEach(card=>{
    card.addEventListener('mousemove', e=>{
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width  - .5;
      const y = (e.clientY - r.top)  / r.height - .5;
      card.style.transform = `perspective(900px) rotateY(${x*6}deg) rotateX(${-y*6}deg) translateY(-5px)`;
    });
    card.addEventListener('mouseleave', ()=>{ card.style.transform=''; });
  });
}

/* ---------- 外链 / 占位链接绑定 ---------- */
$$('[data-href]').forEach(el=>{
  el.addEventListener('click', e=>{
    const url = resolveHref(el.dataset.href);
    if(url === '#'){
      e.preventDefault();
      toast('⚠️ 请先在 js/main.js 的 CONFIG 中配置该链接');
    }
  });
});

/* ---------- 手风琴（FAQ） ---------- */
$$('.acc-item').forEach(item=>{
  const head = $('.acc-head', item), body = $('.acc-body', item);
  head.addEventListener('click', ()=>{
    const isOpen = item.classList.contains('open');
    $$('.acc-item.open').forEach(o=>{
      o.classList.remove('open');
      $('.acc-body', o).style.maxHeight = '0px';
    });
    if(!isOpen){
      item.classList.add('open');
      body.style.maxHeight = body.scrollHeight + 'px';
    }
  });
});

/* =========================================================
   交互式路网地图（数据驱动，可自行增删站点）
   ========================================================= */
const NETWORKS = {
  overworld: {
    name: '主世界',
    stations: [
      {id:'central', x:400, y:235, name:'主城站',   icon:'🏰', desc:'全服交通枢纽，连接各主要站点，包含末地传送门与主城传送。'},
      {id:'spawn',   x:400, y:62,  name:'出生点',   icon:'🌱', desc:'新手出发地，设有新手礼包领取处与引导 NPC。'},
      {id:'market',  x:645, y:150, name:'商业街',   icon:'🏪', desc:'玩家交易所聚集地，沿线设有数十家商铺与自动售货机。'},
      {id:'airport', x:695, y:325, name:'空港',     icon:'✈️', desc:'鞘翅起飞平台与飞行航路检查站，通往各处空岛。'},
      {id:'harbor',  x:560, y:415, name:'海港',     icon:'⚓', desc:'海运航线起点，连通海洋生态群系与沉船遗迹。'},
      {id:'industry',x:200, y:395, name:'工业区',   icon:'⚙️', desc:'生电玩家聚集地，高频红石与刷怪塔集中于此。'},
      {id:'tundra',  x:105, y:155, name:'雪原站',   icon:'❄️', desc:'通往冰刺之地、雪屋与远古城市。'},
      {id:'desert',  x:170, y:70,  name:'沙漠站',   icon:'🏜️', desc:'通往沙漠神殿、绿洲与金字塔群系。'},
    ],
    edges: [
      ['central','spawn'],['central','market'],['central','airport'],
      ['central','harbor'],['central','industry'],['central','tundra'],['central','desert'],
      ['market','airport'],['harbor','industry'],['tundra','desert'],['spawn','desert'],
    ],
  },
  nether: {
    name: '地狱',
    stations: [
      {id:'portal',  x:400, y:235, name:'主城下界门', icon:'🌀', desc:'连接主城与地狱高速公路的起点，步行即可到达。'},
      {id:'hub',     x:200, y:120, name:'地狱中枢',   icon:'🔀', desc:'下界交通核心，辐射全图的高速公路网。'},
      {id:'east',    x:660, y:120, name:'东线高速',   icon:'➡️', desc:'通往东部群系的下界快速通道，全程冰道。'},
      {id:'west',    x:110, y:335, name:'西线高速',   icon:'⬅️', desc:'通往西部雪原与冰刺之地的通道。'},
      {id:'fortress',x:690, y:365, name:'烈焰堡垒',   icon:'🔥', desc:'烈焰人农场与下界要塞附近站点。'},
      {id:'trade',   x:475, y:405, name:'猪灵交易所', icon:'💛', desc:'金锭换物资的自动化交易中心，支持高频兑换。'},
    ],
    edges: [
      ['portal','hub'],['hub','east'],['hub','west'],
      ['portal','trade'],['east','fortress'],['west','trade'],
    ],
  },
};

const svg = $('#mapSvg');
const mapInfo = $('#mapInfo');
const NS = 'http://www.w3.org/2000/svg';

function renderMap(netKey){
  const net = NETWORKS[netKey];
  svg.innerHTML = '';

  // 站点名称标签（先画边再画点，点在上层）
  net.stations.forEach(s=>{
    const label = document.createElementNS(NS, 'text');
    label.setAttribute('x', s.x); label.setAttribute('y', s.y - 26);
    label.setAttribute('text-anchor','middle');
    label.textContent = s.name;
    svg.appendChild(label);
  });

  // 线路
  net.edges.forEach(([a,b])=>{
    const A = net.stations.find(s=>s.id===a), B = net.stations.find(s=>s.id===b);
    const line = document.createElementNS(NS,'line');
    line.setAttribute('x1', A.x); line.setAttribute('y1', A.y);
    line.setAttribute('x2', B.x); line.setAttribute('y2', B.y);
    line.setAttribute('class','map-edge');
    line.dataset.from = a; line.dataset.to = b;
    svg.appendChild(line);
  });

  // 站点
  net.stations.forEach(s=>{
    const g = document.createElementNS(NS,'g');
    g.setAttribute('class','map-station');
    g.dataset.id = s.id;

    const circle = document.createElementNS(NS,'circle');
    circle.setAttribute('cx', s.x); circle.setAttribute('cy', s.y);
    circle.setAttribute('r', 16);
    g.appendChild(circle);

    const icon = document.createElementNS(NS,'text');
    icon.setAttribute('x', s.x); icon.setAttribute('y', s.y + 5);
    icon.setAttribute('text-anchor','middle');
    icon.setAttribute('class','st-icon');
    icon.textContent = s.icon;
    g.appendChild(icon);

    g.addEventListener('click', ()=>selectStation(g, s, net));
    svg.appendChild(g);
  });
}

function selectStation(g, s, net){
  $$('.map-station.active', svg).forEach(n=>n.classList.remove('active'));
  $$('.map-edge.active', svg).forEach(e=>e.classList.remove('active'));
  g.classList.add('active');

  const linked = net.edges.filter(([a,b])=>a===s.id || b===s.id);
  linked.forEach(([a,b])=>{
    $$(`.map-edge[data-from="${a}"][data-to="${b}"], .map-edge[data-from="${b}"][data-to="${a}"]`, svg)
      .forEach(e=>e.classList.add('active'));
  });

  mapInfo.innerHTML = `
    <div class="map-info-detail">
      <div class="map-info-icon">${s.icon}</div>
      <div>
        <h3>${s.name} · ${net.name}</h3>
        <p>${s.desc}</p>
      </div>
      <span class="map-info-route">🔗 直达线路 ${linked.length} 条</span>
    </div>`;
}

/* 切换 主世界 / 地狱 */
$$('#mapTabs .tab').forEach(tab=>{
  tab.addEventListener('click', ()=>{
    $$('#mapTabs .tab').forEach(t=>t.classList.remove('active'));
    tab.classList.add('active');
    renderMap(tab.dataset.net);
    mapInfo.innerHTML = '<div class="map-info-empty">👆 选择一个站点</div>';
  });
});
renderMap('overworld');

/* ---------- 实时地图嵌入（配置了 mapUrl 后生效） ---------- */
function setupMapFrame(){
  const frame = $('#mapFrame');
  if(CONFIG.mapUrl){
    const iframe = document.createElement('iframe');
    iframe.src = CONFIG.mapUrl;
    iframe.style.cssText = 'width:100%;height:520px;border:0;display:block';
    iframe.setAttribute('loading','lazy');
    iframe.setAttribute('referrerpolicy','no-referrer-when-downgrade');
    $('#mapPlaceholder').remove();
    frame.appendChild(iframe);
  }
}
setupMapFrame();

/* ---------- 页脚年份 ---------- */
$('#year').textContent = new Date().getFullYear();
