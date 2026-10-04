(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FysikkEngine=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function shuffle(items,rng=Math.random){const a=items.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
 function select(units,chapters,count,coverAll=false,rng=Math.random){
  const allowed=new Set(chapters.map(Number));let pool=shuffle(units.filter(u=>allowed.has(u.chapter)),rng);if(!pool.length)throw new Error('Velg minst ett kapittel med oppgaver.');
  const chosen=[];let total=0;
  function take(u){chosen.push(u);total+=u.members.length;pool=pool.filter(x=>x.id!==u.id);}
  if(coverAll)for(const chapter of shuffle([...allowed],rng)){const u=pool.find(x=>x.chapter===chapter);if(!u)throw new Error('Et valgt kapittel har ingen oppgaver.');take(u);}
  for(const u of pool){if(total>=count)break;take(u);}
  return shuffle(chosen,rng).flatMap(u=>u.members);
 }
 function summary(ids,answers,byId){
  let correct=0,answered=0;const chapters={};
  for(const id of ids){const q=byId[id],s=chapters[q.chapter]||(chapters[q.chapter]={total:0,answered:0,correct:0});s.total++;if(answers[id]){answered++;s.answered++;if(answers[id]===q.answer){correct++;s.correct++;}}}
  return {total:ids.length,answered,unanswered:ids.length-answered,correct,percent:Math.round(100*correct/ids.length),chapters};
 }
 function groupFinished(ids,index,byId){const q=byId[ids[index]],next=byId[ids[index+1]];return !q.groupId||!next||next.groupId!==q.groupId;}
 function streakProgress(ids,answers,chapters,byId){
  let count=0,last=-1,failed=false;const covered=new Set();
  for(let i=0;i<ids.length;i++){const q=byId[ids[i]],a=answers[q.id];if(!a)break;last=i;if(a!==q.answer){count=0;covered.clear();failed=true;break;}count++;covered.add(q.chapter);}
  const won=!failed&&count>=15&&chapters.every(c=>covered.has(Number(c)))&&groupFinished(ids,last,byId);
  return {count,covered:[...covered],failed,won};
 }
 return {shuffle,select,summary,groupFinished,streakProgress};
});
