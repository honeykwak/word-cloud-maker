export interface Word {
  text: string;
  value: number;
}

export interface SentenceData {
  text: string;
  index: number;
  angle: number;
}

export interface WordPosition {
  x: number;
  y: number;
  angle: number;
  magnitude?: number;
}

export interface SelectedWord {
  wordIndex: number;
  colorIndex: number;
}

export interface VisualizationResult {
  wordPositions: Map<number, WordPosition>;
  opacityScale?: d3.ScaleLinear<number, number>;
} 