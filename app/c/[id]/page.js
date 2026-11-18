import Link from 'next/link';
import { notFound } from 'next/navigation';
import { loadPublic } from '../../../lib/server';
import { Header, Footer } from '../../../components/Chrome';
import { Gallery } from '../../../components/ui';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { cats } = await loadPublic();
  const c = cats.find((x) => x.id === params.id);
  return { title: c ? `${c.title} | DS Motion` : 'DS Motion' };
}

export default async function CategoryPage({ params }) {
  const { cats, settings } = await loadPublic();
  const c = cats.find((x) => x.id === params.id);
  if (!c) notFound();
  const S = settings.site;

  return (
    <>
      <Header S={S} />
      <main className="container cat-page">
        <Link href="/#works" className="back">
          ‹ All works
        </Link>
        <h1 className="cat-title">{c.title}</h1>
        {c.desc && <p className="lead">{c.desc}</p>}
        <Gallery items={c.items} groups={c.groups} />
      </main>
      <Footer S={S} />
    </>
  );
}
