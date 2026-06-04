export type PlatformId = 'soundcloud' | 'youtube' | 'flat-audio';

export interface PlatformLink {
  id: PlatformId;
  label: string;
  url: string;
}

export interface ExperienceItem {
  year: string;
  title: string;
  location: string;
  note?: string;
  resident?: boolean;
}

export interface ReleaseItem {
  year: string;
  title: string;
  url: string;
  description?: string;
}

export const PRESSKIT = {
  artist: 'Ekaterina Shmidt',
  email: 'katyshmidt01@mail.ru',
  instagram: {
    label: '@dj_shmidt',
    url: 'https://www.instagram.com/dj_shmidt?igsh=MzZqcDA1OXR3dTZu',
  },
  pressbookUrl:
    'https://drive.google.com/drive/folders/1BTpAzhvlNU2HKWsj7E1EZQd4TdUc2IrX',
  bio: `Ekaterina Shmidt has been weaving stories through sound since 2013. Her sets move like landscapes — from the driving pulse of House music to the cinematic stillness of Downtempo and the deep relaxation of Chill Out. She doesn't just play tracks; she builds arcs, taking listeners from sunrise energy to late-night reflection.`,
  platforms: [
    {
      id: 'soundcloud',
      label: 'SoundCloud',
      url: 'https://on.soundcloud.com/lMr88mI34Xhkk1N3NS',
    },
    {
      id: 'flat-audio',
      label: 'Flat Audio',
      url: 'https://flat.audio/id33527',
    },
    {
      id: 'youtube',
      label: 'YouTube',
      url: 'https://youtube.com/@shmidt001?si=D-nT3Z3WV6e2hpYe',
    },
  ] as PlatformLink[],
  musicStyles: [
    'House',
    'Afro House',
    'Tropical House',
    'Organic House',
    'Downtempo',
    'Chill Out',
    'Lounge',
    'Ambient',
    'Melodic Techno',
    'EDM',
    'Indie Dance',
    'Bollywood',
    'Bollytech',
  ],
  geography: ['India', 'Russia', 'Saudi Arabia', 'Maldives', 'Thailand', 'Germany'],
  experience: [
    {
      year: '2026',
      title: 'Joy De Vivre bar',
      location: 'Ozen Life Maadhoo, Maldives',
      note: 'Resident DJ · 1 Apr – 1 Jul',
      resident: true,
    },
    {
      year: '2025',
      title: 'Stella rooftop',
      location: 'St. Regis, Riyadh, Saudi Arabia',
    },
    {
      year: '2025',
      title: 'Azziro',
      location: 'Ritz Carlton, Riyadh, Saudi Arabia',
    },
    {
      year: '2025',
      title: 'Adrift Mare',
      location: 'Ritz Carlton, Jeddah, Saudi Arabia',
    },
    {
      year: '2025',
      title: 'Kaia rooftop',
      location: 'Shangri-La, Jeddah, Saudi Arabia',
      note: 'Resident DJ · 1 Nov – 22 Dec',
      resident: true,
    },
    {
      year: '2025',
      title: 'BMW event',
      location: 'Jeddah, Saudi Arabia',
      note: '21–22 Nov 2025',
    },
    {
      year: '2025',
      title: 'Essence cosmetic',
      location: 'Jeddah, Saudi Arabia',
      note: '29 Nov 2025',
    },
    {
      year: '2024',
      title: 'Aer rooftop',
      location: 'Four Seasons, Mumbai, India',
    },
    {
      year: '2022–2023',
      title: 'Maya Beach Club',
      location: 'Phuket, Thailand',
      note: '9 Nov 2023 · 20 Dec 2023 · 27 Nov 2023 · 7 Jan 2024',
    },
    {
      year: '2020–2026',
      title: 'Freelance',
      location: 'India',
    },
  ] as ExperienceItem[],
  releases: [
    {
      year: '2025',
      title: 'Afro Kiss',
      url: 'https://www.beatport.com/release/afro-kiss/5042392',
      description:
        'Release on Beatport — organic and afro-driven energy for club and festival floors.',
    },
  ] as ReleaseItem[],
  rider: [
    '2× Linked CDJ 3000/2000 NX2',
    '1× DJM-900 V10/V6/NX2 Mixer (Updated Firmware)',
    'Large Studio Booth Monitors',
    '50% Artist Fee to be paid at booking confirmation of the event',
    'Balance 50% artist fee prior to the event',
    'Cancelled event will attract a 100% cancellation fee',
    'Flights to be booked in the name of Miss Ekaterina Shmidt',
    'Local Ground Transport (Airport – Hotel – Venue – Hotel – Airport)',
    'Minimum 4-star Accommodation with late check-out (Double / Deluxe Room)',
    'Accommodation must be booked and paid for by the promoter for the entire duration of the tour',
    'Artist F&B to be paid for by the promoter for the entire duration of the tour',
  ],
} as const;

export const SLIDE_IDS = [
  'cover',
  'about',
  'styles',
  'experience',
  'releases',
  'rider',
] as const;
