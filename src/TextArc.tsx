import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { createGlobalStyle } from 'styled-components';
import TextInput from './components/TextInput';
import TextArcVisualizer from './components/TextArcVisualizer';
import { Word } from './types';
import { FiSliders } from 'react-icons/fi';

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
  display: flex;
  justify-content: center;
  align-items: center;
  
  @media (max-width: 1024px) {
    height: auto;
    overflow-y: visible;
    grid-area: controls;
  }
`;

const ComingSoonText = styled.div`
  font-size: 1.5rem;
  color: #94a3b8;
  text-align: center;
`;

const Copyright = styled.div`
  color: #64748b;
  font-size: 0.875rem;
  padding: 1rem 0;
  text-align: center;
`;

const GenerateButton = styled.button`
  padding: 12px 24px;
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
  margin: 0 auto;
  display: block;
  
  &:hover {
    background-color: #1976D2;
  }
  
  &:disabled {
    background-color: #e2e8f0;
    cursor: not-allowed;
  }
`;

// 컬러 선택기 스타일
const ColorGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-top: 10px;
`;

const ColorSwatch = styled.div<{ color: string, isSelected: boolean }>`
  width: 100%;
  aspect-ratio: 1;
  background-color: ${props => props.color};
  border-radius: 4px;
  cursor: pointer;
  border: 2px solid ${props => props.isSelected ? '#000' : 'transparent'};
  
  &:hover {
    transform: scale(1.05);
  }
`;

const SettingSection = styled.div`
  margin-bottom: 20px;
  
  h3 {
    font-size: 1rem;
    margin-bottom: 10px;
    color: #333;
  }
`;

const RangeInput = styled.input`
  width: 100%;
  margin: 10px 0;
`;

const ValueDisplay = styled.div`
  display: flex;
  justify-content: space-between;
  color: #666;
  font-size: 0.9rem;
`;

const TextArc: React.FC = () => {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [processedWords, setProcessedWords] = useState<Word[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [renderKey, setRenderKey] = useState(0);
  
  // 설정 관련 상태 추가
  const [maxSelectedWords, setMaxSelectedWords] = useState<number>(1);
  const [selectedColors, setSelectedColors] = useState<string[]>([
    '#1e88e5', // 파란색(기존 색상)
    '#e53935', // 빨간색
    '#43a047', // 녹색
    '#fb8c00', // 주황색
    '#8e24aa', // 보라색
    '#00acc1', // 청록색
    '#ffb300', // 황금색
    '#6d4c41', // 갈색
    '#546e7a', // 파란 회색
    '#ec407a'  // 분홍색
  ]);
  
  // 색상 커스터마이징 상태
  const [customizingColorIndex, setCustomizingColorIndex] = useState<number | null>(null);
  const [customColor, setCustomColor] = useState<string>('#1e88e5');
  
  const navigateToRoot = () => {
    navigate('/');
  };
  
  const handleTextChange = (newText: string) => {
    setText(newText);
  };
  
  const handleGenerate = () => {
    if (!text.trim()) {
      alert('텍스트를 입력해주세요.');
      return;
    }

    setIsGenerating(true);
    setRenderKey(prev => prev + 1);

    try {
      // Web Worker 생성
      const worker = new Worker(new URL('./workers/textProcessing.worker.ts', import.meta.url));

      worker.onmessage = (e) => {
        const { type, words, error, status } = e.data;
        
        if (type === 'progress') {
          console.log('Progress:', status);
          setProcessingStatus(status);
        } else if (type === 'success') {
          if (words.length === 0) {
            alert('처리할 수 있는 단어가 없습니다.');
          } else {
            console.log('Top 50 words:', words.slice(0, 50));
            setProcessedWords(words);
          }
          setProcessingStatus('');
          setIsGenerating(false);
          worker.terminate();
        } else {
          console.error('Worker error:', error);
          alert('텍스트 처리 중 오류가 발생했습니다: ' + error);
          setProcessingStatus('');
          setIsGenerating(false);
          worker.terminate();
        }
      };

      worker.onerror = (error) => {
        console.error('Worker error:', error);
        alert('텍스트 처리 중 오류가 발생했습니다.');
        setIsGenerating(false);
        worker.terminate();
      };

      // 작업 시작
      worker.postMessage({
        text,
        language: 'en',
        minWordLength: 2,
        excludedWords: [],
        maxWords: 100
      });

    } catch (error) {
      console.error('Error in handleGenerate:', error);
      setIsGenerating(false);
      alert('텍스트 처리 중 오류가 발생했습니다.');
    }
  };
  
  // 색상 변경 핸들러
  const handleColorChange = (index: number, color: string) => {
    const newColors = [...selectedColors];
    newColors[index] = color;
    setSelectedColors(newColors);
    setCustomizingColorIndex(null);
  };
  
  return (
    <>
      <GlobalStyle />
      <Container>
        <Title onClick={navigateToRoot}>
          AJOU visualization practice
        </Title>
        
        <Layout>
          <ControlPanelContainer>
            <div style={{ padding: '20px', width: '100%' }}>
              <SettingSection>
                <h3>선택 가능한 최대 단어 수</h3>
                <RangeInput
                  type="range"
                  min="1"
                  max="10"
                  value={maxSelectedWords}
                  onChange={(e) => setMaxSelectedWords(parseInt(e.target.value))}
                />
                <ValueDisplay>
                  <span>1</span>
                  <span>{maxSelectedWords}</span>
                  <span>10</span>
                </ValueDisplay>
              </SettingSection>
              
              <SettingSection>
                <h3>선택 단어 색상</h3>
                <ColorGrid>
                  {selectedColors.slice(0, maxSelectedWords).map((color, index) => (
                    <ColorSwatch 
                      key={index}
                      color={color}
                      isSelected={customizingColorIndex === index}
                      onClick={() => setCustomizingColorIndex(index)}
                    />
                  ))}
                </ColorGrid>
                
                {customizingColorIndex !== null && (
                  <div style={{ marginTop: '15px' }}>
                    <input
                      type="color"
                      value={selectedColors[customizingColorIndex]}
                      onChange={(e) => handleColorChange(customizingColorIndex, e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </div>
                )}
              </SettingSection>
              
              <GenerateButton 
                onClick={handleGenerate}
                disabled={isGenerating || !text.trim()}
              >
                {isGenerating ? '생성 중...' : 'TextArc 생성하기'}
              </GenerateButton>
            </div>
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
                words={processedWords}
                text={text}
                isGenerating={isGenerating}
                processingStatus={processingStatus}
                maxSelectedWords={maxSelectedWords}
                selectedColors={selectedColors}
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