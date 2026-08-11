/* =========================================================
   一辈子存档 · 全景交互式路网 / 交通设施数据库
   功能：SVG 交互路网 + 设施列表 + 搜索筛选 +
         JSON 路网文件导入 / 导出 + 弹窗快捷添加路径点
   数据持久化：localStorage（浏览器本地保存，导入即覆盖）
   ========================================================= */

const STORAGE_KEY = 'worldeternal_network_v1';

/* =========================================================
   ★ 默认路网数据（已整合：一辈子存档 · 主世界交通路网）
   想改默认数据直接编辑下面的 stations / edges 即可
   ========================================================= */
const DEFAULT_NETWORK = {
  meta: { name: '一辈子存档 · 主世界交通路网', version: 2 },
  stations: [
    {
      id: 'hub',
      name: '主城站',
      world: '主世界',
      x: 400,
      y: 235,
      icon: '🏰',
      owner: '',
      coords: 'X: 0, Y: 70, Z: 0',
      depend: '—',
      transport: '出生点正前方即为主城传送点，全服线路由此辐射。',
      desc: '全服交通枢纽与出生点，各线路以此为中心，设有复活点与物资补给箱。'
    },
    {
      id: 'mob-farm',
      name: '刷怪塔',
      world: '主世界',
      x: 150,
      y: 130,
      icon: '🧟',
      owner: '',
      coords: 'X: -561, Y: 80, Z: -1076',
      depend: '主城站',
      transport: '主城冰道西线，刷怪塔站出站步行至塔底挂机点。',
      desc: '全自动刷怪塔，稳定产出火药、骨头、腐肉、线与箭矢，适合夜间挂机。'
    },
    {
      id: 'sea-temple',
      name: '海神殿',
      world: '主世界',
      x: 200,
      y: 360,
      icon: '🌊',
      owner: '',
      coords: 'X: -495, Y: 184, Z: -1214',
      depend: '主城站',
      transport: '主城冰道西线尽头，出站后向西南飞行约 600 格到达。',
      desc: '海底神殿遗迹，可获取海绵与海洋之心材料，探索时请备好水下呼吸与夜视。'
    },
    {
      id: 'iron-farm',
      name: '刷铁机',
      world: '主世界',
      x: 640,
      y: 130,
      icon: '🤖',
      owner: '',
      coords: 'X: 195, Y: 67, Z: 365',
      depend: '主城站',
      transport: '主城冰道东线，刷铁机站出站即达。',
      desc: '经典刷铁机，稳定产出铁锭，位于东部高地，一人即可维护。'
    },
    {
      id: 'iron-farm-2',
      name: '刷铁机2',
      world: '主世界',
      x: 600,
      y: 260,
      icon: '⚙️',
      owner: '',
      coords: 'X: 65, Y: 96, Z: 624',
      depend: '村民交易所',
      transport: '冰道东线村民交易所站出站，步行约 50 格即达。',
      desc: '双核刷铁机，产出铁锭与虞美人，支持多人同时挂机。'
    },
    {
      id: 'trading-hall',
      name: '村民交易所',
      world: '主世界',
      x: 625,
      y: 355,
      icon: '💰',
      owner: '',
      coords: 'X: 43, Y: 55, Z: 574',
      depend: '主城站',
      transport: '主城冰道东线，村民交易所站出站即达。',
      desc: '附魔书与绿宝石兑换中心，村民沿河而居，交易每日刷新，铁砧与工作台齐备。'
    }
  ],
  edges: [
    ['hub', 'mob-farm'],
    ['hub', 'sea-temple'],
    ['hub', 'iron-farm'],
    ['hub', 'trading-hall'],
    ['trading-hall', 'iron-farm-2'],
    ['iron-farm', 'iron-farm-2']
  ]
};

/* ---------- 工具 ---------- */
const $  = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => [...el.querySelectorAll(s)];

function toast(msg){
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(()=>t.classList.remove('show'), 2400);
}

/* ---------- 数据读写（localStorage） ---------- */
let network = loadNetwork();

function loadNetwork(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw){
      const d = JSON.parse(raw);
      if(d && Array.isArray(d.stations) && Array.isArray(d.edges)) return d;
    }
  }catch(e){}
  return JSON.parse(JSON.stringify(DEFAULT_NETWORK));
}
function saveNetwork(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(network));
}

/* ---------- 全局状态 ---------- */
let searchKw = '';
let worldFilter = '全部';
let selectedId = null;

/* ---------- 渲染 SVG 路网 ---------- */
const svg = $('#mapSvg');
const NS = 'http://www.w3.org/2000/svg';

function renderMap(){
  svg.innerHTML = '';
  const stations = network.stations;
  const edges = network.edges;

  // 站点名标签（先画）
  stations.forEach(s=>{
    const label = document.createElementNS(NS,'text');
    label.setAttribute('x', s.x); label.setAttribute('y', s.y - 26);
    label.setAttribute('text-anchor','middle');
    label.setAttribute('class','map-label');
    label.textContent = s.name;
    svg.appendChild(label);
  });

  // 线路
  edges.forEach(([a,b])=>{
    const A = stations.find(s=>s.id===a), B = stations.find(s=>s.id===b);
    if(!A || !B) return;
    const line = document.createElementNS(NS,'line');
    line.setAttribute('x1', A.x); line.setAttribute('y1', A.y);
    line.setAttribute('x2', B.x); line.setAttribute('y2', B.y);
    line.setAttribute('class','map-edge');
    line.dataset.from = a; line.dataset.to = b;
    svg.appendChild(line);
  });

  // 站点（点）
  stations.forEach(s=>{
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
    icon.textContent = s.icon || '📍';
    g.appendChild(icon);

    g.addEventListener('click', ()=>selectStation(s));
    svg.appendChild(g);
  });

  $('#mapCount').textContent = `${stations.length} 个站点 · ${edges.length} 条线路`;
}

function selectStation(s){
  selectedId = s.id;
  $$('.map-station.active', svg).forEach(n=>n.classList.remove('active'));
  $$('.map-edge.active', svg).forEach(e=>e.classList.remove('active'));
  const g = $(`.map-station[data-id="${s.id}"]`, svg);
  if(g) g.classList.add('active');

  network.edges.filter(([a,b])=>a===s.id||b===s.id).forEach(([a,b])=>{
    $$(`.map-edge[data-from="${a}"][data-to="${b}"], .map-edge[data-from="${b}"][data-to="${a}"]`, svg)
      .forEach(e=>e.classList.add('active'));
  });

  // 列表滚动定位到对应卡片并高亮
  const card = $(`.facility-card[data-id="${s.id}"]`);
  if(card){
    card.scrollIntoView({behavior:'smooth', block:'center'});
    card.classList.add('flash');
    setTimeout(()=>card.classList.remove('flash'), 1600);
  }
}

/* ---------- 渲染设施列表（云中城同构卡片） ---------- */
function renderList(){
  const list = $('#facilityList');
  const kw = searchKw.trim().toLowerCase();

  const filtered = network.stations.filter(s=>{
    if(worldFilter !== '全部' && s.world !== worldFilter) return false;
    if(!kw) return true;
    const hay = [s.name, s.owner, s.desc, s.depend, s.transport, s.coords].join(' ').toLowerCase();
    return hay.includes(kw);
  });

  $('#listEmpty').hidden = filtered.length !== 0;

  list.innerHTML = filtered.map(s=>`
    <article class="facility-card card" data-id="${s.id}">
      <div class="facility-head">
        <div class="facility-title">
          <span class="facility-icon">${s.icon || '📍'}</span>
          <div>
            <h3>${escapeHtml(s.name)}</h3>
            <span class="facility-world">${s.world || '主世界'}</span>
          </div>
        </div>
        <div class="facility-actions">
          ${s.owner ? `<button class="owner-chip" data-owner="${escapeHtml(s.owner)}">${escapeHtml(s.owner)}（点击复制QQ）</button>` : ''}
          <button class="icon-btn" data-del="${s.id}" title="删除">🗑</button>
        </div>
      </div>
      ${s.desc ? `<p class="facility-desc">${escapeHtml(s.desc)}</p>` : ''}
      <div class="facility-meta">
        ${s.coords ? `<span class="meta-chip">📍 坐标 ${escapeHtml(s.coords)}</span>` : ''}
        ${s.depend && s.depend !== '—' ? `<span class="meta-chip">🚉 依赖站点 ${escapeHtml(s.depend)}</span>` : ''}
      </div>
      ${s.transport ? `<div class="facility-transport">🚇 接驳：${escapeHtml(s.transport)}</div>` : ''}
    </article>
  `).join('');

  // 事件绑定
  $$('.facility-card', list).forEach(card=>{
    card.addEventListener('click', e=>{
      if(e.target.closest('.owner-chip') || e.target.closest('.icon-btn')) return;
      const st = network.stations.find(s=>s.id===card.dataset.id);
      if(st) selectStation(st);
    });
  });
  $$('.owner-chip', list).forEach(chip=>{
    chip.addEventListener('click', ()=>{
      const owner = chip.dataset.owner;
      navigator.clipboard?.writeText(owner).then(
        ()=>toast(`✅ 已复制负责人 QQ：${owner}`),
        ()=>toast(`负责人 QQ：${owner}`)
      );
    });
  });
  $$('.icon-btn[data-del]', list).forEach(btn=>{
    btn.addEventListener('click', e=>{
      e.stopPropagation();
      const id = btn.dataset.del;
      if(!confirm('确定删除该路径点？')) return;
      network.stations = network.stations.filter(s=>s.id!==id);
      network.edges = network.edges.filter(([a,b])=>a!==id && b!==id);
      saveNetwork(); renderMap(); renderList();
      toast('🗑 已删除');
    });
  });
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

/* ---------- 搜索与筛选 ---------- */
$('#searchInput').addEventListener('input', e=>{ searchKw = e.target.value; renderList(); });

$$('#worldTabs .tab').forEach(tab=>{
  tab.addEventListener('click', ()=>{
    $$('#worldTabs .tab').forEach(t=>t.classList.remove('active'));
    tab.classList.add('active');
    worldFilter = tab.dataset.world;
    renderList();
  });
});

/* ---------- 导入路网文件 ---------- */
const importFile = $('#importFile');
$('#importBtn').addEventListener('click', ()=>importFile.click());

importFile.addEventListener('change', e=>{
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ev=>{
    try{
      const data = JSON.parse(ev.target.result);
      if(!Array.isArray(data.stations) || !Array.isArray(data.edges)){
        throw new Error('格式错误');
      }
      // 补默认字段
      data.stations.forEach(s=>{
        s.world = s.world || '主世界';
        s.x = Number(s.x) || 400; s.y = Number(s.y) || 235;
      });
      network = data;
      saveNetwork();
      renderMap(); renderList();
      toast(`✅ 已导入路网：${data.stations.length} 个站点 / ${data.edges.length} 条线路`);
    }catch(err){
      toast('❌ 导入失败：JSON 格式不正确（需含 stations 与 edges 数组）');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
});

/* ---------- 导出路网 ---------- */
$('#exportBtn').addEventListener('click', ()=>{
  const blob = new Blob([JSON.stringify(network, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'worldeternal-network.json';
  a.click();
  URL.revokeObjectURL(a.href);
  toast('📤 路网数据已导出');
});

/* ---------- 下载示例文件 ---------- */
$('#sampleBtn').addEventListener('click', ()=>{
  const blob = new Blob([JSON.stringify(DEFAULT_NETWORK, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'worldeternal-network-sample.json';
  a.click();
  URL.revokeObjectURL(a.href);
  toast('📄 示例文件已下载（可编辑后重新导入）');
});

/* ---------- 弹窗：添加路径点 ---------- */
const overlay = $('#modalOverlay');
const form = $('#addForm');
function openModal(){ overlay.hidden = false; document.body.style.overflow = 'hidden'; }
function closeModal(){ overlay.hidden = true; document.body.style.overflow = ''; form.reset(); }

$('#addBtn').addEventListener('click', openModal);
$('#modalClose').addEventListener('click', closeModal);
$('#formCancel').addEventListener('click', closeModal);
overlay.addEventListener('click', e=>{ if(e.target === overlay) closeModal(); });

form.addEventListener('submit', e=>{
  e.preventDefault();
  const fd = new FormData(form);
  const id = 's_' + Date.now().toString(36);
  const station = {
    id,
    name: fd.get('name') || '未命名',
    icon: fd.get('icon') || '📍',
    world: fd.get('world') || '主世界',
    owner: fd.get('owner') || '',
    x: Math.min(800, Math.max(0, Number(fd.get('x')) || 400)),
    y: Math.min(470, Math.max(0, Number(fd.get('y')) || 235)),
    coords: fd.get('coords') || '',
    depend: fd.get('depend') || '',
    desc: fd.get('desc') || '',
    transport: fd.get('transport') || '',
  };
  network.stations.push(station);
  saveNetwork();
  renderMap(); renderList();
  closeModal();
  toast(`✅ 已添加路径点：${station.name}`);
  selectStation(station);
});

/* ---------- 导航滚动 ---------- */
const navbar = $('#navbar');
window.addEventListener('scroll', ()=>navbar.classList.toggle('scrolled', window.scrollY > 30), {passive:true});

/* ---------- 汉堡菜单 ---------- */
const hamburger = $('#hamburger');
const mobileMenu = $('#mobileMenu');
hamburger.addEventListener('click', ()=>{
  hamburger.classList.toggle('open');
  mobileMenu.classList.toggle('open');
});
$$('.mobile-menu a').forEach(a=>a.addEventListener('click', ()=>{
  hamburger.classList.remove('open');
  mobileMenu.classList.remove('open');
}));

/* ---------- 初始化 ---------- */
renderMap();
renderList();
