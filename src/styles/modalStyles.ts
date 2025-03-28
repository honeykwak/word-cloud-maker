import styled from 'styled-components';

// 오버레이
export const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
`;

// 팝업 컨테이너
export const PopupContainer = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 20px;
  width: 90%;
  max-width: 420px;
`;

// 팝업 제목
export const PopupTitle = styled.div`
  font-weight: 500;
  font-size: 14px;
  color: #475569;
  margin-bottom: 12px;
`;

// 닫기 버튼
export const CloseButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 4px;
  
  &:hover {
    color: #475569;
  }
`; 