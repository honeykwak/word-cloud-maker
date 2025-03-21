export type Language = 'ko' | 'en' | 'fr';

export type ShapeFunction = (theta: number) => number;

export interface WordCloudOptions {
  rotationEnabled: boolean;
  minRotation: number;
  maxRotation: number;
  shape: 'square' | 'wide' | 'tall' | 'circular' | 'heart' | 'pentagon' | 'star' | 'custom';
  customShape?: ShapeFunction; // 커스텀 모양을 위한 함수
  colorTheme: 'default' | 'warm' | 'cool' | 'custom';
  customColors?: string[]; // 사용자 지정 색상 배열 추가
  minWordLength: number;
  maxWords: number;
  excludedWords: string[];
  language: Language;
}

export interface Word {
  text: string;
  value: number;
} 