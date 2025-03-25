import { renderHook, act } from '@testing-library/react-hooks';
import { useZoomAndPan } from '../useZoomAndPan';

describe('useZoomAndPan', () => {
  it('should initialize with default values', () => {
    const containerRef = { current: document.createElement('div') };
    const svgContainerRef = { current: document.createElement('div') };
    
    const { result } = renderHook(() => 
      useZoomAndPan(containerRef, svgContainerRef)
    );
    
    expect(result.current.zoom).toBe(1);
    expect(result.current.translateX).toBe(0);
    expect(result.current.translateY).toBe(0);
    expect(result.current.isDragging).toBe(false);
  });
  
  // 더 많은 테스트 케이스...
}); 