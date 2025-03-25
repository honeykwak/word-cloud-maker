export const VISUALIZATION_CONSTANTS = {
  // 줌 관련
  MIN_ZOOM: 0.1,
  MAX_ZOOM: 5,
  DEFAULT_ZOOM: 1,
  ZOOM_STEP: 0.2,
  
  // 시각화 레이아웃
  RADIUS_RATIO: 0.85,  // 원 반지름 비율 (minDimension의 %)
  WORD_RADIUS_RATIO: 0.7,  // 단어 배치 반경 (원 반지름의 %)
  
  // 단어 크기 관련
  MIN_FONT_SIZE: 10,
  MAX_FONT_SIZE: 32,
  
  // 색상 관련
  DEFAULT_COLORS: [
    '#1e88e5', '#e53935', '#43a047', '#fb8c00', '#8e24aa', 
    '#00acc1', '#ffb300', '#6d4c41', '#546e7a', '#ec407a'
  ],
  
  // 기타 설정
  SENTENCE_TRUNCATE_LENGTH: 30
}; 