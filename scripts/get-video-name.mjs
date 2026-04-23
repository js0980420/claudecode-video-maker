import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const contentPath = path.join(__dirname, '../src/content.ts');

// 讀取 content.ts 並用正則表達式抽出 videoName
const content = fs.readFileSync(contentPath, 'utf-8');
const match = content.match(/videoName:\s*["']([^"']+)["']/);

if (match && match[1]) {
  console.log(match[1]);
} else {
  console.error('無法從 content.ts 找到 videoName');
  process.exit(1);
}
