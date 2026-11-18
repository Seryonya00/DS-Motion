'use client';

import { useState } from 'react';
import { sortBy, src } from '../../lib/shared';

/* ---------- Вход ---------- */

export function Login({ configured }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const r = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok) window.location.reload();
      else setErr(j.error || 'Не удалось войти');
    } catch {
      setErr('Нет связи с сервером');
    }
    setBusy(false);
  }

  return (
    <div className="a-login">
      <form onSubmit={submit} className="a-login-box">
        <h1>Админка</h1>
        {!configured && (
          <p className="a-err">
            Пароль не задан. Добавь переменную ADMIN_PASSWORD в настройках Vercel и задеплой заново.
          </p>
        )}
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Пароль"
          autoFocus
          autoComplete="current-password"
        />
        {err && <p className="a-err">{err}</p>}
        <button className="a-save" disabled={busy || !pw}>
          {busy ? 'Проверяю…' : 'Войти'}
        </button>
      </form>
    </div>
  );
}

/* ---------- Вспомогательное ---------- */

const countFiles = (f) => f.files.length + f.children.reduce((a, c) => a + countFiles(c), 0);

function Field({ label, value, onChange, textarea, hint, placeholder }) {
  return (
    <label className="a-field">
      <span>{label}</span>
      {textarea ? (
        <textarea rows={4} value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      ) : (
        <input value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      )}
      {hint && <em>{hint}</em>}
    </label>
  );
}

/* ---------- Дерево папок ---------- */

function FileRow({ file, siblingIds, topId, ctx }) {
  const { s, setFile, move, setCover } = ctx;
  const o = s.files[file.id] || {};
  const isCover = topId && s.folders[topId]?.cover === file.id;
  return (
    <div className={`a-row a-file${o.hidden ? ' off' : ''}`}>
      <span className="a-thumb">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src(file, 120)} alt="" loading="lazy" referrerPolicy="no-referrer" />
      </span>
      <input
        className="a-title"
        value={o.title ?? ''}
        placeholder={file.title}
        onChange={(e) => setFile(file.id, { title: e.target.value })}
      />
      <span className="a-kind">{file.kind === 'video' ? 'видео' : 'фото'}</span>
      <button
        type="button"
        className={`a-btn${o.featured ? ' on' : ''}`}
        title="Показывать в веере на главной"
        onClick={() => setFile(file.id, { featured: !o.featured })}
      >
        ★
      </button>
      {topId && (
        <button
          type="button"
          className={`a-btn${isCover ? ' on' : ''}`}
          title="Сделать обложкой категории"
          onClick={() => setCover(topId, isCover ? '' : file.id)}
        >
          Обложка
        </button>
      )}
      <button
        type="button"
        className="a-btn"
        title={o.hidden ? 'Показать на сайте' : 'Скрыть с сайта'}
        onClick={() => setFile(file.id, { hidden: !o.hidden })}
      >
        {o.hidden ? 'Скрыто' : 'Видно'}
      </button>
      <button type="button" className="a-btn" onClick={() => move('file', siblingIds, file.id, -1)} aria-label="Выше">
        ↑
      </button>
      <button type="button" className="a-btn" onClick={() => move('file', siblingIds, file.id, 1)} aria-label="Ниже">
        ↓
      </button>
    </div>
  );
}

function FolderNode({ folder, depth, topId, siblingIds, ctx }) {
  const { s, setFolder, move } = ctx;
  const [open, setOpen] = useState(false);
  const o = s.folders[folder.id] || {};
  const kids = sortBy(folder.children, s.folders);
  const files = sortBy(folder.files, s.files);
  const kidIds = kids.map((k) => k.id);
  const fileIds = files.map((f) => f.id);
  const total = countFiles(folder);

  return (
    <div className="a-node" style={{ marginLeft: depth ? 18 : 0 }}>
      <div className={`a-row a-folder${o.hidden ? ' off' : ''}`}>
        <button type="button" className="a-toggle" onClick={() => setOpen(!open)} aria-label="Раскрыть">
          {open ? '▾' : '▸'}
        </button>
        <input
          className="a-title"
          value={o.title ?? ''}
          placeholder={folder.name}
          onChange={(e) => setFolder(folder.id, { title: e.target.value })}
        />
        <span className="a-kind">{total} шт.</span>
        <button
          type="button"
          className="a-btn"
          title={o.hidden ? 'Показать на сайте' : 'Скрыть с сайта'}
          onClick={() => setFolder(folder.id, { hidden: !o.hidden })}
        >
          {o.hidden ? 'Скрыта' : 'Видна'}
        </button>
        <button type="button" className="a-btn" onClick={() => move('folder', siblingIds, folder.id, -1)} aria-label="Выше">
          ↑
        </button>
        <button type="button" className="a-btn" onClick={() => move('folder', siblingIds, folder.id, 1)} aria-label="Ниже">
          ↓
        </button>
      </div>
      {depth === 0 && open && (
        <textarea
          className="a-desc"
          rows={2}
          placeholder="Короткое описание категории (необязательно)"
          value={o.description ?? ''}
          onChange={(e) => setFolder(folder.id, { description: e.target.value })}
        />
      )}
      {open && (
        <div className="a-children">
          {kids.map((k) => (
            <FolderNode key={k.id} folder={k} depth={depth + 1} topId={topId || folder.id} siblingIds={kidIds} ctx={ctx} />
          ))}
          {files.map((f) => (
            <FileRow key={f.id} file={f} siblingIds={fileIds} topId={topId || folder.id} ctx={ctx} />
          ))}
          {!kids.length && !files.length && <p className="a-muted">В папке пока нет фото и видео.</p>}
        </div>
      )}
    </div>
  );
}

/* ---------- Панель ---------- */

export function Panel({ tree, initial, error, hasKV }) {
  const [s, setS] = useState(initial);
  const [tab, setTab] = useState('works');
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const update = (fn) => {
    setS((prev) => {
      const n = JSON.parse(JSON.stringify(prev));
      fn(n);
      return n;
    });
    setDirty(true);
    setMsg('');
  };

  const setFolder = (id, patch) => update((n) => (n.folders[id] = { ...(n.folders[id] || {}), ...patch }));
  const setFile = (id, patch) => update((n) => (n.files[id] = { ...(n.files[id] || {}), ...patch }));
  const setCover = (topId, fileId) => update((n) => (n.folders[topId] = { ...(n.folders[topId] || {}), cover: fileId }));
  const setSite = (k, v) => update((n) => (n.site[k] = v));

  const move = (kind, ids, id, dir) => {
    const i = ids.indexOf(id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= ids.length) return;
    update((n) => {
      const arr = [...ids];
      [arr[i], arr[j]] = [arr[j], arr[i]];
      const m = kind === 'folder' ? n.folders : n.files;
      arr.forEach((x, k) => {
        m[x] = { ...(m[x] || {}), order: k };
      });
    });
  };

  const ctx = { s, setFolder, setFile, setCover, move };

  async function save() {
    setBusy(true);
    setMsg('');
    try {
      const r = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(s),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok) {
        setDirty(false);
        setMsg('Сохранено. Сайт обновлён.');
      } else setMsg(j.error || 'Не удалось сохранить');
    } catch {
      setMsg('Нет связи с сервером');
    }
    setBusy(false);
  }

  async function sync() {
    if (dirty && !window.confirm('Есть несохранённые изменения. Они пропадут после обновления. Продолжить?')) return;
    setBusy(true);
    setMsg('Читаю Google Drive…');
    try {
      const r = await fetch('/api/admin/sync', { method: 'POST' });
      const j = await r.json().catch(() => ({}));
      if (r.ok) window.location.reload();
      else {
        setMsg(j.error || 'Не удалось синхронизировать');
        setBusy(false);
      }
    } catch {
      setMsg('Нет связи с сервером');
      setBusy(false);
    }
  }

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    window.location.reload();
  }

  const tops = sortBy(tree.children, s.folders);
  const topIds = tops.map((t) => t.id);

  const listEdit = (key, empty) => ({
    set: (i, field, v) => update((n) => (n.site[key][i][field] = v)),
    add: () => update((n) => n.site[key].push({ ...empty })),
    del: (i) => update((n) => n.site[key].splice(i, 1)),
  });
  const stats = listEdit('stats', { value: '', label: '' });
  const services = listEdit('services', { title: '', text: '' });
  const skills = listEdit('skills', { name: '', level: '80' });

  return (
    <div className="a-wrap">
      <header className="a-top">
        <strong>DS Motion · админка</strong>
        <nav>
          <button className={tab === 'works' ? 'on' : ''} onClick={() => setTab('works')}>
            Категории и работы
          </button>
          <button className={tab === 'site' ? 'on' : ''} onClick={() => setTab('site')}>
            Тексты и контакты
          </button>
        </nav>
        <span className="a-spacer" />
        <a href="/" target="_blank" rel="noopener noreferrer" className="a-link">
          Открыть сайт
        </a>
        <button className="a-link" onClick={logout}>
          Выйти
        </button>
      </header>

      {!hasKV && (
        <p className="a-warn">
          Хранилище Upstash Redis не подключено: на Vercel настройки не сохранятся. Как подключить, написано в README.
        </p>
      )}
      {error && (
        <p className="a-warn">
          Не удалось прочитать Google Drive: {error}. Проверь GOOGLE_API_KEY и что папка открыта по ссылке.
        </p>
      )}

      {tab === 'works' && (
        <section className="a-body">
          <div className="a-intro">
            <p>
              Каждая папка в Google Drive становится категорией на сайте, вложенные папки подкатегориями. Чтобы добавить
              категорию или работу, создай папку или загрузи файл в Drive и нажми «Синхронизировать».
            </p>
            <button className="a-btn big" onClick={sync} disabled={busy}>
              Синхронизировать с Drive
            </button>
          </div>
          {tops.length === 0 && !error && <p className="a-muted">В папке Drive пока нет подпапок и файлов.</p>}
          {tops.map((t) => (
            <FolderNode key={t.id} folder={t} depth={0} topId="" siblingIds={topIds} ctx={ctx} />
          ))}
        </section>
      )}

      {tab === 'site' && (
        <section className="a-body a-form">
          <h2>Главный экран</h2>
          <Field label="Название бренда (логотип)" value={s.site.brand} onChange={(v) => setSite('brand', v)} />
          <Field label="Заголовок" value={s.site.headline} onChange={(v) => setSite('headline', v)} />
          <Field label="Подзаголовок" textarea value={s.site.sub} onChange={(v) => setSite('sub', v)} />
          <Field label="Профессия" value={s.site.role} onChange={(v) => setSite('role', v)} />

          <h2>Цифры</h2>
          {s.site.stats.map((x, i) => (
            <div className="a-pair" key={i}>
              <input value={x.value} placeholder="26" onChange={(e) => stats.set(i, 'value', e.target.value)} />
              <input value={x.label} placeholder="подпись" onChange={(e) => stats.set(i, 'label', e.target.value)} />
              <button className="a-btn" onClick={() => stats.del(i)}>
                Удалить
              </button>
            </div>
          ))}
          <button className="a-btn" onClick={stats.add}>
            Добавить цифру
          </button>

          <h2>Обо мне</h2>
          <Field label="Имя" value={s.site.name} onChange={(v) => setSite('name', v)} />
          <Field label="Город" value={s.site.location} onChange={(v) => setSite('location', v)} />
          <Field label="Текст" textarea value={s.site.about} onChange={(v) => setSite('about', v)} />
          <Field
            label="Фото: ID файла в Google Drive"
            value={s.site.avatarId}
            onChange={(v) => setSite('avatarId', v)}
            hint="Это часть ссылки на файл между /d/ и /view. Файл должен быть открыт по ссылке."
          />

          <h2>Программы</h2>
          {s.site.skills.map((x, i) => (
            <div className="a-pair" key={i}>
              <input value={x.name} placeholder="Photoshop" onChange={(e) => skills.set(i, 'name', e.target.value)} />
              <input value={x.level} placeholder="90" inputMode="numeric" onChange={(e) => skills.set(i, 'level', e.target.value)} />
              <button className="a-btn" onClick={() => skills.del(i)}>
                Удалить
              </button>
            </div>
          ))}
          <button className="a-btn" onClick={skills.add}>
            Добавить программу
          </button>

          <h2>Услуги</h2>
          {s.site.services.map((x, i) => (
            <div className="a-svc" key={i}>
              <input value={x.title} placeholder="Название" onChange={(e) => services.set(i, 'title', e.target.value)} />
              <textarea rows={2} value={x.text} placeholder="Описание" onChange={(e) => services.set(i, 'text', e.target.value)} />
              <button className="a-btn" onClick={() => services.del(i)}>
                Удалить
              </button>
            </div>
          ))}
          <button className="a-btn" onClick={services.add}>
            Добавить услугу
          </button>

          <h2>Контакты и ссылки</h2>
          <Field label="Email" value={s.site.email} onChange={(v) => setSite('email', v)} />
          <Field label="Fiverr" value={s.site.fiverr} onChange={(v) => setSite('fiverr', v)} placeholder="https://www.fiverr.com/..." />
          <Field label="Freelancehunt" value={s.site.freelancehunt} onChange={(v) => setSite('freelancehunt', v)} />
          <Field label="Telegram" value={s.site.telegram} onChange={(v) => setSite('telegram', v)} placeholder="https://t.me/..." />
          <Field label="Instagram" value={s.site.instagram} onChange={(v) => setSite('instagram', v)} />
          <Field label="Behance" value={s.site.behance} onChange={(v) => setSite('behance', v)} />
        </section>
      )}

      <div className="a-bar">
        <span className={dirty ? 'a-dirty' : 'a-ok'}>{msg || (dirty ? 'Есть несохранённые изменения' : 'Всё сохранено')}</span>
        <button className="a-save" onClick={save} disabled={busy || !dirty}>
          {busy ? 'Сохраняю…' : 'Сохранить'}
        </button>
      </div>
    </div>
  );
}
