import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import styled from 'styled-components';
import { Word } from '../types';
import { FiZoomIn, FiZoomOut, FiMaximize, FiDownload } from 'react-icons/fi';
import { toPng } from 'html-to-image';

interface TextArcVisualizerProps {
  words: Word[];
  text: string;
  isGenerating: boolean;
  processingStatus?: string;
  maxSelectedWords?: number; // 선택 가능한 최대 단어 수 (기본값: 1)
  selectedColors?: string[]; // 선택된 단어에 적용할 색상 배열
}

const Container = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  background: white;
  border-radius: 8px;
  overflow: hidden;
`;

const SVGContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 10;

  .spinner {
    border: 4px solid rgba(0, 0, 0, 0.1);
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border-left-color: #09f;
    animation: spin 1s linear infinite;
  }

  .status {
    margin-top: 1rem;
    font-size: 14px;
    color: #333;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ButtonContainer = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 10px;
  z-index: 5;
`;

const IconButton = styled.button`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);

  &:hover {
    background: #f8f9fa;
    transform: translateY(-2px);
  }
`;

const NoDataMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  color: #94a3b8;
  font-size: 1.1rem;
`;

// TypeScript 확장 정의 추가 (파일 상단)
declare global {
  interface Window {
    lastClickTimestamp?: number;
    skipEffectRender?: boolean;
  }
}

const TextArcVisualizer: React.FC<TextArcVisualizerProps> = ({ 
  words, 
  text,
  isGenerating,
  processingStatus,
  maxSelectedWords = 1, // 기본값: 1개만 선택 가능
  selectedColors = [
    // 기본 색상 10개 제공
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
  ]
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<[number, number]>([0, 0]);
  
  // 선택된 단어를 관리하는 state
  const [selectedWords, setSelectedWords] = useState<{ wordIndex: number, colorIndex: number }[]>([]);

  // 전역 스케일 함수 정의 - 컴포넌트 레벨에서 접근 가능하도록
  const opacityScaleRef = useRef<d3.ScaleLinear<number, number>>();

  const downloadImage = async () => {
    if (!containerRef.current) return;
    
    try {
      const dataUrl = await toPng(containerRef.current, { 
        backgroundColor: '#ffffff',
        cacheBust: true 
      });
      
      const link = document.createElement('a');
      link.download = 'textarc-visualization.png';
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('이미지 다운로드 오류:', err);
    }
  };

  const resetView = () => {
    setZoom(1);
    setTranslateX(0);
    setTranslateY(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart([e.clientX, e.clientY]);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const dx = e.clientX - dragStart[0];
    const dy = e.clientY - dragStart[1];
    
    setTranslateX(prev => prev + dx);
    setTranslateY(prev => prev + dy);
    setDragStart([e.clientX, e.clientY]);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // SVGContainer 컴포넌트에 ref 추가
  const svgContainerRef = useRef<HTMLDivElement>(null);

  // useEffect 내에서 wheel 이벤트 리스너 직접 추가
  useEffect(() => {
    const svgContainer = svgContainerRef.current;
    if (!svgContainer) return;
    
    // 스크롤 이벤트 핸들러
    const handleWheelEvent = (e: WheelEvent) => {
      e.preventDefault();
      
      const zoomStep = 0.1;
      if (e.deltaY < 0) {
        setZoom(prev => Math.min(prev + zoomStep, 5));
      } else {
        setZoom(prev => Math.max(prev - zoomStep, 0.1));
      }
    };
    
    // passive: false 옵션으로 이벤트 리스너 추가
    svgContainer.addEventListener('wheel', handleWheelEvent, { passive: false });
    
    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      svgContainer.removeEventListener('wheel', handleWheelEvent);
    };
  }, []);

  // SVG 초기화 함수 분리
  const clearSvg = () => {
    if (containerRef.current) {
      // 이전 SVG와 모든 내용 완전히 제거
      d3.select(containerRef.current).selectAll('svg').remove();
    }
  };

  // 원형 평균 계산 함수 수정
  const calculateCircularMean = (angles: number[]): number => {
    if (angles.length === 0) return 0;
    
    // 각 각도를 x, y 좌표로 변환
    let sumX = 0;
    let sumY = 0;
    
    angles.forEach(angle => {
      sumX += Math.cos(angle);
      sumY += Math.sin(angle);
    });
    
    // 벡터의 크기가 매우 작으면 (서로 상쇄된 경우)
    const magnitude = Math.sqrt(sumX * sumX + sumY * sumY);
    
    // 벡터가 거의 상쇄되면 (크기가 매우 작으면), 중심점(0도)를 반환
    if (magnitude < 0.0001) {
      console.log(`정반대 방향의 벡터 감지됨: ${angles.map(a => (a * 180 / Math.PI).toFixed(2))}도`);
      return 0; // 중심점 (3시 방향)으로 설정
    }
    
    // 평균 벡터의 각도 계산
    return Math.atan2(sumY, sumX);
  };

  // D3 시각화 렌더링 함수를 별도로 분리
  const renderVisualization = useCallback(() => {
    if (!containerRef.current || !words.length || !text) return;

    // 이전 시각화 완전히 제거
    clearSvg();
    
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;
    const minDimension = Math.min(width, height);
    const radius = (minDimension / 2) * 0.85; // 원의 반지름
    const center = [width / 2, height / 2];
    
    // 텍스트를 문장으로 분리
    const sentences = text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    // SVG 생성 - 선택자를 더 명확하게 설정
    const svg = d3.select(container.querySelector('.svg-wrapper'))
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('font', '10px sans-serif');
    
    svgRef.current = svg.node();
    
    // 그룹 생성 (줌/이동 적용을 위해)
    const g = svg.append('g')
      .attr('transform', `translate(${center[0]}, ${center[1]})`);
    
    // 원 위에 문장 배치
    // 상단 공백 제거 - 모든 각도에 문장 배치
    // const emptyAngle = Math.PI / 6; // 30도 - 이 부분 제거
    
    // 시작 위치를 12시 방향으로 설정하고 완전한 원으로 배치
    const startAngle = -Math.PI/2; // 12시 방향에서 시작
    const endAngle = startAngle + 2 * Math.PI; // 완전한 원(360도)
    const arcLength = endAngle - startAngle;
    
    // 문장 배치
    const sentencesGroup = g.append('g').attr('class', 'sentences');
    
    // 문장 배치 - 기존 방식 유지
    const sentenceElements = sentences.map((sentence, i) => {
      // 원 위의 문장 위치 계산
      const angle = startAngle + (i / sentences.length) * arcLength;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      
      // 텍스트 정렬 방향 (왼쪽/오른쪽)
      const isLeftHalf = angle > -Math.PI/2 && angle < Math.PI/2;
      const textAnchor = isLeftHalf ? 'start' : 'end';
      
      // 분석된 문장 데이터 저장
      const sentenceData = {
        text: sentence,
        index: i,
        x,
        y,
        angle,
        // 문장 내 단어 위치 정보를 저장할 배열
        wordPositions: [] as {word: string, start: number, end: number}[]
      };
      
      // 문장 내 단어 위치 분석
      const wordRegex = /\b\w+\b/g;
      let match;
      while ((match = wordRegex.exec(sentence.toLowerCase())) !== null) {
        sentenceData.wordPositions.push({
          word: match[0],
          start: match.index,
          end: match.index + match[0].length
        });
      }
      
      // 회전 없이 텍스트 배치
      const sentenceEl = sentencesGroup.append('text')
        .attr('x', x)
        .attr('y', y)
        .attr('text-anchor', textAnchor)
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '6px')
        .attr('fill', '#94a3b8')
        .attr('class', `sentence sentence-${i}`)
        .text(sentence.length > 30 ? sentence.substring(0, 30) + '...' : sentence)
        .datum(sentenceData); // 문장 데이터를 요소에 바인딩
        
      return { element: sentenceEl, data: sentenceData };
    });
    
    // 자주 사용되는 단어 배치
    const maxValue = d3.max(words, d => d.value) || 1;
    const minValue = d3.min(words, d => d.value) || 1;
    
    // 불투명도 스케일 정의
    opacityScaleRef.current = d3.scaleLinear()
      .domain([minValue, maxValue])
      .range([0.1, 1]);
      
    const opacityScale = opacityScaleRef.current;
    
    // 고정된 폰트 크기
    const fixedFontSize = 16;
    
    // 연결선을 담을 그룹
    const linesGroup = g.append('g')
      .attr('class', 'connection-lines');
    
    // 단어 위치 계산 및 렌더링 - 충돌 방지 없이 순수 수학적 위치만 사용
    words.forEach((word, wordIndex) => {
      const wordOccurrences: number[] = [];
      
      // 단어가 등장하는 문장 인덱스 찾기
      sentences.forEach((sentence, i) => {
        const regex = new RegExp(`\\b${word.text}\\b`, 'i');
        if (regex.test(sentence)) {
          wordOccurrences.push(i);
          console.log(`단어 "${word.text}" 발견: 문장 ${i} - "${sentence}"`);
        }
      });
      
      // 단어가 등장하는 문장이 있을 경우에만 처리
      if (wordOccurrences.length > 0) {
        // 원형 평균으로 단어 위치 각도 계산
        const wordOccurrenceAngles = wordOccurrences.map(index => 
          startAngle + (index / sentences.length) * arcLength
        );
        
        // 벡터의 합 계산
        let sumX = 0;
        let sumY = 0;
        wordOccurrenceAngles.forEach(angle => {
          sumX += Math.cos(angle);
          sumY += Math.sin(angle);
        });
        
        // 벡터 크기 계산
        const magnitude = Math.sqrt(sumX * sumX + sumY * sumY);
        
        // 각도 계산
        const avgAngle = Math.atan2(sumY, sumX);
        
        // 거리 계산 - 벡터의 크기를 기반으로 함
        // 5% 여백으로 변경 (0.9 -> 0.95)
        const normalizedMagnitude = Math.min(magnitude / wordOccurrences.length, 1);
        const distance = radius * 0.95 * normalizedMagnitude;
        
        let wordX, wordY;
        
        // 벡터 크기가 매우 작으면 (정반대 방향의 문장들) 중앙에 배치
        if (magnitude < 0.0001) {
          console.log(`정반대 문장의 단어 감지: ${word.text}`);
          wordX = 0;
          wordY = 0;
        } else {
          wordX = distance * Math.cos(avgAngle);
          wordY = distance * Math.sin(avgAngle);
        }
        
        // 단어 관련 연결선 그룹 생성
        const wordLinesGroup = linesGroup.append('g')
          .attr('class', `word-lines word-lines-${wordIndex}`)
          .style('opacity', 0);
        
        // 단어-문장 연결선 그리기
        wordOccurrences.forEach(sentenceIndex => {
          const sentenceAngle = startAngle + (sentenceIndex / sentences.length) * arcLength;
          
          // 5% 여백으로 변경 (0.9 -> 0.95)
          const wordBoundaryRadius = radius * 0.95;  // 단어가 위치할 수 있는 최대 경계
          const boundaryX = wordBoundaryRadius * Math.cos(sentenceAngle);
          const boundaryY = wordBoundaryRadius * Math.sin(sentenceAngle);
          
          wordLinesGroup.append('line')
            .attr('x1', wordX)
            .attr('y1', wordY)
            .attr('x2', boundaryX)
            .attr('y2', boundaryY)
            .attr('stroke', '#1e88e5')
            .attr('stroke-width', 0.8)
            .attr('opacity', 0.7);
        });
        
        // 단어 텍스트 추가
        const wordElement = g.append('text')
          .attr('x', wordX)
          .attr('y', wordY)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('font-size', `${fixedFontSize}px`)
          .attr('fill', '#000000')
          .attr('fill-opacity', opacityScale(word.value))
          .attr('class', `word word-${wordIndex}`)
          .attr('cursor', 'pointer')
          .text(word.text);
        
        // 단어 클릭 핸들러 수정
        wordElement.on('click', function(event) {
          event.stopPropagation();
          
          // 디버깅 도우미 - 현재 선택된 단어 상태 확인
          console.log('클릭 전 선택된 단어:', selectedWords);
          
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
              d3.select(`.word-${oldestWordIndex}`)
                .style('filter', null)
                .style('fill', '#000000')
                .style('fill-opacity', d => {
                  const oldWord = words.find(w => w.text === d3.select(`.word-${oldestWordIndex}`).text());
                  return oldWord ? opacityScale(oldWord.value) : 1;
                })
                .style('font-weight', 'normal')
                .classed('word-selected', false);
              
              // 제거되는 단어의 연결선 숨김
              d3.select(`.word-lines-${oldestWordIndex}`).style('opacity', 0);
            } else {
              // 새로운 색상 인덱스로 추가
              newSelectedWords = [...selectedWords, { wordIndex, colorIndex: selectedWords.length }];
            }
          }
          
          // *** 중요: 상태 업데이트 ***
          setSelectedWords(prevSelected => {
            console.log('상태 업데이트:', newSelectedWords);
            return newSelectedWords;
          });
          
          // 시각적 처리는 useState 호출 이후에도 즉시 수행
          if (isSelected) {
            // 선택 해제 시 시각적 효과
            d3.select(this)
              .style('filter', null)
              .style('fill', '#000000')
              .style('fill-opacity', opacityScale(word.value))
              .style('font-weight', 'normal')
              .classed('word-selected', false);
            
            d3.select(`.word-lines-${wordIndex}`).style('opacity', 0);
          } else {
            // 선택 추가 시 시각적 효과
            const newColorIndex = newSelectedWords.find(w => w.wordIndex === wordIndex)?.colorIndex || 0;
            const color = selectedColors[newColorIndex % selectedColors.length];
            
            d3.select(this)
              .classed('word-selected', true)
              .style('filter', 'drop-shadow(0 0 3px rgba(0, 0, 0, 0.3))')
              .style('fill', color)
              .style('fill-opacity', 1)
              .style('font-weight', 'bold');
            
            d3.select(`.word-lines-${wordIndex}`)
              .style('opacity', 1)
              .selectAll('line')
              .attr('stroke', color);
          }
          
          // 문장 내 강조 리셋 함수 정의
          function resetSentenceHighlights() {
            d3.selectAll('.sentence').each(function() {
              const sentenceEl = d3.select(this);
              const sentenceData = sentenceEl.datum() as any;
              if (!sentenceData) return;
              
              sentenceEl.text(sentenceData.text.length > 30 
                ? sentenceData.text.substring(0, 30) + '...' 
                : sentenceData.text)
                .attr('fill', '#94a3b8')
                .attr('font-weight', 'normal');
            });
          }
          
          // 모든 문장 초기화 
          resetSentenceHighlights();
          
          // 선택된 모든 단어들 문장 강조 적용
          newSelectedWords.forEach(({ wordIndex: wi, colorIndex: ci }) => {
            if (wi < words.length) {
              const color = selectedColors[ci % selectedColors.length];
              highlightWordInSentences(words[wi].text, color);
              
              // 각 선택된 단어의 시각적 강조 확인 
              d3.select(`.word-${wi}`)
                .classed('word-selected', true)
                .style('filter', 'drop-shadow(0 0 3px rgba(0, 0, 0, 0.3))')
                .style('fill', color)
                .style('fill-opacity', 1)
                .style('font-weight', 'bold');
              
              d3.select(`.word-lines-${wi}`)
                .style('opacity', 1)
                .selectAll('line')
                .attr('stroke', color);
            }
          });
          
          // useEffect 무시 플래그 설정
          window.skipEffectRender = true;
          
          setTimeout(() => {
            window.skipEffectRender = false;
          }, 200); // 타이머 시간 늘림
        });
        
        // 단어 마우스 오버 핸들러 수정
        wordElement
          .on('mouseover', function() {
            // 단어가 이미 선택되었는지 확인
            const isSelected = selectedWords.some(sw => sw.wordIndex === wordIndex);
            
            if (!isSelected) {
              // 다음 사용할 색상 인덱스 결정
              let nextColorIndex = selectedWords.length;
              
              // 최대 선택 수에 도달한 경우 가장 오래된 단어의 색상 인덱스 사용
              if (selectedWords.length >= maxSelectedWords) {
                nextColorIndex = selectedWords[0].colorIndex;
              }
              
              // 다음 색상 가져오기
              const hoverColor = selectedColors[nextColorIndex % selectedColors.length];
              
              // 단어 연결선 표시 및 색상 변경
              d3.select(`.word-lines-${wordIndex}`)
                .style('opacity', 1)
                .selectAll('line')
                .attr('stroke', hoverColor);
              
              // 단어 호버 강조 - 다음 선택될 색상으로 표시
              d3.select(this)
                .style('filter', 'drop-shadow(0 0 3px rgba(0, 0, 0, 0.3))')
                .style('fill', hoverColor)
                .style('fill-opacity', 1) // 호버 시에도 완전 불투명
                .style('font-weight', 'bold');
              
              // 문장 내 단어 임시 강조 - 다음 선택될 색상으로 표시
              highlightWordInSentences(word.text, hoverColor);
            } else {
              // 이미 선택된 단어의 경우 - 해당 색상 정보 가져오기
              const selectedWordInfo = selectedWords.find(sw => sw.wordIndex === wordIndex);
              if (selectedWordInfo) {
                const color = selectedColors[selectedWordInfo.colorIndex % selectedColors.length];
                
                // 연결선 표시 - 단어의 원래 색상으로
                d3.select(`.word-lines-${wordIndex}`)
                  .style('opacity', 1)
                  .selectAll('line')
                  .attr('stroke', color);
                  
                // 단어 강조 유지
                d3.select(this)
                  .style('filter', 'drop-shadow(0 0 3px rgba(0, 0, 0, 0.3))')
                  .style('fill', color)
                  .style('fill-opacity', 1) // 완전 불투명 유지
                  .style('font-weight', 'bold');
                  
                // 문장 내 단어 강조 유지
                highlightWordInSentences(word.text, color);
              }
            }
          })
          .on('mouseout', function() {
            // 단어가 선택되어 있지 않은 경우만 강조 해제 및 연결선 숨김
            const isSelected = selectedWords.some(sw => sw.wordIndex === wordIndex);
            if (!isSelected) {
              // 연결선 숨기기
              d3.select(`.word-lines-${wordIndex}`).style('opacity', 0);
              
              // 단어 스타일 복원
              d3.select(this)
                .style('filter', null)
                .style('fill', '#000000')
                .style('fill-opacity', opacityScale(word.value))
                .style('font-weight', 'normal');
                
              // 모든 문장 복원
              d3.selectAll('.sentence').each(function() {
                const sentenceEl = d3.select(this);
                const sentenceData = sentenceEl.datum() as any;
                if (!sentenceData) return;
                
                // 문장 텍스트 복원
                sentenceEl.text(sentenceData.text.length > 30 
                  ? sentenceData.text.substring(0, 30) + '...' 
                  : sentenceData.text)
                  .attr('fill', '#94a3b8')
                  .attr('font-weight', 'normal');
              });
              
              // 다른 선택된 단어에 의한 강조는 유지
              selectedWords.forEach(sw => {
                highlightWordInSentences(words[sw.wordIndex].text, selectedColors[sw.colorIndex % selectedColors.length]);
              });
            }
          });
      }
    });
    
    // 캔버스 클릭 시 모든 선택 해제
    svg.on('click', function(event) {
      // 배경을 클릭했을 때만 모든 선택 해제
      if (event.target === this) {
        d3.selectAll('.word').classed('word-selected', false);
        linesGroup.selectAll('.word-lines').style('opacity', 0);
        d3.selectAll('.sentence').style('fill', '#94a3b8').style('font-weight', 'normal');
        
        // 모든 선택 해제
        setSelectedWords([]);
      }
    });
    
    // 초기 줌/이동 상태 적용
    updateTransform();
  }, [words, text, selectedWords]);
  
  // 줌/이동 상태가 변경될 때마다 SVG 변환 업데이트
  useEffect(() => {
    updateTransform();
  }, [zoom, translateX, translateY]);
  
  const updateTransform = () => {
    if (!svgRef.current) return;
    
    const width = containerRef.current?.clientWidth || 0;
    const height = containerRef.current?.clientHeight || 0;
    
    const g = d3.select(svgRef.current).select('g');
    g.attr('transform', `translate(${width/2 + translateX}, ${height/2 + translateY}) scale(${zoom})`);
  };
  
  // 컴포넌트 언마운트 시 SVG 정리
  useEffect(() => {
    return () => {
      window.skipEffectRender = false;
      clearSvg();
    };
  }, []);
  
  // 문장 내 특정 단어를 강조하는 함수
  function highlightWordInSentences(wordToHighlight: string, color: string) {
    const wordLower = wordToHighlight.toLowerCase();
    
    // 모든 문장 요소 순회
    d3.selectAll('.sentence').each(function() {
      const sentenceEl = d3.select(this);
      const sentenceData = sentenceEl.datum() as any;
      if (!sentenceData) return;
      
      const sentenceText = sentenceData.text.toLowerCase();
      
      // 문장 내 단어 위치 찾기
      if (sentenceText.includes(wordLower)) {
        // 기존 문장 텍스트 제거하고 SVG 텍스트 스팬으로 교체
        sentenceEl.text('');
        
        const displayText = sentenceData.text.length > 30 
          ? sentenceData.text.substring(0, 30) + '...' 
          : sentenceData.text;
          
        // 단어 위치에 따라 텍스트 분할 및 강조
        let lastIndex = 0;
        const wordRegex = new RegExp(`\\b${wordLower}\\b`, 'gi');
        let match;
        
        while ((match = wordRegex.exec(displayText)) !== null) {
          // 단어 앞 텍스트
          if (match.index > lastIndex) {
            sentenceEl.append('tspan')
              .text(displayText.substring(lastIndex, match.index))
              .attr('fill', '#94a3b8');
          }
          
          // 강조할 단어
          sentenceEl.append('tspan')
            .text(displayText.substring(match.index, match.index + match[0].length))
            .attr('fill', color)
            .attr('font-weight', 'bold');
            
          lastIndex = match.index + match[0].length;
        }
        
        // 마지막 단어 이후 텍스트
        if (lastIndex < displayText.length) {
          sentenceEl.append('tspan')
            .text(displayText.substring(lastIndex))
            .attr('fill', '#94a3b8');
        }
      }
    });
  }
  
  // 최대 선택 가능 단어 수가 변경될 때 처리
  useEffect(() => {
    if (!words.length || !opacityScaleRef.current) return;
    const opacityScale = opacityScaleRef.current;
    
    // 현재 선택된 단어 수가 최대값보다 많으면 조정
    if (selectedWords.length > maxSelectedWords) {
      // 가장 최근에 선택된 maxSelectedWords개 단어만 유지
      const wordsToKeep = selectedWords.slice(-maxSelectedWords);
      const wordsToRemove = selectedWords.slice(0, -maxSelectedWords);
      
      // 제거할 단어들의 강조 해제
      wordsToRemove.forEach(({ wordIndex }) => {
        // 단어 강조 해제
        d3.select(`.word-${wordIndex}`)
          .style('filter', null)
          .style('fill', '#000000')
          .style('fill-opacity', d => {
            const word = words.find(w => w.text === d3.select(`.word-${wordIndex}`).text());
            return word ? opacityScale(word.value) : 1;
          })
          .style('font-weight', 'normal')
          .classed('word-selected', false);
        
        // 연결선 숨김
        d3.select(`.word-lines-${wordIndex}`).style('opacity', 0);
      });
      
      // 선택된 단어 상태 업데이트
      setSelectedWords(wordsToKeep);
      
      // 문장 내 단어 강조 복원 (남은 단어들에 대해서만)
      d3.selectAll('.sentence').each(function() {
        const sentenceEl = d3.select(this);
        const sentenceData = sentenceEl.datum() as any;
        if (!sentenceData) return;
        
        // 문장 텍스트 초기화
        sentenceEl.text(sentenceData.text.length > 30 
          ? sentenceData.text.substring(0, 30) + '...' 
          : sentenceData.text)
          .attr('fill', '#94a3b8')
          .attr('font-weight', 'normal');
      });
      
      // 남은 단어들에 대해 강조 다시 적용
      wordsToKeep.forEach(({ wordIndex, colorIndex }) => {
        const word = words[wordIndex];
        const color = selectedColors[colorIndex % selectedColors.length];
        highlightWordInSentences(word.text, color);
      });
    }
  }, [maxSelectedWords, words]);
  
  // 초기 렌더링
  useEffect(() => {
    renderVisualization();
  }, [renderVisualization]);
  
  // useEffect 수정
  useEffect(() => {
    if (!words.length || !opacityScaleRef.current || window.skipEffectRender) return;
    
    // 모든 단어와 연결선 초기화
    d3.selectAll('.word')
      .style('filter', null)
      .style('fill', '#000000')
      .style('fill-opacity', function() {
        const wordText = d3.select(this).text();
        const word = words.find(w => w.text === wordText);
        return word ? opacityScaleRef.current!(word.value) : 1;
      })
      .style('font-weight', 'normal')
      .classed('word-selected', false);
    
    d3.selectAll('.word-lines').style('opacity', 0);
    
    // 모든 문장 초기화 후 선택된 단어들만 하이라이트
    d3.selectAll('.sentence').each(function() {
      const sentenceEl = d3.select(this);
      const sentenceData = sentenceEl.datum() as any;
      if (!sentenceData) return;
      
      sentenceEl.text(sentenceData.text.length > 30 
        ? sentenceData.text.substring(0, 30) + '...' 
        : sentenceData.text)
        .attr('fill', '#94a3b8')
        .attr('font-weight', 'normal');
    });
    
    // 선택된 단어들 효과 적용
    selectedWords.forEach(({ wordIndex, colorIndex }) => {
      const color = selectedColors[colorIndex % selectedColors.length];
      
      // 단어 강조 - 완전 불투명 처리 추가
      d3.select(`.word-${wordIndex}`)
        .classed('word-selected', true)
        .style('filter', 'drop-shadow(0 0 3px rgba(0, 0, 0, 0.3))')
        .style('fill', color)
        .style('fill-opacity', 1) // 완전 불투명 처리
        .style('font-weight', 'bold');
      
      // 연결선 표시
      d3.select(`.word-lines-${wordIndex}`)
        .style('opacity', 1)
        .selectAll('line')
        .attr('stroke', color);
      
      // 문장 내 단어 강조
      if (wordIndex < words.length) {
        highlightWordInSentences(words[wordIndex].text, color);
      }
    });
  }, [selectedWords, words, selectedColors]);
  
  if (words.length === 0 || !text) {
    return (
      <Container>
        <NoDataMessage>
          텍스트와 단어가 로드되면 TextArc가 여기에 표시됩니다.
        </NoDataMessage>
      </Container>
    );
  }
  
  return (
    <Container ref={containerRef}>
      {isGenerating && (
        <LoadingOverlay>
          <div className="spinner" />
          {processingStatus && <div className="status">{processingStatus}</div>}
        </LoadingOverlay>
      )}
      <ButtonContainer>
        <IconButton onClick={() => setZoom(prev => Math.min(prev + 0.2, 5))} title="확대">
          <FiZoomIn size={24} color="#2196F3" />
        </IconButton>
        <IconButton onClick={() => setZoom(prev => Math.max(prev - 0.2, 0.1))} title="축소">
          <FiZoomOut size={24} color="#2196F3" />
        </IconButton>
        <IconButton onClick={resetView} title="원래 크기">
          <FiMaximize size={24} color="#2196F3" />
        </IconButton>
        <IconButton onClick={downloadImage} title="이미지 다운로드">
          <FiDownload size={24} color="#2196F3" />
        </IconButton>
      </ButtonContainer>
      <SVGContainer
        ref={svgContainerRef}
        className="svg-wrapper"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </Container>
  );
};

export default TextArcVisualizer; 