import './globals.css';
import { Fraunces, Manrope } from 'next/font/google';

const serif = Fraunces({ subsets: ['latin'], variable: '--serif', display: 'swap' });
const sans = Manrope({ subsets: ['latin', 'cyrillic'], variable: '--sans', display: 'swap' });

export const metadata = {
  title: 'DS Motion: motion design and graphics for games and apps',
  description:
    'Portfolio of Sergey Zubkov: video ads, game trailers, app store creatives and graphics for YouTube and Twitch.',
};

export const viewport = { themeColor: '#0c0820' };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
