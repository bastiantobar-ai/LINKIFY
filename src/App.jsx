import { useState, useEffect, useCallback } from "react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Mapeo de estado_operativo de bbdd_cc a estado principal y subestado
const ESTADO_MAP = {
  "PENDIENTE DE DIAGNOSTICO": { principal: "Diagnostico", subestado: "Pendiente de diagnóstico" },
  "EN DIAGNOSTICO":           { principal: "Diagnostico", subestado: "En diagnóstico" },
  "EN ESPERA REPUESTOS":      { principal: "EnTrabajo",   subestado: "En espera repuestos" },
  "DISPONIBLE PARA TRABAJO":  { principal: "EnTrabajo",   subestado: "Disponible para trabajo" },
  "TRABAJANDO":               { principal: "EnTrabajo",   subestado: "Trabajando" },
  "PRUEBA DE RUTA":           { principal: "EnTrabajo",   subestado: "Prueba de ruta" },
  "LISTO":                    { principal: "Listo",       subestado: "Listo para entregar" },
  "ENTREGADO A CLIENTE":      { principal: "Listo",       subestado: "Entregado" },
};

const ESTADOS = {
  Diagnostico: { label: "Diagnóstico", color: "#7F77DD", bg: "#EEEDFE", text: "#3C3489" },
  EnTrabajo:   { label: "En Trabajo",  color: "#EF9F27", bg: "#FAEEDA", text: "#633806" },
  Listo:       { label: "Listo",       color: "#1D9E75", bg: "#E1F5EE", text: "#085041" },
};

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
  const res = await supabaseFetch("bbdd_cc?order=id_sistema.asc");
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function getComentarios() {
  const res = await supabaseFetch("comentarios?order=created_at.desc");
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

async function getCasoByNumero(numero) {
  const res = await supabaseFetch(`bbdd_cc?numero_caso=eq.${encodeURIComponent(numero)}&limit=1`);
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data[0] || null;
}

async function getComentariosByCaso(numero) {
  const res = await supabaseFetch(`comentarios?numero_caso=eq.${encodeURIComponent(numero)}&order=created_at.desc`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function getMapped(estadoOperativo) {
  return ESTADO_MAP[estadoOperativo?.toUpperCase()] || { principal: "Diagnostico", subestado: estadoOperativo };
}

function haceHoras(fecha) {
  if (!fecha) return 999;
  return (Date.now() - new Date(fecha).getTime()) / (1000 * 60 * 60);
}

function formatDate(d) {
  if (!d) return "-";
  return new Date(d).toLocaleString("es-CL", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ── Componentes UI ──────────────────────────────────────────────

function Badge({ principal }) {
  const cfg = ESTADOS[principal];
  if (!cfg) return null;
  return (
    <span style={{
      background: cfg.bg, color: cfg.text,
      border: `1px solid ${cfg.color}40`,
      borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 500,
    }}>{cfg.label}</span>
  );
}

function SubBadge({ subestado, principal }) {
  const cfg = ESTADOS[principal] || {};
  return (
    <span style={{
      background: cfg.bg || "#f1efe8", color: cfg.text || "#444",
      border: `1px solid ${(cfg.color || "#888")}30`,
      borderRadius: 6, padding: "2px 9px", fontSize: 11,
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
        background: "#fff", borderRadius: 14, padding: "28px 32px",
        minWidth: 420, maxWidth: 540, width: "90vw",
        border: "1px solid #e5e5e5", maxHeight: "85vh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 500 }}>{title}</h2>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 20, color: "#888" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Modal para agregar comentario ───────────────────────────────

function ModalComentario({ caso, estadoActual, onSave, onClose }) {
  const { subestado } = getMapped(estadoActual);
  const [comentario, setComentario] = useState("");
  const [creadoPor, setCreadoPor] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function handleSave() {
    if (!comentario.trim()) { setErr("El comentario no puede estar vacío"); return; }
    setSaving(true); setErr("");
    try {
      await addComentario({
        numero_caso: caso.numero_caso,
        estado: estadoActual,
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
    width: "100%", padding: "8px 10px", borderRadius: 8,
    border: "1px solid #ddd", background: "#f8f7f4",
    color: "#1a1a1a", fontSize: 14, boxSizing: "border-box",
  };
  const labelStyle = { fontSize: 13, color: "#666", display: "block", marginBottom: 4, marginTop: 12 };

  return (
    <div>
      <div style={{ background: "#f8f7f4", borderRadius: 10, padding: "10px 14px", marginBottom: 4 }}>
        <p style={{ margin: 0, fontSize: 13, color: "#666" }}>Caso <strong>#{caso.numero_caso}</strong> · Patente <strong>{caso.patente}</strong></p>
        <p style={{ margin: "4px 0 0", fontSize: 13 }}>Estado actual: <SubBadge subestado={subestado} principal={getMapped(estadoActual).principal} /></p>
      </div>
      <label style={labelStyle}>Tu nombre</label>
      <input style={inputStyle} value={creadoPor} onChange={e => setCreadoPor(e.target.value)} placeholder="Ej: Juan Pérez" />
      <label style={labelStyle}>Comentario *</label>
      <textarea
        style={{ ...inputStyle, minHeight: 90, resize: "vertical" }}
        value={comentario}
        onChange={e => setComentario(e.target.value)}
        placeholder="Describe el estado actual del vehículo..."
      />
      {err && <p style={{ color: "#c0392b", fontSize: 13, marginTop: 6 }}>{err}</p>}
      <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
        <button onClick={handleSave} disabled={saving} style={{
          flex: 1, padding: "9px 0", borderRadius: 8, border: "none",
          background: "#534AB7", color: "#fff", fontWeight: 500, cursor: "pointer", fontSize: 14,
        }}>{saving ? "Guardando..." : "Guardar comentario"}</button>
        <button onClick={onClose} style={{
          flex: 1, padding: "9px 0", borderRadius: 8,
          border: "1px solid #ddd", background: "transparent",
          color: "#1a1a1a", cursor: "pointer", fontSize: 14,
        }}>Cancelar</button>
      </div>
    </div>
  );
}

// ── Historial de comentarios ────────────────────────────────────

function HistorialComentarios({ caso, comentariosDeCaso, onClose }) {
  return (
    <div>
      <p style={{ margin: "0 0 16px", fontSize: 13, color: "#666" }}>
        Caso <strong>#{caso.numero_caso}</strong> · Patente <strong>{caso.patente}</strong>
      </p>
      {comentariosDeCaso.length === 0
        ? <p style={{ color: "#888", textAlign: "center", padding: "20px 0" }}>Sin comentarios aún</p>
        : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {comentariosDeCaso.map(c => {
              const mapped = getMapped(c.estado);
              const cfg = ESTADOS[mapped.principal] || {};
              return (
                <div key={c.id} style={{
                  borderLeft: `3px solid ${cfg.color || "#888"}`,
                  background: "#f8f7f4", borderRadius: "0 8px 8px 0",
                  padding: "10px 14px",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                    <SubBadge subestado={mapped.subestado} principal={mapped.principal} />
                    <span style={{ fontSize: 11, color: "#888" }}>{formatDate(c.created_at)}</span>
                  </div>
                  <p style={{ margin: "6px 0 2px", fontSize: 14 }}>{c.comentario}</p>
                  {c.creado_por && <p style={{ margin: 0, fontSize: 12, color: "#888" }}>— {c.creado_por}</p>}
                </div>
              );
            })}
          </div>
        )
      }
      <button onClick={onClose} style={{
        marginTop: 18, width: "100%", padding: "9px 0", borderRadius: 8,
        border: "1px solid #ddd", background: "transparent",
        color: "#1a1a1a", cursor: "pointer", fontSize: 14,
      }}>Cerrar</button>
    </div>
  );
}

// ── Tarjeta de caso ─────────────────────────────────────────────

function CasoCard({ caso, comentariosDeCaso, onAgregarComentario, onVerHistorial, alerta }) {
  const { principal, subestado } = getMapped(caso.estado_operativo);
  const cfg = ESTADOS[principal] || {};
  const ultimoComentario = comentariosDeCaso[0];

  return (
    <div style={{
      background: "#fff",
      border: `0.5px solid ${alerta === "urgente" ? "#E24B4A60" : alerta === "advertencia" ? "#EF9F2760" : "#e5e5e5"}`,
      borderLeft: `3px solid ${cfg.color || "#888"}`,
      borderRadius: 10, padding: "12px 14px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
            <span style={{ fontWeight: 500, fontSize: 14 }}>#{caso.numero_caso}</span>
            <span style={{ fontSize: 14, color: "#444" }}>·</span>
            <span style={{ fontSize: 14, fontWeight: 500 }}>{caso.patente}</span>
            <Badge principal={principal} />
            <SubBadge subestado={subestado} principal={principal} />
            {alerta === "urgente" && (
              <span style={{ background: "#FAEEDA", color: "#633806", border: "1px solid #EF9F2740", borderRadius: 6, padding: "2px 8px", fontSize: 11 }}>
                ⏰ Actualizar comentario
              </span>
            )}
            {alerta === "advertencia" && (
              <span style={{ background: "#FCEBEB", color: "#A32D2D", border: "1px solid #E24B4A40", borderRadius: 6, padding: "2px 8px", fontSize: 11 }}>
                ⚠ Sin comentario
              </span>
            )}
          </div>
          {ultimoComentario
            ? <p style={{ margin: "2px 0 0", fontSize: 13, color: "#555" }}>
                💬 {ultimoComentario.comentario}
                <span style={{ color: "#999", marginLeft: 6, fontSize: 12 }}>— {ultimoComentario.creado_por} · {formatDate(ultimoComentario.created_at)}</span>
              </p>
            : <p style={{ margin: "2px 0 0", fontSize: 13, color: "#aaa" }}>Sin comentarios</p>
          }
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          {comentariosDeCaso.length > 0 && (
            <button onClick={() => onVerHistorial(caso)} style={{
              padding: "5px 10px", borderRadius: 7, border: "1px solid #ddd",
              background: "transparent", cursor: "pointer", fontSize: 12, color: "#555",
            }}>Historial ({comentariosDeCaso.length})</button>
          )}
          <button onClick={() => onAgregarComentario(caso)} style={{
            padding: "5px 12px", borderRadius: 7, border: "none",
            background: "#534AB7", color: "#fff", cursor: "pointer", fontSize: 12,
          }}>+ Comentario</button>
        </div>
      </div>
    </div>
  );
}

// ── Tab Pendientes ──────────────────────────────────────────────

function TabPendientes({ casos, comentariosMap, onAgregarComentario, onVerHistorial, onRefresh }) {
  const pendientes = casos.filter(c => {
    const comentariosDeCaso = comentariosMap[c.numero_caso] || [];
    const ultimoComentario = comentariosDeCaso[0];
    // Pendiente si no tiene comentario con el estado actual
    const sinComentarioActual = !ultimoComentario || ultimoComentario.estado !== c.estado_operativo;
    return sinComentarioActual;
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 500 }}>Pendientes</h2>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "#666" }}>
            Casos con cambio de estado sin comentario — {pendientes.length} caso{pendientes.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button onClick={onRefresh} style={{
          padding: "7px 14px", borderRadius: 8, border: "1px solid #ddd",
          background: "transparent", cursor: "pointer", fontSize: 13,
        }}>↻ Actualizar</button>
      </div>
      {pendientes.length === 0
        ? <p style={{ color: "#888", textAlign: "center", marginTop: 40, fontSize: 14 }}>No hay casos pendientes 🎉</p>
        : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {pendientes.map(c => {
              const comentariosDeCaso = comentariosMap[c.numero_caso] || [];
              const ultimoComentario = comentariosDeCaso[0];
              const sinComentario = !ultimoComentario;
              const horas = sinComentario ? haceHoras(null) : haceHoras(ultimoComentario?.created_at);
              const alerta = sinComentario
                ? (horas < 3 ? "urgente" : "advertencia")
                : "urgente";
              return (
                <CasoCard
                  key={c.id_sistema}
                  caso={c}
                  comentariosDeCaso={comentariosDeCaso}
                  onAgregarComentario={onAgregarComentario}
                  onVerHistorial={onVerHistorial}
                  alerta={alerta}
                />
              );
            })}
          </div>
        )
      }
    </div>
  );
}

// ── Tab Backlog ─────────────────────────────────────────────────

function TabBacklog({ casos, comentariosMap, onAgregarComentario, onVerHistorial, onRefresh }) {
  const [filtro, setFiltro] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");

  const backlog = casos.filter(c => {
    if (c.estado_operativo?.toUpperCase() === "ENTREGADO A CLIENTE") return false;
    const { principal } = getMapped(c.estado_operativo);
    if (filtro !== "Todos" && principal !== filtro) return false;
    if (busqueda) {
      const q = busqueda.toLowerCase();
      if (!c.numero_caso?.toString().toLowerCase().includes(q) &&
          !c.patente?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const inputStyle = {
    padding: "7px 10px", borderRadius: 8, border: "1px solid #ddd",
    background: "#f8f7f4", color: "#1a1a1a", fontSize: 13,
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 500 }}>Backlog</h2>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "#666" }}>Todos los casos activos — {backlog.length} resultado{backlog.length !== 1 ? "s" : ""}</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            style={{ ...inputStyle, width: 180 }}
            placeholder="Buscar caso o patente..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
          <select style={inputStyle} value={filtro} onChange={e => setFiltro(e.target.value)}>
            <option value="Todos">Todos los estados</option>
            {Object.entries(ESTADOS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <button onClick={onRefresh} style={{
            padding: "7px 14px", borderRadius: 8, border: "1px solid #ddd",
            background: "transparent", cursor: "pointer", fontSize: 13,
          }}>↻</button>
        </div>
      </div>
      {backlog.length === 0
        ? <p style={{ color: "#888", textAlign: "center", marginTop: 40, fontSize: 14 }}>Sin casos para mostrar</p>
        : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {backlog.map(c => (
              <CasoCard
                key={c.id_sistema}
                caso={c}
                comentariosDeCaso={comentariosMap[c.numero_caso] || []}
                onAgregarComentario={onAgregarComentario}
                onVerHistorial={onVerHistorial}
                alerta={null}
              />
            ))}
          </div>
        )
      }
    </div>
  );
}

// ── Tab Portal Cliente ──────────────────────────────────────────

function ProgresoCliente({ principal }) {
  const orden = ["Diagnostico", "EnTrabajo", "Listo"];
  const actual = orden.indexOf(principal);
  return (
    <div style={{ display: "flex", alignItems: "center", margin: "24px 0" }}>
      {orden.map((key, i) => {
        const cfg = ESTADOS[key];
        const activo = i <= actual;
        const esActual = i === actual;
        return (
          <div key={key} style={{ display: "flex", alignItems: "center", flex: i < 2 ? 1 : 0 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: activo ? cfg.color : "#eee",
                border: `2px solid ${activo ? cfg.color : "#ccc"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 500, fontSize: 16,
                color: activo ? "#fff" : "#999",
                boxShadow: esActual ? `0 0 0 4px ${cfg.color}30` : "none",
              }}>
                {i < actual ? "✓" : i + 1}
              </div>
              <span style={{ fontSize: 12, fontWeight: esActual ? 500 : 400, color: activo ? cfg.text : "#999", textAlign: "center" }}>
                {cfg.label}
              </span>
            </div>
            {i < 2 && <div style={{
              flex: 1, height: 2,
              background: i < actual ? cfg.color : "#e0e0e0",
              margin: "0 4px", marginBottom: 24,
            }} />}
          </div>
        );
      })}
    </div>
  );
}

function TabClientes() {
  const [numeroCaso, setNumeroCaso] = useState("");
  const [caso, setCaso] = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [buscado, setBuscado] = useState(false);

  async function buscar() {
    if (!numeroCaso.trim()) return;
    setLoading(true); setErr(""); setCaso(null); setComentarios([]);
    try {
      const res = await getCasoByNumero(numeroCaso.trim());
      if (!res) { setErr("No se encontró ningún caso con ese número."); }
      else {
        setCaso(res);
        const comms = await getComentariosByCaso(res.numero_caso);
        setComentarios(comms);
      }
      setBuscado(true);
    } catch (e) {
      setErr("Error al buscar: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  const mapped = caso ? getMapped(caso.estado_operativo) : null;
  const cfg = mapped ? ESTADOS[mapped.principal] : null;

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 500 }}>Seguimiento de mi vehículo</h2>
        <p style={{ margin: 0, fontSize: 14, color: "#666" }}>Ingresa tu número de caso para ver el estado actual</p>
      </div>
      <div style={{ display: "flex", gap: 10, maxWidth: 420, margin: "0 auto 24px" }}>
        <input
          style={{
            flex: 1, padding: "10px 14px", borderRadius: 10,
            border: "1px solid #ddd", background: "#f8f7f4",
            color: "#1a1a1a", fontSize: 15,
          }}
          placeholder="Número de caso"
          value={numeroCaso}
          onChange={e => setNumeroCaso(e.target.value)}
          onKeyDown={e => e.key === "Enter" && buscar()}
        />
        <button onClick={buscar} disabled={loading} style={{
          padding: "10px 20px", borderRadius: 10, border: "none",
          background: "#534AB7", color: "#fff", fontWeight: 500,
          cursor: loading ? "wait" : "pointer", fontSize: 14,
        }}>{loading ? "..." : "Buscar"}</button>
      </div>

      {err && <p style={{ color: "#c0392b", textAlign: "center", fontSize: 14 }}>{err}</p>}

      {caso && cfg && mapped && (
        <div style={{
          maxWidth: 520, margin: "0 auto",
          background: "#fff", border: "1px solid #e5e5e5",
          borderTop: `3px solid ${cfg.color}`,
          borderRadius: 14, padding: "24px 28px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div>
              <p style={{ margin: 0, fontSize: 13, color: "#666" }}>Caso</p>
              <p style={{ margin: "2px 0 0", fontSize: 22, fontWeight: 500 }}>#{caso.numero_caso}</p>
              <p style={{ margin: "4px 0 0", fontSize: 14, color: "#555" }}>🚗 {caso.patente}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <Badge principal={mapped.principal} />
              <div style={{ marginTop: 6 }}><SubBadge subestado={mapped.subestado} principal={mapped.principal} /></div>
            </div>
          </div>

          <ProgresoCliente principal={mapped.principal} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div style={{ background: "#f8f7f4", borderRadius: 10, padding: "12px 14px" }}>
              <p style={{ margin: 0, fontSize: 12, color: "#666" }}>Fecha listo</p>
              <p style={{ margin: "4px 0 0", fontSize: 14, fontWeight: 500 }}>{formatDate(caso.fecha_listo)}</p>
            </div>
            <div style={{ background: "#f8f7f4", borderRadius: 10, padding: "12px 14px" }}>
              <p style={{ margin: 0, fontSize: 12, color: "#666" }}>Ubicación</p>
              <p style={{ margin: "4px 0 0", fontSize: 14, fontWeight: 500 }}>{caso.ubicacion || "-"}</p>
            </div>
          </div>

          {comentarios.length > 0 && (
            <div>
              <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 500, color: "#444" }}>Historial de actualizaciones</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {comentarios.map(c => {
                  const m = getMapped(c.estado);
                  const cc = ESTADOS[m.principal] || {};
                  return (
                    <div key={c.id} style={{
                      borderLeft: `3px solid ${cc.color || "#888"}`,
                      background: "#f8f7f4", borderRadius: "0 8px 8px 0",
                      padding: "8px 12px",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <SubBadge subestado={m.subestado} principal={m.principal} />
                        <span style={{ fontSize: 11, color: "#999" }}>{formatDate(c.created_at)}</span>
                      </div>
                      <p style={{ margin: "4px 0 2px", fontSize: 13 }}>{c.comentario}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── App principal ───────────────────────────────────────────────

export default function App() {
  const [tab, setTab] = useState("backlog");
  const [casos, setCasos] = useState([]);
  const [comentariosMap, setComentariosMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [errConn, setErrConn] = useState("");
  const [modalComentario, setModalComentario] = useState(null);
  const [modalHistorial, setModalHistorial] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [casosData, comentariosData] = await Promise.all([getCasos(), getComentarios()]);
      setCasos(casosData);
      // Agrupar comentarios por numero_caso
      const map = {};
      for (const c of comentariosData) {
        if (!map[c.numero_caso]) map[c.numero_caso] = [];
        map[c.numero_caso].push(c);
      }
      setComentariosMap(map);
      setErrConn("");
    } catch (e) {
      setErrConn("No se pudo conectar a Supabase. Revisa las variables de entorno.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const pendientesCount = casos.filter(c => {
    const comentariosDeCaso = comentariosMap[c.numero_caso] || [];
    const ultimo = comentariosDeCaso[0];
    return !ultimo || ultimo.estado !== c.estado_operativo;
  }).length;

  const tabs = [
    { key: "pendientes", label: "Pendientes", badge: pendientesCount > 0 ? pendientesCount : null },
    { key: "backlog", label: "Backlog" },
    { key: "clientes", label: "Portal Cliente" },
  ];

  return (
    <div style={{ padding: "20px 16px", maxWidth: 820, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 500 }}>Post-Venta</h1>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "#666" }}>Seguimiento de casos · {casos.length} registros</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {loading && <span style={{ fontSize: 13, color: "#888" }}>Cargando...</span>}
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background: errConn ? "#E24B4A" : "#1D9E75",
          }} title={errConn || "Conectado a Supabase"} />
        </div>
      </div>

      {errConn && (
        <div style={{ background: "#FCEBEB", border: "1px solid #E24B4A40", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#A32D2D" }}>
          ⚠ {errConn}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #e5e5e5", marginBottom: 20, gap: 4 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: "8px 16px", background: "none", border: "none", cursor: "pointer",
            fontSize: 14, fontWeight: tab === t.key ? 500 : 400,
            color: tab === t.key ? "#534AB7" : "#666",
            borderBottom: tab === t.key ? "2px solid #534AB7" : "2px solid transparent",
            display: "flex", alignItems: "center", gap: 6, marginBottom: -1,
          }}>
            {t.label}
            {t.badge && (
              <span style={{
                background: "#FCEBEB", color: "#A32D2D",
                borderRadius: 10, padding: "1px 7px", fontSize: 11, fontWeight: 500,
              }}>{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* Contenido */}
      {tab === "pendientes" && (
        <TabPendientes
          casos={casos}
          comentariosMap={comentariosMap}
          onAgregarComentario={c => setModalComentario(c)}
          onVerHistorial={c => setModalHistorial(c)}
          onRefresh={load}
        />
      )}
      {tab === "backlog" && (
        <TabBacklog
          casos={casos}
          comentariosMap={comentariosMap}
          onAgregarComentario={c => setModalComentario(c)}
          onVerHistorial={c => setModalHistorial(c)}
          onRefresh={load}
        />
      )}
      {tab === "clientes" && <TabClientes />}

      {/* Modal comentario */}
      {modalComentario && (
        <Modal title="Agregar comentario" onClose={() => setModalComentario(null)}>
          <ModalComentario
            caso={modalComentario}
            estadoActual={modalComentario.estado_operativo}
            onSave={load}
            onClose={() => setModalComentario(null)}
          />
        </Modal>
      )}

      {/* Modal historial */}
      {modalHistorial && (
        <Modal title={`Historial · Caso #${modalHistorial.numero_caso}`} onClose={() => setModalHistorial(null)}>
          <HistorialComentarios
            caso={modalHistorial}
            comentariosDeCaso={comentariosMap[modalHistorial.numero_caso] || []}
            onClose={() => setModalHistorial(null)}
          />
        </Modal>
      )}
    </div>
  );
}
