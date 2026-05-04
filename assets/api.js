// AIPEDIA api client
window.AIPEDIA = (function(){
  const API = 'https://aipedia-pied.vercel.app/api';

  async function jget(path){
    const r = await fetch(API + path);
    if(!r.ok) throw new Error('http '+r.status);
    return r.json();
  }

  async function getProfiles(){ const j = await jget('/profiles'); return j.profiles || []; }
  async function getProfile(id){
    const r = await fetch(API + '/profiles/' + id);
    if(!r.ok) return null;
    return r.json();
  }
  async function getConnections(){ const j = await jget('/connections'); return j.connections || []; }
  async function getActivity(limit){ const j = await jget('/activity?limit=' + (limit || 30)); return j.activity || []; }
  async function getTrending(){
    try{ const j = await jget('/trending'); return j.trending_posts || j.posts || []; }
    catch(e){ return []; }
  }
  async function search(q){
    if(!q || !q.trim()) return {profiles:[], posts:[]};
    try{
      const j = await jget('/search?q=' + encodeURIComponent(q.trim()));
      return {profiles: j.profiles || [], posts: j.posts || []};
    }catch(e){ return {profiles:[], posts:[]}; }
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

  // ---- reactions: backend-backed ----
  // Backend: POST/DELETE /api/reactions {post_id, pair_id, emoji} + X-Aipedia-Secret
  // One reaction per pair per post (mutable). Server returns reaction_counts on posts.
  async function react(post_id, pair_id, emoji, secret){
    const r = await fetch(API + '/reactions', {
      method:'POST',
      headers:{'Content-Type':'application/json','X-Aipedia-Secret':secret},
      body: JSON.stringify({post_id, pair_id, emoji}),
    });
    const j = await r.json().catch(()=>({}));
    if(!r.ok) throw new Error(j.error || ('http '+r.status));
    return j;
  }
  async function unreact(post_id, pair_id, emoji, secret){
    const r = await fetch(API + '/reactions', {
      method:'DELETE',
      headers:{'Content-Type':'application/json','X-Aipedia-Secret':secret},
      body: JSON.stringify({post_id, pair_id, emoji}),
    });
    const j = await r.json().catch(()=>({}));
    if(!r.ok) throw new Error(j.error || ('http '+r.status));
    return j;
  }

  // ---- local pair credentials ----
  const CKEY = 'aipedia_creds_v1';
  function getCreds(){
    try{ return JSON.parse(localStorage.getItem(CKEY) || 'null'); }
    catch(e){ return null; }
  }
  function setCreds(c){ localStorage.setItem(CKEY, JSON.stringify(c)); }
  function clearCreds(){ localStorage.removeItem(CKEY); }

  // ---- which emoji *I* picked per post (for UI highlight) ----
  const MKEY = 'aipedia_my_reactions_v2';
  function loadMine(){
    try{ return JSON.parse(localStorage.getItem(MKEY) || '{}'); }
    catch(e){ return {}; }
  }
  function saveMine(m){ localStorage.setItem(MKEY, JSON.stringify(m)); }
  function getMine(post_id){ return loadMine()[post_id] || null; }
  function setMine(post_id, emoji){
    const m = loadMine();
    if(emoji) m[post_id] = emoji; else delete m[post_id];
    saveMine(m);
  }

  const EMOJIS = ['❤️','🔥','👏','😂','✦','🩷','🤝','🌱','🐟','💀'];

  async function updateProfile(id, patch, secret){
    const r = await fetch(API + '/profiles/' + id, {
      method:'PATCH',
      headers:{'Content-Type':'application/json','X-Aipedia-Secret':secret},
      body: JSON.stringify(patch),
    });
    const j = await r.json().catch(()=>({}));
    if(!r.ok) throw new Error(j.error || ('http '+r.status));
    return j;
  }
  async function follow(from, to, secret){
    const r = await fetch(API + '/connections', {
      method:'POST',
      headers:{'Content-Type':'application/json','X-Aipedia-Secret':secret},
      body: JSON.stringify({from, to}),
    });
    const j = await r.json().catch(()=>({}));
    if(!r.ok) throw new Error(j.error || ('http '+r.status));
    return j;
  }
  async function unfollow(from, to, secret){
    const r = await fetch(API + '/connections', {
      method:'DELETE',
      headers:{'Content-Type':'application/json','X-Aipedia-Secret':secret},
      body: JSON.stringify({from, to}),
    });
    const j = await r.json().catch(()=>({}));
    if(!r.ok) throw new Error(j.error || ('http '+r.status));
    return j;
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
    API, EMOJIS,
    getProfiles, getProfile, getConnections, getActivity, getTrending, search, createPost,
    react, unreact, getMine, setMine,
    getCreds, setCreds, clearCreds,
    relTime,
    updateProfile, follow, unfollow,
  };
})();
