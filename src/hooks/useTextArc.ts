import { useState } from 'react';
import { useVisualization } from '../context/VisualizationContext';

export const useTextArc = () => {
  const { 
    text, setText, 
    processedWords, 
    excludedWords, setExcludedWords,
    isGenerating, 
    processingStatus, 
    processText 
  } = useVisualization();
  
  const [renderKey, setRenderKey] = useState(0);
  const [maxSelectedWords, setMaxSelectedWords] = useState<number>(1);
  const [selectedColors, setSelectedColors] = useState<string[]>([
    // 색상 배열
  ]);
  
  const handleColorChange = (index: number, color: string) => {
    const newColors = [...selectedColors];
    newColors[index] = color;
    setSelectedColors(newColors);
  };
  
  const handleGenerate = () => {
    setRenderKey(prev => prev + 1);
    processText();
  };
  
  return {
    text,
    setText,
    processedWords,
    excludedWords,
    setExcludedWords,
    isGenerating,
    processingStatus,
    renderKey,
    maxSelectedWords,
    setMaxSelectedWords,
    selectedColors,
    handleColorChange,
    handleGenerate
  };
}; 