import { useState, useRef } from 'react';
import * as d3 from 'd3';
import { Word } from '../../../types';
import { highlightWordInSentences, resetSentenceHighlights } from '../utils/highlighting';

interface WordSelectionOptions {
  maxSelectedWords?: number;
  selectedColors?: string[];
}

export function useWordSelection(words: Word[], options: WordSelectionOptions = {}) {
  const {
    maxSelectedWords = 1,
    selectedColors = [
      '#1e88e5', '#e53935', '#43a047', '#fb8c00', '#8e24aa', 
      '#00acc1', '#ffb300', '#6d4c41', '#546e7a', '#ec407a'
    ]
  } = options;

  // 선택된 단어 상태
  const [selectedWords, setSelectedWords] = useState<{ wordIndex: number, colorIndex: number }[]>([]);
  
  // 불투명도 스케일 참조
  const opacityScaleRef = useRef<d3.ScaleLinear<number, number>>();

  // 단어 선택 처리 함수
  const handleWordSelection = (wordIndex: number) => {
    // 단어가 이미 선택되었는지 확인
    const isSelected = selectedWords.some(sw => sw.wordIndex === wordIndex);
    
    // 새로운 선택 상태 계산
    let newSelectedWords;
    
    if (isSelected) {
      // 선택 해제 - 해당 단어 제거
      newSelectedWords = selectedWords.filter(w => w.wordIndex !== wordIndex);
    } else {
      // 선택 추가 로직
      if (selectedWords.length >= maxSelectedWords) {
        // 최대 개수 초과 시 가장 오래된 항목 제거
        const oldestWordIndex = selectedWords[0].wordIndex;
        const colorIndex = selectedWords[0].colorIndex;
        newSelectedWords = [...selectedWords.slice(1), { wordIndex, colorIndex }];
        
        // 제거되는 단어의 시각적 효과 제거
        resetWordHighlight(oldestWordIndex);
      } else {
        // 새로운 색상 인덱스로 추가
        newSelectedWords = [...selectedWords, { wordIndex, colorIndex: selectedWords.length }];
      }
    }
    
    // 상태 업데이트
    setSelectedWords(newSelectedWords);
    
    // 시각적 업데이트 처리
    if (isSelected) {
      resetWordHighlight(wordIndex);
    } else {
      highlightWord(wordIndex, newSelectedWords);
    }
    
    // 모든 문장 초기화 
    resetSentenceHighlights();
    
    // 선택된 모든 단어들 문장 강조 적용
    newSelectedWords.forEach(({ wordIndex: wi, colorIndex: ci }) => {
      if (wi < words.length) {
        const color = selectedColors[ci % selectedColors.length];
        highlightWordInSentences(words[wi].text, color);
      }
    });
    
    // useEffect 무시 플래그 설정
    window.skipEffectRender = true;
    setTimeout(() => {
      window.skipEffectRender = false;
    }, 200);
  };
  
  // 단어 강조 제거 함수
  const resetWordHighlight = (wordIndex: number) => {
    if (!opacityScaleRef.current) return;
    
    d3.select(`.word-${wordIndex}`)
      .style('filter', null)
      .style('fill', '#000000')
      .style('fill-opacity', d => {
        const wordObj = words.find(w => w.text === d3.select(`.word-${wordIndex}`).text());
        return wordObj ? opacityScaleRef.current!(wordObj.value) : 1;
      })
      .style('font-weight', 'normal')
      .classed('word-selected', false);
    
    d3.select(`.word-lines-${wordIndex}`).style('opacity', 0);
  };
  
  // 단어 강조 함수
  const highlightWord = (wordIndex: number, newSelectedWords: { wordIndex: number, colorIndex: number }[]) => {
    const selectedWord = newSelectedWords.find(w => w.wordIndex === wordIndex);
    if (!selectedWord) return;
    
    const colorIndex = selectedWord.colorIndex;
    const color = selectedColors[colorIndex % selectedColors.length];
    
    d3.select(`.word-${wordIndex}`)
      .classed('word-selected', true)
      .style('filter', 'drop-shadow(0 0 3px rgba(0, 0, 0, 0.3))')
      .style('fill', color)
      .style('fill-opacity', 1)
      .style('font-weight', 'bold');
    
    d3.select(`.word-lines-${wordIndex}`)
      .style('opacity', 1)
      .selectAll('line')
      .attr('stroke', color);
  };

  return {
    selectedWords,
    setSelectedWords,
    handleWordSelection,
    opacityScaleRef,
    resetWordHighlight,
    highlightWord
  };
} 