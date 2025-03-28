import styled from 'styled-components';

// 슬라이더 관련 공통 스타일
export const SliderContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
`;

export const Slider = styled.input`
  flex: 1;
  -webkit-appearance: none;
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  outline: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    background: #2196F3;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s;
  }

  &::-webkit-slider-thumb:hover {
    transform: scale(1.1);
  }
`;

// 숫자 입력 관련 공통 스타일
export const NumberInputWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 70px;
  user-select: none;
`;

export const NumberText = styled.span`
  font-size: 0.875rem;
  color: #475569;
  cursor: pointer;
  
  &:hover {
    color: #2196F3;
  }
`;

export const NumberDisplay = styled.span`
  font-size: 1rem;
  color: #2c3e50 !important;
  cursor: pointer;
  white-space: nowrap;
  
  &:hover {
    color: #2196F3 !important;
  }
`;

export const NumberPopup = styled.div`
  position: absolute;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 100;
`;

export const NumberPopupInput = styled.input`
  width: 80px;
  padding: 4px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  text-align: center;
  font-size: 0.875rem;
  
  &:focus {
    outline: none;
    border-color: #2196F3;
  }
`;

export const NumberInputContainer = styled.div`
  display: flex;
  align-items: center;
  min-width: 55px;
  justify-content: flex-end;
`; 