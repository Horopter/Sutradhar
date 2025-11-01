# Lesson 4: Introduction to Neural Networks

## Overview

Neural networks are computing systems inspired by biological neural networks that constitute animal brains. They form the foundation of deep learning and have revolutionized fields like image recognition, natural language processing, and speech recognition. This lesson introduces the basic concepts of neural networks, including neurons, layers, activation functions, forward propagation, and backpropagation.

## Biological Inspiration

Neural networks are inspired by how biological neurons work:
- **Dendrites**: Receive input signals
- **Cell Body**: Processes information
- **Axon**: Transmits output signals
- **Synapses**: Connections between neurons with weights

## Artificial Neuron (Perceptron)

### Mathematical Model

A single neuron receives inputs, applies weights, sums them, adds a bias, and passes through an activation function:

\[ y = f(\sum_{i=1}^{n} w_i x_i + b) \]

Where:
- \( x_i \) are input values
- \( w_i \) are weights
- \( b \) is bias
- \( f \) is activation function
- \( y \) is output

### Python Implementation

```python
import numpy as np
import matplotlib.pyplot as plt

class Neuron:
    def __init__(self, num_inputs, activation='sigmoid'):
        # Initialize weights randomly
        self.weights = np.random.randn(num_inputs)
        self.bias = np.random.randn()
        self.activation = activation
    
    def sigmoid(self, x):
        return 1 / (1 + np.exp(-np.clip(x, -500, 500)))
    
    def relu(self, x):
        return np.maximum(0, x)
    
    def tanh(self, x):
        return np.tanh(x)
    
    def activate(self, x):
        if self.activation == 'sigmoid':
            return self.sigmoid(x)
        elif self.activation == 'relu':
            return self.relu(x)
        elif self.activation == 'tanh':
            return self.tanh(x)
        else:
            return x  # Linear activation
    
    def forward(self, inputs):
        # Weighted sum
        z = np.dot(inputs, self.weights) + self.bias
        # Activation function
        return self.activate(z)

# Example
neuron = Neuron(num_inputs=3, activation='sigmoid')
inputs = np.array([0.5, 0.3, 0.8])
output = neuron.forward(inputs)
print(f"Neuron output: {output}")
```

## Neural Network Architecture

A neural network consists of multiple layers:
- **Input Layer**: Receives input data
- **Hidden Layers**: Process information
- **Output Layer**: Produces final predictions

### Feedforward Neural Network

```python
import numpy as np

class NeuralNetwork:
    def __init__(self, input_size, hidden_sizes, output_size, activation='sigmoid'):
        self.activation = activation
        self.layers = []
        
        # Create layers
        sizes = [input_size] + hidden_sizes + [output_size]
        for i in range(len(sizes) - 1):
            layer = {
                'weights': np.random.randn(sizes[i], sizes[i+1]) * 0.1,
                'bias': np.zeros((1, sizes[i+1]))
            }
            self.layers.append(layer)
    
    def sigmoid(self, x):
        return 1 / (1 + np.exp(-np.clip(x, -500, 500)))
    
    def sigmoid_derivative(self, x):
        s = self.sigmoid(x)
        return s * (1 - s)
    
    def relu(self, x):
        return np.maximum(0, x)
    
    def relu_derivative(self, x):
        return (x > 0).astype(float)
    
    def activate(self, x):
        if self.activation == 'sigmoid':
            return self.sigmoid(x)
        elif self.activation == 'relu':
            return self.relu(x)
        else:
            return x
    
    def activate_derivative(self, x):
        if self.activation == 'sigmoid':
            return self.sigmoid_derivative(x)
        elif self.activation == 'relu':
            return self.relu_derivative(x)
        else:
            return np.ones_like(x)
    
    def forward(self, X):
        """Forward propagation through the network."""
        activations = [X]
        
        for layer in self.layers:
            # Linear transformation: z = XW + b
            z = np.dot(activations[-1], layer['weights']) + layer['bias']
            # Activation function: a = f(z)
            a = self.activate(z)
            activations.append(a)
        
        return activations
    
    def predict(self, X):
        """Make predictions."""
        activations = self.forward(X)
        return activations[-1]
    
    def mean_squared_error(self, y_true, y_pred):
        """Calculate MSE loss."""
        return np.mean((y_true - y_pred) ** 2)
    
    def train(self, X, y, epochs=1000, learning_rate=0.01):
        """Train the network using backpropagation."""
        m = X.shape[0]  # Number of samples
        
        for epoch in range(epochs):
            # Forward propagation
            activations = self.forward(X)
            predictions = activations[-1]
            
            # Calculate loss
            loss = self.mean_squared_error(y, predictions)
            
            if epoch % 100 == 0:
                print(f"Epoch {epoch}, Loss: {loss:.4f}")
            
            # Backward propagation
            # Calculate output layer error
            error = predictions - y
            delta = error
            
            # Backpropagate through layers
            for i in range(len(self.layers) - 1, -1, -1):
                # Gradient of weights
                dw = (1/m) * np.dot(activations[i].T, delta)
                # Gradient of bias
                db = (1/m) * np.sum(delta, axis=0, keepdims=True)
                
                # Update weights and bias
                self.layers[i]['weights'] -= learning_rate * dw
                self.layers[i]['bias'] -= learning_rate * db
                
                # Calculate error for previous layer
                if i > 0:
                    delta = np.dot(delta, self.layers[i]['weights'].T)
                    delta *= self.activate_derivative(activations[i])

# Example: Learning XOR function
X = np.array([[0, 0], [0, 1], [1, 0], [1, 1]])
y = np.array([[0], [1], [1], [0]])

# Create network: 2 inputs, 1 hidden layer with 4 neurons, 1 output
nn = NeuralNetwork(input_size=2, hidden_sizes=[4], output_size=1, activation='sigmoid')

# Train
nn.train(X, y, epochs=5000, learning_rate=0.5)

# Test
predictions = nn.predict(X)
print("\nPredictions:")
for i in range(len(X)):
    print(f"Input: {X[i]}, Expected: {y[i][0]}, Predicted: {predictions[i][0]:.4f}")
```

## Activation Functions

Activation functions introduce non-linearity, enabling neural networks to learn complex patterns.

### Common Activation Functions

**Sigmoid:**
\[ f(x) = \frac{1}{1 + e^{-x}} \]
Range: (0, 1)
Use: Output layer for binary classification

**ReLU (Rectified Linear Unit):**
\[ f(x) = \max(0, x) \]
Range: [0, ∞)
Use: Hidden layers (most common)

**Tanh:**
\[ f(x) = \tanh(x) = \frac{e^x - e^{-x}}{e^x + e^{-x}} \]
Range: (-1, 1)
Use: Hidden layers

**Softmax:**
\[ f(x_i) = \frac{e^{x_i}}{\sum_{j=1}^{n} e^{x_j}} \]
Use: Output layer for multi-class classification

```python
import numpy as np
import matplotlib.pyplot as plt

def sigmoid(x):
    return 1 / (1 + np.exp(-np.clip(x, -10, 10)))

def relu(x):
    return np.maximum(0, x)

def tanh(x):
    return np.tanh(x)

def softmax(x):
    exp_x = np.exp(x - np.max(x, axis=-1, keepdims=True))
    return exp_x / np.sum(exp_x, axis=-1, keepdims=True)

# Plot activation functions
x = np.linspace(-5, 5, 100)
plt.figure(figsize=(12, 8))

plt.subplot(2, 2, 1)
plt.plot(x, sigmoid(x))
plt.title('Sigmoid')
plt.grid(True)

plt.subplot(2, 2, 2)
plt.plot(x, relu(x))
plt.title('ReLU')
plt.grid(True)

plt.subplot(2, 2, 3)
plt.plot(x, tanh(x))
plt.title('Tanh')
plt.grid(True)

plt.subplot(2, 2, 4)
x_soft = np.array([1, 2, 3])
plt.bar(range(len(x_soft)), softmax(x_soft))
plt.title('Softmax')
plt.xticks(range(len(x_soft)), ['Class 1', 'Class 2', 'Class 3'])

plt.tight_layout()
plt.show()
```

## Backpropagation Algorithm

Backpropagation is the learning algorithm that adjusts weights to minimize error.

### Mathematical Foundation

**Forward Pass:**
\[ z^{[l]} = W^{[l]} a^{[l-1]} + b^{[l]} \]
\[ a^{[l]} = f(z^{[l]}) \]

**Loss Function (MSE):**
\[ L = \frac{1}{2m} \sum_{i=1}^{m} (y_i - \hat{y}_i)^2 \]

**Backward Pass:**
\[ \frac{\partial L}{\partial W^{[l]}} = \frac{1}{m} (a^{[l-1]})^T \delta^{[l]} \]
\[ \frac{\partial L}{\partial b^{[l]}} = \frac{1}{m} \sum \delta^{[l]} \]

Where:
\[ \delta^{[l]} = (W^{[l+1]})^T \delta^{[l+1]} \odot f'(z^{[l]}) \]

For output layer:
\[ \delta^{[L]} = \hat{y} - y \]

## Simple Neural Network for Classification

```python
import numpy as np
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

class SimpleNeuralNetwork:
    def __init__(self, input_size, hidden_size, output_size):
        # Initialize weights with small random values
        self.W1 = np.random.randn(input_size, hidden_size) * 0.1
        self.b1 = np.zeros((1, hidden_size))
        self.W2 = np.random.randn(hidden_size, output_size) * 0.1
        self.b2 = np.zeros((1, output_size))
    
    def sigmoid(self, x):
        return 1 / (1 + np.exp(-np.clip(x, -500, 500)))
    
    def sigmoid_derivative(self, x):
        s = self.sigmoid(x)
        return s * (1 - s)
    
    def forward(self, X):
        # Hidden layer
        z1 = np.dot(X, self.W1) + self.b1
        a1 = self.sigmoid(z1)
        
        # Output layer
        z2 = np.dot(a1, self.W2) + self.b2
        a2 = self.sigmoid(z2)
        
        return a1, a2
    
    def predict(self, X):
        _, output = self.forward(X)
        return (output > 0.5).astype(int)
    
    def train(self, X, y, epochs=1000, learning_rate=0.01):
        m = X.shape[0]
        
        for epoch in range(epochs):
            # Forward propagation
            a1, a2 = self.forward(X)
            
            # Backward propagation
            dz2 = a2 - y
            dW2 = (1/m) * np.dot(a1.T, dz2)
            db2 = (1/m) * np.sum(dz2, axis=0, keepdims=True)
            
            da1 = np.dot(dz2, self.W2.T)
            dz1 = da1 * self.sigmoid_derivative(a1)
            dW1 = (1/m) * np.dot(X.T, dz1)
            db1 = (1/m) * np.sum(dz1, axis=0, keepdims=True)
            
            # Update weights
            self.W1 -= learning_rate * dW1
            self.b1 -= learning_rate * db1
            self.W2 -= learning_rate * dW2
            self.b2 -= learning_rate * db2
            
            if epoch % 100 == 0:
                loss = np.mean((a2 - y) ** 2)
                print(f"Epoch {epoch}, Loss: {loss:.4f}")

# Generate data
X, y = make_classification(n_samples=1000, n_features=2, n_redundant=0,
                          n_informative=2, n_clusters_per_class=1,
                          random_state=42)
y = y.reshape(-1, 1)

# Split and scale
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)

# Train network
nn = SimpleNeuralNetwork(input_size=2, hidden_size=4, output_size=1)
nn.train(X_train, y_train, epochs=1000, learning_rate=0.1)

# Evaluate
predictions = nn.predict(X_test)
accuracy = np.mean(predictions == y_test)
print(f"\nTest Accuracy: {accuracy:.4f}")
```

## Summary

Neural networks are powerful learning systems:

1. **Neurons**: Basic computing units with weights and activation
2. **Layers**: Organized neurons in input, hidden, and output layers
3. **Activation Functions**: Introduce non-linearity
4. **Forward Propagation**: Compute outputs from inputs
5. **Backpropagation**: Learn by adjusting weights to minimize error

Key concepts:
- Neural networks learn from data through weight adjustment
- Activation functions enable learning non-linear patterns
- Backpropagation efficiently computes gradients
- Deep networks can learn complex representations
- Proper initialization and learning rates are crucial

Understanding neural networks provides the foundation for exploring deep learning and advanced architectures like convolutional and recurrent neural networks.

