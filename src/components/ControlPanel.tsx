import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';
import { WordCloudOptions } from '../types';
import { FiDownload, FiUpload, FiCheck, FiX, FiImage } from 'react-icons/fi';
import TopWordsSelector from './TopWordsSelector';
import { createShapeFromPNG } from '../utils/shapeUtils';
import RangeSlider from './RangeSlider';

interface ControlPanelProps {
  options: WordCloudOptions;
  onOptionsChange: (options: WordCloudOptions) => void;
  totalUniqueWords: number;
  words: Word[];
  onGenerateCloud: () => void;
}

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
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
    overflow: auto;
    
    & > *:nth-child(3),
    & > *:nth-child(4) {
      grid-column: span 2;
    }
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
    margin-bottom: 0;
  }
`;

const SectionRow = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 25px;
  
  & > * {
    flex: 1;
    margin-bottom: 0;
  }
  
  @media (max-width: 1024px) {
    flex-direction: column;
    gap: 15px;
    margin-bottom: 0;
  }
`;

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

const Input = styled.input`
  ${commonInputStyles}
`;

const Select = styled.select`
  ${commonInputStyles}
  appearance: none;
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%232c3e50' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  padding-right: 32px;
`;

const TextArea = styled.textarea`
  ${commonInputStyles}
  min-height: 60px;
  resize: vertical;
`;

const Title = styled.h3`
  color: #2c3e50;
  font-size: 1rem;
  font-weight: 500;
  display: flex;
  flex-direction: column;
  gap: 8px;
  white-space: nowrap;
  
  @media (max-width: 1024px) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-width: fit-content;
  }
  
  @media (max-width: 768px) {
    font-size: 0.9rem;
  }
`;

const InputContainer = styled.div`
  display: flex;
  gap: 8px;
  width: 100%;
  min-width: 0;

  // 선택 요소와 업로드 버튼의 비율 조정
  select {
    flex: 3;
    min-width: 0;
  }

  // 업로드 버튼 스타일 조정
  label, button[as="label"] {
    flex: 1.2;
    min-width: 90px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  // 모바일 화면에서는 세로로 배치
  @media (max-width: 480px) {
    flex-direction: column;
    
    select, label {
      width: 100%;
      flex: none;
    }
  }
`;

const InputWrapper = styled.div`
  flex: 1;
  max-width: 200px;
  
  @media (max-width: 1024px) {
    max-width: 150px;
  }
`;

const TextAreaWrapper = styled(InputWrapper)`
  max-width: none;
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

const ExcludedWordsSection = styled(Section)`
  grid-column: 1 / -1;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
  
  @media (max-width: 1024px) {
    flex-direction: row;
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

const InputWithSlider = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
`;

const SliderContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
`;

const Slider = styled.input`
  flex: 1;
  -webkit-appearance: none;
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  outline: none;

  // 기점 표시
  &::-webkit-slider-runnable-track {
    width: 100%;
    height: 4px;
    background: linear-gradient(to bottom, #e2e8f0 0%, #e2e8f0 100%) no-repeat;
  }

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    background: #2196F3;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s;
    margin-top: -6px;
  }

  &::-webkit-slider-thumb:hover {
    transform: scale(1.1);
  }

  // 기점에서만 멈추도록 설정
  &.stepped {
    pointer-events: none;
    
    &::-webkit-slider-thumb {
      pointer-events: auto;
    }
  }
`;

const NumberDisplay = styled.div<{ $isEditing: boolean }>`
  min-width: 60px;
  padding: 4px 8px;
  border-radius: 4px;
  text-align: center;
  cursor: pointer;
  background: ${props => props.$isEditing ? '#fff' : 'transparent'};
  border: ${props => props.$isEditing ? '1px solid #e2e8f0' : '1px solid transparent'};

  &:hover {
    background: ${props => props.$isEditing ? '#fff' : '#f8fafc'};
  }
`;

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  unit?: string;
  steps?: number[];  // steps는 남겨두어 나중에 필요할 수 있음
}

const NumberInput: React.FC<NumberInputProps> = ({ value, onChange, unit = '' }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  // value prop이 변경될 때 tempValue도 업데이트
  useEffect(() => {
    setTempValue(value.toString());
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    const newValue = Math.max(Number(tempValue) || 0, 0);  // 음수만 방지
    onChange(newValue);
    setTempValue(newValue.toString());
  };

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        type="number"
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleBlur();
          if (e.key === 'Escape') {
            setIsEditing(false);
            setTempValue(value.toString());
          }
        }}
        style={{ width: '60px', padding: '4px 8px' }}
      />
    );
  }

  return (
    <NumberDisplay 
      $isEditing={false}
      onClick={() => setIsEditing(true)}
    >
      {value}{unit}
    </NumberDisplay>
  );
};

// 회전 각도 기점 설정
const ROTATION_STEPS = [-90, -60, -45, -30, -15, 0, 15, 30, 45, 60, 90];

// 단어 수 기점 생성 함수 수정
const generateWordCountSteps = (totalUniqueWords: number) => {
  return [10, 50, 100, 200, 500].filter(n => n <= totalUniqueWords);  // 총 단어 수보다 작거나 같은 값만 사용
};

const MaxWordsSection = styled(Section)`
  // 미디어 쿼리 제거 (Grid에서 처리)
`;

// 파일 업로드 상태를 위한 인터페이스 추가
interface UploadState {
  fileName: string;
  isUploaded: boolean;
}

const UploadButton = styled(IconButton)<{ $isUploaded: boolean }>`
  width: 100%;
  background: ${props => props.$isUploaded ? '#e2f2ff' : '#fff'};
  color: ${props => props.$isUploaded ? '#2196F3' : '#475569'};
  border: 1px solid ${props => props.$isUploaded ? '#2196F3' : '#e2e8f0'};
  position: relative;
  padding: 6px 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  
  &:hover {
    background: ${props => props.$isUploaded ? '#d1e9ff' : '#f8f9fa'};
  }

  span {
    margin-left: 4px;
    
    @media (max-width: 1024px) {
      display: none;
    }
  }

  @media (max-width: 1024px) {
    min-width: 40px;
    width: 40px;
    padding: 0;
    
    // 업로드된 상태일 때도 파란색 계열 유지
    ${props => props.$isUploaded && `
      background: #e2f2ff;
      color: #2196F3;
      border-color: #2196F3;
      
      &:hover {
        background: #d1e9ff;
      }
    `}
  }
`;

const FileInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  padding: 4px 8px;
  font-size: 0.8rem;
  color: #2196F3;
  background: #f8f9fa;
  border-radius: 4px;
  justify-content: space-between;

  @media (max-width: 1024px) {
    display: none;  // 모바일에서는 기본적으로 숨김
  }
`;

const FileActions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  padding: 2px;
  cursor: pointer;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  
  &:hover {
    background: #e2e8f0;
    color: #475569;
  }
`;

// 컴포넌트 외부로 이동
const MobileTooltip = styled.div<{ $show: boolean }>`
  display: none;
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: #2c3e50;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  white-space: nowrap;
  z-index: 10;
  
  @media (max-width: 1024px) {
    display: ${props => props.$show ? 'block' : 'none'};
  }

  &::before {
    content: '';
    position: absolute;
    top: -4px;
    right: 14px;
    border-left: 4px solid transparent;
    border-right: 4px solid transparent;
    border-bottom: 4px solid #2c3e50;
  }
`;

// 색상 선택 컴포넌트 추가
const ColorPicker = styled.input`
  width: 30px;
  height: 30px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: none;
  cursor: pointer;
  overflow: hidden;
  
  &::-webkit-color-swatch-wrapper {
    padding: 0;
  }
  
  &::-webkit-color-swatch {
    border: 1px solid #e2e8f0;
    border-radius: 50%;
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.3);
  }
`;

const ColorPickersContainer = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 8px;
`;

// 버튼 컴포넌트 추가
const Button = styled.button`
  padding: 4px 12px;
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
  font-weight: 500;
  
  &:hover {
    background-color: #1976D2;
  }
`;

// 색상 테마 버튼 컴포넌트
const ColorThemeButton = styled.button<{ $isSelected: boolean }>`
  min-width: 40px;
  max-width: 60px;
  flex: 1;
  height: 40px;
  border-radius: 6px;
  border: 2px solid ${props => props.$isSelected ? '#2196F3' : '#e2e8f0'};
  padding: 2px;
  cursor: pointer;
  background: white;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: all 0.2s;
  
  &:hover {
    border-color: ${props => props.$isSelected ? '#2196F3' : '#cbd5e1'};
    transform: translateY(-2px);
  }
  
  /* 브라우저 기본 포커스 스타일 제거하고 선택 상태에 따른 테두리 색상 유지 */
  &:focus {
    outline: none;
    border-color: ${props => props.$isSelected ? '#2196F3' : '#e2e8f0'};
  }
  
  /* 포커스를 잃은 후에도 선택 상태에 따른 테두리 색상 유지 */
  &:focus-visible {
    outline: none;
    border-color: ${props => props.$isSelected ? '#2196F3' : '#e2e8f0'};
  }
  
  @media (max-width: 768px) {
    min-width: 30px;
  }
`;

const ColorStripe = styled.div<{ $color: string }>`
  flex: 1;
  background-color: ${props => props.$color};
`;

const ColorThemesContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 8px;
  width: 100%;
`;

const CustomThemeButton = styled(ColorThemeButton)`
  position: relative;
  flex: 1;
  min-width: 40px;
  max-width: 60px;
  
  /* 'C' 텍스트는 색상이 없을 때만 표시되도록 절대 위치로 변경 */
  span {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 1.2rem;
    font-weight: 500;
    color: #5E81AC;
    z-index: 1;
  }
`;

const AddColorBox = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8fafc;
  color: #64748b;
  font-size: 1.2rem;
  cursor: pointer;
  
  &:hover {
    background-color: #f1f5f9;
  }
`;

const CustomColorsContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-top: 12px;
`;

const ColorBoxGrid = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
`;

const ColorBox = styled.div<{ $color: string }>`
  height: 36px;
  background-color: ${props => props.$color};
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 8px;
  position: relative;
  
  &:hover {
    cursor: pointer;
    
    .delete-button {
      opacity: 1;
    }
  }
`;

const DeleteButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: 1;
  font-size: 16px;
  font-weight: bold;
  color: #ffffff;
  text-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
  margin-left: 4px;
  
  &:hover {
    color: #ff4d4d;
  }
`;

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

// 팝업 관련 컴포넌트 추가
const ColorPopupPortal = ({ children, isOpen }) => {
  if (!isOpen) return null;
  return ReactDOM.createPortal(
    children,
    document.body
  );
};

const ColorPopupContainer = styled.div<{ $top: number; $left: number }>`
  position: fixed;
  top: ${props => props.$top}px;
  left: ${props => props.$left}px;
  width: 250px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 16px;
  z-index: 1000;
`;

const PopupOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  z-index: 999;
`;

// 누락된 컴포넌트들 추가
const RelativeContainer = styled.div`
  position: relative;
  flex: 1;
  display: flex;
`;

const PopupTitle = styled.div`
  font-weight: 500;
  font-size: 14px;
  color: #475569;
  margin-bottom: 12px;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 4px;
  
  &:hover {
    color: #475569;
  }
`;

const ColorPickerGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-bottom: 12px;
`;

const PopupActions = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
`;

const ControlPanel: React.FC<ControlPanelProps> = ({ 
  options, 
  onOptionsChange,
  totalUniqueWords,  // prop 추가 필요
  words,
  onGenerateCloud
}) => {
  // 파일 업로드 상태 관리를 위한 state 추가
  const [uploadState, setUploadState] = useState<UploadState>({
    fileName: '',
    isUploaded: false
  });

  // ControlPanel 컴포넌트 내부에 state 추가
  const [colorPopupOpen, setColorPopupOpen] = useState(false);

  const customButtonRef = useRef<HTMLButtonElement>(null);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });

  const handleChange = (key: keyof WordCloudOptions, value: any) => {
    onOptionsChange({
      ...options,
      [key]: value
    });
  };

  const handleExcludedWordsChange = (value: string) => {
    const words = value.split(',').map(word => word.trim().toLowerCase());
    handleChange('excludedWords', words);
  };

  const handleToggleWord = (word: string) => {
    const normalizedWord = word.toLowerCase();
    const newExcludedWords = options.excludedWords.includes(normalizedWord)
      ? options.excludedWords.filter(w => w !== normalizedWord)
      : [...options.excludedWords, normalizedWord];
    
    handleChange('excludedWords', newExcludedWords);
  };

  // 불용어 내보내기 함수 수정
  const exportExcludedWords = (words: string[]) => {
    const content = words.join(', ');  // 쉼표와 공백으로 구분된 텍스트
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'excluded_words.txt';  // 확장자를 txt로 변경
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 불용어 가져오기 함수 수정
  const importExcludedWords = (file: File, callback: (words: string[]) => void) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const words = content.split(',').map(word => word.trim()).filter(Boolean);
        callback(words);
      } catch (error) {
        console.error('Failed to parse excluded words:', error);
        alert('파일 형식이 올바르지 않습니다.');
      }
    };
    reader.readAsText(file);
  };

  const wordCountSteps = generateWordCountSteps(totalUniqueWords);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>, key: keyof WordCloudOptions) => {
    const value = Number(e.target.value);
    handleChange(key, value);
  };

  const handleCustomShapeUpload = async (file: File) => {
    try {
      const shapeFunction = await createShapeFromPNG(file);
      onOptionsChange({
        ...options,
        shape: 'custom',
        customShape: shapeFunction
      });
      // 업로드 상태 업데이트
      setUploadState({
        fileName: file.name,
        isUploaded: true
      });
    } catch (error) {
      console.error('Shape creation failed:', error);
      alert(error.message);
      // 업로드 실패 시 상태 초기화
      setUploadState({
        fileName: '',
        isUploaded: false
      });
    }
  };

  // 파일 제거 핸들러 추가
  const handleRemoveCustomShape = () => {
    onOptionsChange({
      ...options,
      shape: 'square',  // 기본 모양으로 되돌림
      customShape: undefined
    });
    setUploadState({
      fileName: '',
      isUploaded: false
    });
  };

  const [showTooltip, setShowTooltip] = useState(false);

  // 팝업을 표시할 때 위치 계산
  const handleOpenColorPopup = () => {
    if (customButtonRef.current) {
      const rect = customButtonRef.current.getBoundingClientRect();
      setPopupPosition({
        top: rect.bottom + window.scrollY + 10,
        left: rect.left + window.scrollX
      });
    }
    setColorPopupOpen(true);
  };

  return (
    <Container>
      <SectionRow>
        <Section>
          <Title>
            언어
            <InputContainer>
              <Select
                value={options.language}
                onChange={(e) => handleChange('language', e.target.value)}
              >
                <option value="ko">한국어</option>
                <option value="en">영어</option>
                <option value="fr">프랑스어</option>
              </Select>
            </InputContainer>
          </Title>
        </Section>

        <Section>
          <Title>색상</Title>
          <ColorThemesContainer>
            <ColorThemeButton 
              $isSelected={options.colorTheme === 'default'}
              onClick={() => handleChange('colorTheme', 'default')}
              title="기본 색상"
            >
              {getColorScheme('default').map((color, index) => (
                <ColorStripe key={index} $color={color} />
              ))}
            </ColorThemeButton>
            
            <ColorThemeButton 
              $isSelected={options.colorTheme === 'warm'}
              onClick={() => handleChange('colorTheme', 'warm')}
              title="따뜻한 색상"
            >
              {getColorScheme('warm').map((color, index) => (
                <ColorStripe key={index} $color={color} />
              ))}
            </ColorThemeButton>
            
            <ColorThemeButton 
              $isSelected={options.colorTheme === 'cool'}
              onClick={() => handleChange('colorTheme', 'cool')}
              title="차가운 색상"
            >
              {getColorScheme('cool').map((color, index) => (
                <ColorStripe key={index} $color={color} />
              ))}
            </ColorThemeButton>
            
            <RelativeContainer>
              <CustomThemeButton 
                ref={customButtonRef}
                $isSelected={options.colorTheme === 'custom'}
                onClick={() => {
                  console.log('Before update:', options.colorTheme, options.customColors);
                  
                  // customColors가 배열인지 확인하고 항상 배열로 처리
                  const updatedOptions = {
                    ...options,
                    colorTheme: 'custom' as const, // 타입을 명시적으로 지정
                    customColors: Array.isArray(options.customColors) ? [...options.customColors] : []
                  };
                  
                  console.log('After update:', updatedOptions.colorTheme, updatedOptions.customColors);
                  
                  onOptionsChange(updatedOptions);
                  handleOpenColorPopup();
                }}
                title="직접 선택"
              >
                {/* 로깅을 통해 렌더링 조건 확인 */}
                {console.log('Rendering button:', 
                  options.colorTheme, 
                  options.customColors, 
                  Array.isArray(options.customColors), 
                  options.customColors?.length
                )}
                
                {/* 조건부 렌더링 로직 단순화 */}
                {options.colorTheme === 'custom' && Array.isArray(options.customColors) && options.customColors.length > 0 ? (
                  options.customColors.map((color, index) => (
                    <ColorStripe key={index} $color={color} />
                  ))
                ) : (
                  <span>C</span>
                )}
              </CustomThemeButton>
              
              <ColorPopupPortal isOpen={colorPopupOpen}>
                <PopupOverlay onClick={() => setColorPopupOpen(false)} />
                <ColorPopupContainer $top={popupPosition.top} $left={popupPosition.left}>
                  <PopupTitle>커스텀 색상 선택</PopupTitle>
                  <CloseButton onClick={() => setColorPopupOpen(false)}>✕</CloseButton>
                  
                  <CustomColorsContainer>
                    <ColorBoxGrid>
                      {(options.customColors || []).map((color, index) => (
                        <ColorBox 
                          key={index} 
                          $color={color}
                          onClick={(e) => {
                            // 클릭 이벤트가 DeleteButton에서 발생했는지 확인
                            if ((e.target as HTMLElement).closest('.delete-button')) {
                              return; // DeleteButton 클릭 시 색상 선택 방지
                            }
                            
                            // 색상 선택기를 특정 위치에 표시하기 위한 준비
                            // 1. 클릭한 위치(e.clientX, e.clientY) 근처에 색상 선택기를 배치
                            const popupRect = e.currentTarget.getBoundingClientRect();
                            const x = popupRect.right + 10; // 색상 상자 우측에서 10px 떨어진 위치
                            const y = popupRect.top;        // 색상 상자와 같은 높이
                            
                            // 2. 색상 선택기 생성 및 스타일 적용
                            const input = document.createElement('input');
                            input.type = 'color';
                            input.value = color;
                            
                            // 3. 스타일 적용하여 위치 조정 (모든 브라우저에서 작동하지 않을 수 있음)
                            input.style.position = 'fixed';
                            input.style.left = `${x}px`;
                            input.style.top = `${y}px`;
                            input.style.opacity = '0';      // 숨겨서 위치만 조정
                            input.style.pointerEvents = 'none'; // 직접 상호작용 방지
                            
                            // 4. 색상 변경 이벤트 핸들러 추가
                            input.addEventListener('change', (e) => {
                              const newColors = [...(options.customColors || [])];
                              newColors[index] = e.target.value;
                              onOptionsChange({
                                ...options,
                                colorTheme: 'custom',
                                customColors: newColors
                              });
                              
                              // 색상 선택기 요소 제거
                              document.body.removeChild(input);
                            });
                            
                            // 5. 문서에 추가하고 클릭하여 색상 선택기 열기
                            document.body.appendChild(input);
                            
                            // 짧은 지연 후 클릭 (위치 설정이 적용될 시간을 주기 위함)
                            setTimeout(() => {
                              input.click();
                            }, 50);
                          }}
                        >
                          <DeleteButton 
                            className="delete-button"
                            onClick={(e) => {
                              e.stopPropagation(); // 상위 요소의 클릭 이벤트 방지
                              const newColors = [...(options.customColors || [])];
                              newColors.splice(index, 1); // 해당 인덱스의 색상 제거
                              onOptionsChange({
                                ...options,
                                colorTheme: 'custom',
                                customColors: newColors
                              });
                            }}
                          >
                            ✕
                          </DeleteButton>
                        </ColorBox>
                      ))}
                      
                      {/* 항상 마지막에 + 버튼 추가 */}
                      <AddColorBox 
                        onClick={(e) => {
                          e.stopPropagation();
                          if ((options.customColors || []).length < 8) {
                            const newColors = [...(options.customColors || []), '#3B82F6'];
                            onOptionsChange({
                              ...options,
                              colorTheme: 'custom',
                              customColors: newColors
                            });
                          }
                        }}
                      >
                        +
                      </AddColorBox>
                    </ColorBoxGrid>
                  </CustomColorsContainer>
                </ColorPopupContainer>
              </ColorPopupPortal>
            </RelativeContainer>
          </ColorThemesContainer>
        </Section>
      </SectionRow>

      <SectionRow>
        <Section>
          <Title>
            최소 단어 길이
            <InputContainer>
              <Input
                type="number"
                value={options.minWordLength}
                onChange={(e) => handleChange('minWordLength', Number(e.target.value))}
                min={1}
                max={10}
              />
            </InputContainer>
          </Title>
        </Section>

        <Section>
          <Title>
            모양
            <InputContainer>
              <Select
                value={options.shape}
                onChange={(e) => handleChange('shape', e.target.value)}
              >
                <option value="square">정사각형</option>
                <option value="circle">원형</option>
                <option value="cardioid">심장형</option>
                <option value="diamond">다이아몬드</option>
                <option value="triangle">삼각형</option>
                <option value="pentagon">오각형</option>
                <option value="star">별형</option>
              </Select>
              <UploadButton 
                as={uploadState.isUploaded ? 'button' : 'label'} 
                $isUploaded={uploadState.isUploaded}
                onClick={(e) => {
                  if (uploadState.isUploaded) {
                    e.preventDefault();
                    handleRemoveCustomShape();
                  }
                }}
              >
                {uploadState.isUploaded ? (
                  // 업로드된 상태에서는 삭제 아이콘 표시
                  <>
                    <FiX />
                    <span>제거</span>
                  </>
                ) : (
                  // 업로드되지 않은 상태에서는 업로드 아이콘과 input 표시
                  <>
                    <FiImage />
                    <span>PNG</span>
                    <input
                      type="file"
                      accept="image/png"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleCustomShapeUpload(file);
                      }}
                    />
                  </>
                )}
              </UploadButton>
            </InputContainer>
          </Title>
          {uploadState.isUploaded && (
            <FileInfo>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiCheck size={14} />
                {uploadState.fileName}
              </div>
              <FileActions>
                <ActionButton
                  onClick={(e) => {
                    e.preventDefault();
                    handleRemoveCustomShape();
                  }}
                  title="모양 제거"
                >
                  <FiX size={14} />
                </ActionButton>
              </FileActions>
            </FileInfo>
          )}
        </Section>
      </SectionRow>

      <Section>
        <Title>
          회전 각도 범위
          <InputContainer>
            <RangeSlider
              min={-90}
              max={90}
              step={15}
              minValue={options.minRotation}
              maxValue={options.maxRotation}
              onChange={(min, max) => {
                // 두 핸들이 같은 값을 가지면 특정 각도로 고정, 아니면 범위 지정
                const isHybrid = min === max;
                handleChange('rotationEnabled', min !== 0 || max !== 0);
                
                // 여기서 minRotation 값이 실제로 업데이트되는지 확인 필요
                console.log('RangeSlider onChange - min:', min, 'max:', max);
                
                // options 객체를 복사하여 직접 업데이트하는 방식으로 변경
                const updatedOptions = {
                  ...options,
                  minRotation: min, 
                  maxRotation: max,
                  rotationEnabled: min !== 0 || max !== 0
                };
                
                // 모든 변경사항을 한 번에 업데이트
                onOptionsChange(updatedOptions);
              }}
            />
          </InputContainer>
        </Title>
      </Section>

      <MaxWordsSection>
        <Title>
          최대 표시 단어 수
          <InputContainer>
            <SliderContainer>
              <Slider
                type="range"
                min={10}
                max={500}
                value={options.maxWords}
                onChange={(e) => handleSliderChange(e, 'maxWords')}
              />
              <NumberInput
                value={options.maxWords}
                onChange={(value) => handleChange('maxWords', value)}
                unit="개"
              />
            </SliderContainer>
          </InputContainer>
        </Title>
      </MaxWordsSection>

      <ExcludedWordsSection>
        <Title>
          불용어
          <InputContainer>
            <TextAreaWrapper>
              <TextArea
                value={options.excludedWords.join(', ')}
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
                    if (file) {
                      importExcludedWords(file, (words) => {
                        handleChange('excludedWords', words);
                      });
                    }
                  }}
                />
              </IconButton>
              <IconButton onClick={() => exportExcludedWords(options.excludedWords)}>
                <FiDownload /> 내보내기
              </IconButton>
            </ButtonColumn>
          </InputContainer>
        </Title>

        <TopWordsSelector
          words={words}
          excludedWords={options.excludedWords}
          onToggleWord={handleToggleWord}
        />
        
        <div style={{ width: '100%', marginTop: '15px' }}>
          <IconButton 
            onClick={onGenerateCloud} 
            $primary
            style={{ 
              width: '100%', 
              height: '36px',
              flex: 'none'
            }}
          >
            워드 클라우드 생성
          </IconButton>
        </div>
      </ExcludedWordsSection>
    </Container>
  );
};

export default ControlPanel;

export { NumberInput }; 