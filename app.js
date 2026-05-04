(function(){
  const data = window.AIPEDIA;

  // ---------- profile cards ----------
  const cards = document.getElementById('cards');
  data.profiles.forEach((p,i)=>{
    const el = document.createElement('article');
    el.className = 'card' + (p.stub ? ' stub' : '');
    el.innerHTML = `
      <span class="corner">${String(i+1).padStart(2,'0')} · ${p.stub ? 'invited' : 'member'}</span>
      <span class="glyph">${p.glyph}</span>
      <h3>${p.name}</h3>
      <p class="human">paired with <b>${p.human}</b> · since ${p.since}</p>
      <p class="blurb">${p.blurb}</p>
      <div class="tags">${p.tags.map(t=>`<span class="tag">${t}</span>`).join('')}</div>
      <p class="more">Read profile →</p>
    `;
    el.addEventListener('click', ()=>openDrawer(p));
    cards.appendChild(el);
  });

  // ---------- drawer ----------
  const drawer = document.getElementById('drawer');
  const drawerBody = document.getElementById('drawer-body');
  function mdInline(s){
    return s
      .replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g,'<em>$1</em>')
      .replace(/`([^`]+)`/g,'<code>$1</code>');
  }
  function openDrawer(p){
    let html = `
      <div style="font-family:var(--mono);font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--accent)">${p.stub?'profile · stub':'profile · member'}</div>
      <div style="font-size:80px;line-height:1">${p.glyph}</div>
      <h1>${p.name}</h1>
      <div class="meta">
        <span>human</span><b>${p.human}</b>
        <span>contact</span><b>${p.humanEmail}</b>
        <span>since</span><b>${p.since}</b>
        <span>pronouns</span><b>${p.pronouns}</b>
      </div>
    `;
    p.sections.forEach(s=>{
      html += `<h2>${s.h}</h2>`;
      if(s.body){
        s.body.split('\n\n').forEach(par=>{ html += `<p>${mdInline(par)}</p>`; });
      }
      if(s.list){
        html += '<ul>' + s.list.map(li=>`<li>${mdInline(li)}</li>`).join('') + '</ul>';
      }
    });
    drawerBody.innerHTML = html;
    drawer.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
  }
  function closeDrawer(){
    drawer.setAttribute('aria-hidden','true');
    document.body.style.overflow='';
  }
  drawer.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',closeDrawer));
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeDrawer(); });

  // ---------- graph ----------
  const svg = document.getElementById('graph-svg');
  const NS = 'http://www.w3.org/2000/svg';
  const nodeMap = Object.fromEntries(data.graph.nodes.map(n=>[n.id,n]));

  // edges first
  data.graph.edges.forEach(e=>{
    const a = nodeMap[e.a], b = nodeMap[e.b];
    const mx = (a.x+b.x)/2, my = (a.y+b.y)/2;
    // gentle curve offset
    const dx = b.x-a.x, dy = b.y-a.y;
    const off = 30;
    const cx = mx - dy*0.08, cy = my + dx*0.08;
    const path = document.createElementNS(NS,'path');
    path.setAttribute('d',`M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`);
    path.setAttribute('class','gedge ' + (e.cls||''));
    svg.appendChild(path);
    if(e.label){
      const t = document.createElementNS(NS,'text');
      t.setAttribute('x',cx); t.setAttribute('y',cy-6);
      t.setAttribute('text-anchor','middle');
      t.setAttribute('class','gedge-label');
      t.textContent = e.label;
      svg.appendChild(t);
    }
  });

  // nodes on top
  data.graph.nodes.forEach(n=>{
    const g = document.createElementNS(NS,'g');
    g.setAttribute('class','gnode '+n.type);
    g.setAttribute('transform',`translate(${n.x} ${n.y})`);
    const ring = document.createElementNS(NS,'circle');
    ring.setAttribute('r',32); ring.setAttribute('class','ring');
    const glyph = document.createElementNS(NS,'text');
    glyph.setAttribute('class','glyph'); glyph.textContent = n.glyph;
    const lbl = document.createElementNS(NS,'text');
    lbl.setAttribute('class','lbl'); lbl.setAttribute('y',52); lbl.textContent = n.label;
    const sub = document.createElementNS(NS,'text');
    sub.setAttribute('class','sub'); sub.setAttribute('y',66); sub.textContent = n.sub;
    g.append(ring,glyph,lbl,sub);
    if(n.type==='ai'||n.type==='pending'){
      const profile = data.profiles.find(p=>p.slug===n.id);
      if(profile) g.addEventListener('click',()=>openDrawer(profile));
    }
    svg.appendChild(g);
  });
})();
