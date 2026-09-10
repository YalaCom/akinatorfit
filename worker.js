const ALLOWED_ORIGINS = new Set([
  'https://yalacom.github.io',
  'https://www.yalacom.github.io'
]);

function cors(request) {
  const origin = request.headers.get('Origin') || '';
  const allow = ALLOWED_ORIGINS.has(origin) ? origin : 'https://yalacom.github.io';
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin'
  };
}

function json(request, data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...cors(request) }
  });
}

function clampText(v, n = 120) { return String(v ?? '').slice(0, n); }
function normalizeAnswer(v) { return ['yes','probably_yes','unknown','probably_no','no'].includes(v) ? v : null; }

async function ensureSchema(env) {
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      person_id INTEGER NOT NULL,
      person_name TEXT NOT NULL,
      guessed_correctly INTEGER NOT NULL DEFAULT 0,
      answer_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS game_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id TEXT NOT NULL,
      trait_id TEXT NOT NULL,
      answer TEXT NOT NULL
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS confirmed_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id TEXT NOT NULL,
      person_id INTEGER NOT NULL,
      trait_id TEXT NOT NULL,
      answer TEXT NOT NULL
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS rejected_guesses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id TEXT NOT NULL,
      rejected_person_id INTEGER NOT NULL
    )`),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_games_person ON games(person_id)'),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_game_answers_game ON game_answers(game_id)'),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_confirmed_person_trait ON confirmed_answers(person_id, trait_id)'),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_rejected_game ON rejected_guesses(game_id)')
  ]);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(request) });

    try { await ensureSchema(env); }
    catch (e) { return json(request, { ok:false, error:'db_init_failed', detail:String(e?.message || e) }, 500); }

    if (url.pathname === '/api/health' && request.method === 'GET') {
      const row = await env.DB.prepare('SELECT COUNT(*) AS games FROM games').first();
      return json(request, { ok:true, db:true, games:row?.games || 0 });
    }

    if (url.pathname === '/api/model' && request.method === 'GET') {
      const person = Number(url.searchParams.get('person'));
      const params = [];
      let sql = `
        SELECT person_id, trait_id,
          SUM(CASE WHEN answer='yes' THEN 1 WHEN answer='probably_yes' THEN .75 WHEN answer='probably_no' THEN .25 ELSE 0 END) AS positive_weight,
          SUM(CASE WHEN answer='unknown' THEN 0 ELSE 1 END) AS known_weight,
          COUNT(*) AS samples
        FROM confirmed_answers
      `;
      if (Number.isFinite(person) && person > 0) { sql += ' WHERE person_id = ? '; params.push(person); }
      sql += ' GROUP BY person_id, trait_id';
      const res = await env.DB.prepare(sql).bind(...params).all();
      const rows = (res.results || []).map(r => ({
        person_id:r.person_id,
        trait_id:r.trait_id,
        samples:r.samples,
        probability:r.known_weight > 0 ? r.positive_weight / r.known_weight : 0.5
      }));
      return json(request, { ok:true, rows });
    }

    if (url.pathname === '/api/learn' && request.method === 'POST') {
      let body;
      try { body = await request.json(); } catch { return json(request, { ok:false, error:'bad_json' }, 400); }

      const personId = Number(body?.person_id);
      const personName = clampText(body?.person_name, 100);
      const guessedCorrectly = !!body?.guessed_correctly;
      const answers = Array.isArray(body?.answers) ? body.answers : [];
      const rejected = Array.isArray(body?.rejected_guesses) ? body.rejected_guesses : [];
      const gameId = /^[a-zA-Z0-9-]{8,80}$/.test(String(body?.game_id || '')) ? String(body.game_id) : crypto.randomUUID();
      if (!Number.isFinite(personId) || personId <= 0 || !personName || !answers.length) {
        return json(request, { ok:false, error:'invalid_payload' }, 400);
      }

      const existing = await env.DB.prepare('SELECT id FROM games WHERE id=?').bind(gameId).first();
      if (existing) return json(request, { ok:true, game_id:gameId, learned:guessedCorrectly, duplicate:true });

      await env.DB.prepare(`INSERT INTO games (id, person_id, person_name, guessed_correctly, answer_count, created_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))`).bind(gameId, personId, personName, guessedCorrectly ? 1 : 0, answers.length).run();

      const statements = [];
      for (const item of answers.slice(0, 100)) {
        const traitId = clampText(item?.trait_id, 100);
        const answer = normalizeAnswer(item?.answer);
        if (!traitId || !answer) continue;
        statements.push(env.DB.prepare('INSERT INTO game_answers (game_id, trait_id, answer) VALUES (?, ?, ?)').bind(gameId, traitId, answer));
        if (guessedCorrectly) statements.push(env.DB.prepare('INSERT INTO confirmed_answers (game_id, person_id, trait_id, answer) VALUES (?, ?, ?, ?)').bind(gameId, personId, traitId, answer));
      }
      for (const id of rejected.slice(0, 20)) {
        const rejectedId = Number(id);if(!Number.isFinite(rejectedId)||rejectedId<=0)continue;
        statements.push(env.DB.prepare('INSERT INTO rejected_guesses (game_id, rejected_person_id) VALUES (?, ?)').bind(gameId,rejectedId));
      }
      if (statements.length) await env.DB.batch(statements);
      return json(request, { ok:true, game_id:gameId, learned:guessedCorrectly, answers:answers.length, rejected:rejected.length });
    }

    return json(request, { ok:false, error:'not_found' }, 404);
  }
};
