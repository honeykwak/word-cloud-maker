import styled from 'styled-components';

// 공통 입력 스타일
export const commonInputStyles = `
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  box-sizing: border-box;
  font-family: inherit;
  color: #2c3e50;
  background-color: #fff;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #2196F3;
    box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1);
  }

  &::placeholder {
    color: #a0aec0;
  }
`;

// 기본 입력 필드
export const Input = styled.input`
  ${commonInputStyles}
`;

// 텍스트 영역
export const TextArea = styled.textarea`
  ${commonInputStyles}
  min-height: 60px;
  resize: vertical;
`;

// 셀렉트 박스
export const Select = styled.select`
  ${commonInputStyles}
  appearance: none;
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%232c3e50' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  padding-right: 32px;
`; 