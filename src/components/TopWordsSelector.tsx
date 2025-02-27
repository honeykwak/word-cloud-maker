import React from 'react';
import styled from 'styled-components';
import { Word } from '../types';

interface TopWordsSelectorProps {
  words: Word[];
  excludedWords: string[];
  onToggleWord: (word: string) => void;
}

const Container = styled.div`
  margin: 10px 0;
`;

const WordList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 120px;
  overflow-y: auto;
  padding: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  background: #f8fafc;
`;

const WordItem = styled.div<{ $isExcluded: boolean }>`
  padding: 4px 8px;
  border-radius: 4px;
  background: ${props => props.$isExcluded ? '#e2e8f0' : '#fff'};
  border: 1px solid ${props => props.$isExcluded ? '#cbd5e1' : '#e2e8f0'};
  cursor: pointer;
  user-select: none;
  font-size: 14px;
  color: ${props => props.$isExcluded ? '#64748b' : '#1e293b'};
  transition: all 0.2s;

  &:hover {
    background: ${props => props.$isExcluded ? '#cbd5e1' : '#f1f5f9'};
  }

  &::after {
    content: " (" attr(data-count) ")";
    color: #64748b;
    font-size: 12px;
  }
`;

const Title = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #475569;
  margin-bottom: 8px;
`;

const TopWordsSelector: React.FC<TopWordsSelectorProps> = ({ words, excludedWords, onToggleWord }) => {
  const topWords = words.slice(0, 20);  // 상위 20개 단어만 선택

  return (
    <Container>
      <Title>상위 빈도 단어 (클릭으로 불용어 지정/해제)</Title>
      <WordList>
        {topWords.map((word) => (
          <WordItem
            key={word.text}
            $isExcluded={excludedWords.includes(word.text.toLowerCase())}
            onClick={() => onToggleWord(word.text)}
            data-count={word.value}
          >
            {word.text}
          </WordItem>
        ))}
      </WordList>
    </Container>
  );
};

export default TopWordsSelector; 