import { useState, useEffect, useCallback } from "react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ── Supabase Auth ─────────────────────────────────────────────────

async function authSignInWithOtp(email) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/otp`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, create_user: false }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.msg || err.message || "Error al enviar magic link");
  }
  return true;
}

async function authVerifyOtp(email, token) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, token, type: "magiclink" }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.msg || err.message || "Código inválido o expirado");
  }
  const data = await res.json();
  return data.access_token || null;
}

async function authSignOut(accessToken) {
  await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${accessToken}`,
    },
  });
}

// ── Estado map ───────────────────────────────────────────────────

const ESTADO_MAP = {
  "PENDIENTE DE DIAGNÓSTICO": { principal: "Diagnostico", subestado: "Pendiente de diagnóstico", orden: 0 },
  "DIAGNÓSTICO":              { principal: "Diagnostico", subestado: "En diagnóstico",            orden: 1 },
  "ESPERA DE REPUESTO":       { principal: "EnTrabajo",   subestado: "Espera de repuesto",        orden: 2 },
  "DISPONIBLE PARA TRABAJO":  { principal: "EnTrabajo",   subestado: "Disponible para trabajo",   orden: 3 },
  "TRABAJANDO":               { principal: "EnTrabajo",   subestado: "Trabajando",                orden: 4 },
  "PRUEBA DE RUTA":           { principal: "EnTrabajo",   subestado: "Prueba de ruta",            orden: 5 },
  "LISTO":                    { principal: "Listo",       subestado: "Listo",                     orden: 6 },
  "LISTO PARA ENTREGAR":      { principal: "Listo",       subestado: "Listo para entregar",       orden: 7 },
  "ENTREGADO A CLIENTE":      { principal: "Listo",       subestado: "Entregado a cliente",       orden: 8 },
};

const SUBESTADOS_ORDEN = [
  { key: "PENDIENTE DE DIAGNÓSTICO", label: "Pendiente de diagnóstico", principal: "Diagnostico" },
  { key: "DIAGNÓSTICO",              label: "En diagnóstico",           principal: "Diagnostico" },
  { key: "ESPERA DE REPUESTO",       label: "Espera de repuesto",       principal: "EnTrabajo"   },
  { key: "DISPONIBLE PARA TRABAJO",  label: "Disponible para trabajo",  principal: "EnTrabajo"   },
  { key: "TRABAJANDO",               label: "Trabajando",               principal: "EnTrabajo"   },
  { key: "PRUEBA DE RUTA",           label: "Prueba de ruta",           principal: "EnTrabajo"   },
  { key: "LISTO",                    label: "Listo",                    principal: "Listo"       },
  { key: "LISTO PARA ENTREGAR",      label: "Listo para entregar",      principal: "Listo"       },
  { key: "ENTREGADO A CLIENTE",      label: "Entregado a cliente",      principal: "Listo"       },
];

const ESTADOS = {
  Diagnostico: { label: "Diagnóstico", color: "#E24B4A", bg: "#FCEBEB", text: "#A32D2D", border: "#E24B4A30" },
  EnTrabajo:   { label: "En Trabajo",  color: "#EF9F27", bg: "#FAEEDA", text: "#633806", border: "#EF9F2730" },
  Listo:       { label: "Listo",       color: "#1D9E75", bg: "#E1F5EE", text: "#085041", border: "#1D9E7530" },
};

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
  const f = new Date(fecha).toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });
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

// ── API REST (usa token si disponible) ────────────────────────────

function supabaseFetch(path, options = {}, accessToken = null) {
  const url = `${SUPABASE_URL}/rest/v1/${path}`;
  const headers = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
    "Prefer": options.prefer || "return=representation",
    ...options.headers,
  };
  return fetch(url, { ...options, headers });
}

// bbdd_cc: solo lectura, sin token (para cliente) y con token (para interno)
async function getCasos(accessToken) {
  const res = await supabaseFetch("bbdd_cc?order=fecha_ingreso.desc,id_sistema.desc", {}, accessToken);
  if (!res.ok) throw new Error(await res.text());
  const todos = await res.json();
  const vistos = new Set();
  return todos.filter(c => {
    const key = c.patente?.toUpperCase().trim();
    if (!key || vistos.has(key)) return false;
    vistos.add(key);
    return true;
  });
}

async function getComentarios(accessToken) {
  const res = await supabaseFetch("comentarios?order=created_at.desc", {}, accessToken);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function addComentario(data, accessToken) {
  const res = await supabaseFetch("comentarios", {
    method: "POST",
    body: JSON.stringify(data),
  }, accessToken);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Portal cliente: historial completo por número de caso
async function getHistorialByNumero(numero) {
  const res = await supabaseFetch(`bbdd_cc?numero_caso=eq.${encodeURIComponent(numero)}&order=fecha_ingreso.asc,id_sistema.asc`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Portal cliente: historial completo por patente
async function getHistorialByPatente(patente) {
  const res = await supabaseFetch(`bbdd_cc?patente=eq.${encodeURIComponent(patente.toUpperCase())}&order=fecha_ingreso.asc,id_sistema.asc`);
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
    <div style={{
      minHeight: "100vh", background: "#f5f4f1",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "32px 16px",
    }}>
      {/* Logo / header */}
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18, background: "#534AB7",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 16px", fontSize: 30,
        }}>🚗</div>
        <h1 style={{ margin: "0 0 6px", fontSize: 26, fontWeight: 700, color: "#1a1a1a", letterSpacing: -0.5 }}>
          Post-Venta Kavak
        </h1>
        <p style={{ margin: 0, fontSize: 15, color: "#999" }}>
          Selecciona cómo deseas ingresar
        </p>
      </div>

      {/* Tarjetas */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center", width: "100%", maxWidth: 560 }}>

        {/* Cliente */}
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
            width: 44, height: 44, borderRadius: 12, background: "#EEEDFE",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, marginBottom: 14,
          }}>👤</div>
          <p style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: "#1a1a1a" }}>Cliente Kavak</p>
          <p style={{ margin: 0, fontSize: 13, color: "#999", lineHeight: 1.4 }}>
            Consulta el estado de tu vehículo con tu número de caso o patente
          </p>
          <div style={{
            marginTop: 18, display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 13, fontWeight: 600, color: "#534AB7",
          }}>
            Consultar estado →
          </div>
        </button>

        {/* Interno */}
        <button onClick={onInterno} style={{
          flex: "1 1 220px", background: "#534AB7", border: "none",
          borderRadius: 16, padding: "28px 24px", cursor: "pointer", textAlign: "left",
          boxShadow: "0 2px 12px rgba(83,74,183,0.25)",
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
  );
}

// ── Login internos (magic link) ───────────────────────────────────

function LoginInterno({ onLogin, onVolver }) {
  const [email, setEmail]       = useState("");
  const [step, setStep]         = useState("email"); // "email" | "code"
  const [code, setCode]         = useState("");
  const [loading, setLoading]   = useState(false);
  const [err, setErr]           = useState("");
  const [enviado, setEnviado]   = useState(false);

  async function handleSendLink() {
    const e = email.trim().toLowerCase();
    if (!e) { setErr("Ingresa tu correo"); return; }
    if (!e.endsWith("@kavak.com")) { setErr("Solo se permiten correos @kavak.com"); return; }
    setLoading(true); setErr("");
    try {
      await authSignInWithOtp(e);
      setEnviado(true);
      setStep("code");
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    if (!code.trim()) { setErr("Ingresa el código recibido"); return; }
    setLoading(true); setErr("");
    try {
      const token = await authVerifyOtp(email.trim().toLowerCase(), code.trim());
      if (token) {
        onLogin(token, email.trim().toLowerCase());
      } else {
        setErr("No se pudo verificar. Intenta de nuevo.");
      }
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: "100%", padding: "12px 14px", borderRadius: 10,
    border: "1px solid #e0e0e0", background: "#fafafa",
    color: "#1a1a1a", fontSize: 15, boxSizing: "border-box", outline: "none",
  };
  const btnPrimary = {
    width: "100%", padding: "12px 0", borderRadius: 10, border: "none",
    background: "#534AB7", color: "#fff", fontWeight: 600,
    cursor: loading ? "wait" : "pointer", fontSize: 15, marginTop: 12,
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#f5f4f1",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "32px 16px",
    }}>
      <div style={{
        width: "100%", maxWidth: 400, background: "#fff",
        borderRadius: 18, padding: "36px 32px",
        boxShadow: "0 4px 32px rgba(0,0,0,0.08)",
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, background: "#534AB7",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 12px", fontSize: 24,
          }}>🔧</div>
          <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700, color: "#1a1a1a" }}>
            {step === "email" ? "Acceso internos" : "Revisa tu correo"}
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: "#999" }}>
            {step === "email"
              ? "Ingresa tu correo @kavak.com"
              : `Ingresaste el código de 6 dígitos enviado a ${email}`}
          </p>
        </div>

        {step === "email" && (
          <>
            <label style={{ fontSize: 13, color: "#666", display: "block", marginBottom: 6 }}>Correo Kavak</label>
            <input
              style={inputStyle}
              type="email"
              placeholder="nombre@kavak.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSendLink()}
            />
            {err && <p style={{ color: "#c0392b", fontSize: 13, marginTop: 8, margin: "8px 0 0" }}>{err}</p>}
            <button onClick={handleSendLink} disabled={loading} style={btnPrimary}>
              {loading ? "Enviando..." : "Enviar magic link"}
            </button>
          </>
        )}

        {step === "code" && (
          <>
            <div style={{ background: "#E1F5EE", border: "1px solid #1D9E7530", borderRadius: 10, padding: "10px 14px", marginBottom: 18 }}>
              <p style={{ margin: 0, fontSize: 13, color: "#085041" }}>
                ✅ Magic link enviado. Revisa tu bandeja de entrada y copia el código de 6 dígitos.
              </p>
            </div>
            <label style={{ fontSize: 13, color: "#666", display: "block", marginBottom: 6 }}>Código de verificación</label>
            <input
              style={{ ...inputStyle, letterSpacing: 4, fontSize: 20, textAlign: "center" }}
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
              onKeyDown={e => e.key === "Enter" && handleVerify()}
            />
            {err && <p style={{ color: "#c0392b", fontSize: 13, marginTop: 8, margin: "8px 0 0" }}>{err}</p>}
            <button onClick={handleVerify} disabled={loading} style={btnPrimary}>
              {loading ? "Verificando..." : "Ingresar"}
            </button>
            <button onClick={() => { setStep("email"); setCode(""); setErr(""); }} style={{
              width: "100%", marginTop: 8, padding: "10px 0", borderRadius: 10,
              border: "1px solid #e0e0e0", background: "transparent",
              color: "#888", cursor: "pointer", fontSize: 13,
            }}>Reenviar código</button>
          </>
        )}

        <button onClick={onVolver} style={{
          width: "100%", marginTop: 14, background: "none", border: "none",
          cursor: "pointer", fontSize: 13, color: "#ccc", textDecoration: "underline",
        }}>← Volver al inicio</button>
      </div>
    </div>
  );
}

// ── Modal comentario ──────────────────────────────────────────────

function ModalComentario({ caso, onSave, onClose, accessToken }) {
  const { subestado, principal } = getMapped(caso.estado_operativo);
  const [comentario, setComentario] = useState("");
  const [creadoPor, setCreadoPor]   = useState("");
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
      }, accessToken);
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
          background: "#534AB7", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 14,
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
              <span style={{ fontSize: 12, color: "#aaa" }}>📍 {caso.ubicacion}</span>
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
            background: "#534AB7", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 500,
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
          { label: "Total activos", value: casos.filter(c => c.estado_operativo?.toUpperCase().trim() !== "ENTREGADO A CLIENTE").length, color: "#534AB7", bg: "#EEEDFE" },
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

function ProgresoCliente({ historico }) {
  const casoActual  = historico[historico.length - 1];
  const ordenActual = getOrden(casoActual?.estado_operativo?.toUpperCase().trim());

  const histMap = {};
  for (const fila of historico) {
    const k = fila.estado_operativo?.toUpperCase().trim();
    if (k) histMap[k] = fila;
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
                const fila       = histMap[s.key];
                const tieneInfo  = completado || activo;
                const inicioStr  = fila ? formatFechaHora(fila.fecha_ingreso, fila.hora_ingreso) : null;
                const listoStr   = fila ? formatFechaHora(fila.fecha_listo,   fila.hora_listo)   : null;

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
                        textDecoration: completado ? "line-through" : "none",
                        flex: 1,
                      }}>{s.label}</span>
                      {activo && (
                        <span style={{
                          background: cfg.color, color: "#fff",
                          borderRadius: 20, padding: "2px 9px", fontSize: 11, fontWeight: 500,
                        }}>Estado actual</span>
                      )}
                    </div>
                    {tieneInfo && (inicioStr || listoStr) && (
                      <div style={{ marginTop: 8, marginLeft: 30, display: "flex", gap: 10, flexWrap: "wrap" }}>
                        {inicioStr && (
                          <span style={{ fontSize: 11, color: cfg.text, background: "#fff", border: `1px solid ${cfg.border}`, borderRadius: 6, padding: "2px 8px" }}>
                            📅 Inicio: {inicioStr}
                          </span>
                        )}
                        {listoStr && (
                          <span style={{ fontSize: 11, color: cfg.text, background: "#fff", border: `1px solid ${cfg.border}`, borderRadius: 6, padding: "2px 8px" }}>
                            ✅ Fin: {listoStr}
                          </span>
                        )}
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

// ── Portal Cliente ────────────────────────────────────────────────

function PortalCliente({ onVolver }) {
  const [busqueda, setBusqueda]   = useState("");
  const [caso, setCaso]           = useState(null);
  const [historico, setHistorico] = useState([]);
  const [comentarios, setComentarios] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [err, setErr]             = useState("");

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
      }
    } catch (e) {
      setErr("Error al buscar: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  const mapped = caso ? getMapped(caso.estado_operativo) : null;
  const cfg    = mapped ? ESTADOS[mapped.principal] : null;

  return (
    <div style={{ minHeight: "100vh", background: "#f5f4f1", display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 16px 48px" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: "#534AB7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 26 }}>🚗</div>
        <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 700, color: "#1a1a1a" }}>Seguimiento de mi vehículo</h1>
        <p style={{ margin: 0, fontSize: 14, color: "#888" }}>Ingresa tu número de caso o patente para ver el estado actual</p>
      </div>

      <div style={{ display: "flex", gap: 10, width: "100%", maxWidth: 420, marginBottom: 28 }}>
        <input
          style={{ flex: 1, padding: "12px 16px", borderRadius: 12, border: "1px solid #e0e0e0", background: "#fff", color: "#1a1a1a", fontSize: 15, outline: "none" }}
          placeholder="Número de caso o patente"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          onKeyDown={e => e.key === "Enter" && buscar()}
        />
        <button onClick={buscar} disabled={loading} style={{
          padding: "12px 22px", borderRadius: 12, border: "none",
          background: "#534AB7", color: "#fff", fontWeight: 600,
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
          {caso.ubicacion && <p style={{ margin: "3px 0 0", fontSize: 13, color: "#bbb" }}>📍 {caso.ubicacion}</p>}

          <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 16, marginTop: 16 }}>
            <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600, color: "#555" }}>Estado del proceso</p>
            <ProgresoCliente historico={historico} />
          </div>

          {comentarios.length > 0 && (
            <div style={{ background: "#f0eefb", border: "1px solid #7F77DD30", borderRadius: 10, padding: "12px 14px", marginTop: 8 }}>
              <p style={{ margin: "0 0 6px", fontSize: 12, color: "#7F77DD", fontWeight: 600 }}>💬 Última actualización del equipo</p>
              <p style={{ margin: "0 0 4px", fontSize: 14, color: "#333" }}>{comentarios[0].comentario}</p>
              <p style={{ margin: 0, fontSize: 11, color: "#bbb" }}>{formatDate(comentarios[0].created_at)}</p>
            </div>
          )}
        </div>
      )}

      <button onClick={onVolver} style={{
        marginTop: 40, background: "none", border: "none", cursor: "pointer",
        fontSize: 12, color: "#ccc", textDecoration: "underline",
      }}>← Volver al inicio</button>
    </div>
  );
}

// ── Panel Interno ─────────────────────────────────────────────────

function PanelInterno({ accessToken, userEmail, onCerrarSesion }) {
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
        getCasos(accessToken),
        getComentarios(accessToken),
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
  }, [accessToken]);

  useEffect(() => { load(); }, [load]);

  const pendientesCount = casos.filter(c => {
    if (c.estado_operativo?.toUpperCase().trim() === "ENTREGADO A CLIENTE") return false;
    const comentariosDeCaso = comentariosMap[c.numero_caso] || [];
    const ultimo = comentariosDeCaso[0];
    return !ultimo || ultimo.estado?.toUpperCase().trim() !== c.estado_operativo?.toUpperCase().trim();
  }).length;

  async function handleCerrarSesion() {
    await authSignOut(accessToken).catch(() => {});
    onCerrarSesion();
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f5f4f1" }}>
      <div style={{
        background: "#fff", borderBottom: "1px solid #ececec",
        padding: "0 24px", display: "flex", alignItems: "center",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ padding: "14px 20px 14px 0", marginRight: 16, borderRight: "1px solid #ececec" }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: "#534AB7" }}>Post-Venta</span>
        </div>
        {[
          { key: "backlog", label: "Backlog" },
          { key: "pendientes", label: "Pendientes", badge: pendientesCount > 0 ? pendientesCount : null },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: "16px 18px", background: "none", border: "none", cursor: "pointer",
            fontSize: 14, fontWeight: tab === t.key ? 600 : 400,
            color: tab === t.key ? "#534AB7" : "#888",
            borderBottom: tab === t.key ? "2px solid #534AB7" : "2px solid transparent",
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
            <span style={{ fontSize: 12, color: "#aaa", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {userEmail}
            </span>
          )}
          <button onClick={handleCerrarSesion} style={{
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
      </div>

      {modalComentario && (
        <Modal title="Agregar comentario" onClose={() => setModalComentario(null)}>
          <ModalComentario caso={modalComentario} onSave={load} onClose={() => setModalComentario(null)} accessToken={accessToken} />
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
  // vista: "inicio" | "cliente" | "login" | "interno"
  const [vista, setVista]           = useState("inicio");
  const [accessToken, setAccessToken] = useState(null);
  const [userEmail, setUserEmail]   = useState("");

  function handleLogin(token, email) {
    setAccessToken(token);
    setUserEmail(email);
    setVista("interno");
  }

  function handleCerrarSesion() {
    setAccessToken(null);
    setUserEmail("");
    setVista("inicio");
  }

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
      onLogin={handleLogin}
      onVolver={() => setVista("inicio")}
    />
  );

  if (vista === "interno") return (
    <PanelInterno
      accessToken={accessToken}
      userEmail={userEmail}
      onCerrarSesion={handleCerrarSesion}
    />
  );
}
