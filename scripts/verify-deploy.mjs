#!/usr/bin/env node
const BASE = process.env.BASE_URL ?? 'http://127.0.0.1';
const HOST = process.env.HOST_HEADER ?? 'shmidt01.ru';

async function req(path, init = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Host: HOST,
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text.slice(0, 120);
  }
  return { status: res.status, body: json };
}

const checks = [];

async function check(name, fn) {
  try {
    const result = await fn();
    const ok = result.ok !== false;
    checks.push({ name, ok, ...result });
    console.log(ok ? 'OK' : 'FAIL', name, result.detail ?? '');
  } catch (err) {
    checks.push({ name, ok: false, detail: String(err) });
    console.log('FAIL', name, err);
  }
}

await check('health', async () => {
  const r = await req('/api/health');
  return { ok: r.status === 200 && r.body?.ok === true, detail: r };
});

await check('register', async () => {
  const r = await req('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: 1001, first_name: 'DeployTest' }),
  });
  return { ok: r.status === 200 && r.body?.ok === true, detail: r };
});

await check('booking-endpoint', async () => {
  const r = await req('/api/booking', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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

await check('index-html', async () => {
  const r = await req('/');
  const ok = r.status === 200 && String(r.body).includes('id="root"');
  return { ok, detail: { status: r.status, hasRoot: ok } };
});

const failed = checks.filter((c) => !c.ok);
process.exit(failed.length ? 1 : 0);
