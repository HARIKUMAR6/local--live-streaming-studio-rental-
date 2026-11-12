// Single source of truth: brand, navigation, contact, studios. Never hardcode these in markup.
export const brand = {
  name: 'Signalroom',
  suffix: 'Studios',
  tagline: 'Live streaming & broadcast studio rental',
  about: 'Purpose-built studios for live streams, podcasts and broadcast productions, with cameras, lighting, audio and engineers included.',
};

export const contact = {
  address: ['48 Foundry Lane, Riverside Media District', 'Austin, TX 78702'],
  phone: '+1 (512) 555-0148',
  phoneHref: 'tel:+15125550148',
  email: 'hello@signalroomstudios.com',
  hours: 'Mon-Sun, 7:00-23:00',
};

export const social = [
  { name: 'YouTube', icon: 'youtube', href: '#' },
  { name: 'Instagram', icon: 'instagram', href: '#' },
  { name: 'LinkedIn', icon: 'linkedin', href: '#' },
  { name: 'Facebook', icon: 'facebook', href: '#' },
  { name: 'X', icon: 'twitter', href: '#' },
];

export const nav = [
  {
    label: 'Home',
    children: [
      { href: 'index.html', label: 'Home 1' },
      { href: 'home-2.html', label: 'Home 2' },
    ],
  },
  { href: 'about.html', label: 'About' },
  { href: 'studios.html', label: 'Studios' },
  { href: 'pricing.html', label: 'Pricing' },
  { href: 'contact.html', label: 'Contact' },
  { href: 'dashboard.html', label: 'Dashboard' },
];

export const cta = { href: 'contact.html', label: 'Book a studio' };
export const login = { href: 'login.html', label: 'Login' };

export const studios = [
  { href: 'studios.html#talk-suite', label: 'Talk Suite' },
  { href: 'studios.html#cyclorama-stage', label: 'Cyclorama Stage' },
  { href: 'studios.html#chroma-room', label: 'Chroma Room' },
  { href: 'studios.html#audio-suite', label: 'Audio Suite' },
];
