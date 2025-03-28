import styled from 'styled-components';

// 메인 컨테이너
export const Container = styled.div`
  background: #ffffff;
  padding: 20px;
  border-radius: 12px;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  overflow-y: auto;
  
  @media (max-width: 768px) {
    padding: 15px;
  }
`;

// 섹션 컨테이너
export const Section = styled.div`
  margin-bottom: 25px;
  
  &:last-child {
    margin-bottom: 0;
  }

  @media (max-width: 1024px) {
    margin-bottom: 15px;
  }
`;

// 제목
export const Title = styled.h3`
  color: #2c3e50;
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 10px;
  
  @media (max-width: 768px) {
    font-size: 0.9rem;
  }
`;

// 부제목
export const SubTitle = styled.h4`
  font-size: 0.9rem;
  margin-bottom: 5px;
  color: #333;
  font-weight: normal;
`;

// 빈 상태 표시
export const EmptyState = styled.div`
  padding: 15px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  color: #64748b;
  font-size: 0.9rem;
  text-align: center;
  margin-top: 10px;
`; 