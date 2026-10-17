// src/context/PredictionContext.jsx
// Global state shared between pages and the 3D city
import { createContext, useContext, useState } from 'react';

const PredictionContext = createContext(null);

export function PredictionProvider({ children }) {
  const [prediction, setPrediction] = useState(null);
  const [modelStatus, setModelStatus] = useState(null); // from /api/health

  return (
    <PredictionContext.Provider value={{ prediction, setPrediction, modelStatus, setModelStatus }}>
      {children}
    </PredictionContext.Provider>
  );
}

export function usePrediction() {
  return useContext(PredictionContext);
}
