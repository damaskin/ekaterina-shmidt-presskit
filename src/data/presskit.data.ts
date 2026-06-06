export type PlatformId = 'soundcloud' | 'youtube' | 'flat-audio';

export interface PlatformLink {
  id: PlatformId;
  label: string;
  url: string;
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
  releases: [
    {
      year: '2025',
      title: 'Afro Kiss',
      url: 'https://www.beatport.com/release/afro-kiss/5042392',
    },
  ],
  featuredTrack: {
    title: 'Burning Inside',
    subtitle: 'Downtempo Mix',
    artist: 'DJ SHMIDT',
    src: 'assets/DJ SHMIDT - Burning Inside mix downtempo.WAV',
  },
} as const;

export const SLIDE_IDS = [
  'cover',
  'about',
  'styles',
  'experience',
  'releases',
  'rider',
] as const;
