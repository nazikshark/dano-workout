function checkPassword() {
    const pass = document.getElementById('access-pass').value;
    const lockScreen = document.getElementById('lock-screen');
    
    if (pass === "1234") { 
        lockScreen.style.opacity = '0';
        setTimeout(() => {
            lockScreen.style.display = 'none';
        }, 500);
    } else {
        document.getElementById('access-pass').style.borderColor = 'var(--red)';
        alert("Неверный пароль!");
    }
}
// --- FIREBASE INIT ---
let db;
async function initFirebase() {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js");
    const { getFirestore } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    
    const firebaseConfig = {
      apiKey: "AIzaSyA985u6sB7RbrprmLbW3BWObWGeHkERwW4",
      authDomain: "danoworkout-42dae.firebaseapp.com",
      projectId: "danoworkout-42dae",
      storageBucket: "danoworkout-42dae.firebasestorage.app",
      messagingSenderId: "736598871384",
      appId: "1:736598871384:web:feb3c20baa36691cff692d",
      measurementId: "G-C3QWHJBCZK"
    };

    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
}
initFirebase();
// Проверка, кто был последним
const lastUser = localStorage.getItem('last_user_id');
if (lastUser) {
    // Если мы знаем кто это, "автоматически" нажимаем кнопку выбора
    // Нужно просто вызвать логику выбора
    // Но для начала давай добьемся работы хотя бы ручного выбора
}

// --- ФУНКЦИИ ОБЛАКА ---
// Сохранение
async function saveToCloud() {
    if (!currentUserId) return; // Если не выбран юзер, ничего не шлем
    const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    try {
        // Теперь данные будут лежать в users/nazik или users/papa
        await setDoc(doc(db, "users", currentUserId), {
            workouts: WORKOUTS,
            weights: weights,
            updatedAt: new Date()
        });
    } catch (e) { console.error("Ошибка сохранения: ", e); }
}

// Загрузка
async function loadFromCloud() {
    if (!currentUserId) return;
    const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    
    const docSnap = await getDoc(doc(db, "users", currentUserId));
    if (docSnap.exists()) {
        const data = docSnap.data();
        WORKOUTS = data.workouts;
        weights = data.weights;
        renderWorkouts();
    } else {
        // Если данных для этого юзера еще нет в облаке, берем пустой список
        WORKOUTS = []; 
        renderWorkouts();
    }
}
/* DATA */
const COLORS_LIST=[
  {hex:'#0066FF',bg:'#EBF2FF'},{hex:'#FF3B30',bg:'#FFF0EE'},
  {hex:'#34C759',bg:'#EBFAF1'},{hex:'#FF9500',bg:'#FFF5E6'},
  {hex:'#AF52DE',bg:'#F5E6FF'},{hex:'#FF2D55',bg:'#FFEBF0'},
];
const SVG_OPTIONS=[
  {id:'arms',label:'Руки'},{id:'chest',label:'Грудь'},
  {id:'back',label:'Спина'},{id:'shoulders',label:'Плечи'},
  {id:'legs',label:'Ноги'},{id:'core',label:'Пресс'},
  {id:'glutes',label:'Ягодицы'},{id:'full',label:'Всё тело'},
];
let currentUserId = null;
let WORKOUTS=JSON.parse(localStorage.getItem('dano_wk')||'null')||[
  {id:'arms',name:'Руки',sub:'Бицепс & Трицепс',svgId:'arms',color:'#0066FF',bg:'#EBF2FF',
    exercises:[
      {id:1,name:'Подъём на бицепс стоя',sets:4,reps:10,emoji:'💪',equip:'db2',kg:12},
      {id:2,name:'Молоток',sets:3,reps:12,emoji:'🔨',equip:'db2',kg:10},
      {id:3,name:'Концентрированный подъём',sets:3,reps:12,emoji:'🎯',equip:'db1',kg:8},
      {id:4,name:'Французский жим',sets:3,reps:10,emoji:'🧠',equip:'db2',kg:8},
    ]},
  {id:'shoulders',name:'Плечи',sub:'Дельты',svgId:'shoulders',color:'#FF9500',bg:'#FFF5E6',
    exercises:[
      {id:30,name:'Жим вверх',sets:4,reps:10,emoji:'☝️',equip:'db2',kg:10},
      {id:31,name:'Подъём через стороны',sets:3,reps:15,emoji:'↔️',equip:'db2',kg:6},
      {id:32,name:'С резинкой',sets:3,reps:12,emoji:'🔴',equip:'band',bandColor:'red',kg:0},
    ]},
];
let weights=JSON.parse(localStorage.getItem('dano_wgt')||'{}');
const persist = () => {
    if (!currentUserId) {
        console.log("Внимание: пользователь не выбран, сохраняю только в локальный кэш");
        return;
    }
    
    // Сохраняем с привязкой к юзеру
    localStorage.setItem('dano_wk_' + currentUserId, JSON.stringify(WORKOUTS));
    localStorage.setItem('dano_wgt_' + currentUserId, JSON.stringify(weights));
    
    // Запоминаем последнего активного юзера
    localStorage.setItem('last_user_id', currentUserId);
    
    saveToCloud();
};

/* STATE */
let currentUser=null,currentWorkout=null;
let wm_editId=null,wm_svgId='arms',wm_color='#0066FF',wm_bg='#EBF2FF';
let em_editId=null,em_sets=3,em_reps=12,em_equip='db2',em_bandColor='black';
let wgt_exId=null,wgt_equip='db2';
let wgt_state={upper:{left:0,right:0},lower:{left:0,right:0},band:null};
let wgt_db='upper',wgt_side='left',wgt_symm=true;

/* NAV */
function goTo(id){
  const cur=document.querySelector('.screen.active');
  if(cur){cur.classList.add('exit');setTimeout(()=>cur.classList.remove('active','exit'),340);}
  const n=document.getElementById(id);
  n.style.transform='translateX(28px)';n.classList.add('active');
  requestAnimationFrame(()=>{n.style.transform='';});
}
function goBack(from,to){
  const f=document.getElementById(from),t=document.getElementById(to);
  f.style.transition='opacity .28s,transform .28s';f.style.opacity='0';f.style.transform='translateX(28px)';
  setTimeout(()=>{f.classList.remove('active');f.style.cssText='';
    t.style.transform='translateX(-28px)';t.classList.add('active');
    requestAnimationFrame(()=>{t.style.transform='';});},300);
}
function bgClose(e,id){if(e.target===document.getElementById(id))closeModal(id);}
function openModal(id){document.getElementById(id).classList.add('open');}
function closeModal(id){document.getElementById(id).classList.remove('open');}

/* S1→S2 */
function selectUser(name, emoji, color, userId) { 
  currentUserId = userId; 
  currentUser = {name, emoji, color};
  
  document.getElementById('user-pill-dot').textContent = emoji;
  document.getElementById('user-pill-dot').style.background = color + '22';
  document.getElementById('user-pill-name').textContent = name;
  
  loadFromCloud();
  renderWorkouts();
  goTo('s-workouts');
}

function renderWorkouts(){
  document.getElementById('workouts-grid').innerHTML=WORKOUTS.map((w,i)=>`
    <div class="wcard" style="animation-delay:${i*.05+.04}s">
      <div class="wcard-accent-bar" style="background:${w.color}"></div>
      <div class="wcard-actions">
        <button class="wcard-icon-btn wcard-edit-btn" onclick="openWorkoutModal('${w.id}',event)">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M9.5 1.5l2 2L4 11H2V9L9.5 1.5z" stroke="${w.color}" stroke-width="1.4" fill="none" stroke-linejoin="round"/>
          </svg>
        </button>
        <button class="wcard-icon-btn wcard-del-btn" id="wdel-${w.id}" onclick="toggleDelW(event,'${w.id}')">
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M2 5.5h7" stroke="var(--red)" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <span class="wcard-del-label">Удалить?</span>
        </button>
      </div>
      <div class="wcard-tap" onclick="selectWorkout('${w.id}')">
        ${muscleSVG(w.svgId||w.id,w.color)}
        <div class="wcard-name">${w.sub}</div>
        <div class="wcard-count">${w.exercises.length} упр</div>
        <div class="wcard-tag" style="background:${w.bg};color:${w.color}">${w.name}</div>
      </div>
    </div>`).join('');
}

function toggleDelW(e,id){
  e.stopPropagation();
  const btn=document.getElementById('wdel-'+id);
  if(btn.classList.contains('expanded')){WORKOUTS=WORKOUTS.filter(w=>w.id!==id);persist();renderWorkouts();}
  else{document.querySelectorAll('.wcard-del-btn.expanded').forEach(b=>b.classList.remove('expanded'));btn.classList.add('expanded');}
}

/* WORKOUT MODAL */
function buildWmSvgGrid(){
  document.getElementById('wm-svg-grid').innerHTML=SVG_OPTIONS.map(o=>`
    <div class="svg-opt${wm_svgId===o.id?' sel':''}" onclick="pickWmSvg('${o.id}',this)">
      ${muscleSVG(o.id,'#0066FF')}
      <div class="svg-opt-label">${o.label}</div>
    </div>`).join('');
}
function buildWmColorRow(){
  document.getElementById('wm-color-row').innerHTML=COLORS_LIST.map(c=>`
    <div class="color-sw${wm_color===c.hex?' sel':''}" style="background:${c.hex}"
      onclick="pickWmColor('${c.hex}','${c.bg}',this)"></div>`).join('');
}
function pickWmSvg(id,el){wm_svgId=id;document.querySelectorAll('.svg-opt').forEach(e=>e.classList.remove('sel'));el.classList.add('sel');}
function pickWmColor(hex,bg,el){wm_color=hex;wm_bg=bg;document.querySelectorAll('.color-sw').forEach(e=>e.classList.remove('sel'));el.classList.add('sel');}

function openWorkoutModal(id,e){
  if(e)e.stopPropagation();
  wm_editId=id;
  if(id){
    const w=WORKOUTS.find(x=>x.id===id);
    wm_svgId=w.svgId||w.id;wm_color=w.color;wm_bg=w.bg;
    document.getElementById('wm-title').textContent='Изменить тренировку';
    document.getElementById('wm-name').value=w.name;
    document.getElementById('wm-sub').value=w.sub;
  } else {
    wm_svgId='arms';wm_color='#0066FF';wm_bg='#EBF2FF';
    document.getElementById('wm-title').textContent='Новая тренировка';
    document.getElementById('wm-name').value='';
    document.getElementById('wm-sub').value='';
  }
  buildWmSvgGrid();buildWmColorRow();openModal('workout-modal');
}
function saveWorkout(){
  const name=document.getElementById('wm-name').value.trim();
  const sub=document.getElementById('wm-sub').value.trim();
  if(!name){document.getElementById('wm-name').focus();return;}
  if(wm_editId){
    const w=WORKOUTS.find(x=>x.id===wm_editId);
    Object.assign(w,{name,sub:sub||name,svgId:wm_svgId,color:wm_color,bg:wm_bg});
  } else {
    WORKOUTS.push({id:'w'+Date.now(),name,sub:sub||name,svgId:wm_svgId,color:wm_color,bg:wm_bg,exercises:[]});
  }
  persist();renderWorkouts();closeModal('workout-modal');
}

/* S2→S3 */
function selectWorkout(id){
  document.querySelectorAll('.wcard-del-btn.expanded').forEach(b=>b.classList.remove('expanded'));
  currentWorkout=WORKOUTS.find(w=>w.id===id);
  // FIX: badge shows only name, not svgId+name
  document.getElementById('ex-badge-pill').innerHTML=currentWorkout.name;
  document.getElementById('ex-badge-pill').style.background=currentWorkout.bg;
  document.getElementById('ex-badge-pill').style.color=currentWorkout.color;
  renderExercises();goTo('s-exercises');
}

function renderExercises(){
  const c=currentWorkout.color,bg=currentWorkout.bg;
  document.getElementById('ex-eyebrow').textContent=currentWorkout.exercises.length+' упр';
  document.getElementById('ex-title').textContent=currentWorkout.sub;
  document.getElementById('exercises-list').innerHTML=currentWorkout.exercises.map((ex,i)=>{
    const stored=weights[ex.id];
    let kgDisplay;
    const bandEmoji={black:'⚫',green:'🟢',red:'🔴'};
    if(ex.equip==='band'){
      const bc=stored?.band||ex.bandColor||'black';
      kgDisplay=bandEmoji[bc];
    } else if(stored&&typeof stored==='object'){
      const total=2+stored.upper.left+stored.upper.right;
      kgDisplay=stored.band?bandEmoji[stored.band]+' '+total:total;
    } else {
      kgDisplay=stored||ex.kg;
    }
    return `
    <div class="ex-card" id="excard-${ex.id}" style="animation-delay:${i*.04+.04}s">
      <div class="ex-del-wrap">
        <button class="ex-del-btn" id="exdel-${ex.id}" onclick="toggleDelEx(event,${ex.id})">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 5h6" stroke="var(--red)" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
          <span class="ex-del-label">Удалить?</span>
        </button>
      </div>
      <div class="ex-icon" style="background:${bg}">${ex.emoji||'💪'}</div>
      <div class="ex-info">
        <div class="ex-name">${ex.name}</div>
        <div class="ex-sets">${ex.sets} × ${ex.reps}</div>
        <div class="ex-actions-row">
          <button class="ex-btn ex-btn-weight" onclick="openWeightModal(${ex.id})">
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path d="M8.5 1.5l2 2L4 10H2v-2L8.5 1.5z" stroke="${c}" stroke-width="1.3" fill="none"/>
            </svg>
            Изменить вес
          </button>
          <button class="ex-btn ex-btn-edit" onclick="openExModal(${ex.id})">
            ✏️ Изменить упражнение
          </button>
        </div>
      </div>
      <div class="ex-weight-col">
        <div class="ex-kg-num" id="exkg-${ex.id}" style="color:${c}">${kgDisplay}</div>
        <div class="ex-kg-unit">${ex.equip==='band'?'резинка':'кг'}</div>
      </div>
    </div>`;
  }).join('');
}

function toggleDelEx(e,id){
  e.stopPropagation();
  const btn=document.getElementById('exdel-'+id);
  if(btn.classList.contains('expanded')){
    currentWorkout.exercises=currentWorkout.exercises.filter(ex=>ex.id!==id);
    persist();renderExercises();
  } else {
    document.querySelectorAll('.ex-del-btn.expanded').forEach(b=>b.classList.remove('expanded'));
    btn.classList.add('expanded');
  }
}

/* EXERCISE MODAL */
function setSets(n){
  em_sets=n;
  document.querySelectorAll('#sets-seg .seg-btn').forEach(b=>b.classList.toggle('sel',+b.textContent===n));
  document.getElementById('sets-custom').value='';
}
function setSetsCustom(v){
  em_sets=parseInt(v)||em_sets;
  document.querySelectorAll('#sets-seg .seg-btn').forEach(b=>b.classList.remove('sel'));
}
function setReps(n){
  em_reps=n;
  document.querySelectorAll('#reps-seg .seg-btn').forEach(b=>b.classList.toggle('sel',+b.textContent===n));
  document.getElementById('reps-custom').value='';
}
function setRepsCustom(v){
  em_reps=parseInt(v)||em_reps;
  document.querySelectorAll('#reps-seg .seg-btn').forEach(b=>b.classList.remove('sel'));
}
function selectEquip(type){
  em_equip=type;
  ['db2','db1','band'].forEach(t=>document.getElementById('eq-'+t)?.classList.toggle('sel',t===type));
  document.getElementById('em-band-row').style.display=type==='band'?'':'none';
}
function selectBandColor(c){
  em_bandColor=c;
  ['black','green','red'].forEach(x=>document.getElementById('bc-'+x)?.classList.toggle('sel',x===c));
}

function openExModal(id){
  em_editId=id;
  document.getElementById('em-title').textContent=id?'Изменить упражнение':'Новое упражнение';
  if(id){
    const ex=currentWorkout.exercises.find(e=>e.id===id);
    document.getElementById('em-emoji').value=ex.emoji||'💪';
    document.getElementById('em-name').value=ex.name;
    em_sets=ex.sets||3;em_reps=ex.reps||12;
    em_equip=ex.equip||'db2';em_bandColor=ex.bandColor||'black';
  } else {
    document.getElementById('em-emoji').value='💪';
    document.getElementById('em-name').value='';
    em_sets=3;em_reps=12;em_equip='db2';em_bandColor='black';
  }
  document.getElementById('sets-custom').value='';
  document.getElementById('reps-custom').value='';
  setSets(em_sets);setReps(em_reps);selectEquip(em_equip);
  if(em_equip==='band')selectBandColor(em_bandColor);
  openModal('exercise-modal');
}
function saveExercise(){
  const name=document.getElementById('em-name').value.trim();
  const emoji=document.getElementById('em-emoji').value.trim()||'💪';
  const setsVal=parseInt(document.getElementById('sets-custom').value)||em_sets;
  const repsVal=parseInt(document.getElementById('reps-custom').value)||em_reps;
  if(!name){document.getElementById('em-name').focus();return;}
  if(em_editId){
    const ex=currentWorkout.exercises.find(e=>e.id===em_editId);
    Object.assign(ex,{name,emoji,sets:setsVal,reps:repsVal,equip:em_equip,bandColor:em_bandColor});
    // sync band color into saved weight state if band equip
    if(em_equip==='band'){
      if(!weights[em_editId]||typeof weights[em_editId]!=='object')weights[em_editId]={};
      weights[em_editId].band=em_bandColor;
    }
  } else {
    currentWorkout.exercises.push({id:Date.now(),name,emoji,sets:setsVal,reps:repsVal,
      equip:em_equip,bandColor:em_bandColor,kg:2});
  }
  persist();renderExercises();closeModal('exercise-modal');
}

/* WEIGHT MODAL */
function openWeightModal(exId){
  wgt_exId=exId;
  const ex=currentWorkout.exercises.find(e=>e.id===exId);
  wgt_equip=ex.equip||'db2';
  document.getElementById('wgt-name').textContent=ex.name;

  const isBand=wgt_equip==='band';
  document.getElementById('wgt-db-section').style.display=isBand?'none':'';
  document.getElementById('wgt-band-section').style.display=isBand?'':'none';
  document.getElementById('wgt-sub').textContent=isBand?'Выбор резинки':'Детальное распределение нагрузок';

  if(isBand){
    // sync band color from exercise definition
    const savedBand=(weights[exId]&&weights[exId].band)||ex.bandColor||'black';
    ['black','green','red'].forEach(c=>{
      document.getElementById('bo-'+c)?.classList.toggle('sel',c===savedBand);
    });
    wgt_state.band=savedBand;
  } else {
    const saved=weights[exId];
    if(saved&&typeof saved==='object'){
      wgt_state=JSON.parse(JSON.stringify(saved));
    } else {
      const plates=Math.max(0,(saved||ex.kg||2)-2);
      wgt_state={upper:{left:plates,right:plates},lower:{left:plates,right:plates},band:null};
    }
    // show/hide lower row for db1
    document.getElementById('dbrow-lower').style.display=wgt_equip==='db1'?'none':'';
    wgt_db='upper';wgt_side='left';wgt_symm=true;
    document.getElementById('symm-box').classList.add('on');
  }
  updateWgtUI();
  openModal('weight-modal');
}

function pickBandOnly(color){
  wgt_state.band=color;
  ['black','green','red'].forEach(c=>document.getElementById('bo-'+c)?.classList.toggle('sel',c===color));
}

function setActiveDb(db){wgt_db=db;updateWgtUI();}
function setZone(db,side,e){e.stopPropagation();wgt_db=db;wgt_side=side;updateWgtUI();}
function toggleSymm(){wgt_symm=!wgt_symm;document.getElementById('symm-box').classList.toggle('on',wgt_symm);}
function cloneDb(src){const tgt=src==='upper'?'lower':'upper';wgt_state[tgt]=JSON.parse(JSON.stringify(wgt_state[src]));updateWgtUI();}

function modifyPlate(delta){
  let v=wgt_state[wgt_db][wgt_side];
  v=Math.max(0,v+delta);
  wgt_state[wgt_db][wgt_side]=v;
  if(wgt_symm){const m=wgt_side==='left'?'right':'left';wgt_state[wgt_db][m]=v;}
  updateWgtUI();
}

function updateWgtUI(){
  if(wgt_equip==='band')return;
  const tU=2+wgt_state.upper.left+wgt_state.upper.right;
  const tL=2+wgt_state.lower.left+wgt_state.lower.right;
  document.getElementById('tv-upper').textContent=tU;
  document.getElementById('tv-lower').textContent=tL;
  document.querySelectorAll('.db-row').forEach(r=>r.classList.remove('active-db'));
  document.getElementById('dbrow-'+wgt_db)?.classList.add('active-db');
  document.querySelectorAll('.zone-box').forEach(z=>z.classList.remove('active-zone'));
  document.getElementById('zone-'+wgt_db+'-'+wgt_side)?.classList.add('active-zone');
  const dbRu={upper:'Верхняя',lower:'Нижняя'};
  const sRu={left:'Лево',right:'Право'};
  document.getElementById('active-badge').textContent=(dbRu[wgt_db]||'—')+' · '+(sRu[wgt_side]||'—');
  renderPlates('upper','left','pul');renderPlates('upper','right','pur');
  renderPlates('lower','left','pll');renderPlates('lower','right','plr');
}

function renderPlates(db,side,elId){
  const SIZES=[{w:14,fill:'#FF3B30',dark:'#D4291F',val:5},{w:10,fill:'#34C759',dark:'#1A9E45',val:2},{w:7,fill:'#0066FF',dark:'#004FCC',val:1}];
  let rem=wgt_state[db][side];const plates=[];
  for(const s of SIZES){while(rem>=s.val&&plates.length<6){plates.push(s);rem-=s.val;}}
  let html='';
  if(side==='left'){let lx=42;plates.forEach(p=>{lx-=p.w;
    html+=`<rect x="${lx}" y="14" width="${p.w-2}" height="24" rx="3" fill="${p.fill}"/>
           <rect x="${lx+2}" y="17" width="${p.w-6}" height="18" rx="2" fill="${p.dark}" opacity=".5"/>`;});}
  else{let rx=198;plates.forEach(p=>{
    html+=`<rect x="${rx+2}" y="14" width="${p.w-2}" height="24" rx="3" fill="${p.fill}"/>
           <rect x="${rx+4}" y="17" width="${p.w-6}" height="18" rx="2" fill="${p.dark}" opacity=".5"/>`;rx+=p.w;});}
  const el=document.getElementById(elId);if(el)el.innerHTML=html;
}

function saveWeight(){
  const ex=currentWorkout.exercises.find(e=>e.id===wgt_exId);
  if(wgt_equip==='band'){
    // sync band color back into exercise definition
    ex.bandColor=wgt_state.band||ex.bandColor||'black';
    weights[wgt_exId]={band:ex.bandColor};
  } else {
    weights[wgt_exId]=JSON.parse(JSON.stringify(wgt_state));
  }
  persist();
  // update display
  const stored=weights[wgt_exId];
  const bandEmoji={black:'⚫',green:'🟢',red:'🔴'};
  let display;
  if(wgt_equip==='band'){
    display=bandEmoji[stored.band||'black'];
  } else {
    const total=2+wgt_state.upper.left+wgt_state.upper.right;
    display=stored.band?bandEmoji[stored.band]+' '+total:total;
  }
  const el=document.getElementById('exkg-'+wgt_exId);
  if(el){el.textContent=display;el.style.transform='scale(1.2)';setTimeout(()=>el.style.transform='',220);}
  closeModal('weight-modal');
}

/* SVGs */
function muscleSVG(id,c){
  const m={
    arms:`<svg class="wcard-svg" viewBox="0 0 64 64" fill="none">
      <path d="M12 44 Q9 36 13 26 Q18 14 24 18 Q32 22 28 34 Q25 42 18 45 Q14 47 12 44Z" fill="${c}" opacity=".85"/>
      <ellipse cx="20" cy="28" rx="4" ry="6" fill="white" opacity=".2" transform="rotate(-10 20 28)"/>
      <path d="M36 42 Q34 34 38 26 Q42 18 48 22 Q54 26 52 36 Q50 44 44 45 Q38 46 36 42Z" fill="${c}" opacity=".4"/>
    </svg>`,
    chest:`<svg class="wcard-svg" viewBox="0 0 64 64" fill="none">
      <path d="M10 22 Q10 15 20 13 Q30 11 32 21 Q34 11 44 13 Q54 15 54 22 Q54 37 32 50 Q10 37 10 22Z" fill="${c}" opacity=".8"/>
      <path d="M32 20 L32 50" stroke="white" stroke-width="1.5" opacity=".15" stroke-dasharray="3 3"/>
      <ellipse cx="22" cy="24" rx="7" ry="5" fill="white" opacity=".15" transform="rotate(-8 22 24)"/>
      <ellipse cx="42" cy="24" rx="7" ry="5" fill="white" opacity=".15" transform="rotate(8 42 24)"/>
    </svg>`,
    back:`<svg class="wcard-svg" viewBox="0 0 64 64" fill="none">
      <path d="M14 15 Q18 11 32 11 Q46 11 50 15 L54 51 Q46 57 32 57 Q18 57 10 51Z" fill="${c}" opacity=".75"/>
      <path d="M32 12 L32 56" stroke="white" stroke-width="2" opacity=".12"/>
      <path d="M18 26 Q32 22 46 26" stroke="white" stroke-width="1.5" opacity=".2" fill="none" stroke-linecap="round"/>
      <path d="M16 34 Q32 30 48 34" stroke="white" stroke-width="1.5" opacity=".2" fill="none" stroke-linecap="round"/>
    </svg>`,
    shoulders:`<svg class="wcard-svg" viewBox="0 0 64 64" fill="none">
      <ellipse cx="13" cy="26" rx="9" ry="12" fill="${c}" opacity=".8"/>
      <ellipse cx="51" cy="26" rx="9" ry="12" fill="${c}" opacity=".8"/>
      <path d="M22 20 Q32 14 42 20 L44 28 Q32 26 20 28Z" fill="${c}" opacity=".5"/>
      <ellipse cx="13" cy="20" rx="3.5" ry="3" fill="white" opacity=".25"/>
      <ellipse cx="51" cy="20" rx="3.5" ry="3" fill="white" opacity=".25"/>
    </svg>`,
    legs:`<svg class="wcard-svg" viewBox="0 0 64 64" fill="none">
      <path d="M18 10 Q14 10 12 16 L10 38 Q10 50 16 56 Q20 60 24 56 L26 42 Q28 36 32 36 Q36 36 38 42 L40 56 Q44 60 48 56 Q54 50 54 38 L52 16 Q50 10 46 10Z" fill="${c}" opacity=".75"/>
      <ellipse cx="22" cy="28" rx="5" ry="8" fill="white" opacity=".12"/>
      <ellipse cx="42" cy="28" rx="5" ry="8" fill="white" opacity=".12"/>
    </svg>`,
    core:`<svg class="wcard-svg" viewBox="0 0 64 64" fill="none">
      <rect x="20" y="12" width="24" height="40" rx="8" fill="${c}" opacity=".7"/>
      <rect x="23" y="16" width="8" height="7" rx="2" fill="white" opacity=".18"/>
      <rect x="33" y="16" width="8" height="7" rx="2" fill="white" opacity=".18"/>
      <rect x="23" y="26" width="8" height="7" rx="2" fill="white" opacity=".18"/>
      <rect x="33" y="26" width="8" height="7" rx="2" fill="white" opacity=".18"/>
      <rect x="23" y="36" width="8" height="7" rx="2" fill="white" opacity=".18"/>
      <rect x="33" y="36" width="8" height="7" rx="2" fill="white" opacity=".18"/>
    </svg>`,
    glutes:`<svg class="wcard-svg" viewBox="0 0 64 64" fill="none">
      <ellipse cx="20" cy="34" rx="14" ry="18" fill="${c}" opacity=".75"/>
      <ellipse cx="44" cy="34" rx="14" ry="18" fill="${c}" opacity=".75"/>
      <ellipse cx="20" cy="28" rx="7" ry="6" fill="white" opacity=".15"/>
      <ellipse cx="44" cy="28" rx="7" ry="6" fill="white" opacity=".15"/>
    </svg>`,
    full:`<svg class="wcard-svg" viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="10" r="6" fill="${c}" opacity=".6"/>
      <rect x="26" y="18" width="12" height="20" rx="4" fill="${c}" opacity=".8"/>
      <rect x="14" y="20" width="10" height="14" rx="3" fill="${c}" opacity=".5"/>
      <rect x="40" y="20" width="10" height="14" rx="3" fill="${c}" opacity=".5"/>
      <rect x="24" y="38" width="7" height="18" rx="3" fill="${c}" opacity=".7"/>
      <rect x="33" y="38" width="7" height="18" rx="3" fill="${c}" opacity=".7"/>
    </svg>`,
  };
  return m[id]||m['arms'];
}
