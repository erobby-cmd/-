/* עורך AI ביומן: פאנל צ'אט שמדבר עם שירות EditorTwin המקומי (127.0.0.1:8503).
   קובץ עצמאי. נטען בשורה אחת לפני סוף ה body. אם השירות כבוי, הפאנל אומר איך להפעיל אותו. */
(function(){
"use strict";
try{
if(window.__etPanel) return; window.__etPanel=1;

var LS="et_panel_v1", SVC_DEFAULT="http://127.0.0.1:8503";
var S={open:false, tab:"chat", busy:false, online:null, msgs:[], seq:null, svc:SVC_DEFAULT, padIn:0.2, padOut:0.3, files:null, warn:[]};
try{ var saved=JSON.parse(localStorage.getItem(LS)||"{}"); for(var k in saved) if(k in S) S[k]=saved[k]; S.busy=false; S.open=false; }catch(_){}
function persist(){ try{ localStorage.setItem(LS, JSON.stringify({msgs:S.msgs.slice(-40), seq:S.seq, svc:S.svc, padIn:S.padIn, padOut:S.padOut})); }catch(_){} }

var css=[
".et-fab{position:fixed;inset-block-end:22px;inset-inline-end:22px;z-index:70;background:var(--accent,#0C6B75);color:var(--accent-ink,#fff);border:0;border-radius:999px;padding:11px 18px;font:700 14px Heebo,sans-serif;box-shadow:var(--shadow,0 6px 20px rgba(0,0,0,.2));cursor:pointer}",
".et-box{position:fixed;inset-block:0;inset-inline-end:0;width:min(440px,100vw);z-index:85;background:var(--surface,#fff);color:var(--ink,#13171C);border-inline-start:1px solid var(--line,#D2D7DB);box-shadow:var(--shadow);display:none;flex-direction:column;font:14px/1.5 Heebo,sans-serif;direction:rtl}",
".et-box.on{display:flex}",
".et-h{display:flex;align-items:center;gap:8px;padding:10px 14px;border-block-end:1px solid var(--line,#D2D7DB)}",
".et-h b{font-size:15px;flex:1}",
".et-dot{width:9px;height:9px;border-radius:50%;background:var(--ink-3,#79838F)}.et-dot.ok{background:var(--shot,#1E7A4E)}.et-dot.bad{background:var(--todo,#A8305C)}",
".et-x{background:none;border:0;color:var(--ink-2,#4E5763);font-size:20px;cursor:pointer;line-height:1}",
".et-tabs{display:flex;border-block-end:1px solid var(--line,#D2D7DB)}",
".et-tabs button{flex:1;background:none;border:0;padding:9px 4px;font:600 13px Heebo,sans-serif;color:var(--ink-2,#4E5763);cursor:pointer;border-block-end:2px solid transparent}",
".et-tabs button.on{color:var(--accent,#0C6B75);border-block-end-color:var(--accent,#0C6B75)}",
".et-body{flex:1;overflow:auto;padding:12px 14px}",
".et-m{margin:0 0 12px;padding:9px 12px;border-radius:12px;white-space:pre-wrap;word-break:break-word}",
".et-m.u{background:var(--surface-2,#F1F3F4)}.et-m.a{background:var(--shot-soft,#D9EDE2)}",
".et-tr{margin:-6px 0 12px;font-size:12px;color:var(--ink-2,#4E5763)}",
".et-tr summary{cursor:pointer}.et-tr li{margin:2px 0}",
".et-bar{display:flex;height:34px;border-radius:8px;overflow:hidden;border:1px solid var(--line,#D2D7DB);margin:6px 0 10px}",
".et-bar i{display:block;min-width:3px;border-inline-end:1px solid rgba(255,255,255,.7)}",
".et-row{display:grid;grid-template-columns:28px 1fr;gap:6px;padding:7px 0;border-block-end:1px solid var(--line,#D2D7DB);font-size:13px}",
".et-row small{color:var(--ink-3,#79838F);display:block}",
".et-in{display:flex;gap:8px;padding:10px 14px;border-block-start:1px solid var(--line,#D2D7DB)}",
".et-in textarea{flex:1;resize:none;height:54px;border:1px solid var(--line-2,#BFC6CC);border-radius:10px;padding:8px 10px;font:14px Heebo,sans-serif;background:var(--surface,#fff);color:inherit;direction:rtl}",
".et-btn{background:var(--accent,#0C6B75);color:var(--accent-ink,#fff);border:0;border-radius:10px;padding:0 16px;font:700 14px Heebo,sans-serif;cursor:pointer}",
".et-btn:disabled{opacity:.5;cursor:default}.et-btn.g{background:var(--surface-2,#F1F3F4);color:var(--ink,#13171C);border:1px solid var(--line-2,#BFC6CC);padding:8px 14px}",
".et-note{font-size:12px;color:var(--ink-2,#4E5763);background:var(--partial-soft,#F3E6CE);border-radius:8px;padding:8px 10px;margin:0 0 10px}",
".et-f label{display:block;margin:8px 0 3px;font-size:12px;color:var(--ink-2,#4E5763)}.et-f input{width:100%;box-sizing:border-box;padding:7px 9px;border:1px solid var(--line-2,#BFC6CC);border-radius:8px;background:var(--surface,#fff);color:inherit;font:13px Heebo,sans-serif;direction:ltr}"
].join("\n");
var st=document.createElement("style"); st.textContent=css; document.head.appendChild(st);

function el(tag, cls, txt){ var e=document.createElement(tag); if(cls) e.className=cls; if(txt!=null) e.textContent=txt; return e; }
function hue(id){ var h=0; for(var i=0;i<id.length;i++) h=(h*31+id.charCodeAt(i))%360; return "hsl("+h+",48%,46%)"; }
function fmt(s){ s=Math.max(0,s); var h=Math.floor(s/3600), m=Math.floor(s/60)%60, x=s%60; return (h<10?"0":"")+h+":"+(m<10?"0":"")+m+":"+(x<10?"0":"")+x.toFixed(1); }
function dur(s){ var m=Math.floor(s/60), x=Math.round(s%60); return m+":"+(x<10?"0":"")+x; }

var fab=el("button","et-fab","🎬 עורך AI"); fab.type="button";
var box=el("div","et-box"); box.setAttribute("role","dialog"); box.setAttribute("aria-label","עורך AI");
var dot=el("span","et-dot"), x=el("button","et-x","×"); x.type="button"; x.setAttribute("aria-label","סגירה");
var h=el("div","et-h"); h.appendChild(el("b",null,"עורך AI של היומן")); h.appendChild(dot); h.appendChild(x);
var tabs=el("div","et-tabs"), body=el("div","et-body"), inp=el("div","et-in");
var ta=el("textarea"); ta.placeholder="תן לי הנחיה, למשל: בנה סצנה של שלוש דקות על החקירה של הנער, תפתח בשוט החזק";
var send=el("button","et-btn","שלח"); send.type="button";
inp.appendChild(ta); inp.appendChild(send);
box.appendChild(h); box.appendChild(tabs); box.appendChild(body); box.appendChild(inp);
document.body.appendChild(fab); document.body.appendChild(box);

[["chat","צ'אט"],["seq","סיקוונס"],["set","הגדרות"]].forEach(function(t){
  var b=el("button",null,t[1]); b.type="button"; b.onclick=function(){ S.tab=t[0]; draw(); }; b.dataset.t=t[0]; tabs.appendChild(b);
});

function api(path, opt){ return fetch(S.svc+path, opt||{}).then(function(r){ return r.json(); }); }
function ping(){
  return api("/health").then(function(j){ S.online=!!j.ok; S.model=j.model; }).catch(function(){ S.online=false; }).then(function(){ draw(); });
}

function timeline(seq){
  var wrap=el("div"), bar=el("div","et-bar"), tot=seq.total_sec||1;
  seq.shots.forEach(function(s,i){
    var b=document.createElement("i"); b.style.width=((s.out-s.in)/tot*100)+"%"; b.style.background=hue(s.clip_id);
    b.title=(i+1)+". "+s.clip_id+" "+fmt(s.in)+" עד "+fmt(s.out)+(s.note?"\n"+s.note:""); bar.appendChild(b);
  });
  wrap.appendChild(bar); return wrap;
}
function drawChat(){
  if(S.online===false){
    var n=el("div","et-note","השירות המקומי לא רץ. פתח טרמינל והרץ: ~/EditorTwin/scripts/editor_service.sh (פעם ראשונה: pip3 install pyaaf2 anthropic). אחרי זה רענן."); body.appendChild(n);
  }
  if(!S.msgs.length) body.appendChild(el("div","et-m a","אני העורך. תגיד לי איזו סצנה לבנות ומאיזה ימים, ואני אחפש בתמלולים, אבנה סיקוונס ואראה לך מה עשיתי. אחר כך אפשר לייצא AAF לאביד."));
  S.msgs.forEach(function(m){
    body.appendChild(el("div","et-m "+(m.role==="user"?"u":"a"),m.content));
    if(m.trace&&m.trace.length){
      var d=document.createElement("details"); d.className="et-tr"; d.appendChild(el("summary",null,"המהלך ("+m.trace.length+" צעדים)"));
      var ul=document.createElement("ul"); m.trace.forEach(function(t){ ul.appendChild(el("li",null,(t.kind==="thought"?"חשבתי: ":"")+(t.summary||t.text||""))); });
      d.appendChild(ul); body.appendChild(d);
    }
    if(m.seq&&m.seq.shots&&m.seq.shots.length){ body.appendChild(timeline(m.seq)); }
  });
  if(S.busy) body.appendChild(el("div","et-m a","עובד על זה..."));
  body.scrollTop=body.scrollHeight;
}
function drawSeq(){
  var q=S.seq;
  if(!q||!q.shots||!q.shots.length){ body.appendChild(el("div","et-m a","עוד אין סיקוונס. בקש בצ'אט.")); return; }
  body.appendChild(el("b",null,q.title+" · "+dur(q.total_sec)+" · "+q.shots.length+" שוטים"));
  body.appendChild(timeline(q));
  q.shots.forEach(function(s,i){
    var r=el("div","et-row"); r.appendChild(el("span",null,String(i+1)));
    var c=el("div"); c.appendChild(el("div",null,s.text_he||s.source_text||""));
    c.appendChild(el("small",null,s.clip_id+" · "+fmt(s.in)+" עד "+fmt(s.out)+(s.note?" · "+s.note:""))); r.appendChild(c); body.appendChild(r);
  });
  var eb=el("button","et-btn","ייצוא ל AAF ולטקסט תרגום"); eb.style.margin="12px 0 8px"; eb.disabled=S.busy||!S.online; eb.onclick=doExport; body.appendChild(eb);
  (S.warn||[]).forEach(function(w){ body.appendChild(el("div","et-note",w)); });
  if(S.files){ S.files.forEach(function(f){ var b=el("button","et-btn g","הורד "+f.name.replace(/^\d{8}_\d{4}_/,"")); b.style.cssText="display:block;margin:6px 0;width:100%"; b.onclick=function(){ dl(f); }; body.appendChild(b); }); }
}
function drawSet(){
  var f=el("div","et-f");
  [["כתובת השירות","svc","text"],["אוויר לפני השוט בשניות","padIn","number"],["אוויר אחרי השוט בשניות","padOut","number"]].forEach(function(r){
    f.appendChild(el("label",null,r[0])); var i=document.createElement("input"); i.type=r[2]; if(r[2]==="number") i.step="0.1"; i.value=S[r[1]];
    i.onchange=function(){ S[r[1]]=r[2]==="number"?(parseFloat(i.value)||0):i.value.trim(); persist(); if(r[1]==="svc") ping(); }; f.appendChild(i);
  });
  var c=el("button","et-btn g","נקה שיחה וסיקוונס"); c.style.marginTop="14px"; c.onclick=function(){ S.msgs=[]; S.seq=null; S.files=null; S.warn=[]; persist(); S.tab="chat"; draw(); }; f.appendChild(c);
  body.appendChild(f);
  body.appendChild(el("div","et-note","מודל: "+(S.model||"לא ידוע")+(S.online?"":" (השירות כבוי)")));
}
function draw(){
  box.classList.toggle("on",S.open); fab.style.display=S.open?"none":"";
  dot.className="et-dot"+(S.online===true?" ok":S.online===false?" bad":"");
  Array.prototype.forEach.call(tabs.children,function(b){ b.classList.toggle("on",b.dataset.t===S.tab); });
  body.textContent=""; inp.style.display=S.tab==="chat"?"flex":"none"; send.disabled=S.busy;
  (S.tab==="chat"?drawChat:S.tab==="seq"?drawSeq:drawSet)();
}

function dl(f){
  fetch(S.svc+f.url).then(function(r){ return r.blob(); }).then(function(b){
    var a=document.createElement("a"); a.href=URL.createObjectURL(b); a.download=f.name; document.body.appendChild(a); a.click();
    setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); },2000);
  }).catch(function(){ S.warn=["ההורדה נכשלה, בדוק שהשירות רץ"]; draw(); });
}
function doExport(){
  S.busy=true; S.files=null; S.warn=[]; draw();
  fetch(S.svc+"/export",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sequence:S.seq,pad_in:S.padIn,pad_out:S.padOut})})
   .then(function(r){ return r.json(); }).then(function(j){
     S.busy=false; if(j.error){ S.warn=["שגיאה בייצוא: "+j.error]; } else { S.files=j.files; S.warn=j.warnings||[]; } draw();
   }).catch(function(){ S.busy=false; S.online=false; S.warn=["אין חיבור לשירות"]; draw(); });
}
function doSend(){
  var t=ta.value.trim(); if(!t||S.busy) return; ta.value=""; S.msgs.push({role:"user",content:t}); S.busy=true; persist(); draw();
  var hist=S.msgs.map(function(m){ return {role:m.role,content:m.content}; });
  fetch(S.svc+"/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:hist,sequence:S.seq})})
   .then(function(r){ return r.json(); }).then(function(j){
     S.busy=false;
     if(j.error){ S.msgs.push({role:"assistant",content:"שגיאה: "+j.error}); }
     else{
       var built=j.sequence&&j.sequence.shots&&j.sequence.shots.length&&JSON.stringify(j.sequence)!==JSON.stringify(S.seq);
       if(j.sequence) S.seq=j.sequence; S.files=null;
       S.msgs.push({role:"assistant",content:j.reply,trace:j.trace,seq:built?j.sequence:null});
     }
     persist(); draw();
   }).catch(function(){ S.busy=false; S.online=false; S.msgs.push({role:"assistant",content:"אין חיבור לשירות המקומי."}); persist(); draw(); });
}

fab.onclick=function(){ S.open=true; draw(); ping(); ta.focus(); };
x.onclick=function(){ S.open=false; draw(); };
send.onclick=doSend;
ta.addEventListener("keydown",function(e){ if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); doSend(); } });
document.addEventListener("keydown",function(e){ if(e.key==="Escape"&&S.open){ S.open=false; draw(); } });
draw();
}catch(err){ try{ console.warn("editor panel failed", err); }catch(_){} }
})();
