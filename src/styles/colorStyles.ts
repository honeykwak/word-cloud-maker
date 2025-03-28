import styled from 'styled-components';

// 색상 샘플
export const ColorSample = styled.span<{ color: string }>`
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 2px;
  background-color: ${props => props.color};
  border: 1px solid rgba(0, 0, 0, 0.1);
`;

// 색상 선택기
export const ColorPicker = styled.input`
  width: 30px;
  height: 30px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: none;
  cursor: pointer;
  overflow: hidden;
  
  &::-webkit-color-swatch-wrapper {
    padding: 0;
  }
  
  &::-webkit-color-swatch {
    border: 1px solid #e2e8f0;
    border-radius: 50%;
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.3);
  }
`;

// 색상 프리뷰
export const ColorInputPreview = styled.div<{ 
  $color: string | null, 
  $hasColor: boolean,
  $removable?: boolean
}>`
  width: 32px;
  height: 32px;
  border-radius: 4px;
  background-color: ${props => props.$hasColor ? props.$color : 'white'};
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  
  // 색상이 없을 때 + 표시
  ${props => !props.$hasColor && `
    &::before,
    &::after {
      content: '';
      position: absolute;
      background-color: #475569;
    }
    
    &::before {
      width: 2px;
      height: 14px;
      top: 9px;
      left: 15px;
    }
    
    &::after {
      width: 14px;
      height: 2px;
      top: 15px;
      left: 9px;
    }
  `}
  
  // 제거 가능한 색상에 대한 호버 효과
  ${props => props.$hasColor && props.$removable && `
    &:hover::before,
    &:hover::after {
      opacity: 1;
    }
  `}
  
  &:hover {
    transform: scale(1.1);
  }
`; 