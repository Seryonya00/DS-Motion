import Link from 'next/link';
import { loadPublic } from '../lib/server';
import { Header, Footer, contactLinks } from '../components/Chrome';
import { HeroFan, Thumb } from '../components/ui';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const { cats, featured, settings, error } = await loadPublic();
  const S = settings.site;
  const links = contactLinks(S);

  return (
    <>
      <Header S={S} />
      <main>
        <section className="hero container">
          <div className="hero-copy">
            <p className="hero-role">{S.role}</p>
            <h1>{S.headline}</h1>
            <p className="lead">{S.sub}</p>
            <div className="cta-row">
              <a className="btn btn-primary" href="#works">
                View works
              </a>
              {S.fiverr && (
                <a className="btn btn-ghost" href={S.fiverr} target="_blank" rel="noopener noreferrer">
                  Order on Fiverr
                </a>
              )}
            </div>
          </div>
          <HeroFan items={featured} />
        </section>

        <section className="container stats" aria-label="In numbers">
          {S.stats.map((s, i) => (
            <div key={i} className="stat">
              <b>{s.value}</b>
              <span>{s.label}</span>
            </div>
          ))}
        </section>

        <section id="works" className="container section">
          <h2>Works</h2>
          {cats.length === 0 ? (
            <p className="empty">
              {error
                ? 'The works are being connected. Please check back soon.'
                : 'No works published yet.'}
            </p>
          ) : (
            <div className="cats">
              {cats.map((c) => (
                <Link key={c.id} href={`/c/${c.id}`} className="cat">
                  <Thumb item={c.cover} w={900} className="cat-img" alt="" />
                  <span className="cat-shade" />
                  <span className="cat-txt">
                    <strong>{c.title}</strong>
                    <small>{c.count} works</small>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section id="about" className="container section about">
          {S.avatarId && (
            <div className="avatar">
              <Thumb item={{ id: S.avatarId, kind: 'image' }} w={600} alt={S.name} />
            </div>
          )}
          <div className="about-txt">
            <h2>{S.name}</h2>
            <p className="about-loc">{S.location}</p>
            <p>{S.about}</p>
          </div>
          <ul className="skills" aria-label="Software">
            {S.skills.map((k, i) => (
              <li key={i}>
                <span>{k.name}</span>
                <i className="bar">
                  <i style={{ width: `${Math.max(0, Math.min(100, Number(k.level) || 0))}%` }} />
                </i>
              </li>
            ))}
          </ul>
        </section>

        <section id="services" className="container section">
          <h2>What I make</h2>
          <ul className="services">
            {S.services.map((s, i) => (
              <li key={i}>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="contact" className="container section contact">
          <h2>Have a project?</h2>
          <p className="lead">Tell me what you are making and where the video or graphics will run.</p>
          <div className="cta-row">
            {S.email && (
              <a className="btn btn-primary" href={`mailto:${S.email}`}>
                {S.email}
              </a>
            )}
            {links.map(([label, href], i) => (
              <a
                key={label}
                className={`btn ${!S.email && i === 0 ? 'btn-primary' : 'btn-ghost'}`}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {label}
              </a>
            ))}
          </div>
        </section>
      </main>
      <Footer S={S} />
    </>
  );
}
