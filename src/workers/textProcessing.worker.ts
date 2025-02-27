// morphemeAnalyzer의 코드를 직접 포함
const patterns = {
  ko: [
    /(이|가|을|를|의|에|로|와|과|나|이나|든지)$/,  // 조사
    /(다|요|까|네|죠|군요|습니다|입니다)$/,        // 어미
    /(하다|되다|시키다|당하다|스럽다)$/            // 접미사
  ],
  ja: [/* 일본어 패턴 */],
  zh: [/* 중국어 패턴 */],
  fr: [/* 프랑스어 패턴 */]
};

async function analyzeMorphemes(text: string, language: string): Promise<string[]> {
  try {
    switch (language) {
      case 'en':
        return text.toLowerCase()
          .split(/[\s,.!?;:""''()\[\]{}|\/\\]+/)
          .map(word => word.trim())
          .filter(word => word.length >= 2 && /^[a-z]+$/i.test(word));

      case 'fr':
        return text.toLowerCase()
          .split(/[\s,.!?;:«»""''()\[\]{}|\/\\]+/)
          .map(word => {
            let processed = word;
            patterns.fr.forEach(pattern => {
              processed = processed.replace(pattern, '');
            });
            return processed;
          })
          .filter(word => 
            word.length >= 2 && 
            /^[a-zàâäéèêëîïôöùûüÿçæœ]+$/i.test(word)
          );

      case 'ko':
      case 'ja':
      case 'zh':
        const words = text.split(/\s+/);
        const result: string[] = [];

        const isValid = {
          ko: (w: string) => /^[가-힣]+$/.test(w),
          ja: (w: string) => /^[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]+$/.test(w),
          zh: (w: string) => /^[\u4e00-\u9fff]+$/.test(w)
        };

        words.forEach(word => {
          let processed = word;
          if (patterns[language]) {
            patterns[language].forEach(pattern => {
              processed = processed.replace(pattern, '');
            });
          }

          if (processed.length >= 2 && isValid[language](processed)) {
            result.push(processed);
          }
        });

        return result;

      default:
        return text.split(/\s+/);
    }
  } catch (error) {
    console.error('Morpheme analysis failed:', error);
    return text.split(/\s+/);
  }
}

interface Word {
  text: string;
  value: number;
}

// 언어별 단어 분리 패턴 정의
const wordSplitPatterns = {
  ko: /[^가-힣]+/,  // 한글만 추출
  en: /[^a-zA-Z]+/,  // 영문만 추출
  fr: /[^a-zA-ZÀ-ÿ]+/,  // 프랑스어 문자만 추출
  ja: /[^\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]+/,  // 히라가나, 가타카나, 한자
  zh: /[^\u4e00-\u9fff]+/  // 한자
};

// 언어별 유효성 검사 패턴
const validWordPatterns = {
  ko: /^[가-힣]+$/,
  en: /^[a-zA-Z]+$/,
  fr: /^[a-zA-ZÀ-ÿ]+$/,
  ja: /^[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]+$/,
  zh: /^[\u4e00-\u9fff]+$/
};

// 기본 불용어 목록 확장
const stopWords = {
  ko: ['그리고', '하지만', '그런데', '그래서', '또한', '및', '혹은', '또는'],
  en: ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i'],
  fr: ['le', 'la', 'les', 'de', 'et', 'un', 'une', 'du', 'des', 'à'],
  ja: ['の', 'に', '는', 'を', 'た', 'が', 'で', 'て', 'と', 'し', 'れ', 'さ', 'ある', 'いる', 'も', 'な', 'です', 'から'],
  zh: ['的', '了', '和', '是', '就', '都', '而', '及', '與', '這', '他', '你', '我', '會', '到', '說', '要', '可以']
};

async function processText(
  text: string,
  language: string,
  minWordLength: number,
  excludedWords: string[],
  maxWords: number
): Promise<Word[]> {
  self.postMessage({ type: 'progress', status: '텍스트 분석 시작...' });

  try {
    // 형태소 분석 수행
    const morphemes = await analyzeMorphemes(text, language);
    
    // 단어 빈도수 계산
    const wordFreq: { [key: string]: number } = {};
    morphemes.forEach(word => {
      if (word.length >= minWordLength && !excludedWords.includes(word.toLowerCase())) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });

    self.postMessage({ 
      type: 'progress', 
      status: `총 ${Object.keys(wordFreq).length}개 단어 분석됨` 
    });

    // 실제 표시 가능한 최대 단어 수 계산
    const effectiveMaxWords = Math.min(maxWords, Object.keys(wordFreq).length);

    self.postMessage({ 
      type: 'progress', 
      status: `단어 빈도수 계산 완료. ${Object.keys(wordFreq).length}개의 고유 단어 발견` 
    });

    // 결과 배열 생성 및 정렬
    const result = Object.entries(wordFreq)
      .map(([text, value]) => ({ text, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, effectiveMaxWords);  // 조정된 최대값 사용

    self.postMessage({ 
      type: 'progress', 
      status: `워드 클라우드 생성을 위해 상위 ${result.length}개 단어 선택됨` 
    });

    console.log('Processing complete:', {
      totalTextLength: text.length,
      totalWords: Object.keys(wordFreq).length,
      uniqueWords: Object.keys(wordFreq).length,
      selectedWords: result.length,
      topWords: result.slice(0, 5)  // 상위 5개 단어 확인
    });

    // 결과 반환 시 실제 사용된 maxWords 값도 함께 전달
    return result;
  } catch (error) {
    console.error('Text processing failed:', error);
    throw error;
  }
}

self.onmessage = async (e: MessageEvent) => {
  const { text, language, minWordLength, excludedWords, maxWords } = e.data;
  
  try {
    console.log('Worker received:', {
      textLength: text.length,
      language,
      minWordLength,
      excludedWordsCount: excludedWords.length,
      maxWords
    });

    const words = await processText(text, language, minWordLength, excludedWords, maxWords);
    
    if (words.length === 0) {
      self.postMessage({ 
        type: 'error',
        error: '처리된 단어가 없습니다.'
      });
      return;
    }

    self.postMessage({ 
      type: 'success', 
      words,
      stats: {
        totalWords: words.reduce((sum, w) => sum + w.value, 0),
        uniqueWords: words.length,
        effectiveMaxWords: words.length
      }
    });
  } catch (error) {
    console.error('Worker error:', error);
    self.postMessage({ 
      type: 'error', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}; 