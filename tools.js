/* Quality Tools for DMAIC Workspace: Fishbone, Pareto, 5 Whys, KPI Dashboard, SPC.
   Vanilla JS + inline SVG (works offline). Uses globals from index.html: state, KEY, render, toast. */
(function(){
"use strict";
const TABS=[["fishbone","Fishbone"],["pareto","Pareto"],["whys","5 Whys"],["kpi","KPI Dashboard"],["spc","SPC Chart"]];
const CATS=[["Man","Manusia"],["Machine","Mesin"],["Method","Metode"],["Material","Material"],["Measurement","Pengukuran"],["Environment","Lingkungan"]];
const CCOL=["#2463eb","#1597d4","#159b72","#ed8a2d","#8556dc","#dc5262"];
const TAG="[Auto dari Tools]";
let tab="fishbone";
const uid=()=>Math.random().toString(36).slice(2,9);
const E=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const N=v=>{const x=parseFloat(String(v==null?"":v).replace(",",".").trim());return Number.isFinite(x)?x:NaN};
const f=(x,d=2)=>Number.isFinite(x)?String(+x.toFixed(d)):"–";
const sum=a=>a.reduce((s,v)=>s+v,0), mean=a=>a.length?sum(a)/a.length:NaN;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const trunc=(s,n)=>s.length>n?s.slice(0,n-1)+"…":s;
const today=()=>new Date().toLocaleDateString("en-CA");
const root=()=>document.getElementById("toolsPanel");
const $=s=>root().querySelector(s);

/* ---------- state ---------- */
function T(){
  if(!state.tools||typeof state.tools!=="object")state.tools={};
  const t=state.tools;
  t.fishbone=t.fishbone||{effect:"",causes:{}};
  CATS.forEach(c=>{if(!Array.isArray(t.fishbone.causes[c[0]]))t.fishbone.causes[c[0]]=[]});
  t.pareto=t.pareto||{unit:"kejadian",items:[]};
  t.whys=t.whys||{problem:"",steps:["","","","",""],root:""};
  t.kpi=t.kpi||{items:[]};
  t.spc=t.spc||{type:"imr",n:5,raw:"",phase:"",usl:"",lsl:""};
  return t;
}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){}}
function pushText(stage,key,text){
  const d=state.stages[stage];
  const old=String(d[key]||"").replace(new RegExp("\\n*"+TAG.replace(/[[\]]/g,"\\$&")+"[\\s\\S]*$"),"").trim();
  d[key]=(old?old+"\n\n":"")+TAG+"\n"+text;
  persist();render();toast("Disalin ke tahap "+["Define","Measure","Analyze","Improve","Control"][stage]);
}

/* ---------- shell ---------- */
function show(){
  const r=root();if(!r)return;
  T();
  r.innerHTML=`<div class="paneltop"><h3>Quality Tools</h3><span class="pill">DMAIC TOOLKIT</span></div>
  <div class="ttabs">${TABS.map(t=>`<button class="ttab ${tab===t[0]?"on":""}" data-act="tab" data-tab="${t[0]}">${t[1]}</button>`).join("")}</div>
  <div id="tbody">${({fishbone:fishbone,pareto:pareto,whys:whys,kpi:kpi,spc:spc})[tab]()}</div>`;
  if(tab==="pareto")parOut();
  if(tab==="spc")spcOut();
}
function head(title,desc,btns){
  return `<div class="toolhead"><div><h4>${title}</h4><p>${desc}</p></div><div class="row">${btns}</div></div>`;
}
const sampleBtn=`<button class="mini" data-act="sample">Muat contoh</button>`;
const clearBtn=`<button class="mini warn" data-act="clear">Kosongkan</button>`;

/* =============== FISHBONE =============== */
function fishbone(){
  const fb=T().fishbone;
  return head("Fishbone (Ishikawa) — 6M","Telusuri penyebab masalah per kategori. Ketuk penyebab di diagram (atau ikon ★) untuk menandainya sebagai akar masalah utama.",
    `${sampleBtn}<button class="mini" data-act="fbToAnalyze">Kirim ke Analyze</button>${clearBtn}`)+
  `<label>Efek / masalah (kepala ikan)</label><input data-bind="fishbone.effect" data-live="1" value="${E(fb.effect)}" placeholder="Contoh: Defect produksi 8%">
  <div class="scroller" style="margin-top:12px" id="fbSvg">${fishSVG(fb)}</div>
  <div class="catgrid">${CATS.map((c,i)=>`<div class="catcard"><h5><i style="background:${CCOL[i]}"></i>${c[0]} <span class="muted">· ${c[1]}</span></h5>
    <div class="chips">${fb.causes[c[0]].map(x=>`<div class="chip ${x.root?"root":""}"><button class="star ${x.root?"on":""}" data-act="star" data-cat="${c[0]}" data-id="${x.id}" aria-label="Tandai akar masalah">${x.root?"★":"☆"}</button><span>${E(x.text)}</span><button class="del" data-act="delCause" data-cat="${c[0]}" data-id="${x.id}" aria-label="Hapus">×</button></div>`).join("")||`<div class="hint">Belum ada penyebab.</div>`}</div>
    <form class="inline-form" data-form="addCause" data-cat="${c[0]}"><input name="t" placeholder="Tambah penyebab..." autocomplete="off"><button class="mini">+</button></form></div>`).join("")}</div>`;
}
function wrap(s,n,max){
  const w=String(s||"").split(/\s+/).filter(Boolean),lines=[];let cur="";
  w.forEach(x=>{if((cur+" "+x).trim().length>n&&cur){lines.push(cur);cur=x}else cur=(cur+" "+x).trim()});
  if(cur)lines.push(cur);
  if(lines.length>max){lines.length=max;lines[max-1]=trunc(lines[max-1],n-1)+"…"}
  return lines;
}
function fishSVG(fb){
  const W=1000,H=560,sy=280;let g="";
  g+=`<line x1="30" y1="${sy}" x2="790" y2="${sy}" stroke="#182033" stroke-width="4" stroke-linecap="round"/><polygon points="790,${sy-9} 806,${sy} 790,${sy+9}" fill="#182033"/>`;
  const lines=wrap(fb.effect||"Masalah / Efek",22,4);
  g+=`<rect x="806" y="${sy-52}" width="184" height="104" rx="18" fill="#152b59"/>`;
  g+=lines.map((l,i)=>`<text x="898" y="${sy-(lines.length-1)*9+i*18+4}" text-anchor="middle" fill="#fff" font-size="14" font-weight="700">${E(l)}</text>`).join("");
  CATS.forEach((c,i)=>{
    const top=i<3,x0=195+(i%3)*215,y0=top?60:500,col=CCOL[i],list=fb.causes[c[0]];
    g+=`<line x1="${x0}" y1="${y0}" x2="${x0+110}" y2="${sy}" stroke="${col}" stroke-width="3" stroke-linecap="round"/>`;
    g+=`<rect x="${x0-58}" y="${top?y0-36:y0+6}" width="116" height="30" rx="10" fill="${col}"/><text x="${x0}" y="${top?y0-16:y0+26}" text-anchor="middle" fill="#fff" font-size="13" font-weight="800">${c[0]}</text>`;
    const step=Math.min(32,(sy-60-40)/Math.max(list.length,1));
    list.forEach((x,k)=>{
      const y=top?y0+34+k*step:y0-34-k*step;
      const xb=x0+(top?(y-60):(500-y))/220*110;
      g+=`<line x1="${xb-30}" y1="${y}" x2="${xb}" y2="${y}" stroke="${x.root?"#dc5262":col}" stroke-width="2"/>`;
      g+=`<text class="fcause" data-act="star" data-cat="${c[0]}" data-id="${x.id}" x="${xb-34}" y="${y+4}" text-anchor="end" font-size="12" fill="${x.root?"#dc5262":"#303a52"}" font-weight="${x.root?800:500}">${x.root?"★ ":""}${E(trunc(x.text,26))}<title>${E(x.text)}</title></text>`;
    });
  });
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Diagram fishbone">${g}</svg>`;
}
function fbText(){
  const fb=T().fishbone;let t="Efek: "+(fb.effect||"-");
  CATS.forEach(c=>{const l=fb.causes[c[0]];if(l.length)t+="\n"+c[0]+": "+l.map(x=>x.text).join("; ")});
  const roots=[].concat(...CATS.map(c=>fb.causes[c[0]].filter(x=>x.root).map(x=>c[0]+" – "+x.text)));
  t+="\nAkar masalah utama: "+(roots.join("; ")||"(belum ditandai)");
  return t;
}

/* =============== PARETO =============== */
function pareto(){
  const p=T().pareto;
  return head("Pareto Chart","Masukkan kategori masalah dan frekuensinya. Diagram otomatis diurutkan dan menandai “vital few” yang menyumbang ±80% masalah.",
    `${sampleBtn}<button class="mini" data-act="parToAnalyze">Kirim ke Analyze</button>${clearBtn}`)+
  `<div class="grid2"><div><label>Satuan hitung</label><input data-bind="pareto.unit" data-live="1" value="${E(p.unit)}" placeholder="kejadian / unit / menit / Rp"></div></div>
  <div class="addbox"><form class="inline-form" data-form="addPar"><input name="n" placeholder="Kategori (mis. Goresan)" autocomplete="off" required><input name="c" type="text" inputmode="decimal" placeholder="Jumlah" style="max-width:110px" required><button class="mini">Tambah</button></form></div>
  <div style="margin-top:10px">${p.items.length?`<table class="tbl"><thead><tr><th>Kategori</th><th style="width:110px">Jumlah</th><th style="width:34px"></th></tr></thead><tbody>${p.items.map((it,i)=>`<tr><td><input data-bind="pareto.items.${i}.name" data-live="1" value="${E(it.name)}"></td><td><input data-bind="pareto.items.${i}.count" data-live="1" data-num="1" inputmode="decimal" value="${E(it.count)}"></td><td><button class="mini warn" data-act="delPar" data-i="${i}" aria-label="Hapus">×</button></td></tr>`).join("")}</tbody></table>`:`<div class="empty">Belum ada data. Tambahkan kategori atau muat contoh.</div>`}</div>
  <div id="parOut"></div>`;
}
function parData(){
  const items=T().pareto.items.map(i=>({name:String(i.name||"").trim()||"(tanpa nama)",v:N(i.count)})).filter(i=>Number.isFinite(i.v)&&i.v>0);
  items.sort((a,b)=>b.v-a.v);
  const total=sum(items.map(i=>i.v));let c=0,prev=0;
  items.forEach(i=>{prev=c;c+=i.v;i.cum=c/total;i.pct=i.v/total;i.vital=prev/total<0.8});
  return {items,total};
}
function parOut(){
  const box=$("#parOut");if(!box)return;
  const {items,total}=parData(),u=E(T().pareto.unit||"");
  if(!items.length){box.innerHTML="";return}
  const W=800,H=400,l=54,r=54,t=22,b=96,pw=W-l-r,ph=H-t-b,bw=pw/items.length;
  const y=v=>t+ph-(v/total)*ph;
  let g="";
  for(let k=0;k<=5;k++){const v=total*k/5;g+=`<line x1="${l}" x2="${W-r}" y1="${y(v)}" y2="${y(v)}" stroke="#e9edf5"/><text x="${l-8}" y="${y(v)+4}" text-anchor="end" font-size="11" fill="#7b8497">${f(v,v%1?1:0)}</text><text x="${W-r+8}" y="${y(v)+4}" font-size="11" fill="#7b8497">${k*20}%</text>`}
  g+=`<line x1="${l}" x2="${W-r}" y1="${y(total*.8)}" y2="${y(total*.8)}" stroke="#ed8a2d" stroke-dasharray="6 5"/><text x="${W-r-4}" y="${y(total*.8)-5}" text-anchor="end" font-size="11" fill="#c06a12" font-weight="700">80%</text>`;
  items.forEach((it,i)=>{
    const x=l+i*bw+bw*.14,w=bw*.72,h=(it.v/total)*ph;
    g+=`<rect x="${x}" y="${t+ph-h}" width="${w}" height="${h}" rx="5" fill="${it.vital?"#2463eb":"#b9c4dc"}"><title>${E(it.name)}: ${f(it.v)} (${f(it.pct*100,1)}%), kumulatif ${f(it.cum*100,1)}%</title></rect>`;
    g+=`<text x="${x+w/2}" y="${t+ph-h-5}" text-anchor="middle" font-size="11" font-weight="700" fill="#303a52">${f(it.v)}</text>`;
    g+=`<text transform="translate(${x+w/2},${t+ph+14}) rotate(-35)" text-anchor="end" font-size="11" fill="#303a52">${E(trunc(it.name,16))}</text>`;
  });
  const pts=items.map((it,i)=>[l+i*bw+bw/2,y(it.cum*total)]);
  g+=`<polyline fill="none" stroke="#dc5262" stroke-width="2.5" points="${pts.map(p=>p.join(",")).join(" ")}"/>`;
  pts.forEach((p,i)=>{g+=`<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="#fff" stroke="#dc5262" stroke-width="2"><title>${f(items[i].cum*100,1)}%</title></circle>`});
  const vital=items.filter(i=>i.vital),vp=vital.length?vital[vital.length-1].cum:0;
  box.innerHTML=`<div class="scroller narrow" style="margin-top:14px"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Pareto chart">${g}</svg></div>
  <div class="legend"><span><i style="background:#2463eb"></i>Vital few</span><span><i style="background:#b9c4dc"></i>Useful many</span><span><i style="background:#dc5262"></i>% kumulatif</span></div>
  <div class="callout"><b>${vital.length} dari ${items.length} kategori (${f(vital.length/items.length*100,0)}%)</b> menyumbang <b>${f(vp*100,1)}%</b> dari total ${f(total)} ${u}. Fokuskan perbaikan pada: <b>${E(vital.map(v=>v.name).join(", "))}</b>.</div>
  <table class="tbl" style="margin-top:12px"><thead><tr><th>#</th><th>Kategori</th><th class="r">Jumlah</th><th class="r">%</th><th class="r">Kumulatif</th></tr></thead><tbody>${items.map((it,i)=>`<tr class="${it.vital?"vital":""}"><td>${i+1}</td><td>${E(it.name)}</td><td class="r">${f(it.v)}</td><td class="r">${f(it.pct*100,1)}%</td><td class="r">${f(it.cum*100,1)}%</td></tr>`).join("")}</tbody></table>`;
}

/* =============== 5 WHYS =============== */
function whys(){
  const w=T().whys,filled=w.steps.filter(s=>s.trim()).length;
  return head("5 Whys","Tanyakan “mengapa” berulang kali sampai menemukan akar masalah yang bisa ditindaklanjuti (bukan sekadar gejala).",
    `${sampleBtn}<button class="mini" data-act="whyToAnalyze">Kirim ke Analyze</button>${clearBtn}`)+
  `<div class="whychain"><div class="why problem"><div class="n">!</div><div><label>Pernyataan masalah</label><textarea data-bind="whys.problem" placeholder="Apa yang terjadi? Kapan, di mana, seberapa besar?">${E(w.problem)}</textarea></div></div>
  ${w.steps.map((s,i)=>`<div class="why ${i===w.steps.length-1?"":""}"><div class="n">${i+1}</div><div><label>Mengapa #${i+1}?${i===0?" <span class='muted'>(mengapa masalah di atas terjadi)</span>":""}</label><textarea data-bind="whys.steps.${i}" placeholder="Karena...">${E(s)}</textarea></div></div>`).join("")}</div>
  <div class="row" style="margin:2px 0 12px"><button class="mini" data-act="addWhy" ${w.steps.length>=8?"disabled":""}>+ Tambah level</button><button class="mini ghost" data-act="delWhy" ${w.steps.length<=1?"disabled":""}>− Hapus level terakhir</button><span class="muted" style="align-self:center">${filled}/${w.steps.length} level terisi</span></div>
  <div class="whyroot"><label style="margin-top:0">Akar masalah (root cause)</label><textarea data-bind="whys.root" placeholder="Rumuskan akar masalah...">${E(w.root)}</textarea><div class="row" style="margin-top:8px"><button class="mini" data-act="whyUseLast">Pakai jawaban terakhir</button></div></div>
  <div class="callout warn"><b>Uji balik:</b> “Jika akar masalah ini dihilangkan, apakah masalah awal tidak akan terulang?” Jika tidak, lanjutkan bertanya mengapa. Penyebab yang berhenti di “kesalahan manusia” biasanya belum akar — tanyakan mengapa proses memungkinkan kesalahan itu.</div>`;
}
function whyText(){
  const w=T().whys;let t="Masalah: "+(w.problem||"-");
  w.steps.forEach((s,i)=>{if(s.trim())t+="\nWhy "+(i+1)+": "+s.trim()});
  t+="\nAkar masalah: "+(w.root||"(belum dirumuskan)");return t;
}

/* =============== KPI =============== */
function kpiStat(k){
  const b=N(k.baseline),t=N(k.target),c=N(k.current);
  if(![b,t,c].every(Number.isFinite))return {p:null,cls:"na",label:"Data belum lengkap",met:false};
  const met=k.dir==="lower"?c<=t:c>=t;
  const p=t===b?(met?1:0):(c-b)/(t-b);
  let cls,label;
  if(met){cls="good";label="Tercapai"}else if(p>=.5){cls="ok";label="On track"}else if(p>=0){cls="risk";label="Berisiko"}else{cls="bad";label="Memburuk"}
  return {p,cls,label,met};
}
function spark(k){
  const h=(k.history||[]).map(x=>N(x.v)).filter(Number.isFinite),tg=N(k.target);
  if(h.length<2)return `<div class="hint" style="margin-top:8px">Catat minimal 2 nilai untuk melihat tren.</div>`;
  const all=h.concat(Number.isFinite(tg)?[tg]:[]),mn=Math.min(...all),mx=Math.max(...all),rg=(mx-mn)||1,W=240,H=54;
  const X=i=>6+i*(W-12)/(h.length-1),Y=v=>H-6-((v-mn)/rg)*(H-12);
  const good=k.dir==="lower"?h[h.length-1]<=h[0]:h[h.length-1]>=h[0];
  const col=good?"#159b72":"#dc5262";
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:54px;margin-top:8px" role="img" aria-label="Tren">${Number.isFinite(tg)?`<line x1="0" x2="${W}" y1="${Y(tg)}" y2="${Y(tg)}" stroke="#ed8a2d" stroke-dasharray="4 4"/>`:""}<polyline fill="none" stroke="${col}" stroke-width="2.4" stroke-linejoin="round" points="${h.map((v,i)=>X(i)+","+Y(v)).join(" ")}"/>${h.map((v,i)=>`<circle cx="${X(i)}" cy="${Y(v)}" r="${i===h.length-1?4:2.5}" fill="${col}"/>`).join("")}</svg>`;
}
function ring(p){
  const R=26,C=2*Math.PI*R,v=clamp(p||0,0,1);
  return `<svg viewBox="0 0 64 64" width="52" height="52"><circle cx="32" cy="32" r="${R}" fill="none" stroke="#e3e8f2" stroke-width="7"/><circle cx="32" cy="32" r="${R}" fill="none" stroke="#2463eb" stroke-width="7" stroke-linecap="round" stroke-dasharray="${C*v} ${C}" transform="rotate(-90 32 32)"/></svg>`;
}
function kpi(){
  const items=T().kpi.items,st=items.map(kpiStat),valid=st.filter(s=>s.p!=null);
  const avg=valid.length?mean(valid.map(s=>clamp(s.p,0,1))):0;
  return head("KPI Dashboard","Pantau CTQ/KPI proyek terhadap baseline dan target. Catat nilai berkala untuk melihat tren dan status otomatis.",
    `${sampleBtn}<button class="mini" data-act="kpiToMeasure">Kirim ke Measure</button>${clearBtn}`)+
  `<div class="kpisum"><div><b>${items.length}</b><span>Total KPI</span></div><div><b style="color:#159b72">${st.filter(s=>s.met).length}</b><span>Target tercapai</span></div><div><b style="color:#c23a4b">${st.filter(s=>s.cls==="bad"||s.cls==="risk").length}</b><span>Perlu perhatian</span></div><div style="display:flex;align-items:center;gap:10px">${ring(avg)}<div><b style="font-size:19px">${f(avg*100,0)}%</b><span>Rata-rata progres</span></div></div></div>
  <div class="kpigrid">${items.map((k,i)=>{const s=st[i],h=(k.history||[]),last=h.length>1?N(h[h.length-1].v)-N(h[h.length-2].v):NaN,gd=k.dir==="lower"?last<0:last>0;
    return `<div class="kpi"><div class="top"><h5>${E(k.name)}</h5><span class="badge ${s.cls}">${s.label}</span></div>
    <div class="val">${E(k.current===""?"–":k.current)} <small>${E(k.unit)}</small></div>
    <div class="kmeta"><span>${k.dir==="lower"?"↓ lebih rendah lebih baik":"↑ lebih tinggi lebih baik"}</span>${Number.isFinite(last)&&last!==0?`<span class="delta ${gd?"good":"bad"}">${last>0?"▲":"▼"} ${f(Math.abs(last),2)}</span>`:""}</div>
    <div class="pbar"><i style="width:${s.p==null?0:clamp(s.p,0,1)*100}%;background:${({good:"#159b72",ok:"#2463eb",risk:"#ed8a2d",bad:"#dc5262",na:"#b9c4dc"})[s.cls]}"></i></div>
    <div class="kmeta"><span>Baseline ${E(k.baseline)}</span><b>${s.p==null?"–":f(clamp(s.p,0,1.5)*100,0)+"%"}</b><span>Target ${E(k.target)}</span></div>
    ${spark(k)}
    <div class="krec"><input id="rec${i}" inputmode="decimal" placeholder="Nilai terbaru"><button class="mini" data-act="recKpi" data-i="${i}">Catat</button></div>
    <div class="kedit"><div><label>Baseline</label><input data-bind="kpi.items.${i}.baseline" data-kpi="1" inputmode="decimal" value="${E(k.baseline)}"></div><div><label>Target</label><input data-bind="kpi.items.${i}.target" data-kpi="1" inputmode="decimal" value="${E(k.target)}"></div></div>
    <div class="row" style="margin-top:10px;justify-content:space-between"><span class="hint">${h.length} pencatatan</span><button class="mini warn" data-act="delKpi" data-i="${i}">Hapus</button></div></div>`}).join("")||`<div class="empty" style="grid-column:1/-1">Belum ada KPI. Tambahkan di bawah atau muat contoh.</div>`}</div>
  <form class="addbox" data-form="addKpi"><b style="font-size:13px">Tambah KPI</b><div class="g" style="margin-top:8px"><input name="name" placeholder="Nama KPI" required><input name="unit" placeholder="Satuan (%, menit)"><select name="dir"><option value="lower">Lebih rendah = baik</option><option value="higher">Lebih tinggi = baik</option></select><input name="baseline" inputmode="decimal" placeholder="Baseline" required><input name="target" inputmode="decimal" placeholder="Target" required><input name="current" inputmode="decimal" placeholder="Nilai saat ini"></div><div class="actions" style="margin-top:10px"><button class="btn primary">Tambah KPI</button></div></form>`;
}
function kpiText(){
  return T().kpi.items.map(k=>`${k.name} (${k.unit||"-"}): baseline ${k.baseline}, target ${k.target}, saat ini ${k.current||"-"}`).join("\n");
}

/* =============== SPC =============== */
const C={A2:[0,0,1.880,1.023,.729,.577,.483,.419,.373,.337,.308],D3:[0,0,0,0,0,0,0,.076,.136,.184,.223],D4:[0,0,3.267,2.574,2.282,2.114,2.004,1.924,1.864,1.816,1.777],d2:[0,0,1.128,1.693,2.059,2.326,2.534,2.704,2.847,2.970,3.078]};
function westernElectric(pts,cl,sg){
  const fl={};if(!(sg>0))return fl;
  const add=(i,r)=>{(fl[i]=fl[i]||[]).push(r)},z=pts.map(v=>(v-cl)/sg);
  z.forEach((v,i)=>{if(Math.abs(v)>3)add(i,1)});
  for(let i=2;i<z.length;i++)[1,-1].forEach(s=>{if(z[i]*s>2&&z.slice(i-2,i+1).filter(v=>v*s>2).length>=2)add(i,2)});
  for(let i=4;i<z.length;i++)[1,-1].forEach(s=>{if(z[i]*s>1&&z.slice(i-4,i+1).filter(v=>v*s>1).length>=4)add(i,3)});
  for(let i=7;i<z.length;i++)[1,-1].forEach(s=>{if(z.slice(i-7,i+1).every(v=>v*s>0))add(i,4)});
  return fl;
}
const RULE={1:"1 titik di luar batas 3σ",2:"2 dari 3 titik berurutan di luar 2σ (sisi sama)",3:"4 dari 5 titik berurutan di luar 1σ (sisi sama)",4:"8 titik berurutan di satu sisi garis tengah"};
function spcCalc(s){
  const vals=String(s.raw||"").split(/[\s,;]+/).map(N).filter(Number.isFinite);
  if(s.type==="imr"){
    if(vals.length<4)return {err:"Masukkan minimal 4 data pengukuran."};
    const m=vals.length,ph=Math.round(N(s.phase)),base=ph>=3&&ph<m?ph:m;
    const mr=vals.map((v,i)=>i?Math.abs(v-vals[i-1]):null);
    const cl=mean(vals.slice(0,base)),mrb=mean(mr.slice(1,base)),sigma=mrb/C.d2[2];
    return {type:"imr",vals,m,base,primary:vals,cl,ucl:cl+3*sigma,lcl:cl-3*sigma,sigma,sc:sigma,
      range:mr,rcl:mrb,rucl:C.D4[2]*mrb,rlcl:0,label:["Individuals (I) chart","Moving Range (MR) chart"],xlab:"Observasi",
      cap:vals.slice(0,base),skip:0};
  }
  const n=clamp(Math.round(N(s.n))||5,2,10),g=Math.floor(vals.length/n);
  if(g<3)return {err:`Butuh minimal ${3*n} data untuk 3 subgroup (n=${n}). Saat ini ${vals.length}.`};
  const groups=[];for(let i=0;i<g;i++)groups.push(vals.slice(i*n,i*n+n));
  const xb=groups.map(mean),R=groups.map(a=>Math.max(...a)-Math.min(...a));
  const ph=Math.round(N(s.phase)),base=ph>=2&&ph<g?ph:g;
  const cl=mean(xb.slice(0,base)),rb=mean(R.slice(0,base)),sigma=rb/C.d2[n],sc=C.A2[n]*rb/3;
  return {type:"xr",vals,m:g,base,primary:xb,cl,ucl:cl+C.A2[n]*rb,lcl:cl-C.A2[n]*rb,sigma,sc,
    range:R,rcl:rb,rucl:C.D4[n]*rb,rlcl:C.D3[n]*rb,label:[`X̄ chart (n=${n})`,`R chart (n=${n})`],xlab:"Subgroup",
    cap:[].concat(...groups.slice(0,base)),skip:vals.length-g*n,n};
}
function lineChart(o){
  const W=900,H=270,l=58,r=76,t=18,b=34,pw=W-l-r,ph=H-t-b,m=o.pts.length;
  const fin=o.pts.filter(v=>v!=null);
  let lo=Math.min(...fin,o.lcl),hi=Math.max(...fin,o.ucl);const pad=(hi-lo)*.08||1;lo-=pad;hi+=pad;
  const X=i=>l+(m===1?pw/2:i*pw/(m-1)),Y=v=>t+ph-((v-lo)/(hi-lo))*ph;
  let g="";
  for(let k=0;k<=4;k++){const v=lo+(hi-lo)*k/4;g+=`<line x1="${l}" x2="${W-r}" y1="${Y(v)}" y2="${Y(v)}" stroke="#eef1f7"/><text x="${l-7}" y="${Y(v)+4}" text-anchor="end" font-size="10.5" fill="#8791a3">${f(v,Math.abs(hi-lo)<10?2:1)}</text>`}
  if(o.zones&&o.sc>0)[1,2].forEach(k=>[1,-1].forEach(sg=>{const v=o.cl+sg*k*o.sc;if(v>lo&&v<hi)g+=`<line x1="${l}" x2="${W-r}" y1="${Y(v)}" y2="${Y(v)}" stroke="#c9d3ea" stroke-dasharray="2 4"/><text x="${l+3}" y="${Y(v)-3}" font-size="9" fill="#9aa5bd">${sg>0?"+":"−"}${k}σ</text>`}));
  const lim=(v,txt,col,dash)=>{if(v>lo&&v<hi)g+=`<line x1="${l}" x2="${W-r}" y1="${Y(v)}" y2="${Y(v)}" stroke="${col}" stroke-width="1.8" ${dash?'stroke-dasharray="7 5"':""}/><text x="${W-r+6}" y="${Y(v)+4}" font-size="11" font-weight="700" fill="${col}">${txt} ${f(v,3)}</text>`};
  lim(o.ucl,"UCL","#dc5262",1);lim(o.cl,"CL","#159b72",0);if(o.showLcl!==false)lim(o.lcl,"LCL","#dc5262",1);
  if(o.base<m){const x=l+(o.base-.5)*pw/(m-1);g+=`<line x1="${x}" x2="${x}" y1="${t}" y2="${t+ph}" stroke="#2463eb" stroke-dasharray="3 4"/><text x="${x-5}" y="${t+11}" text-anchor="end" font-size="10" fill="#2463eb">Baseline</text><text x="${x+5}" y="${t+11}" font-size="10" fill="#2463eb">Monitoring</text>`}
  const segs=o.pts.map((v,i)=>v==null?null:X(i)+","+Y(v)).filter(Boolean);
  g+=`<polyline fill="none" stroke="#6b7a99" stroke-width="1.6" stroke-linejoin="round" points="${segs.join(" ")}"/>`;
  o.pts.forEach((v,i)=>{if(v==null)return;const fl=o.flags[i];
    g+=`<circle cx="${X(i)}" cy="${Y(v)}" r="${fl?5.5:3.6}" fill="${fl?"#dc5262":"#2463eb"}" stroke="#fff" stroke-width="1.4"><title>${o.xlab} ${i+1}: ${f(v,3)}${fl?" — melanggar aturan "+fl.join(", "):""}</title></circle>`;});
  const step=Math.max(1,Math.ceil(m/20));
  for(let i=0;i<m;i+=step)g+=`<text x="${X(i)}" y="${H-12}" text-anchor="middle" font-size="10" fill="#8791a3">${i+1}</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${E(o.title)}">${g}</svg>`;
}
function spc(){
  const s=T().spc;
  return head("SPC Control Chart","Pantau stabilitas proses. Tempel data pengukuran (pisahkan dengan spasi, koma, atau baris baru). Titik merah = sinyal di luar kendali (Western Electric).",
    `${sampleBtn}<button class="mini" data-act="spcToControl">Kirim ke Control</button>${clearBtn}`)+
  `<div class="spcctl"><div><label>Jenis chart</label><select data-bind="spc.type" data-spcfull="1"><option value="imr" ${s.type==="imr"?"selected":""}>I-MR (individual)</option><option value="xr" ${s.type==="xr"?"selected":""}>X̄-R (subgroup)</option></select></div>
  ${s.type==="xr"?`<div><label>Ukuran subgroup (n)</label><input data-bind="spc.n" data-live="1" inputmode="numeric" value="${E(s.n)}"></div>`:""}
  <div><label>Baseline: pakai ${s.type==="xr"?"subgroup":"titik"} 1…N</label><input data-bind="spc.phase" data-live="1" inputmode="numeric" placeholder="semua" value="${E(s.phase)}"></div>
  <div><label>LSL (opsional)</label><input data-bind="spc.lsl" data-live="1" inputmode="decimal" value="${E(s.lsl)}"></div>
  <div><label>USL (opsional)</label><input data-bind="spc.usl" data-live="1" inputmode="decimal" value="${E(s.usl)}"></div></div>
  <label style="margin-top:4px">Data pengukuran (berurutan sesuai waktu)</label><textarea data-bind="spc.raw" data-live="1" data-spcfull="0" style="min-height:96px;font-variant-numeric:tabular-nums" placeholder="50.2 49.1 51.3 50.8 ...">${E(s.raw)}</textarea>
  <div id="spcOut"></div>`;
}
function spcOut(){
  const box=$("#spcOut");if(!box)return;
  const s=T().spc,c=spcCalc(s);
  if(c.err){box.innerHTML=`<div class="callout warn">${E(c.err)}</div>`;return}
  const f1=westernElectric(c.primary,c.cl,c.sc),f2={};
  c.range.forEach((v,i)=>{if(v!=null&&(v>c.rucl||(c.rlcl>0&&v<c.rlcl)))f2[i]=[1]});
  const ch1=lineChart({pts:c.primary,cl:c.cl,ucl:c.ucl,lcl:c.lcl,sc:c.sc,flags:f1,base:c.base,title:c.label[0],xlab:c.xlab,zones:true});
  const ch2=lineChart({pts:c.range,cl:c.rcl,ucl:c.rucl,lcl:c.rlcl,sc:0,flags:f2,base:c.base,title:c.label[1],xlab:c.xlab,zones:false,showLcl:c.rlcl>0});
  const viol=[];
  Object.keys(f1).forEach(i=>viol.push(`${c.xlab} ${+i+1} (${f(c.primary[i],3)}): ${f1[i].map(r=>"Aturan "+r+" — "+RULE[r]).join("; ")}`));
  Object.keys(f2).forEach(i=>viol.push(`${c.type==="imr"?"MR":"R"} ${c.xlab} ${+i+1} (${f(c.range[i],3)}): di luar batas kendali`));
  const usl=N(s.usl),lsl=N(s.lsl),mu=mean(c.cap);let cap="";
  if(c.sigma>0&&(Number.isFinite(usl)||Number.isFinite(lsl))){
    const cp=Number.isFinite(usl)&&Number.isFinite(lsl)?(usl-lsl)/(6*c.sigma):NaN;
    const cpu=Number.isFinite(usl)?(usl-mu)/(3*c.sigma):Infinity,cpl=Number.isFinite(lsl)?(mu-lsl)/(3*c.sigma):Infinity,cpk=Math.min(cpu,cpl);
    c.capv={cp,cpk};
    cap=`<div class="spcnums">${Number.isFinite(cp)?`<div><b>${f(cp,2)}</b><span>Cp</span></div>`:""}<div><b>${f(cpk,2)}</b><span>Cpk (σ within)</span></div></div><div class="callout ${cpk>=1.33?"ok":cpk>=1?"warn":"bad"}">${cpk>=1.33?"Proses kapabel (Cpk ≥ 1,33).":cpk>=1?"Proses marginal (1,00 ≤ Cpk < 1,33) — perlu perbaikan.":"Proses tidak kapabel (Cpk < 1,00) — banyak output di luar spesifikasi."} ${viol.length?"Catatan: Cpk hanya valid jika proses stabil (tanpa sinyal di luar kendali).":""}</div>`;
  }
  T().spc._last={type:c.type,cl:c.cl,ucl:c.ucl,lcl:c.lcl,sigma:c.sigma,rcl:c.rcl,rucl:c.rucl,viol:viol.length,capv:c.capv||null,n:c.n||null};
  persist();
  box.innerHTML=`<div class="spcnums"><div><b>${c.m}</b><span>${c.type==="xr"?"Subgroup":"Titik data"}</span></div><div><b>${f(c.cl,3)}</b><span>Garis tengah (CL)</span></div><div><b>${f(c.ucl,3)}</b><span>UCL</span></div><div><b>${f(c.lcl,3)}</b><span>LCL</span></div><div><b>${f(c.sigma,3)}</b><span>σ within</span></div><div><b style="color:${viol.length?"#c23a4b":"#159b72"}">${viol.length}</b><span>Sinyal</span></div></div>
  ${c.skip?`<div class="hint">${c.skip} data sisa diabaikan (tidak membentuk subgroup penuh).</div>`:""}
  <div class="charttitle">${c.label[0]}</div><div class="scroller">${ch1}</div>
  <div class="charttitle">${c.label[1]}</div><div class="scroller">${ch2}</div>
  <div class="legend"><span><i style="background:#2463eb"></i>Dalam kendali</span><span><i style="background:#dc5262"></i>Sinyal out-of-control</span><span>Garis putus abu = zona ±1σ / ±2σ</span></div>
  ${viol.length?`<ul class="viol">${viol.map(v=>`<li>${E(v)}</li>`).join("")}</ul>`:`<div class="callout ok">Tidak ada sinyal — proses terlihat stabil (dalam kendali statistik) pada data ini.</div>`}${cap}`;
}
function spcText(){
  const l=T().spc._last;if(!l)return "";
  const nm=l.type==="imr"?"I-MR":"X̄-R (n="+l.n+")";
  return `Chart ${nm}: CL=${f(l.cl,3)}, UCL=${f(l.ucl,3)}, LCL=${f(l.lcl,3)}, σ within=${f(l.sigma,3)}; ${l.type==="imr"?"MR":"R"} CL=${f(l.rcl,3)}, UCL=${f(l.rucl,3)}.\nSinyal out-of-control saat ini: ${l.viol}.`+(l.capv?`\nKapabilitas: ${Number.isFinite(l.capv.cp)?"Cp="+f(l.capv.cp,2)+", ":""}Cpk=${f(l.capv.cpk,2)}.`:"")+"\nAturan reaksi: investigasi penyebab khusus (special cause) setiap kali titik melanggar aturan Western Electric; hentikan penyesuaian proses jika tidak ada sinyal.";
}

/* =============== samples =============== */
const SAMPLES={
  fishbone(){const mk=a=>a.map((t,i)=>({id:uid(),text:t,root:false}));
    const fb=T().fishbone;fb.effect="Defect produksi 8% (target 3%)";
    fb.causes={Man:mk(["Operator baru belum terlatih","Beban lembur tinggi"]),Machine:mk(["Mesin tidak dikalibrasi rutin","Pisau potong aus"]),Method:mk(["SOP setting tidak jelas","Tidak ada first-piece inspection"]),Material:mk(["Variasi kualitas supplier","Penyimpanan lembap"]),Measurement:mk(["Alat ukur tidak terkalibrasi","Kriteria cacat berbeda antar inspektor"]),Environment:mk(["Pencahayaan kurang di line 2","Suhu ruang tidak stabil"])};
    fb.causes.Machine[0].root=true;fb.causes.Method[1].root=true;},
  pareto(){const p=T().pareto;p.unit="unit cacat";p.items=[["Goresan",42],["Dimensi di luar spek",28],["Warna tidak sesuai",14],["Retak",9],["Kemasan rusak",5],["Lain-lain",4]].map(a=>({id:uid(),name:a[0],count:String(a[1])}));},
  whys(){const w=T().whys;w.problem="Defect goresan 42 unit/minggu pada Line 2 (target < 10).";
    w.steps=["Pisau potong meninggalkan burr pada tepi produk.","Pisau sudah aus melebihi batas pakai.","Penggantian pisau tidak dilakukan sesuai jadwal.","Tidak ada pengingat/penjadwalan preventive maintenance yang terlihat operator.","PM hanya dicatat manual di buku dan tidak ada PIC yang memeriksa kepatuhan."];
    w.root="Tidak ada sistem penjadwalan dan verifikasi preventive maintenance (tanpa PIC dan pengingat).";},
  kpi(){const k=T().kpi,d=n=>{const x=new Date();x.setDate(x.getDate()-n);return x.toLocaleDateString("en-CA")};
    const h=(a,off)=>a.map((v,i)=>({d:d(off-i*7),v:String(v)}));
    k.items=[{id:uid(),name:"Defect rate",unit:"%",dir:"lower",baseline:"8",target:"3",current:"4.4",history:h([8,7.2,6.1,5.3,4.4],28)},
      {id:uid(),name:"Cycle time",unit:"menit",dir:"lower",baseline:"42",target:"35",current:"35.5",history:h([42,40.5,38,36.2,35.5],28)},
      {id:uid(),name:"Kepuasan pelanggan (CSAT)",unit:"%",dir:"higher",baseline:"78",target:"90",current:"82",history:h([78,79,81,80,82],28)},
      {id:uid(),name:"On-time delivery",unit:"%",dir:"higher",baseline:"88",target:"95",current:"86",history:h([88,89,87,86,86],28)}];},
  spc(){const s=T().spc;s.type="imr";s.phase="20";s.lsl="45";s.usl="56";
    s.raw="50.2 49.1 51.3 50.8 48.9 50.5 49.7 51.0 50.1 49.4 50.9 51.4 49.8 50.3 48.7 50.6 51.1 49.9 50.0 50.4 54.9 52.5 53.0 53.6 52.8 53.3 54.1 52.9 53.7 53.2";}
};
const ARRAYS={fishbone:()=>{const fb=T().fishbone;fb.effect="";CATS.forEach(c=>fb.causes[c[0]]=[])},pareto:()=>{T().pareto.items=[]},whys:()=>{T().whys={problem:"",steps:["","","","",""],root:""}},kpi:()=>{T().kpi.items=[]},spc:()=>{T().spc={type:"imr",n:5,raw:"",phase:"",usl:"",lsl:""}}};

/* =============== events =============== */
function setPath(path,val){
  const p=path.split(".");let o=T();
  for(let i=0;i<p.length-1;i++)o=o[p[i]];
  o[p[p.length-1]]=val;
}
function getPath(path){return path.split(".").reduce((o,k)=>o[k],T())}
function hasData(){
  const t=T();
  return {fishbone:()=>t.fishbone.effect||CATS.some(c=>t.fishbone.causes[c[0]].length),pareto:()=>t.pareto.items.length,whys:()=>t.whys.problem||t.whys.steps.some(Boolean),kpi:()=>t.kpi.items.length,spc:()=>t.spc.raw}[tab]();
}
function act(el){
  const a=el.dataset.act,t=T(),id=el.dataset.id,cat=el.dataset.cat,i=+el.dataset.i;
  switch(a){
    case "tab":tab=el.dataset.tab;show();return;
    case "sample":if(hasData()&&!confirm("Ganti data tab ini dengan contoh?"))return;SAMPLES[tab]();break;
    case "clear":if(hasData()&&!confirm("Kosongkan semua data di tab ini?"))return;ARRAYS[tab]();break;
    case "star":{const x=t.fishbone.causes[cat].find(y=>y.id===id);if(x)x.root=!x.root;break}
    case "delCause":t.fishbone.causes[cat]=t.fishbone.causes[cat].filter(y=>y.id!==id);break;
    case "fbToAnalyze":pushText(2,"fishbone",fbText());return;
    case "delPar":t.pareto.items.splice(i,1);break;
    case "parToAnalyze":{const d=parData();if(!d.items.length)return toast("Belum ada data Pareto");
      const v=d.items.filter(x=>x.vital);pushText(2,"priority","Pareto: "+v.map(x=>`${x.name} (${f(x.pct*100,1)}%)`).join(", ")+` = ${f(v[v.length-1].cum*100,1)}% dari total ${f(d.total)}.`);return}
    case "addWhy":if(t.whys.steps.length<8)t.whys.steps.push("");break;
    case "delWhy":if(t.whys.steps.length>1)t.whys.steps.pop();break;
    case "whyUseLast":{const l=t.whys.steps.filter(s=>s.trim()).pop();if(l)t.whys.root=l.trim();break}
    case "whyToAnalyze":pushText(2,"fivewhy",whyText());return;
    case "recKpi":{const inp=$("#rec"+i),v=N(inp.value);if(!Number.isFinite(v))return toast("Masukkan angka");
      const k=t.kpi.items[i];k.history=k.history||[];k.history.push({d:today(),v:String(v)});k.current=String(v);break}
    case "delKpi":if(!confirm("Hapus KPI ini?"))return;t.kpi.items.splice(i,1);break;
    case "kpiToMeasure":{if(!t.kpi.items.length)return toast("Belum ada KPI");const k=t.kpi.items;
      pushText(1,"metric",k.map(x=>`${x.name} (${x.unit||"-"}, ${x.dir==="lower"?"lebih rendah lebih baik":"lebih tinggi lebih baik"})`).join("\n"));
      pushText(1,"baseline",k.map(x=>`${x.name}: ${x.baseline} ${x.unit}`).join("\n"));
      pushText(1,"target",k.map(x=>`${x.name}: ${x.target} ${x.unit}`).join("\n"));return}
    case "spcToControl":{const x=spcText();if(!x)return toast("Isi data SPC terlebih dahulu");pushText(4,"monitor",x);return}
  }
  persist();show();
}
function init(){
  const r=root();if(!r||r._init)return;r._init=true;
  r.addEventListener("click",e=>{const el=e.target.closest("[data-act]");if(el&&r.contains(el)){e.preventDefault();act(el)}});
  r.addEventListener("submit",e=>{
    const fm=e.target.closest("[data-form]");if(!fm)return;e.preventDefault();
    const t=T(),d=new FormData(fm),k=fm.dataset.form;
    if(k==="addCause"){const s=String(d.get("t")||"").trim();if(!s)return;t.fishbone.causes[fm.dataset.cat].push({id:uid(),text:s,root:false})}
    if(k==="addPar"){const n=String(d.get("n")||"").trim(),c=N(d.get("c"));if(!n||!Number.isFinite(c))return toast("Isi kategori dan jumlah (angka)");t.pareto.items.push({id:uid(),name:n,count:String(c)})}
    if(k==="addKpi"){const g=x=>String(d.get(x)||"").trim();if(!g("name")||!Number.isFinite(N(g("baseline")))||!Number.isFinite(N(g("target"))))return toast("Nama, baseline, dan target (angka) wajib diisi");
      const cur=g("current");t.kpi.items.push({id:uid(),name:g("name"),unit:g("unit"),dir:g("dir"),baseline:g("baseline"),target:g("target"),current:cur,history:Number.isFinite(N(cur))?[{d:today(),v:cur}]:[]})}
    persist();show();
    const nf=r.querySelector(k==="addCause"?`[data-form="addCause"][data-cat="${fm.dataset.cat}"] input`:null);if(nf)nf.focus();
  });
  const onField=e=>{
    const el=e.target;if(!el.dataset||!el.dataset.bind)return;
    const live=el.dataset.live==="1";
    if(e.type==="input"&&!live)return;           // non-live fields commit on blur/change
    if(e.type==="change"&&live&&el.tagName!=="SELECT")return;
    setPath(el.dataset.bind,el.value);persist();
    if(el.dataset.bind==="fishbone.effect"){const b=$("#fbSvg");if(b)b.innerHTML=fishSVG(T().fishbone)}
    else if(el.dataset.bind.startsWith("pareto"))parOut();
    else if(el.dataset.bind.startsWith("spc")){if(el.dataset.spcfull==="1")show();else spcOut()}
    else if(el.dataset.kpi==="1")show();
  };
  r.addEventListener("input",onField);r.addEventListener("change",onField);
}
window.Tools={show,init,open(t){if(t)tab=t;show()},_calc:{spcCalc,westernElectric,kpiStat,parData}};
document.addEventListener("DOMContentLoaded",init);
})();
