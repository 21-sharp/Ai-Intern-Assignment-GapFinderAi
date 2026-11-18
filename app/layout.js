import './globals.css';
import './auth.css';

export const metadata = {
  title: 'GapFinder AI — Study what you don’t know',
  description: 'A source-grounded study diagnosis and personalized revision planner.'
};

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
