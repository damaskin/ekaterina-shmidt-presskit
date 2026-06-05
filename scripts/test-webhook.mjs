import { readFileSync } from 'node:fs';

const payload = JSON.parse(readFileSync(process.argv[2] ?? '/tmp/test-webhook.json', 'utf8'));
const res = await fetch('http://127.0.0.1:3002/webhook', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});
console.log('status', res.status, await res.text());
