// ===== WINDOWS 7 DESKTOP - FULL JS =====

// ---- State ----
let openWindows = {};
let windowZCounter = 1000;
let activeWindow = null;
let calcValue = '';
let calcOperator = '';
let calcPrev = '';
let calcNewNum = false;
let playerPlaying = false;
let playerInterval = null;
let playerProgress = 0;
let playerBarInterval = null;

const APP_CONFIG = {
  chrome: {
    title: 'Google Chrome',
    icon: '🌐',
    width: 900,
    height: 580,
    minWidth: 500,
    minHeight: 350,
  },
  edge: {
    title: 'Microsoft Edge',
    icon: '🔵',
    width: 880,
    height: 560,
    minWidth: 500,
    minHeight: 350,
  },
  explorer: {
    title: 'File Explorer',
    icon: '📁',
    width: 720,
    height: 480,
    minWidth: 400,
    minHeight: 300,
  },
  controlpanel: {
    title: 'Control Panel',
    icon: '⚙️',
    width: 680,
    height: 500,
    minWidth: 400,
    minHeight: 300,
  },
  notepad: {
    title: 'Notepad - Untitled',
    icon: '🗒️',
    width: 560,
    height: 420,
    minWidth: 300,
    minHeight: 200,
  },
  calculator: {
    title: 'Calculator',
    icon: '🖩',
    width: 280,
    height: 400,
    minWidth: 260,
    minHeight: 380,
  },
  mediaplayer: {
    title: 'Windows Media Player',
    icon: '🎵',
    width: 480,
    height: 380,
    minWidth: 400,
    minHeight: 350,
  },
  recycle: {
    title: 'Recycle Bin',
    icon: '🗑️',
    width: 600,
    height: 400,
    minWidth: 350,
    minHeight: 250,
  },
};

// ---- Clock ----
function updateClock() {
  const now = new Date();
  const h = now.getHours().toString().padStart(2, '0');
  const m = now.getMinutes().toString().padStart(2, '0');
  const opts = { month: 'numeric', day: 'numeric', year: 'numeric' };
  document.getElementById('clock-time').textContent = `${h}:${m}`;
  document.getElementById('clock-date').textContent = now.toLocaleDateString('en-US', opts);
}
updateClock();
setInterval(updateClock, 1000);

// ---- Desktop Icon Selection ----
function selectIcon(el) {
  document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
  el.classList.add('selected');
}

// Click on desktop deselects icons
document.getElementById('desktop').addEventListener('click', function (e) {
  if (e.target === this || e.target.id === 'desktop-icons') {
    document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
  }
  closeStartMenu();
  hideCtx();
});

// ---- Right-click Context Menu ----
document.getElementById('desktop').addEventListener('contextmenu', function (e) {
  if (e.target.closest('.window') || e.target.closest('#taskbar')) return;
  e.preventDefault();
  const menu = document.getElementById('context-menu');
  let x = e.clientX, y = e.clientY;
  if (x + 170 > window.innerWidth) x = window.innerWidth - 175;
  if (y + 180 > window.innerHeight) y = window.innerHeight - 185;
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';
  menu.classList.add('show');
});

document.addEventListener('click', hideCtx);

function hideCtx() {
  document.getElementById('context-menu').classList.remove('show');
}

// ---- Start Menu ----
function toggleStartMenu() {
  const m = document.getElementById('start-menu');
  m.classList.toggle('open');
}

function closeStartMenu() {
  document.getElementById('start-menu').classList.remove('open');
}

document.getElementById('start-btn').addEventListener('click', function (e) {
  e.stopPropagation();
});

// ---- Open App / Window ----
function openApp(appId) {
  closeStartMenu();

  // If already open and minimized, restore
  if (openWindows[appId]) {
    const win = document.getElementById('win-' + appId);
    if (win) {
      win.classList.remove('minimized');
      bringToFront(appId);
      return;
    }
  }

  const cfg = APP_CONFIG[appId];
  if (!cfg) return;

  // Create window
  const win = document.createElement('div');
  win.className = 'window';
  win.id = 'win-' + appId;

  const vw = window.innerWidth;
  const vh = window.innerHeight - 42;
  const left = Math.max(10, Math.min(vw - cfg.width - 10, 80 + Object.keys(openWindows).length * 30));
  const top = Math.max(0, Math.min(vh - cfg.height - 10, 50 + Object.keys(openWindows).length * 25));

  win.style.cssText = `
    left: ${left}px;
    top: ${top}px;
    width: ${cfg.width}px;
    height: ${cfg.height}px;
    z-index: ${++windowZCounter};
  `;

  win.innerHTML = buildWindowHTML(appId, cfg);
  document.getElementById('windows-container').appendChild(win);

  openWindows[appId] = { maximized: false, prevRect: null };
  addTaskbarBtn(appId, cfg);
  makeDraggable(win, appId);
  makeResizable(win);
  bringToFront(appId);

  // Init special apps
  if (appId === 'calculator') initCalculator();
  if (appId === 'mediaplayer') initMediaPlayer();
}

// ---- Build Window HTML ----
function buildWindowHTML(appId, cfg) {
  return `
    <div class="window-titlebar" id="tb-${appId}" ondblclick="toggleMaximize('${appId}')">
      <span class="window-title-icon">${cfg.icon}</span>
      <span class="window-title">${cfg.title}</span>
      <div class="window-controls">
        <button class="win-btn minimize" onclick="minimizeWin('${appId}')" title="Minimize">─</button>
        <button class="win-btn maximize" onclick="toggleMaximize('${appId}')" title="Maximize">□</button>
        <button class="win-btn close" onclick="closeWin('${appId}')" title="Close">✕</button>
      </div>
    </div>
    ${buildAppContent(appId)}
  `;
}

// ---- App Content ----
function buildAppContent(appId) {
  switch (appId) {
    case 'chrome': return buildChrome();
    case 'edge': return buildEdge();
    case 'explorer': return buildExplorer();
    case 'controlpanel': return buildControlPanel();
    case 'notepad': return buildNotepad();
    case 'calculator': return buildCalculator();
    case 'mediaplayer': return buildMediaPlayer();
    case 'recycle': return buildRecycle();
    default: return '<div class="window-content"><p>App not found</p></div>';
  }
}

// ===== CHROME =====
function buildChrome() {
  return `
    <div class="chrome-tabs">
      <div class="chrome-tab active">
        <span>🌐</span> <span>New Tab</span>
      </div>
      <div class="chrome-tab" onclick="alert('Open new tab!')">
        <span>➕</span>
      </div>
    </div>
    <div class="chrome-toolbar">
      <button class="chrome-nav-btn" onclick="chromeNav('back')">◀</button>
      <button class="chrome-nav-btn" onclick="chromeNav('fwd')">▶</button>
      <button class="chrome-nav-btn" onclick="chromeNav('refresh')">↻</button>
      <button class="chrome-nav-btn" onclick="chromeNav('home')">🏠</button>
      <input class="chrome-addr" id="chrome-url" type="text" value="chrome://newtab" 
             onkeydown="if(event.key==='Enter') chromeGo(this.value)">
      <button class="chrome-nav-btn" onclick="chromeGo(document.getElementById('chrome-url').value)">⭐</button>
      <button class="chrome-nav-btn">⋮</button>
    </div>
    <div class="window-content" id="chrome-content">
      ${chromeHomePage()}
    </div>
  `;
}

function chromeHomePage() {
  return `
    <div class="browser-home">
      <h1>Google</h1>
      <div class="search-box-container">
        <input class="browser-search" id="chrome-search" type="text" placeholder="Search Google or type a URL"
               onkeydown="if(event.key==='Enter') chromeSearch(this.value)">
      </div>
      <div class="browser-bookmarks">
        <div class="bookmark-item" onclick="chromeLoadSite('youtube.com')">
          <div class="bookmark-icon">▶️</div><span>YouTube</span>
        </div>
        <div class="bookmark-item" onclick="chromeLoadSite('facebook.com')">
          <div class="bookmark-icon">👥</div><span>Facebook</span>
        </div>
        <div class="bookmark-item" onclick="chromeLoadSite('twitter.com')">
          <div class="bookmark-icon">🐦</div><span>Twitter</span>
        </div>
        <div class="bookmark-item" onclick="chromeLoadSite('github.com')">
          <div class="bookmark-icon">🐙</div><span>GitHub</span>
        </div>
        <div class="bookmark-item" onclick="chromeLoadSite('maps.google.com')">
          <div class="bookmark-icon">🗺️</div><span>Maps</span>
        </div>
        <div class="bookmark-item" onclick="chromeLoadSite('drive.google.com')">
          <div class="bookmark-icon">📂</div><span>Drive</span>
        </div>
      </div>
    </div>
  `;
}

function chromeSearch(q) {
  if (!q) return;
  const url = `https://www.google.com/search?q=${encodeURIComponent(q)}`;
  document.getElementById('chrome-url').value = url;
  loadInChrome(url, 'chrome');
}

function chromeGo(url) {
  if (!url.startsWith('http')) url = 'https://' + url;
  document.getElementById('chrome-url').value = url;
  loadInChrome(url, 'chrome');
}

function chromeLoadSite(site) {
  chromeGo('https://' + site);
}

function loadInChrome(url, browserId) {
  const content = document.getElementById(browserId + '-content');
  content.innerHTML = `<iframe class="browser-content" src="${url}" sandbox="allow-scripts allow-same-origin allow-forms allow-popups"></iframe>`;
}

function chromeNav(action) {
  if (action === 'home') {
    document.getElementById('chrome-url').value = 'chrome://newtab';
    document.getElementById('chrome-content').innerHTML = chromeHomePage();
  }
}

// ===== EDGE =====
function buildEdge() {
  return `
    <div class="edge-toolbar">
      <button class="edge-nav-btn" onclick="edgeNav('back')">◀</button>
      <button class="edge-nav-btn" onclick="edgeNav('fwd')">▶</button>
      <button class="edge-nav-btn" onclick="edgeNav('refresh')">↻</button>
      <button class="edge-nav-btn" onclick="edgeNav('home')">🏠</button>
      <input class="edge-addr" id="edge-url" type="text" value="edge://newtab"
             onkeydown="if(event.key==='Enter') edgeGo(this.value)">
      <button class="edge-nav-btn">⭐</button>
      <button class="edge-nav-btn">⋯</button>
    </div>
    <div class="window-content" id="edge-content">
      ${edgeHomePage()}
    </div>
  `;
}

function edgeHomePage() {
  return `
    <div class="edge-home">
      <h2>Good day! Ready to explore?</h2>
      <input class="edge-search" type="text" placeholder="Search or enter web address"
             onkeydown="if(event.key==='Enter') edgeSearch(this.value)">
      <div class="edge-cards">
        <div class="edge-card" onclick="edgeGo('https://bing.com')">
          <h4>🔍 Bing Search</h4>
          <p>Microsoft's powerful search engine</p>
        </div>
        <div class="edge-card" onclick="edgeGo('https://microsoft.com')">
          <h4>🪟 Microsoft</h4>
          <p>Official Microsoft website</p>
        </div>
        <div class="edge-card" onclick="edgeGo('https://outlook.com')">
          <h4>📧 Outlook Mail</h4>
          <p>Check your emails</p>
        </div>
        <div class="edge-card" onclick="edgeGo('https://office.com')">
          <h4>📄 Office 365</h4>
          <p>Word, Excel, PowerPoint online</p>
        </div>
        <div class="edge-card" onclick="edgeGo('https://github.com')">
          <h4>🐙 GitHub</h4>
          <p>Code repository & collaboration</p>
        </div>
        <div class="edge-card" onclick="edgeGo('https://youtube.com')">
          <h4>▶️ YouTube</h4>
          <p>Watch videos online</p>
        </div>
      </div>
    </div>
  `;
}

function edgeSearch(q) {
  const url = `https://www.bing.com/search?q=${encodeURIComponent(q)}`;
  document.getElementById('edge-url').value = url;
  loadInChrome(url, 'edge');
}

function edgeGo(url) {
  if (!url.startsWith('http')) url = 'https://' + url;
  document.getElementById('edge-url').value = url;
  loadInChrome(url, 'edge');
}

function edgeNav(action) {
  if (action === 'home') {
    document.getElementById('edge-url').value = 'edge://newtab';
    document.getElementById('edge-content').innerHTML = edgeHomePage();
  }
}

// ===== FILE EXPLORER =====
function buildExplorer() {
  const folders = [
    { icon: '📄', name: 'Documents' }, { icon: '🖼️', name: 'Pictures' },
    { icon: '🎵', name: 'Music' }, { icon: '🎬', name: 'Videos' },
    { icon: '📥', name: 'Downloads' }, { icon: '🖥️', name: 'Desktop' },
    { icon: '📂', name: 'New Folder' }, { icon: '📄', name: 'readme.txt' },
    { icon: '🖼️', name: 'photo.jpg' }, { icon: '🎵', name: 'song.mp3' },
    { icon: '📊', name: 'data.xlsx' }, { icon: '📝', name: 'notes.docx' },
    { icon: '⚙️', name: 'setup.exe' }, { icon: '📦', name: 'archive.zip' },
    { icon: '🔒', name: 'password.txt' }, { icon: '📄', name: 'report.pdf' },
  ];

  return `
    <div class="window-toolbar">
      <button class="toolbar-btn" onclick="explorerUp()">⬆ Up</button>
      <div class="toolbar-sep"></div>
      <button class="toolbar-btn">📂 New Folder</button>
      <button class="toolbar-btn">🗑️ Delete</button>
      <div class="toolbar-sep"></div>
      <button class="toolbar-btn">👁️ View</button>
    </div>
    <div class="address-bar">
      <span>📁</span>
      <input class="address-input" value="C:\\Users\\User\\Documents" readonly>
      <button class="go-btn">▶</button>
    </div>
    <div class="window-content">
      <div class="explorer-layout">
        <div class="explorer-sidebar">
          <div class="sidebar-item active"><span class="s-ico">⭐</span> Favorites</div>
          <div class="sidebar-item"><span class="s-ico">🖥️</span> Desktop</div>
          <div class="sidebar-item"><span class="s-ico">📥</span> Downloads</div>
          <div class="sidebar-item"><span class="s-ico">📄</span> Documents</div>
          <div class="sidebar-item"><span class="s-ico">🖼️</span> Pictures</div>
          <div class="sidebar-item"><span class="s-ico">🎵</span> Music</div>
          <div class="sidebar-item"><span class="s-ico">🎬</span> Videos</div>
          <div class="sidebar-item"><span class="s-ico">🖥️</span> Computer</div>
          <div class="sidebar-item"><span class="s-ico">💾</span> Local Disk (C:)</div>
          <div class="sidebar-item"><span class="s-ico">📀</span> DVD Drive (D:)</div>
        </div>
        <div class="explorer-main">
          ${folders.map(f => `
            <div class="file-item" ondblclick="fileOpen('${f.name}')">
              <div class="f-icon">${f.icon}</div>
              <div class="f-name">${f.name}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function explorerUp() { alert('Navigating up to parent folder...'); }
function fileOpen(name) {
  if (name.endsWith('.txt')) openApp('notepad');
  else if (name.endsWith('.mp3')) openApp('mediaplayer');
  else alert('Opening: ' + name);
}

// ===== CONTROL PANEL =====
function buildControlPanel() {
  const items = [
    { icon: '👤', label: 'User Accounts' },
    { icon: '🎨', label: 'Appearance' },
    { icon: '🖥️', label: 'Display' },
    { icon: '🔊', label: 'Sound' },
    { icon: '🖨️', label: 'Printers' },
    { icon: '🌐', label: 'Network' },
    { icon: '🔋', label: 'Power Options' },
    { icon: '⌨️', label: 'Keyboard' },
    { icon: '🖱️', label: 'Mouse' },
    { icon: '🔒', label: 'Security' },
    { icon: '🕐', label: 'Date & Time' },
    { icon: '🌍', label: 'Region & Language' },
    { icon: '📱', label: 'Devices' },
    { icon: '🔧', label: 'System' },
    { icon: '💾', label: 'Backup' },
    { icon: '♿', label: 'Accessibility' },
  ];

  return `
    <div class="window-toolbar">
      <button class="toolbar-btn">🏠 Home</button>
      <div class="toolbar-sep"></div>
      <span style="font-size:12px;color:#555">Control Panel</span>
    </div>
    <div class="address-bar">
      <span>⚙️</span>
      <input class="address-input" value="Control Panel" readonly>
    </div>
    <div class="window-content">
      <div class="cp-grid">
        ${items.map(i => `
          <div class="cp-item" onclick="cpItemClick('${i.label}')">
            <div class="cp-icon">${i.icon}</div>
            <div class="cp-label">${i.label}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function cpItemClick(label) {
  alert(`Opening: ${label}\n\n(Control Panel item)`);
}

// ===== NOTEPAD =====
function buildNotepad() {
  return `
    <div class="window-toolbar">
      <button class="toolbar-btn" onclick="npNew()">📄 New</button>
      <button class="toolbar-btn" onclick="npSave()">💾 Save</button>
      <div class="toolbar-sep"></div>
      <button class="toolbar-btn" onclick="npCopy()">📋 Copy</button>
      <button class="toolbar-btn" onclick="npPaste()">📌 Paste</button>
      <div class="toolbar-sep"></div>
      <select style="font-size:11px; border:1px solid #aaa; padding:1px 3px; border-radius:2px;"
              onchange="document.getElementById('np-area').style.fontFamily=this.value">
        <option value="Courier New">Courier New</option>
        <option value="Arial">Arial</option>
        <option value="Times New Roman">Times New Roman</option>
        <option value="Consolas">Consolas</option>
      </select>
    </div>
    <div class="window-content" style="padding:0;">
      <textarea class="notepad-area" id="np-area" placeholder="Type here...">Windows 7 Notepad
====================
Welcome to Notepad!

You can type anything here.
</textarea>
    </div>
  `;
}

function npNew() {
  if (confirm('Clear document?')) document.getElementById('np-area').value = '';
}
function npSave() {
  const text = document.getElementById('np-area').value;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
  a.download = 'document.txt';
  a.click();
}
function npCopy() {
  navigator.clipboard.writeText(document.getElementById('np-area').value);
}
function npPaste() {
  navigator.clipboard.readText().then(t => {
    const ta = document.getElementById('np-area');
    ta.value += t;
  });
}

// ===== CALCULATOR =====
function buildCalculator() {
  return `
    <div class="window-content" style="padding:0; overflow:hidden;">
      <div class="calc-container">
        <div class="calc-display" id="calc-display">0</div>
        <div class="calc-grid">
          <button class="calc-btn clr" onclick="calcClear()" style="grid-column:span 2">C</button>
          <button class="calc-btn op" onclick="calcSign()">±</button>
          <button class="calc-btn op" onclick="calcPercent()">%</button>

          <button class="calc-btn num" onclick="calcNum('7')">7</button>
          <button class="calc-btn num" onclick="calcNum('8')">8</button>
          <button class="calc-btn num" onclick="calcNum('9')">9</button>
          <button class="calc-btn op" onclick="calcOp('÷')">÷</button>

          <button class="calc-btn num" onclick="calcNum('4')">4</button>
          <button class="calc-btn num" onclick="calcNum('5')">5</button>
          <button class="calc-btn num" onclick="calcNum('6')">6</button>
          <button class="calc-btn op" onclick="calcOp('×')">×</button>

          <button class="calc-btn num" onclick="calcNum('1')">1</button>
          <button class="calc-btn num" onclick="calcNum('2')">2</button>
          <button class="calc-btn num" onclick="calcNum('3')">3</button>
          <button class="calc-btn op" onclick="calcOp('−')">−</button>

          <button class="calc-btn num" onclick="calcNum('0')" style="grid-column:span 2">0</button>
          <button class="calc-btn num" onclick="calcDot()">.</button>
          <button class="calc-btn op" onclick="calcOp('+')">+</button>

          <button class="calc-btn eq" onclick="calcEquals()" style="grid-column:span 4">=</button>
        </div>
      </div>
    </div>
  `;
}

function initCalculator() {
  calcValue = '0'; calcOperator = ''; calcPrev = ''; calcNewNum = false;
}

function calcDisplay() {
  const d = document.getElementById('calc-display');
  if (d) d.textContent = calcValue || '0';
}

function calcNum(n) {
  if (calcNewNum) { calcValue = n; calcNewNum = false; }
  else {
    if (calcValue === '0' || calcValue === '') calcValue = n;
    else if (calcValue.length < 14) calcValue += n;
  }
  calcDisplay();
}

function calcDot() {
  if (calcNewNum) { calcValue = '0.'; calcNewNum = false; }
  else if (!calcValue.includes('.')) calcValue += '.';
  calcDisplay();
}

function calcOp(op) {
  if (calcOperator && !calcNewNum) calcEquals(true);
  calcPrev = calcValue;
  calcOperator = op;
  calcNewNum = true;
}

function calcEquals(chained = false) {
  if (!calcOperator || !calcPrev) return;
  const a = parseFloat(calcPrev);
  const b = parseFloat(calcValue);
  let result;
  switch (calcOperator) {
    case '+': result = a + b; break;
    case '−': result = a - b; break;
    case '×': result = a * b; break;
    case '÷': result = b !== 0 ? a / b : 'Error'; break;
    default: result = b;
  }
  calcValue = result === 'Error' ? 'Error' : parseFloat(result.toFixed(10)).toString();
  if (!chained) { calcOperator = ''; calcPrev = ''; }
  calcNewNum = true;
  calcDisplay();
}

function calcClear() {
  calcValue = '0'; calcOperator = ''; calcPrev = ''; calcNewNum = false;
  calcDisplay();
}

function calcSign() {
  if (calcValue !== '0') calcValue = (parseFloat(calcValue) * -1).toString();
  calcDisplay();
}

function calcPercent() {
  calcValue = (parseFloat(calcValue) / 100).toString();
  calcDisplay();
}

// ===== MEDIA PLAYER =====
const tracks = [
  { title: 'Summer Breeze', artist: 'Nature Sounds', duration: 245 },
  { title: 'Night Drive', artist: 'Synthwave FM', duration: 312 },
  { title: 'Mountain Echo', artist: 'Ambient World', duration: 198 },
  { title: 'City Lights', artist: 'Jazz Quartet', duration: 267 },
  { title: 'Ocean Waves', artist: 'Relaxing Music', duration: 334 },
];

let currentTrack = 0;

function buildMediaPlayer() {
  return `
    <div style="display:flex; flex-direction:column; height:100%; background:#1a1a1a;">
      <div class="player-display" id="player-display">
        <div class="player-visualizer" id="visualizer">
          ${Array.from({length:16}, (_,i) => `<div class="bar" id="bar-${i}" style="height:${Math.random()*80+10}px"></div>`).join('')}
        </div>
      </div>
      <div class="player-controls">
        <div class="player-info">
          <div class="player-track" id="player-track">${tracks[0].title}</div>
          <div class="player-artist" id="player-artist">${tracks[0].artist}</div>
        </div>
        <div class="player-progress" onclick="seekPlayer(event)">
          <div class="player-progress-fill" id="player-fill" style="width:0%"></div>
        </div>
        <div class="player-btns">
          <button class="player-btn" onclick="prevTrack()" title="Previous">⏮</button>
          <button class="player-btn" onclick="shuffleTrack()" title="Shuffle">🔀</button>
          <button class="player-btn play-pause" id="play-btn" onclick="togglePlay()">▶</button>
          <button class="player-btn" onclick="repeatTrack()" title="Repeat">🔁</button>
          <button class="player-btn" onclick="nextTrack()" title="Next">⏭</button>
        </div>
        <div class="volume-control">
          <span>🔈</span>
          <input class="volume-slider" type="range" min="0" max="100" value="70" style="flex:1;">
          <span>🔊</span>
        </div>
        <!-- Playlist -->
        <div style="margin-top:10px; max-height:80px; overflow-y:auto;">
          ${tracks.map((t, i) => `
            <div onclick="selectTrack(${i})" id="track-item-${i}"
                 style="padding:3px 8px; font-size:11px; cursor:pointer; border-radius:3px;
                        color:${i===0?'#4caf50':'#aaa'}; background:${i===0?'rgba(76,175,80,0.15)':''};">
              ${i===0?'▶ ':''} ${t.title} — <span style="opacity:0.7">${t.artist}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function initMediaPlayer() {
  playerPlaying = false;
  playerProgress = 0;
  currentTrack = 0;
}

function togglePlay() {
  playerPlaying = !playerPlaying;
  const btn = document.getElementById('play-btn');
  if (btn) btn.textContent = playerPlaying ? '⏸' : '▶';

  if (playerPlaying) {
    playerInterval = setInterval(() => {
      playerProgress += (100 / tracks[currentTrack].duration);
      if (playerProgress >= 100) { nextTrack(); return; }
      const fill = document.getElementById('player-fill');
      if (fill) fill.style.width = playerProgress + '%';
    }, 1000);
    animateBars();
  } else {
    clearInterval(playerInterval);
    clearInterval(playerBarInterval);
  }
}

function animateBars() {
  playerBarInterval = setInterval(() => {
    if (!playerPlaying) return;
    for (let i = 0; i < 16; i++) {
      const bar = document.getElementById('bar-' + i);
      if (bar) bar.style.height = (Math.random() * 90 + 10) + 'px';
    }
  }, 150);
}

function nextTrack() {
  currentTrack = (currentTrack + 1) % tracks.length;
  switchTrack();
}

function prevTrack() {
  currentTrack = (currentTrack - 1 + tracks.length) % tracks.length;
  switchTrack();
}

function selectTrack(idx) {
  currentTrack = idx;
  switchTrack();
  if (!playerPlaying) togglePlay();
}

function shuffleTrack() {
  currentTrack = Math.floor(Math.random() * tracks.length);
  switchTrack();
}

function repeatTrack() {
  playerProgress = 0;
  if (!playerPlaying) togglePlay();
}

function switchTrack() {
  const t = tracks[currentTrack];
  playerProgress = 0;
  clearInterval(playerInterval);
  clearInterval(playerBarInterval);
  playerPlaying = false;

  const tEl = document.getElementById('player-track');
  const aEl = document.getElementById('player-artist');
  const btn = document.getElementById('play-btn');
  const fill = document.getElementById('player-fill');

  if (tEl) tEl.textContent = t.title;
  if (aEl) aEl.textContent = t.artist;
  if (btn) btn.textContent = '▶';
  if (fill) fill.style.width = '0%';

  // Update playlist highlight
  tracks.forEach((_, i) => {
    const item = document.getElementById('track-item-' + i);
    if (item) {
      item.style.color = i === currentTrack ? '#4caf50' : '#aaa';
      item.style.background = i === currentTrack ? 'rgba(76,175,80,0.15)' : '';
    }
  });

  setTimeout(togglePlay, 100);
}

function seekPlayer(e) {
  const bar = e.currentTarget;
  const rect = bar.getBoundingClientRect();
  playerProgress = ((e.clientX - rect.left) / rect.width) * 100;
  const fill = document.getElementById('player-fill');
  if (fill) fill.style.width = playerProgress + '%';
}

// ===== RECYCLE BIN =====
function buildRecycle() {
  return `
    <div class="window-toolbar">
      <button class="toolbar-btn" onclick="alert('Recycle Bin is empty!')">🗑️ Empty Recycle Bin</button>
    </div>
    <div class="window-content">
      <div class="recycle-empty">
        <div class="big-icon">🗑️</div>
        <p>Recycle Bin is empty</p>
        <p style="font-size:11px; color:#bbb">Files you delete will appear here</p>
      </div>
    </div>
  `;
}

// ===== WINDOW MANAGEMENT =====

function closeWin(appId) {
  const win = document.getElementById('win-' + appId);
  if (win) {
    win.style.animation = 'none';
    win.style.opacity = '0';
    win.style.transform = 'scale(0.95)';
    win.style.transition = 'all 0.1s';
    setTimeout(() => { win.remove(); }, 100);
  }
  removeTaskbarBtn(appId);
  delete openWindows[appId];

  // Stop media player if closing
  if (appId === 'mediaplayer') {
    clearInterval(playerInterval);
    clearInterval(playerBarInterval);
    playerPlaying = false;
  }
}

function minimizeWin(appId) {
  const win = document.getElementById('win-' + appId);
  if (win) win.classList.add('minimized');
  const btn = document.getElementById('tbtn-' + appId);
  if (btn) btn.classList.remove('active');
}

function toggleMaximize(appId) {
  const win = document.getElementById('win-' + appId);
  if (!win) return;
  const state = openWindows[appId];

  if (!state.maximized) {
    state.prevRect = {
      left: win.style.left, top: win.style.top,
      width: win.style.width, height: win.style.height,
    };
    win.classList.add('maximized');
    state.maximized = true;
  } else {
    win.classList.remove('maximized');
    if (state.prevRect) {
      win.style.left = state.prevRect.left;
      win.style.top = state.prevRect.top;
      win.style.width = state.prevRect.width;
      win.style.height = state.prevRect.height;
    }
    state.maximized = false;
  }
}

function bringToFront(appId) {
  const win = document.getElementById('win-' + appId);
  if (win) {
    win.style.zIndex = ++windowZCounter;
    win.classList.remove('minimized');
  }

  // Update taskbar button active state
  document.querySelectorAll('.taskbar-app-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById('tbtn-' + appId);
  if (btn) btn.classList.add('active');
  activeWindow = appId;
}

// Click on window to bring to front
document.getElementById('windows-container').addEventListener('mousedown', function (e) {
  const win = e.target.closest('.window');
  if (win) {
    const appId = win.id.replace('win-', '');
    bringToFront(appId);
  }
});

// ===== TASKBAR BUTTONS =====
function addTaskbarBtn(appId, cfg) {
  const container = document.getElementById('taskbar-apps');
  const existing = document.getElementById('tbtn-' + appId);
  if (existing) return;

  const btn = document.createElement('button');
  btn.className = 'taskbar-app-btn active';
  btn.id = 'tbtn-' + appId;
  btn.innerHTML = `<span class="t-icon">${cfg.icon}</span> ${cfg.title}`;
  btn.onclick = () => {
    const win = document.getElementById('win-' + appId);
    if (!win) return;
    if (win.classList.contains('minimized')) {
      win.classList.remove('minimized');
      bringToFront(appId);
    } else if (activeWindow === appId) {
      minimizeWin(appId);
    } else {
      bringToFront(appId);
    }
  };
  container.appendChild(btn);
}

function removeTaskbarBtn(appId) {
  const btn = document.getElementById('tbtn-' + appId);
  if (btn) btn.remove();
}

// ===== DRAGGABLE WINDOWS =====
function makeDraggable(win, appId) {
  const tb = win.querySelector('.window-titlebar');
  let dragging = false;
  let startX, startY, startL, startT;

  tb.addEventListener('mousedown', (e) => {
    if (e.target.closest('.window-controls')) return;
    if (openWindows[appId] && openWindows[appId].maximized) return;
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    startL = parseInt(win.style.left) || 0;
    startT = parseInt(win.style.top) || 0;
    bringToFront(appId);
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    let newL = startL + (e.clientX - startX);
    let newT = startT + (e.clientY - startY);
    // Constrain to screen
    newT = Math.max(0, Math.min(newT, window.innerHeight - 42 - 32));
    newL = Math.max(-win.offsetWidth + 60, Math.min(newL, window.innerWidth - 60));
    win.style.left = newL + 'px';
    win.style.top = newT + 'px';
  });

  document.addEventListener('mouseup', () => { dragging = false; });
}

// ===== RESIZABLE WINDOWS =====
function makeResizable(win) {
  const handle = document.createElement('div');
  handle.style.cssText = `
    position:absolute; right:0; bottom:0; width:14px; height:14px;
    cursor:se-resize; z-index:10;
    background: linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.15) 50%);
  `;
  win.appendChild(handle);

  let resizing = false;
  let startX, startY, startW, startH;

  handle.addEventListener('mousedown', (e) => {
    resizing = true;
    startX = e.clientX;
    startY = e.clientY;
    startW = win.offsetWidth;
    startH = win.offsetHeight;
    e.preventDefault();
    e.stopPropagation();
  });

  document.addEventListener('mousemove', (e) => {
    if (!resizing) return;
    const cfg = APP_CONFIG[win.id.replace('win-', '')] || {};
    const newW = Math.max(cfg.minWidth || 300, startW + (e.clientX - startX));
    const newH = Math.max(cfg.minHeight || 200, startH + (e.clientY - startY));
    win.style.width = newW + 'px';
    win.style.height = newH + 'px';
  });

  document.addEventListener('mouseup', () => { resizing = false; });
}

// ===== SHOW DESKTOP =====
function showDesktop() {
  const anyVisible = Object.keys(openWindows).some(id => {
    const win = document.getElementById('win-' + id);
    return win && !win.classList.contains('minimized');
  });

  Object.keys(openWindows).forEach(id => {
    const win = document.getElementById('win-' + id);
    if (!win) return;
    if (anyVisible) win.classList.add('minimized');
    else win.classList.remove('minimized');
  });
}

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeStartMenu();
});