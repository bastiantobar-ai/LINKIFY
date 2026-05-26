// Mapa fijo email → Slack User ID
const SLACK_USER_MAP = {
  "luis.arrue@kavak.com":          "U038Q9CDJE4",
  "sebastian.inzunza@kavak.com":   "U075V8RS5H8",
  "hector.sanchezmunoz@kavak.com": "U098RKBM2NP",
  "dustin.reyes@kavak.com":        "U0ALFB5T2A3",
  "hugo.tapia1@kavak.com":         "U05UFQT796U",
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { numero_caso, patente, mensaje, estado, correo } = req.body;

  const SLACK_TOKEN      = process.env.VITE_SLACK_TOKEN;
  const SLACK_CHANNEL_ID = process.env.VITE_SLACK_CHANNEL_ID;

  // Resolver mención desde el mapa fijo
  const slackId = correo ? SLACK_USER_MAP[correo.trim().toLowerCase()] : null;
  const mencion = slackId ? `<@${slackId}>` : correo ? `_${correo}_` : "_sin asignar_";

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
