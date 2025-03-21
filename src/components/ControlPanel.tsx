import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { WordCloudOptions } from '../types';
import { FiDownload, FiUpload, FiCheck, FiX } from 'react-icons/fi';
import TopWordsSelector from './TopWordsSelector';
import { createShapeFromPNG } from '../utils/shapeUtils';

interface ControlPanelProps {
  options: WordCloudOptions;
  onOptionsChange: (options: WordCloudOptions) => void;
  totalUniqueWords: number;
  words: Word[];
}

const Container = styled.div`
  background: #ffffff;
  padding: 20px;
  border-radius: 12px;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  overflow-y: auto;
  
  @media (max-width: 1024px) {
    margin-top: 0;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 15px;
    overflow: auto;

    & > *:nth-child(5),
    & > *:nth-child(6) {
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

  // Select가 더 많은 공간을 차지하도록
  select {
    flex: 2;
    min-width: 0;
  }

  // 업로드 버튼이 더 작은 공간을 차지하도록
  label {
    flex: 1;
    min-width: 40px;
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
  
  &:hover {
    background: ${props => props.$isUploaded ? '#d1e9ff' : '#f8f9fa'};
  }

  span {
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

const ControlPanel: React.FC<ControlPanelProps> = ({ 
  options, 
  onOptionsChange,
  totalUniqueWords,  // prop 추가 필요
  words
}) => {
  // 파일 업로드 상태 관리를 위한 state 추가
  const [uploadState, setUploadState] = useState<UploadState>({
    fileName: '',
    isUploaded: false
  });

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

  return (
    <Container>
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
                  <span>PNG 제거</span>
                </>
              ) : (
                // 업로드되지 않은 상태에서는 업로드 아이콘과 input 표시
                <>
                  <FiUpload />
                  <span>PNG 업로드</span>
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

      <Section>
        <Title>
          색상
          <InputContainer>
            <Select
              value={options.colorTheme}
              onChange={(e) => handleChange('colorTheme', e.target.value)}
            >
              <option value="default">기본</option>
              <option value="warm">따뜻한 색상</option>
              <option value="cool">차가운 색상</option>
            </Select>
          </InputContainer>
        </Title>
      </Section>

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
          회전 각도
          <InputContainer>
            <SliderContainer>
              <Slider
                className="stepped"
                type="range"
                min={-90}
                max={90}
                value={options.maxRotation}
                step={15}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  handleChange('rotationEnabled', value !== 0);
                  handleChange('maxRotation', value);
                }}
              />
              <datalist id="rotation-steps">
                {ROTATION_STEPS.map(step => (
                  <option key={step} value={step} />
                ))}
              </datalist>
              <NumberInput
                value={options.maxRotation}
                onChange={(value) => {
                  handleChange('rotationEnabled', value !== 0);
                  handleChange('maxRotation', value);
                }}
                unit="°"
              />
            </SliderContainer>
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
      </ExcludedWordsSection>
    </Container>
  );
};

export default ControlPanel; 