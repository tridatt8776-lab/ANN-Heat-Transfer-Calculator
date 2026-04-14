/**
 * Simple Multi-Layer Perceptron implementation for Heat Transfer Prediction
 */

export type ANNWeights = {
  w1: number[][]; // Input to Hidden
  b1: number[];   // Hidden Bias
  w2: number[][]; // Hidden to Output
  b2: number[];   // Output Bias
};

export class HeatTransferANN {
  private weights: ANNWeights;
  private inputMin: number[];
  private inputMax: number[];
  private outputMin: number;
  private outputMax: number;

  constructor(weights?: ANNWeights) {
    // Default weights (randomized or pre-trained)
    this.weights = weights || this.initializeWeights(8, 12, 1);
    
    // Normalization parameters (approximate based on dataset)
    this.inputMin = [600, 300, 0.018, 45, 0.025, 17, 0.013, 60];
    this.inputMax = [800, 500, 0.025, 55, 0.035, 22, 0.018, 70];
    this.outputMin = 40000;
    this.outputMax = 250000;
  }

  private initializeWeights(inputs: number, hidden: number, outputs: number): ANNWeights {
    const rand = () => Math.random() * 2 - 1;
    return {
      w1: Array.from({ length: hidden }, () => Array.from({ length: inputs }, rand)),
      b1: Array.from({ length: hidden }, rand),
      w2: Array.from({ length: outputs }, () => Array.from({ length: hidden }, rand)),
      b2: Array.from({ length: outputs }, rand),
    };
  }

  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x));
  }

  private normalize(input: number[]): number[] {
    return input.map((val, i) => (val - this.inputMin[i]) / (this.inputMax[i] - this.inputMin[i]));
  }

  private denormalizeOutput(val: number): number {
    return val * (this.outputMax - this.outputMin) + this.outputMin;
  }

  public predict(input: number[]): number {
    if (!input || input.length !== 8) {
      throw new Error("Invalid input: ANN requires exactly 8 input parameters.");
    }
    if (input.some(val => isNaN(val))) {
      throw new Error("Invalid input: Parameters must be numeric.");
    }

    const normalizedInput = this.normalize(input);
    
    // Hidden layer
    const hidden = this.weights.w1.map((row, i) => {
      const sum = row.reduce((acc, val, j) => acc + val * normalizedInput[j], 0) + this.weights.b1[i];
      return this.sigmoid(sum);
    });

    // Output layer
    const output = this.weights.w2.map((row, i) => {
      const sum = row.reduce((acc, val, j) => acc + val * hidden[j], 0) + this.weights.b2[i];
      return this.sigmoid(sum);
    });

    return this.denormalizeOutput(output[0]);
  }

  // Simple training logic (Stochastic Gradient Descent)
  public train(data: { input: number[], output: number }[], epochs: number = 100, lr: number = 0.1) {
    if (!data || data.length === 0) {
      throw new Error("Training failed: No data provided.");
    }
    if (epochs <= 0) {
      throw new Error("Training failed: Epochs must be greater than zero.");
    }

    for (let e = 0; e < epochs; e++) {
      for (const item of data) {
        const x = this.normalize(item.input);
        const target = (item.output - this.outputMin) / (this.outputMax - this.outputMin);

        // Forward pass
        const hiddenSums = this.weights.w1.map((row, i) => 
          row.reduce((acc, val, j) => acc + val * x[j], 0) + this.weights.b1[i]
        );
        const hiddenOutputs = hiddenSums.map(this.sigmoid);

        const outputSum = this.weights.w2[0].reduce((acc, val, j) => acc + val * hiddenOutputs[j], 0) + this.weights.b2[0];
        const output = this.sigmoid(outputSum);

        // Backward pass
        const outputError = target - output;
        const outputDelta = outputError * output * (1 - output);

        const hiddenErrors = this.weights.w1.map((_, i) => this.weights.w2[0][i] * outputDelta);
        const hiddenDeltas = hiddenErrors.map((err, i) => err * hiddenOutputs[i] * (1 - hiddenOutputs[i]));

        // Update weights
        this.weights.w2[0] = this.weights.w2[0].map((w, i) => w + lr * outputDelta * hiddenOutputs[i]);
        this.weights.b2[0] += lr * outputDelta;

        this.weights.w1 = this.weights.w1.map((row, i) => 
          row.map((w, j) => w + lr * hiddenDeltas[i] * x[j])
        );
        this.weights.b1 = this.weights.b1.map((b, i) => b + lr * hiddenDeltas[i]);
      }
    }
  }

  public getWeights() {
    return this.weights;
  }
}
