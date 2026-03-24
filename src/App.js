import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabase";

// ── Design tokens ─────────────────────────────────────────────────
const T = {
  bg:"#E8E5DF", surface:"#FFFFFF", surfaceAlt:"#F4F3F0",
  border:"#E8E6E1", borderMid:"#D0CEC9",
  ink:"#111110", inkMid:"#555450", inkLight:"#9B9893",
  accent:"#C8502A", green:"#2D6A4F", greenBg:"#EAF4EF",
};

const CARD_COLORS = ["#C8502A","#2563EB","#7C3AED","#B45309","#059669","#DC2626","#0891B2","#4F46E5","#BE185D","#0369A1"];
const DAY_EMOJIS  = ["✈️","🎮","⛩️","🦊","🌸","🍜","🏖️","🗻","🎎","🌙"];
const MOODS       = ["😊","😄","🥰","😎","🤩","😴","🥺","😤","🤔","🥳"];
const WEEKDAYS_ZH = ["日","一","二","三","四","五","六"];
const TRIP_ID     = "main"; // single shared trip

const mkDays = (n, startDate) => Array.from({length:n},(_,i)=>{
  const d = startDate ? new Date(startDate) : null;
  if (d) d.setDate(d.getDate() + i);
  return {
    id: i+1,
    label: d ? `${d.getMonth()+1}/${d.getDate()}` : `第${["1","2","3","4","5","6","7","8","9","10"][i]}天`,
    sub: d ? WEEKDAYS_ZH[d.getDay()] : ["日","一","二","三","四","五","六","日","一","二"][i],
    emoji: DAY_EMOJIS[i],
    date: d ? d.toISOString().split("T")[0] : null,
  };
});

const defaultTrip = {
  tripTitle:"福岡家庭旅遊", tripIcon:"🌸", tripSub:"5晚6天・Fukuoka, Japan",
  numDays:5, startDate:"", members:4, isPrivate:false, mood:"😊",
  days: mkDays(5,""),
  data:{
    1:[
      {id:1,time:"10:00",name:"福岡空港",nameJp:"福岡空港",desc:"抵達福岡國際機場・辦理入境・換取交通卡",tags:["🚌 交通","免費"],spots:["地鐵空港線 — 直達博多站，約5分鐘","7-Eleven — 機場內購買西瓜卡"],color:"#C8502A"},
      {id:2,time:"13:00",name:"博多駅",nameJp:"博多駅",desc:"博多最繁華的交通樞紐・購物與美食天堂",tags:["🛍️ 購物","免費入場"],spots:["博多阪急百貨 — 日本名牌購物","博多一幸舍 — 必吃豚骨拉麵"],color:"#2563EB"},
      {id:3,time:"15:30",name:"東長寺",nameJp:"東長寺",desc:"博多最古老禪寺・日本最大木製大佛・朱色五重塔",tags:["⛩️ 觀光","免費"],spots:["東長寺大佛 — 日本最大木製坐佛，免費參拜","博多千年門 — 石牌坊，拍照打卡"],color:"#7C3AED"},
      {id:4,time:"15:45",name:"櫛田神社",nameJp:"櫛田神社",desc:"博多守護神社・常設博多祇園山笠展示・山笠高達15m！",tags:["⛩️ 觀光","免費"],spots:["山笠展示 — 全年常設，高達15米的巨型花車","夫婦銀杏 — 千年老樹，求良緣"],color:"#BE185D"},
      {id:5,time:"18:30",name:"中洲屋台",nameJp:"中洲屋台",desc:"福岡最著名的屋台街・那珂川河畔・夜晚美食文化體驗",tags:["🍜 餐飲","¥¥"],spots:["屋台ラーメン — 正宗博多豚骨拉麵，約¥800","もつ鍋 — 福岡名物牛雜鍋"],color:"#B45309"},
    ],
    2:[
      {id:6,time:"09:00",name:"太宰府天滿宮",nameJp:"太宰府天満宮",desc:"學問之神菅原道真的神社・受験生必拜・梅花名所",tags:["⛩️ 觀光","免費"],spots:["御神牛 — 摸頭可增智慧，考試必拜","梅ヶ枝餅 — 必吃名物，現烤麻糬"],color:"#059669"},
      {id:7,time:"14:00",name:"九州國立博物館",nameJp:"九州国立博物館",desc:"日本第四座國立博物館・展示亞洲文化交流歷史",tags:["🏛️ 文化","¥700"],spots:["常設展 — 亞洲文化交流史展覽","空中走廊 — 連接太宰府天滿宮的玻璃迴廊"],color:"#4F46E5"},
    ],
    3:[{id:8,time:"10:00",name:"海之中道海濱公園",nameJp:"海ノ中道海浜公園",desc:"博多灣半島公園・動物之森・季節花海・兒童天堂",tags:["🌸 觀光","¥450"],spots:["動物之森 — 近距離接觸水豚、袋鼠","花海廣場 — 春季油菜花、秋季波斯菊"],color:"#0891B2"}],
    4:[{id:9,time:"11:00",name:"糸島",nameJp:"糸島",desc:"福岡的湘南・海景咖啡廳・新鮮海産・Instagram打卡聖地",tags:["🌊 觀光","免費"],spots:["二見ヶ浦 — 夫婦岩日落景色，絕美打卡","牡蠣小屋 — 現烤生蠔，冬季限定"],color:"#0369A1"}],
    5:[{id:10,time:"09:30",name:"天神・大名地區",nameJp:"天神・大名",desc:"福岡最時尚的購物街・街頭時尚文化發源地",tags:["🛍️ 購物","免費逛街"],spots:["天神地下街 — 地下購物天堂，連結多棟百貨","大名小路 — 獨立設計師品牌聚集地"],color:"#DC2626"}],
  }
};

const gmSearch = (n,j)=>`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${j||n}, Fukuoka, Japan`)}`;
const gmNav    = (n,j)=>`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${j||n}, Fukuoka, Japan`)}`;
const fmtTime  = (ts) => new Date(ts).toLocaleString("zh-TW",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"});
let nextId = 200;

// ── EmojiEdit ─────────────────────────────────────────────────────
function EmojiEdit({value, onChange}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const commit = (v) => { setEditing(false); if ((v||draft).trim()) onChange((v||draft).trim()); };
  return (
    <span style={{position:"relative",display:"inline-flex",alignItems:"center",flexShrink:0}}>
      <span onClick={e=>{e.stopPropagation();setDraft(value);setEditing(true);}} title="點擊編輯"
        style={{cursor:"pointer",fontSize:"inherit",lineHeight:1,userSelect:"none"}}>{value}</span>
      {editing&&(
        <span onClick={e=>e.stopPropagation()} style={{position:"absolute",top:"calc(100% + 6px)",left:0,zIndex:300,
          background:"#fff",border:"1px solid #D0CEC9",borderRadius:10,padding:"6px 8px",
          boxShadow:"0 4px 16px rgba(0,0,0,0.12)",display:"flex",alignItems:"center",gap:6,whiteSpace:"nowrap"}}>
          <input autoFocus value={draft} onChange={e=>setDraft(e.target.value)}
            onBlur={()=>commit()} onKeyDown={e=>{if(e.key==="Enter")commit();if(e.key==="Escape"){setEditing(false);setDraft(value);}}}
            style={{width:"3em",fontSize:20,textAlign:"center",border:"none",outline:"none",background:"transparent",fontFamily:"inherit"}}/>
          <button onMouseDown={e=>{e.preventDefault();commit(draft);}}
            style={{background:"#9E9B96",border:"none",borderRadius:6,color:"#fff",fontSize:11,fontWeight:700,padding:"3px 8px",cursor:"pointer",fontFamily:"inherit"}}>✓</button>
        </span>
      )}
    </span>
  );
}

// ── Editable ──────────────────────────────────────────────────────
function Editable({value, onChange, multiline, style, placeholder}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const commit = () => { setEditing(false); if (draft.trim()!==value) onChange(draft.trim()||value); };
  const iStyle = {background:"#F4F3F0",border:"1px solid #D0CEC9",borderRadius:6,color:T.ink,fontSize:"inherit",fontFamily:"inherit",fontWeight:"inherit",letterSpacing:"inherit",width:"100%",padding:"3px 8px",outline:"none",resize:"none",lineHeight:"inherit",boxSizing:"border-box",...style};
  if (editing) return multiline
    ?<textarea autoFocus rows={2} style={iStyle} value={draft} onChange={e=>setDraft(e.target.value)} onBlur={commit} onKeyDown={e=>e.key==="Escape"&&(setDraft(value),setEditing(false))}/>
    :<input autoFocus style={iStyle} value={draft} onChange={e=>setDraft(e.target.value)} onBlur={commit} onKeyDown={e=>{if(e.key==="Enter")commit();if(e.key==="Escape"){setDraft(value);setEditing(false);}}}/>;
  return (
    <span onClick={e=>{e.stopPropagation();setDraft(value);setEditing(true);}} title="點擊編輯"
      style={{cursor:"text",display:multiline?"block":"inline",whiteSpace:multiline?"pre-wrap":undefined,...style}}>
      {value||<span style={{opacity:.35}}>{placeholder}</span>}
    </span>
  );
}

// ── Modal ─────────────────────────────────────────────────────────
function Modal({onClose, title, children}) {
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(17,17,16,0.45)",backdropFilter:"blur(8px)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center",padding:16}}>
      <div onClick={e=>e.stopPropagation()} style={{background:T.surface,borderRadius:24,padding:24,width:"100%",maxWidth:480,maxHeight:"82vh",overflowY:"auto",boxShadow:"0 -2px 40px rgba(0,0,0,0.12)",border:`1px solid ${T.border}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div style={{fontSize:16,fontWeight:800,letterSpacing:"-0.4px",color:T.ink}}>{title}</div>
          <button onClick={onClose} style={{background:T.surfaceAlt,border:"none",borderRadius:20,color:T.inkMid,width:32,height:32,cursor:"pointer",fontSize:16,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────
export default function App() {
  const B = {border:"none",cursor:"pointer",fontFamily:"inherit"};

  const [tripTitle,setTripTitle]  = useState(defaultTrip.tripTitle);
  const [tripIcon, setTripIcon]   = useState(defaultTrip.tripIcon);
  const [tripSub,  setTripSub]    = useState(defaultTrip.tripSub);
  const [numDays,  setNumDays]    = useState(defaultTrip.numDays);
  const [startDate,setStartDate]  = useState(defaultTrip.startDate);
  const [days,     setDays]       = useState(defaultTrip.days);
  const [data,     setData]       = useState(defaultTrip.data);
  const [members,  setMembers]    = useState(defaultTrip.members);
  const [isPrivate,setIsPrivate]  = useState(defaultTrip.isPrivate);
  const [mood,     setMood]       = useState(defaultTrip.mood);

  const [activeDay,     setActiveDay]     = useState(1);
  const [activeTab,     setActiveTab]     = useState("itinerary");
  const [expanded,      setExpanded]      = useState(null);
  const [modal,         setModal]         = useState(null);
  const [editingHeader, setEditingHeader] = useState(false);
  const [addingTo,      setAddingTo]      = useState(null);
  const [newSpot,       setNewSpot]       = useState("");
  const [showAdd,       setShowAdd]       = useState(false);
  const [newCard,       setNewCard]       = useState({time:"",name:"",nameJp:"",desc:"",tags:"",color:CARD_COLORS[0]});
  const [aiState,       setAiState]       = useState({open:false,loading:false,text:"",target:null});

  // Sync state
  const [editorName,  setEditorName]  = useState(() => localStorage.getItem("editorName")||"");
  const [saveStatus,  setSaveStatus]  = useState("loading");
  const [lastSaved,   setLastSaved]   = useState(null);
  const [lastEditor,  setLastEditor]  = useState(null);
  const [history,     setHistory]     = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [hasUpdate,   setHasUpdate]   = useState(false);
  const [loaded,      setLoaded]      = useState(false);
  const saveTimer = useRef(null);
  const closeModal = () => setModal(null);

  // ── Load from Supabase on mount ───────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const { data: row } = await supabase
          .from("trips")
          .select("*")
          .eq("trip_id", TRIP_ID)
          .single();
        if (row) {
          const s = row.snapshot;
          setTripTitle(s.tripTitle); setTripIcon(s.tripIcon); setTripSub(s.tripSub);
          setNumDays(s.numDays); setStartDate(s.startDate); setDays(s.days);
          setData(s.data); setMembers(s.members); setIsPrivate(s.isPrivate); setMood(s.mood);
          setLastSaved(row.updated_at);
          setLastEditor(row.editor);
        }
        // Load history
        const { data: hist } = await supabase
          .from("trip_history")
          .select("*")
          .eq("trip_id", TRIP_ID)
          .order("created_at", { ascending: false })
          .limit(20);
        if (hist) setHistory(hist);
      } catch(e) { console.error("Load error:", e); }
      setSaveStatus("idle");
      setLoaded(true);
    };
    load();
  }, []);

  // ── Real-time subscription ─────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel("trip-changes")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "trips", filter: `trip_id=eq.${TRIP_ID}` },
        (payload) => {
          // Only show update banner if someone else changed it
          if (payload.new.editor !== (editorName || "匿名")) setHasUpdate(true);
        }
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [editorName]);

  // ── Auto-save (debounced 2s) ───────────────────────────────────
  useEffect(() => {
    if (!loaded) return;
    clearTimeout(saveTimer.current);
    setSaveStatus("saving");
    saveTimer.current = setTimeout(saveNow, 2000);
    return () => clearTimeout(saveTimer.current);
  }, [tripTitle,tripIcon,tripSub,numDays,startDate,days,data,members,isPrivate,mood,loaded]);

  const getSnapshot = useCallback(() => ({
    tripTitle,tripIcon,tripSub,numDays,startDate,days,data,members,isPrivate,mood,
  }),[tripTitle,tripIcon,tripSub,numDays,startDate,days,data,members,isPrivate,mood]);

  const saveNow = useCallback(async () => {
    const editor = editorName || "匿名";
    const snapshot = {tripTitle,tripIcon,tripSub,numDays,startDate,days,data,members,isPrivate,mood};
    try {
      await supabase.from("trips").upsert({ trip_id: TRIP_ID, snapshot, editor, updated_at: new Date().toISOString() });
      await supabase.from("trip_history").insert({ trip_id: TRIP_ID, snapshot, editor, label: tripTitle });
      setLastSaved(new Date().toISOString());
      setLastEditor(editor);
      setSaveStatus("saved");
      // Reload history
      const { data: hist } = await supabase.from("trip_history").select("*").eq("trip_id", TRIP_ID).order("created_at", { ascending: false }).limit(20);
      if (hist) setHistory(hist);
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch(e) { setSaveStatus("error"); console.error("Save error:", e); }
  }, [tripTitle,tripIcon,tripSub,numDays,startDate,days,data,members,isPrivate,mood,editorName]);

  const pullLatest = async () => {
    const { data: row } = await supabase.from("trips").select("*").eq("trip_id", TRIP_ID).single();
    if (row) {
      const s = row.snapshot;
      setTripTitle(s.tripTitle); setTripIcon(s.tripIcon); setTripSub(s.tripSub);
      setNumDays(s.numDays); setStartDate(s.startDate); setDays(s.days);
      setData(s.data); setMembers(s.members); setIsPrivate(s.isPrivate); setMood(s.mood);
      setLastSaved(row.updated_at); setLastEditor(row.editor);
    }
    setHasUpdate(false);
  };

  const loadFromHistory = async (entry) => {
    const s = entry.snapshot;
    setTripTitle(s.tripTitle); setTripIcon(s.tripIcon); setTripSub(s.tripSub);
    setNumDays(s.numDays); setStartDate(s.startDate); setDays(s.days);
    setData(s.data); setMembers(s.members); setIsPrivate(s.isPrivate); setMood(s.mood);
    setShowHistory(false);
  };

  // ── Data mutators ──────────────────────────────────────────────
  const acts = data[activeDay]||[];
  const updSpot = (d,id,f,v) => setData(p=>({...p,[d]:p[d].map(s=>s.id===id?{...s,[f]:v}:s)}));
  const updItem = (d,id,i,v) => setData(p=>({...p,[d]:p[d].map(s=>{if(s.id!==id)return s;const sp=[...s.spots];v===null?sp.splice(i,1):(sp[i]=v);return{...s,spots:sp};})}));
  const addItem = (d,id) => { if(!newSpot.trim())return; setData(p=>({...p,[d]:p[d].map(s=>s.id===id?{...s,spots:[...s.spots,newSpot.trim()]}:s)})); setNewSpot("");setAddingTo(null); };
  const delCard = (d,id) => { setData(p=>({...p,[d]:p[d].filter(s=>s.id!==id)})); setExpanded(null); };
  const addCard = () => {
    if(!newCard.name.trim())return;
    const c={id:nextId++,time:newCard.time||"09:00",name:newCard.name,nameJp:newCard.nameJp||newCard.name,desc:newCard.desc||"",tags:newCard.tags?newCard.tags.split(",").map(t=>t.trim()).filter(Boolean):["📍 景點"],spots:[],color:newCard.color};
    setData(p=>({...p,[activeDay]:[...(p[activeDay]||[]),c]}));
    setNewCard({time:"",name:"",nameJp:"",desc:"",tags:"",color:CARD_COLORS[0]});setShowAdd(false);
  };
  const moveCard = (d,i,dir) => setData(p=>{const a=[...p[d]];const t=i+dir;if(t<0||t>=a.length)return p;[a[i],a[t]]=[a[t],a[i]];return{...p,[d]:a};});
  const updDayLabel = (id,l) => setDays(p=>p.map(d=>d.id===id?{...d,label:l}:d));
  const updDayEmoji = (id,e) => setDays(p=>p.map(d=>d.id===id?{...d,emoji:e}:d));
  const doReset = () => {
    const s = defaultTrip;
    setTripTitle(s.tripTitle);setTripIcon(s.tripIcon);setTripSub(s.tripSub);
    setNumDays(s.numDays);setStartDate(s.startDate);setDays(s.days);
    setData(s.data);setMembers(s.members);setIsPrivate(s.isPrivate);setMood(s.mood);
    setEditingHeader(false);closeModal();
  };

  const askAI = async (spot) => {
    setAiState({open:true,loading:true,text:"",target:spot});
    try {
      const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:`你是一個專業的日本旅遊達人，請用繁體中文為「${spot.name}（${spot.nameJp}）」提供3條實用的旅遊貼士。每條貼士用emoji開頭，簡潔有趣，不超過40字。直接輸出3條，不要標題。`}]})});
      const d=await r.json();
      setAiState(s=>({...s,loading:false,text:d.content?.map(c=>c.text||"").join("")||"暫無建議"}));
    } catch { setAiState(s=>({...s,loading:false,text:"❌ 無法取得建議，請稍後再試。"})); }
  };

  // ── Styles ────────────────────────────────────────────────────
  const chip   = (a) => ({...B,flexShrink:0,background:a?"#9E9B96":T.surface,border:`1.5px solid ${a?"#9E9B96":T.border}`,borderRadius:100,color:a?"#fff":T.inkMid,fontSize:12,fontWeight:a?700:500,padding:"7px 14px",transition:"all .15s"});
  const tabBtn = (a) => ({...B,flex:1,background:a?"#9E9B96":"transparent",borderRadius:10,color:a?"#fff":T.inkMid,fontSize:13,fontWeight:600,padding:"9px",border:`1.5px solid ${a?"#9E9B96":T.border}`});
  const iconBtn = {...B,background:T.surface,border:`1.5px solid ${T.border}`,borderRadius:12,color:T.inkMid,fontSize:17,width:44,height:44,display:"flex",alignItems:"center",justifyContent:"center"};
  const mapsA  = (color) => ({display:"inline-flex",alignItems:"center",gap:5,background:`${color}12`,border:`1.5px solid ${color}44`,borderRadius:8,color,fontSize:12,fontWeight:700,padding:"7px 12px",textDecoration:"none"});
  const inp    = {width:"100%",marginBottom:8,background:T.surfaceAlt,border:`1px solid ${T.border}`,borderRadius:8,color:T.ink,fontSize:13,padding:"9px 11px",outline:"none",fontFamily:"inherit",boxSizing:"border-box"};
  const actBtn = (bg="#9E9B96") => ({...B,width:"100%",background:bg,borderRadius:12,color:"#fff",fontSize:14,fontWeight:700,padding:"13px",marginTop:8});
  const curDay = days.find(d=>d.id===activeDay);

  if (saveStatus==="loading") return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Noto Sans TC',sans-serif"}}>
      <div style={{textAlign:"center"}}>
        <div style={{width:40,height:40,border:`3px solid ${T.border}`,borderTopColor:T.accent,borderRadius:"50%",margin:"0 auto 16px",animation:"spin .8s linear infinite"}}/>
        <div style={{color:T.inkMid,fontSize:14}}>載入行程中…</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:"'Noto Sans TC','PingFang TC','Helvetica Neue',sans-serif",color:T.ink,overflowX:"hidden",maxWidth:600,margin:"0 auto"}}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.6}}
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-thumb{background:${T.borderMid};border-radius:4px}
        input::placeholder,textarea::placeholder{color:${T.inkLight}}
        button:active{opacity:.75}
      `}</style>

      {/* ── Update banner ── */}
      {hasUpdate&&(
        <div style={{background:"#FEF3C7",borderBottom:"1px solid #F59E0B",padding:"10px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100}}>
          <span style={{fontSize:13,color:"#92400E",fontWeight:600}}>🔄 旅伴剛更新了行程！</span>
          <button onClick={pullLatest} style={{...B,background:"#F59E0B",borderRadius:100,color:"#fff",fontSize:12,fontWeight:700,padding:"5px 14px"}}>載入最新版本</button>
        </div>
      )}

      {/* ── Header ── */}
      <div style={{background:T.surface,borderBottom:`1px solid ${T.border}`,padding:"14px 20px 12px",position:"sticky",top:hasUpdate?46:0,zIndex:50}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:3}}>
          <div style={{display:"flex",alignItems:"center",gap:8,flex:1,minWidth:0}}
            onContextMenu={e=>{e.preventDefault();setEditingHeader(true);}}
            onTouchStart={e=>{const t=setTimeout(()=>setEditingHeader(true),600);e.currentTarget._lp=t;}}
            onTouchEnd={e=>{clearTimeout(e.currentTarget._lp);}}
            onTouchMove={e=>{clearTimeout(e.currentTarget._lp);}}
            onMouseDown={e=>{const t=setTimeout(()=>setEditingHeader(true),600);e.currentTarget._lp=t;}}
            onMouseUp={e=>{clearTimeout(e.currentTarget._lp);}}
          >
            <span style={{fontSize:18,flexShrink:0}}>
              {editingHeader?<EmojiEdit value={tripIcon} onChange={setTripIcon}/>:<span>{tripIcon}</span>}
            </span>
            <span style={{fontSize:18,fontWeight:800,letterSpacing:"-0.6px",minWidth:0,overflow:"hidden",flex:1}}>
              {editingHeader
                ?<Editable value={tripTitle} onChange={setTripTitle} style={{fontSize:18,fontWeight:800,letterSpacing:"-0.6px",color:T.ink}} placeholder="旅遊標題"/>
                :<span style={{display:"block",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{tripTitle}</span>
              }
            </span>
            {editingHeader&&<button onClick={()=>setEditingHeader(false)} style={{...B,flexShrink:0,background:"#DC2626",border:"none",borderRadius:100,color:"#fff",fontSize:11,fontWeight:700,padding:"5px 12px",whiteSpace:"nowrap",marginLeft:6,boxShadow:"0 2px 8px rgba(220,38,38,0.35)"}}>✓ 編輯完成</button>}
          </div>
          {!editingHeader&&(
            <div style={{display:"flex",gap:5,flexShrink:0,marginLeft:8,alignItems:"center"}}>
              {/* Save status */}
              <span style={{fontSize:10,color:saveStatus==="saving"?T.inkLight:saveStatus==="saved"?T.green:saveStatus==="error"?"#DC2626":T.inkLight,whiteSpace:"nowrap"}}>
                {saveStatus==="saving"?"⏳ 儲存中…":saveStatus==="saved"?"✓ 已儲存":saveStatus==="error"?"✗ 失敗":lastEditor?`✓ ${lastEditor}`:""}
              </span>
              <button onClick={()=>setModal("members")} style={{...B,background:T.surfaceAlt,border:`1.5px solid ${T.border}`,borderRadius:100,color:T.inkMid,fontSize:11,fontWeight:600,padding:"4px 10px",whiteSpace:"nowrap"}}>👥 {members}名</button>
            </div>
          )}
        </div>

        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:editingHeader?6:10}}>
          <div style={{fontSize:11,color:T.inkLight}}>
            {editingHeader?<Editable value={tripSub} onChange={setTripSub} style={{fontSize:11,color:T.inkLight}} placeholder="行程說明"/>:<span>{tripSub}</span>}
          </div>
          {lastSaved&&!editingHeader&&<span style={{fontSize:10,color:T.inkLight,flexShrink:0,marginLeft:8}}>{fmtTime(lastSaved)}</span>}
        </div>
        {editingHeader&&<div style={{fontSize:10,color:T.inkLight,marginBottom:10,fontStyle:"italic"}}>長按天數按鈕可編輯名稱及 emoji</div>}

        {/* Day tabs */}
        <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:4}}>
          {days.map(d=>(
            <button key={d.id} onClick={()=>{if(!editingHeader){setActiveDay(d.id);setExpanded(null);}}} style={{...chip(activeDay===d.id),display:"flex",alignItems:"center",gap:5}}>
              {editingHeader?<span onClick={e=>e.stopPropagation()}><EmojiEdit value={d.emoji} onChange={v=>updDayEmoji(d.id,v)}/></span>:<span style={{fontSize:13}}>{d.emoji}</span>}
              <div style={{textAlign:"left"}} onClick={e=>{if(editingHeader)e.stopPropagation();}}>
                {startDate?(
                  <><div style={{fontSize:12,fontWeight:activeDay===d.id?700:600,color:activeDay===d.id?"#fff":T.ink}}>{d.label}</div><div style={{fontSize:9,color:activeDay===d.id?"rgba(255,255,255,0.75)":T.inkLight}}>週{d.sub}</div></>
                ):editingHeader?(
                  <><Editable value={d.label} onChange={v=>updDayLabel(d.id,v)} style={{fontSize:12,fontWeight:activeDay===d.id?700:500,color:activeDay===d.id?"#fff":T.inkMid}} placeholder="第N天"/><div style={{fontSize:9,opacity:.6}}>{d.sub}</div></>
                ):(
                  <><div style={{fontSize:12,fontWeight:activeDay===d.id?700:500,color:activeDay===d.id?"#fff":T.inkMid}}>{d.label}</div><div style={{fontSize:9,opacity:.6}}>{d.sub}</div></>
                )}
              </div>
            </button>
          ))}
        </div>

        <div style={{display:"flex",gap:8,marginTop:10}}>
          {[["itinerary","📋 行程"],["map","🗺️ 地圖"]].map(([k,l])=>(<button key={k} onClick={()=>setActiveTab(k)} style={tabBtn(activeTab===k)}>{l}</button>))}
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{padding:"20px 16px 130px"}}>
        {activeTab==="map"?(
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:20,overflow:"hidden"}}>
            <div style={{padding:"16px 18px 10px",fontSize:14,fontWeight:800,borderBottom:`1px solid ${T.border}`}}>📍 {curDay?.label} — Google Maps</div>
            {acts.length===0&&<div style={{textAlign:"center",color:T.inkLight,padding:36,fontSize:13}}>此天尚無景點</div>}
            {acts.map((spot,i)=>(
              <div key={spot.id} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 18px",borderBottom:`1px solid ${T.border}`}}>
                <div style={{width:32,height:32,borderRadius:"50%",background:spot.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,flexShrink:0,color:"#fff"}}>{i+1}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:700,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{spot.name}</div>
                  <div style={{fontSize:11,color:T.inkLight}}>{spot.nameJp} · {spot.time}</div>
                </div>
                <div style={{display:"flex",gap:6,flexShrink:0}}>
                  <a href={gmNav(spot.name,spot.nameJp)} target="_blank" rel="noopener noreferrer" style={mapsA(spot.color)}>🧭 導航</a>
                  <a href={gmSearch(spot.name,spot.nameJp)} target="_blank" rel="noopener noreferrer" style={mapsA(T.inkLight)}>🗺️ 查看</a>
                </div>
              </div>
            ))}
            {acts.length>0&&(
              <div style={{padding:"12px 18px"}}>
                <a href={`https://www.google.com/maps/dir/${acts.map(s=>encodeURIComponent(`${s.nameJp}, Fukuoka`)).join("/")}`} target="_blank" rel="noopener noreferrer"
                  style={{...mapsA(T.accent),display:"flex",justifyContent:"center",width:"100%",borderRadius:12,padding:"12px",fontSize:13}}>
                  🗺️ 開啟 {curDay?.label} 完整路線
                </a>
              </div>
            )}
          </div>
        ):(
          <>
            {acts.map((spot,idx)=>{
              const isExp=expanded===spot.id;
              return (
                <div key={spot.id} style={{position:"relative"}}>
                  {idx<acts.length-1&&<div style={{position:"absolute",left:23,top:"calc(100% - 8px)",width:1,height:24,background:T.border,zIndex:1}}/>}
                  <div onClick={()=>setExpanded(isExp?null:spot.id)} style={{background:T.surface,border:`1px solid ${T.border}`,borderLeft:`3px solid ${spot.color}`,borderRadius:16,padding:"14px 16px",marginBottom:10,cursor:"pointer",transition:"box-shadow .15s,transform .15s",boxShadow:isExp?"0 4px 24px rgba(0,0,0,0.08)":"0 1px 4px rgba(0,0,0,0.04)",transform:isExp?"scale(1.005)":"scale(1)"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                      <div style={{flex:1}} onClick={e=>e.stopPropagation()}>
                        <div style={{fontSize:11,color:spot.color,fontWeight:700,letterSpacing:"0.06em",marginBottom:3,textTransform:"uppercase"}}>
                          <Editable value={spot.time} onChange={v=>updSpot(activeDay,spot.id,"time",v)} style={{fontSize:11,color:spot.color,fontWeight:700}} placeholder="00:00"/>
                        </div>
                        <div style={{fontSize:17,fontWeight:800,letterSpacing:"-0.5px",marginBottom:2}}>
                          <Editable value={spot.name} onChange={v=>updSpot(activeDay,spot.id,"name",v)} style={{fontSize:17,fontWeight:800,color:T.ink}} placeholder="景點名稱"/>
                        </div>
                        <div style={{fontSize:11,color:T.inkLight,marginBottom:7}}>
                          <Editable value={spot.nameJp} onChange={v=>updSpot(activeDay,spot.id,"nameJp",v)} style={{fontSize:11,color:T.inkLight}} placeholder="日文名稱"/>
                        </div>
                        <div style={{fontSize:12,color:T.inkMid,lineHeight:1.55}}>
                          <Editable value={spot.desc} onChange={v=>updSpot(activeDay,spot.id,"desc",v)} multiline style={{fontSize:12,color:T.inkMid}} placeholder="景點描述..."/>
                        </div>
                      </div>
                      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6,flexShrink:0,marginLeft:12}} onClick={e=>e.stopPropagation()}>
                        <span style={{background:T.surfaceAlt,borderRadius:100,padding:"2px 9px",fontSize:10,fontWeight:600,color:T.inkLight}}>{idx+1}</span>
                        <button onClick={()=>delCard(activeDay,spot.id)} style={{...B,background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:8,color:"#DC2626",fontSize:10,fontWeight:600,padding:"3px 8px"}}>🗑️ 刪除</button>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:5,marginTop:10,flexWrap:"wrap"}} onClick={e=>e.stopPropagation()}>
                      {spot.tags.map((t,ti)=>(
                        <span key={ti} style={{background:T.surfaceAlt,borderRadius:100,padding:"3px 10px",fontSize:10,fontWeight:600,color:T.inkMid,border:`1px solid ${T.border}`,display:"inline-flex",alignItems:"center",gap:4}}>
                          <Editable value={t} onChange={v=>{const tags=[...spot.tags];tags[ti]=v;updSpot(activeDay,spot.id,"tags",tags);}} style={{fontSize:10,color:T.inkMid}} placeholder="標籤"/>
                          <span onClick={()=>updSpot(activeDay,spot.id,"tags",spot.tags.filter((_,i)=>i!==ti))} style={{cursor:"pointer",opacity:.4,fontSize:10}}>×</span>
                        </span>
                      ))}
                      <button onClick={()=>updSpot(activeDay,spot.id,"tags",[...spot.tags,"新標籤"])} style={{...B,background:"transparent",border:`1px dashed ${T.borderMid}`,borderRadius:100,color:T.inkLight,fontSize:10,padding:"3px 10px"}}>+ 標籤</button>
                    </div>
                    {isExp&&(
                      <div style={{marginTop:16}} onClick={e=>e.stopPropagation()}>
                        <div style={{height:1,background:T.border,marginBottom:14}}/>
                        <div style={{marginBottom:14}}>
                          <div style={{fontSize:10,color:T.inkLight,fontWeight:700,letterSpacing:"0.08em",marginBottom:8,textTransform:"uppercase"}}>Google Maps</div>
                          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                            <a href={gmNav(spot.name,spot.nameJp)} target="_blank" rel="noopener noreferrer" style={{...mapsA(spot.color),flexGrow:1,justifyContent:"center",padding:"10px 14px",fontSize:13,borderRadius:10}}>🧭 導航前往</a>
                            <a href={gmSearch(spot.name,spot.nameJp)} target="_blank" rel="noopener noreferrer" style={{...mapsA(T.inkMid),flexGrow:1,justifyContent:"center",padding:"10px 14px",fontSize:13,borderRadius:10,background:T.surfaceAlt,border:`1.5px solid ${T.border}`}}>📍 在地圖查看</a>
                          </div>
                        </div>
                        <div style={{fontSize:10,color:T.inkLight,fontWeight:700,letterSpacing:"0.08em",marginBottom:8,textTransform:"uppercase"}}>推薦地點</div>
                        {spot.spots.map((sp,si)=>(
                          <div key={si} style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom:6,paddingLeft:12,borderLeft:`2px solid ${spot.color}33`}}>
                            <span style={{fontSize:12,color:T.inkMid,flex:1,lineHeight:1.6}}>· <Editable value={sp} onChange={v=>updItem(activeDay,spot.id,si,v)} style={{fontSize:12,color:T.inkMid}} placeholder="地點描述..."/></span>
                            <button onClick={()=>updItem(activeDay,spot.id,si,null)} style={{...B,background:"none",color:T.inkLight,fontSize:14,padding:0,lineHeight:1,flexShrink:0}}>×</button>
                          </div>
                        ))}
                        {addingTo===spot.id?(
                          <div style={{display:"flex",gap:6,marginTop:6}}>
                            <input autoFocus value={newSpot} onChange={e=>setNewSpot(e.target.value)} placeholder="輸入推薦地點..." onKeyDown={e=>{if(e.key==="Enter")addItem(activeDay,spot.id);if(e.key==="Escape"){setAddingTo(null);setNewSpot("");}}} style={{...inp,marginBottom:0,flex:1}}/>
                            <button onClick={()=>addItem(activeDay,spot.id)} style={{...B,background:spot.color,borderRadius:8,color:"#fff",fontSize:12,fontWeight:600,padding:"0 12px"}}>加入</button>
                            <button onClick={()=>{setAddingTo(null);setNewSpot("");}} style={{...B,background:T.surfaceAlt,borderRadius:8,color:T.inkMid,fontSize:12,padding:"0 10px"}}>取消</button>
                          </div>
                        ):(
                          <button onClick={()=>setAddingTo(spot.id)} style={{...B,width:"100%",marginTop:6,background:"transparent",border:`1px dashed ${T.borderMid}`,borderRadius:8,color:T.inkLight,fontSize:11,padding:"6px 12px"}}>＋ 加入推薦地點</button>
                        )}
                        <button onClick={()=>askAI(spot)} style={{...B,marginTop:14,width:"100%",background:T.surfaceAlt,border:`1.5px solid ${T.border}`,borderRadius:10,color:T.inkMid,fontSize:12,fontWeight:700,padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                          <span style={{color:spot.color}}>✦</span> AI旅遊達人 — 取得專屬貼士
                        </button>
                      </div>
                    )}
                  </div>
                  {idx<acts.length-1&&<div style={{textAlign:"center",marginBottom:8,marginTop:-4,fontSize:10,color:T.borderMid}}>↓</div>}
                </div>
              );
            })}
            {showAdd?(
              <div style={{background:T.surface,border:`1.5px dashed ${T.borderMid}`,borderRadius:16,padding:18,marginBottom:12}}>
                <div style={{fontSize:13,fontWeight:800,marginBottom:14,color:T.ink}}>＋ 新增景點</div>
                {[["time","時間（例：10:00）"],["name","景點名稱（中文）*"],["nameJp","景點名稱（日文）"],["tags","標籤（逗號分隔）"]].map(([f,ph])=>(<input key={f} placeholder={ph} value={newCard[f]} onChange={e=>setNewCard(p=>({...p,[f]:e.target.value}))} style={inp}/>))}
                <textarea rows={2} placeholder="景點描述" value={newCard.desc} onChange={e=>setNewCard(p=>({...p,desc:e.target.value}))} style={{...inp,resize:"none"}}/>
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:10,color:T.inkLight,fontWeight:700,letterSpacing:"0.06em",marginBottom:7,textTransform:"uppercase"}}>顏色標記</div>
                  <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>{CARD_COLORS.map(c=><div key={c} onClick={()=>setNewCard(p=>({...p,color:c}))} style={{width:24,height:24,borderRadius:"50%",background:c,cursor:"pointer",border:newCard.color===c?`3px solid ${T.ink}`:"2px solid transparent"}}/>)}</div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={addCard} style={{...B,flex:1,background:"#9E9B96",borderRadius:10,color:"#fff",fontSize:13,fontWeight:700,padding:"11px"}}>加入行程</button>
                  <button onClick={()=>setShowAdd(false)} style={{...B,background:T.surfaceAlt,borderRadius:10,color:T.inkMid,fontSize:13,padding:"11px 16px"}}>取消</button>
                </div>
              </div>
            ):(
              <button onClick={()=>setShowAdd(true)} style={{...B,width:"100%",background:T.surface,border:`1.5px solid ${T.borderMid}`,borderRadius:14,color:T.inkMid,fontSize:13,fontWeight:700,padding:"14px",marginBottom:12,boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>＋ 加入新景點</button>
            )}
            <div style={{textAlign:"center",fontSize:10,color:T.inkMid,padding:"4px 0"}}>💡 點擊任何文字即可直接編輯 · 展開卡片後可一鍵開啟 Google Maps</div>
          </>
        )}
      </div>

      {/* ── Bottom nav ── */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:600,background:"rgba(232,229,223,0.97)",backdropFilter:"blur(16px)",borderTop:`1px solid ${T.border}`,padding:"10px 24px",display:"flex",justifyContent:"space-around",alignItems:"center"}}>
        <button onClick={()=>setActiveDay(d=>Math.max(1,d-1))} style={iconBtn}>←</button>
        <button onClick={()=>setActiveDay(d=>Math.min(days.length,d+1))} style={iconBtn}>→</button>
        <button onClick={()=>setShowAdd(true)} style={{...B,background:"#9E9B96",borderRadius:24,color:"#fff",fontSize:22,width:54,height:54,boxShadow:"0 4px 18px rgba(17,17,16,0.18)",display:"flex",alignItems:"center",justifyContent:"center"}}>＋</button>
        <button onClick={()=>setModal("mood")} style={{...iconBtn,fontSize:22}}>{mood}</button>
        <button onClick={()=>setModal("more")} style={iconBtn}>···</button>
      </div>

      {/* ── FABs ── */}
      <div style={{position:"fixed",bottom:82,right:"max(16px, calc(50vw - 284px))",zIndex:40,display:"flex",flexDirection:"column",gap:8,alignItems:"flex-end"}}>
        <button onClick={()=>setShowHistory(true)} style={{...B,background:T.surface,border:`1.5px solid ${T.border}`,borderRadius:100,color:T.inkMid,fontSize:12,fontWeight:700,padding:"9px 16px",boxShadow:"0 2px 12px rgba(0,0,0,0.1)"}}>🕐 歷史紀錄</button>
        <button onClick={()=>setModal("reorder")} style={{...B,background:"#9E9B96",borderRadius:100,color:"#fff",fontSize:12,fontWeight:700,padding:"10px 18px",boxShadow:"0 4px 16px rgba(17,17,16,0.15)"}}>✏ 調整行程順序</button>
      </div>

      {/* ── History panel ── */}
      {showHistory&&(
        <div onClick={()=>setShowHistory(false)} style={{position:"fixed",inset:0,background:"rgba(17,17,16,0.45)",backdropFilter:"blur(8px)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center",padding:16}}>
          <div onClick={e=>e.stopPropagation()} style={{background:T.surface,borderRadius:24,padding:24,width:"100%",maxWidth:480,maxHeight:"75vh",overflowY:"auto",boxShadow:"0 -2px 40px rgba(0,0,0,0.12)",border:`1px solid ${T.border}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={{fontSize:16,fontWeight:800,color:T.ink}}>🕐 歷史紀錄</div>
              <button onClick={()=>setShowHistory(false)} style={{background:T.surfaceAlt,border:"none",borderRadius:20,color:T.inkMid,width:32,height:32,cursor:"pointer",fontSize:16,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
            </div>
            <p style={{fontSize:12,color:T.inkMid,marginBottom:16}}>點擊任何版本可還原到該狀態。最多保留 20 筆。</p>
            {history.length===0&&<div style={{textAlign:"center",color:T.inkLight,padding:24,fontSize:13}}>尚無歷史紀錄</div>}
            {history.map((entry,i)=>(
              <div key={entry.id} onClick={()=>loadFromHistory(entry)}
                style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:i===0?T.surfaceAlt:T.surface,border:`1px solid ${T.border}`,borderRadius:12,marginBottom:8,cursor:"pointer"}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:T.ink}}>{entry.label}</div>
                  <div style={{fontSize:11,color:T.inkLight,marginTop:2}}>
                    {entry.editor&&<span style={{color:T.inkMid,fontWeight:600}}>{entry.editor} · </span>}
                    {fmtTime(entry.created_at)}
                    {i===0&&<span style={{marginLeft:6,background:"#D1FAE5",color:"#065F46",borderRadius:100,padding:"1px 7px",fontSize:10,fontWeight:700}}>最新</span>}
                  </div>
                </div>
                <span style={{fontSize:12,color:T.inkLight}}>還原 →</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {modal==="members"&&(
        <Modal onClose={closeModal} title="👥 旅遊人數">
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:28,padding:"20px 0"}}>
            <button onClick={()=>setMembers(m=>Math.max(1,m-1))} style={{...B,width:48,height:48,borderRadius:"50%",background:T.surfaceAlt,border:`1.5px solid ${T.border}`,color:T.ink,fontSize:22}}>−</button>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:52,fontWeight:900,letterSpacing:"-3px",color:T.ink,lineHeight:1}}>{members}</div>
              <div style={{fontSize:12,color:T.inkMid,marginTop:4}}>人</div>
            </div>
            <button onClick={()=>setMembers(m=>Math.min(20,m+1))} style={{...B,width:48,height:48,borderRadius:"50%",background:"#9E9B96",border:"none",color:"#fff",fontSize:22}}>＋</button>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:16}}>{[1,2,3,4,5,6,8,10].map(n=>(<button key={n} onClick={()=>setMembers(n)} style={{...B,background:members===n?"#9E9B96":T.surfaceAlt,border:`1.5px solid ${members===n?"#9E9B96":T.border}`,borderRadius:100,color:members===n?"#fff":T.inkMid,fontSize:13,fontWeight:600,padding:"6px 16px"}}>{n}人</button>))}</div>
          <button onClick={closeModal} style={actBtn()}>確認</button>
        </Modal>
      )}

      {modal==="reset"&&(
        <Modal onClose={closeModal} title="↺ 重設行程">
          <div style={{textAlign:"center",padding:"12px 0 24px"}}>
            <div style={{fontSize:44,marginBottom:12}}>⚠️</div>
            <div style={{fontSize:15,fontWeight:700,marginBottom:8}}>確定要重設所有行程？</div>
            <div style={{fontSize:13,color:T.inkMid,lineHeight:1.6}}>所有已編輯的內容將會恢復到初始狀態。</div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={closeModal} style={{...B,flex:1,background:T.surfaceAlt,borderRadius:12,color:T.inkMid,fontSize:14,fontWeight:600,padding:"12px"}}>取消</button>
            <button onClick={doReset} style={{...B,flex:1,background:"#DC2626",borderRadius:12,color:"#fff",fontSize:14,fontWeight:700,padding:"12px"}}>確定重設</button>
          </div>
        </Modal>
      )}

      {modal==="reorder"&&(
        <Modal onClose={closeModal} title={`✏ 調整 ${curDay?.label} 行程順序`}>
          {acts.map((spot,idx)=>(
            <div key={spot.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:T.surfaceAlt,borderLeft:`3px solid ${spot.color}`,borderRadius:12,marginBottom:8}}>
              <div style={{width:26,height:26,borderRadius:"50%",background:spot.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#fff",flexShrink:0}}>{idx+1}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:700,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{spot.name}</div>
                <div style={{fontSize:11,color:T.inkLight}}>{spot.time}</div>
              </div>
              <div style={{display:"flex",gap:4}}>
                <button onClick={()=>moveCard(activeDay,idx,-1)} disabled={idx===0} style={{...B,width:30,height:30,borderRadius:8,background:idx===0?T.border:"#9E9B96",color:idx===0?T.inkLight:"#fff",fontSize:13}}>↑</button>
                <button onClick={()=>moveCard(activeDay,idx,1)} disabled={idx===acts.length-1} style={{...B,width:30,height:30,borderRadius:8,background:idx===acts.length-1?T.border:"#9E9B96",color:idx===acts.length-1?T.inkLight:"#fff",fontSize:13}}>↓</button>
              </div>
            </div>
          ))}
          <button onClick={closeModal} style={actBtn()}>完成</button>
        </Modal>
      )}

      {modal==="mood"&&(
        <Modal onClose={closeModal} title="選擇心情">
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,marginBottom:14}}>
            {MOODS.map(m=>(<button key={m} onClick={()=>{setMood(m);closeModal();}} style={{...B,fontSize:28,padding:"10px",borderRadius:12,background:mood===m?T.surfaceAlt:T.surface,border:`1.5px solid ${mood===m?"#9E9B96":T.border}`}}>{m}</button>))}
          </div>
          <div style={{textAlign:"center",fontSize:12,color:T.inkMid}}>目前心情：{mood}</div>
        </Modal>
      )}

      {modal==="more"&&(
        <Modal onClose={closeModal} title="⋯ 更多選項">
          <div style={{marginBottom:20}}>
            <div style={{fontSize:10,color:T.inkLight,fontWeight:700,letterSpacing:"0.08em",marginBottom:8,textTransform:"uppercase"}}>你的名字（顯示在儲存紀錄）</div>
            <div style={{display:"flex",gap:8}}>
              <input value={editorName} onChange={e=>{setEditorName(e.target.value);localStorage.setItem("editorName",e.target.value);}} placeholder="輸入名字…" style={{...inp,marginBottom:0,flex:1}}/>
              <button onClick={()=>{saveNow();closeModal();}} style={{...B,background:"#9E9B96",borderRadius:8,color:"#fff",fontSize:12,fontWeight:700,padding:"0 14px",flexShrink:0}}>立即儲存</button>
            </div>
          </div>
          <div style={{marginBottom:20}}>
            <div style={{fontSize:10,color:T.inkLight,fontWeight:700,letterSpacing:"0.08em",marginBottom:12,textTransform:"uppercase"}}>行程日期設定</div>
            <div style={{marginBottom:10}}>
              <div style={{fontSize:12,color:T.inkMid,fontWeight:600,marginBottom:6}}>出發日期</div>
              <input type="date" value={startDate} onChange={e=>{const sd=e.target.value;setStartDate(sd);setDays(mkDays(numDays,sd));}} style={{...inp,marginBottom:0,cursor:"pointer"}}/>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <button onClick={()=>{if(numDays>1){const n=numDays-1;setNumDays(n);setDays(mkDays(n,startDate));if(activeDay>n)setActiveDay(n);}}} style={{...B,width:36,height:36,borderRadius:8,background:T.surfaceAlt,border:`1px solid ${T.border}`,color:T.ink,fontSize:18}}>−</button>
              <div style={{flex:1,textAlign:"center"}}>
                <span style={{fontSize:20,fontWeight:800}}>{numDays}</span><span style={{fontSize:12,color:T.inkMid,marginLeft:4}}>天</span>
                {startDate&&(()=>{const end=new Date(startDate);end.setDate(end.getDate()+numDays-1);return<div style={{fontSize:11,color:T.inkLight,marginTop:2}}>{startDate.replace(/-/g,"/")} — {`${end.getFullYear()}/${end.getMonth()+1}/${end.getDate()}`}</div>;})()}
              </div>
              <button onClick={()=>{if(numDays<14){const n=numDays+1;setNumDays(n);setDays(mkDays(n,startDate));}}} style={{...B,width:36,height:36,borderRadius:8,background:"#9E9B96",border:"none",color:"#fff",fontSize:18}}>＋</button>
            </div>
          </div>
          {[
            ["🗺️ 在 Google Maps 開啟今日完整路線",()=>{window.open(`https://www.google.com/maps/dir/${(data[activeDay]||[]).map(s=>encodeURIComponent(`${s.nameJp}, Fukuoka`)).join("/")}`, "_blank");closeModal();}],
            ["🕐 查看歷史紀錄",()=>{closeModal();setShowHistory(true);}],
          ].map(([label,action])=>(<button key={label} onClick={action} style={{...B,width:"100%",background:T.surfaceAlt,border:`1px solid ${T.border}`,borderRadius:12,color:T.inkMid,fontSize:13,fontWeight:500,padding:"12px 14px",textAlign:"left",marginBottom:7}}>{label}</button>))}
          <button onClick={()=>setModal("reset")} style={{...B,width:"100%",background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:12,color:"#DC2626",fontSize:13,fontWeight:600,padding:"12px 14px",textAlign:"left",marginBottom:7}}>↺ 重設所有行程</button>
          <div style={{marginTop:8,padding:"13px 14px",background:T.surfaceAlt,borderRadius:12,border:`1px solid ${T.border}`}}>
            <div style={{fontSize:12,color:T.inkMid,lineHeight:1.8}}>
              <div>{tripIcon} <strong style={{color:T.ink}}>{tripTitle}</strong></div>
              <div>👥 {members}名旅客 · {mood}</div>
              <div>📅 共 {numDays} 天 · {Object.values(data).flat().length} 個景點</div>
              {lastSaved&&<div style={{color:T.inkLight,marginTop:4}}>最後儲存：{lastEditor&&`${lastEditor} · `}{fmtTime(lastSaved)}</div>}
            </div>
          </div>
        </Modal>
      )}

      {aiState.open&&(
        <Modal onClose={()=>setAiState(s=>({...s,open:false}))} title="✦ AI旅遊達人">
          <div style={{fontSize:12,color:T.inkLight,marginBottom:16}}>{aiState.target?.name} 專屬貼士</div>
          {aiState.loading
            ?<div style={{textAlign:"center",padding:"28px 0"}}><div style={{width:36,height:36,border:`2px solid ${T.border}`,borderTopColor:aiState.target?.color||T.ink,borderRadius:"50%",margin:"0 auto 12px",animation:"spin .8s linear infinite"}}/><div style={{color:T.inkMid,fontSize:13}}>AI正在生成專屬旅遊貼士…</div></div>
            :<div style={{background:T.surfaceAlt,borderRadius:12,padding:16,fontSize:14,lineHeight:1.9,color:T.inkMid,whiteSpace:"pre-wrap",border:`1px solid ${T.border}`}}>{aiState.text}</div>
          }
        </Modal>
      )}
    </div>
  );
}
