/** Telegram Mini App SDK (telegram-web-app.js) */
interface TelegramWebAppUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

interface TelegramMainButton {
  text: string;
  color: string;
  textColor: string;
  isVisible: boolean;
  isActive: boolean;
  isProgressVisible: boolean;
  setText: (text: string) => void;
  show: () => void;
  hide: () => void;
  enable: () => void;
  disable: () => void;
  onClick: (callback: () => void) => void;
  offClick: (callback: () => void) => void;
  showProgress: (leaveActive?: boolean) => void;
  hideProgress: () => void;
}

interface TelegramSafeAreaInset {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

interface TelegramWebAppContact {
  first_name: string;
  last_name?: string;
  phone_number: string;
  user_id: number;
}

export interface RequestContactResponseSent {
  status: 'sent';
  response: string;
  responseUnsafe: {
    auth_date: string;
    contact: TelegramWebAppContact;
    hash: string;
  };
}

export interface RequestContactResponseCancelled {
  status: 'cancelled';
}

export type RequestContactResponse =
  | RequestContactResponseSent
  | RequestContactResponseCancelled;

interface TelegramWebApp {
  initData: string;
  initDataUnsafe?: {
    user?: TelegramWebAppUser;
  };
  /** Язык интерфейса Telegram-клиента (IETF tag) */
  languageCode?: string;
  MainButton: TelegramMainButton;
  ready: () => void;
  expand: () => void;
  close: () => void;
  requestContact?: (
    callback?: (success: boolean, response?: RequestContactResponse) => void,
  ) => void;
  requestFullscreen?: () => void;
  exitFullscreen?: () => void;
  disableVerticalSwipes?: () => void;
  enableVerticalSwipes?: () => void;
  enableClosingConfirmation?: () => void;
  disableClosingConfirmation?: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  onEvent?: (eventType: string, callback: () => void) => void;
  offEvent?: (eventType: string, callback: () => void) => void;
  safeAreaInset?: TelegramSafeAreaInset;
  contentSafeAreaInset?: TelegramSafeAreaInset;
  viewportHeight?: number;
  viewportStableHeight?: number;
  isExpanded?: boolean;
  isFullscreen?: boolean;
  isVerticalSwipesEnabled?: boolean;
  platform?: string;
  colorScheme?: 'light' | 'dark';
}

interface TelegramNamespace {
  WebApp: TelegramWebApp;
}

declare global {
  interface Window {
    Telegram?: TelegramNamespace;
  }
}

export {};
