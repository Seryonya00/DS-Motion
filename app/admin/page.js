import { hasKV, isAuthed, loadRaw } from '../../lib/server';
import { Login, Panel } from './Panel';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Админка | DS Motion', robots: { index: false, follow: false } };

export default async function AdminPage() {
  if (!isAuthed()) return <Login configured={!!process.env.ADMIN_PASSWORD} />;
  const { tree, settings, error } = await loadRaw();
  return <Panel tree={tree} initial={settings} error={error} hasKV={hasKV} />;
}
