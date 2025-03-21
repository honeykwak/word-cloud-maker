import React, { useState, useEffect } from 'react';
import TextInput from './components/TextInput';
import WordCloud from './components/WordCloud';
import ControlPanel from './components/ControlPanel';
import { WordCloudOptions, Word } from './types';
import { processText } from './utils/textProcessing';
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
  
  @media (max-width: 768px) {
    padding: 15px;
  }
`;

const Title = styled.h1`
  text-align: center;
  color: #2c3e50;
  margin-bottom: 2rem;
  font-size: 2.5rem;
  
  @media (max-width: 768px) {
    font-size: 2rem;
    margin-bottom: 1.5rem;
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
  }
`;

const Copyright = styled.div`
  color: #64748b;
  font-size: 0.875rem;
  padding: 1rem 0;
  text-align: center;
`;

const colors = {
  primary: '#2196F3',
  secondary: '#4CAF50',
  text: '#2c3e50',
  border: '#e2e8f0',
  background: '#f5f7f9'
};

const App: React.FC = () => {
  const [text, setText] = useState('');
  const [processedWords, setProcessedWords] = useState<Word[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [options, setOptions] = useState<WordCloudOptions>({
    rotationEnabled: true,
    maxRotation: 90,
    shape: 'square',
    colorTheme: 'default',
    minWordLength: 2,
    maxWords: 100,
    excludedWords: [],
    language: 'en'
  });
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [renderKey, setRenderKey] = useState(0);
  const [pendingOptions, setPendingOptions] = useState<WordCloudOptions>(options);
  const [hasOptionChanges, setHasOptionChanges] = useState(false);
  const [uniqueWordCount, setUniqueWordCount] = useState(0);

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
  };

  const handleGenerate = () => {
    if (!text.trim()) {
      alert('텍스트를 입력해주세요.');
      return;
    }

    setOptions(pendingOptions);
    setHasOptionChanges(false);
    setIsGenerating(true);
    setRenderKey(prev => prev + 1);

    try {
      // Web Worker 생성
      const worker = new Worker(new URL('./workers/textProcessing.worker.ts', import.meta.url));

      worker.onmessage = (e) => {
        const { type, words, error, status, stats } = e.data;
        
        if (type === 'progress') {
          console.log('Progress:', status);
          setProcessingStatus(status);
        } else if (type === 'success') {
          console.log('Processing complete:', stats);
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
        language: pendingOptions.language,
        minWordLength: pendingOptions.minWordLength,
        excludedWords: pendingOptions.excludedWords,
        maxWords: pendingOptions.maxWords
      });

    } catch (error) {
      console.error('Error in handleGenerate:', error);
      setIsGenerating(false);
      alert('텍스트 처리 중 오류가 발생했습니다.');
    }
  };

  const handleRegenerate = () => {
    setRenderKey(prev => prev + 1);
  };

  return (
    <>
      <GlobalStyle />
      <Container>
        <Title>워드 클라우드 생성기</Title>
        <Layout>
          <ControlPanelContainer>
            <ControlPanel 
              options={pendingOptions}
              onOptionsChange={handleOptionsChange}
              words={processedWords}
              totalUniqueWords={uniqueWordCount}
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
              <WordCloud 
                words={processedWords}
                options={options}
                isGenerating={isGenerating}
                processingStatus={processingStatus}
                renderKey={renderKey}
                onRegenerate={handleRegenerate}
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

export default App;