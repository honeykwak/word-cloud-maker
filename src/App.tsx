import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './Home';
import WordCloud from './WordCloud';
import TextArc from './TextArc';
import { VisualizationProvider } from './context/VisualizationContext';

const App: React.FC = () => {
  return (
    <VisualizationProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/wordcloud" element={<WordCloud />} />
        <Route path="/textarc" element={<TextArc />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </VisualizationProvider>
  );
};

export default App;