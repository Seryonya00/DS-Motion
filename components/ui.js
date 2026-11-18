'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { src, altSrc, videoPreview } from '../lib/shared';

/* Картинка из Google Drive с запасным адресом, если основной не загрузился */
export function Thumb({ item, w = 800, className = '', style, alt }) {
  const [fb, setFb] = useState(0);
  if (fb > 1) return <div className={`thumb-fail ${className}`} style={style} />;
  const url = fb === 0 ? src(item, w) : altSrc(item, w);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={className}
      style={style}
      src={url}
      alt={alt ?? item.title ?? ''}
      loading="lazy"
      draggable={false}
      referrerPolicy="no-referrer"
      onError={() => setFb((v) => v + 1)}
    />
  );
}

/* Веер карточек на главной */
export function HeroFan({ items }) {
  const n = items.length;
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || n < 2) return undefined;
    const t = setInterval(() => setI((v) => (v + 1) % n), 4800);
    return () => clearInterval(t);
  }, [paused, n]);

  if (!n) return null;
  const half = Math.floor(n / 2);
  const rel = (k) => {
    let d = (k - i) % n;
    if (d < 0) d += n;
    if (d > half) d -= n;
    return d;
  };
  const go = (d) => setI((v) => (v + d + n) % n);
  const cur = items[i];

  return (
    <div
      className="fan"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="fan-stage">
        {items.map((it, k) => {
          const d = rel(k);
          const a = Math.abs(d);
          const vis = a <= 2;
          return (
            <div
              key={it.id}
              className={`fan-card${d === 0 ? ' is-active' : ''}`}
              style={{
                transform: `translateX(${d * 60}%) translateZ(${-a * 150}px) rotateY(${-d * 17}deg) scale(${1 - a * 0.07})`,
                zIndex: 10 - a,
                opacity: vis ? 1 - a * 0.2 : 0,
                pointerEvents: vis ? 'auto' : 'none',
              }}
            >
              <Thumb item={it} w={700} className="fan-img" />
              {d === 0 ? (
                <Link href={`/c/${it.catId}`} className="fan-hit" aria-label={`Open ${it.catTitle}`} />
              ) : (
                <button type="button" className="fan-hit" onClick={() => setI(k)} aria-label={`Show ${it.title}`} />
              )}
              {d === 0 && (
                <div className="fan-cap">
                  <strong>{it.catTitle}</strong>
                  <span>{it.title}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="fan-bar">
        <button type="button" className="fan-arrow" onClick={() => go(-1)} aria-label="Previous">
          ‹
        </button>
        <div className="fan-dots">
          {items.slice(0, 8).map((it, k) => (
            <button
              type="button"
              key={it.id}
              className={`fan-dot${k === i ? ' on' : ''}`}
              onClick={() => setI(k)}
              aria-label={it.title}
            >
              <Thumb item={it} w={120} />
            </button>
          ))}
        </div>
        <button type="button" className="fan-arrow" onClick={() => go(1)} aria-label="Next">
          ›
        </button>
      </div>
      <span className="sr-only">{cur.title}</span>
    </div>
  );
}

/* Сетка работ + фильтр по подкатегориям + просмотр на весь экран */
export function Gallery({ items, groups }) {
  const [g, setG] = useState('all');
  const [open, setOpen] = useState(-1);
  const list = useMemo(() => (g === 'all' ? items : items.filter((x) => x.group === g)), [g, items]);

  const close = useCallback(() => setOpen(-1), []);
  const step = useCallback(
    (d) => setOpen((o) => (o < 0 || !list.length ? o : (o + d + list.length) % list.length)),
    [list.length]
  );

  useEffect(() => {
    if (open < 0) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close, step]);

  const cur = open >= 0 ? list[open] : null;

  return (
    <>
      {groups.length > 0 && (
        <div className="chips" role="tablist">
          <button
            type="button"
            className={`chip${g === 'all' ? ' on' : ''}`}
            onClick={() => setG('all')}
          >
            All <small>{items.length}</small>
          </button>
          {groups.map((x) => (
            <button
              type="button"
              key={x.key}
              className={`chip${g === x.key ? ' on' : ''}`}
              onClick={() => setG(x.key)}
            >
              {x.label} <small>{x.count}</small>
            </button>
          ))}
        </div>
      )}

      <div className="masonry">
        {list.map((it, idx) => (
          <button
            type="button"
            key={it.id}
            className="tile"
            onClick={() => setOpen(idx)}
            style={{ aspectRatio: it.w && it.h ? `${it.w} / ${it.h}` : it.kind === 'video' ? '16 / 9' : undefined }}
          >
            <Thumb item={it} w={700} />
            {it.kind === 'video' && <span className="play" aria-hidden="true" />}
            <span className="tile-cap">{it.title}</span>
          </button>
        ))}
      </div>

      {cur && (
        <div className="lb" role="dialog" aria-modal="true" onClick={close}>
          <button type="button" className="lb-x" onClick={close} aria-label="Close">
            ×
          </button>
          {list.length > 1 && (
            <>
              <button
                type="button"
                className="lb-nav prev"
                onClick={(e) => {
                  e.stopPropagation();
                  step(-1);
                }}
                aria-label="Previous"
              >
                ‹
              </button>
              <button
                type="button"
                className="lb-nav next"
                onClick={(e) => {
                  e.stopPropagation();
                  step(1);
                }}
                aria-label="Next"
              >
                ›
              </button>
            </>
          )}
          <figure className="lb-fig" onClick={(e) => e.stopPropagation()}>
            {cur.kind === 'video' ? (
              <iframe
                key={cur.id}
                className="lb-video"
                src={videoPreview(cur.id)}
                allow="autoplay; fullscreen"
                allowFullScreen
                title={cur.title}
              />
            ) : (
              <Thumb key={cur.id} item={cur} w={2000} className="lb-img" />
            )}
            <figcaption>{cur.title}</figcaption>
          </figure>
        </div>
      )}
    </>
  );
}
