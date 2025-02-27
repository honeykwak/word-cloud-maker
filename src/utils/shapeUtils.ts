export type ShapeFunction = (theta: number) => number;

export const createShapeFromPNG = async (file: File): Promise<ShapeFunction> => {
  return new Promise((resolve, reject) => {
    // 파일 타입 검증
    if (!file.type.startsWith('image/png')) {
      reject(new Error('PNG 파일만 업로드 가능합니다.'));
      return;
    }

    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    img.onload = () => {
      // 이미지 크기 제한 (예: 1000x1000)
      const maxSize = 1000;
      let width = img.width;
      let height = img.height;
      
      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      const imageData = ctx.getImageData(0, 0, width, height);
      const pixels = imageData.data;

      // 이미지의 중심점 계산
      const centerX = width / 2;
      const centerY = height / 2;
      
      // 최대 반지름 계산
      const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);

      const shape = (theta: number) => {
        // theta를 0-360도 범위로 정규화
        const angle = ((theta + Math.PI) % (2 * Math.PI)) * (180 / Math.PI);
        
        // theta를 반전시켜 이미지 방향 보정 (-theta 사용)
        const correctedTheta = -theta;
        
        // 32개의 방사방향 샘플링 포인트
        let maxDist = 0;
        const samples = 32;
        
        for (let r = 0; r <= maxRadius; r += maxRadius / samples) {
          const x = centerX + r * Math.cos(correctedTheta);
          const y = centerY + r * Math.sin(correctedTheta);
          
          if (x < 0 || x >= width || y < 0 || y >= height) continue;
          
          const i = (Math.floor(y) * width + Math.floor(x)) * 4;
          if (pixels[i + 3] > 128) {
            maxDist = Math.max(maxDist, r / maxRadius);
          }
        }
        
        return maxDist;
      };

      resolve(shape);
    };

    img.onerror = () => reject(new Error('이미지 로드에 실패했습니다.'));
    img.src = URL.createObjectURL(file);
  });
}; 