import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import styled, { keyframes } from 'styled-components';
import { Word } from '../types';
import TopWordsSelector from './TopWordsSelector';
import { FiDownload, FiUpload, FiSettings, FiPlus } from 'react-icons/fi';
import { NumberInput } from './ControlPanel';

// TextArcVisualizer.tsx, ControlPanel.tsx 등에서 반복되는 색상 배열
const COLOR_ARRAY = [
  '#1e88e5', '#e53935', '#43a047', '#fb8c00', '#8e24aa', 
  '#00acc1', '#ffb300', '#6d4c41', '#546e7a', '#ec407a'
];

// 워드클라우드 컨트롤 패널과 유사한 스타일 컴포넌트 정의
const Container = styled.div`
  background: #ffffff;
  padding: 20px;
  border-radius: 12px;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  
  @media (max-width: 1024px) {
    margin-top: 0;
    overflow: auto;
  }

  @media (max-width: 768px) {
    gap: 10px;
    padding: 15px;
  }
`;

const Section = styled.div`
  margin-bottom: 25px;
  
  &:last-child {
    margin-bottom: 0;
  }

  @media (max-width: 1024px) {
    margin-bottom: 15px;
  }
`;

const Title = styled.h3`
  color: #2c3e50;
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  
  @media (max-width: 1024px) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  
  @media (max-width: 768px) {
    font-size: 0.9rem;
  }
`;

const SubTitle = styled.h4`
  font-size: 0.9rem;
  margin-bottom: 5px;
  color: #333;
  font-weight: normal;
`;

const RangeInput = styled.input`
  width: 100%;
  margin: 10px 0;
  -webkit-appearance: none;
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  outline: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    background: #2196F3;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s;
  }

  &::-webkit-slider-thumb:hover {
    transform: scale(1.1);
  }
`;

const ValueDisplay = styled.div`
  display: flex;
  justify-content: space-between;
  color: #666;
  font-size: 0.9rem;
`;

// 워드클라우드와 동일한 Text Area 스타일 적용
const commonInputStyles = `
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  box-sizing: border-box;
  font-family: inherit;
  color: #2c3e50;
  background-color: #fff;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #2196F3;
    box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1);
  }

  &::placeholder {
    color: #a0aec0;
  }
`;

const TextArea = styled.textarea`
  ${commonInputStyles}
  min-height: 60px;
  resize: vertical;
`;

// 워드클라우드와 동일한 컨테이너 레이아웃 적용
const InputContainer = styled.div`
  display: flex;
  gap: 8px;
  width: 100%;
`;

const TextAreaWrapper = styled.div`
  flex: 3;
  
  @media (max-width: 1024px) {
    width: 100%;
  }
`;

const ButtonColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  justify-content: flex-start;
  min-width: 110px;
  
  @media (max-width: 768px) {
    flex-direction: row;
    min-width: auto;
  }
`;

const IconButton = styled.button<{ $primary?: boolean }>`
  flex: 1;
  padding: 6px 12px;
  background-color: ${props => props.$primary ? '#2196F3' : '#f1f5f9'};
  color: ${props => props.$primary ? 'white' : '#475569'};
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: all 0.2s;

  &:hover {
    background-color: ${props => props.$primary ? '#1976D2' : '#e2e8f0'};
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const ExcludedWordsSection = styled(Section)`
  // 워드클라우드와 동일하게 Grid 영역 조정
  @media (max-width: 1024px) {
    grid-column: 1 / -1;
  }
`;

const GenerateButton = styled.button`
  padding: 12px 24px;
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
  margin: 20px auto 0;
  display: block;
  width: 100%;
  
  &:hover {
    background-color: #1976D2;
  }
  
  &:disabled {
    background-color: #e2e8f0;
    cursor: not-allowed;
  }
`;

// 빈 상태를 위한 스타일 추가
const EmptyState = styled.div`
  padding: 15px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  color: #64748b;
  font-size: 0.9rem;
  text-align: center;
  margin-top: 10px;
`;

// TopWordsSelector를 감싸는 컨테이너
const TopWordsContainer = styled.div`
  margin-top: 15px;
`;

// 상대적 위치 컨테이너 (팝업용)
const RelativeContainer = styled.div`
  position: relative;
  width: 100%;
`;

// 색상 설정 버튼
const ColorSettingsButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 10px 12px;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  color: #334155;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #f1f5f9;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ColorSampleContainer = styled.div`
  display: flex;
  gap: 2px;
`;

const ColorSample = styled.span<{ color: string }>`
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 2px;
  background-color: ${props => props.color};
  border: 1px solid rgba(0, 0, 0, 0.1);
`;

// 팝업 컨테이너
const ColorPopupContainer = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 20px;
  width: 90%;
  max-width: 420px;
`;

const CustomColorsContainer = styled.div`
  p {
    margin-bottom: 15px;
    font-size: 14px;
    color: #475569;
  }
`;

// 색상 그리드
const ColorBoxGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-top: 15px;
`;

// 색상 박스
const ColorBox = styled.div<{ color: string }>`
  position: relative;
  background-color: ${props => props.color};
  border-radius: 4px;
  aspect-ratio: 1;
  cursor: pointer;
  border: 1px solid rgba(0, 0, 0, 0.1);
  
  &:hover {
    transform: scale(1.05);
    
    button {
      opacity: 1;
    }
  }
`;

// 색상 추가 버튼
const AddColorBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f1f5f9;
  border-radius: 4px;
  aspect-ratio: 1;
  cursor: pointer;
  border: 1px dashed #94a3b8;
  font-size: 24px;
  color: #64748b;
  
  &:hover {
    background-color: #e2e8f0;
    transform: scale(1.05);
  }
`;

// 삭제 버튼
const DeleteButton = styled.button`
  position: absolute;
  top: -8px;
  right: -8px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #ef4444;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  border: none;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
  
  &:hover {
    background: #dc2626;
  }
`;

// Overlay 컴포넌트 정의 추가
const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
`;

// 팝업 포탈 컴포넌트
const ColorPopupPortal = ({ children, isOpen }: { children: React.ReactNode, isOpen: boolean }) => {
  if (!isOpen) return null;
  return ReactDOM.createPortal(
    children,
    document.body
  );
};

// 워드클라우드에서 가져온 추가 스타일
const Select = styled.select`
  ${commonInputStyles}
  appearance: none;
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%232c3e50' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  padding-right: 32px;
`;

// 색상 선택 컨테이너 수정 - 버튼 간격 동적 조정
const ColorSelectContainer = styled.div<{ $totalButtons: number }>`
  display: flex;
  width: 100%;
  /* 버튼 개수에 따라 동적 간격 조정 */
  gap: ${props => {
    // 공간이 충분할 때는 10px 간격 유지
    // 버튼이 많아질수록 간격 줄이기
    if (props.$totalButtons <= 5) return '10px';
    else if (props.$totalButtons <= 7) return '8px';
    else if (props.$totalButtons <= 9) return '6px';
    else return '4px';
  }};
  flex-wrap: nowrap;
  margin-top: 10px;
  margin-bottom: 5px;
`;

// 색상 버튼 스타일 유지
const ColorButton = styled.div<{ $color: string, $isRemoving: boolean, $totalButtons: number }>`
  flex: 0 1 40px;
  width: 40px;
  height: 40px;
  border-radius: 4px;
  cursor: pointer;
  position: relative;
  background-color: ${props => props.$color};
  border: 2px solid #e2e8f0;
  transition: all 0.2s;
  animation: ${props => props.$isRemoving ? `${fadeOut} 0.3s` : 'none'};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.3);
    opacity: 0;
    transition: opacity 0.2s;
    border-radius: 0 0 2px 2px;
  }
  
  &::after {
    content: "×";
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 18px;
    font-weight: 500;
    opacity: 0;
    transition: opacity 0.2s;
    z-index: 1;
  }
  
  &:hover::before,
  &:hover::after {
    opacity: 1;
  }
`;

// 페이드 아웃 애니메이션 추가
const fadeOut = keyframes`
  from { opacity: 1; transform: scale(1); }
  to { opacity: 0; transform: scale(0.8); }
`;

// 새 색상 추가 버튼도 동일하게 유지
const AddColorButton = styled.div<{ $totalButtons: number }>`
  flex: 0 1 40px;
  width: 40px;
  height: 40px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #475569;
  background-color: white;
  border: 2px solid #e2e8f0;
  transition: all 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    background-color: #f8fafc;
  }
  
  &:active {
    transform: translateY(0);
  }
`;

// 색상 입력 컴포넌트 수정
const ColorInputContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
`;

const ColorInputLabel = styled.label`
  font-size: 0.9rem;
  color: #475569;
  flex: 2;
`;

// 색상 버튼 - 색상이 없을 때 + 표시 추가, 제거 가능 여부 속성 추가
const ColorInputPreview = styled.div<{ 
  $color: string | null, 
  $hasColor: boolean,
  $removable?: boolean // 제거 가능 여부를 나타내는 새 속성
}>`
  width: 32px;
  height: 32px;
  border-radius: 4px;
  background-color: ${props => props.$hasColor ? props.$color : 'white'};
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  
  // 색상이 없을 때 + 표시
  ${props => !props.$hasColor && `
    &::before,
    &::after {
      content: '';
      position: absolute;
      background-color: #475569;
    }
    
    &::before {
      width: 2px;
      height: 14px;
      top: 9px;
      left: 15px;
    }
    
    &::after {
      width: 14px;
      height: 2px;
      top: 15px;
      left: 9px;
    }
  `}
  
  // 색상이 있고 제거 가능한 경우에만 호버 시 X 표시
  ${props => props.$hasColor && props.$removable && `
    &::before {
      content: "";
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.3);
      opacity: 0;
      transition: opacity 0.2s;
      border-radius: 0 0 4px 4px;
    }
    
    &::after {
      content: "×";
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 14px;
      opacity: 0;
      transition: opacity 0.2s;
      z-index: 1;
    }
    
    &:hover::before,
    &:hover::after {
      opacity: 1;
    }
  `}
  
  &:hover {
    transform: scale(1.1);
  }
`;

const ColorInputField = styled.input`
  width: 0;
  height: 0;
  opacity: 0;
  position: absolute;
`;

// SliderContainer 스타일 컴포넌트 추가 (워드클라우드와 동일)
const SliderContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
`;

// 워드 클라우드와 동일한 슬라이더 스타일
const Slider = styled.input`
  flex: 1;
  -webkit-appearance: none;
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  outline: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    background: #2196F3;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s;
  }

  &::-webkit-slider-thumb:hover {
    transform: scale(1.1);
  }
`;

// NumberInput 관련 컴포넌트 추가
const NumberInputWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 70px;
  user-select: none;
`;

const NumberText = styled.span`
  font-size: 0.875rem;
  color: #475569;
  cursor: pointer;
  
  &:hover {
    color: #2196F3;
  }
`;

const NumberPopup = styled.div`
  position: absolute;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 100;
`;

const NumberPopupInput = styled.input`
  width: 80px;
  padding: 4px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  text-align: center;
  font-size: 0.875rem;
  
  &:focus {
    outline: none;
    border-color: #2196F3;
  }
`;

// NumberInput 컴포넌트를 직접 구현
const NumberInputContainer = styled.div`
  display: flex;
  align-items: center;
  min-width: 55px;
  justify-content: flex-end;
`;

const NumberDisplay = styled.span`
  font-size: 1rem;
  color: #2c3e50 !important;  // 우선순위 강제
  cursor: pointer;
  white-space: nowrap;
  
  &:hover {
    color: #2196F3 !important;  // 우선순위 강제
  }
`;

const NumberEditInput = styled.input`
  width: 60px;
  padding: 4px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 1rem;
  text-align: right;
  
  &:focus {
    outline: none;
    border-color: #2196F3;
  }
`;

// TextArcNumberInput 컴포넌트 수정 (기능은 동일)
function TextArcNumberInput({ value, onChange, unit = '' }) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef(null);
  
  // 기존 로직은 유지
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);
  
  const handleApplyChange = () => {
    const newValue = parseInt(inputValue, 10);
    if (!isNaN(newValue) && newValue > 0) {
      onChange(newValue);
    } else {
      setInputValue(value);
    }
    setIsEditing(false);
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleApplyChange();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setInputValue(value);
    }
  };
  
  useEffect(() => {
    setInputValue(value);
  }, [value]);
  
  return (
    <NumberInputContainer>
      {isEditing ? (
        <NumberEditInput
          ref={inputRef}
          type="number"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleApplyChange}
          onKeyDown={handleKeyDown}
          min={1}
        />
      ) : (
        <NumberDisplay onClick={() => setIsEditing(true)}>
          {value}{unit}
        </NumberDisplay>
      )}
    </NumberInputContainer>
  );
}

interface TextArcControlPanelProps {
  maxSelectedWords: number;
  onMaxSelectedWordsChange: (max: number) => void;
  selectedColors: string[];
  onColorChange: (index: number, color: string) => void;
  excludedWords: string[];
  onExcludedWordsChange: (words: string[]) => void;
  processedWords: Word[];
  onGenerateClick: () => void;
  isGenerating: boolean;
  onSetAllColors?: (colors: string[]) => void;
  backgroundColor: string | null;
  onBackgroundColorChange: (color: string | null) => void;
  defaultTextColor: string;
  onDefaultTextColorChange: (color: string) => void;
  maxSentenceLength: number;
  onMaxSentenceLengthChange: (length: number) => void;
}

const TextArcControlPanel: React.FC<TextArcControlPanelProps> = ({
  maxSelectedWords,
  onMaxSelectedWordsChange,
  selectedColors,
  onColorChange,
  excludedWords,
  onExcludedWordsChange,
  processedWords,
  onGenerateClick,
  isGenerating,
  onSetAllColors,
  backgroundColor,
  onBackgroundColorChange,
  defaultTextColor,
  onDefaultTextColorChange,
  maxSentenceLength,
  onMaxSentenceLengthChange
}) => {
  const [isColorPopupOpen, setIsColorPopupOpen] = useState(false);
  
  // 불용어 토글 핸들러
  const handleToggleWord = (word: string) => {
    const normalizedWord = word.toLowerCase();
    const newExcludedWords = excludedWords.includes(normalizedWord)
      ? excludedWords.filter(w => w !== normalizedWord)
      : [...excludedWords, normalizedWord];
    
    onExcludedWordsChange(newExcludedWords);
  };
  
  // 불용어 입력 핸들러
  const handleExcludedWordsChange = (value: string) => {
    const words = value.split(',').map(word => word.trim().toLowerCase()).filter(Boolean);
    onExcludedWordsChange(words);
  };
  
  // 불용어 내보내기 함수
  const exportExcludedWords = (words: string[]) => {
    const content = words.join(', ');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'textarc_excluded_words.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 불용어 가져오기 함수
  const importExcludedWords = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const words = content.split(',').map(word => word.trim()).filter(Boolean);
        onExcludedWordsChange(words);
      } catch (error) {
        console.error('Failed to parse excluded words:', error);
        alert('파일 형식이 올바르지 않습니다.');
      }
    };
    reader.readAsText(file);
  };
  
  // 색상 버튼 클릭 핸들러
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [activeColorIndex, setActiveColorIndex] = useState<number | null>(null);

  const handleColorButtonClick = (index: number) => {
    setActiveColorIndex(index);
    if (colorInputRef.current) {
      colorInputRef.current.value = selectedColors[index] || '#1e88e5';
      colorInputRef.current.click();
    }
  };
  
  // 색상 추가 핸들러
  const handleAddColor = () => {
    if (selectedColors.length < 10) {  // 최대 10개까지 제한
      // 기본 색상 배열
      const defaultColors = [
        '#1e88e5', '#f44336', '#4caf50', '#ffeb3b', '#9c27b0',
        '#ff9800', '#009688', '#795548', '#607d8b', '#e91e63'
      ].filter(color => !selectedColors.includes(color));
      
      // 새 색상 (남은 색상 중 첫 번째 또는 기본 파란색)
      const newColor = defaultColors.length > 0 ? defaultColors[0] : '#1e88e5';
      
      const newColors = [...selectedColors, newColor];
      onMaxSelectedWordsChange(newColors.length);
      onColorChange(newColors.length - 1, newColor);
    }
  };
  
  // 색상 제거 통합 핸들러 수정
  const handleRemoveColor = (
    e: React.MouseEvent | number,
    colorValue?: string | null,
    setter?: (color: string | null) => void
  ) => {
    // 단어 색상 버튼인 경우 (기존 함수)
    if (typeof e === 'number') {
      const index = e as number;
      
      // 마지막 하나의 색상은 삭제할 수 없음
      if (selectedColors.length <= 1) {
        return;
      }
      
      // 해당 인덱스를 제외한 새 배열 생성
      const newColors = selectedColors.filter((_, i) => i !== index);
      onMaxSelectedWordsChange(Math.min(maxSelectedWords, newColors.length));
      
      // onSetAllColors가 제공된 경우 이를 통해 상위 컴포넌트에 알림
      if (onSetAllColors) {
        onSetAllColors(newColors);
      }
      return;
    }
    
    // 배경/텍스트 색상 버튼인 경우 (새로운 로직)
    if (colorValue && setter) {
      // 클릭 위치가 하단 절반인지 확인
      const rect = (e as React.MouseEvent).currentTarget.getBoundingClientRect();
      const y = (e as React.MouseEvent).clientY - rect.top;
      
      if (y >= rect.height / 2) {
        // 하단 절반 클릭 시 색상 제거
        setter(null);
        (e as React.MouseEvent).stopPropagation(); // 색상 선택창 열리는 것 방지
      }
    }
  };
  
  // 색상 입력 핸들러 수정
  const handleColorInputChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (color: string | null) => void) => {
    setter(e.target.value);
  };
  
  return (
    <Container>
      <Section>
        <Title>단어 선택 개수 및 색상</Title>
        
        <ColorSelectContainer 
          $totalButtons={selectedColors.length < 10 ? selectedColors.length + 1 : selectedColors.length}
        >
          {selectedColors.map((color, index) => {
            const totalButtons = selectedColors.length < 10 ? 
              selectedColors.length + 1 : selectedColors.length;
              
            return (
              <ColorButton 
                key={index} 
                $color={color}
                $isRemoving={color === ''}
                $totalButtons={totalButtons}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const y = e.clientY - rect.top;
                  
                  if (y >= rect.height / 2) {
                    handleRemoveColor(index);
                  } else {
                    handleColorButtonClick(index);
                  }
                }}
                title={`단어 색상 ${index + 1} (상단 클릭: 색상 변경, 하단 클릭: 삭제)`}
              />
            );
          })}
          
          {selectedColors.length < 10 && (
            <AddColorButton 
              onClick={handleAddColor}
              $totalButtons={selectedColors.length + 1}
              title="색상 추가 (선택 단어 수 증가)"
            >
              <FiPlus size={20} />
            </AddColorButton>
          )}
        </ColorSelectContainer>
        
        <div style={{ marginTop: '8px', fontSize: '0.9rem', color: '#475569' }}>
          색상 개수 = 선택될 단어 수 ({selectedColors.length}개)
        </div>
      </Section>
      
      {/* 워드클라우드와 동일한 불용어 섹션 디자인 적용 */}
      <ExcludedWordsSection>
        <Title>
          불용어
          <InputContainer>
            <TextAreaWrapper>
              <TextArea
                value={excludedWords.join(', ')}
                onChange={(e) => handleExcludedWordsChange(e.target.value)}
                placeholder="쉼표로 구분하여 입력 (예: 그리고, 하지만, 그런데)"
              />
            </TextAreaWrapper>
            <ButtonColumn>
              <IconButton as="label" $primary>
                <FiUpload /> 가져오기
                <input
                  type="file"
                  accept=".txt"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) importExcludedWords(file);
                  }}
                />
              </IconButton>
              <IconButton onClick={() => exportExcludedWords(excludedWords)}>
                <FiDownload /> 내보내기
              </IconButton>
            </ButtonColumn>
          </InputContainer>
        </Title>

        <TopWordsContainer>
          <SubTitle>상위 빈도 단어 (클릭으로 불용어 지정/해제)</SubTitle>
          {processedWords.length > 0 ? (
            <TopWordsSelector
              words={processedWords.slice(0, 20).map(word => ({
                text: word.text,
                value: word.value
              }))}
              excludedWords={excludedWords}
              onToggleWord={handleToggleWord}
            />
          ) : (
            <EmptyState>
              텍스트를 입력하고 생성하면 여기에 상위 빈도 단어가 표시됩니다.
            </EmptyState>
          )}
        </TopWordsContainer>
      </ExcludedWordsSection>
      
      {/* 새로운 섹션: 시각화 스타일 */}
      <Section>
        <Title>시각화 스타일</Title>
        
        <div style={{ marginBottom: '15px' }}>
          <SubTitle>최대 문장 표시 길이</SubTitle>
          <SliderContainer>
            <Slider
              type="range"
              min={30}
              max={300}
              value={maxSentenceLength}
              onChange={(e) => onMaxSentenceLengthChange(parseInt(e.target.value))}
            />
            <NumberInput
              value={maxSentenceLength}
              onChange={onMaxSentenceLengthChange}
              unit="자"
            />
          </SliderContainer>
        </div>
        
        <ColorInputContainer>
          <ColorInputLabel>배경 색상</ColorInputLabel>
          <ColorInputPreview 
            $color={backgroundColor} 
            $hasColor={backgroundColor !== null}
            $removable={true} // 배경 색상은 제거 가능
            onClick={(e) => {
              if (backgroundColor) {
                handleRemoveColor(e, backgroundColor, onBackgroundColorChange);
              } else {
                document.getElementById('background-color-input')?.click();
              }
            }}
          />
          <ColorInputField
            id="background-color-input"
            type="color"
            value={backgroundColor || '#ffffff'}
            onChange={(e) => handleColorInputChange(e, onBackgroundColorChange)}
          />
        </ColorInputContainer>
        
        <ColorInputContainer>
          <ColorInputLabel>기본 텍스트 색상</ColorInputLabel>
          <ColorInputPreview 
            $color={defaultTextColor} 
            $hasColor={true}
            $removable={false} // 텍스트 색상은 제거 불가능
            onClick={() => document.getElementById('text-color-input')?.click()}
          />
          <ColorInputField
            id="text-color-input"
            type="color"
            value={defaultTextColor}
            onChange={(e) => handleColorInputChange(e, onDefaultTextColorChange)}
          />
        </ColorInputContainer>
      </Section>
      
      <div style={{ width: '100%', marginTop: '15px' }}>
        <IconButton 
        onClick={onGenerateClick}
          $primary
          style={{ 
            width: '100%', 
            height: '36px',
            flex: 'none'
          }}
        disabled={isGenerating}
      >
        {isGenerating ? '생성 중...' : 'TextArc 생성하기'}
        </IconButton>
    </div>
    </Container>
  );
};

export default TextArcControlPanel; 