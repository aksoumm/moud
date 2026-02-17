const RESEND_KEY  = process.env.RESEND_API_KEY;
const TO_EMAIL    = process.env.TO_EMAIL;
const FROM_EMAIL  = process.env.FROM_EMAIL;
const APP_URL     = process.env.APP_URL;
const API_URL     = process.env.API_URL;
const API_SECRET  = process.env.API_SECRET;
const CRON_SECRET = process.env.CRON_SECRET;

const MOODS = [
  { label:'rad',   score:5, color:'#ff4e8e', emoji:'😄' },
  { label:'good',  score:4, color:'#ffc94a', emoji:'🙂' },
  { label:'meh',   score:3, color:'#ffaa80', emoji:'😐' },
  { label:'bad',   score:2, color:'#6ec6e6', emoji:'😔' },
  { label:'awful', score:1, color:'#a77fe6', emoji:'😩' },
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function buildEmail(date) {
  const btnHtml = MOODS.map(m => {
    const url = `${API_URL}/api/log-mood?date=${date}&mood=${m.score}&label=${m.label}&secret=${API_SECRET}&redirect`;
    return `<a href="${url}" style="display:inline-block;background:${m.color};color:#000;font-family:'Helvetica Neue',sans-serif;font-size:13px;font-weight:700;text-decoration:none;padding:14px 18px;border-radius:16px;text-align:center;min-width:56px;margin:4px">
      <div style="font-size:22px;margin-bottom:4px">${m.emoji}</div>${m.label}</a>`;
  }).join('');

  const dateFormatted = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday:'long', day:'numeric', month:'long'
  });

  return `<!DOCTYPE html><html>
<head><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0e0c1a;font-family:'Helvetica Neue',sans-serif">
  <div style="max-width:400px;margin:0 auto;padding:40px 24px">
    <div style="text-align:center;margin-bottom:32px">
      <div style="font-size:28px;font-weight:800;color:#f0eeff">Moud</div>
      <div style="font-size:13px;color:rgba(240,238,255,0.45);margin-top:4px">${dateFormatted}</div>
    </div>
    <div style="text-align:center;margin-bottom:28px">
      <div style="font-size:22px;font-weight:700;color:#f0eeff">How are you today?</div>
    </div>
    <div style="display:flex;justify-content:center;flex-wrap:wrap;margin-bottom:32px">${btnHtml}</div>
    <div style="text-align:center">
      <a href="${APP_URL}" style="font-size:12px;color:rgba(240,238,255,0.35);text-decoration:none">Open Moud →</a>
    </div>
  </div>
</body></html>`;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const secret = req.headers['x-cron-secret'];
  if (CRON_SECRET && secret !== CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const date = todayStr();
  const html = buildEmail(date);

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: TO_EMAIL,
        subject: 'Moud — How are you today?',
        html,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(err);
    }

    return res.status(200).json({ ok: true, date });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
