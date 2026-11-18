import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import {
  COOKIE,
  checkPassword,
  getTree,
  isAuthed,
  makeToken,
  sanitizeSettings,
  writeSettings,
} from '../../../../lib/server';

export const dynamic = 'force-dynamic';

const json = (data, status = 200) => NextResponse.json(data, { status });

export async function POST(req, { params }) {
  const { action } = params;

  if (action === 'login') {
    const body = await req.json().catch(() => ({}));
    if (!process.env.ADMIN_PASSWORD) return json({ error: 'Не задана переменная ADMIN_PASSWORD' }, 500);
    if (!checkPassword(body.password)) {
      await new Promise((r) => setTimeout(r, 700));
      return json({ error: 'Неверный пароль' }, 401);
    }
    const res = json({ ok: true });
    res.cookies.set(COOKIE, makeToken(), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  }

  if (action === 'logout') {
    const res = json({ ok: true });
    res.cookies.set(COOKIE, '', { path: '/', maxAge: 0 });
    return res;
  }

  if (!isAuthed()) return json({ error: 'Нужно войти' }, 401);

  if (action === 'sync') {
    try {
      revalidateTag('drive');
      await getTree();
      return json({ ok: true });
    } catch (e) {
      return json({ error: String(e.message || e) }, 500);
    }
  }

  return json({ error: 'Не найдено' }, 404);
}

export async function PUT(req, { params }) {
  if (params.action !== 'settings') return json({ error: 'Не найдено' }, 404);
  if (!isAuthed()) return json({ error: 'Нужно войти' }, 401);
  try {
    const body = await req.json();
    const clean = sanitizeSettings(body);
    if (JSON.stringify(clean).length > 900000) return json({ error: 'Слишком много данных' }, 413);
    await writeSettings(clean);
    return json({ ok: true });
  } catch (e) {
    return json(
      {
        error:
          'Не удалось сохранить: ' +
          String(e.message || e) +
          '. Проверь, что подключено хранилище Upstash Redis (см. README).',
      },
      500
    );
  }
}
