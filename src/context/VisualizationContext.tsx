import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Word, WordCloudOptions, Language } from '../types';

interface VisualizationContextType {
  // 공유 데이터
  text: string;
  processedWords: Word[];
  excludedWords: string[];
  language: Language;
  
  // 공유 상태
  isGenerating: boolean;
  processingStatus: string;
  
  // 액션
  setText: (text: string) => void;
  setProcessedWords: (words: Word[]) => void;
  setExcludedWords: (words: string[]) => void;
  setLanguage: (lang: Language) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setProcessingStatus: (status: string) => void;
  
  // 텍스트 처리 함수
  processText: () => void;
}

const VisualizationContext = createContext<VisualizationContextType | undefined>(undefined);

export const useVisualization = () => {
  const context = useContext(VisualizationContext);
  if (!context) {
    throw new Error('useVisualization must be used within a VisualizationProvider');
  }
  return context;
};

export interface VisualizationState {
  text: string;
  processedWords: Word[];
  excludedWords: string[];
  language: Language;
  isGenerating: boolean;
  processingStatus: string;
  textStats: {
    withSpaces: number;
    withoutSpaces: number;
    byteSize: number;
    byteNoSpaces: number;
    totalWords: number;
    uniqueWords: number;
  };
}

const initialState: VisualizationState = {
  text: '',
  processedWords: [],
  excludedWords: [],
  language: 'en',
  isGenerating: false,
  processingStatus: '',
  textStats: {
    withSpaces: 0,
    withoutSpaces: 0,
    byteSize: 0,
    byteNoSpaces: 0,
    totalWords: 0,
    uniqueWords: 0
  }
};

export const VisualizationProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  // 공유 상태
  const [text, setText] = useState('');
  const [processedWords, setProcessedWords] = useState<Word[]>([]);
  const [excludedWords, setExcludedWords] = useState<string[]>([]);
  const [language, setLanguage] = useState<Language>('en');
  const [isGenerating, setIsGenerating] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');

  // 텍스트 처리 함수
  const processText = () => {
    if (!text.trim()) {
      alert('텍스트를 입력해주세요.');
      return;
    }

    setIsGenerating(true);

    try {
      // Web Worker 생성
      const worker = new Worker(new URL('../workers/textProcessing.worker.ts', import.meta.url));

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

      // 항상 최소 단어 길이를 1로 설정하여 모든 단어 처리
      worker.postMessage({
        text,
        language,
        minWordLength: 1, // 항상 1로 설정
        excludedWords,
        maxWords: 500 // 더 많은 단어를 처리
      });

    } catch (error) {
      console.error('Error in processText:', error);
      setIsGenerating(false);
      alert('텍스트 처리 중 오류가 발생했습니다.');
    }
  };

  const value = {
    text,
    processedWords,
    excludedWords,
    language,
    isGenerating,
    processingStatus,
    setText,
    setProcessedWords,
    setExcludedWords,
    setLanguage,
    setIsGenerating,
    setProcessingStatus,
    processText
  };

  return (
    <VisualizationContext.Provider value={value}>
      {children}
    </VisualizationContext.Provider>
  );
}; 