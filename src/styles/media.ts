import { BREAKPOINTS } from './constants';

// 미디어 쿼리 유틸리티
export const media = {
  mobile: `@media (max-width: ${BREAKPOINTS.MOBILE})`,
  tablet: `@media (max-width: ${BREAKPOINTS.TABLET})`,
  desktop: `@media (min-width: ${BREAKPOINTS.TABLET})`,
  largeDesktop: `@media (min-width: ${BREAKPOINTS.DESKTOP})`
};

// 미디어 쿼리 적용 예시:
// ${media.mobile} {
//   font-size: 14px;
// } 