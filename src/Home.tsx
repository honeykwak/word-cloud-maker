import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body {
    width: 100%;
    height: 100%;
    overflow: hidden;
    font-family: "Noto Sans KR", -apple-system, BlinkMacSystemFont, "Malgun Gothic", "맑은 고딕", helvetica, "Apple SD Gothic Neo", sans-serif;
  }

  #root {
    width: 100%;
    height: 100%;
  }

  input, select, textarea, button {
    font-family: inherit;
  }
`;

const Container = styled.div`
  width: 100%;
  height: 100%;
  padding: 20px;
  background-color: #f5f7f9;
  box-sizing: border-box;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  
  @media (max-width: 768px) {
    padding: 15px;
  }
`;

const Title = styled.h1`
  text-align: center;
  color: #2c3e50;
  margin-bottom: 40px;
  font-size: 3.5rem;
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
    margin-bottom: 30px;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 20px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 15px;
  }
`;

const Button = styled.button`
  padding: 15px 30px;
  font-size: 1.2rem;
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s;
  
  &:hover {
    background-color: #1976D2;
  }
`;

const Copyright = styled.div`
  color: #64748b;
  font-size: 0.875rem;
  padding: 1rem 0;
  text-align: center;
  position: absolute;
  bottom: 20px;
`;

const Home: React.FC = () => {
  const navigate = useNavigate();
  
  const goToWordCloud = () => {
    navigate('/wordcloud');
  };
  
  const goToTextArc = () => {
    navigate('/textarc');
  };
  
  return (
    <>
      <GlobalStyle />
      <Container>
        <Title>AJOU visualization tester</Title>
        <ButtonContainer>
          <Button onClick={goToWordCloud}>워드 클라우드 시작하기</Button>
          <Button onClick={goToTextArc}>텍스트 아크 시작하기</Button>
        </ButtonContainer>
        <Copyright>
          © 2024-2025 Kwak Jaeheon. All rights reserved.
        </Copyright>
      </Container>
    </>
  );
};

export default Home; 