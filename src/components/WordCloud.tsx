/**
 * Word Cloud Component
 * 
 * @copyright 2024-2025 Kwak Jaeheon
 * @license MIT
 * @version 1.0.0
 * @author Kwak Jaeheon <jenilove0517@gmail.com>
 * 
 * This component implements an interactive word cloud visualization
 * with features like zooming, panning, and custom shapes.
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import WordCloud2 from 'wordcloud';
import styled from 'styled-components';
import { WordCloudOptions, Word } from '../types';
import { FiDownload, FiRefreshCw, FiZoomIn, FiZoomOut, FiMaximize } from 'react-icons/fi';
import { ShapeFunction, createShapeFromPNG } from '../utils/shapeUtils';

interface WordCloudProps {
  words: Word[];
  options: WordCloudOptions;
  isGenerating: boolean;
  processingStatus: string;
  renderKey: number;
  onRegenerate: () => void;
}

const Container = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 0;
  box-sizing: border-box;
`;

const CloudContainer = styled.div<{ $shape: string }>`
  flex: 1;
  min-height: 0;
  background: #fafafa;
  border-radius: 8px;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
`;

const ButtonContainer = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  gap: 8px;
  z-index: 2;
`;

const IconButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: white;
  border: none;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  padding: 0;
  
  &:hover {
    transform: scale(1.1);
    box-shadow: 0 3px 7px rgba(33, 150, 243, 0.2);
    background: #f8f8f8;
  }
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3;
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #e2e8f0;
    border-top-color: #2196F3;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .status {
    margin-top: 16px;
    color: #2c3e50;
    font-size: 0.9rem;
  }
`;

const CloudCanvas = styled.canvas<{ $zoom: number, $x: number, $y: number, $isDragging: boolean }>`
  transform: translate(${props => props.$x}px, ${props => props.$y}px) scale(${props => props.$zoom});
  transform-origin: center center;
  cursor: ${props => props.$isDragging ? 'grabbing' : 'grab'};
`;

const ProgressContainer = styled.div`
  position: absolute;
  top: 20px;
  left: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 2;
`;

const ProgressText = styled.div`
  background: white;
  padding: 8px 12px;
  border-radius: 20px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  font-size: 0.875rem;
  color: #2196F3;
  display: flex;
  align-items: center;
  gap: 4px;
  
  .count {
    font-weight: 500;
  }

  .percent {
    color: #64748b;
    margin-left: 8px;
    font-size: 0.8rem;
  }
`;

type ShapeValue = string | ShapeFunction;

// SVG 경로 정의
const svgShapes = {
  heart: `M 0 -10 
         C -5 -20, -20 -10, -20 0 
         C -20 20, 0 30, 0 40 
         C 0 30, 20 20, 20 0 
         C 20 -10, 5 -20, 0 -10`,
  wide: `M -16 -9 L 16 -9 L 16 9 L -16 9 Z`,  // 16:9 직사각형
  tall: `M -9 -16 L 9 -16 L 9 16 L -9 16 Z`,  // 9:16 직사각형
};

// SVG 경로를 wordcloud2.js의 shape 함수로 변환
const svgToShape = (width: number, height: number) => {
  return (theta: number) => {
    // 각도를 라디안에서 x,y 좌표로 변환
    const x = Math.cos(theta);
    const y = Math.sin(theta);
    
    // 좌표를 직사각형 범위로 매핑
    return Math.abs(x) <= width && Math.abs(y) <= height ? 1 : 0;
  };
};

const shapes: Record<string, ShapeValue> = {
  square: 'square',        // 정사각형
  circle: 'circle',      // 원형
  cardioid: 'cardioid',   // 심장형
  diamond: 'diamond',      // 다이아몬드
  triangle: 'triangle',    // 삼각형
  pentagon: 'pentagon',    // 오각형
  star: 'star',           // 별형
  custom: 'circle'        // 초기값을 circle로 설정 (나중에 동적으로 변경됨)
};

const WordCloud: React.FC<WordCloudProps> = ({ 
  words, 
  options, 
  isGenerating, 
  processingStatus,
  renderKey,
  onRegenerate
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [origin, setOrigin] = useState<[number, number]>([0, 0]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<[number, number]>([0, 0]);
  const [placedWords, setPlacedWords] = useState<string[]>([]);  // 배치된 단어들 추적
  const [effectiveMaxWords, setEffectiveMaxWords] = useState(0);

  const getColorScheme = (theme: string) => {
    switch (theme) {
      case 'warm':
        return ['#ff4d4d', '#ff9933', '#ffcc00', '#ff6666', '#ff8000'];
      case 'cool':
        return ['#3366cc', '#33cccc', '#3399ff', '#6666ff', '#0099cc'];
      default:
        return ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd'];
    }
  };

  const generateWordCloud = useCallback(() => {
    if (!canvasRef.current || words.length === 0) return;

    setPlacedWords([]);
    setEffectiveMaxWords(words.length);  // 실제 가용 단어 수 설정

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const baseSize = 6000;
    const canvasWidth = baseSize;
    const canvasHeight = baseSize;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const colors = getColorScheme(options.colorTheme);
    
    // 단어들을 빈도수로 정렬하여 순위 기반 크기 계산
    const sortedWords = [...words].sort((a, b) => b.value - a.value);
    const list = sortedWords
      .slice(0, options.maxWords)  // maxWords 만큼 정확히 자르기
      .map((word, index) => {
        const rank = index;  // 0부터 시작
        const maxRank = options.maxWords;  // -1 제거
        const size = 100 * (1 - Math.log(rank + 1) / Math.log(maxRank + 1));
        return [word.text, size] as [string, number];
      });

    // 0도이고 renderKey가 짝수일 때는 완전 수평, 홀수일 때는 수평/수직 조화
    const useHybridMode = options.minRotation === options.maxRotation && (renderKey % 2 === 1);

    WordCloud2(canvas, {
      list,
      gridSize: 1,
      weightFactor: (size) => size * (canvasWidth / 4096),
      fontFamily: 'Impact',
      color: (word, _, fontSize) => {
        setPlacedWords(prev => [...prev, word]);
        return colors[Math.floor(fontSize % colors.length)];
      },
      rotateRatio: options.minRotation === options.maxRotation ? 0.5 : (options.rotationEnabled ? 1 : 0),
      rotationSteps: options.minRotation === options.maxRotation ? 2 : (options.rotationEnabled ? 32 : 1),
      maxRotation: options.minRotation === options.maxRotation ? 
        options.maxRotation * (Math.PI / 180) : 
        options.maxRotation * (Math.PI / 180),
      minRotation: options.minRotation === options.maxRotation ? 
        0 : 
        options.minRotation * (Math.PI / 180),
      shape: options.shape === 'custom' && options.customShape 
        ? options.customShape 
        : shapes[options.shape],
      shrinkToFit: true,  // true로 변경
      drawOutOfBound: false,  // false로 변경
      backgroundColor: 'transparent',
      ellipticity: 1,
      minSize: 0,
      clearCanvas: true,
      wait: 0,
      ratio: 1,  // ratio는 1로 고정
      origin: [canvasWidth / 2, canvasHeight / 2],
      progress: (progress: any) => {
        console.log('Progress callback:', progress);  // 실제 데이터 구조 확인
        
        // progress가 숫자인 경우
        if (typeof progress === 'number') {
          const total = list.length;
          const current = Math.floor(progress * total);
        }
        // progress가 객체인 경우 (다른 형태일 수 있음)
        else if (typeof progress === 'object') {
        }
      },
      complete: (items) => {
        console.log('Complete callback:', items);  // 완료 시점 확인
        const { scale } = calculateInitialScale(items);
        setZoom(scale / 4);
        setOrigin([0, 0]);
        // 완료 시 1초 후 placedWords 초기화
        setTimeout(() => {
          setPlacedWords([]);
        }, 1000);
      }
    });
  }, [words, options, renderKey]);

  // 초기 스케일 계산 함수 수정
  const calculateInitialScale = useCallback((items: any[] = []) => {
    if (!containerRef.current || items.length === 0) return { scale: 1 };

    // 워드클라우드의 실제 범위 계산
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    items.forEach(item => {
      const halfWidth = (item.size || 0) / 2;
      minX = Math.min(minX, item.x - halfWidth);
      maxX = Math.max(maxX, item.x + halfWidth);
      minY = Math.min(minY, item.y - halfWidth);
      maxY = Math.max(maxY, item.y + halfWidth);
    });

    const cloudWidth = maxX - minX;
    const cloudHeight = maxY - minY;
    
    // 컨테이너 크기
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;

    // 여백을 고려한 스케일 계산 (90%만 차지하도록)
    const scaleX = (containerWidth * 0.9) / cloudWidth;
    const scaleY = (containerHeight * 0.9) / cloudHeight;
    const scale = Math.min(scaleX, scaleY);

    return { scale };
  }, []);

  // 재생성 핸들러 수정
  const handleRegenerate = () => {
    onRegenerate();
  };

  // 줌/패닝 이벤트 리스너 설정
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY * -0.001;
      const newZoom = Math.min(Math.max(0.1, zoom + delta), 5);
      setZoom(newZoom);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [zoom]);

  // 마우스 이벤트 핸들러 수정
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart[0];
    const newY = e.clientY - dragStart[1];
    setOrigin([newX, newY]);
  }, [isDragging, dragStart]);

  const downloadImage = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = 'wordcloud.png';
      link.href = canvasRef.current.toDataURL();
      link.click();
    }
  };

  // 진행률 계산 수정
  const progress = {
    current: placedWords.length,
    total: effectiveMaxWords  // options.maxWords 대신 effectiveMaxWords 사용
  };

  // 중앙 정렬 함수 추가
  const centerWordCloud = useCallback(() => {
    if (!containerRef.current || !canvasRef.current) return;
    
    // 캔버스 크기를 컨테이너 크기에 기반해 계산
    // 이때 캔버스의 비율은 유지하면서, 컨테이너 내부에 맞도록 조정
    
    // 여기서 적절한 zoom 레벨과 origin 설정
    setZoom(1);
    setOrigin([0, 0]);
  }, []);

  // 원래 크기 버튼 핸들러 수정
  const handleResetView = () => {
    centerWordCloud();
  };

  // 초기 렌더링 시에도 중앙 정렬 적용
  useEffect(() => {
    centerWordCloud();
  }, [centerWordCloud, words]);  // words가 변경될 때마다 중앙 정렬

  useEffect(() => {
    generateWordCloud();
  }, [words, options, renderKey]);

  return (
    <Container>
      <CloudContainer 
        ref={containerRef} 
        $shape={options.shape}
        onMouseDown={(e) => {
          setIsDragging(true);
          setDragStart([e.clientX - origin[0], e.clientY - origin[1]]);
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
      >
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
          <IconButton onClick={handleResetView} title="원래 크기">
            <FiMaximize size={24} color="#2196F3" />
          </IconButton>
          <IconButton onClick={handleRegenerate} title="단어 재배치">
            <FiRefreshCw size={24} color="#2196F3" />
          </IconButton>
          <IconButton onClick={downloadImage} title="이미지 다운로드">
            <FiDownload size={24} color="#2196F3" />
          </IconButton>
        </ButtonContainer>
        {progress.current > 0 && progress.current < progress.total && (
          <ProgressContainer>
            <ProgressText>
              <span className="count">{progress.current}</span>
              <span>/</span>
              <span className="count">{progress.total}</span>
              <span>단어 배치 중</span>
              <span className="percent">
                ({Math.round((progress.current / progress.total) * 100)}%)
              </span>
            </ProgressText>
          </ProgressContainer>
        )}
        <CloudCanvas
          ref={canvasRef}
          $zoom={zoom}
          $x={origin[0]}
          $y={origin[1]}
          $isDragging={isDragging}
        />
      </CloudContainer>
    </Container>
  );
};

export default WordCloud; 