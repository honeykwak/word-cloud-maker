// @ts-ignore
const ctx: Worker = self as any;

// 한국어 명사 사전 데이터
let koreanDictionary: Set<string> = new Set();

// 초성으로 사전 데이터 로드 최적화를 위한 맵
let dictionaryMap: Map<string, string[]> = new Map();

// IndexedDB 설정
const DB_NAME = 'koreanDictionaryDB';
const STORE_NAME = 'dictionary';
const DB_VERSION = 1;

// IndexedDB 열기
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      reject('IndexedDB 열기 실패');
    };
    
    request.onsuccess = (event) => {
      resolve(request.result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'initial' });
      }
    };
  });
}

// 사전 데이터 저장
async function saveDictionaryToIndexedDB(data: Record<string, string[]>): Promise<void> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    // 데이터를 초성별로 저장
    for (const [initial, words] of Object.entries(data)) {
      store.put({ initial, words });
    }
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        console.log('사전 데이터 IndexedDB에 저장 완료');
        resolve();
      };
      
      tx.onerror = () => {
        reject('사전 데이터 저장 실패');
      };
    });
  } catch (error) {
    console.error('IndexedDB 저장 오류:', error);
    throw error;
  }
}

// 사전 로드 함수에 타임아웃 추가
async function loadDictionaryFromNetwork(timeout = 5000): Promise<Record<string, string[]> | null> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch('/dictionary/korean-words.json', {
      signal: controller.signal
    });
    clearTimeout(id);
    
    if (!response.ok) {
      throw new Error(`네트워크 응답 오류: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('사전 네트워크 로드 실패:', error);
    return null;
  }
}

// IndexedDB에서 사전 데이터 로드
async function loadDictionaryFromIndexedDB(): Promise<Record<string, string[]> | null> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const allData = await getAllFromStore(store);
    
    if (allData.length === 0) {
      return null;
    }
    
    // 결과를 객체로 변환
    const result: Record<string, string[]> = {};
    allData.forEach(item => {
      result[item.initial] = item.words;
    });
    
    console.log('IndexedDB에서 사전 데이터 로드 완료');
    return result;
  } catch (error) {
    console.error('IndexedDB 로드 오류:', error);
    return null;
  }
}

// objectStore에서 모든 데이터 가져오기
function getAllFromStore(store: IDBObjectStore): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onerror = () => {
      reject('데이터 가져오기 실패');
    };
  });
}

// 사전 초기화 함수
async function initializeDictionary() {
  try {
    // 1. IndexedDB에서 먼저 로드 시도
    const cachedData = await loadDictionaryFromIndexedDB();
    
    if (cachedData) {
      // 캐시된 데이터가 있으면 사용
      loadDictionaryData(cachedData);
      return;
    }
    
    // 2. 캐시된 데이터가 없으면 네트워크에서 로드
    const response = await loadDictionaryFromNetwork();
    
    if (response) {
      // 네트워크에서 로드한 데이터 캐싱
      await saveDictionaryToIndexedDB(response);
      
      // 데이터 사용
      loadDictionaryData(response);
    } else {
      // 기본 사전 초기화 (필요한 경우)
      useBackupDictionary();
    }
    
  } catch (error) {
    console.error('사전 데이터 로드 실패:', error);
    // 기본 사전 초기화 (필요한 경우)
    useBackupDictionary();
  }
}

// 사전 데이터 로딩
function loadDictionaryData(data: Record<string, string[]>) {
  // 데이터 구조화
  for (const [initial, words] of Object.entries(data)) {
    dictionaryMap.set(initial, words as string[]);
    (words as string[]).forEach(word => koreanDictionary.add(word));
  }
  
  console.log(`사전 데이터 로드 완료: ${koreanDictionary.size}개 단어`);
}

// 수정된 백업 사전 함수
function useBackupDictionary() {
  console.log('백업 사전 데이터 사용');
  // 최소한의 고빈도 한국어 명사 + 존칭 관련 단어 포함
  const basicWords = {
    '가': ['가족', '가능', '가격', '가치', '가정'],
    '나': ['나라', '나이', '나무', '나침반'],
    '다': ['다양', '다음', '다리', '다른'],
    '사': ['사람', '사랑', '사용', '사진', '사회', '사장', '사장님'],
    '선': ['선생', '선생님', '선택', '선물'],
    '교': ['교수', '교수님', '교육', '교사'],
    '부': ['부장', '부장님', '부분', '부모'],
    // 더 많은 단어 추가...
  };
  
  loadDictionaryData(basicWords);
}

// 한국어 조사/어미 패턴 (폴백으로 사용)
const KOREAN_PATTERNS = {
  particles: /(이|가|을|를|의|에|로|와|과|나|이나|든지|도|는|께|서|에서|부터|까지|마저|조차|대로|보다|처럼|만큼)$/,
  honorificSuffixes: /(님|씨|군|양)$/,
  verbEndings: /(하다|되다|있다|없다|한다|된다|왔다|갔다|같다|이다|있었다|되었다|하고|되고|하며|되며|하면|되면)$/
};

interface KoreanAnalyzerOptions {
  honorifics: boolean;
  allowCompounds: boolean;
  [key: string]: any; // 추가 옵션을 위한 인덱스 시그니처
}

class KoreanAnalyzer {
  private options: KoreanAnalyzerOptions;
  
  constructor(options: Partial<KoreanAnalyzerOptions> = {}) {
    this.options = {
      honorifics: true,
      allowCompounds: true,
      ...options
    };
  }

  analyze(text: string) {
    console.log('Analyzing with options:', this.options);
    
    // 단어 위치 및 빈도수 추적 맵
    const wordPositions = new Map();
    
    // 텍스트를 탐색하며 사전에 있는 가장 긴 명사 찾기
    let position = 0;
    
    while (position < text.length) {
      let remainingText = text.substring(position);
      
      // 1. 복합어 허용 시 복합어 먼저 확인
      let foundCompound = false;
      let compoundWord = '';
      
      if (this.options.allowCompounds) {
        // 가능한 두 단어 복합어 확인 (첫번째 단어 찾기)
        let firstMatch = this.findLongestDictionaryMatch(remainingText);
        
        if (firstMatch && firstMatch.length >= 2) {
          const afterFirstMatch = remainingText.substring(firstMatch.length);
          // 두번째 단어 찾기
          const secondMatch = this.findLongestDictionaryMatch(afterFirstMatch);
          
          if (secondMatch && secondMatch.length >= 2) {
            // 복합어 형성 시도
            compoundWord = firstMatch + secondMatch;
            
            // 복합어를 사전에서 먼저 확인 (실제 존재하는 복합어인지)
            const isCompoundInDictionary = dictionaryMap.get(compoundWord.charAt(0))?.includes(compoundWord);
            
            if (isCompoundInDictionary) {
              // 복합어가 사전에 있으면 복합어로 처리
              foundCompound = true;
              
              // 복합어 위치 기록
              if (!wordPositions.has(compoundWord)) {
                wordPositions.set(compoundWord, []);
              }
              wordPositions.get(compoundWord).push(position);
              
              // 복합어 길이만큼 이동
              position += compoundWord.length;
            }
          }
        }
      }
      
      // 2. 복합어를 찾지 못했거나 복합어 허용이 꺼져있으면 개별 단어 처리
      if (!foundCompound) {
        let longestMatch = this.findLongestDictionaryMatch(remainingText);
        
        if (longestMatch && longestMatch.length >= 2) {
          // 단어 위치 기록
          if (!wordPositions.has(longestMatch)) {
            wordPositions.set(longestMatch, []);
          }
          wordPositions.get(longestMatch).push(position);
          
          // 단어 길이만큼 이동
          position += longestMatch.length;
        } else {
          // 매칭되는 명사 없음, 다음 문자로 이동
          position++;
        }
      }
    }
    
    // 단어별 빈도수 결과 생성
    const results = [];
    for (const [word, positions] of wordPositions.entries()) {
      // 중복 없는 위치 목록으로 변환
      const uniquePositions = [...new Set(positions.map(p => p.toString()))];
      
      results.push({
        text: word,
        type: 'noun',
        frequency: uniquePositions.length, // 실제 빈도수
        score: 1.0
      });
    }
    
    return results;
  }
  
  // 사전에서 가장 긴 매칭 명사 찾기
  private findLongestDictionaryMatch(text: string): string | null {
    let longestMatch = null;
    let maxLength = 0;
    
    // 입력 텍스트의 시작부터 가능한 모든 하위 문자열 확인
    for (let endPos = 1; endPos <= Math.min(text.length, 10); endPos++) {
      const subString = text.substring(0, endPos);
      
      // 공백 또는 특수문자가 나타나면 검사 중단
      if (/[\s,.!?:;\-()[\]{}'"]+/.test(subString)) {
        break;
      }
      
      // 사전에 있는지 확인
      if (koreanDictionary.has(subString) && subString.length > maxLength) {
        maxLength = subString.length;
        longestMatch = subString;
      }
    }
    
    return longestMatch;
  }
}

// morphemeAnalyzer의 코드를 직접 포함
const patterns = {
  ko: [
    /(이|가|을|를|의|에|로|와|과|나|이나|든지)$/,  // 조사
    /(다|요|까|네|죠|군요|습니다|입니다)$/,        // 어미
    /(하다|되다|시키다|당하다|스럽다)$/            // 접미사
  ],
  fr: [/* 프랑스어 패턴 */]
};

// 한국어 형태소 분석을 위한 패턴 확장
const koPatterns = {
  // 조사
  josa: /(이|가|을|를|의|에|로|와|과|나|이나|든지|도|는|께|서|에서|부터|까지|마저|조차|대로|보다|처럼|만큼)$/,
  
  // 어미
  eomi: /(다|요|까|네|죠|군요|습니다|입니다|았|었|겠|시|는|은|게|고|며|자|라|니|면|거든|구나|구만|데|지)$/,
  
  // 접미사
  suffix: /(하다|되다|시키다|당하다|스럽다|적|화|성|님|씨|용|상|력|률|간|값|감|권|량|별|분|수|심|액|율|점|도|층|군|형|질|류|법|론|계|증|장|주의)$/,
  
  // 접두사
  prefix: /^(초|재|복|신|구|왕|특|직|공|미|범|총|촉|약|준|시|강|최|고|저|피|제|반|범|매|중|일|해|내|외|상|하|후)/
};

async function analyzeKoreanMorphemes(text: string): Promise<string[]> {
  const words = text.split(/\s+/);
  const result: string[] = [];
  
  for (const word of words) {
    let processed = word;
    let prevProcessed;
    
    // 단어가 더 이상 변하지 않을 때까지 반복 처리
    do {
      prevProcessed = processed;
      
      // 접미사 제거
      koPatterns.suffix.lastIndex = 0;
      processed = processed.replace(koPatterns.suffix, '');
      
      // 조사 제거
      koPatterns.josa.lastIndex = 0;
      processed = processed.replace(koPatterns.josa, '');
      
      // 어미 제거
      koPatterns.eomi.lastIndex = 0;
      processed = processed.replace(koPatterns.eomi, '');
      
    } while (processed !== prevProcessed && processed.length > 1);
    
    // 최소 길이(2글자) 이상이고 한글로만 구성된 경우 결과에 추가
    if (processed.length >= 2 && /^[가-힣]+$/.test(processed)) {
      result.push(processed);
    }
  }
  
  return result;
}

async function analyzeMorphemes(text: string, language: string, options?: AnalyzerOptions): Promise<string[]> {
  try {
    switch (language) {
      case 'ko': {
        const analyzer = new KoreanAnalyzer(options);
        const results = analyzer.analyze(text);
        // 분석 결과에서 텍스트만 추출
        return results
          .filter(result => result.type === 'noun' || result.type === 'unknown')
          .map(result => result.text);
      }

      case 'en':
        return text.toLowerCase()
          .split(/[\s,.!?;:""''()\[\]{}|\/\\]+/)
          .map(word => word.trim())
          .filter(word => word.length >= 2 && /^[a-z]+$/i.test(word));

      case 'fr':
        // 프랑스어 처리 로직 유지
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
  ko: /[^가-힣]+/,
  en: /[^a-zA-Z]+/,
  fr: /[^a-zA-ZÀ-ÿ]+/
};

// 언어별 유효성 검사 패턴
const validWordPatterns = {
  ko: /^[가-힣]+$/,
  en: /^[a-zA-Z]+$/,
  fr: /^[a-zA-ZÀ-ÿ]+$/
};

// 기본 불용어 목록 확장
const stopWords = {
  ko: ['그리고', '하지만', '그런데', '그래서', '또한', '및', '혹은', '또는'],
  en: ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i'],
  fr: ['le', 'la', 'les', 'de', 'et', 'un', 'une', 'du', 'des', 'à']
};

function createErrorResponse(error: unknown): { type: 'error', error: string } {
  if (error instanceof Error) {
    return { type: 'error', error: error.message };
  } else if (typeof error === 'string') {
    return { type: 'error', error };
  } else {
    return { type: 'error', error: '알 수 없는 오류가 발생했습니다.' };
  }
}

function prepareWordCloudResult(words: Word[], stats: any) {
  return { 
    type: 'success', 
    words,
    stats
  };
}

async function processText(
  text: string,
  language: string,
  minWordLength: number,
  excludedWords: string[],
  maxWords: number
): Promise<Word[]> {
  ctx.postMessage({ type: 'progress', status: '텍스트 분석 시작...' });

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

    ctx.postMessage({ 
      type: 'progress', 
      status: `총 ${Object.keys(wordFreq).length}개 단어 분석됨` 
    });

    // 실제 표시 가능한 최대 단어 수 계산
    const effectiveMaxWords = Math.min(maxWords, Object.keys(wordFreq).length);

    ctx.postMessage({ 
      type: 'progress', 
      status: `단어 빈도수 계산 완료. ${Object.keys(wordFreq).length}개의 고유 단어 발견` 
    });

    // 결과 배열 생성 및 정렬
    const result = Object.entries(wordFreq)
      .map(([text, value]) => ({ text, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, effectiveMaxWords);  // 조정된 최대값 사용

    ctx.postMessage({ 
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

ctx.onmessage = async ({ data }) => {
  const { 
    text, 
    language, 
    minWordLength, 
    excludedWords = [], 
    maxWords = 100,
    analyzerOptions = {} 
  } = data;
  
  console.log("받은 analyzerOptions:", analyzerOptions);
  
  // honorifics 값이 명시적으로 false인 경우만 확인
  const fixedAnalyzerOptions = {
    honorifics: analyzerOptions.honorifics === false ? false : true,
    allowCompounds: analyzerOptions.allowCompounds === false ? false : true
  };
  
  try {
    // 사전 초기화 (첫 호출 시에만)
    if (!koreanDictionary.size) {
      await initializeDictionary();
    }
    
    ctx.postMessage({ type: 'progress', status: '텍스트 분석 중...' });

    let morphemes: string[] = [];
    
    if (language === 'ko') {
      console.log("분석기에 전달할 옵션:", fixedAnalyzerOptions);
      const analyzer = new KoreanAnalyzer(fixedAnalyzerOptions);
      const analysisResults = analyzer.analyze(text);
      
      // 결과에서 빈도수 정보 활용 - 분석기에서 계산된 frequency 사용
      const wordCount: { [key: string]: number } = {};
      
      analysisResults.forEach(result => {
        if (!result.text) return;
        if (/적$/.test(result.text)) return; // '적'으로 끝나는 형용사 제외
        if (result.text.length < minWordLength) return; // 최소 길이 필터링
        if (result.text.includes(' ')) return; // 공백 포함 제외
        
        // 각 단어는 이미 올바른 빈도수를 가지고 있음
        wordCount[result.text] = result.frequency || 1;
      });
      
      // 단어-빈도수 쌍 배열 생성
      const wordFreqPairs = Object.entries(wordCount)
        .map(([text, value]) => ({ text, value }))
        .filter(({ text }) => text.trim().length > 0 && !excludedWords.includes(text))
        .sort((a, b) => b.value - a.value)
        .slice(0, maxWords);
      
      // 결과 설정
      const words = wordFreqPairs;
      
      // 디버깅
      console.log('Analyzer options:', fixedAnalyzerOptions);
      console.log('Analysis results sample:', analysisResults.slice(0, 10));
      console.log('Final word count:', words.slice(0, 10));
      
      // 결과 전송
      ctx.postMessage(prepareWordCloudResult(words, {
        totalWords: analysisResults.length,
        uniqueWords: words.length,
        effectiveMaxWords: Math.min(words.length, maxWords)
      }));
      
      return; // 여기서 처리 종료
    } else {
      // 다른 언어 처리 로직
      morphemes = text.split(/[\s,.!?]+/);
    }

    console.log('Analyzed morphemes:', morphemes.slice(0, 10));

    // 불용어 및 최소 길이 필터링
    const filteredWords = morphemes
      .filter(word => word && word.length >= minWordLength)
      .filter(word => !excludedWords.includes(word.toLowerCase()));

    console.log('Filtered words:', filteredWords.slice(0, 10));

    // 단어 빈도 계산
    const wordCount: { [key: string]: number } = {};
    filteredWords.forEach(word => {
      if (!word) return;
      const normalizedWord = language === 'ko' ? word : word.toLowerCase();
      wordCount[normalizedWord] = (wordCount[normalizedWord] || 0) + 1;
    });

    // 결과 변환 및 정렬
    const words = Object.entries(wordCount)
      .map(([text, value]) => ({ text, value }))
      .filter(({ text }) => text.trim().length > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, maxWords);

    // 결과 전송
    ctx.postMessage(prepareWordCloudResult(words, {
      totalWords: filteredWords.length,
      uniqueWords: words.length,
      effectiveMaxWords: Math.min(words.length, maxWords)
    }));

  } catch (error) {
    console.error('Processing failed:', error);
    const errorMessage = error instanceof Error 
      ? `처리 중 오류 발생: ${error.message}`
      : '알 수 없는 오류가 발생했습니다.';
    
    ctx.postMessage(createErrorResponse(errorMessage));
  }
}; 