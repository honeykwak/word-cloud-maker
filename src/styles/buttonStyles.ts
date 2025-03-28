import styled from 'styled-components';

// 아이콘 버튼 (주요 액션용)
export const IconButton = styled.button<{ $primary?: boolean }>`
  flex: 1;
  padding: 6px 12px;
  background-color: ${props => props.$primary ? '#2196F3' : '#f1f5f9'};
  color: ${props => props.$primary ? 'white' : '#475569'};
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: all 0.2s;

  &:hover {
    background-color: ${props => props.$primary ? '#1976D2' : '#e2e8f0'};
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

// 기본 버튼
export const Button = styled.button`
  padding: 8px 16px;
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
  
  &:hover {
    background-color: #1976D2;
  }
  
  &:disabled {
    background-color: #e2e8f0;
    cursor: not-allowed;
  }
`;

// 작은 액션 버튼
export const ActionButton = styled.button`
  background: none;
  border: none;
  padding: 2px;
  cursor: pointer;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  
  &:hover {
    background: #e2e8f0;
    color: #475569;
  }
`; 