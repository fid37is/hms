// src/components/marketing/DashboardDemo.jsx
// Stripe-style: slow, elegant screen transitions. Content populates with staggered
// fade-up animations. No cursor gimmick. Each screen dwells for ~3-4s then fades out.
// Total loop: ~20 seconds.

import { useState, useEffect } from 'react';
import Logo from '../brand/locome';

/* ─── Palette ────────────────────────────────────────────────── */
const dark    = '#0D0F14';
const darkBrd = 'rgba(255,255,255,0.08)';
const ink     = '#0D0F14';
const muted   = '#9CA3AF';
const faint   = '#D1D5DB';
const border  = '#E5E7EB';
const surface = '#F9FAFB';
const white   = '#FFFFFF';
const amber   = '#D97706';
const amberL  = '#FEF3C7';
const blue    = '#1d4ed8';
const blueL   = '#eff6ff';
const orange  = '#b45309';
const orangeL = '#fffbeb';
const green   = '#15803d';
const greenL  = '#dcfce7';
const sans    = "'DM Sans', system-ui, sans-serif";

/* ─── Stagger-in wrapper ─────────────────────────────────────── */
function In({ children, delay = 0, style = {} }) {
  return (
    <div style={{
      animation: `demoIn .55s ${delay}s cubic-bezier(.16,1,.3,1) both`,
      ...style,
    }}>
      {children}
    </div>
  );
}

/* ─── Badge ──────────────────────────────────────────────────── */
function Bdg({ label, color, bg }) {
  return (
    <span style={{
      display: 'inline-block', background: bg, color,
      fontSize: 10, fontWeight: 600, padding: '2px 9px',
      borderRadius: 100, whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}

/* ─── Stat card ──────────────────────────────────────────────── */
function Stat({ label, value, delta, accent, delay }) {
  return (
    <In delay={delay}>
      <div style={{
        background: white, border: `1px solid ${border}`,
        borderRadius: 10, padding: '14px 16px',
      }}>
        <div style={{ fontSize: 10, color: muted, marginBottom: 4, fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: ink, letterSpacing: '-.025em', lineHeight: 1 }}>{value}</div>
        {delta && <div style={{ fontSize: 10, color: accent || muted, marginTop: 5 }}>{delta}</div>}
      </div>
    </In>
  );
}

/* ══════════════════════════════════════════════════════════════
   SCREENS
══════════════════════════════════════════════════════════════ */

function ScreenDashboard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
        <Stat label="Occupancy"  value="87%"    delta="↑ 4% this week"     accent={amber} delay={0}   />
        <Stat label="In House"   value="42"     delta="6 checking out"                    delay={.06} />
        <Stat label="Arrivals"   value="11"     delta="3 rooms unassigned"                delay={.12} />
        <Stat label="Revenue"    value="₦2.4M"  delta="↑ 12% vs last week" accent={amber} delay={.18} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 10, flex: 1 }}>
        <In delay={.26}>
          <div style={{ background: white, border: `1px solid ${border}`, borderRadius: 10, padding: '14px 16px', height: '100%', boxSizing: 'border-box' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: ink, marginBottom: 10 }}>Today's Reservations</div>
            {[
              ['Emeka Okafor',  '304', 'Checked In', amber,  amberL],
              ['Ngozi Adeyemi', '201', 'Confirmed',  blue,   blueL],
              ['David Chen',    '112', 'Arriving',   orange, orangeL],
              ['Sarah Bello',   '408', 'Checked Out',muted,  surface],
            ].map(([n,r,s,c,bg], i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: i < 3 ? `1px solid ${surface}` : 'none' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: ink }}>{n}</div>
                  <div style={{ fontSize: 10, color: faint }}>Room {r}</div>
                </div>
                <Bdg label={s} color={c} bg={bg} />
              </div>
            ))}
          </div>
        </In>

        <In delay={.32}>
          <div style={{ background: white, border: `1px solid ${border}`, borderRadius: 10, padding: '14px 16px', height: '100%', boxSizing: 'border-box' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: ink, marginBottom: 12 }}>Revenue — 7 days</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 90 }}>
              {[38, 55, 44, 70, 100, 78, 60].map((h, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    width: '100%', borderRadius: '4px 4px 0 0',
                    background: i === 4 ? amber : faint,
                    height: `${h}%`,
                    animation: `demoBar .6s ${.36 + i * .05}s cubic-bezier(.16,1,.3,1) both`,
                  }} />
                  <div style={{ fontSize: 9, color: faint }}>{'MTWTFSS'[i]}</div>
                </div>
              ))}
            </div>
          </div>
        </In>
      </div>
    </div>
  );
}

function ScreenReservations() {
  const rows = [
    ['Chidi Okonkwo',   '201 — Suite',    'Mar 12','Mar 15','Confirmed', blue,   blueL],
    ['Emeka Okafor',    '304 — Deluxe',   'Mar 10','Mar 14','Checked In',amber,  amberL],
    ['Ngozi Adeyemi',   '112 — Standard', 'Mar 13','Mar 15','Arriving',  orange, orangeL],
    ['Sarah Bello',     '408 — Deluxe',   'Mar 8', 'Mar 12','Checked Out',muted, surface],
    ['Michael Eze',     '305 — Standard', 'Mar 13','Mar 16','Confirmed', blue,   blueL],
    ['Fatima Ibrahim',  '210 — Suite',    'Mar 14','Mar 18','Confirmed', blue,   blueL],
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
        {[['Total','38'],['Arriving Today','11'],['Checked In','19'],['Departing','6']].map(([l,v],i)=>(
          <In key={i} delay={i*.06}>
            <div style={{ background:white, border:`1px solid ${border}`, borderRadius:10, padding:'12px 16px', textAlign:'center' }}>
              <div style={{ fontSize:20, fontWeight:700, color:ink }}>{v}</div>
              <div style={{ fontSize:10, color:muted, marginTop:4 }}>{l}</div>
            </div>
          </In>
        ))}
      </div>
      <In delay={.28}>
        <div style={{ background:white, border:`1px solid ${border}`, borderRadius:10, overflow:'hidden', flex:1 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1.8fr 1.6fr .7fr .7fr 1.1fr', padding:'9px 16px', background:surface, borderBottom:`1px solid ${border}` }}>
            {['Guest','Room','In','Out','Status'].map(h=>(
              <div key={h} style={{ fontSize:9, fontWeight:700, color:muted, textTransform:'uppercase', letterSpacing:'.06em' }}>{h}</div>
            ))}
          </div>
          {rows.map(([n,r,ci,co,s,c,bg],i)=>(
            <div key={i} style={{
              display:'grid', gridTemplateColumns:'1.8fr 1.6fr .7fr .7fr 1.1fr',
              padding:'9px 16px', alignItems:'center',
              borderBottom: i<5 ? `1px solid ${surface}` : 'none',
              animation: `demoIn .45s ${.3+i*.05}s cubic-bezier(.16,1,.3,1) both`,
            }}>
              <div style={{ fontSize:12, fontWeight:500, color:ink }}>{n}</div>
              <div style={{ fontSize:11, color:muted }}>{r}</div>
              <div style={{ fontSize:11, color:muted }}>{ci}</div>
              <div style={{ fontSize:11, color:muted }}>{co}</div>
              <Bdg label={s} color={c} bg={bg} />
            </div>
          ))}
        </div>
      </In>
    </div>
  );
}

function ScreenCheckin() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
      <In delay={0}>
        <div style={{ background:white, border:`1px solid ${border}`, borderRadius:10, padding:'16px 18px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:ink }}>Chidi Okonkwo</div>
              <div style={{ fontSize:11, color:muted, marginTop:2 }}>RES-20260042 · Suite 201 · Mar 12 → Mar 15</div>
            </div>
            <Bdg label="Checked In" color={amber} bg={amberL} />
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {[
              { l:'Room Ready',   sub:'Suite 201 — clean & inspected',    done:true },
              { l:'ID Verified',  sub:'Passport No. NG4829031',           done:true },
              { l:'Deposit Paid', sub:'₦92,250 — Card ending 4242',       done:true },
            ].map((row,i)=>(
              <div key={i} style={{
                display:'flex', alignItems:'center', gap:12,
                padding:'10px 12px',
                background:amberL, border:`1px solid ${amber}`, borderRadius:8,
                animation:`demoIn .5s ${.1+i*.1}s cubic-bezier(.16,1,.3,1) both`,
              }}>
                <div style={{ width:20, height:20, borderRadius:'50%', background:amber, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="2,5 4,7 8,3"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize:12, fontWeight:600, color:ink }}>{row.l}</div>
                  <div style={{ fontSize:10, color:orange }}>{row.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </In>
      <In delay={.42}>
        <div style={{ background:amber, borderRadius:10, padding:'14px 18px', display:'flex', alignItems:'center', gap:12 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="20,6 9,17 4,12"/>
          </svg>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:white }}>Guest checked in successfully</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,.75)', marginTop:2 }}>Key card issued · Folio #F-2094 opened · Welcome message sent</div>
          </div>
        </div>
      </In>
    </div>
  );
}

function ScreenHousekeeping() {
  const tasks = [
    { rm:'201', task:'Post-checkout clean', who:'Amaka O.', pri:'High',   status:'In Progress', sc:orange, sbg:orangeL, hl:true },
    { rm:'304', task:'Turndown service',    who:'Tunde A.', pri:'Normal', status:'Pending',     sc:blue,   sbg:blueL   },
    { rm:'412', task:'Deep clean',          who:'Chidi E.', pri:'High',   status:'Done',        sc:amber,  sbg:amberL  },
    { rm:'115', task:'Inspection',          who:'Ngozi B.', pri:'Low',    status:'Done',        sc:amber,  sbg:amberL  },
    { rm:'308', task:'Restock minibar',     who:'Fatima I.',pri:'Normal', status:'Pending',     sc:blue,   sbg:blueL   },
  ];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10, height:'100%' }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
        {[['Total Rooms','18',ink],['In Progress','3',orange],['Pending','8',blue],['Done','7',amber]].map(([l,v,c],i)=>(
          <In key={i} delay={i*.06}>
            <div style={{ background:white, border:`1px solid ${border}`, borderRadius:10, padding:'12px 16px', textAlign:'center' }}>
              <div style={{ fontSize:20, fontWeight:700, color:c }}>{v}</div>
              <div style={{ fontSize:10, color:muted, marginTop:4 }}>{l}</div>
            </div>
          </In>
        ))}
      </div>
      <In delay={.28}>
        <div style={{ background:white, border:`1px solid ${border}`, borderRadius:10, overflow:'hidden' }}>
          <div style={{ display:'grid', gridTemplateColumns:'.5fr 1.8fr 1.3fr .6fr 1.1fr', padding:'9px 14px', background:surface, borderBottom:`1px solid ${border}` }}>
            {['Rm','Task','Staff','Pri','Status'].map(h=>(
              <div key={h} style={{ fontSize:9, fontWeight:700, color:muted, textTransform:'uppercase', letterSpacing:'.06em' }}>{h}</div>
            ))}
          </div>
          {tasks.map((t,i)=>(
            <div key={i} style={{
              display:'grid', gridTemplateColumns:'.5fr 1.8fr 1.3fr .6fr 1.1fr',
              padding:'9px 14px', alignItems:'center',
              borderBottom:i<4?`1px solid ${surface}`:'none',
              background:t.hl?amberL:'transparent',
              animation:`demoIn .45s ${.3+i*.06}s cubic-bezier(.16,1,.3,1) both`,
            }}>
              <div style={{ fontSize:12, fontWeight:700, color:ink }}>{t.rm}</div>
              <div style={{ fontSize:11, color:ink }}>{t.task}</div>
              <div style={{ fontSize:11, color:muted }}>{t.who}</div>
              <div style={{ fontSize:10, fontWeight:600, color:t.pri==='High'?orange:muted }}>{t.pri}</div>
              <Bdg label={t.status} color={t.sc} bg={t.sbg}/>
            </div>
          ))}
        </div>
      </In>
    </div>
  );
}

function ScreenBilling() {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1.25fr 1fr', gap:10, height:'100%' }}>
      <In delay={0}>
        <div style={{ background:white, border:`1px solid ${border}`, borderRadius:10, padding:'16px 18px', height:'100%', boxSizing:'border-box' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:ink }}>Folio #F-2094</div>
              <div style={{ fontSize:10, color:muted, marginTop:2 }}>Chidi Okonkwo · Suite 201</div>
            </div>
            <Bdg label="Closed — Paid" color={green} bg={greenL}/>
          </div>
          {[
            ['Suite Rate × 3','₦135,000'],
            ['Breakfast × 3', '₦18,000'],
            ['Spa Treatment',  '₦25,000'],
            ['Mini-bar',       '₦6,500'],
          ].map(([d,a],i)=>(
            <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:i<3?`1px solid ${surface}`:'none', fontSize:11 }}>
              <span style={{ color:muted }}>{d}</span>
              <span style={{ fontWeight:500, color:ink }}>{a}</span>
            </div>
          ))}
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:10, paddingTop:10, borderTop:`1.5px solid ${border}` }}>
            <span style={{ fontSize:12, fontWeight:600, color:ink }}>Total</span>
            <span style={{ fontSize:15, fontWeight:700, color:amber }}>₦184,500</span>
          </div>
          <div style={{ marginTop:8, padding:'8px 10px', background:greenL, border:`1px solid ${green}40`, borderRadius:7, display:'flex', gap:8, alignItems:'center' }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke={green} strokeWidth="2.5" strokeLinecap="round"><polyline points="3,8 6,11 13,5"/></svg>
            <span style={{ fontSize:11, color:green, fontWeight:500 }}>₦184,500 paid by card · Mar 15</span>
          </div>
        </div>
      </In>

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        <In delay={.14}>
          <div style={{ background:white, border:`1px solid ${border}`, borderRadius:10, padding:'14px 16px' }}>
            <div style={{ fontSize:11, fontWeight:600, color:ink, marginBottom:10 }}>This Month</div>
            {[['Rooms Revenue','₦3.8M'],['F&B','₦0.9M'],['Services','₦0.5M']].map(([l,v],i)=>(
              <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:i<2?`1px solid ${surface}`:'none', fontSize:11 }}>
                <span style={{ color:muted }}>{l}</span>
                <span style={{ fontWeight:600, color:ink }}>{v}</span>
              </div>
            ))}
          </div>
        </In>
        <In delay={.24}>
          <div style={{ background:dark, borderRadius:10, padding:'16px 18px' }}>
            <div style={{ fontSize:10, color:'rgba(255,255,255,.4)', marginBottom:4 }}>Total Revenue — March</div>
            <div style={{ fontSize:28, fontWeight:700, color:white, letterSpacing:'-.03em', lineHeight:1 }}>₦5.2M</div>
            <div style={{ fontSize:11, color:amber, marginTop:6, fontWeight:500 }}>↑ 22% vs February</div>
          </div>
        </In>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TABS CONFIG
══════════════════════════════════════════════════════════════ */
const TABS = [
  { id:'dashboard',    label:'Dashboard',    navItem:'Dashboard',    title:'Dashboard',              dwell:4200 },
  { id:'reservations', label:'Reservations', navItem:'Reservations', title:'Reservations',           dwell:3800 },
  { id:'checkin',      label:'Check-in',     navItem:'Reservations', title:'Check-in · Chidi Okonkwo', dwell:4000 },
  { id:'housekeeping', label:'Housekeeping', navItem:'Housekeeping', title:'Housekeeping',           dwell:3800 },
  { id:'billing',      label:'Billing',      navItem:'Billing',      title:'Billing · Folio #F-2094', dwell:4200 },
];

const NAV_ITEMS = ['Dashboard','Rooms','Reservations','Guests','Billing','Housekeeping','Inventory','Staff','Reports'];

/* ══════════════════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════════════════ */
export default function DashboardDemo() {
  const [tabIdx,   setTabIdx]   = useState(0);
  const [fading,   setFading]   = useState(false);
  const [progress, setProgress] = useState(0);

  const tab = TABS[tabIdx];

  // Auto-advance with dwell time
  useEffect(() => {
    setFading(false);
    setProgress(0);

    // Progress bar ticker
    const startTime = Date.now();
    const ticker = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setProgress(Math.min(elapsed / tab.dwell, 1));
    }, 40);

    // Fade out then switch
    const fadeTimer = setTimeout(() => setFading(true), tab.dwell - 500);
    const switchTimer = setTimeout(() => {
      setTabIdx(i => (i + 1) % TABS.length);
    }, tab.dwell);

    return () => { clearInterval(ticker); clearTimeout(fadeTimer); clearTimeout(switchTimer); };
  }, [tabIdx]);

  const activeN = tab.navItem;

  return (
    <div style={{ borderRadius:16, overflow:'hidden', border:`1px solid ${border}`,
      boxShadow:`0 2px 4px rgba(0,0,0,.04), 0 20px 60px rgba(13,15,20,.12), 0 40px 120px rgba(13,15,20,.08)`,
      fontFamily:sans, background:white }}>
      <style>{`
        @keyframes demoIn  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
        @keyframes demoBar { from{height:0} to{height:var(--h)} }
      `}</style>

      {/* Browser chrome */}
      <div style={{ height:40, background:white, borderBottom:`1px solid ${border}`,
        display:'flex', alignItems:'center', gap:6, padding:'0 14px' }}>
        {['#ff5f57','#febc2e','#28c840'].map(c=>
          <div key={c} style={{ width:10, height:10, borderRadius:'50%', background:c }}/>
        )}
        <div style={{ marginLeft:10, background:surface, border:`1px solid ${border}`, borderRadius:5,
          padding:'3px 14px', fontSize:10, color:faint, letterSpacing:'.01em' }}>
          app.cierlo.io
        </div>
        {/* Tab labels */}
        <div style={{ display:'flex', marginLeft:'auto', gap:2 }}>
          {TABS.map((t,i)=>(
            <button key={t.id} onClick={()=>setTabIdx(i)} style={{
              padding:'4px 12px', borderRadius:6, border:'none', cursor:'pointer',
              fontFamily:sans, fontSize:11,
              fontWeight: i===tabIdx ? 600 : 400,
              color: i===tabIdx ? ink : muted,
              background: i===tabIdx ? surface : 'transparent',
              transition:'all .2s',
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height:2, background:border, position:'relative' }}>
        <div style={{ position:'absolute', inset:'0 auto 0 0', background:amber, width:`${progress*100}%`, transition:'width .04s linear' }}/>
      </div>

      {/* App layout */}
      <div style={{ display:'grid', gridTemplateColumns:'156px 1fr' }}>

        {/* Sidebar */}
        <div style={{ background:dark, display:'flex', flexDirection:'column', padding:'12px 0', minHeight:520 }}>
          <div style={{ padding:'0 12px 12px', borderBottom:`1px solid ${darkBrd}`, marginBottom:6 }}>
            <Logo size="xs" noLink darkBg={false} variant="icon"/>
          </div>
          {NAV_ITEMS.map(item => {
            const active = item === activeN;
            return (
              <div key={item} style={{
                display:'flex', alignItems:'center', gap:7, padding:'8px 12px',
                fontSize:12, cursor:'default',
                color: active ? white : 'rgba(255,255,255,.3)',
                background: active ? 'rgba(255,255,255,.07)' : 'transparent',
                borderRight: active ? `2px solid ${amber}` : '2px solid transparent',
                transition:'all .5s ease',
              }}>
                <div style={{ width:3, height:3, borderRadius:'50%', background:'currentColor', flexShrink:0 }}/>
                {item}
              </div>
            );
          })}
        </div>

        {/* Main panel */}
        <div style={{ background:surface, display:'flex', flexDirection:'column', minHeight:520 }}>
          {/* Top bar */}
          <div style={{ background:white, borderBottom:`1px solid ${border}`, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 18px', height:42, flexShrink:0 }}>
            <span style={{ fontSize:13, fontWeight:600, color:ink }}>{tab.title}</span>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background:'#22c55e' }}/>
              <span style={{ fontSize:11, color:faint }}>Amara · Admin</span>
            </div>
          </div>

          {/* Content */}
          <div style={{
            flex:1, padding:'16px 18px',
            opacity: fading ? 0 : 1,
            transform: fading ? 'translateY(-6px)' : 'none',
            transition: fading ? 'opacity .4s ease, transform .4s ease' : 'none',
          }}>
            {tab.id === 'dashboard'    && <ScreenDashboard/>}
            {tab.id === 'reservations' && <ScreenReservations/>}
            {tab.id === 'checkin'      && <ScreenCheckin/>}
            {tab.id === 'housekeeping' && <ScreenHousekeeping/>}
            {tab.id === 'billing'      && <ScreenBilling/>}
          </div>
        </div>
      </div>
    </div>
  );
}