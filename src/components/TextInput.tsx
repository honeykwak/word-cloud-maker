import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import styled from 'styled-components';
import { useVisualization } from '../context/VisualizationContext';

interface TextInputProps {
  onTextChange: (text: string) => void;
  isGenerating: boolean;
}

const Container = styled.div`
  height: 100%;
  display: flex;
`;

const InputContainer = styled.div`
  flex: 4;
  display: flex;
  flex-direction: column;
`;

const TextAreaContainer = styled.div`
  flex: 1;
`;

const RightContainer = styled.div<{ $hasButtons: boolean }>`
  flex: 1;
  margin-left: 15px;
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: ${props => props.$hasButtons ? '4px' : '0'};
`;

const TextArea = styled.textarea`
  width: 100%;
  height: 100%;
  padding: 15px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 16px;
  resize: none;
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

const DropZone = styled.div<{ $hasButtons: boolean }>`
  flex: ${props => props.$hasButtons ? 'none' : '1'};
  border: 2px dashed #e2e8f0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  padding: 10px;
  box-sizing: border-box;
  
  &:hover {
    border-color: #2196F3;
    background-color: rgba(33, 150, 243, 0.05);
  }
  
  p {
    color: #2c3e50;
    margin: 0;
    font-size: 0.9rem;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 4px;
  margin-top: 8px;
  flex-direction: column;
`;

const Button = styled.button`
  padding: 4px 12px;
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
  font-weight: 500;
  font-family: inherit;
  white-space: nowrap;
  width: 100%;
  text-align: center;
  letter-spacing: -0.3px;
  
  &:hover {
    background-color: #1976D2;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  &.cancel {
    background-color: #f1f5f9;
    color: #475569;

    &:hover {
      background-color: #e2e8f0;
    }
  }
`;

const StatsContainer = styled.div`
  color: #64748b;
  font-size: 0.875rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 16px;
  padding: 8px 0;
  height: 48px;
`;

const StatItem = styled.span`
  white-space: nowrap;
  display: flex;
  align-items: center;
  
  strong {
    color: #475569;
    margin: 0 4px;
  }
`;

// 천 단위 구분 쉼표 추가 함수
const formatNumber = (num: number) => {
  return num.toLocaleString('ko-KR');
};

const TextInput: React.FC<TextInputProps> = ({ 
  onTextChange, 
  isGenerating
}) => {
  // 전역 상태에서 텍스트 가져오기
  const { text: globalText } = useVisualization();
  
  // 로컬 상태는 전역 상태에서 초기화
  const [currentText, setCurrentText] = useState(globalText);
  const [fileContent, setFileContent] = useState('');
  const [showMergeButtons, setShowMergeButtons] = useState(false);
  const [stats, setStats] = useState({
    withSpaces: 0,
    withoutSpaces: 0,
    totalWords: 0,
    uniqueWords: 0,
    byteSize: 0,
    byteNoSpaces: 0
  });

  // 전역 상태가 변경되면 로컬 상태 업데이트
  useEffect(() => {
    setCurrentText(globalText);
  }, [globalText]);

  // 로컬 텍스트 변경 시 전역 상태로 동기화
  const handleTextChange = (newText: string) => {
    setCurrentText(newText);
    onTextChange(newText);
    calculateStats(newText);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();
    
    reader.onload = () => {
      const text = reader.result as string;
      setFileContent(text);
      setShowMergeButtons(true);
    };
    
    reader.readAsText(file);
  }, []);

  const handleMerge = (mode: 'replace' | 'append' | 'prepend') => {
    let newText = '';
    switch (mode) {
      case 'replace':
        newText = fileContent;
        break;
      case 'append':
        newText = currentText + '\n' + fileContent;
        break;
      case 'prepend':
        newText = fileContent + '\n' + currentText;
        break;
    }
    setCurrentText(newText);
    onTextChange(newText);
    setShowMergeButtons(false);
    setFileContent('');
    
    console.log('Text after merge:', newText);
  };

  const { getRootProps, getInputProps } = useDropzone({ 
    onDrop,
    accept: {
      'text/plain': ['.txt']
    },
    multiple: false
  });

  const calculateStats = (text: string) => {
    const withSpaces = text.length;
    const withoutSpaces = text.replace(/\s+/g, '').length;
    const byteSize = new Blob([text]).size;
    const byteNoSpaces = new Blob([text.replace(/\s+/g, '')]).size;
    const words = text.trim().split(/\s+/);
    const totalWords = words.length > 0 && text.trim() !== '' ? words.length : 0;
    const uniqueWords = new Set(words.map(w => w.toLowerCase())).size;

    setStats({
      withSpaces,
      withoutSpaces,
      byteSize,
      byteNoSpaces,
      totalWords,
      uniqueWords
    });
  };

  // 컴포넌트가 마운트되거나 외부에서 text prop이 변경될 때 통계 재계산
  useEffect(() => {
    if (globalText) {
      setCurrentText(globalText);
      calculateStats(globalText);
    }
  }, [globalText]);

  return (
    <Container>
      <InputContainer>
        <TextAreaContainer>
          <TextArea
            value={currentText}
            placeholder="텍스트를 입력하거나 파일을 드래그 앤 드롭하세요"
            onChange={(e) => handleTextChange(e.target.value)}
          />
        </TextAreaContainer>
        {currentText && <StatsContainer>
          <StatItem>
            공백 포함 <strong>{formatNumber(stats.withSpaces)}</strong>자 {formatNumber(stats.byteSize)}byte
          </StatItem>
          <StatItem>
            총 단어 수 <strong>{formatNumber(stats.totalWords)}</strong>
          </StatItem>
          <StatItem>
            공백 제외 <strong>{formatNumber(stats.withoutSpaces)}</strong>자 {formatNumber(stats.byteNoSpaces)}byte
          </StatItem>
          <StatItem>
            고유 단어 수 <strong>{formatNumber(stats.uniqueWords)}</strong>
          </StatItem>
        </StatsContainer>}
      </InputContainer>
      <RightContainer $hasButtons={showMergeButtons}>
        <DropZone {...getRootProps()} $hasButtons={showMergeButtons}>
          <input {...getInputProps()} />
          <p>텍스트 파일을 드래그하거나 클릭하여 업로드하세요</p>
        </DropZone>
        {showMergeButtons && (
          <ButtonGroup>
            <Button onClick={() => handleMerge('replace')}>
              파일 내용으로 대체
            </Button>
            <Button onClick={() => handleMerge('append')}>
              파일 내용을 뒤에 추가
            </Button>
            <Button onClick={() => handleMerge('prepend')}>
              파일 내용을 앞에 추가
            </Button>
            <Button 
              className="cancel"
              onClick={() => {
                setShowMergeButtons(false);
                setFileContent('');
              }}
            >
              취소
            </Button>
          </ButtonGroup>
        )}
      </RightContainer>
    </Container>
  );
};

export default TextInput; 