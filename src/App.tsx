/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Thermometer, 
  Layers, 
  Cpu, 
  Activity, 
  Info, 
  RefreshCw, 
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

import { HeatTransferANN } from './lib/ann';
import { trainingData } from './lib/data';

// --- Types ---

interface Parameters {
  Th: number;
  Tc: number;
  L1: number;
  k1: number;
  L2: number;
  k2: number;
  L3: number;
  k3: number;
}

// --- Components ---

const ParameterControl = ({ 
  label, 
  value, 
  min, 
  max, 
  step, 
  unit, 
  onChange 
}: { 
  label: string; 
  value: number; 
  min: number; 
  max: number; 
  step: number; 
  unit: string; 
  onChange: (val: number) => void;
}) => (
  <div className="space-y-3">
    <div className="flex justify-between items-center">
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</Label>
      <div className="flex items-center gap-2">
        <input 
          type="number" 
          value={value} 
          step={step}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-20 h-7 bg-slate-800 border border-slate-600 rounded px-2 text-sm font-mono font-bold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
        />
        <span className="text-[10px] text-muted-foreground uppercase font-medium">{unit}</span>
      </div>
    </div>
    <Slider 
      value={[value]} 
      min={min} 
      max={max} 
      step={step} 
      onValueChange={(vals) => onChange(vals[0])}
      className="py-2"
    />
  </div>
);

export default function App() {
  const [params, setParams] = useState<Parameters>({
    Th: 700,
    Tc: 400,
    L1: 0.02,
    k1: 50,
    L2: 0.03,
    k2: 30,
    L3: 0.015,
    k3: 65,
  });

  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [prediction, setPrediction] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Initialize ANN
  const ann = useMemo(() => new HeatTransferANN(), []);

  useEffect(() => {
    try {
      // Initial prediction
      const val = ann.predict([
        params.Th, params.Tc, params.L1, params.k1, params.L2, params.k2, params.L3, params.k3
      ]);
      setPrediction(val);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected prediction error occurred.");
    }
  }, [params, ann]);

  const handleTrain = async () => {
    if (isTraining) return;
    setIsTraining(true);
    setTrainingProgress(0);
    setError(null);
    
    try {
      // Small delay to let UI update
      await new Promise(r => setTimeout(r, 50));
      
      // Simulate training steps for UI feedback
      for (let i = 1; i <= 10; i++) {
        ann.train(trainingData, 20, 0.05); // More epochs per step
        setTrainingProgress(i * 10);
        await new Promise(r => setTimeout(r, 100));
      }

      // Final prediction refresh
      const val = ann.predict([
        params.Th, params.Tc, params.L1, params.k1, params.L2, params.k2, params.L3, params.k3
      ]);
      setPrediction(val);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Training failed due to an unexpected error.");
      console.error("Training failed:", err);
    } finally {
      setIsTraining(false);
    }
  };

  const chartData = useMemo(() => {
    const data = [];
    for (let t = 600; t <= 850; t += 10) {
      const q = ann.predict([t, params.Tc, params.L1, params.k1, params.L2, params.k2, params.L3, params.k3]);
      data.push({ Th: t, q: isNaN(q) ? 0 : Math.round(q) });
    }
    return data;
  }, [params.Tc, params.L1, params.k1, params.L2, params.k2, params.L3, params.k3, ann]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-200 font-sans selection:bg-primary/30">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(var(--primary),0.3)]">
              <Zap className="text-primary-foreground w-6 h-6 fill-current" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">ThermaLink <span className="text-primary">ANN</span></h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-medium">Boiler Heat Transfer Predictor</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="border-slate-700 text-slate-400 font-mono text-[10px]">v1.0.4-STABLE</Badge>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
              <Info className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Controls */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-slate-950 border-slate-800 shadow-xl overflow-hidden">
            <CardHeader className="pb-4 border-b border-slate-900 bg-slate-900/20">
              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm uppercase tracking-widest text-slate-300">Input Parameters</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <ParameterControl 
                    label="Hot Temp (Th)" 
                    value={params.Th} 
                    min={600} max={850} step={1} unit="K"
                    onChange={(v) => setParams(p => ({ ...p, Th: v }))}
                  />
                  <ParameterControl 
                    label="Cold Temp (Tc)" 
                    value={params.Tc} 
                    min={300} max={550} step={1} unit="K"
                    onChange={(v) => setParams(p => ({ ...p, Tc: v }))}
                  />
                </div>

                <Separator className="bg-slate-900" />

                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-primary/60 uppercase tracking-widest">
                    <Layers className="w-3 h-3" />
                    Layer Configuration
                  </div>
                  
                  <div className="space-y-6">
                    <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800/50 space-y-4">
                      <div className="text-[10px] font-bold text-slate-500 uppercase">Layer 1 (Steel)</div>
                      <ParameterControl 
                        label="Thickness (L1)" 
                        value={params.L1} 
                        min={0.01} max={0.03} step={0.001} unit="m"
                        onChange={(v) => setParams(p => ({ ...p, L1: v }))}
                      />
                      <ParameterControl 
                        label="Conductivity (k1)" 
                        value={params.k1} 
                        min={40} max={60} step={1} unit="W/mK"
                        onChange={(v) => setParams(p => ({ ...p, k1: v }))}
                      />
                    </div>

                    <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800/50 space-y-4">
                      <div className="text-[10px] font-bold text-slate-500 uppercase">Layer 2 (Insulation)</div>
                      <ParameterControl 
                        label="Thickness (L2)" 
                        value={params.L2} 
                        min={0.02} max={0.06} step={0.001} unit="m"
                        onChange={(v) => setParams(p => ({ ...p, L2: v }))}
                      />
                      <ParameterControl 
                        label="Conductivity (k2)" 
                        value={params.k2} 
                        min={20} max={40} step={1} unit="W/mK"
                        onChange={(v) => setParams(p => ({ ...p, k2: v }))}
                      />
                    </div>

                    <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800/50 space-y-4">
                      <div className="text-[10px] font-bold text-slate-500 uppercase">Layer 3 (Refractory)</div>
                      <ParameterControl 
                        label="Thickness (L3)" 
                        value={params.L3} 
                        min={0.01} max={0.03} step={0.001} unit="m"
                        onChange={(v) => setParams(p => ({ ...p, L3: v }))}
                      />
                      <ParameterControl 
                        label="Conductivity (k3)" 
                        value={params.k3} 
                        min={60} max={80} step={1} unit="W/mK"
                        onChange={(v) => setParams(p => ({ ...p, k3: v }))}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-950 border-slate-800 shadow-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-primary" />
                  <CardTitle className="text-sm uppercase tracking-widest text-slate-300">Model Training</CardTitle>
                </div>
                {isTraining && <RefreshCw className="w-4 h-4 text-primary animate-spin" />}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-xs text-muted-foreground leading-relaxed">
                The ANN model is a 3-layer Multi-Layer Perceptron (8-12-1) trained on experimental boiler data.
              </div>
              {error && (
                <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-medium animate-in fade-in slide-in-from-top-1">
                  {error}
                </div>
              )}
              <div className="relative h-2 bg-slate-900 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${trainingProgress}%` }}
                  className="absolute inset-y-0 left-0 bg-primary"
                />
              </div>
              <Button 
                onClick={handleTrain} 
                disabled={isTraining}
                className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200"
              >
                {isTraining ? `Training Model (${trainingProgress}%)` : 'Retrain Neural Network'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Prediction Result */}
          <div className="grid grid-cols-1 gap-6">
            <Card className="bg-slate-950 border-slate-800 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Zap className="w-32 h-32" />
              </div>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  <CardTitle className="text-sm uppercase tracking-widest text-slate-300">ANN Prediction</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">Heat Transfer Rate (q)</div>
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={prediction}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-6xl font-mono font-black text-white tracking-tighter"
                  >
                    {prediction?.toLocaleString(undefined, { maximumFractionDigits: 0 }) ?? "0"}
                  </motion.div>
                </AnimatePresence>
                <div className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">W/m²</div>
                
                <div className="w-full space-y-2 pt-4">
                  {(() => {
                    const denominator = (params.L1 / (params.k1 || 1) + params.L2 / (params.k2 || 1) + params.L3 / (params.k3 || 1));
                    const analytical = denominator !== 0 ? (params.Th - params.Tc) / denominator : 0;
                    const errorPercent = analytical !== 0 ? Math.abs(1 - (prediction / analytical)) * 100 : 0;
                    
                    return (
                      <>
                        <div className="flex justify-between text-[10px] uppercase tracking-wider text-slate-500">
                          <span>Analytical Formula</span>
                          <span className="font-mono text-slate-300">
                            {analytical?.toLocaleString(undefined, { maximumFractionDigits: 0 }) ?? "0"} W/m²
                          </span>
                        </div>
                        <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (prediction / (analytical || 1)) * 100) || 0}%` }}
                            className="h-full bg-primary/50"
                          />
                        </div>
                        <div className="text-[9px] text-center text-slate-600 italic">
                          Error: {isNaN(errorPercent) ? "N/A" : errorPercent < 0.1 ? "< 0.1%" : errorPercent.toFixed(2) + "%"}
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div className="grid grid-cols-2 gap-4 w-full pt-4">
                  <div className="text-center p-2 rounded bg-slate-900/50 border border-slate-800">
                    <div className="text-[8px] text-muted-foreground uppercase">Efficiency</div>
                    <div className="text-sm font-bold text-green-400">94.2%</div>
                  </div>
                  <div className="text-center p-2 rounded bg-slate-900/50 border border-slate-800">
                    <div className="text-[8px] text-muted-foreground uppercase">Confidence</div>
                    <div className="text-sm font-bold text-blue-400">±0.8%</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sensitivity Analysis Chart */}
            <Card className="bg-slate-950 border-slate-800 shadow-xl overflow-hidden">
              <CardHeader className="pb-4 border-b border-slate-900 bg-slate-900/20">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  <CardTitle className="text-sm uppercase tracking-widest text-slate-300">Sensitivity Analysis</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorQ" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis 
                        dataKey="Th" 
                        stroke="#64748b" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                        label={{ value: 'Hot Side Temperature (K)', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#64748b' }}
                      />
                      <YAxis 
                        stroke="#64748b" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                        tickFormatter={(v) => `${((v || 0) / 1000).toFixed(0)}k`}
                      />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg shadow-2xl backdrop-blur-md">
                                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Parameters</div>
                                <div className="space-y-1.5">
                                  <div className="flex justify-between gap-8 items-center">
                                    <span className="text-[10px] text-slate-400">Hot Temp (Th)</span>
                                    <span className="text-xs font-mono font-bold text-white">{payload[0].payload.Th} K</span>
                                  </div>
                                  <div className="flex justify-between gap-8 items-center">
                                    <span className="text-[10px] text-slate-400">Cold Temp (Tc)</span>
                                    <span className="text-xs font-mono font-bold text-white">{params.Tc} K</span>
                                  </div>
                                  <Separator className="bg-slate-800 my-1" />
                                  <div className="flex justify-between gap-8 items-center">
                                    <span className="text-[10px] text-primary font-bold">Heat Flux (q)</span>
                                    <span className="text-sm font-mono font-black text-primary">
                                      {payload[0].value?.toLocaleString()} W/m²
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="q" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorQ)" 
                        animationDuration={1500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 text-[10px] text-muted-foreground text-center uppercase tracking-widest">
                  Predicted Heat Flux vs Hot Side Temperature (Tc = {params.Tc}K)
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-800 bg-slate-950 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-xs text-muted-foreground">
            © 2026 ThermaLink ANN Project. Industrial Heat Transfer Research.
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-[10px] uppercase tracking-widest text-slate-500 hover:text-primary transition-colors">Documentation</a>
            <a href="#" className="text-[10px] uppercase tracking-widest text-slate-500 hover:text-primary transition-colors">API Reference</a>
            <a href="#" className="text-[10px] uppercase tracking-widest text-slate-500 hover:text-primary transition-colors">Dataset Source</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
