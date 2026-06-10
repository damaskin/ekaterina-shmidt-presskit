export type Locale = 'en' | 'ru' | 'de' | 'ar' | 'hi' | 'es' | 'fr' | 'zh';

export interface ExperienceEntry {
  id: string;
  year: string;
  title: string;
  location: string;
  note?: string;
  resident?: boolean;
}

export interface ReleaseEntry {
  year: string;
  title: string;
  description: string;
}

export interface ValidationMessages {
  nameRequired: string;
  nameInvalid: string;
  emailRequired: string;
  emailInvalid: string;
  phoneRequired: string;
  phoneInvalid: string;
  phoneTooLong: string;
  eventDateRequired: string;
  eventDateInvalid: string;
  eventDatePast: string;
  venueRequired: string;
  venueInvalid: string;
  cityRequired: string;
  cityInvalid: string;
  messageRequired: string;
  messageTooShort: string;
}

export interface LocaleMessages {
  locale: Locale;
  dir: 'ltr' | 'rtl';
  nativeName: string;
  meta: {
    title: string;
    description: string;
  };
  nav: {
    sections: string;
    goTo: (section: string) => string;
    cover: string;
    about: string;
    styles: string;
    experience: string;
    releases: string;
    rider: string;
  };
  lang: {
    label: string;
    choose: string;
  };
  cover: {
    aria: string;
    badge: string;
    tagline: string;
    scrollToAbout: string;
  };
  about: {
    aria: string;
    bio: string;
    booking: string;
    pressbook: string;
    guide: string;
  };
  styles: {
    aria: string;
    title: string;
    genres: string[];
  };
  experience: {
    aria: string;
    title: string;
    resident: string;
    geography: string;
    geographyList: string[];
    items: ExperienceEntry[];
  };
  releases: {
    aria: string;
    title: string;
    beatport: string;
    listen: string;
    items: ReleaseEntry[];
  };
  rider: {
    aria: string;
    title: string;
    items: string[];
    footer: string;
  };
  booking: {
    close: string;
    eyebrow: string;
    title: string;
    lead: string;
    name: string;
    email: string;
    phone: string;
    eventDate: string;
    venue: string;
    city: string;
    message: string;
    namePlaceholder: string;
    emailPlaceholder: string;
    phonePlaceholder: string;
    venuePlaceholder: string;
    cityPlaceholder: string;
    messagePlaceholder: string;
    selectDate: string;
    chooseDate: string;
    prevMonth: string;
    nextMonth: string;
    today: string;
    send: string;
    sending: string;
    orEmail: string;
    successTitle: string;
    successText: (email: string) => string;
    successClose: string;
    submitError: string;
    apiError: string;
    mainButton: string;
    mainButtonSubmit: string;
    shareTelegramPhone: string;
  };
  player: {
    aria: string;
    play: string;
    pause: string;
    tapToPlay: string;
    progress: string;
  };
  validation: ValidationMessages;
}

export interface LocaleOption {
  code: Locale;
  label: string;
  nativeName: string;
  dir: 'ltr' | 'rtl';
}
