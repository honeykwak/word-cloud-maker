import { keyframes } from 'styled-components';
import { ANIMATION } from './constants';

// 페이드인 애니메이션
export const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

// 페이드아웃 애니메이션
export const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

// 위로 슬라이드 애니메이션
export const slideUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

// 확장 애니메이션
export const expand = keyframes`
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
`;

// 회전 애니메이션
export const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

// 애니메이션 적용을 위한 유틸리티 믹스인
export const animationMixin = (animation: any, duration = ANIMATION.NORMAL, timing = 'ease-out', delay = '0s') => `
  animation: ${animation} ${duration} ${timing} ${delay};
`; 