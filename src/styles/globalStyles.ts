import { createGlobalStyle } from 'styled-components';
import { COLORS, FONT_SIZES } from './constants';

export const GlobalStyles = createGlobalStyle`
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    font-size: ${FONT_SIZES.MD};
    color: ${COLORS.TEXT_PRIMARY};
    background-color: #f8fafc;
    line-height: 1.5;
  }
  
  button, input, select, textarea {
    font-family: inherit;
  }
`;

// App.tsx 또는 메인 컴포넌트에서 사용:
// <GlobalStyles /> 