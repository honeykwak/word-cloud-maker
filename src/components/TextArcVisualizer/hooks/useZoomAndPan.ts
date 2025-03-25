import { useState, useEffect, RefObject } from 'react';
import * as d3 from 'd3';

interface ZoomAndPanOptions {
  minZoom?: number;
  maxZoom?: number;
  zoomFactor?: number;
}

export function useZoomAndPan(
  containerRef: RefObject<HTMLDivElement>,
  svgContainerRef: RefObject<HTMLDivElement>,
  options: ZoomAndPanOptions = {}
) {
  const {
    minZoom = 0.1,
    maxZoom = 5,
    zoomFactor = 0.1
  } = options;

  const [zoom, setZoom] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<[number, number]>([0, 0]);

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

  // wheel 이벤트 리스너
  useEffect(() => {
    const svgContainer = svgContainerRef.current;
    if (!svgContainer) return;
    
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      const delta = e.deltaY > 0 ? -zoomFactor : zoomFactor;
      
      // 새 줌 레벨 계산
      const newZoom = Math.max(minZoom, Math.min(maxZoom, zoom + delta));
      
      // 마우스 위치를 기준으로 줌 조정
      const containerRect = svgContainer.getBoundingClientRect();
      const mouseX = e.clientX - containerRect.left;
      const mouseY = e.clientY - containerRect.top;
      
      // 줌 중심점 계산
      const zoomRatio = newZoom / zoom;
      const newTranslateX = mouseX - (mouseX - translateX) * zoomRatio;
      const newTranslateY = mouseY - (mouseY - translateY) * zoomRatio;
      
      // 상태 업데이트
      setZoom(newZoom);
      setTranslateX(newTranslateX);
      setTranslateY(newTranslateY);
    };
    
    svgContainer.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      svgContainer.removeEventListener('wheel', handleWheel);
    };
  }, [zoom, translateX, translateY, minZoom, maxZoom, zoomFactor, svgContainerRef]);

  return {
    zoom,
    translateX,
    translateY,
    isDragging,
    resetView,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp
  };
} 