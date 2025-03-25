import * as d3 from 'd3';

/**
 * 문장 내 단어 강조 함수
 */
export function highlightWordInSentences(wordToHighlight: string, color: string) {
  const wordLower = wordToHighlight.toLowerCase();
  
  // 모든 문장 요소 순회
  d3.selectAll('.sentence').each(function() {
    const sentenceEl = d3.select(this);
    const sentenceData = sentenceEl.datum() as any;
    if (!sentenceData) return;
    
    const sentenceText = sentenceData.text.toLowerCase();
    
    // 문장 내 단어 위치 찾기
    if (sentenceText.includes(wordLower)) {
      // 기존 문장 텍스트 제거하고 SVG 텍스트 스팬으로 교체
      sentenceEl.text('');
      
      const displayText = sentenceData.text.length > 30 
        ? sentenceData.text.substring(0, 30) + '...' 
        : sentenceData.text;
        
      // 단어 위치에 따라 텍스트 분할 및 강조
      let lastIndex = 0;
      const wordRegex = new RegExp(`\\b${wordLower}\\b`, 'gi');
      let match;
      
      while ((match = wordRegex.exec(displayText)) !== null) {
        // 단어 앞 텍스트
        if (match.index > lastIndex) {
          sentenceEl.append('tspan')
            .text(displayText.substring(lastIndex, match.index))
            .attr('fill', '#94a3b8');
        }
        
        // 강조할 단어
        sentenceEl.append('tspan')
          .text(displayText.substring(match.index, match.index + match[0].length))
          .attr('fill', color)
          .attr('font-weight', 'bold');
          
        lastIndex = match.index + match[0].length;
      }
      
      // 마지막 단어 이후 텍스트
      if (lastIndex < displayText.length) {
        sentenceEl.append('tspan')
          .text(displayText.substring(lastIndex))
          .attr('fill', '#94a3b8');
      }
    }
  });
}

/**
 * 모든 문장 하이라이트 초기화
 */
export function resetSentenceHighlights() {
  d3.selectAll('.sentence').each(function() {
    const sentenceEl = d3.select(this);
    const sentenceData = sentenceEl.datum() as any;
    if (!sentenceData) return;
    
    // 문장 텍스트 복원
    sentenceEl.text(sentenceData.text.length > 30 
      ? sentenceData.text.substring(0, 30) + '...' 
      : sentenceData.text)
      .attr('fill', '#94a3b8')
      .attr('font-weight', 'normal');
  });
} 