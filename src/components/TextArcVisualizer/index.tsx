import React, { useEffect, useRef, useCallback, useState } from 'react';
import * as d3 from 'd3';
import { Word } from '../../types';
import { FiZoomIn, FiZoomOut, FiMaximize, FiDownload } from 'react-icons/fi';
import { toPng } from 'html-to-image';

// 커스텀 훅 임포트
import { useZoomAndPan } from './hooks/useZoomAndPan';
import { useWordSelection } from './hooks/useWordSelection';
import { useVisualizationRender } from './hooks/useVisualizationRender';

// 스타일 컴포넌트 임포트 
import { 
  Container, 
  SVGContainer, 
  ButtonContainer, 
  IconButton, 
  LoadingOverlay,
  NoDataMessage
} from './styles';

interface TextArcVisualizerProps {
  words: Word[];
  text: string;
  isGenerating: boolean;
  processingStatus?: string;
  maxSelectedWords?: number;
  selectedColors?: string[];
}

const TextArcVisualizer: React.FC<TextArcVisualizerProps> = ({ 
  words, 
  text,
  isGenerating,
  processingStatus,
  maxSelectedWords = 1,
  selectedColors = [
    '#1e88e5', '#e53935', '#43a047', '#fb8c00', '#8e24aa', 
    '#00acc1', '#ffb300', '#6d4c41', '#546e7a', '#ec407a'
  ]
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);

  // 줌/패닝 커스텀 훅 사용
  const {
    zoom,
    translateX,
    translateY,
    isDragging,
    resetView,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp
  } = useZoomAndPan(containerRef, svgContainerRef);
  
  // 단어 선택 커스텀 훅 사용
  const {
    selectedWords,
    setSelectedWords,
    handleWordSelection,
    opacityScaleRef,
    resetWordHighlight,
    highlightWord
  } = useWordSelection(words, { maxSelectedWords, selectedColors });
  
  // 시각화 렌더링 커스텀 훅 사용
  const { 
    renderVisualization, 
    clearSvg, 
    wordPositionsRef 
  } = useVisualizationRender(containerRef, svgRef);

  // 이미지 다운로드 함수
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

  // 시각화 변환 업데이트
  const updateTransform = useCallback(() => {
    if (!svgRef.current) return;
    
    const width = containerRef.current?.clientWidth || 0;
    const height = containerRef.current?.clientHeight || 0;
    
    d3.select(svgRef.current).select('g')
      .attr('transform', `translate(${width/2 + translateX}, ${height/2 + translateY}) scale(${zoom})`);
  }, [zoom, translateX, translateY]);

  // 줌/이동 상태가 변경될 때마다 SVG 변환 업데이트
  useEffect(() => {
    updateTransform();
  }, [zoom, translateX, translateY, updateTransform]);

  // 에러 경계 추가
  const [renderError, setRenderError] = useState<Error | null>(null);

  // 시각화 렌더링 시도 중 오류 처리
  useEffect(() => {
    if (!words.length || !text) return;
    
    try {
      const result = renderVisualization(words, text, handleWordSelection);
      if (result && result.opacityScale) {
        opacityScaleRef.current = result.opacityScale;
      }
    } catch (err) {
      console.error("시각화 렌더링 오류:", err);
      setRenderError(err instanceof Error ? err : new Error('Unknown error'));
    }
  }, [words, text, renderVisualization, handleWordSelection]);

  // 컴포넌트 언마운트 시 SVG 정리
  useEffect(() => {
    return () => {
      window.skipEffectRender = false;
      clearSvg();
    };
  }, [clearSvg]);

  // 선택된 단어 상태에 따른 시각적 업데이트
  useEffect(() => {
    if (!words.length || !opacityScaleRef.current || window.skipEffectRender) return;
    
    // 모든 단어 초기화
    words.forEach((_, i) => {
      resetWordHighlight(i);
    });
    
    // 선택된 단어 강조
    selectedWords.forEach(({ wordIndex, colorIndex }) => {
      const color = selectedColors[colorIndex % selectedColors.length];
      highlightWord(wordIndex, selectedWords);
    });
    
  }, [selectedWords, words, selectedColors, resetWordHighlight, highlightWord]);

  // 렌더링 오류 UI
  if (renderError) {
    return (
      <Container>
        <NoDataMessage>
          시각화를 렌더링하는 중 오류가 발생했습니다: {renderError.message}
          <button onClick={() => setRenderError(null)}>다시 시도</button>
        </NoDataMessage>
      </Container>
    );
  }

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
      <SVGContainer
        ref={svgContainerRef}
        className="svg-wrapper"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      
      <ButtonContainer>
        <IconButton onClick={() => zoom < 5 && updateTransform()}>
          <FiZoomIn />
        </IconButton>
        <IconButton onClick={() => zoom > 0.1 && updateTransform()}>
          <FiZoomOut />
        </IconButton>
        <IconButton onClick={resetView}>
          <FiMaximize />
        </IconButton>
        <IconButton onClick={downloadImage}>
          <FiDownload />
        </IconButton>
      </ButtonContainer>
      
      {isGenerating && (
        <LoadingOverlay>
          <div className="spinner" />
          <div className="status">{processingStatus || '시각화 생성 중...'}</div>
        </LoadingOverlay>
      )}
    </Container>
  );
};

export default TextArcVisualizer; 