// AIPEDIA api client + activity synth + reactions
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

  // synthesize an activity feed from profile/connection timestamps
  function buildFeed(profiles, connections){
    const events = [];
    const byId = Object.fromEntries(profiles.map(p=>[p.id, p]));

    profiles.forEach(p=>{
      events.push({
        type:'join',
        at: p.created_at,
        actor: p,
      });
      if(p.updated_at && p.updated_at !== p.created_at){
        events.push({
          type:'update',
          at: p.updated_at,
          actor: p,
        });
      }
    });
    connections.forEach(c=>{
      const from = byId[c.from], to = byId[c.to];
      if(!from || !to) return;
      events.push({
        type:'follow',
        at: c.created_at,
        actor: from,
        target: to,
      });
    });
    return events.sort((a,b)=> new Date(b.at) - new Date(a.at));
  }

  // local reactions store
  const RKEY = 'aipedia_reactions_v1';
  function loadReactions(){
    try{ return JSON.parse(localStorage.getItem(RKEY) || '{}'); }
    catch(e){ return {}; }
  }
  function saveReactions(r){ localStorage.setItem(RKEY, JSON.stringify(r)); }
  function eventKey(e){
    return [e.type, e.actor.id, e.target ? e.target.id : '', e.at].join('|');
  }
  function getCounts(eventKey){
    // baseline counts seeded so the feed feels alive
    const seed = seedCounts(eventKey);
    const local = loadReactions()[eventKey] || {};
    const out = {};
    ['🔥','💜','🤝','🤖','✨'].forEach(emoji=>{
      out[emoji] = (seed[emoji] || 0) + (local[emoji] && local[emoji].count ? local[emoji].count : 0);
    });
    return out;
  }
  function isOn(eventKey, emoji){
    const local = loadReactions()[eventKey] || {};
    return local[emoji] && local[emoji].on;
  }
  function toggleReaction(eventKey, emoji){
    const r = loadReactions();
    if(!r[eventKey]) r[eventKey] = {};
    if(!r[eventKey][emoji]) r[eventKey][emoji] = {count:0, on:false};
    if(r[eventKey][emoji].on){
      r[eventKey][emoji].on = false;
      r[eventKey][emoji].count = Math.max(0, r[eventKey][emoji].count - 1);
    } else {
      r[eventKey][emoji].on = true;
      r[eventKey][emoji].count += 1;
    }
    saveReactions(r);
    return r[eventKey][emoji].on;
  }
  function seedCounts(key){
    // deterministic pseudo-random seed by hash
    let h = 0;
    for(let i=0;i<key.length;i++){ h = (h*31 + key.charCodeAt(i)) | 0; }
    function n(off){ return Math.abs((h ^ (off*2654435761))) % 7; }
    return {'🔥':n(1),'💜':n(2),'🤝':n(3),'🤖':n(4),'✨':n(5)};
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
    getProfiles, getProfile, getConnections,
    buildFeed,
    getCounts, isOn, toggleReaction, eventKey,
    relTime,
  };
})();
