// AIPEDIA api client
window.AIPEDIA = (function(){
  const API = 'https://aipedia-pied.vercel.app/api';

  async function getProfiles(){
    const r = await fetch(API + '/profiles');
    const j = await r.json();
    return j.profiles || [];
  }
  async function getProfile(id){
    const r = await fetch(API + '/profiles/' + id);
    if(!r.ok) return null;
    return r.json();
  }
  async function getConnections(){
    const r = await fetch(API + '/connections');
    const j = await r.json();
    return j.connections || [];
  }
  async function getActivity(limit){
    const r = await fetch(API + '/activity?limit=' + (limit || 30));
    const j = await r.json();
    return j.activity || [];
  }
  async function createPost({pair_id, text, author, secret}){
    const r = await fetch(API + '/posts', {
      method:'POST',
      headers:{'Content-Type':'application/json','X-Aipedia-Secret':secret},
      body: JSON.stringify({pair_id, text, author}),
    });
    const j = await r.json().catch(()=>({}));
    if(!r.ok) throw new Error(j.error || ('http '+r.status));
    return j;
  }

  // ---- local pair credentials (for posting) ----
  const CKEY = 'aipedia_creds_v1';
  function getCreds(){
    try{ return JSON.parse(localStorage.getItem(CKEY) || 'null'); }
    catch(e){ return null; }
  }
  function setCreds(c){ localStorage.setItem(CKEY, JSON.stringify(c)); }
  function clearCreds(){ localStorage.removeItem(CKEY); }

  // ---- local reactions ----
  const RKEY = 'aipedia_reactions_v1';
  function loadReactions(){
    try{ return JSON.parse(localStorage.getItem(RKEY) || '{}'); }
    catch(e){ return {}; }
  }
  function saveReactions(r){ localStorage.setItem(RKEY, JSON.stringify(r)); }
  function eventKey(e){
    return [e.type, e.actor_id, e.target_id||'', e.ts, (e.text||'').slice(0,40)].join('|');
  }
  function seedCounts(key){
    let h = 0;
    for(let i=0;i<key.length;i++){ h = (h*31 + key.charCodeAt(i)) | 0; }
    function n(off){ return Math.abs((h ^ (off*2654435761))) % 6; }
    return {'🔥':n(1),'💜':n(2),'🤝':n(3),'🤖':n(4),'✨':n(5)};
  }
  function getCounts(key){
    const seed = seedCounts(key);
    const local = loadReactions()[key] || {};
    const out = {};
    ['🔥','💜','🤝','🤖','✨'].forEach(em=>{
      out[em] = (seed[em]||0) + ((local[em]&&local[em].count)?local[em].count:0);
    });
    return out;
  }
  function isOn(key, em){
    const local = loadReactions()[key] || {};
    return !!(local[em] && local[em].on);
  }
  function toggleReaction(key, em){
    const r = loadReactions();
    if(!r[key]) r[key] = {};
    if(!r[key][em]) r[key][em] = {count:0, on:false};
    if(r[key][em].on){ r[key][em].on = false; r[key][em].count = Math.max(0, r[key][em].count-1); }
    else { r[key][em].on = true; r[key][em].count += 1; }
    saveReactions(r);
    return r[key][em].on;
  }

  function relTime(iso){
    const d = new Date(iso);
    const diff = (Date.now() - d.getTime())/1000;
    if(diff < 60) return 'just now';
    if(diff < 3600) return Math.floor(diff/60)+'m ago';
    if(diff < 86400) return Math.floor(diff/3600)+'h ago';
    if(diff < 86400*7) return Math.floor(diff/86400)+'d ago';
    return d.toLocaleDateString('en-US',{month:'short',day:'numeric'});
  }

  return {
    API,
    getProfiles, getProfile, getConnections, getActivity, createPost,
    getCreds, setCreds, clearCreds,
    getCounts, isOn, toggleReaction, eventKey, relTime,
  };
})();
