import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { createGlobalStyle } from 'styled-components';
import TextInput from './components/TextInput';
import WordCloudComponent from './components/WordCloud';
import ControlPanel from './components/ControlPanel';
import { useVisualization } from './context/VisualizationContext';
import { WordCloudOptions } from './types';

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
  
  @media (max-width: 768px) {
    padding: 15px;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const NavButtons = styled.div`
  display: flex;
  margin-left: 20px;
  
  @media (max-width: 768px) {
    margin-left: 0;
    margin-top: 10px;
  }
`;

const NavButton = styled.button<{ $active?: boolean }>`
  padding: 8px 16px;
  margin-right: 10px;
  background-color: ${props => props.$active ? '#2196F3' : '#ffffff'};
  color: ${props => props.$active ? 'white' : '#2c3e50'};
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: ${props => props.$active ? '#1976D2' : '#f1f5f9'};
  }
`;

const Title = styled.h1`
  text-align: left;
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 2.5rem;
  cursor: pointer;
  
  @media (max-width: 768px) {
    font-size: 2rem;
    margin-bottom: 15px;
  }
`;

const Layout = styled.div`
  display: grid;
  grid-template-columns: 1fr 3fr;
  gap: 20px;
  flex: 1;
  min-height: 0;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 3fr;
    grid-template-areas: 
      "controls"
      "main";
    gap: 15px;
  }
`;

const MainContent = styled.div`
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 20px;
  width: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;

  @media (max-width: 1024px) {
    grid-area: main;
    flex: 3;
  }

  @media (max-width: 768px) {
    padding: 15px;
    gap: 15px;
  }
`;

const InputSection = styled.div`
  flex: 1;
  min-height: 0;
  
  @media (max-width: 1024px) {
    min-height: 200px;
    flex: 0 0 auto;
  }
`;

const CloudSection = styled.div`
  flex: 2;
  min-height: 0;
  position: relative;
  
  @media (max-width: 1024px) {
    flex: 1 1 auto;
  }
`;

const ControlPanelContainer = styled.div`
  width: 100%;
  height: 100%;
  overflow-y: auto;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  
  @media (max-width: 1024px) {
    height: auto;
    overflow-y: visible;
    grid-area: controls;
  }
`;

const Copyright = styled.div`
  color: #64748b;
  font-size: 0.875rem;
  padding: 1rem 0;
  text-align: center;
`;

const WordCloud: React.FC = () => {
  const navigate = useNavigate();
  const { 
    text, setText, 
    processedWords, 
    excludedWords, setExcludedWords,
    isGenerating, 
    processingStatus, 
    processText 
  } = useVisualization();
  
  const [renderKey, setRenderKey] = useState(0);
  const [options, setOptions] = useState<WordCloudOptions>({
    rotationEnabled: true,
    minRotation: -30,
    maxRotation: 30,
    shape: 'square',
    colorTheme: 'default',
    minWordLength: 2,
    maxWords: 100,
    excludedWords: excludedWords,
    language: 'en'
  });
  
  // App.tsx에서 가져온 상태와 핸들러들
  const [pendingOptions, setPendingOptions] = useState<WordCloudOptions>(options);
  const [hasOptionChanges, setHasOptionChanges] = useState(false);
  const [uniqueWordCount, setUniqueWordCount] = useState(0);

  // excludedWords가 변경되면 options와 pendingOptions도 업데이트
  useEffect(() => {
    setOptions(prev => ({ ...prev, excludedWords }));
    setPendingOptions(prev => ({ ...prev, excludedWords }));
  }, [excludedWords]);
  
  const navigateToRoot = () => {
    navigate('/');
  };

  const handleTextChange = (newText: string) => {
    setText(newText);
    
    // 고유 단어 수 계산
    const words = newText.trim().split(/\s+/);
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    setUniqueWordCount(uniqueWords.size);
  };

  const handleOptionsChange = (newOptions: WordCloudOptions) => {
    setPendingOptions(newOptions);
    setHasOptionChanges(true);
    
    // 불용어 변경 시 전역 상태도 업데이트
    if (newOptions.excludedWords !== options.excludedWords) {
      setExcludedWords(newOptions.excludedWords);
    }
  };

  const handleGenerate = () => {
    setOptions(pendingOptions);
    setHasOptionChanges(false);
    setRenderKey(prev => prev + 1);
    processText();
  };

  return (
    <>
      <GlobalStyle />
      <Container>
        <Header>
          <Title onClick={navigateToRoot}>
            AJOU visualization practice
          </Title>
          
          <NavButtons>
            <NavButton $active={true} onClick={() => navigate('/wordcloud')}>
              워드 클라우드
            </NavButton>
            <NavButton onClick={() => navigate('/textarc')}>
              텍스트 아크
            </NavButton>
          </NavButtons>
        </Header>
        
        <Layout>
          <ControlPanelContainer>
            <ControlPanel
              options={pendingOptions}
              onOptionsChange={handleOptionsChange}
              totalUniqueWords={uniqueWordCount}
              words={processedWords}
              onGenerateCloud={handleGenerate}
            />
          </ControlPanelContainer>
          
          <MainContent>
            <InputSection>
              <TextInput 
                onTextChange={handleTextChange} 
                isGenerating={isGenerating}
              />
            </InputSection>
            <CloudSection>
              <WordCloudComponent
                key={renderKey}
                words={processedWords}
                options={options}
                isGenerating={isGenerating}
                processingStatus={processingStatus}
                renderKey={renderKey}
                onRegenerate={handleGenerate}
              />
            </CloudSection>
          </MainContent>
        </Layout>
        
        <Copyright>
          © 2024-2025 Kwak Jaeheon. All rights reserved.
        </Copyright>
      </Container>
    </>
  );
};

export default WordCloud; 