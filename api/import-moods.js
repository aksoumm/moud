// api/import-moods.js
// Reçoit le db complet { moods: [...] } et écrase data.json sur GitHub

const GITHUB_TOKEN  = process.env.GITHUB_TOKEN;
const GITHUB_OWNER  = process.env.GITHUB_OWNER;
const GITHUB_REPO   = process.env.GITHUB_REPO;
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';
const API_SECRET    = process.env.API_SECRET;

const BASE = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-secret');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const secret = req.headers['x-api-secret'] || req.query.secret;
  if (API_SECRET && secret !== API_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const data = req.body;
  if (!data?.moods) return res.status(400).json({ error: 'Invalid data' });

  try {
    // Get current SHA
    const getRes = await fetch(`${BASE}/contents/data.json?ref=${GITHUB_BRANCH}`, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    let sha;
    if (getRes.ok) {
      const json = await getRes.json();
      sha = json.sha;
    }

    const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');

    const putRes = await fetch(`${BASE}/contents/data.json`, {
      method: 'PUT',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `import: ${data.moods.length} moods from Daylio`,
        content,
        sha,
        branch: GITHUB_BRANCH,
      }),
    });

    if (!putRes.ok) throw new Error(await putRes.text());

    return res.status(200).json({ ok: true, count: data.moods.length });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
