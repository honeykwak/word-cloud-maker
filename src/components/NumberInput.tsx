import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

const Input = styled.input`
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 6px 10px;
  font-size: 0.9rem;
  width: 100%;
  
  &:focus {
    outline: none;
    border-color: #2196F3;
    box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
  }
`;

const NumberDisplay = styled.div<{ $isEditing: boolean }>`
  border: 1px solid transparent;
  border-radius: 4px;
  padding: 6px 10px;
  font-size: 0.9rem;
  cursor: pointer;
  background: #f8fafc;
  min-width: 60px;
  text-align: center;
  
  &:hover {
    background: #f1f5f9;
  }
`;

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  unit?: string;
}

function NumberInput({ value, onChange, unit = '' }: NumberInputProps) {
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
}

export default NumberInput; 