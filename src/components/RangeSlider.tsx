import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { NumberInput } from "./ControlPanel";

const SliderContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
`;

const RangeTrack = styled.div`
  position: relative;
  flex: 1;
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
`;

const RangeProgress = styled.div<{ $left: number; $width: number }>`
  position: absolute;
  height: 100%;
  background: #2196F3;
  border-radius: 2px;
  left: ${props => props.$left}%;
  width: ${props => props.$width}%;
`;

const Thumb = styled.div<{ $position: number }>`
  position: absolute;
  width: 16px;
  height: 16px;
  background: #2196F3;
  border-radius: 50%;
  top: 50%;
  left: ${props => props.$position}%;
  transform: translate(-50%, -50%);
  cursor: pointer;
  transition: transform 0.2s;
  z-index: 1;

  &:hover {
    transform: translate(-50%, -50%) scale(1.1);
  }
`;

interface RangeSliderProps {
  min: number;
  max: number;
  step: number;
  minValue: number;
  maxValue: number;
  onChange: (min: number, max: number) => void;
  unit?: string;
}

const RangeSlider: React.FC<RangeSliderProps> = ({
  min,
  max,
  step,
  minValue,
  maxValue,
  onChange,
  unit = "°"
}) => {
  const [activeThumb, setActiveThumb] = useState<'min' | 'max' | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  
  // 상태 변경 추적을 위한 로그
  useEffect(() => {
    console.log('Active thumb changed:', activeThumb);
  }, [activeThumb]);
  
  // minValue, maxValue 변경 추적
  useEffect(() => {
    console.log('Values changed - minValue:', minValue, 'maxValue:', maxValue);
  }, [minValue, maxValue]);
  
  // 퍼센트 위치 계산
  const getPercent = (value: number) => {
    return ((value - min) / (max - min)) * 100;
  };
  
  const minPercent = getPercent(minValue);
  const maxPercent = getPercent(maxValue);
  
  // 트랙 클릭 이벤트
  const handleTrackClick = (e: React.MouseEvent) => {
    if (!trackRef.current) return;
    
    const rect = trackRef.current.getBoundingClientRect();
    const percent = ((e.clientX - rect.left) / rect.width) * 100;
    const value = min + ((max - min) * percent) / 100;
    const roundedValue = Math.round(value / step) * step;
    
    console.log('Track click - x:', e.clientX, 'percent:', percent, 'value:', roundedValue);
    
    // 클릭 위치가 더 가까운 핸들을 이동
    const isCloserToMin = Math.abs(minValue - roundedValue) < Math.abs(maxValue - roundedValue);
    console.log('Closer to min:', isCloserToMin);
    
    if (isCloserToMin) {
      console.log('Moving min handle to:', roundedValue);
      onChange(roundedValue, maxValue);
    } else {
      console.log('Moving max handle to:', roundedValue);
      onChange(minValue, roundedValue);
    }
  };
  
  // 마우스 이동 핸들러
  useEffect(() => {
    if (!activeThumb) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!trackRef.current) return;
      
      const rect = trackRef.current.getBoundingClientRect();
      const percent = ((e.clientX - rect.left) / rect.width) * 100;
      let value = min + ((max - min) * percent) / 100;
      value = Math.max(min, Math.min(max, value));
      value = Math.round(value / step) * step;
      
      console.log('Mouse move - activeThumb:', activeThumb, 'x:', e.clientX, 'percent:', percent, 'value:', value);
      
      if (activeThumb === 'min') {
        // 최소값은 최대값을 초과할 수 없음
        const newMinValue = Math.min(value, maxValue);
        console.log('Setting min value to:', newMinValue);
        onChange(newMinValue, maxValue);
      } else if (activeThumb === 'max') {
        // 최대값은 최소값보다 작을 수 없음
        const newMaxValue = Math.max(value, minValue);
        console.log('Setting max value to:', newMaxValue);
        onChange(minValue, newMaxValue);
      }
    };
    
    const handleMouseUp = () => {
      console.log('Mouse up - releasing thumb');
      setActiveThumb(null);
    };
    
    console.log('Adding event listeners for activeThumb:', activeThumb);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      console.log('Removing event listeners');
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [activeThumb, min, max, step, minValue, maxValue, onChange]);
  
  return (
    <SliderContainer>
      <NumberInput
        value={minValue}
        onChange={(value) => {
          console.log('Min input changed to:', value);
          // 최소값은 최대값을 초과할 수 없음
          const newMinValue = Math.min(value, maxValue);
          onChange(newMinValue, maxValue);
        }}
        unit={unit}
      />
      
      <RangeTrack ref={trackRef} onClick={handleTrackClick}>
        <RangeProgress 
          $left={minPercent} 
          $width={maxPercent - minPercent} 
        />
        <Thumb 
          $position={minPercent} 
          onMouseDown={(e) => {
            console.log('Min thumb mouse down');
            e.stopPropagation(); // 이벤트 버블링 방지
            setActiveThumb('min');
          }}
        />
        <Thumb 
          $position={maxPercent} 
          onMouseDown={(e) => {
            console.log('Max thumb mouse down');
            e.stopPropagation(); // 이벤트 버블링 방지
            setActiveThumb('max');
          }}
        />
      </RangeTrack>
      
      <NumberInput
        value={maxValue}
        onChange={(value) => {
          console.log('Max input changed to:', value);
          // 최대값은 최소값보다 작을 수 없음
          const newMaxValue = Math.max(value, minValue);
          onChange(minValue, newMaxValue);
        }}
        unit={unit}
      />
    </SliderContainer>
  );
};

export default RangeSlider; 