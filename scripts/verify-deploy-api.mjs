#!/usr/bin/env node
const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:3002';

async function req(path, init = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text.slice(0, 200);
  }
  return { status: res.status, body: json };
}

let failed = 0;

async function check(name, fn) {
  try {
    const result = await fn();
    const ok = result.ok;
    console.log(ok ? 'OK' : 'FAIL', name, result.detail ?? '');
    if (!ok) failed += 1;
  } catch (err) {
    console.log('FAIL', name, err.message);
    failed += 1;
  }
}

await check('health', async () => {
  const r = await req('/health');
  return {
    ok: r.status === 200 && r.body?.ok === true,
    detail: r,
  };
});

await check('register', async () => {
  const r = await req('/register', {
    method: 'POST',
    body: JSON.stringify({ id: 1001, first_name: 'DeployTest' }),
  });
  return {
    ok: r.status === 200 && r.body?.ok === true,
    detail: r,
  };
});

await check('booking', async () => {
  const r = await req('/booking', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Deploy Test',
      email: 'deploy@test.com',
      phone: '+491701234567',
      eventDate: '2026-12-01',
      venue: 'Test Club',
      city: 'Berlin',
      message: 'Automated deploy verification booking message',
    }),
  });
  const ok =
    r.status === 200 && r.body?.ok === true && Number(r.body?.notified) > 0;
  return { ok, detail: r };
});

process.exit(failed ? 1 : 0);
