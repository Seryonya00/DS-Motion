// Только для сервера: Google Drive, хранилище настроек, авторизация админки.
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { unstable_cache } from 'next/cache';
import { DEFAULT_SITE, mergeSettings, sortBy } from './shared';

/* ---------- Google Drive ---------- */

const DRIVE_API = 'https://www.googleapis.com/drive/v3/files';
const FOLDER = 'application/vnd.google-apps.folder';
const FOLDER_ID = process.env.DRIVE_FOLDER_ID || '1ECRI5k_w-3SCBCn8kOP4KK5xybxXb1Fj';

async function listChildren(parentId, key) {
  const out = [];
  let pageToken = '';
  do {
    const params = new URLSearchParams({
      q: `'${parentId}' in parents and trashed=false`,
      key,
      pageSize: '1000',
      orderBy: 'name_natural',
      supportsAllDrives: 'true',
      includeItemsFromAllDrives: 'true',
      fields:
        'nextPageToken,files(id,name,mimeType,imageMediaMetadata(width,height),videoMediaMetadata(width,height))',
    });
    if (pageToken) params.set('pageToken', pageToken);
    const res = await fetch(`${DRIVE_API}?${params}`);
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Google Drive API ${res.status}: ${t.slice(0, 300)}`);
    }
    const j = await res.json();
    out.push(...(j.files || []));
    pageToken = j.nextPageToken || '';
  } while (pageToken);
  return out;
}

function toFile(f) {
  const mt = f.mimeType || '';
  let kind = null;
  if (mt.startsWith('image/') && !/photoshop|postscript/.test(mt)) kind = 'image';
  else if (mt.startsWith('video/')) kind = 'video';
  if (!kind) return null;
  const meta = f.imageMediaMetadata || f.videoMediaMetadata || {};
  return {
    id: f.id,
    title: f.name.replace(/\.[^.]+$/, ''),
    kind,
    w: meta.width || 0,
    h: meta.height || 0,
  };
}

async function mapLimit(arr, limit, fn) {
  const res = new Array(arr.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, arr.length) }, async () => {
    while (i < arr.length) {
      const k = i++;
      res[k] = await fn(arr[k]);
    }
  });
  await Promise.all(workers);
  return res;
}

async function walk(id, name, key, depth) {
  const items = await listChildren(id, key);
  const folders = items.filter((i) => i.mimeType === FOLDER);
  const files = items.filter((i) => i.mimeType !== FOLDER).map(toFile).filter(Boolean);
  const children = depth < 8 ? await mapLimit(folders, 4, (f) => walk(f.id, f.name, key, depth + 1)) : [];
  return { id, name, files, children };
}

export const getTree = unstable_cache(
  async () => {
    const key = process.env.GOOGLE_API_KEY;
    if (!key) throw new Error('Не задана переменная GOOGLE_API_KEY');
    return walk(FOLDER_ID, 'root', key, 0);
  },
  ['drive-tree-v1'],
  { revalidate: 300, tags: ['drive'] }
);

/* ---------- Хранилище настроек ---------- */

const KV_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const KEY = 'dsmotion:settings';
const FILE = path.join(process.cwd(), '.data', 'settings.json');
export const hasKV = !!(KV_URL && KV_TOKEN);

async function kv(args) {
  const r = await fetch(KV_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
    cache: 'no-store',
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}

export async function readSettings() {
  try {
    if (hasKV) {
      const v = await kv(['GET', KEY]);
      return v ? JSON.parse(v) : null;
    }
    if (fs.existsSync(FILE)) return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch (e) {
    console.error('readSettings', e);
  }
  return null;
}

export async function writeSettings(obj) {
  const s = JSON.stringify(obj);
  if (hasKV) {
    await kv(['SET', KEY, s]);
    return;
  }
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, s);
}

const str = (v, n = 2000) => String(v ?? '').slice(0, n);

function cleanOverride(o) {
  o = o || {};
  const r = {};
  if (o.title) r.title = str(o.title, 200);
  if (o.description) r.description = str(o.description, 1000);
  if (o.hidden) r.hidden = true;
  if (o.featured) r.featured = true;
  if (o.cover) r.cover = str(o.cover, 100);
  if (Number.isFinite(o.order)) r.order = o.order;
  return r;
}

export function sanitizeSettings(input) {
  const m = mergeSettings(input);
  const site = {};
  for (const k of Object.keys(DEFAULT_SITE)) {
    const d = DEFAULT_SITE[k];
    const v = m.site[k];
    if (Array.isArray(d)) {
      site[k] = Array.isArray(v)
        ? v.slice(0, 40).map((it) =>
            Object.fromEntries(Object.entries(it || {}).slice(0, 6).map(([a, b]) => [str(a, 40), str(b, 600)]))
          )
        : d;
    } else {
      site[k] = str(v, k === 'about' ? 6000 : 600);
    }
  }
  const folders = {};
  const files = {};
  for (const [id, o] of Object.entries(m.folders || {}).slice(0, 5000)) folders[str(id, 100)] = cleanOverride(o);
  for (const [id, o] of Object.entries(m.files || {}).slice(0, 20000)) files[str(id, 100)] = cleanOverride(o);
  return { site, folders, files };
}

/* ---------- Авторизация админки ---------- */

export const COOKIE = 'ds_admin';

function secret() {
  return process.env.SESSION_SECRET || 'fallback:' + (process.env.ADMIN_PASSWORD || '');
}
function sign(v) {
  return crypto.createHmac('sha256', secret()).update(v).digest('hex');
}
export function makeToken() {
  const v = String(Date.now() + 30 * 24 * 3600 * 1000);
  return `${v}.${sign(v)}`;
}
function verifyToken(t) {
  if (!t || !process.env.ADMIN_PASSWORD) return false;
  const [v, sig] = t.split('.');
  if (!v || !sig) return false;
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(v));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  return Number(v) > Date.now();
}
export function isAuthed() {
  return verifyToken(cookies().get(COOKIE)?.value);
}
export function checkPassword(p) {
  const real = process.env.ADMIN_PASSWORD;
  if (!real) return false;
  const a = crypto.createHash('sha256').update(String(p)).digest();
  const b = crypto.createHash('sha256').update(real).digest();
  return crypto.timingSafeEqual(a, b);
}

/* ---------- Данные для страниц ---------- */

export async function loadRaw() {
  const settings = mergeSettings(await readSettings());
  let tree = { id: 'root', name: '', files: [], children: [] };
  let error = null;
  try {
    const raw = await getTree();
    tree = { ...raw, children: [...raw.children], files: [] };
    if (raw.files.length) tree.children.push({ id: '__root', name: 'Other works', files: raw.files, children: [] });
  } catch (e) {
    error = String(e.message || e);
  }
  return { tree, settings, error };
}

function collect(folder, S, out, group, catId, recursive) {
  for (const file of sortBy(folder.files, S.files)) {
    const o = S.files[file.id] || {};
    if (o.hidden) continue;
    out.push({
      id: file.id,
      title: o.title || file.title,
      kind: file.kind,
      w: file.w || 0,
      h: file.h || 0,
      group,
      catId,
      featured: !!o.featured,
    });
  }
  if (!recursive) return;
  for (const k of sortBy(folder.children, S.folders)) {
    if (S.folders[k.id]?.hidden) continue;
    collect(k, S, out, group, catId, true);
  }
}

export async function loadPublic() {
  const { tree, settings, error } = await loadRaw();
  const S = settings;
  const cats = [];
  for (const f of sortBy(tree.children, S.folders)) {
    const o = S.folders[f.id] || {};
    if (o.hidden) continue;
    const items = [];
    collect(f, S, items, 'root', f.id, false);
    const rootCount = items.length;
    const kids = [];
    for (const k of sortBy(f.children, S.folders)) {
      const ko = S.folders[k.id] || {};
      if (ko.hidden) continue;
      const before = items.length;
      collect(k, S, items, k.id, f.id, true);
      const c = items.length - before;
      if (c > 0) kids.push({ key: k.id, label: ko.title || k.name, count: c });
    }
    if (!items.length) continue;
    const groups = kids.length ? [...(rootCount ? [{ key: 'root', label: 'Other', count: rootCount }] : []), ...kids] : [];
    const cover = items.find((i) => i.id === o.cover) || items[0];
    cats.push({
      id: f.id,
      title: o.title || f.name,
      desc: o.description || '',
      cover: { id: cover.id, kind: cover.kind, title: cover.title },
      count: items.length,
      groups,
      items,
    });
  }
  const featured = [];
  for (const c of cats) for (const it of c.items) if (it.featured) featured.push({ ...it, catTitle: c.title });
  if (!featured.length) {
    for (let r = 0; featured.length < 7; r++) {
      let any = false;
      for (const c of cats) {
        if (c.items[r] && featured.length < 7) {
          featured.push({ ...c.items[r], catTitle: c.title });
          any = true;
        }
      }
      if (!any) break;
    }
  }
  return { cats, featured, settings, error };
}
