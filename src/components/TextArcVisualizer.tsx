import React, { useEffect, useRef, useState } from 'react';
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

const TextArcVisualizer: React.FC<TextArcVisualizerProps> = ({ 
  words, 
  text,
  isGenerating,
  processingStatus
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<[number, number]>([0, 0]);

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

  useEffect(() => {
    if (!containerRef.current || !words.length || !text) return;

    // SVG 초기화
    d3.select(containerRef.current).select('svg').remove();
    
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
    const svg = d3.select(container)
      .select('.svg-wrapper')
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('font', '10px sans-serif');
    
    svgRef.current = svg.node();
    
    // 그룹 생성 (줌/이동 적용을 위해)
    const g = svg.append('g')
      .attr('transform', `translate(${center[0]}, ${center[1]})`);
    
    // 점선 원 제거 (주석 처리)
    // g.append('circle')
    //   .attr('r', radius)
    //   .attr('fill', 'none')
    //   .attr('stroke', '#e2e8f0')
    //   .attr('stroke-width', 1)
    //   .attr('stroke-dasharray', '3,3');
    
    // 원 위에 문장 배치
    // 시작과 끝을 구분하기 위해 상단 일부분을 비움 (약 30도)
    const emptyAngle = Math.PI / 6; // 30도
    
    // 시작 위치를 12시 방향으로 변경 (-90도 = -Math.PI/2)
    const startAngle = -Math.PI/2 + emptyAngle / 2;
    const endAngle = -Math.PI/2 + 2 * Math.PI - emptyAngle / 2;
    const arcLength = endAngle - startAngle;
    
    // 문장 배치
    sentences.forEach((sentence, i) => {
      // 원 위의 문장 위치 계산
      const angle = startAngle + (i / sentences.length) * arcLength;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      
      // 텍스트 정렬 방향 (왼쪽/오른쪽)
      const isLeftHalf = angle > -Math.PI/2 && angle < Math.PI/2;
      const textAnchor = isLeftHalf ? 'start' : 'end';
      
      // 회전 없이 텍스트 배치 - transform 속성 제거
      g.append('text')
        .attr('x', x)
        .attr('y', y)
        .attr('text-anchor', textAnchor)
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '6px')
        .attr('fill', '#94a3b8')
        .text(sentence.length > 30 ? sentence.substring(0, 30) + '...' : sentence);
    });
    
    // 자주 사용되는 단어 배치
    const maxValue = d3.max(words, d => d.value) || 1;
    const fontSize = d3.scaleLinear()
      .domain([0, maxValue])
      .range([8, 32]);
    
    // 각 단어에 대해 해당 단어가 등장하는 문장들의 위치를 찾아 연결
    words.slice(0, 50).forEach((word) => {
      // 단어의 위치 계산 (단어가 등장하는 문장들의 위치 평균)
      const wordOccurrences: number[] = [];
      
      sentences.forEach((sentence, i) => {
        // 대소문자 구분 없이 단어 찾기
        const regex = new RegExp(`\\b${word.text}\\b`, 'i');
        if (regex.test(sentence)) {
          wordOccurrences.push(i);
        }
      });
      
      // 단어가 등장하는 문장이 있을 경우에만 처리
      if (wordOccurrences.length > 0) {
        // 단어가 등장하는 문장들의 평균 각도 계산 - 시작각도 변경 반영
        const avgIndex = d3.mean(wordOccurrences) || 0;
        const avgAngle = startAngle + (avgIndex / sentences.length) * arcLength;
        
        // 단어 위치 계산 (중심에서 특정 거리만큼 떨어진 위치)
        const distance = radius * 0.6 * (Math.random() * 0.4 + 0.3); // 반지름의 30%-70% 위치에 랜덤하게 배치
        const wordX = distance * Math.cos(avgAngle);
        const wordY = distance * Math.sin(avgAngle);
        
        // 단어와 문장 연결선 그리기
        wordOccurrences.forEach(sentenceIndex => {
          const sentenceAngle = startAngle + (sentenceIndex / sentences.length) * arcLength;
          const sentenceX = radius * Math.cos(sentenceAngle);
          const sentenceY = radius * Math.sin(sentenceAngle);
          
          g.append('line')
            .attr('x1', wordX)
            .attr('y1', wordY)
            .attr('x2', sentenceX)
            .attr('y2', sentenceY)
            .attr('stroke', '#cbd5e1')
            .attr('stroke-width', 0.5)
            .attr('opacity', 0.3);
        });
        
        // 단어 텍스트 추가 (회전 없음)
        g.append('text')
          .attr('x', wordX)
          .attr('y', wordY)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('font-size', `${fontSize(word.value)}px`)
          .attr('fill', d3.interpolateRainbow(Math.random()))
          .text(word.text);
      }
    });
    
    // 초기 줌/이동 상태 적용
    updateTransform();
    
  }, [words, text]);
  
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