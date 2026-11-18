// Общие функции: работают и на сервере, и в браузере.

export const thumbUrl = (id, w = 800) => `https://lh3.googleusercontent.com/d/${id}=w${w}`;
export const driveThumb = (id, w = 800) => `https://drive.google.com/thumbnail?id=${id}&sz=w${w}`;
export const videoPreview = (id) => `https://drive.google.com/file/d/${id}/preview`;
export const src = (it, w) => (it.kind === 'video' ? driveThumb(it.id, w) : thumbUrl(it.id, w));
export const altSrc = (it, w) => (it.kind === 'video' ? thumbUrl(it.id, w) : driveThumb(it.id, w));

// Сортировка: сначала то, у чего задан порядок в админке, остальное в порядке Google Drive.
export function sortBy(arr, map) {
  return [...arr].sort((a, b) => {
    const oa = map?.[a.id]?.order;
    const ob = map?.[b.id]?.order;
    const ha = oa != null;
    const hb = ob != null;
    if (ha && hb) return oa - ob;
    if (ha) return -1;
    if (hb) return 1;
    return 0;
  });
}

export const DEFAULT_SITE = {
  brand: 'DS Motion',
  name: 'Sergey Zubkov',
  role: 'Motion designer and graphic artist',
  location: 'Kharkiv, Ukraine',
  headline: 'Motion and graphics that make games and apps sell',
  sub: 'Video ads, game trailers, app store creatives and channel graphics. Designing since 2017 in After Effects, Photoshop, Illustrator and Cinema 4D.',
  about:
    'I am Sergey, a digital artist and graphic designer from Kharkiv. Since 2017 I have been making video ads, animation and graphics for mobile games, apps, brands and YouTube and Twitch creators. I work from the first sketch to the final render, so one person owns the whole result.',
  avatarId: '',
  email: '',
  telegram: '',
  instagram: '',
  behance: '',
  fiverr: 'https://www.fiverr.com/dyadyaseryonya',
  freelancehunt: 'https://freelancehunt.com/freelancer/seru_zubkov00.html',
  stats: [
    { value: '2017', label: 'designing since' },
    { value: '26', label: 'projects on Freelancehunt' },
    { value: '26', label: 'client reviews' },
    { value: '25', label: 'clients worked with' },
  ],
  services: [
    { title: 'Video ads', text: '3D, 2D and motion design ads for games, apps, brands and websites, cut for TikTok, Meta and YouTube.' },
    { title: 'Game trailers and gameplay videos', text: 'Trailers and gameplay edits made for App Store and Google Play pages.' },
    { title: 'App store creatives', text: 'Screenshots, icons and banners for App Store and Google Play listings.' },
    { title: 'YouTube and Twitch graphics', text: 'Intros, outros, subscribe animations, overlays, channel art and previews.' },
    { title: 'Logos and animation', text: 'Vector logos and illustrations, logo animation and GIF banners.' },
    { title: 'Photo manipulation and digital art', text: 'Art-style photo manipulation, game art and promo illustrations.' },
  ],
  skills: [
    { name: 'Photoshop', level: '100' },
    { name: 'After Effects', level: '100' },
    { name: 'Illustrator', level: '90' },
    { name: 'Premiere Pro', level: '90' },
    { name: 'Cinema 4D', level: '60' },
  ],
};

export function mergeSettings(saved) {
  const s = saved || {};
  return {
    site: { ...DEFAULT_SITE, ...(s.site || {}) },
    folders: s.folders || {},
    files: s.files || {},
  };
}
