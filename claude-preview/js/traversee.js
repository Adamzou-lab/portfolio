import {PROJECTS as CHAPTERS} from './traversee-projects.js';
// Réglages communs à tous les projets, présents et futurs (millisecondes).
const SETTINGS = {chapterDuration:820,entryDuration:1150,lineDuration:1100,stepDelay:550};
const $ = (selector) => document.querySelector(selector);
const root = document.documentElement, portfolio = $('.portfolio'), stage = $('.chapter-stage');
const tablist = $('.chapter-navigation [role=tablist]');
const tabs = CHAPTERS.map((project,index)=>{
  const tab=document.createElement('button');
  tab.type='button';tab.id='tab-'+project.id;tab.dataset.chapter=project.id;
  tab.setAttribute('role','tab');tab.setAttribute('aria-controls','chapitres');
  tab.append(element('span',String(index+1).padStart(2,'0')),element('strong',project.name));
  return tab;
});
tablist.replaceChildren(...tabs);
const cards = [...document.querySelectorAll('.demo-card')];
let stepRows = [];
const dialog = $('.dossier-dialog');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const reduced = () => motion.matches || new URLSearchParams(location.search).get('reduit') === '1';
let current = Math.max(0,CHAPTERS.findIndex(c => '#'+c.id === location.hash));
let animations = [], lines = [], timers = [], entryToken = 0, entering = false, initial = true, wasPlaying = false, opener, lineMobile;
const busyIntro = () => root.classList.contains('intro-running') || root.classList.contains('intro-leaving-portfolio');
const stopAnimations = () => { ++entryToken;entering=false;animations.forEach(a=>a.cancel());animations=[]; };
const stopSequence = () => { timers.forEach(clearTimeout);timers=[];stepRows.forEach(row=>row.classList.remove('is-highlighted')); };
const animate = (el, frames, options) => { if(reduced()) return; const a=el.animate(frames,options);animations.push(a);return a; };

function element(tag,text,className){
  const el=document.createElement(tag);
  if(text!==undefined)el.textContent=text;
  if(className)el.className=className;
  return el;
}
function icon(name){const img=document.createElement('img');img.src='assets/icons/'+name+'.svg';img.alt='';img.className='icon';return img;}
function revealActiveTab(behavior='instant'){
  const rail=tablist.getBoundingClientRect(), tab=tabs[current].getBoundingClientRect();
  const delta=tab.left<rail.left?tab.left-rail.left:tab.right>rail.right?tab.right-rail.right:0;
  if(delta)tablist.scrollBy({left:delta,behavior});
}

// LeaderLine calcule les connexions depuis les vrais panneaux, y compris au redimensionnement.
function positionLines() {
  const mobile = innerWidth <= 760;
  if(lines.length && mobile!==lineMobile){setupLines();if(!busyIntro()&&!entering)lines.forEach(l=>l.show('none'));return;}
  lines.forEach(line=>line.position());
}
function setupLines(){
  if(!window.LeaderLine) return;
  lines.forEach(line=>line.remove());lines=[];
  const mobile=lineMobile=innerWidth<=760;
  lines=cards.slice(0,2).map((card,i)=>new LeaderLine(
    mobile?card:LeaderLine.pointAnchor(card,{x:'100%',y:i?'46%':'44%'}),
    mobile?cards[i+1]:LeaderLine.pointAnchor(cards[i+1],{x:0,y:i?'28%':'53%'}),
    {hide:true,color:'#161616',size:1.25,path:'fluid',startPlug:'disc',endPlug:'disc',startPlugSize:2.4,endPlugSize:2.4,startSocket:mobile?'bottom':'right',endSocket:mobile?'top':'left',startSocketGravity:mobile?28:40,endSocketGravity:mobile?28:40}));
  document.querySelectorAll('.leader-line,#leader-line-defs').forEach(el=>el.setAttribute('aria-hidden','true'));
  positionLines();
}
function showLines(){if(busyIntro() || entering || document.hidden)return;positionLines();lines.forEach(l=>l.show(reduced()?'none':'draw',{duration:SETTINGS.lineDuration,timing:'ease-in-out'}));}

function paint(index){
  const c=CHAPTERS[index];
  $('.chapter-number').textContent=String(index+1).padStart(2,'0');
  $('.chapter-copy h2').textContent=c.name;
  $('.chapter-subtitle').textContent=c.subtitle;
  $('[data-request-title]').textContent=c.request;
  $('#intention').placeholder=c.placeholder;$('#intention').value='';
  $('label[for=intention]').textContent=c.placeholder.replace('…','');
  $('[data-plan-title]').textContent=c.plan;
  stepRows=c.steps.map(text=>{const row=element('li');row.append(icon('circle'),element('span',text));return row;});
  $('.plan-steps').replaceChildren(...stepRows);
  $('[data-review-title]').textContent=c.review;
  $('[data-review-copy]').textContent=c.copy;
  $('.review-button span').textContent=c.action;
  $('.demo-feedback').textContent='';
  stage.dataset.chapter=c.id;
  stage.setAttribute('aria-labelledby',tabs[index].id);
  tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;});
}
function enter(direction=1, wholePage=false){
  stopAnimations();lines.forEach(l=>l.hide('none'));
  if(busyIntro())return;
  if(reduced()){showLines();return;}
  entering=true;
  const ease='cubic-bezier(.2,.75,.2,1)';
  if(wholePage)document.querySelectorAll('.entry').forEach((el,i)=>animate(el,[{opacity:0,transform:'translateY(22px)'},{opacity:1,transform:'none'}],{duration:SETTINGS.entryDuration,delay:i*85,easing:ease,fill:'backwards'}));
  animate($('.chapter-copy'),[{opacity:0,transform:`translateX(${direction*24}px)`},{opacity:1,transform:'none'}],{duration:SETTINGS.chapterDuration,easing:ease});
  cards.forEach((card,i)=>animate(card,[{opacity:0,transform:`translate(${direction*35}px, 18px)`},{opacity:1,transform:'none'}],{duration:SETTINGS.chapterDuration,delay:90+i*90,easing:ease,fill:'backwards'}));
  const token=++entryToken;
  Promise.all(animations.map(a=>a.finished.catch(()=>{}))).then(()=>{if(token===entryToken){entering=false;showLines();}});
}
function select(index,{history=true,focus=false}={}){
  index=(index+CHAPTERS.length)%CHAPTERS.length;
  if(index===current)return;
  const direction=index>current?1:-1;
  current=index;stopSequence();paint(index);enter(direction);
  $('[data-chapter-announcement]').textContent=`Projet ${index+1} sur ${CHAPTERS.length} : ${CHAPTERS[index].name}`;
  revealActiveTab(reduced()?'instant':'smooth');
  if(history)window.history.pushState(null,'','#'+CHAPTERS[index].id);
  if(focus)tabs[index].focus({preventScroll:true});
  else if(history && innerWidth<=760)stage.scrollIntoView({block:'start',behavior:reduced()?'instant':'smooth'});
}
tabs.forEach((tab,i)=>{
  tab.addEventListener('click',()=>select(i));
  tab.addEventListener('keydown',ev=>{
    const next=ev.key==='ArrowRight'?current+1:ev.key==='ArrowLeft'?current-1:ev.key==='Home'?0:ev.key==='End'?CHAPTERS.length-1:null;
    if(next===null)return;ev.preventDefault();select(next,{focus:true});
  });
});
document.querySelectorAll('[data-direction]').forEach(button=>button.addEventListener('click',()=>select(current+Number(button.dataset.direction))));
window.addEventListener('popstate',()=>select(Math.max(0,CHAPTERS.findIndex(c=>'#'+c.id===location.hash)),{history:false}));
window.addEventListener('hashchange',()=>{const n=CHAPTERS.findIndex(c=>'#'+c.id===location.hash);if(n>=0)select(n,{history:false});});

$('.request-form').addEventListener('submit',ev=>{
  ev.preventDefault();stopSequence();
  const intention=$('#intention').value.trim() || CHAPTERS[current].request;
  $('.demo-feedback').textContent=`Illustration pour « ${intention} » : les étapes restent un exemple, sans exécution réelle.`;
  // Les étapes s’allument une fois les cartes en place, pas pendant leur apparition.
  stepRows.forEach((row,i)=>{if(reduced())row.classList.add('is-highlighted');else timers.push(setTimeout(()=>row.classList.add('is-highlighted'),SETTINGS.chapterDuration+270+i*SETTINGS.stepDelay));});
  enter(1);
});
function renderDossier(project){
  const d=project.dossier, top=element('div',undefined,'dossier-top');
  top.append(element('span',d.eyebrow,'eyebrow'),element('span',d.type,'dossier-note'));
  const title=element('h2');title.id='dossier-title';
  d.title.forEach((line,i)=>{if(i)title.append(document.createElement('br'));title.append(document.createTextNode(line));});
  const grid=element('div',undefined,'dossier-grid');
  [[['Le besoin',d.need],['Mon rôle',d.role]],[['Le fonctionnement',d.system],['Le périmètre',d.limits]]].forEach(sections=>{
    const column=element('div');
    sections.forEach(([heading,text])=>column.append(element('h3',heading),element('p',text)));
    grid.append(column);
  });
  const end=element('div',undefined,'dossier-end');
  if(d.link){
    const link=element('a',d.link.label,'text-link');link.href=d.link.url;link.target='_blank';link.rel='noopener';link.append(icon('arrow-up-right'));end.append(link);
  }else end.append(element('span',d.tags.join(' / ')));
  const close=element('button','Refermer le dossier','text-link');close.type='button';close.append(icon('arrow-right'));close.addEventListener('click',closeDossier);end.append(close);
  $('.dialog-content').replaceChildren(top,title,grid,end);
}
function closeDossier(){dialog.close();opener?.focus({preventScroll:true});}
document.querySelectorAll('[data-open-dossier]').forEach(button=>button.addEventListener('click',()=>{
  opener=button;
  renderDossier(CHAPTERS[current]);
  dialog.showModal();
  animate(dialog,[{opacity:0,transform:'translateY(18px)'},{opacity:1,transform:'none'}],{duration:350,easing:'ease-out'});
}));
$('.dialog-close').addEventListener('click',closeDossier);
dialog.addEventListener('click',ev=>{if(ev.target===dialog){const r=dialog.getBoundingClientRect();if(ev.clientX<r.left||ev.clientX>r.right||ev.clientY<r.top||ev.clientY>r.bottom)closeDossier();}});

function syncIntro(){
  const playing=busyIntro();portfolio.inert=playing;
  if(playing){++entryToken;stopAnimations();stopSequence();lines.forEach(l=>l.hide('none'));}
  else if(wasPlaying||initial){initial=false;enter(1,true);}
  wasPlaying=playing;
}
const observer=new MutationObserver(syncIntro);
let resizeFrame;
window.addEventListener('resize',()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>{positionLines();revealActiveTab();});});
motion.addEventListener('change',()=>{stopAnimations();stopSequence();positionLines();showLines();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopSequence();stopAnimations();}else{positionLines();showLines();}});
window.addEventListener('pagehide',ev=>{if(!ev.persisted){++entryToken;observer.disconnect();cancelAnimationFrame(resizeFrame);stopAnimations();stopSequence();lines.forEach(l=>l.remove());lines=[];}});
paint(current);
portfolio.inert=busyIntro();
await document.fonts.ready;
revealActiveTab();setupLines();observer.observe(root,{attributes:true,attributeFilter:['class']});syncIntro();
