// Helper to generate physics-based training data for the ANN
const generateData = (count: number) => {
  const data = [];
  for (let i = 0; i < count; i++) {
    const Th = 600 + Math.random() * 250;
    const Tc = 300 + Math.random() * 250;
    const L1 = 0.01 + Math.random() * 0.02;
    const k1 = 40 + Math.random() * 20;
    const L2 = 0.02 + Math.random() * 0.04;
    const k2 = 20 + Math.random() * 20;
    const L3 = 0.01 + Math.random() * 0.02;
    const k3 = 60 + Math.random() * 20;

    // Analytical formula: q = (Th - Tc) / (L1/k1 + L2/k2 + L3/k3)
    const q = (Th - Tc) / (L1 / k1 + L2 / k2 + L3 / k3);
    
    data.push({
      input: [
        parseFloat(Th.toFixed(1)),
        parseFloat(Tc.toFixed(1)),
        parseFloat(L1.toFixed(4)),
        parseFloat(k1.toFixed(1)),
        parseFloat(L2.toFixed(4)),
        parseFloat(k2.toFixed(1)),
        parseFloat(L3.toFixed(4)),
        parseFloat(k3.toFixed(1))
      ],
      output: parseFloat(q.toFixed(2))
    });
  }
  return data;
};

export const trainingData = [
  // Original PDF Data
  { input: [673, 401, 0.021, 45, 0.034, 22, 0.014, 65], output: 122109.7 },
  { input: [692, 467, 0.023, 53, 0.028, 18, 0.015, 66], output: 101498.1 },
  { input: [650, 426, 0.021, 55, 0.026, 18, 0.013, 64], output: 110378.1 },
  { input: [699, 304, 0.025, 51, 0.034, 19, 0.016, 64], output: 156146.9 },
  { input: [683, 442, 0.024, 53, 0.029, 19, 0.014, 68], output: 110296.1 },
  { input: [664, 367, 0.019, 51, 0.028, 20, 0.017, 65], output: 146011.4 },
  { input: [748, 311, 0.021, 51, 0.027, 19, 0.015, 62], output: 210627.5 },
  { input: [737, 481, 0.02, 46, 0.033, 22, 0.017, 65], output: 116558.6 },
  { input: [656, 454, 0.021, 46, 0.028, 22, 0.017, 67], output: 101866.9 },
  { input: [648, 404, 0.019, 46, 0.027, 17, 0.016, 66], output: 108748.8 },
  // ... adding 500 generated points
  ...generateData(500)
];
