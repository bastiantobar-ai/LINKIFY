export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { numero_caso, patente, mensaje, estado, correo } = req.body;

  const SLACK_TOKEN      = process.env.VITE_SLACK_TOKEN;
  const SLACK_CHANNEL_ID = process.env.VITE_SLACK_CHANNEL_ID;

  // 1. Resolver Slack User ID desde el correo
  let mencion = correo ? `_${correo}_` : "_sin asignar_";
  if (correo) {
    try {
      const r = await fetch(
        `https://slack.com/api/users.lookupByEmail?email=${encodeURIComponent(correo)}`,
        { headers: { Authorization: `Bearer ${SLACK_TOKEN}` } }
      );
      const d = await r.json();
      if (d.ok && d.user?.id) mencion = `<@${d.user.id}>`;
    } catch (e) {
      console.warn("Slack lookup error:", e.message);
    }
  }

  // 2. Armar y enviar mensaje
  const texto =
    "🚨 *Un cliente quiere ser contactado — Sigue Tu Caso*\n\n" +
    `*Número caso:* ${numero_caso || "_sin dato_"}\n` +
    `*Patente:* ${patente || "_sin dato_"}\n` +
    `*Mensaje:* ${mensaje || "_sin dato_"}\n` +
    `*Estado:* ${estado || "_sin dato_"}\n` +
    `*Fecha:* ${new Date().toLocaleString("es-CL")}\n` +
    `*Responsable:* ${mencion}`;

  try {
    const r = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${SLACK_TOKEN}` },
      body: JSON.stringify({ channel: SLACK_CHANNEL_ID, text: texto }),
    });
    const d = await r.json();
    return res.status(200).json({ ok: d.ok, error: d.error || null });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}
