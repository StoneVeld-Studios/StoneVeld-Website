import {Receptionist, CONTACT, TTL} from './engine.js';
import {createMessage} from './presentation.js';
import {createDisclosure, trapTab, nearBottom, revealMessage, fitViewport} from './ui.js';
const $=id=>document.getElementById(id);
let engine, timer, returnFocus;
const disclosure=createDisclosure(document,$('topics-toggle'),$('topics'));
const viewport=window.visualViewport;
const updateViewport=()=>fitViewport($('assistant'),viewport);
viewport?.addEventListener('resize',updateViewport);
viewport?.addEventListener('scroll',updateViewport);
updateViewport();
const scrollContainer=()=>$('assistant').classList.contains('short-viewport') || window.matchMedia('(max-height: 480px)').matches ? $('assistant') : $('messages');
const topics=[['Websites','websites'],['Creative Work','creative'],['Technical Help','technical'],['Team','team'],['Projects','projects'],['Contact','contact']];
function message(text, user=false, result=null) {
  const scroller=scrollContainer();
  const follow=nearBottom(scroller);
  const entry=createMessage(document,text,user,result,ask);
  $('messages').append(entry);
  // Bound the visible transcript as well as engine state.
  while($('messages').children.length>80) $('messages').firstElementChild.remove();
  if(follow) scroller.scrollTop=scroller.scrollHeight;
  return entry;
}
function render(result) { return message(result.text,false,result); }
function reset(text='Conversation cleared. What would you like to explore?') { clearTimeout(timer); engine?.clear(); disclosure.collapse(); if($('messages').contains(document.activeElement)) $('question').focus(); $('question').value=''; $('messages').replaceChildren(); message(text); }
function scheduleExpiry() { clearTimeout(timer); timer=setTimeout(()=>{ reset('Conversation expired after 10 minutes without activity. Start a new question whenever you are ready.'); },TTL); }
function ask(text,id) {
  if(!engine) return;
  if(engine.expire()) reset('Your previous conversation expired. Starting fresh.');
  disclosure.collapse();
  message(text,true);
  const answer=render(id==='projects'?engine.answer('projects'):id?engine.choose(id):engine.answer(text));
  scheduleExpiry(); $('question').focus({preventScroll:true});
  revealMessage(scrollContainer(),answer);
}
function open() { returnFocus=document.activeElement; $('assistant').hidden=false; $('launcher').setAttribute('aria-expanded','true'); document.querySelector('main').inert=true; $('launcher').hidden=true; ($('question').disabled?$('close'):$('question')).focus({preventScroll:true}); }
function close() { $('assistant').hidden=true; $('launcher').hidden=false; $('launcher').setAttribute('aria-expanded','false'); document.querySelector('main').inert=false; (returnFocus || $('launcher')).focus(); }
$('launcher').addEventListener('click',open); $('start').addEventListener('click',open); $('close').addEventListener('click',close);
$('assistant').addEventListener('keydown',event=>{
  if(event.key==='Escape'){event.preventDefault();close();}
  trapTab($('assistant'),document,event);
});
$('question-form').addEventListener('submit',event=>{event.preventDefault();const text=$('question').value.trim();if(text){$('question').value='';ask(text);}});
$('question').addEventListener('input',()=>{ if(engine?.lastActivity!==null && engine) { if(engine.expire()) reset('Your previous conversation expired. Starting fresh.'); else { engine.lastActivity=Date.now(); scheduleExpiry(); } } });
$('clear').addEventListener('click',()=>{reset();$('question').value='';$('question').focus();});
// Background tabs may throttle timers; check the clock again when resumed.
document.addEventListener('visibilitychange',()=>{if(!document.hidden && engine?.expire()) reset('Your previous conversation expired. Starting fresh.');});
message('Getting ready to help…');
try {
  const response=await fetch('./knowledge/public-facts.json',{cache:'no-store'});
  if(!response.ok) throw new Error('Knowledge load failed');
  engine=new Receptionist(await response.json());
  reset('Hello, I’m StoneVeld Assistant, a digital guide. Ask about services, people or projects, or open Explore topics below.');
  for(const [label,id] of topics){const button=document.createElement('button');button.type='button';button.textContent=label;button.addEventListener('click',()=>ask(label,id));$('topics').append(button);}
  $('question').disabled=false; $('send').disabled=false;
} catch {
  $('messages').replaceChildren(); render({text:'I’m having trouble getting started. Please contact info@stoneveldstudios.co.za. This link opens your email application; no message is sent automatically.',link:CONTACT});
}
