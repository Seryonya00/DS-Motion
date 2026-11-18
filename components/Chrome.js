import Link from 'next/link';

export function contactLinks(S) {
  const l = [];
  if (S.fiverr) l.push(['Fiverr', S.fiverr]);
  if (S.freelancehunt) l.push(['Freelancehunt', S.freelancehunt]);
  if (S.telegram) l.push(['Telegram', S.telegram]);
  if (S.instagram) l.push(['Instagram', S.instagram]);
  if (S.behance) l.push(['Behance', S.behance]);
  return l;
}

export function Header({ S }) {
  return (
    <header className="hdr">
      <div className="container hdr-in">
        <Link href="/" className="logo">
          {S.brand}
        </Link>
        <nav className="nav" aria-label="Main">
          <Link href="/#works">Works</Link>
          <Link href="/#about">About</Link>
          <Link href="/#services">Services</Link>
          <Link href="/#contact">Contact</Link>
        </nav>
        {S.fiverr && (
          <a className="btn btn-small" href={S.fiverr} target="_blank" rel="noopener noreferrer">
            Hire me
          </a>
        )}
      </div>
    </header>
  );
}

export function Footer({ S }) {
  return (
    <footer className="ftr">
      <div className="container ftr-in">
        <span>
          © {new Date().getFullYear()} {S.name}
        </span>
        <span className="ftr-links">
          {contactLinks(S).map(([label, href]) => (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer">
              {label}
            </a>
          ))}
        </span>
      </div>
    </footer>
  );
}
