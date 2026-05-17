import { useState, useEffect, useCallback, useRef } from "react";


// ── Design system styles ──────────────────────────────────────────
function InjectStyles() {
  useEffect(() => {
    const id = "kavak-design-system";
    if (document.getElementById(id)) return;
    const s = document.createElement("style");
    s.id = id;
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&display=swap');
      :root {
        --kavak-blue: #0066FF;
        --kavak-blue-deep: #0050CC;
        --kavak-blue-ink: #003FA3;
        --kavak-blue-hint: #E6F0FF;
        --kavak-blue-edge: #B8D2FF;
        --ink: #0A0B14; --ink-2: #1B1D2A; --ink-3: #3A3D4D;
        --muted: #6B6F80; --muted-2: #9B9EAB;
        --line: #E8E9EE; --line-2: #F1F2F6;
        --bg: #FAFAFB; --paper: #FFFFFF;
        --r-xs:8px; --r-sm:12px; --r-md:16px; --r-lg:22px; --r-xl:28px;
        --font-display: "Space Grotesk", ui-sans-serif, system-ui, sans-serif;
        --font-mono: ui-monospace, "SF Mono", monospace;
      }
      .kds-topbar {
        height:64px; padding:0 40px; display:flex; align-items:center;
        justify-content:space-between; border-bottom:1px solid var(--line);
        background:var(--paper); position:sticky; top:0; z-index:20;
      }
      .kds-brandmark {
        font-family:var(--font-display); font-weight:800; font-size:20px;
        letter-spacing:-0.04em; color:var(--ink); text-decoration:none;
      }
      .kds-brand-pill {
        display:inline-flex; align-items:center; gap:8px; padding:5px 10px;
        border:1px solid var(--line); border-radius:999px; font-size:12px; color:var(--muted);
      }
      .kds-brand-pill::before {
        content:""; width:6px; height:6px; border-radius:999px;
        background:var(--kavak-blue); display:inline-block;
      }
      .kds-hero {
        flex:1; display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1.05fr);
        min-height:calc(100vh - 64px);
      }
      .kds-hero__copy {
        padding:56px 56px 48px 64px; display:flex; flex-direction:column;
        justify-content:space-between; gap:40px;
      }
      .kds-eyebrow {
        font-size:11px; font-weight:600; letter-spacing:0.18em; text-transform:uppercase;
        color:var(--kavak-blue); display:inline-flex; align-items:center; gap:10px;
      }
      .kds-eyebrow::before { content:""; width:22px; height:1px; background:var(--kavak-blue); display:inline-block; }
      .kds-headline {
        font-family:var(--font-display); font-weight:600;
        font-size:clamp(52px,5.5vw,96px); line-height:0.94;
        letter-spacing:-0.045em; color:var(--ink); margin:16px 0 0;
      }
      .kds-headline .dot { color:var(--kavak-blue); }
      .kds-subhead { margin-top:20px; font-size:17px; line-height:1.5; color:var(--ink-3); max-width:440px; }
      .kds-choices { display:grid; grid-template-columns:1.4fr 1fr; gap:14px; margin-top:auto; }
      .kds-choice {
        position:relative; padding:24px 24px 20px; border-radius:var(--r-lg);
        background:var(--paper); border:1px solid var(--line); display:flex;
        flex-direction:column; gap:16px; text-align:left; cursor:pointer;
        transition:transform .25s cubic-bezier(.2,.7,.2,1), border-color .2s, box-shadow .25s;
        color:inherit; overflow:hidden;
      }
      .kds-choice:hover { transform:translateY(-2px); border-color:var(--ink); box-shadow:0 24px 40px -28px rgba(10,11,20,.2); }
      .kds-choice--primary { background:var(--kavak-blue); border-color:var(--kavak-blue); color:#fff; }
      .kds-choice--primary:hover { background:var(--kavak-blue-deep); border-color:var(--kavak-blue-deep); }
      .kds-choice__row { display:flex; align-items:center; justify-content:space-between; gap:12px; }
      .kds-choice__tag { font-size:11px; letter-spacing:0.16em; text-transform:uppercase; font-weight:600; color:var(--muted); }
      .kds-choice--primary .kds-choice__tag { color:rgba(255,255,255,.7); }
      .kds-choice__icon { width:34px; height:34px; display:grid; place-items:center; border-radius:10px; background:var(--line-2); flex-shrink:0; }
      .kds-choice--primary .kds-choice__icon { background:rgba(255,255,255,.16); color:#fff; }
      .kds-choice__title { font-family:var(--font-display); font-size:24px; line-height:1.05; letter-spacing:-0.025em; font-weight:600; margin:0; }
      .kds-choice--secondary .kds-choice__title { font-size:20px; }
      .kds-choice__desc { font-size:13px; line-height:1.5; color:var(--muted); }
      .kds-choice--primary .kds-choice__desc { color:rgba(255,255,255,.78); }
      .kds-choice__cta { display:inline-flex; align-items:center; gap:8px; font-size:13px; font-weight:500; color:var(--kavak-blue); }
      .kds-choice--primary .kds-choice__cta { color:#fff; }
      .kds-choice__meta { display:flex; align-items:center; gap:12px; font-size:12px; color:rgba(255,255,255,.78); border-top:1px solid rgba(255,255,255,.18); padding-top:12px; margin-top:2px; }
      .kds-dot { width:6px; height:6px; border-radius:999px; background:#6EE7A8; box-shadow:0 0 0 3px rgba(110,231,168,.25); display:inline-block; }
      .kds-hero__media { position:relative; overflow:hidden; background:#0a0b14; }
      .kds-hero__img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
      .kds-hero__veil { position:absolute; inset:0; background:linear-gradient(180deg,rgba(10,11,20,0) 50%,rgba(10,11,20,.55) 100%),linear-gradient(90deg,rgba(10,11,20,.2) 0%,rgba(10,11,20,0) 30%); }
      .kds-plate { position:absolute; left:50%; bottom:8%; transform:translateX(-50%) rotate(-1.5deg); background:#0a0b14; color:#fff; font-family:var(--font-display); font-weight:800; letter-spacing:0.14em; font-size:20px; padding:10px 20px 9px; border-radius:6px; border:2px solid rgba(255,255,255,.85); }
      .kds-media-caption { position:absolute; bottom:0; left:0; right:0; padding:28px; display:flex; justify-content:space-between; align-items:flex-end; }
      .kds-media-caption__title { color:#fff; font-family:var(--font-display); font-size:22px; font-weight:600; margin:0 0 4px; letter-spacing:-0.02em; }
      .kds-media-caption__sub { color:rgba(255,255,255,.55); font-size:13px; margin:0; }
      .kds-ticker { position:absolute; top:24px; left:0; right:0; display:flex; justify-content:space-between; padding:0 28px; }
      .kds-ticker span { font-size:12px; color:rgba(255,255,255,.6); letter-spacing:0.06em; text-transform:uppercase; display:flex; align-items:center; gap:8px; }
      .kds-trust { border-top:1px solid var(--line); padding:20px 64px; display:flex; justify-content:space-between; align-items:center; font-size:12px; color:var(--muted); }
      .kds-trust__group { display:flex; align-items:center; gap:28px; }
      .kds-subscreen { flex:1; display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); min-height:calc(100vh - 64px); }
      .kds-subscreen__panel { padding:56px 64px; display:flex; flex-direction:column; gap:36px; max-width:580px; }
      .kds-back-btn { display:inline-flex; align-items:center; gap:8px; font-size:14px; color:var(--muted); background:transparent; border:0; cursor:pointer; padding:0; }
      .kds-back-btn:hover { color:var(--ink); }
      .kds-subscreen__title { font-family:var(--font-display); font-weight:600; font-size:clamp(36px,3.8vw,60px); line-height:1; letter-spacing:-0.04em; margin:0; }
      .kds-subscreen__sub { font-size:16px; line-height:1.5; color:var(--ink-3); max-width:460px; margin:0; }
      .kds-segment { display:inline-flex; padding:4px; background:var(--line-2); border-radius:999px; }
      .kds-segment__btn { appearance:none; border:0; background:transparent; padding:8px 16px; border-radius:999px; font-size:14px; font-weight:500; color:var(--muted); cursor:pointer; display:inline-flex; align-items:center; gap:8px; transition:background .2s,color .2s; }
      .kds-segment__btn.is-active { background:var(--paper); color:var(--ink); box-shadow:0 1px 2px rgba(10,11,20,.06),0 4px 12px -6px rgba(10,11,20,.12); }
      .kds-field { display:flex; flex-direction:column; gap:8px; }
      .kds-field__label { font-size:13px; font-weight:500; color:var(--ink-3); display:flex; justify-content:space-between; align-items:baseline; }
      .kds-field__label small { color:var(--muted-2); font-weight:400; }
      .kds-input-wrap { position:relative; display:flex; align-items:center; border:1px solid var(--line); background:var(--paper); border-radius:var(--r-md); transition:border-color .2s,box-shadow .2s; overflow:hidden; }
      .kds-input-wrap:focus-within { border-color:var(--kavak-blue); box-shadow:0 0 0 4px color-mix(in oklab,var(--kavak-blue) 14%,transparent); }
      .kds-input-wrap.is-error { border-color:#E5484D; box-shadow:0 0 0 4px rgba(229,72,77,.12); }
      .kds-input-wrap__icon { display:grid; place-items:center; padding-left:16px; color:var(--muted); }
      .kds-input { flex:1; border:0; outline:0; background:transparent; padding:18px 16px; font-size:17px; color:var(--ink); letter-spacing:-0.005em; }
      .kds-input--mono { font-family:var(--font-mono); letter-spacing:0.04em; }
      .kds-input::placeholder { color:var(--muted-2); }
      .kds-input-wrap__addon { padding:0 14px; font-size:11px; color:var(--muted-2); border-left:1px solid var(--line); align-self:stretch; display:grid; place-items:center; }
      .kds-btn { appearance:none; border:0; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:10px; padding:14px 22px; border-radius:var(--r-md); font-size:15px; font-weight:500; transition:transform .15s,background .2s; }
      .kds-btn:active { transform:translateY(1px); }
      .kds-btn--primary { background:var(--kavak-blue); color:#fff; }
      .kds-btn--primary:hover { background:var(--kavak-blue-deep); }
      .kds-btn--primary:disabled { background:var(--line); color:var(--muted-2); cursor:not-allowed; }
      .kds-btn--ghost { background:transparent; color:var(--ink-3); border:1px solid var(--line); }
      .kds-btn--ghost:hover { border-color:var(--ink); color:var(--ink); }
      .kds-btn--block { width:100%; }
      .kds-form-row { display:flex; align-items:center; gap:12px; }
      .kds-helper { display:flex; gap:12px; align-items:flex-start; padding:14px 16px; background:var(--kavak-blue-hint); border:1px solid var(--kavak-blue-edge); border-radius:var(--r-md); font-size:13px; line-height:1.5; color:var(--kavak-blue-ink); }
      .kds-helper__icon { flex-shrink:0; margin-top:1px; color:var(--kavak-blue); }
      .kds-status-strip { display:flex; align-items:center; gap:16px; padding-top:16px; font-size:13px; color:var(--muted); border-top:1px solid var(--line); }
      .kds-preview { position:relative; background:#0A0B14; color:#fff; padding:56px; display:flex; flex-direction:column; gap:24px; overflow:hidden; }
      .kds-preview::before { content:""; position:absolute; inset:0; background:radial-gradient(circle at 15% 0%,color-mix(in oklab,var(--kavak-blue) 35%,transparent),transparent 50%),radial-gradient(circle at 100% 100%,color-mix(in oklab,var(--kavak-blue) 28%,transparent),transparent 45%); pointer-events:none; }
      .kds-preview > * { position:relative; z-index:1; }
      .kds-preview__eyebrow { font-size:11px; letter-spacing:0.18em; text-transform:uppercase; color:rgba(255,255,255,.55); }
      .kds-preview__title { font-family:var(--font-display); font-weight:500; font-size:32px; line-height:1.08; letter-spacing:-0.03em; margin:0; max-width:400px; }
      .kds-case-card { background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); border-radius:var(--r-lg); padding:22px; }
      .kds-case-card__head { display:flex; justify-content:space-between; align-items:center; font-size:12px; color:rgba(255,255,255,.55); letter-spacing:0.06em; text-transform:uppercase; }
      .kds-timeline { list-style:none; margin:20px 0 0; padding:0; display:flex; flex-direction:column; gap:12px; }
      .kds-timeline li { display:grid; grid-template-columns:22px 1fr auto; align-items:center; gap:12px; font-size:13px; }
      .kds-ti-dot { width:10px; height:10px; border-radius:999px; border:2px solid rgba(255,255,255,.25); justify-self:center; }
      .kds-timeline .is-done .kds-ti-dot { background:var(--kavak-blue); border-color:var(--kavak-blue); }
      .kds-timeline .is-now .kds-ti-dot { background:#6EE7A8; border-color:#6EE7A8; box-shadow:0 0 0 4px rgba(110,231,168,.18); }
      .kds-ti-time { font-size:12px; color:rgba(255,255,255,.45); }
      .kds-sso { display:flex; gap:10px; }
      .kds-sso__btn { flex:1; display:inline-flex; align-items:center; justify-content:center; gap:10px; padding:13px; border-radius:var(--r-md); border:1px solid var(--line); background:var(--paper); font-size:13px; font-weight:500; color:var(--ink-3); cursor:pointer; }
      .kds-sso__btn:hover { border-color:var(--ink); }
      .kds-divider-or { display:flex; align-items:center; gap:12px; color:var(--muted-2); font-size:12px; letter-spacing:0.08em; text-transform:uppercase; }
      .kds-divider-or::before,.kds-divider-or::after { content:""; flex:1; height:1px; background:var(--line); }
      .kds-shake { animation:kds-shake .35s; }
      @keyframes kds-shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-5px)} 40%,80%{transform:translateX(5px)} }
      .kds-fade-in { animation:kds-fadeIn .4s cubic-bezier(.2,.7,.2,1) both; }
      @keyframes kds-fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
      @media(max-width:1100px){
        .kds-hero{grid-template-columns:1fr}
        .kds-hero__media{min-height:320px}
        .kds-hero__copy{padding:40px 24px}
        .kds-subscreen{grid-template-columns:1fr}
        .kds-subscreen__panel{padding:40px 24px;max-width:100%}
        .kds-preview{display:none}
        .kds-topbar{padding:0 24px}
        .kds-trust{padding:16px 24px}
        .kds-choices{grid-template-columns:1fr}
      }
    `;
    document.head.appendChild(s);
  }, []);
  return null;
}

// ── Icons ─────────────────────────────────────────────────────────
const ArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6"/>
  </svg>
);
const ArrowLeft = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M11 6l-6 6 6 6"/>
  </svg>
);
const IconUser = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>
  </svg>
);
const IconWrench = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.1-2.1 2.6-2.4z"/>
  </svg>
);
const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
  </svg>
);
const IconLock = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>
  </svg>
);
const IconMail = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 7 9-7"/>
  </svg>
);
const IconInfo = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/><path d="M12 8v.5M12 11v5"/>
  </svg>
);
const IconShield = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l8 3v6c0 5-3.6 8.4-8 9-4.4-.6-8-4-8-9V6l8-3z"/>
  </svg>
);
const IconEye = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const IconEyeOff = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3l18 18M10.6 10.6A3 3 0 0 0 12 15a3 3 0 0 0 2.4-1.2M9.9 5.1A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7c1.6 0 3-.3 4.3-.8"/>
  </svg>
);

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const PANEL_PASSWORD = import.meta.env.VITE_PANEL_PASSWORD || "";

const ESTADO_MAP = {
  "PENDIENTE":                { principal: "Diagnostico", subestado: "Pendiente de diagnóstico", orden: 0 },
  "PENDIENTE DE DIAGNÓSTICO": { principal: "Diagnostico", subestado: "Pendiente de diagnóstico", orden: 0 },
  "DIAGNÓSTICO":              { principal: "Diagnostico", subestado: "En diagnóstico",            orden: 1 },
  "ESPERA DE REPUESTO":       { principal: "EnTrabajo",   subestado: "Espera de repuesto",        orden: 2 },
  "DISPONIBLE PARA TRABAJO":  { principal: "EnTrabajo",   subestado: "Disponible para trabajo",   orden: 3 },
  "TRABAJANDO":               { principal: "EnTrabajo",   subestado: "Trabajando",                orden: 4 },
  "PRUEBA DE RUTA":           { principal: "EnTrabajo",   subestado: "Prueba de ruta",            orden: 5 },
  "LISTO":                    { principal: "Listo",       subestado: "Listo para entregar",       orden: 6 },
  "ENTREGADO A CLIENTE":      { principal: "Listo",       subestado: "Entregado a cliente",       orden: 7 },
};

const SUBESTADOS_ORDEN = [
  { key: "PENDIENTE DE DIAGNÓSTICO", label: "Pendiente de diagnóstico", principal: "Diagnostico" },
  { key: "DIAGNÓSTICO",              label: "En diagnóstico",           principal: "Diagnostico" },
  { key: "ESPERA DE REPUESTO",       label: "Espera de repuesto",       principal: "EnTrabajo"   },
  { key: "DISPONIBLE PARA TRABAJO",  label: "Disponible para trabajo",  principal: "EnTrabajo"   },
  { key: "TRABAJANDO",               label: "Trabajando",               principal: "EnTrabajo"   },
  { key: "PRUEBA DE RUTA",           label: "Prueba de ruta",           principal: "EnTrabajo"   },
  { key: "LISTO",                    label: "Listo para entregar",      principal: "Listo"       },
  { key: "ENTREGADO A CLIENTE",      label: "Entregado a cliente",      principal: "Listo"       },
];

const ESTADOS = {
  Diagnostico: { label: "Diagnóstico", color: "#E24B4A", bg: "#FCEBEB", text: "#A32D2D", border: "#E24B4A30" },
  EnTrabajo:   { label: "En Trabajo",  color: "#EF9F27", bg: "#FAEEDA", text: "#633806", border: "#EF9F2730" },
  Listo:       { label: "Listo",       color: "#1D9E75", bg: "#E1F5EE", text: "#085041", border: "#1D9E7530" },
};

const KAVAK_BLUE = "#0066FF";
const KAVAK_BLUE_DARK = "#0052CC";
const KAVAK_BLUE_LIGHT = "#E5F0FF";


// ── Kavak Logo ────────────────────────────────────────────────────

function KavakLogo({ dark = false, small = false }) {
  return (
    <span style={{
      fontFamily: "'Arial Black', 'Arial Bold', Arial, sans-serif",
      fontWeight: 900,
      fontSize: small ? 14 : 20,
      letterSpacing: 1,
      color: dark ? "#0066FF" : "#ffffff",
      lineHeight: 1,
    }}>KAVAK</span>
  );
}

function getMapped(estadoOperativo) {
  const key = estadoOperativo?.toUpperCase().trim();
  return ESTADO_MAP[key] || { principal: "Diagnostico", subestado: estadoOperativo, orden: -1 };
}

function getOrden(keyEstado) {
  const entry = ESTADO_MAP[keyEstado?.toUpperCase().trim()];
  return entry ? entry.orden : -1;
}

function formatFechaHora(fecha, hora) {
  if (!fecha) return null;
  const [y, m, d] = fecha.split("-");
  const f = `${d}-${m}-${y}`;
  const h = hora ? hora.slice(0, 5) : null;
  return h ? `${f} ${h}` : f;
}

function formatDate(d) {
  if (!d) return "-";
  return new Date(d).toLocaleString("es-CL", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function haceHoras(fecha) {
  if (!fecha) return 999;
  return (Date.now() - new Date(fecha).getTime()) / (1000 * 60 * 60);
}

// ── Ubicacion mapper ──────────────────────────────────────────────

function formatUbicacion(ubicacion) {
  if (!ubicacion) return null;
  const u = ubicacion.toUpperCase().trim();
  if (u.includes("DEPOT")) return "Kavak Schiappacasse";
  if (u.includes("MBI")) return "Kavak Mall Barrio Independencia";
  return ubicacion;
}

// ── API REST ──────────────────────────────────────────────────────

function supabaseFetch(path, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${path}`;
  const headers = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
    "Prefer": options.prefer || "return=representation",
    ...options.headers,
  };
  return fetch(url, { ...options, headers });
}

async function getCasos() {
  const res = await supabaseFetch("bbdd_cc_activos?order=fecha_ingreso.desc", {});
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function getComentarios() {
  const res = await supabaseFetch("comentarios?order=created_at.desc", {});
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function addComentario(data) {
  const res = await supabaseFetch("comentarios", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function filtrarProcesoReciente(todos) {
  if (!todos.length) return [];

  // Tomar solo el id_sistema más alto (proceso más reciente)
  const maxId = Math.max(...todos.map(f => f.id_sistema));
  const proceso = todos.filter(f => f.id_sistema === maxId);

  // Descartar filas sin ninguna fecha (registros corruptos)
  const validos = proceso.filter(f => f.fecha_ingreso || f.fecha_listo);
  const base = validos.length > 0 ? validos : proceso;

  // Ordenar cronológicamente primero para saber cuál ENTREGADO es el más reciente
  const ordenado = [...base].sort((a, b) => {
    if (!a.fecha_ingreso && !b.fecha_ingreso) return 0;
    if (!a.fecha_ingreso) return -1;
    if (!b.fecha_ingreso) return 1;
    const da = new Date(a.fecha_ingreso + "T" + (a.hora_ingreso || "00:00:00"));
    const db = new Date(b.fecha_ingreso + "T" + (b.hora_ingreso || "00:00:00"));
    return da - db;
  });
  // El último registro cronológico
  const ultimoRegistro = ordenado[ordenado.length - 1];
  // Descartar ENTREGADO A CLIENTE sin fecha_listo SOLO si no es el último registro
  // Si es el último, es la entrega real abierta y debe mantenerse
  const final = ordenado.filter(f => {
    const esEntregado = f.estado_operativo?.toUpperCase().trim() === "ENTREGADO A CLIENTE";
    if (esEntregado && !f.fecha_listo && f !== ultimoRegistro) return false;
    return true;
  });

  // Ya está ordenado cronológicamente
  return final;
}

async function getHistorialByNumero(numero) {
  const res = await supabaseFetch(`bbdd_cc?numero_caso=eq.${encodeURIComponent(numero)}&order=id_sistema.asc,fecha_ingreso.asc.nullslast,hora_ingreso.asc.nullslast`);
  if (!res.ok) throw new Error(await res.text());
  const todos = await res.json();
  return filtrarProcesoReciente(todos);
}

async function getHistorialByPatente(patente) {
  const res = await supabaseFetch(`bbdd_cc?patente=eq.${encodeURIComponent(patente.toUpperCase())}&order=id_sistema.asc,fecha_ingreso.asc.nullslast,hora_ingreso.asc.nullslast`);
  if (!res.ok) throw new Error(await res.text());
  const todos = await res.json();
  return filtrarProcesoReciente(todos);
}

async function registrarConsulta(busqueda, tipo, numero_caso, patente) {
  try {
    await supabaseFetch("consultas_cliente", {
      method: "POST",
      body: JSON.stringify({
        busqueda,
        tipo,
        numero_caso: numero_caso || null,
        patente: patente || null,
        created_at: new Date().toISOString(),
      }),
    });
  } catch (e) {
    console.warn("No se pudo registrar consulta:", e.message);
  }
}

async function saveFeedback(data) {
  const res = await supabaseFetch("feedback_cliente", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function getComentariosByCaso(numero) {
  const res = await supabaseFetch(`comentarios?numero_caso=eq.${encodeURIComponent(numero)}&order=created_at.desc`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── UI base ───────────────────────────────────────────────────────

function Badge({ principal }) {
  const cfg = ESTADOS[principal];
  if (!cfg) return null;
  return (
    <span style={{
      background: cfg.bg, color: cfg.text,
      border: `1px solid ${cfg.border}`,
      borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 500,
    }}>{cfg.label}</span>
  );
}

function SubBadge({ subestado, principal }) {
  const cfg = ESTADOS[principal] || {};
  return (
    <span style={{
      background: cfg.bg || "#f1efe8", color: cfg.text || "#444",
      border: `1px solid ${cfg.border || "#88888830"}`,
      borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 500,
    }}>{subestado}</span>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 16, padding: "28px 32px",
        minWidth: 420, maxWidth: 560, width: "90vw",
        boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
        maxHeight: "85vh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>{title}</h2>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 22, color: "#aaa" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Pantalla de inicio ────────────────────────────────────────────

function TopBar({ onLogo }) {
  return (
    <header className="kds-topbar">
      <div style={{ display:"flex", alignItems:"center", gap:16 }}>
        <a className="kds-brandmark" href="#" onClick={e => { e.preventDefault(); onLogo?.(); }}>KAVAK</a>
        <span className="kds-brand-pill">Portal · Sigue tu caso</span>
      </div>
    </header>
  );
}

function PantallaInicio({ onCliente, onInterno }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", minHeight:"100vh", background:"var(--paper)", fontFamily:"var(--font-display)" }}>
      <InjectStyles />
      <TopBar />
      <div className="kds-hero kds-fade-in">
        <section className="kds-hero__copy">
          <div>
            <span className="kds-eyebrow">Portal de seguimiento</span>
            <h1 className="kds-headline">Sigue tu<br />caso<span className="dot">.</span></h1>
            <p className="kds-subhead">Consulta el estado de tu vehículo en tiempo real, o accede al panel interno de gestión post-venta.</p>
          </div>
          <div className="kds-choices">
            <button className="kds-choice kds-choice--primary" onClick={onCliente}>
              <div className="kds-choice__row">
                <span className="kds-choice__tag">Para clientes</span>
                <span className="kds-choice__icon"><IconUser /></span>
              </div>
              <div>
                <h2 className="kds-choice__title">Soy cliente Kavak</h2>
                <p className="kds-choice__desc">Consulta el estado de tu vehículo con tu número de caso o patente. Sin contraseña.</p>
              </div>
              <span className="kds-choice__cta">Consultar mi caso <ArrowRight /></span>
              <div className="kds-choice__meta">
                <span className="kds-dot" />
                <span>Tiempo promedio de respuesta · 38 seg</span>
              </div>
            </button>
            <button className="kds-choice kds-choice--secondary" onClick={onInterno}>
              <div className="kds-choice__row">
                <span className="kds-choice__tag">Equipo interno</span>
                <span className="kds-choice__icon"><IconWrench /></span>
              </div>
              <div>
                <h2 className="kds-choice__title">Internos de Kavak</h2>
                <p className="kds-choice__desc">Acceso al panel de gestión para el equipo de post-venta.</p>
              </div>
              <span className="kds-choice__cta">Iniciar sesión <ArrowRight /></span>
            </button>
          </div>
        </section>
        <aside className="kds-hero__media">
          <img className="kds-hero__img" alt="" src="https://images.prd.kavak.io/assets/images/home-ui/cl-home-banner-md.webp" />
          <div className="kds-hero__veil" />
          <div className="kds-ticker">
            <span>Centro de servicio · Santiago</span>
            <span><span className="kds-dot" style={{marginRight:6}} />En operación</span>
          </div>
          <div className="kds-plate">KAVAK</div>
          <div className="kds-media-caption">
            <div>
              <p className="kds-media-caption__title">Cada caso, una historia.</p>
              <p className="kds-media-caption__sub">Vehículos en proceso este mes</p>
            </div>
          </div>
        </aside>
      </div>
      <div className="kds-trust">
        <div className="kds-trust__group">
          <span><IconShield /> &nbsp;Datos cifrados extremo a extremo</span>
          <span>+4 millones de clientes</span>
          <span>Operación en 10 países</span>
        </div>
        <span>© Kavak {new Date().getFullYear()}</span>
      </div>
    </div>
  );
}

// ── Login internos ────────────────────────────────────────────────

function LoginInterno({ onLogin, onVolver }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [err, setErr]           = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [shake, setShake]       = useState(false);

  function handleLogin() {
    if (!email.trim()) { triggerShake("Ingresa tu correo"); return; }
    if (!email.trim().toLowerCase().endsWith("@kavak.com")) { triggerShake("Solo se permiten correos @kavak.com"); return; }
    if (password !== PANEL_PASSWORD) { triggerShake("Contraseña incorrecta"); return; }
    setSubmitting(true);
    setTimeout(() => onLogin(email.trim().toLowerCase()), 300);
  }

  function triggerShake(msg) {
    setErr(msg); setShake(true);
    setTimeout(() => setShake(false), 400);
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", minHeight:"100vh", background:"var(--paper)", fontFamily:"var(--font-display)" }}>
      <InjectStyles />
      <TopBar onLogo={onVolver} />
      <div className="kds-subscreen kds-fade-in">
        <section className="kds-subscreen__panel">
          <button className="kds-back-btn" onClick={onVolver}><ArrowLeft /> Volver al inicio</button>
          <div>
            <span className="kds-eyebrow">Equipo interno</span>
            <h1 className="kds-subscreen__title" style={{marginTop:12}}>Panel de<br />post-venta<span style={{color:"var(--kavak-blue)"}}>.</span></h1>
            <p className="kds-subscreen__sub" style={{marginTop:16}}>Accede al panel de gestión para revisar casos, asignar tareas y actualizar el estado de los vehículos en proceso.</p>
          </div>
          <div style={{display:"flex", flexDirection:"column", gap:16}}>
            <div className="kds-field">
              <label className="kds-field__label"><span>Correo</span><small>@kavak.com</small></label>
              <div className={`kds-input-wrap${shake ? " is-error kds-shake" : ""}`}>
                <span className="kds-input-wrap__icon"><IconMail /></span>
                <input className="kds-input" type="email" placeholder="nombre@kavak.com" value={email}
                  onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} autoComplete="username" />
              </div>
            </div>
            <div className="kds-field">
              <label className="kds-field__label"><span>Contraseña</span></label>
              <div className={`kds-input-wrap${shake ? " is-error" : ""}`}>
                <span className="kds-input-wrap__icon"><IconLock /></span>
                <input className="kds-input" type={showPass ? "text" : "password"} placeholder="••••••••" value={password}
                  onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} autoComplete="current-password" />
                <button type="button" onClick={() => setShowPass(s => !s)} style={{background:"transparent",border:0,padding:"0 16px",color:"var(--muted)",cursor:"pointer",display:"grid",placeItems:"center",height:"100%"}}>
                  {showPass ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
            </div>
            {err && (
              <div className="kds-helper" style={{background:"#FEECEC",borderColor:"#F8C9CA",color:"#9F1F23"}}>
                <span className="kds-helper__icon" style={{color:"#E5484D"}}><IconInfo /></span>
                <div>{err}</div>
              </div>
            )}
            <button className="kds-btn kds-btn--primary kds-btn--block" onClick={handleLogin} disabled={submitting}>
              {submitting ? "Validando…" : <><span>Iniciar sesión</span><ArrowRight /></>}
            </button>
            <div className="kds-status-strip">
              <span className="kds-dot" /> Acceso limitado al equipo de post-venta · Auditado
            </div>
          </div>
        </section>
        <aside className="kds-preview">
          <span className="kds-preview__eyebrow">Vista previa · Panel interno</span>
          <h2 className="kds-preview__title">Operación de post-venta en un solo lugar.</h2>
          <div className="kds-case-card">
            <div className="kds-case-card__head"><span>Cola de hoy</span><span style={{color:"#6EE7A8"}}>● Activos</span></div>
            <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:16}}>
              {[
                {id:"Caso #727885",car:"Espera de repuesto",color:"#FFD37A"},
                {id:"Caso #729004",car:"Disponible para trabajo",color:"#9BB4FF"},
                {id:"Caso #730457",car:"Listo para entregar",color:"#6EE7A8"},
                {id:"Caso #728343",car:"En diagnóstico",color:"#E8E9EE"},
              ].map(r => (
                <div key={r.id} style={{display:"grid",gridTemplateColumns:"120px 1fr auto",alignItems:"center",gap:10,padding:"8px 0",borderTop:"1px solid rgba(255,255,255,.06)",fontSize:13}}>
                  <span style={{fontFamily:"var(--font-mono)",color:"rgba(255,255,255,.6)",fontSize:12}}>{r.id}</span>
                  <span>{r.car}</span>
                  <span style={{fontSize:11,padding:"3px 8px",borderRadius:999,background:"rgba(255,255,255,.08)",color:r.color,fontWeight:500}}>●</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ── Modal comentario ──────────────────────────────────────────────

function ModalComentario({ caso, onSave, onClose, defaultUser = "" }) {
  const { subestado, principal } = getMapped(caso.estado_operativo);
  const [comentario, setComentario] = useState("");
  const [creadoPor, setCreadoPor]   = useState(defaultUser);
  const [saving, setSaving]         = useState(false);
  const [err, setErr]               = useState("");

  async function handleSave() {
    if (!comentario.trim()) { setErr("El comentario no puede estar vacío"); return; }
    setSaving(true); setErr("");
    try {
      await addComentario({
        numero_caso: caso.numero_caso,
        patente: caso.patente,
        estado: caso.estado_operativo,
        comentario: comentario.trim(),
        creado_por: creadoPor.trim() || "Sin nombre",
        created_at: new Date().toISOString(),
      });
      onSave();
      onClose();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    width: "100%", padding: "9px 12px", borderRadius: 8,
    border: "1px solid #e0e0e0", background: "#fafafa",
    color: "#1a1a1a", fontSize: 14, boxSizing: "border-box",
  };

  return (
    <div>
      <div style={{ background: "#f8f7f4", borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
        <p style={{ margin: 0, fontSize: 13, color: "#666" }}>
          Caso <strong>#{caso.numero_caso}</strong> · Patente <strong>{caso.patente}</strong>
        </p>
        <div style={{ marginTop: 6 }}><SubBadge subestado={subestado} principal={principal} /></div>
      </div>
      <label style={{ fontSize: 13, color: "#666", display: "block", marginBottom: 4 }}>Tu nombre</label>
      <input style={inputStyle} value={creadoPor} onChange={e => setCreadoPor(e.target.value)} placeholder="Ej: Juan Pérez" />
      <label style={{ fontSize: 13, color: "#666", display: "block", marginBottom: 4, marginTop: 12 }}>Comentario *</label>
      <textarea style={{ ...inputStyle, minHeight: 90, resize: "vertical" }} value={comentario} onChange={e => setComentario(e.target.value)} placeholder="Describe el estado actual del vehículo..." />
      {err && <p style={{ color: "#c0392b", fontSize: 13, marginTop: 6 }}>{err}</p>}
      <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
        <button onClick={handleSave} disabled={saving} style={{
          flex: 1, padding: "10px 0", borderRadius: 8, border: "none",
          background: KAVAK_BLUE, color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 14,
        }}>{saving ? "Guardando..." : "Guardar comentario"}</button>
        <button onClick={onClose} style={{
          flex: 1, padding: "10px 0", borderRadius: 8,
          border: "1px solid #e0e0e0", background: "transparent", color: "#555", cursor: "pointer", fontSize: 14,
        }}>Cancelar</button>
      </div>
    </div>
  );
}

// ── Modal historial ───────────────────────────────────────────────

function ModalHistorial({ caso, comentariosDeCaso, onClose }) {
  return (
    <div>
      <p style={{ margin: "0 0 16px", fontSize: 13, color: "#666" }}>
        Caso <strong>#{caso.numero_caso}</strong> · Patente <strong>{caso.patente}</strong>
      </p>
      {comentariosDeCaso.length === 0
        ? <p style={{ color: "#aaa", textAlign: "center", padding: "24px 0" }}>Sin comentarios aún</p>
        : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {comentariosDeCaso.map(c => {
              const { subestado, principal } = getMapped(c.estado);
              const cfg = ESTADOS[principal] || {};
              return (
                <div key={c.id} style={{
                  borderLeft: `3px solid ${c.es_general ? KAVAK_BLUE : (cfg.color || "#888")}`,
                  background: c.es_general ? KAVAK_BLUE_LIGHT : "#f8f7f4",
                  borderRadius: "0 8px 8px 0", padding: "10px 14px",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    {c.es_general
                      ? <span style={{ background: KAVAK_BLUE_LIGHT, color: KAVAK_BLUE, border: `1px solid ${KAVAK_BLUE}30`, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 500 }}>📝 Nota general</span>
                      : <SubBadge subestado={subestado} principal={principal} />
                    }
                    <span style={{ fontSize: 11, color: "#aaa" }}>{formatDate(c.created_at)}</span>
                  </div>
                  <p style={{ margin: "4px 0 2px", fontSize: 14 }}>{c.comentario}</p>
                  {c.creado_por && <p style={{ margin: 0, fontSize: 12, color: "#999" }}>— {c.creado_por}</p>}
                </div>
              );
            })}
          </div>
        )
      }
      <button onClick={onClose} style={{
        marginTop: 18, width: "100%", padding: "10px 0", borderRadius: 8,
        border: "1px solid #e0e0e0", background: "transparent", color: "#555", cursor: "pointer", fontSize: 14,
      }}>Cerrar</button>
    </div>
  );
}

// ── Tarjeta de caso ───────────────────────────────────────────────

function CasoCard({ caso, comentariosDeCaso, onAgregarComentario, onNotaGeneral, onVerHistorial, alerta, colorBorde }) {
  const { principal, subestado } = getMapped(caso.estado_operativo);
  const cfg = ESTADOS[principal] || {};
  const ultimoComentario = comentariosDeCaso[0];
  const borderColor = colorBorde ? cfg.color : (alerta === "advertencia" ? "#E24B4A" : "#e0e0e0");
  const bgCard = colorBorde ? cfg.bg + "55" : "#fff";

  return (
    <div style={{
      background: bgCard,
      border: `1px solid ${colorBorde ? cfg.border : alerta === "advertencia" ? "#E24B4A30" : "#ececec"}`,
      borderLeft: `4px solid ${borderColor}`,
      borderRadius: 12, padding: "14px 16px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>{caso.patente}</span>
            <span style={{ fontSize: 13, color: "#ccc" }}>·</span>
            <span style={{ fontSize: 13, color: "#999" }}>Caso #{caso.numero_caso}</span>
            <Badge principal={principal} />
            <SubBadge subestado={subestado} principal={principal} />
            {alerta === "urgente" && (
              <span style={{ background: "#FAEEDA", color: "#633806", border: "1px solid #EF9F2740", borderRadius: 20, padding: "2px 9px", fontSize: 11, fontWeight: 500 }}>
                ⏰ Actualizar comentario
              </span>
            )}
            {alerta === "advertencia" && (
              <span style={{ background: "#FCEBEB", color: "#A32D2D", border: "1px solid #E24B4A40", borderRadius: 20, padding: "2px 9px", fontSize: 11, fontWeight: 500 }}>
                ⚠ Sin comentario +72h
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 16, marginBottom: 6, flexWrap: "wrap" }}>
            {caso.fecha_ingreso && (
              <span style={{ fontSize: 12, color: "#aaa" }}>📅 Ingreso: {formatFechaHora(caso.fecha_ingreso, caso.hora_ingreso)}</span>
            )}
            {caso.fecha_listo && (
              <span style={{ fontSize: 12, color: "#aaa" }}>✅ Listo: {formatFechaHora(caso.fecha_listo, caso.hora_listo)}</span>
            )}
            {caso.ubicacion && (
              <span style={{ fontSize: 12, color: "#aaa" }}>📍 {formatUbicacion(caso.ubicacion)}</span>
            )}
          </div>
          {ultimoComentario
            ? <p style={{ margin: 0, fontSize: 13, color: "#666" }}>
                💬 {ultimoComentario.comentario}
                <span style={{ color: "#ccc", marginLeft: 6, fontSize: 11 }}>— {ultimoComentario.creado_por} · {formatDate(ultimoComentario.created_at)}</span>
              </p>
            : <p style={{ margin: 0, fontSize: 13, color: "#ddd", fontStyle: "italic" }}>Sin comentarios</p>
          }
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
          <button onClick={() => onAgregarComentario(caso)} style={{
            padding: "6px 12px", borderRadius: 7, border: "none",
            background: KAVAK_BLUE, color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 500,
          }}>+ Comentario</button>
          <button onClick={() => onNotaGeneral(caso)} style={{
            padding: "6px 12px", borderRadius: 7, border: "none",
            background: "#f0f0f0", color: "#555", cursor: "pointer", fontSize: 12, fontWeight: 500,
          }}>📝 Nota general</button>
          {comentariosDeCaso.length > 0 && (
            <button onClick={() => onVerHistorial(caso)} style={{
              padding: "6px 12px", borderRadius: 7, border: "1px solid #e0e0e0",
              background: "transparent", cursor: "pointer", fontSize: 12, color: "#777",
            }}>Historial ({comentariosDeCaso.length})</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Modal Nota General ───────────────────────────────────────────

function ModalNotaGeneral({ caso, onSave, onClose, defaultUser = "" }) {
  const [nota, setNota]         = useState("");
  const [creadoPor, setCreadoPor] = useState(defaultUser);
  const [saving, setSaving]     = useState(false);
  const [err, setErr]           = useState("");

  async function handleSave() {
    if (!nota.trim()) { setErr("La nota no puede estar vacía"); return; }
    setSaving(true); setErr("");
    try {
      await addComentario({
        numero_caso: caso.numero_caso,
        patente: caso.patente,
        estado: null,
        comentario: nota.trim(),
        creado_por: creadoPor.trim() || "Sin nombre",
        es_general: true,
        created_at: new Date().toISOString(),
      });
      onSave();
      onClose();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    width: "100%", padding: "9px 12px", borderRadius: 8,
    border: "1px solid #e0e0e0", background: "#fafafa",
    color: "#1a1a1a", fontSize: 14, boxSizing: "border-box",
  };

  return (
    <div>
      <div style={{ background: "#f8f7f4", borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
        <p style={{ margin: 0, fontSize: 13, color: "#666" }}>
          Caso <strong>#{caso.numero_caso}</strong> · Patente <strong>{caso.patente}</strong>
        </p>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "#aaa" }}>
          Esta nota es visible para el cliente en "Última actualización del equipo"
        </p>
      </div>
      <label style={{ fontSize: 13, color: "#666", display: "block", marginBottom: 4 }}>Tu nombre</label>
      <input style={inputStyle} value={creadoPor} onChange={e => setCreadoPor(e.target.value)} placeholder="Ej: Juan Pérez" />
      <label style={{ fontSize: 13, color: "#666", display: "block", marginBottom: 4, marginTop: 12 }}>Nota general *</label>
      <textarea
        style={{ ...inputStyle, minHeight: 90, resize: "vertical" }}
        value={nota}
        onChange={e => setNota(e.target.value)}
        placeholder="Ej: El cliente fue contactado, esperando confirmación de retiro..."
      />
      {err && <p style={{ color: "#c0392b", fontSize: 13, marginTop: 6 }}>{err}</p>}
      <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
        <button onClick={handleSave} disabled={saving} style={{
          flex: 1, padding: "10px 0", borderRadius: 8, border: "none",
          background: KAVAK_BLUE, color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 14,
        }}>{saving ? "Guardando..." : "Guardar nota"}</button>
        <button onClick={onClose} style={{
          flex: 1, padding: "10px 0", borderRadius: 8,
          border: "1px solid #e0e0e0", background: "transparent", color: "#555", cursor: "pointer", fontSize: 14,
        }}>Cancelar</button>
      </div>
    </div>
  );
}

// ── Tab Pendientes ────────────────────────────────────────────────

function TabPendientes({ casos, comentariosMap, onAgregarComentario, onNotaGeneral, onVerHistorial, onRefresh }) {
  const pendientes = casos.filter(c => {
    if (c.estado_operativo?.toUpperCase().trim() === "ENTREGADO A CLIENTE") return false;
    const comentariosDeCaso = comentariosMap[c.numero_caso] || [];
    const ultimo = comentariosDeCaso[0];
    return !ultimo || ultimo.estado?.toUpperCase().trim() !== c.estado_operativo?.toUpperCase().trim();
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Pendientes</h2>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "#888" }}>
            Casos con cambio de estado sin comentario — {pendientes.length} caso{pendientes.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button onClick={onRefresh} style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #e0e0e0", background: "transparent", cursor: "pointer", fontSize: 13, color: "#555" }}>
          ↻ Actualizar
        </button>
      </div>
      {pendientes.length === 0
        ? <div style={{ textAlign: "center", padding: "48px 0", color: "#ccc" }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
            <p style={{ margin: 0, fontSize: 15 }}>No hay casos pendientes</p>
          </div>
        : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {pendientes.map(c => {
              const comentariosDeCaso = comentariosMap[c.numero_caso] || [];
              const ultimo = comentariosDeCaso[0];
              const alerta = haceHoras(ultimo?.created_at) >= 72 ? "advertencia" : "urgente";
              return (
                <CasoCard key={c.id_sistema} caso={c} comentariosDeCaso={comentariosDeCaso}
                  onAgregarComentario={onAgregarComentario} onNotaGeneral={onNotaGeneral} onVerHistorial={onVerHistorial}
                  alerta={alerta} colorBorde={false} />
              );
            })}
          </div>
      }
    </div>
  );
}

// ── Tab Backlog ───────────────────────────────────────────────────

function TabBacklog({ casos, comentariosMap, onAgregarComentario, onNotaGeneral, onVerHistorial, onRefresh }) {
  const [filtro, setFiltro] = useState("Todos");
  const [busquedaCaso, setBusquedaCaso] = useState("");
  const [busquedaPatente, setBusquedaPatente] = useState("");

  const backlog = casos.filter(c => {
    if (c.estado_operativo?.toUpperCase().trim() === "ENTREGADO A CLIENTE") return false;
    const { principal } = getMapped(c.estado_operativo);
    if (filtro !== "Todos" && principal !== filtro) return false;
    if (busquedaCaso && !c.numero_caso?.toString().toLowerCase().includes(busquedaCaso.toLowerCase())) return false;
    if (busquedaPatente && !c.patente?.toLowerCase().includes(busquedaPatente.toLowerCase())) return false;
    return true;
  });

  const conteos = {};
  casos.forEach(c => {
    if (c.estado_operativo?.toUpperCase().trim() === "ENTREGADO A CLIENTE") return;
    const { principal } = getMapped(c.estado_operativo);
    conteos[principal] = (conteos[principal] || 0) + 1;
  });

  const inputStyle = { padding: "8px 12px", borderRadius: 8, border: "1px solid #e0e0e0", background: "#fafafa", color: "#1a1a1a", fontSize: 13 };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Total activos", value: casos.filter(c => c.estado_operativo?.toUpperCase().trim() !== "ENTREGADO A CLIENTE").length, color: KAVAK_BLUE, bg: KAVAK_BLUE_LIGHT },
          { label: "Diagnóstico",   value: conteos["Diagnostico"] || 0, color: ESTADOS.Diagnostico.color, bg: ESTADOS.Diagnostico.bg },
          { label: "En Trabajo",    value: conteos["EnTrabajo"]   || 0, color: ESTADOS.EnTrabajo.color,   bg: ESTADOS.EnTrabajo.bg   },
          { label: "Listos",        value: conteos["Listo"]       || 0, color: ESTADOS.Listo.color,       bg: ESTADOS.Listo.bg       },
        ].map(m => (
          <div key={m.label} style={{ background: m.bg, borderRadius: 10, padding: "12px 16px", border: `1px solid ${m.color}25` }}>
            <p style={{ margin: "0 0 4px", fontSize: 12, color: m.color, fontWeight: 500 }}>{m.label}</p>
            <p style={{ margin: 0, fontSize: 26, fontWeight: 700, color: m.color }}>{m.value}</p>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <p style={{ margin: 0, fontSize: 13, color: "#aaa" }}>{backlog.length} resultado{backlog.length !== 1 ? "s" : ""}</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input style={{ ...inputStyle, width: 160 }} placeholder="Número de caso..." value={busquedaCaso} onChange={e => setBusquedaCaso(e.target.value)} />
          <input style={{ ...inputStyle, width: 130 }} placeholder="Patente..." value={busquedaPatente} onChange={e => setBusquedaPatente(e.target.value)} />
          <select style={inputStyle} value={filtro} onChange={e => setFiltro(e.target.value)}>
            <option value="Todos">Todos los estados</option>
            {Object.entries(ESTADOS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <button onClick={onRefresh} style={{ ...inputStyle, cursor: "pointer" }}>↻</button>
        </div>
      </div>
      {backlog.length === 0
        ? <p style={{ color: "#ccc", textAlign: "center", marginTop: 40, fontSize: 14 }}>Sin casos para mostrar</p>
        : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {backlog.map(c => (
              <CasoCard key={c.id_sistema} caso={c}
                comentariosDeCaso={comentariosMap[c.numero_caso] || []}
                onAgregarComentario={onAgregarComentario} onNotaGeneral={onNotaGeneral} onVerHistorial={onVerHistorial}
                alerta={null} colorBorde={true} />
            ))}
          </div>
      }
    </div>
  );
}

// ── Progreso cliente ──────────────────────────────────────────────

function ProgresoCliente({ historico, comentarios = [] }) {
  // Estado actual = último elemento del historial (ordenado asc por Supabase)
  const casoActual  = historico[historico.length - 1];
  const ordenActual = getOrden(casoActual?.estado_operativo?.toUpperCase().trim());

  const nk = (k) => k === "PENDIENTE" ? "PENDIENTE DE DIAGNÓSTICO" : k;

  // Por cada estado (normalizado) guardamos:
  //   filas[k] = array de todas sus filas ordenadas cronológicamente asc
  const filasPorEstado = {};
  for (const fila of historico) {
    const k = nk(fila.estado_operativo?.toUpperCase().trim());
    if (!k) continue;
    if (!filasPorEstado[k]) filasPorEstado[k] = [];
    filasPorEstado[k].push(fila);
  }


  // Para un subestado dado, elige qué fila usar para inicio y fin:
  // - Si hay una fila sin fecha_listo (abierta): inicio = esa fila, fin = null
  // - Si todas cerradas: inicio = primera, fin = última
  function getFechas(k) {
    const filas = filasPorEstado[k];
    if (!filas || filas.length === 0) return { filaInicio: null, filaFin: null };
    // Buscar filas abiertas (sin fecha_listo) — tomar la MÁS RECIENTE (última)
    const abiertas = filas.filter(f => !f.fecha_listo);
    if (abiertas.length > 0) return { filaInicio: abiertas[abiertas.length - 1], filaFin: null };
    // Todas cerradas → tomar la más reciente
    const ultima = filas[filas.length - 1];
    return { filaInicio: ultima, filaFin: ultima };
  }

  const comentMap = {};
  for (const c of comentarios) {
    const k = c.estado?.toUpperCase().trim();
    if (k) {
      if (!comentMap[k]) comentMap[k] = [];
      comentMap[k].push(c);
    }
  }

  const grupos = [
    { key: "Diagnostico", label: "Diagnóstico", subestados: SUBESTADOS_ORDEN.filter(s => s.principal === "Diagnostico") },
    { key: "EnTrabajo",   label: "En Trabajo",  subestados: SUBESTADOS_ORDEN.filter(s => s.principal === "EnTrabajo")   },
    { key: "Listo",       label: "Listo",       subestados: SUBESTADOS_ORDEN.filter(s => s.principal === "Listo")       },
  ];

  // Colores de dot por grupo
  const DC = {
    Diagnostico: "#E24B4A",
    EnTrabajo:   "#EF9F27",
    Listo:       "#1D9E75",
  };

  return (
    <div style={{ margin: "8px 0" }}>
      {grupos.map((grupo, gi) => {
        const cfg = ESTADOS[grupo.key];
        const dotColor = DC[grupo.key];
        const grupoActivo   = grupo.subestados.some(s => getOrden(s.key) <= ordenActual);
        const grupoCompleto = grupo.subestados.every(s => getOrden(s.key) < ordenActual);

        return (
          <div key={grupo.key} style={{ marginBottom: 20 }}>
            {/* Grupo header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, paddingBottom: 8, borderBottom: `1px solid ${grupoActivo ? cfg.border : "#f0f0f0"}` }}>
              <div style={{
                width: 22, height: 22, borderRadius: "50%",
                background: grupoActivo ? cfg.color : "#f0f0f0",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 700, color: grupoActivo ? "#fff" : "#ccc", flexShrink: 0,
              }}>
                {grupoCompleto ? "✓" : gi + 1}
              </div>
              <span style={{ fontWeight: 700, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: grupoActivo ? cfg.text : "#ccc" }}>{grupo.label}</span>
              {grupoCompleto && (
                <span style={{ marginLeft: "auto", background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}`, borderRadius: 20, padding: "1px 10px", fontSize: 11, fontWeight: 500 }}>
                  Completado ✓
                </span>
              )}
            </div>

            {/* Subestados timeline */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              {grupo.subestados.map((s, si) => {
                const ordenS     = getOrden(s.key);
                const completado = ordenS < ordenActual;
                const activo     = ordenS === ordenActual;
                const key        = nk(s.key);
                const existeEnHist = !!filasPorEstado[key];
                const tieneAbierta = existeEnHist && filasPorEstado[key].some(f => !f.fecha_listo);
                const retroced   = !completado && !activo && existeEnHist && !tieneAbierta;
                const tieneInfo  = completado || activo || retroced;
                const { filaInicio, filaFin } = getFechas(key);
                const inicioStr  = filaInicio ? formatFechaHora(filaInicio.fecha_ingreso, filaInicio.hora_ingreso) : null;
                const listoStr   = filaFin    ? formatFechaHora(filaFin.fecha_listo, filaFin.hora_listo) : null;
                const isLast     = si === grupo.subestados.length - 1;

                return (
                  <div key={s.key} style={{ display: "flex", gap: 0 }}>
                    {/* Dot + línea */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 28, flexShrink: 0 }}>
                      <div style={{
                        width: 12, height: 12, borderRadius: "50%", marginTop: 13, flexShrink: 0,
                        background: completado ? dotColor : activo ? "#6EE7A8" : "#e8e8e8",
                        border: activo ? "none" : completado ? "none" : "2px solid #d0d0d0",
                        boxShadow: activo ? `0 0 0 4px rgba(110,231,168,.2)` : "none",
                      }} />
                      {!isLast && (
                        <div style={{ width: 2, flex: 1, minHeight: 14, background: completado ? dotColor + "60" : "#e8e8e8", marginTop: 3 }} />
                      )}
                    </div>

                    {/* Contenido */}
                    <div style={{ flex: 1, paddingBottom: isLast ? 4 : 12, paddingLeft: 10, paddingTop: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{
                          fontSize: 14, fontWeight: activo ? 600 : completado ? 500 : 400,
                          color: activo ? "#1a1a1a" : completado ? "#555" : "#bbb",
                          flex: 1,
                        }}>{s.label}</span>
                        {activo && (
                          <span style={{ background: cfg.color, color: "#fff", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>
                            Estado actual
                          </span>
                        )}
                        {completado && (
                          <span style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}`, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 500 }}>
                            Completado ✓
                          </span>
                        )}
                        {retroced && (
                          <span style={{ background: "#f5f5f5", color: "#999", border: "1px solid #e8e8e8", borderRadius: 20, padding: "2px 10px", fontSize: 11 }}>
                            ↩ Retrocedido
                          </span>
                        )}
                      </div>

                      {tieneInfo && (inicioStr || listoStr) && (
                        <div style={{ display: "flex", gap: 12, marginTop: 4, flexWrap: "wrap" }}>
                          {inicioStr && (
                            <span style={{ fontSize: 12, color: retroced ? "#ccc" : "#888", textDecoration: retroced ? "line-through" : "none" }}>
                              {inicioStr}
                            </span>
                          )}
                          {listoStr && inicioStr !== listoStr && (
                            <span style={{ fontSize: 12, color: retroced ? "#ccc" : "#aaa", textDecoration: retroced ? "line-through" : "none" }}>
                              → {listoStr}
                            </span>
                          )}
                        </div>
                      )}

                      {tieneInfo && comentMap[s.key] && comentMap[s.key].length > 0 && (
                        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                          {comentMap[s.key].map(c => (
                            <div key={c.id} style={{
                              background: "#fafafa", border: `1px solid ${cfg.border}`,
                              borderLeft: `3px solid ${cfg.color}`,
                              borderRadius: "0 8px 8px 0", padding: "8px 12px",
                            }}>
                              <p style={{ margin: "0 0 3px", fontSize: 13, color: "#333" }}>💬 {c.comentario}</p>
                              <p style={{ margin: 0, fontSize: 11, color: "#bbb" }}>{c.creado_por} · {formatDate(c.created_at)}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Modal Feedback ───────────────────────────────────────────────

function ModalFeedback({ caso, onClose }) {
  const [puntuacion, setPuntuacion] = useState(0);
  const [hover, setHover]           = useState(0);
  const [sugerencia, setSugerencia] = useState("");
  const [paso, setPaso]             = useState(1); // 1: puntuacion, 2: sugerencia, 3: gracias
  const [saving, setSaving]         = useState(false);
  const [err, setErr]               = useState("");

  async function handleEnviar() {
    if (puntuacion === 0) { setErr("Por favor selecciona una puntuación"); return; }
    setSaving(true); setErr("");
    try {
      await saveFeedback({
        numero_caso: caso.numero_caso,
        patente: caso.patente,
        puntuacion,
        sugerencia: sugerencia.trim() || null,
      });
      setPaso(3);
    } catch (e) {
      setErr("No se pudo guardar. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  const estrellaLabels = ["", "Muy malo", "Malo", "Regular", "Bueno", "Excelente"];
  const estrellasColor = puntuacion >= 4 ? "#1D9E75" : puntuacion === 3 ? "#EF9F27" : puntuacion > 0 ? "#E24B4A" : "#ccc";

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 2000, padding: 16,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 20, padding: "32px 28px",
        maxWidth: 420, width: "100%",
        boxShadow: "0 12px 48px rgba(0,0,0,0.18)",
        textAlign: "center",
      }}>

        {paso === 3 ? (
          <>
            <div style={{ fontSize: 52, marginBottom: 12 }}>🎉</div>
            <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700, color: "#1a1a1a" }}>
              ¡Gracias por tu opinión!
            </h2>
            <p style={{ margin: "0 0 24px", fontSize: 14, color: "#888" }}>
              Tu feedback nos ayuda a mejorar la experiencia para todos los clientes Kavak.
            </p>
            <button onClick={onClose} style={{
              padding: "10px 28px", borderRadius: 10, border: "none",
              background: KAVAK_BLUE, color: "#fff", fontWeight: 600,
              cursor: "pointer", fontSize: 14,
            }}>Cerrar</button>
          </>
        ) : paso === 1 ? (
          <>
            <div style={{
              background: KAVAK_BLUE, borderRadius: 14, padding: "8px 20px",
              display: "inline-block", marginBottom: 16,
            }}>
              <KavakLogo dark={false} small />
            </div>
            <h2 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 700, color: "#1a1a1a" }}>
              ¿Cómo fue tu experiencia?
            </h2>
            <p style={{ margin: "0 0 24px", fontSize: 13, color: "#888" }}>
              Califica del 1 al 5 qué tan útil te resultó esta herramienta de seguimiento
            </p>

            {/* Estrellas */}
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 10 }}>
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => setPuntuacion(n)}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: 40, padding: "2px 4px",
                    transform: (hover || puntuacion) >= n ? "scale(1.15)" : "scale(1)",
                    transition: "transform 0.1s",
                    filter: (hover || puntuacion) >= n ? "none" : "grayscale(1) opacity(0.3)",
                  }}
                >⭐</button>
              ))}
            </div>

            {(hover > 0 || puntuacion > 0) && (
              <p style={{ margin: "0 0 20px", fontSize: 13, fontWeight: 600, color: estrellasColor }}>
                {estrellaLabels[hover || puntuacion]}
              </p>
            )}

            {err && <p style={{ color: "#c0392b", fontSize: 13, margin: "0 0 12px" }}>{err}</p>}

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { if (puntuacion === 0) { setErr("Por favor selecciona una puntuación"); return; } setPaso(2); }} style={{
                flex: 1, padding: "11px 0", borderRadius: 10, border: "none",
                background: KAVAK_BLUE, color: "#fff", fontWeight: 600,
                cursor: "pointer", fontSize: 14,
              }}>Continuar →</button>
              <button onClick={onClose} style={{
                padding: "11px 16px", borderRadius: 10,
                border: "1px solid #e0e0e0", background: "transparent",
                color: "#aaa", cursor: "pointer", fontSize: 13,
              }}>Omitir</button>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 36, marginBottom: 12 }}>
              {["", "😞", "😕", "😐", "😊", "🤩"][puntuacion]}
            </div>
            <h2 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 700, color: "#1a1a1a" }}>
              ¿Tienes alguna sugerencia?
            </h2>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: "#888" }}>
              Cuéntanos cómo podríamos mejorar esta herramienta (opcional)
            </p>
            <textarea
              style={{
                width: "100%", minHeight: 100, padding: "10px 12px",
                borderRadius: 10, border: "1px solid #e0e0e0",
                background: "#fafafa", fontSize: 14, color: "#1a1a1a",
                resize: "vertical", boxSizing: "border-box", outline: "none",
                marginBottom: 16,
              }}
              placeholder="Ej: Me gustaría recibir notificaciones cuando cambie el estado..."
              value={sugerencia}
              onChange={e => setSugerencia(e.target.value)}
            />
            {err && <p style={{ color: "#c0392b", fontSize: 13, margin: "0 0 12px" }}>{err}</p>}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleEnviar} disabled={saving} style={{
                flex: 1, padding: "11px 0", borderRadius: 10, border: "none",
                background: KAVAK_BLUE, color: "#fff", fontWeight: 600,
                cursor: saving ? "wait" : "pointer", fontSize: 14,
              }}>{saving ? "Enviando..." : "Enviar feedback"}</button>
              <button onClick={() => setPaso(1)} style={{
                padding: "11px 16px", borderRadius: 10,
                border: "1px solid #e0e0e0", background: "transparent",
                color: "#aaa", cursor: "pointer", fontSize: 13,
              }}>← Volver</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Portal Cliente ────────────────────────────────────────────────

function PortalCliente({ onVolver, modoInterno = false }) {
  const [busqueda, setBusqueda]       = useState("");
  const [caso, setCaso]               = useState(null);
  const [historico, setHistorico]     = useState([]);
  const [comentarios, setComentarios] = useState([]);
  const [loading, setLoading]         = useState(false);
  const [err, setErr]                 = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [modoTab, setModoTab] = useState("caso");
  const [shake, setShake] = useState(false);

  async function buscar() {
    const q = busqueda.trim();
    if (!q) return;
    setLoading(true); setErr(""); setCaso(null); setHistorico([]); setComentarios([]);
    try {
      let hist = [];
      if (/^\d+$/.test(q)) hist = await getHistorialByNumero(q);
      if (hist.length === 0) hist = await getHistorialByPatente(q);
      if (hist.length === 0) {
        setErr("No se encontró ningún caso con ese número o patente.");
      } else {
        const casoReciente = hist[hist.length - 1];
        setCaso(casoReciente);
        setHistorico(hist);
        const comms = await getComentariosByCaso(casoReciente.numero_caso);
        setComentarios(comms);
        // Solo registrar si es portal cliente real, no vista interna
        if (!modoInterno) {
          const tipo = /^\d+$/.test(q) ? 'numero_caso' : 'patente';
          await registrarConsulta(q, tipo, casoReciente.numero_caso, casoReciente.patente);
          // Mostrar feedback solo si ENTREGADO A CLIENTE tiene fecha_listo (entrega real)
          const esEntregado = hist.some(f => f.estado_operativo?.toUpperCase().trim() === "ENTREGADO A CLIENTE" && f.fecha_listo);
          if (esEntregado) setTimeout(() => setShowFeedback(true), 10000);
        }
      }
    } catch (e) {
      setErr("Error al buscar: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  const mapped = caso ? getMapped(caso.estado_operativo) : null;
  const cfg    = mapped ? ESTADOS[mapped.principal] : null;

  // Comentario inicial: solo si el registro es PENDIENTE o PENDIENTE DE DIAGNÓSTICO
  const comentarioInicial = historico.find(h => {
    const estado = h.estado_operativo?.toUpperCase().trim();
    const esPendiente = estado === "PENDIENTE" || estado === "PENDIENTE DE DIAGNÓSTICO";
    return esPendiente && h.comentario && h.comentario.trim() !== "";
  })?.comentario || null;

  function triggerShake() { setShake(true); setTimeout(() => setShake(false), 400); }

  if (!modoInterno && !caso) {
    return (
      <div style={{display:"flex",flexDirection:"column",minHeight:"100vh",background:"var(--paper)",fontFamily:"var(--font-display)"}}>
        <InjectStyles />
        <TopBar onLogo={onVolver} />
        <div className="kds-subscreen kds-fade-in">
          <section className="kds-subscreen__panel">
            <button className="kds-back-btn" onClick={onVolver}><ArrowLeft /> Volver al inicio</button>
            <div>
              <span className="kds-eyebrow">Cliente</span>
              <h1 className="kds-subscreen__title" style={{marginTop:12}}>Consulta<br />tu caso<span style={{color:"var(--kavak-blue)"}}>.</span></h1>
              <p className="kds-subscreen__sub" style={{marginTop:16}}>Ingresa los datos de tu caso para ver el estado actualizado de tu vehículo y próximos pasos.</p>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:20}}>
              <div className="kds-segment">
                <button className={`kds-segment__btn${modoTab==="caso"?" is-active":""}`} onClick={() => { setModoTab("caso"); setBusqueda(""); }}>
                  <IconShield /> Número de caso
                </button>
                <button className={`kds-segment__btn${modoTab==="patente"?" is-active":""}`} onClick={() => { setModoTab("patente"); setBusqueda(""); }}>
                  <IconSearch /> Patente
                </button>
              </div>
              <div className="kds-field">
                <label className="kds-field__label">
                  <span>{modoTab === "caso" ? "Número de caso" : "Patente del vehículo"}</span>
                  <small>{modoTab === "caso" ? "Lo encuentras en el correo de confirmación" : "Formato chileno sin guiones"}</small>
                </label>
                <div className={`kds-input-wrap${shake?" is-error kds-shake":""}`}>
                  <span className="kds-input-wrap__icon"><IconSearch /></span>
                  <input className="kds-input kds-input--mono"
                    placeholder={modoTab === "caso" ? "Ej: 727885" : "Ej: LHHY81"}
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === "Enter" && (busqueda.trim() ? buscar() : triggerShake())}
                    autoComplete="off" spellCheck={false}
                  />
                  <span className="kds-input-wrap__addon">{modoTab === "caso" ? "CASO ID" : "PATENTE"}</span>
                </div>
              </div>
              {err && (
                <div className="kds-helper" style={{background:"#FEECEC",borderColor:"#F8C9CA",color:"#9F1F23"}}>
                  <span className="kds-helper__icon" style={{color:"#E5484D"}}><IconInfo /></span>
                  <div>{err}</div>
                </div>
              )}
              <div className="kds-form-row">
                <button className="kds-btn kds-btn--primary" disabled={loading || !busqueda.trim()}
                  onClick={() => busqueda.trim() ? buscar() : triggerShake()}>
                  {loading ? "Consultando…" : <><span>Consultar estado</span><ArrowRight /></>}
                </button>
              </div>
              <div className="kds-helper">
                <span className="kds-helper__icon"><IconInfo /></span>
                <div><strong>Tu información está protegida.</strong> No requerimos contraseña; validamos tu identidad con datos que solo tú y Kavak conocen.</div>
              </div>
              <div className="kds-status-strip">
                <span className="kds-dot" /> Sistema operativo · Respuestas en menos de 1 min
              </div>
            </div>
          </section>
          <aside className="kds-preview">
            <span className="kds-preview__eyebrow">Vista previa · Estado de un caso</span>
            <h2 className="kds-preview__title">Así verás cada paso de tu vehículo.</h2>
            <div className="kds-case-card">
              <div className="kds-case-card__head"><span>Caso #727885</span><span>Inspección técnica</span></div>
              <div style={{marginTop:14,fontSize:18,fontFamily:"var(--font-display)",letterSpacing:"-0.02em"}}>Chevrolet Sail 2021</div>
              <span style={{display:"inline-block",background:"#fff",color:"#0A0B14",fontFamily:"var(--font-mono)",fontWeight:700,letterSpacing:"0.12em",padding:"3px 9px",borderRadius:4,fontSize:12,marginTop:6}}>LHHY81</span>
              <ul className="kds-timeline">
                {[
                  {label:"Pendiente de diagnóstico",done:true,time:"07-05 10:29"},
                  {label:"En diagnóstico",done:true,time:"07-05 11:06"},
                  {label:"Espera de repuesto",now:true,time:"En curso"},
                  {label:"Disponible para trabajo",time:"—"},
                  {label:"Listo para entregar",time:"—"},
                ].map((s,i) => (
                  <li key={i} className={s.done?"is-done":s.now?"is-now":""}>
                    <span className="kds-ti-dot"/>
                    <span>{s.label}</span>
                    <span className="kds-ti-time">{s.time}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: modoInterno ? "unset" : "100vh",
      background: modoInterno ? "transparent" : "#f8f9fa",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: modoInterno ? "0" : "40px 16px 48px",
      fontFamily: "var(--font-display)",
    }}>
      {!modoInterno && <InjectStyles />}
      {!modoInterno && <TopBar onLogo={() => { setCaso(null); setHistorico([]); }} />}

      <div style={{ display: "flex", gap: 10, width: "100%", maxWidth: 480, marginBottom: 28, marginTop: modoInterno ? 0 : 24 }}>
        <input
          style={{ flex: 1, padding: "12px 16px", borderRadius: 12, border: "1px solid #e0e0e0", background: "#fff", color: "#1a1a1a", fontSize: 15, outline: "none" }}
          placeholder="Número de caso o patente"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          onKeyDown={e => e.key === "Enter" && buscar()}
        />
        <button onClick={buscar} disabled={loading} style={{
          padding: "12px 22px", borderRadius: 12, border: "none",
          background: KAVAK_BLUE, color: "#fff", fontWeight: 600,
          cursor: loading ? "wait" : "pointer", fontSize: 14,
        }}>{loading ? "..." : "Buscar"}</button>
      </div>

      {err && (
        <div style={{ background: "#FCEBEB", border: "1px solid #E24B4A40", borderRadius: 10, padding: "10px 16px", marginBottom: 16, fontSize: 14, color: "#A32D2D", maxWidth: 480, width: "100%" }}>
          ⚠ {err}
        </div>
      )}

      {caso && cfg && mapped && (
        <div style={{
          width: "100%", maxWidth: 480, background: "#fff",
          borderRadius: 16, border: "1px solid #ececec",
          borderTop: `4px solid ${cfg.color}`,
          boxShadow: "0 4px 24px rgba(0,0,0,0.07)", padding: "24px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
            <div>
              <p style={{ margin: 0, fontSize: 11, color: "#bbb", textTransform: "uppercase", letterSpacing: 0.8 }}>Número de caso</p>
              <p style={{ margin: "2px 0 0", fontSize: 24, fontWeight: 700 }}>#{caso.numero_caso}</p>
            </div>
            <SubBadge subestado={mapped.subestado} principal={mapped.principal} />
          </div>
          <p style={{ margin: "4px 0 0", fontSize: 15, color: "#555", fontWeight: 500 }}>🚗 {caso.patente}</p>
          {caso.ubicacion && (
            <p style={{ margin: "3px 0 0", fontSize: 13, color: "#bbb" }}>📍 {formatUbicacion(caso.ubicacion)}</p>
          )}

          {/* Tarjeta Solicitud inicial */}
          {comentarioInicial && (
            <div style={{
              background: KAVAK_BLUE_LIGHT,
              border: `1px solid ${KAVAK_BLUE}20`,
              borderLeft: `4px solid ${KAVAK_BLUE}`,
              borderRadius: "0 10px 10px 0",
              padding: "12px 14px",
              marginTop: 14,
            }}>
              <p style={{ margin: "0 0 4px", fontSize: 12, color: KAVAK_BLUE, fontWeight: 600 }}>
                📋 Solicitud inicial
              </p>
              <p style={{ margin: 0, fontSize: 14, color: "#333" }}>
                {comentarioInicial}
              </p>
            </div>
          )}

          <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 16, marginTop: 16 }}>
            <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600, color: "#555" }}>Estado del proceso</p>
            <ProgresoCliente historico={historico} comentarios={comentarios} />
          </div>

          {(() => {
            const notaGeneral = comentarios.find(c => c.es_general === true);
            return notaGeneral ? (
              <div style={{ background: KAVAK_BLUE_LIGHT, border: `1px solid ${KAVAK_BLUE}20`, borderRadius: 10, padding: "12px 14px", marginTop: 8 }}>
                <p style={{ margin: "0 0 6px", fontSize: 12, color: KAVAK_BLUE, fontWeight: 600 }}>💬 Última actualización del equipo</p>
                <p style={{ margin: "0 0 4px", fontSize: 14, color: "#333" }}>{notaGeneral.comentario}</p>
                <p style={{ margin: 0, fontSize: 11, color: "#bbb" }}>{formatDate(notaGeneral.created_at)}</p>
              </div>
            ) : null;
          })()}
        </div>
      )}

      {/* Modal Feedback */}
      {showFeedback && caso && (
        <ModalFeedback caso={caso} onClose={() => setShowFeedback(false)} />
      )}

      {/* Botón WhatsApp y volver — solo en portal cliente real */}
      {!modoInterno && (
        <>
          <a
            href="https://api.whatsapp.com/send/?phone=56229145587&text=Hola%2C+me+gustar%C3%ADa+hablar+con+un+asesor+de+Kavak.&type=phone_number&app_absent=0"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              marginTop: 24,
              display: "inline-flex", alignItems: "center", gap: 10,
              background: "#25D366", color: "#fff",
              borderRadius: 12, padding: "12px 22px",
              fontWeight: 600, fontSize: 14,
              textDecoration: "none",
              boxShadow: "0 2px 12px rgba(37,211,102,0.35)",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(37,211,102,0.45)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(37,211,102,0.35)"; }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Hablar con un asesor
          </a>
          <button
            onClick={() => setShowFeedback(true)}
            style={{
              marginTop: 12,
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "#fff", color: KAVAK_BLUE,
              border: `1px solid ${KAVAK_BLUE}40`,
              borderRadius: 12, padding: "11px 22px",
              fontWeight: 600, fontSize: 14,
              cursor: "pointer",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 4px 16px ${KAVAK_BLUE}20`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
          >
            💬 Dejar comentario
          </button>
          <button onClick={onVolver} style={{
            marginTop: 16, background: "none", border: "none", cursor: "pointer",
            fontSize: 12, color: "#ccc", textDecoration: "underline",
          }}>← Volver al inicio</button>
        </>
      )}
    </div>
  );
}

// ── Panel Interno ─────────────────────────────────────────────────

function PanelInterno({ onCerrarSesion, userEmail }) {
  const [tab, setTab]                   = useState("backlog");
  const [casos, setCasos]               = useState([]);
  const [comentariosMap, setComentariosMap] = useState({});
  const [loading, setLoading]           = useState(true);
  const [errConn, setErrConn]           = useState("");
  const [modalComentario, setModalComentario] = useState(null);
  const [modalNotaGeneral, setModalNotaGeneral] = useState(null);
  const [modalHistorial, setModalHistorial]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [casosData, comentariosData] = await Promise.all([
        getCasos(),
        getComentarios(),
      ]);
      setCasos(casosData);
      const map = {};
      for (const c of comentariosData) {
        if (!map[c.numero_caso]) map[c.numero_caso] = [];
        map[c.numero_caso].push(c);
      }
      setComentariosMap(map);
      setErrConn("");
    } catch (e) {
      setErrConn("No se pudo conectar a Supabase.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const pendientesCount = casos.filter(c => {
    if (c.estado_operativo?.toUpperCase().trim() === "ENTREGADO A CLIENTE") return false;
    const comentariosDeCaso = comentariosMap[c.numero_caso] || [];
    const ultimo = comentariosDeCaso[0];
    return !ultimo || ultimo.estado?.toUpperCase().trim() !== c.estado_operativo?.toUpperCase().trim();
  }).length;

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <div style={{
        background: "#fff", borderBottom: "1px solid #ececec",
        padding: "0 24px", display: "flex", alignItems: "center",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ padding: "14px 20px 14px 0", marginRight: 16, borderRight: "1px solid #ececec" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: "'Arial Black', Arial, sans-serif", fontWeight: 900, fontSize: 15, color: KAVAK_BLUE, letterSpacing: 1 }}>KAVAK</span>
            <span style={{ fontWeight: 600, fontSize: 14, color: "#1a1a1a" }}>· Sigue Tu Caso</span>
          </div>
        </div>
        {[
          { key: "backlog", label: "Backlog" },
          { key: "pendientes", label: "Pendientes", badge: pendientesCount > 0 ? pendientesCount : null },
          { key: "buscar", label: "🔍 Buscar caso" },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: "16px 18px", background: "none", border: "none", cursor: "pointer",
            fontSize: 14, fontWeight: tab === t.key ? 600 : 400,
            color: tab === t.key ? KAVAK_BLUE : "#888",
            borderBottom: tab === t.key ? `2px solid ${KAVAK_BLUE}` : "2px solid transparent",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            {t.label}
            {t.badge && (
              <span style={{ background: "#FCEBEB", color: "#A32D2D", borderRadius: 10, padding: "1px 7px", fontSize: 11, fontWeight: 600 }}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          {loading && <span style={{ fontSize: 12, color: "#bbb" }}>Cargando...</span>}
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: errConn ? "#E24B4A" : "#1D9E75" }} title={errConn || "Conectado"} />
          {userEmail && (
            <span style={{ fontSize: 12, color: "#aaa", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {userEmail}
            </span>
          )}

          <button onClick={onCerrarSesion} style={{
            fontSize: 12, color: "#E24B4A", background: "none", border: "1px solid #E24B4A40",
            borderRadius: 6, padding: "4px 10px", cursor: "pointer",
          }}>
            Cerrar sesión
          </button>
        </div>
      </div>

      <div style={{ padding: "24px 20px", maxWidth: 960, margin: "0 auto" }}>
        {errConn && (
          <div style={{ background: "#FCEBEB", border: "1px solid #E24B4A40", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#A32D2D" }}>
            ⚠ {errConn}
          </div>
        )}
        {tab === "backlog" && (
          <TabBacklog casos={casos} comentariosMap={comentariosMap}
            onAgregarComentario={c => setModalComentario(c)}
            onNotaGeneral={c => setModalNotaGeneral(c)}
            onVerHistorial={c => setModalHistorial(c)}
            onRefresh={load} />
        )}
        {tab === "pendientes" && (
          <TabPendientes casos={casos} comentariosMap={comentariosMap}
            onAgregarComentario={c => setModalComentario(c)}
            onNotaGeneral={c => setModalNotaGeneral(c)}
            onVerHistorial={c => setModalHistorial(c)}
            onRefresh={load} />
        )}
        {tab === "buscar" && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Buscar caso</h2>
              <p style={{ margin: "2px 0 0", fontSize: 13, color: "#888" }}>Vista de cliente — las búsquedas no se registran en métricas</p>
            </div>
            <PortalCliente modoInterno={true} onVolver={null} />
          </div>
        )}
      </div>

      {modalComentario && (
        <Modal title="Agregar comentario" onClose={() => setModalComentario(null)}>
          <ModalComentario caso={modalComentario} onSave={load} onClose={() => setModalComentario(null)} defaultUser={userEmail} />
        </Modal>
      )}
      {modalNotaGeneral && (
        <Modal title="📝 Nota general" onClose={() => setModalNotaGeneral(null)}>
          <ModalNotaGeneral caso={modalNotaGeneral} onSave={load} onClose={() => setModalNotaGeneral(null)} defaultUser={userEmail} />
        </Modal>
      )}
      {modalHistorial && (
        <Modal title={`Historial · Caso #${modalHistorial.numero_caso}`} onClose={() => setModalHistorial(null)}>
          <ModalHistorial caso={modalHistorial} comentariosDeCaso={comentariosMap[modalHistorial.numero_caso] || []} onClose={() => setModalHistorial(null)} />
        </Modal>
      )}
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────

export default function App() {
  const [vista, setVista]       = useState("inicio");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("vista") === "cliente") {
      setVista("cliente");
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  if (vista === "inicio") return (
    <PantallaInicio
      onCliente={() => setVista("cliente")}
      onInterno={() => setVista("login")}
    />
  );

  if (vista === "cliente") return (
    <PortalCliente onVolver={() => setVista("inicio")} />
  );

  if (vista === "login") return (
    <LoginInterno
      onLogin={(email) => { setUserEmail(email); setVista("interno"); }}
      onVolver={() => setVista("inicio")}
    />
  );

  if (vista === "interno") return (
    <PanelInterno userEmail={userEmail} onCerrarSesion={() => { setUserEmail(""); setVista("inicio"); }} />
  );
}
