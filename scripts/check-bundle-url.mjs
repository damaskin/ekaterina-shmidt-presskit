import fs from 'node:fs';
import path from 'node:path';

const assetsDir = path.join(process.cwd(), 'dist', 'assets');
const file = fs.readdirSync(assetsDir).find((name) => name.startsWith('index-') && name.endsWith('.js'));
const text = fs.readFileSync(path.join(assetsDir, file), 'utf8');
console.log('file:', file);
console.log('api/booking:', text.includes('api/booking'));
console.log('shmidt01.ru:', text.includes('shmidt01.ru'));
