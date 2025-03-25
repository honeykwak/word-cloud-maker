/**
 * 원형 평균 계산 함수
 * 각도들의 평균 방향을 계산합니다.
 */
export const calculateCircularMean = (angles: number[]): number => {
  if (angles.length === 0) return 0;
  
  // 각 각도를 x, y 좌표로 변환
  let sumX = 0;
  let sumY = 0;
  
  angles.forEach(angle => {
    sumX += Math.cos(angle);
    sumY += Math.sin(angle);
  });
  
  // 벡터의 크기가 매우 작으면 (서로 상쇄된 경우)
  const magnitude = Math.sqrt(sumX * sumX + sumY * sumY);
  
  // 벡터가 거의 상쇄되면 (크기가 매우 작으면), 중심점(0도)를 반환
  if (magnitude < 0.0001) {
    console.log(`정반대 방향의 벡터 감지됨: ${angles.map(a => (a * 180 / Math.PI).toFixed(2))}도`);
    return 0; // 중심점으로 설정
  }
  
  // 평균 벡터의 각도 계산
  return Math.atan2(sumY, sumX);
};

/**
 * 단어 위치 계산 함수
 * 단어가 출현하는 문장들의 위치에 따라 단어의 위치 좌표를 계산합니다.
 */
export const calculateWordPosition = (
  wordOccurrenceAngles: number[], 
  radius: number
): { x: number; y: number; magnitude: number } => {
  // 벡터의 합 계산
  let sumX = 0;
  let sumY = 0;
  
  wordOccurrenceAngles.forEach(angle => {
    sumX += Math.cos(angle);
    sumY += Math.sin(angle);
  });
  
  // 벡터 크기 계산
  const magnitude = Math.sqrt(sumX * sumX + sumY * sumY);
  
  // 각도 계산
  const avgAngle = Math.atan2(sumY, sumX);
  
  // 정규화된 크기
  const normalizedMagnitude = Math.min(magnitude / wordOccurrenceAngles.length, 1);
  const distance = radius * 0.95 * normalizedMagnitude;
  
  let x, y;
  
  // 벡터 크기가 매우 작으면 (정반대 방향의 문장들) 중앙에 배치
  if (magnitude < 0.0001) {
    x = 0;
    y = 0;
  } else {
    x = distance * Math.cos(avgAngle);
    y = distance * Math.sin(avgAngle);
  }
  
  return { x, y, magnitude };
}; 