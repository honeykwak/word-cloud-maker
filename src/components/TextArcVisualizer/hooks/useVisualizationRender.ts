import { useRef, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import { Word } from '../../../types';
import { calculateWordPosition, calculateCircularMean } from '../utils/calculations';

// Window 인터페이스에 skipEffectRender 추가
declare global {
  interface Window {
    skipEffectRender?: boolean;
  }
}

export function useVisualizationRender(
  containerRef: React.RefObject<HTMLDivElement>,
  svgRef: React.RefObject<SVGSVGElement | null>
) {
  // 불투명도 스케일 참조
  const opacityScaleRef = useRef<d3.ScaleLinear<number, number>>();
  
  // 단어 위치 매핑 저장
  const wordPositionsRef = useRef<Map<number, { x: number; y: number; angle: number }>>(new Map());
  
  // 클리어 SVG 함수
  const clearSvg = useCallback(() => {
    if (containerRef.current) {
      d3.select(containerRef.current).select('.svg-wrapper').selectAll('svg').remove();
    }
  }, [containerRef]);
  
  // 시각화 렌더링 함수
  const renderVisualization = useCallback((
    words: Word[], 
    text: string,
    onWordClick: (wordIndex: number) => void
  ) => {
    if (!containerRef.current || !words.length || !text) return;
    
    // 이전 시각화 제거
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
      
    // SVG 생성
    const svg = d3.select(container.querySelector('.svg-wrapper'))
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('font', '10px sans-serif');
    
    // SVG 참조 저장
    svgRef.current = svg.node();
    
    // 그룹 생성 (줌/이동 적용을 위해)
    const g = svg.append('g')
      .attr('transform', `translate(${center[0]}, ${center[1]})`);
      
    // 시작 위치를 12시 방향으로 설정하고 완전한 원으로 배치
    const startAngle = -Math.PI/2; // 12시 방향에서 시작
    const endAngle = startAngle + 2 * Math.PI; // 완전한 원(360도)
    const arcLength = endAngle - startAngle;
    
    // 문장 배치
    const sentencesGroup = g.append('g').attr('class', 'sentences');
    
    // 단어 빈도 확인
    const maxFrequency = d3.max(words, d => d.value) || 1;
    const minFrequency = d3.min(words, d => d.value) || 1;
    
    // 불투명도 스케일 설정
    opacityScaleRef.current = d3.scaleLinear<number, number>()
      .domain([minFrequency, maxFrequency])
      .range([0.3, 1]);
    
    // 폰트 크기 스케일 설정
    const fontSizeScale = d3.scaleLinear<number, number>()
      .domain([minFrequency, maxFrequency])
      .range([10, 30]);
    
    // 단어 출현 위치 매핑
    const wordOccurrences: Map<string, number[]> = new Map();
    
    // 문장 배치 및 단어 매핑
    sentences.forEach((sentence, i) => {
      // 문장 위치 계산
      const angle = startAngle + (arcLength * i / sentences.length);
      
      // 문장 배치
      sentencesGroup.append('text')
        .attr('class', 'sentence')
        .attr('x', radius * Math.cos(angle))
        .attr('y', radius * Math.sin(angle))
        .attr('text-anchor', angle > Math.PI / 2 && angle < 3 * Math.PI / 2 ? 'end' : 'start')
        .attr('transform', `rotate(${(angle * 180 / Math.PI) + (angle > Math.PI / 2 && angle < 3 * Math.PI / 2 ? 180 : 0)}, ${radius * Math.cos(angle)}, ${radius * Math.sin(angle)})`)
        .text(sentence.length > 30 ? sentence.substring(0, 30) + '...' : sentence)
        .attr('fill', '#94a3b8')
        .datum({ text: sentence, angle });
      
      // 문장에서 단어 추출 및 매핑
      const sentenceWords = sentence.toLowerCase().split(/\s+/);
      
      words.forEach(word => {
        const wordText = word.text.toLowerCase();
        sentenceWords.forEach(sw => {
          if (sw === wordText || sw.includes(wordText)) {
            if (!wordOccurrences.has(wordText)) {
              wordOccurrences.set(wordText, []);
            }
            wordOccurrences.get(wordText)?.push(angle);
          }
        });
      });
    });
    
    // 단어 그룹 생성
    const wordsGroup = g.append('g').attr('class', 'words');
    
    // 연결선 그룹 생성
    const linesGroup = g.append('g').attr('class', 'lines');
    
    // 단어 및 연결선 그리기
    const wordPositions = useMemo(() => {
      return words.map((word, i) => {
        const wordText = word.text.toLowerCase();
        const angles = wordOccurrences.get(wordText) || [];
        
        if (angles.length > 0) {
          const { x, y, magnitude } = calculateWordPosition(angles, radius * 0.7);
          const avgAngle = calculateCircularMean(angles);
          return { index: i, x, y, angle: avgAngle, angles };
        }
        return null;
      }).filter(Boolean);
    }, [words, wordOccurrences, radius]);
    
    wordPositions.forEach(({ index, x, y, angle, angles }) => {
      // 위치 저장
      wordPositionsRef.current.set(index, { x, y, angle });
      
      // 단어 텍스트 추가
      wordsGroup.append('text')
        .attr('class', `word word-${index}`)
        .attr('x', x)
        .attr('y', y)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('role', 'button')
        .attr('tabindex', '0')
        .attr('aria-label', `단어: ${word.text}, 빈도: ${word.value}`)
        .style('fill', '#000000')
        .style('fill-opacity', opacityScaleRef.current(word.value))
        .style('font-size', `${fontSizeScale(word.value)}px`)
        .style('cursor', 'pointer')
        .text(word.text)
        .on('click', () => {
          onWordClick(index);
        })
        .on('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            onWordClick(index);
          }
        });
      
      // 연결선 그룹 생성
      const wordLinesGroup = linesGroup.append('g')
        .attr('class', `word-lines word-lines-${index}`)
        .style('opacity', 0);
      
      // 각 문장 위치에 연결선 그리기
      angles.forEach(angle => {
        const lineEndX = radius * Math.cos(angle);
        const lineEndY = radius * Math.sin(angle);
        
        wordLinesGroup.append('line')
          .attr('x1', x)
          .attr('y1', y)
          .attr('x2', lineEndX)
          .attr('y2', lineEndY)
          .attr('stroke', '#94a3b8')
          .attr('stroke-width', 1)
          .attr('opacity', 0.5);
      });
    });

    return {
      wordPositions: wordPositionsRef.current,
      opacityScale: opacityScaleRef.current
    };
  }, [containerRef, svgRef, clearSvg]);
  
  return {
    renderVisualization,
    clearSvg,
    wordPositionsRef,
    opacityScaleRef
  };
} 