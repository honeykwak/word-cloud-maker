declare module 'wordcloud' {
  interface WordCloudOptions {
    list: [string, number][];
    gridSize?: number;
    weightFactor?: (size: number) => number;
    fontFamily?: string;
    color?: (word: string, weight: number, fontSize: number) => string;
    rotateRatio?: number;
    rotationSteps?: number;
    shape?: string | ((theta: number) => number);
    shrinkToFit?: boolean;
    drawOutOfBound?: boolean;
    backgroundColor?: string;
    minSize?: number;
    clearCanvas?: boolean;
    ellipticity?: number;
    wait?: number;
    classes?: string | ((word: string) => string);
    complete?: (items: Array<{
      text: string;
      size: number;
      x: number;
      y: number;
      rotate: number;
      color: string;
    }>) => void;
    ratio?: number;
    origin?: [number, number];
    maxRotation?: number;
    minRotation?: number;
    progress?: (progress: number, currentWord: string) => void;
  }

  function WordCloud(
    canvas: HTMLCanvasElement,
    options: WordCloudOptions
  ): void;

  export default WordCloud;
} 