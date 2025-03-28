import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { createGlobalStyle } from 'styled-components';
import TextInput from './components/TextInput';
import TextArcVisualizer from './components/TextArcVisualizer';
import TextArcControlPanel from './components/TextArcControlPanel';
import { useVisualization } from './context/VisualizationContext';

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

const ArcSection = styled.div`
  flex: 2;
  min-height: 0;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  
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

// 색상 테마 타입 정의
type ColorTheme = 'blue' | 'rainbow' | 'gray' | 'warm' | 'cold' | 'custom';

const TextArc: React.FC = () => {
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
  
  // TextArc 전용 상태
  const [maxSelectedWords, setMaxSelectedWords] = useState<number>(1);
  const [selectedColors, setSelectedColors] = useState<string[]>([
    '#1e88e5' // 하나의 색상만 유지
  ]);
  const [colorTheme, setColorTheme] = useState<ColorTheme>('blue');
  
  // 색상 상태 수정 - 텍스트 색상은 항상 값이 있어야 함
  const [backgroundColor, setBackgroundColor] = useState<string | null>(null);
  const [defaultTextColor, setDefaultTextColor] = useState<string>('#333333');
  
  // 새로운 상태 추가
  const [maxSentenceLength, setMaxSentenceLength] = useState<number>(30); // 기본값 30
  
  // 빈도수 필터 슬라이더를 위한 상태 추가
  const [minWordFrequency, setMinWordFrequency] = useState<number>(2); // 기본값 2
  
  const navigateToRoot = () => {
    navigate('/');
  };
  
  const handleTextChange = (newText: string) => {
    setText(newText);
  };
  
  const handleGenerate = () => {
    setRenderKey(prev => prev + 1);
    processText();
  };
  
  // 색상 변경 핸들러 - 개선
  const handleColorChange = (index: number, color: string) => {
    // 빈 문자열이 전달되면 해당 색상을 삭제
    if (color === '') {
      // 해당 인덱스를 제외한 새 배열 생성
      const newColors = selectedColors.filter((_, i) => i !== index);
      setSelectedColors(newColors);
      return;
    }

    // 일반적인 색상 변경 로직
    const newColors = [...selectedColors];
    
    // 새 index가 현재 배열 길이보다 크면 배열 확장
    while (newColors.length <= index) {
      newColors.push('#1e88e5');
    }
    
    newColors[index] = color;
    setSelectedColors(newColors);
  };
  
  // 테마 변경 핸들러
  const handleColorThemeChange = (theme: ColorTheme) => {
    setColorTheme(theme);
  };

  // TextArc.tsx에서 배열 전체를 설정하는 함수 추가
  const setAllColors = (colors: string[]) => {
    setSelectedColors(colors);
    setMaxSelectedWords(colors.length);
  };
  
  // 핸들러 수정
  const handleBackgroundColorChange = (color: string | null) => {
    setBackgroundColor(color);
  };

  const handleDefaultTextColorChange = (color: string) => {
    // null 값을 허용하지 않음
    if (color) {
      setDefaultTextColor(color);
    }
  };
  
  // 새로운 핸들러 추가
  const handleMaxSentenceLengthChange = (length: number) => {
    setMaxSentenceLength(length);
  };
  
  // 빈도수 필터링 핸들러 추가
  const handleMinWordFrequencyChange = (value: number) => {
    setMinWordFrequency(value);
    setRenderKey(prev => prev + 1); // 변경 시 재렌더링
  };
  
  // 필터링된 단어 계산
  const filteredWords = useMemo(() => {
    return processedWords.filter(word => 
      !excludedWords.includes(word.text) && 
      word.value >= minWordFrequency
    );
  }, [processedWords, excludedWords, minWordFrequency]);
  
  useEffect(() => {
    // 컴포넌트가 마운트될 때 초기값을 한 번 더 설정하여 UI에 반영
    handleMinWordFrequencyChange(2);
  }, []);
  
  return (
    <>
      <GlobalStyle />
      <Container>
        <Header>
          <Title onClick={navigateToRoot}>
            AJOU visualization practice
          </Title>
          
          <NavButtons>
            <NavButton onClick={() => navigate('/wordcloud')}>
              워드 클라우드
            </NavButton>
            <NavButton $active={true} onClick={() => navigate('/textarc')}>
              텍스트 아크
            </NavButton>
          </NavButtons>
        </Header>
        
        <Layout>
          <ControlPanelContainer>
            <TextArcControlPanel
              maxSelectedWords={maxSelectedWords}
              onMaxSelectedWordsChange={setMaxSelectedWords}
              selectedColors={selectedColors}
              onColorChange={handleColorChange}
              excludedWords={excludedWords}
              onExcludedWordsChange={setExcludedWords}
              processedWords={processedWords}
              onGenerateClick={handleGenerate}
              isGenerating={isGenerating}
              colorTheme={colorTheme}
              onColorThemeChange={handleColorThemeChange}
              onSetAllColors={setAllColors}
              backgroundColor={backgroundColor}
              onBackgroundColorChange={handleBackgroundColorChange}
              defaultTextColor={defaultTextColor}
              onDefaultTextColorChange={handleDefaultTextColorChange}
              maxSentenceLength={maxSentenceLength}
              onMaxSentenceLengthChange={handleMaxSentenceLengthChange}
              minWordFrequency={minWordFrequency}
              onMinWordFrequencyChange={handleMinWordFrequencyChange}
            />
          </ControlPanelContainer>
          
          <MainContent>
            <InputSection>
              <TextInput 
                onTextChange={handleTextChange} 
                isGenerating={isGenerating}
              />
            </InputSection>
            <ArcSection>
              <TextArcVisualizer 
                key={renderKey}
                words={filteredWords}
                text={text}
                isGenerating={isGenerating}
                processingStatus={processingStatus}
                maxSelectedWords={maxSelectedWords}
                selectedColors={selectedColors}
                backgroundColor={backgroundColor}
                defaultTextColor={defaultTextColor}
                maxSentenceLength={maxSentenceLength}
              />
            </ArcSection>
          </MainContent>
        </Layout>
        
        <Copyright>
          © 2024-2025 Kwak Jaeheon. All rights reserved.
        </Copyright>
      </Container>
    </>
  );
};

export default TextArc; 