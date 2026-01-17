export enum AppTab {
  TRANSLATE = 'TRANSLATE',
  IMAGE_EDIT = 'IMAGE_EDIT',
  IMAGE_ANALYZE = 'IMAGE_ANALYZE',
  SCREEN_TRANSLATOR = 'SCREEN_TRANSLATOR',
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

export interface ImageEditResult {
  originalImage: string | null;
  generatedImage: string | null;
  prompt: string;
}

export interface LanguageOption {
  code: string;
  name: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'vi', name: 'Tiếng Việt' },
  { code: 'en', name: 'Tiếng Anh' },
  { code: 'ja', name: 'Tiếng Nhật' },
  { code: 'ko', name: 'Tiếng Hàn' },
  { code: 'zh', name: 'Tiếng Trung' },
  { code: 'fr', name: 'Tiếng Pháp' },
  { code: 'es', name: 'Tiếng Tây Ban Nha' },
  { code: 'de', name: 'Tiếng Đức' },
];