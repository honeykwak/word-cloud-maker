import { Language } from '../types';

// 기본 불용어 목록
const stopWords = {
  ko: ['그리고', '하지만', '그런데', '그래서', '또한', '및', '혹은', '또는'],
  en: ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i'],
  fr: ['le', 'la', 'les', 'de', 'et', 'un', 'une', 'du', 'des', 'à']
};

// 언어별 단어 분리 정규식 수정
const wordSplitPatterns = {
  ko: /[\s,.!?]+/u,  // 간단한 구분자로 수정
  en: /[\s,.!?]+/u,
  fr: /[\s,.!?]+/u
};

// 언어별 유효 단어 체크 정규식 수정
const validWordPatterns = {
  ko: /^[가-힣]+$/,  // 한글 범위 수정
  en: /^[a-zA-Z]+$/,
  fr: /^[a-zA-ZÀ-ÿ]+$/
};

export const processText = (
  text: string, 
  language: Language,
  minWordLength: number,
  excludedWords: string[]
): { text: string; value: number }[] => {
  console.log('Processing text:', { text, language, minWordLength, excludedWords });

  // 텍스트를 소문자로 변환 (한글 제외)
  const processedText = language === 'ko' ? text : text.toLowerCase();
  
  // 단어 분리
  const words = processedText
    .split(/[\s,.!?]+/) // 공백과 구두점으로 분리
    .filter(word => word.length >= minWordLength)
    .filter(word => validWordPatterns[language].test(word))
    .filter(word => !stopWords[language].includes(word))
    .filter(word => !excludedWords.includes(word.toLowerCase()))
    .filter(word => word.trim().length > 0); // 빈 문자열 제거

  console.log('Filtered words:', words);

  // 단어 빈도 계산
  const wordCount: { [key: string]: number } = {};
  words.forEach(word => {
    const normalizedWord = language === 'ko' ? word : word.toLowerCase();
    wordCount[normalizedWord] = (wordCount[normalizedWord] || 0) + 1;
  });

  // 결과 변환 및 정렬
  const result = Object.entries(wordCount)
    .map(([text, value]) => ({ 
      text, 
      value,
    }))
    .sort((a, b) => b.value - a.value);

  console.log('Word frequencies:', wordCount);
  console.log('Final result:', result);

  return result;
}; 