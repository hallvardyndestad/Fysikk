(()=>{
 'use strict';
 const {questions,units,chapters}=window.FYSIKK_BANK,E=window.FysikkEngine,byId=Object.fromEntries(questions.map(q=>[q.id,q])),el=id=>document.getElementById(id);
 const STORAGE='fysikk2-elevaktivitet-v1',names={practice:'Øving',streak:'Streak',exam:'Eksamen'};
 let state=null,setupMode='practice',preview=null,reviewIds=[],reviewIndex=0,timer=null,storageOK=true,viewAway=false;
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const counts=Object.fromEntries(chapters.map(c=>[c.id,questions.filter(q=>q.chapter===c.id).length]));
 function cancelTimer(){if(timer){clearTimeout(timer);timer=null;}}
 function persist(){try{localStorage.setItem(STORAGE,JSON.stringify(state));}catch(e){storageOK=false;}}
 function restore(){try{const saved=JSON.parse(localStorage.getItem(STORAGE)||'null');if(saved&&saved.bankVersion===1&&['practice','streak','exam'].includes(saved.mode)&&saved.ids?.length&&saved.ids.every(id=>byId[id])&&saved.chapters?.length&&Number.isInteger(saved.index)&&saved.index>=0&&saved.index<saved.ids.length&&saved.answers&&Object.entries(saved.answers).every(([id,a])=>saved.ids.includes(id)&&/^[ABCD]$/.test(a)))state=saved;}catch(e){storageOK=false;}}
 function screen(id){cancelTimer();if(id!=='session')viewAway=false;for(const n of ['menu','setup','session','results','review'])el(n).hidden=n!==id;el('home').hidden=id==='menu';window.scrollTo({top:0,behavior:'instant'});}
 function departureCount(){return Number.isInteger(state?.viewDepartures)&&state.viewDepartures>=0?state.viewDepartures:0;}
 function leftView(){if(viewAway||state?.mode!=='streak'||state.phase!=='active'||el('session').hidden)return;viewAway=true;state.viewDepartures=departureCount()+1;cancelTimer();persist();}
 function returnedToView(){if(!document.hidden&&document.hasFocus())viewAway=false;}
 window.addEventListener('blur',leftView);
 window.addEventListener('focus',returnedToView);
 document.addEventListener('visibilitychange',()=>document.hidden?leftView():returnedToView());
 window.addEventListener('pagehide',leftView);
 function menu(){screen('menu');el('resume-box').hidden=!state;if(state)el('resume-description').textContent=state.phase==='results'?`${names[state.mode]} · Resultatet er lagret`:`${names[state.mode]} · ${Object.keys(state.answers).length} av ${state.ids.length} besvart`;}
 function chosenChapters(){return [...document.querySelectorAll('#chapters input:checked')].map(c=>Number(c.value));}
 function configure(mode){setupMode=mode;preview=null;screen('setup');el('setup-title').textContent=names[mode];el('setup-description').textContent=mode==='practice'?'Velg hva du vil øve på. Du får fasit og forklaring etter hvert svar.':mode==='exam'?'Du kan bla fritt og endre svarene. Fasit vises først etter innlevering.':'Klar minst 15 riktige på rad fra minst tre kapitler. Alle kapitlene du velger, blir med i forsøket. Bytte av fane eller vindu registreres og vises i resultatet.';el('count-box').hidden=mode==='streak';el('question-count').disabled=mode==='streak';el('auto-box').hidden=mode==='exam';el('auto-next').checked=mode==='streak';el('chapters').innerHTML=chapters.map(c=>`<label class="chapter-option"><input type="checkbox" value="${c.id}" checked><span><strong>Kapittel ${c.id}</strong><span>${escape(c.name)}</span></span><small>${counts[c.id]}</small></label>`).join('');el('start').textContent=mode==='streak'?'Start streak':mode==='exam'?'Start eksamen':'Start øving';updatePreview();}
 function updatePreview(){
  const cs=chosenChapters(),available=questions.filter(q=>cs.includes(q.chapter)).length;
  el('available').textContent=`${available} tilgjengelige`;el('question-count').max=Math.max(1,available);el('setup-error').textContent='';preview=null;
  if(!cs.length){el('selection-note').textContent='Velg minst ett kapittel.';el('start').disabled=true;return;}
  if(setupMode==='streak'&&cs.length<3){el('selection-note').textContent='Streak krever minst tre kapitler.';el('start').disabled=true;return;}
  const wanted=setupMode==='streak'?15:Number(el('question-count').value);
  if(!Number.isInteger(wanted)||wanted<1||wanted>available){el('selection-note').textContent=`Velg mellom 1 og ${available} oppgaver.`;el('start').disabled=true;return;}
  preview=E.select(units,cs,wanted,setupMode==='streak');el('start').disabled=false;
  el('selection-note').textContent=setupMode==='streak'?`Forsøket inneholder ${preview.length} oppgaver. Fortsettelser kommer sammen, så en serie kan kreve 16 riktige for å fullføre siste gruppe.`:`Økten inneholder ${preview.length} oppgaver${preview.length>wanted?' fordi en fortsettelsesgruppe holdes samlet':''}. Fortsettelser kommer alltid sammen.`;
 }
 function start(){if(!preview)return;state={bankVersion:1,mode:setupMode,phase:'active',chapters:chosenChapters(),ids:preview.slice(),index:0,answers:{},autoNext:el('auto-next').checked,attempt:1,best:0,viewDepartures:0,started:Date.now()};persist();showQuestion();}
 function paintChoices(container,q,selected,reveal,disabled){
  for(const b of container.querySelectorAll('[data-choice]')){const l=b.dataset.choice;b.classList.toggle('selected',l===selected);b.classList.toggle('correct',reveal&&l===q.answer);b.classList.toggle('incorrect',reveal&&l===selected&&l!==q.answer);b.setAttribute('aria-pressed',String(l===selected));b.disabled=disabled;const tag=reveal&&l===q.answer?' – riktig svar':l===selected?' – ditt svar':'';b.setAttribute('aria-label',`Alternativ ${l}${tag}`);}
  for(const row of container.querySelectorAll('[data-row-choice]')){const l=row.dataset.rowChoice;row.classList.toggle('selected',l===selected);row.classList.toggle('correct',reveal&&l===q.answer);row.classList.toggle('incorrect',reveal&&l===selected&&l!==q.answer);row.classList.toggle('locked',disabled);}
 }
 function context(q,box,body){const unit=units.find(u=>u.id===q.groupId);const prior=unit&&unit.members[0]!==q.id?byId[unit.members[0]]:null;el(box).hidden=!prior;el(box).open=false;el(body).innerHTML=prior?`<p class="context-id">${escape(prior.id)}</p>`+prior.html:'';if(prior){for(const b of el(body).querySelectorAll('button'))b.disabled=true;for(const row of el(body).querySelectorAll('[data-row-choice]'))row.classList.add('locked');}}
 function feedbackHtml(q,answer){return `<strong>${answer===q.answer?'Riktig!':answer?'Ikke helt riktig.':'Ubesvart.'} ${answer===q.answer?'':`Riktig svar er ${q.answer}.`}</strong><p>${escape(q.reason)}</p>`;}
 function showQuestion(){
  screen('session');const q=byId[state.ids[state.index]],a=state.answers[q.id],reveal=state.mode!=='exam'&&!!a;
  el('mode-label').textContent=names[state.mode];el('session-title').textContent=state.mode==='streak'?'Finn flyten. Hold serien.':state.mode==='exam'?'Vis hva du kan.':'Ett spørsmål nærmere.';
  const done=Object.keys(state.answers).length;el('session-progress').textContent=`${done} / ${state.ids.length} besvart`;el('progress-fill').style.width=`${100*done/state.ids.length}%`;
  el('qid').textContent=q.id;el('chapter').textContent=`Kapittel ${q.chapter}`;el('display').innerHTML=q.html;context(q,'context','context-body');paintChoices(el('display'),q,a,reveal,state.mode!=='exam'&&!!a);
  el('feedback').hidden=!reveal;el('feedback').className='feedback '+(a===q.answer?'success':'wrong');el('feedback').innerHTML=reveal?feedbackHtml(q,a):'';
  el('counter').textContent=`${state.index+1} / ${state.ids.length}`;el('prev').disabled=state.index===0;
  const sp=E.streakProgress(state.ids,state.answers,state.chapters,byId);el('streak-info').hidden=state.mode!=='streak';
  if(state.mode==='streak'){el('streak-info').textContent=`${sp.count} / 15 på rad · ${sp.covered.length} / ${state.chapters.length} kapitler · Forsøk ${state.attempt} · Beste serie ${state.best}`;el('next').disabled=!a||sp.won;el('next').setAttribute('aria-label',sp.failed?'Start nytt streak-forsøk':'Neste oppgave');if(sp.failed&&reveal)el('feedback').innerHTML+='<p>Serien er nullstilt. Trykk på høyrepilen for å starte et nytt forsøk.</p>';else if(sp.count>=15&&!sp.won&&reveal)el('feedback').innerHTML+='<p>Du har 15 riktige på rad! Fullfør også fortsettelsesgruppen for å klare utfordringen.</p>';}
  else{el('next').disabled=state.index===state.ids.length-1;el('next').setAttribute('aria-label','Neste oppgave');}
  el('finish').hidden=state.mode==='streak'&&!sp.won;el('finish').textContent=state.mode==='exam'?'Lever eksamen':state.mode==='streak'?'Se resultatet':'Avslutt og se resultatet';
  el('overview').hidden=state.mode==='streak';el('question-grid').innerHTML=state.ids.map((id,i)=>`<button class="jump ${i===state.index?'current':''} ${state.answers[id]?'answered':''}" data-index="${i}" aria-label="Oppgave ${i+1}${state.answers[id]?', besvart':''}" ${i===state.index?'aria-current="true"':''}>${i+1}</button>`).join('');
  if(!storageOK)el('session-progress').textContent+=' · Økten kan ikke lagres i nettleseren';
 }
 function choose(letter){
  cancelTimer();const q=byId[state.ids[state.index]];if(state.phase!=='active'||state.mode!=='exam'&&state.answers[q.id])return;state.answers[q.id]=letter;
  if(state.mode==='streak'){let run=0;for(const id of state.ids){if(!state.answers[id]||state.answers[id]!==byId[id].answer)break;run++;}state.best=Math.max(state.best,run);}
  persist();showQuestion();
  if(state.mode!=='exam'&&state.autoNext){const id=q.id,index=state.index;timer=setTimeout(()=>{timer=null;if(state?.phase==='active'&&state.index===index&&state.ids[index]===id){const sp=E.streakProgress(state.ids,state.answers,state.chapters,byId);if(state.mode==='streak'&&sp.won)complete();else if((state.mode!=='streak'||!sp.failed)&&index<state.ids.length-1)move(1);}},3000);}
 }
 function newAttempt(){state.ids=E.select(units,state.chapters,15,true);state.answers={};state.index=0;state.attempt++;persist();showQuestion();}
 function move(delta){cancelTimer();if(state.mode==='streak'&&delta>0){const sp=E.streakProgress(state.ids,state.answers,state.chapters,byId);if(sp.failed){newAttempt();return;}if(sp.won){complete();return;}if(!state.answers[state.ids[state.index]])return;}
  state.index=Math.max(0,Math.min(state.ids.length-1,state.index+delta));persist();showQuestion();}
 function complete(){cancelTimer();state.phase='results';persist();showResults();}
 function showResults(){
  screen('results');const s=E.summary(state.ids,state.answers,byId);el('results-title').textContent=state.mode==='streak'?'Streak fullført!':state.mode==='exam'?'Eksamen er levert.':'Godt jobbet med øvingen.';el('result-score').innerHTML=`<strong>${s.correct}<span> / ${s.total}</span></strong><span>${s.percent} % riktig</span>`;el('result-description').textContent=state.mode==='streak'?`Du klarte ${s.correct} riktige på rad fra ${state.chapters.length} kapitler. ${state.attempt} forsøk.`:`${s.answered} besvart · ${s.unanswered} ubesvart. Ubesvarte oppgaver teller som feil.`;
  el('streak-view-status')?.remove();if(state.mode==='streak'){const note=document.createElement('p');note.id='streak-view-status';note.className='selection-note';const n=departureCount();note.textContent=n?`Forlot visningen ${n} ${n===1?'gang':'ganger'} under denne Streak-økten.`:'Visningen ble ikke forlatt under denne Streak-økten.';el('result-description').after(note);}
  el('chapter-results').innerHTML='<h2>Resultat per kapittel</h2><div class="result-chapters">'+Object.entries(s.chapters).map(([chapter,x])=>`<div class="chapter-result"><span>Kapittel ${chapter}</span><strong>${x.correct} / ${x.total}</strong><span class="mini-track"><span style="width:${100*x.correct/x.total}%"></span></span></div>`).join('')+'</div>';el('review-wrong').disabled=s.correct===s.total;
 }
 function beginReview(wrong=false){reviewIds=state.ids.filter(id=>!wrong||state.answers[id]!==byId[id].answer);reviewIndex=0;showReview();}
 function showReview(){screen('review');const q=byId[reviewIds[reviewIndex]],a=state.answers[q.id];el('review-qid').textContent=q.id;el('review-chapter').textContent=`Kapittel ${q.chapter}`;el('review-display').innerHTML=q.html;context(q,'review-context','review-context-body');paintChoices(el('review-display'),q,a,true,true);el('review-feedback').className='feedback '+(a===q.answer?'success':'wrong');el('review-feedback').innerHTML=feedbackHtml(q,a);el('review-counter').textContent=`${reviewIndex+1} / ${reviewIds.length}`;el('review-prev').disabled=reviewIndex===0;el('review-next').disabled=reviewIndex===reviewIds.length-1;}
 function confirmFinish(){const s=E.summary(state.ids,state.answers,byId);if(state.mode==='streak'){complete();return;}el('dialog-title').textContent=state.mode==='exam'?'Lever eksamen?':'Avslutt øvingen?';el('dialog-message').textContent=s.unanswered?`Du har ${s.unanswered} ubesvarte oppgaver. Disse teller som feil i resultatet.`:'Alle oppgavene er besvart. Du får nå se resultat og fasit.';el('dialog-confirm').textContent=state.mode==='exam'?'Lever eksamen':'Se resultatet';el('confirm-dialog').showModal();}
 el('confirm-dialog').addEventListener('close',()=>{if(el('confirm-dialog').returnValue==='confirm')complete();});
 document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>configure(b.dataset.mode));el('brand').onclick=e=>{e.preventDefault();menu();};el('home').onclick=menu;el('back-menu').onclick=menu;el('pause').onclick=menu;
 el('all-chapters').onclick=()=>{document.querySelectorAll('#chapters input').forEach(c=>c.checked=true);updatePreview();};el('no-chapters').onclick=()=>{document.querySelectorAll('#chapters input').forEach(c=>c.checked=false);updatePreview();};el('chapters').onchange=updatePreview;el('question-count').oninput=updatePreview;
 el('setup-form').onsubmit=e=>{e.preventDefault();start();};el('prev').onclick=()=>move(-1);el('next').onclick=()=>move(1);el('finish').onclick=confirmFinish;
 el('display').onclick=e=>{const b=e.target.closest('[data-choice]'),r=e.target.closest('[data-row-choice]');if(b&&!b.disabled)choose(b.dataset.choice);else if(!b&&r&&!r.classList.contains('locked'))choose(r.dataset.rowChoice);};
 el('question-grid').onclick=e=>{const b=e.target.closest('[data-index]');if(b&&state.mode!=='streak'){state.index=Number(b.dataset.index);persist();showQuestion();}};
 el('resume').onclick=()=>state.phase==='results'?showResults():showQuestion();el('new-session').onclick=()=>configure(state.mode);el('review-all').onclick=()=>beginReview();el('review-wrong').onclick=()=>beginReview(true);el('back-results').onclick=showResults;
 el('review-prev').onclick=()=>{reviewIndex--;showReview();};el('review-next').onclick=()=>{reviewIndex++;showReview();};
 document.addEventListener('keydown',e=>{if(e.altKey||e.ctrlKey||e.metaKey||/INPUT|TEXTAREA|SELECT|BUTTON|SUMMARY/.test(e.target.tagName)||el('confirm-dialog').open)return;if(!el('session').hidden){if(e.key==='ArrowLeft'&&!el('prev').disabled){e.preventDefault();move(-1);}if(e.key==='ArrowRight'&&!el('next').disabled){e.preventDefault();move(1);}}else if(!el('review').hidden){if(e.key==='ArrowLeft'&&reviewIndex>0){e.preventDefault();reviewIndex--;showReview();}if(e.key==='ArrowRight'&&reviewIndex<reviewIds.length-1){e.preventDefault();reviewIndex++;showReview();}}});
 restore();menu();
})();
