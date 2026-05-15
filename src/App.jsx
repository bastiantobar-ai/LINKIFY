import { useState, useEffect, useCallback } from "react";

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
  const tieneEntregado = todos.some(f => f.estado_operativo?.toUpperCase().trim() === "ENTREGADO A CLIENTE");
  if (tieneEntregado) {
    return [...todos].sort((a, b) => {
      const da = new Date(`${a.fecha_ingreso}T${a.hora_ingreso || "00:00:00"}`);
      const db = new Date(`${b.fecha_ingreso}T${b.hora_ingreso || "00:00:00"}`);
      return da - db;
    });
  }
  const maxId = Math.max(...todos.map(f => f.id_sistema));
  return todos.filter(f => f.id_sistema === maxId)
              .sort((a, b) => {
                const da = new Date(`${a.fecha_ingreso}T${a.hora_ingreso || "00:00:00"}`);
                const db = new Date(`${b.fecha_ingreso}T${b.hora_ingreso || "00:00:00"}`);
                return da - db;
              });
}

async function getHistorialByNumero(numero) {
  const res = await supabaseFetch(`bbdd_cc?numero_caso=eq.${encodeURIComponent(numero)}&order=fecha_ingreso.asc,hora_ingreso.asc`);
  if (!res.ok) throw new Error(await res.text());
  const todos = await res.json();
  return filtrarProcesoReciente(todos);
}

async function getHistorialByPatente(patente) {
  const res = await supabaseFetch(`bbdd_cc?patente=eq.${encodeURIComponent(patente.toUpperCase())}&order=fecha_ingreso.asc,hora_ingreso.asc`);
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

function PantallaInicio({ onCliente, onInterno }) {
  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa", display: "flex", flexDirection: "column" }}>
      <div style={{
        position: "relative", width: "100%", height: 300,
        backgroundImage: "url('https://cdn.buttercms.com/QQFdpmdKRHS9NlKqG5oU')",
        backgroundSize: "cover", backgroundPosition: "center 50%",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          background: "#fff", borderRadius: 20, padding: "24px 40px",
          textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 10,
        }}>
          <div style={{ background: KAVAK_BLUE, borderRadius: 12, padding: "10px 22px", display: "inline-block" }}>
            <KavakLogo dark={false} />
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#1a1a1a", letterSpacing: -0.5 }}>
            Sigue Tu Caso
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: "#999" }}>
            Selecciona cómo deseas ingresar
          </p>
        </div>
      </div>

      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "36px 16px 48px",
      }}>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center", width: "100%", maxWidth: 560 }}>

        <button onClick={onCliente} style={{
          flex: "1 1 220px", background: "#fff", border: "1px solid #e8e8e8",
          borderRadius: 16, padding: "28px 24px", cursor: "pointer", textAlign: "left",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          transition: "box-shadow 0.15s, transform 0.15s",
        }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.12)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)"; e.currentTarget.style.transform = "none"; }}
        >
          <div style={{
            width: 44, height: 44, borderRadius: 12, background: KAVAK_BLUE_LIGHT,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, marginBottom: 14,
          }}>👤</div>
          <p style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: "#1a1a1a" }}>Cliente Kavak</p>
          <p style={{ margin: 0, fontSize: 13, color: "#999", lineHeight: 1.4 }}>
            Consulta el estado de tu vehículo con tu número de caso o patente
          </p>
          <div style={{
            marginTop: 18, display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 13, fontWeight: 600, color: KAVAK_BLUE,
          }}>
            Consultar estado →
          </div>
        </button>

        <button onClick={onInterno} style={{
          flex: "1 1 220px", background: KAVAK_BLUE, border: "none",
          borderRadius: 16, padding: "28px 24px", cursor: "pointer", textAlign: "left",
          boxShadow: `0 2px 12px ${KAVAK_BLUE}40`,
          transition: "box-shadow 0.15s, transform 0.15s",
        }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 24px rgba(83,74,183,0.4)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 12px rgba(83,74,183,0.25)"; e.currentTarget.style.transform = "none"; }}
        >
          <div style={{
            width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, marginBottom: 14,
          }}>🔧</div>
          <p style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: "#fff" }}>Internos de Kavak</p>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.4 }}>
            Acceso al panel de gestión para el equipo de post-venta
          </p>
          <div style={{
            marginTop: 18, display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.9)",
          }}>
            Iniciar sesión →
          </div>
        </button>
      </div>
      </div>
    </div>
  );
}

// ── Login internos ────────────────────────────────────────────────

function LoginInterno({ onLogin, onVolver }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr]           = useState("");

  function handleLogin() {
    if (!email.trim()) { setErr("Ingresa tu correo"); return; }
    if (!email.trim().toLowerCase().endsWith("@kavak.com")) { setErr("Solo se permiten correos @kavak.com"); return; }
    if (password !== PANEL_PASSWORD) { setErr("Contraseña incorrecta"); return; }
    onLogin(email.trim().toLowerCase());
  }

  const inputStyle = {
    width: "100%", padding: "12px 14px", borderRadius: 10,
    border: "1px solid #e0e0e0", background: "#fafafa",
    color: "#1a1a1a", fontSize: 15, boxSizing: "border-box", outline: "none",
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#f8f9fa",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "32px 16px",
    }}>
      <div style={{
        width: "100%", maxWidth: 400, background: "#fff",
        borderRadius: 18, padding: "36px 32px",
        boxShadow: "0 4px 32px rgba(0,0,0,0.08)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            background: KAVAK_BLUE, borderRadius: 14, padding: "10px 24px",
            display: "inline-block", margin: "0 auto 16px",
          }}>
            <KavakLogo dark={false} />
          </div>
          <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700, color: "#1a1a1a" }}>
            Acceso internos
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: "#999" }}>Solo equipo Post-Venta Kavak</p>
        </div>

        <label style={{ fontSize: 13, color: "#666", display: "block", marginBottom: 6 }}>Correo Kavak</label>
        <input
          style={inputStyle}
          type="email"
          placeholder="nombre@kavak.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleLogin()}
        />
        <label style={{ fontSize: 13, color: "#666", display: "block", marginBottom: 6, marginTop: 14 }}>Contraseña</label>
        <input
          style={inputStyle}
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleLogin()}
        />
        {err && <p style={{ color: "#c0392b", fontSize: 13, margin: "8px 0 0" }}>{err}</p>}
        <button onClick={handleLogin} style={{
          width: "100%", padding: "12px 0", borderRadius: 10, border: "none",
          background: KAVAK_BLUE, color: "#fff", fontWeight: 600,
          cursor: "pointer", fontSize: 15, marginTop: 12,
        }}>
          Ingresar
        </button>

        <button onClick={onVolver} style={{
          width: "100%", marginTop: 14, background: "none", border: "none",
          cursor: "pointer", fontSize: 13, color: "#ccc", textDecoration: "underline",
        }}>← Volver al inicio</button>
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
                  borderLeft: `3px solid ${cfg.color || "#888"}`,
                  background: "#f8f7f4", borderRadius: "0 8px 8px 0", padding: "10px 14px",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <SubBadge subestado={subestado} principal={principal} />
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

function CasoCard({ caso, comentariosDeCaso, onAgregarComentario, onVerHistorial, alerta, colorBorde }) {
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

// ── Tab Pendientes ────────────────────────────────────────────────

function TabPendientes({ casos, comentariosMap, onAgregarComentario, onVerHistorial, onRefresh }) {
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
                  onAgregarComentario={onAgregarComentario} onVerHistorial={onVerHistorial}
                  alerta={alerta} colorBorde={false} />
              );
            })}
          </div>
      }
    </div>
  );
}

// ── Tab Backlog ───────────────────────────────────────────────────

function TabBacklog({ casos, comentariosMap, onAgregarComentario, onVerHistorial, onRefresh }) {
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
                onAgregarComentario={onAgregarComentario} onVerHistorial={onVerHistorial}
                alerta={null} colorBorde={true} />
            ))}
          </div>
      }
    </div>
  );
}

// ── Progreso cliente ──────────────────────────────────────────────

function ProgresoCliente({ historico, comentarios = [] }) {
  // Estado actual = último registro cronológico del historial
  // El historial llega ordenado asc por fecha_ingreso desde Supabase,
  // así que el último elemento siempre es el estado más reciente.
  // Para retrocesos: si el último registro no tiene fecha_listo → es el estado abierto actual.
  // Si todos tienen fecha_listo (caso raro) → igual usamos el último cronológico.
  const casoActual = historico[historico.length - 1];
  const ordenActual = getOrden(casoActual?.estado_operativo?.toUpperCase().trim());

  const normalizeKey = (k) => k === "PENDIENTE" ? "PENDIENTE DE DIAGNÓSTICO" : k;

  // Para cada subestado construimos:
  // - histActivo[k]: la fila SIN fecha_listo (estado abierto actual) si existe
  // - histMapFirst[k]: primera fila cronológica (para estados completados sin retroceso)
  // - histMapLast[k]: última fila cerrada (para fecha_listo de estados completados)
  // - histSet: todos los estados que aparecieron
  // - histAbierto: estados con al menos una fila sin fecha_listo
  const histActivo   = {}; // fila abierta (sin fecha_listo) por estado
  const histMapFirst = {}; // primera aparición cerrada
  const histMapLast  = {}; // última aparición (cerrada o abierta)
  const histSet      = new Set();
  const histAbierto  = new Set();

  for (const fila of historico) {
    const k = normalizeKey(fila.estado_operativo?.toUpperCase().trim());
    if (!k) continue;
    histSet.add(k);
    if (!fila.fecha_listo) {
      histAbierto.add(k);
      histActivo[k] = fila; // guardamos la fila abierta
    } else {
      if (!histMapFirst[k]) histMapFirst[k] = fila;
      histMapLast[k] = fila;
    }
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

  return (
    <div style={{ margin: "16px 0" }}>
      {grupos.map((grupo, gi) => {
        const cfg = ESTADOS[grupo.key];
        const grupoActivo   = grupo.subestados.some(s => getOrden(s.key) <= ordenActual);
        const grupoCompleto = grupo.subestados.every(s => getOrden(s.key) < ordenActual);

        return (
          <div key={grupo.key} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: grupoActivo ? cfg.color : "#f0f0f0",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 700, color: grupoActivo ? "#fff" : "#ccc", flexShrink: 0,
              }}>
                {grupoCompleto ? "✓" : gi + 1}
              </div>
              <span style={{ fontWeight: 600, fontSize: 14, color: grupoActivo ? cfg.text : "#ccc" }}>{grupo.label}</span>
              {grupoCompleto && (
                <span style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}`, borderRadius: 20, padding: "1px 8px", fontSize: 11, fontWeight: 500 }}>
                  Completado ✓
                </span>
              )}
            </div>
            <div style={{ marginLeft: 38, display: "flex", flexDirection: "column", gap: 5 }}>
              {grupo.subestados.map(s => {
                const ordenS     = getOrden(s.key);
                const completado = ordenS < ordenActual;
                const activo     = ordenS === ordenActual;
                // Si el estado está activo ahora (abierto): usar esa fila para fecha inicio
                // Si está completado: usar histMapFirst para inicio, histMapLast para fin
                // Si está retrocedido: usar histMapFirst para inicio, histMapLast para fin
                const filaActiva = histActivo[s.key];
                const filaFirst  = filaActiva || histMapFirst[s.key];
                const filaLast   = filaActiva ? null : histMapLast[s.key];
                // Retrocedido: existió en el historial, no es el actual, no es completado,
                // Y todas sus apariciones tienen fecha_listo (está cerrado)
                // Si tiene alguna fila sin fecha_listo → no es retrocedido, es relevante
                const retroced   = !completado && !activo && histSet.has(s.key) && !histAbierto.has(s.key);
                const tieneInfo  = completado || activo || retroced;
                const inicioStr  = filaFirst ? formatFechaHora(filaFirst.fecha_ingreso, filaFirst.hora_ingreso) : null;
                const listoStr   = filaLast  ? formatFechaHora(filaLast.fecha_listo,   filaLast.hora_listo)    : null;

                return (
                  <div key={s.key} style={{
                    display: "flex", flexDirection: "column",
                    padding: "7px 12px", borderRadius: 8,
                    background: activo ? cfg.bg : completado ? "#f8f8f8" : "#fafafa",
                    border: activo ? `1px solid ${cfg.border}` : "1px solid #f0f0f0",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                        background: completado ? cfg.color : activo ? cfg.color : "#ebebeb",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, color: completado || activo ? "#fff" : "#ccc", fontWeight: 700,
                      }}>
                        {completado ? "✓" : activo ? "●" : ""}
                      </div>
                      <span style={{
                        fontSize: 13, fontWeight: activo ? 600 : 400,
                        color: completado ? "#aaa" : activo ? cfg.text : "#ccc",
                        flex: 1,
                      }}>{s.label}</span>
                      {completado && (
                        <span style={{
                          background: cfg.bg, color: cfg.text,
                          border: `1px solid ${cfg.border}`,
                          borderRadius: 20, padding: "2px 9px", fontSize: 11, fontWeight: 500,
                        }}>Completado ✓</span>
                      )}
                      {activo && (
                        <span style={{
                          background: cfg.color, color: "#fff",
                          borderRadius: 20, padding: "2px 9px", fontSize: 11, fontWeight: 500,
                        }}>Estado actual</span>
                      )}
                    </div>
                    {(tieneInfo || retroced) && (inicioStr || listoStr) && (
                      <div style={{ marginTop: 8, marginLeft: 30, display: "flex", gap: 10, flexWrap: "wrap" }}>
                        {inicioStr && (
                          <span style={{
                            fontSize: 11,
                            color: retroced ? "#bbb" : cfg.text,
                            background: "#fff",
                            border: `1px solid ${retroced ? "#e0e0e0" : cfg.border}`,
                            borderRadius: 6, padding: "2px 8px",
                            textDecoration: retroced ? "line-through" : "none",
                          }}>
                            📅 Inicio: {inicioStr}
                          </span>
                        )}
                        {listoStr && (
                          <span style={{
                            fontSize: 11,
                            color: retroced ? "#bbb" : cfg.text,
                            background: "#fff",
                            border: `1px solid ${retroced ? "#e0e0e0" : cfg.border}`,
                            borderRadius: 6, padding: "2px 8px",
                            textDecoration: retroced ? "line-through" : "none",
                          }}>
                            ✅ Fin: {listoStr}
                          </span>
                        )}
                        {retroced && (
                          <span style={{ fontSize: 11, color: "#bbb", fontStyle: "italic" }}>
                            ↩ Retrocedido
                          </span>
                        )}
                      </div>
                    )}
                    {tieneInfo && comentMap[s.key] && comentMap[s.key].length > 0 && (
                      <div style={{ marginTop: 8, marginLeft: 30, display: "flex", flexDirection: "column", gap: 6 }}>
                        {comentMap[s.key].map(c => (
                          <div key={c.id} style={{
                            background: "#fff", border: `1px solid ${cfg.border}`,
                            borderLeft: `3px solid ${cfg.color}`,
                            borderRadius: "0 8px 8px 0", padding: "8px 12px",
                          }}>
                            <p style={{ margin: "0 0 3px", fontSize: 13, color: "#333" }}>💬 {c.comentario}</p>
                            <p style={{ margin: 0, fontSize: 11, color: "#bbb" }}>
                              {c.creado_por} · {formatDate(c.created_at)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {gi < grupos.length - 1 && (
              <div style={{ marginLeft: 13, width: 2, height: 10, background: grupoCompleto ? cfg.color : "#e8e8e8", marginTop: 4 }} />
            )}
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
          // Mostrar feedback si el vehículo fue entregado
          const esEntregado = hist.some(f => f.estado_operativo?.toUpperCase().trim() === "ENTREGADO A CLIENTE");
          if (esEntregado) setShowFeedback(true);
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

  return (
    <div style={{
      minHeight: modoInterno ? "unset" : "100vh",
      background: modoInterno ? "transparent" : "#f8f9fa",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: modoInterno ? "0" : "40px 16px 48px",
    }}>
      {!modoInterno && (
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ background: KAVAK_BLUE, borderRadius: 16, padding: "10px 24px", display: "inline-block", margin: "0 auto 12px" }}>
            <KavakLogo dark={false} />
          </div>
          <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 700, color: "#1a1a1a" }}>Seguimiento de mi vehículo</h1>
          <p style={{ margin: 0, fontSize: 14, color: "#888" }}>Ingresa tu número de caso o patente para ver el estado actual</p>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, width: "100%", maxWidth: 480, marginBottom: 28 }}>
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

          {comentarios.length > 0 && (
            <div style={{ background: KAVAK_BLUE_LIGHT, border: `1px solid ${KAVAK_BLUE}20`, borderRadius: 10, padding: "12px 14px", marginTop: 8 }}>
              <p style={{ margin: "0 0 6px", fontSize: 12, color: KAVAK_BLUE, fontWeight: 600 }}>💬 Última actualización del equipo</p>
              <p style={{ margin: "0 0 4px", fontSize: 14, color: "#333" }}>{comentarios[0].comentario}</p>
              <p style={{ margin: 0, fontSize: 11, color: "#bbb" }}>{formatDate(comentarios[0].created_at)}</p>
            </div>
          )}
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
            onVerHistorial={c => setModalHistorial(c)}
            onRefresh={load} />
        )}
        {tab === "pendientes" && (
          <TabPendientes casos={casos} comentariosMap={comentariosMap}
            onAgregarComentario={c => setModalComentario(c)}
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
