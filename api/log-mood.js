const GITHUB_TOKEN  = process.env.GITHUB_TOKEN;
const GITHUB_OWNER  = process.env.GITHUB_OWNER;
const GITHUB_REPO   = process.env.GITHUB_REPO;
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';
const API_SECRET    = process.env.API_SECRET;

const BASE = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`;

async function getFile() {
  const res = await fetch(`${BASE}/contents/data.json?ref=${GITHUB_BRANCH}`, {
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });
  if (!res.ok) throw new Error('Cannot fetch data.json');
  const json = await res.json();
  const content = Buffer.from(json.content, 'base64').toString('utf8');
  return { data: JSON.parse(content), sha: json.sha };
}

async function putFile(data, sha, message) {
  const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
  const res = await fetch(`${BASE}/contents/data.json`, {
    method: 'PUT',
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, content, sha, branch: GITHUB_BRANCH }),
  });
  if (!res.ok) throw new Error(`GitHub PUT failed: ${await res.text()}`);
  return res.json();
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-secret');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET depuis un lien email
  if (req.method === 'GET') {
    const { date, mood, label, secret } = req.query;
    if (API_SECRET && secret !== API_SECRET) return res.status(401).send('Unauthorized');
    if (!date || !label) return res.status(400).send('Missing params');
    try {
      const { data, sha } = await getFile();
      const idx = data.moods.findIndex(e => e.date === date);
      const entry = { date, mood: Number(mood), label };
      if (idx >= 0) data.moods[idx] = entry;
      else { data.moods.push(entry); data.moods.sort((a,b) => a.date.localeCompare(b.date)); }
      await putFile(data, sha, `mood: ${label} on ${date}`);
      return res.redirect(302, `${process.env.APP_URL}?mood=${label}&date=${date}`);
    } catch (err) {
      console.error(err);
      return res.status(500).send(err.message);
    }
  }

  if (req.method !== 'POST') return res.status(405).end();

  const secret = req.headers['x-api-secret'] || req.query.secret;
  if (API_SECRET && secret !== API_SECRET) return res.status(401).json({ error: 'Unauthorized' });

  const { date, mood, label } = req.body || {};
  if (!date || !label) return res.status(400).json({ error: 'Missing date or label' });

  try {
    const { data, sha } = await getFile();
    const idx = data.moods.findIndex(e => e.date === date);
    const entry = { date, mood: Number(mood), label };
    if (idx >= 0) data.moods[idx] = entry;
    else { data.moods.push(entry); data.moods.sort((a,b) => a.date.localeCompare(b.date)); }
    await putFile(data, sha, `mood: ${label} on ${date}`);
    return res.status(200).json({ ok: true, entry });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
