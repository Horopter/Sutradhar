# Lesson 1: Introduction to Machine Learning

## Overview

Machine Learning (ML) is a subset of artificial intelligence that enables computers to learn from data without being explicitly programmed. Instead of writing specific instructions for every scenario, ML algorithms build mathematical models based on training data to make predictions or decisions. This revolutionary approach has transformed industries from healthcare and finance to transportation and entertainment.

## What is Machine Learning?

Machine Learning is the study of algorithms and statistical models that computer systems use to perform tasks without explicit instructions. The key idea is that systems can improve their performance on a specific task through experience (data).

### Traditional Programming vs Machine Learning

**Traditional Programming:**
- Input: Data + Rules/Program
- Output: Answers

**Machine Learning:**
- Input: Data + Answers
- Output: Rules/Program (Model)

## Types of Machine Learning

### 1. Supervised Learning

Supervised learning uses labeled training data to learn a mapping from inputs to outputs. The algorithm learns from example input-output pairs.

**Key Characteristics:**
- Training data includes both inputs and desired outputs
- Goal: Learn a function that maps inputs to outputs
- Examples: Classification, Regression

**Mathematical Formulation:**

Given a dataset \( D = \{(x_1, y_1), (x_2, y_2), \ldots, (x_n, y_n)\} \), where:
- \( x_i \) represents input features
- \( y_i \) represents the target output

The goal is to find a function \( f \) such that:
\[ f: X \rightarrow Y \]
\[ f(x) \approx y \]

### 2. Unsupervised Learning

Unsupervised learning finds patterns in data without labeled examples.

**Key Characteristics:**
- Training data has no labels
- Goal: Discover hidden patterns or structure
- Examples: Clustering, Dimensionality Reduction

**Mathematical Formulation:**

Given unlabeled data \( D = \{x_1, x_2, \ldots, x_n\} \), find:
- Patterns or groups: \( \{C_1, C_2, \ldots, C_k\} \)
- Lower-dimensional representation: \( z_i = g(x_i) \)

### 3. Reinforcement Learning

Reinforcement learning involves an agent learning to make decisions by interacting with an environment and receiving rewards or penalties.

**Key Components:**
- Agent: The learner/decision maker
- Environment: The world the agent interacts with
- Actions: What the agent can do
- Rewards: Feedback signal
- Policy: Strategy for choosing actions

## The Machine Learning Pipeline

### 1. Data Collection

Gathering relevant data for the problem at hand. Data quality directly impacts model performance.

### 2. Data Preprocessing

Cleaning and preparing data for training:
- Handling missing values
- Normalization/Standardization
- Feature encoding
- Data splitting (train/validation/test)

### 3. Feature Engineering

Creating informative features from raw data. Good features are crucial for model performance.

### 4. Model Selection

Choosing appropriate algorithms based on:
- Problem type (classification, regression, clustering)
- Data characteristics (size, dimensionality, distribution)
- Performance requirements

### 5. Model Training

Using training data to learn model parameters that minimize a loss function.

### 6. Model Evaluation

Assessing model performance on unseen data using appropriate metrics.

### 7. Model Deployment

Integrating the trained model into production systems.

## Mathematical Foundations

### Linear Algebra

Machine learning relies heavily on linear algebra:

**Vectors:** Represent data points or features
\[ \mathbf{x} = \begin{bmatrix} x_1 \\ x_2 \\ \vdots \\ x_n \end{bmatrix} \]

**Matrices:** Represent datasets or transformations
\[ \mathbf{X} = \begin{bmatrix} x_{11} & x_{12} & \ldots & x_{1d} \\ x_{21} & x_{22} & \ldots & x_{2d} \\ \vdots & \vdots & \ddots & \vdots \\ x_{n1} & x_{n2} & \ldots & x_{nd} \end{bmatrix} \]

**Dot Product:** Measure similarity or compute weighted sums
\[ \mathbf{a} \cdot \mathbf{b} = \sum_{i=1}^{n} a_i b_i = \mathbf{a}^T \mathbf{b} \]

### Statistics and Probability

**Mean:** Average value
\[ \mu = \frac{1}{n} \sum_{i=1}^{n} x_i \]

**Variance:** Measure of spread
\[ \sigma^2 = \frac{1}{n} \sum_{i=1}^{n} (x_i - \mu)^2 \]

**Standard Deviation:**
\[ \sigma = \sqrt{\sigma^2} \]

**Covariance:** Measure of relationship between variables
\[ \text{Cov}(X, Y) = \frac{1}{n} \sum_{i=1}^{n} (x_i - \mu_X)(y_i - \mu_Y) \]

## Simple Example: Linear Regression

Linear regression is one of the simplest supervised learning algorithms. It models the relationship between a dependent variable and one or more independent variables using a linear equation.

### Mathematical Model

For a single feature:
\[ y = \beta_0 + \beta_1 x + \epsilon \]

Where:
- \( y \) is the target variable
- \( x \) is the input feature
- \( \beta_0 \) is the y-intercept
- \( \beta_1 \) is the slope
- \( \epsilon \) is the error term

For multiple features:
\[ y = \beta_0 + \beta_1 x_1 + \beta_2 x_2 + \ldots + \beta_n x_n + \epsilon \]

In matrix form:
\[ \mathbf{y} = \mathbf{X}\boldsymbol{\beta} + \boldsymbol{\epsilon} \]

### Cost Function

The Mean Squared Error (MSE) is commonly used:
\[ \text{MSE} = \frac{1}{n} \sum_{i=1}^{n} (y_i - \hat{y}_i)^2 \]

Where \( \hat{y}_i = \beta_0 + \beta_1 x_i \) is the predicted value.

### Python Implementation

```python
import numpy as np
import matplotlib.pyplot as plt

class LinearRegression:
    def __init__(self):
        self.coefficients = None
        self.intercept = None
    
    def fit(self, X, y):
        """
        Train the linear regression model.
        Uses the normal equation: β = (X^T X)^(-1) X^T y
        """
        # Add column of ones for intercept term
        X_with_intercept = np.c_[np.ones(X.shape[0]), X]
        
        # Normal equation solution
        self.weights = np.linalg.inv(X_with_intercept.T @ X_with_intercept) @ X_with_intercept.T @ y
        
        self.intercept = self.weights[0]
        self.coefficients = self.weights[1:]
    
    def predict(self, X):
        """Make predictions using the trained model."""
        X_with_intercept = np.c_[np.ones(X.shape[0]), X]
        return X_with_intercept @ self.weights
    
    def mse(self, y_true, y_pred):
        """Calculate Mean Squared Error."""
        return np.mean((y_true - y_pred) ** 2)
    
    def r_squared(self, y_true, y_pred):
        """Calculate R-squared (coefficient of determination)."""
        ss_res = np.sum((y_true - y_pred) ** 2)
        ss_tot = np.sum((y_true - np.mean(y_true)) ** 2)
        return 1 - (ss_res / ss_tot)

# Generate synthetic data
np.random.seed(42)
X = np.linspace(0, 10, 100).reshape(-1, 1)
y = 2 * X.flatten() + 3 + np.random.normal(0, 1, 100)

# Train model
model = LinearRegression()
model.fit(X, y)

# Make predictions
y_pred = model.predict(X)

# Evaluate
mse = model.mse(y, y_pred)
r2 = model.r_squared(y, y_pred)

print(f"Intercept: {model.intercept:.4f}")
print(f"Coefficient: {model.coefficients[0]:.4f}")
print(f"MSE: {mse:.4f}")
print(f"R²: {r2:.4f}")

# Visualize
plt.figure(figsize=(10, 6))
plt.scatter(X, y, alpha=0.5, label='Data')
plt.plot(X, y_pred, 'r-', label='Fitted line')
plt.xlabel('X')
plt.ylabel('y')
plt.legend()
plt.title('Linear Regression')
plt.show()
```

## Example: Simple Classification with K-Nearest Neighbors

K-Nearest Neighbors (KNN) is a simple classification algorithm that classifies a data point based on the majority class of its k nearest neighbors.

### Algorithm

1. Choose the number of neighbors k
2. For a new data point, find the k nearest training examples
3. Assign the class that appears most frequently among the k neighbors

### Distance Metrics

**Euclidean Distance:**
\[ d(\mathbf{x}_i, \mathbf{x}_j) = \sqrt{\sum_{l=1}^{n} (x_{il} - x_{jl})^2} \]

**Manhattan Distance:**
\[ d(\mathbf{x}_i, \mathbf{x}_j) = \sum_{l=1}^{n} |x_{il} - x_{jl}| \]

### Python Implementation

```python
import numpy as np
from collections import Counter
import matplotlib.pyplot as plt

class KNN:
    def __init__(self, k=3):
        self.k = k
        self.X_train = None
        self.y_train = None
    
    def fit(self, X, y):
        """Store training data."""
        self.X_train = X
        self.y_train = y
    
    def euclidean_distance(self, x1, x2):
        """Calculate Euclidean distance between two points."""
        return np.sqrt(np.sum((x1 - x2) ** 2))
    
    def predict(self, X_test):
        """Predict class labels for test data."""
        predictions = []
        
        for test_point in X_test:
            # Calculate distances to all training points
            distances = [self.euclidean_distance(test_point, train_point) 
                        for train_point in self.X_train]
            
            # Get indices of k nearest neighbors
            k_indices = np.argsort(distances)[:self.k]
            
            # Get labels of k nearest neighbors
            k_labels = [self.y_train[i] for i in k_indices]
            
            # Majority vote
            most_common = Counter(k_labels).most_common(1)
            predictions.append(most_common[0][0])
        
        return np.array(predictions)
    
    def accuracy(self, y_true, y_pred):
        """Calculate accuracy."""
        return np.mean(y_true == y_pred)

# Generate synthetic data
from sklearn.datasets import make_classification

X, y = make_classification(n_samples=100, n_features=2, n_redundant=0, 
                          n_informative=2, n_clusters_per_class=1, 
                          random_state=42)

# Split data
split = int(0.8 * len(X))
X_train, X_test = X[:split], X[split:]
y_train, y_test = y[:split], y[split:]

# Train and predict
knn = KNN(k=3)
knn.fit(X_train, y_train)
y_pred = knn.predict(X_test)

# Evaluate
accuracy = knn.accuracy(y_test, y_pred)
print(f"Accuracy: {accuracy:.4f}")

# Visualize
plt.figure(figsize=(12, 5))

plt.subplot(1, 2, 1)
plt.scatter(X_train[y_train == 0, 0], X_train[y_train == 0, 1], 
           c='blue', label='Class 0', alpha=0.6)
plt.scatter(X_train[y_train == 1, 0], X_train[y_train == 1, 1], 
           c='red', label='Class 1', alpha=0.6)
plt.title('Training Data')
plt.legend()
plt.xlabel('Feature 1')
plt.ylabel('Feature 2')

plt.subplot(1, 2, 2)
plt.scatter(X_test[y_test == 0, 0], X_test[y_test == 0, 1], 
           c='blue', label='Class 0', alpha=0.6, marker='o')
plt.scatter(X_test[y_test == 1, 0], X_test[y_test == 1, 1], 
           c='red', label='Class 1', alpha=0.6, marker='o')
plt.scatter(X_test[y_pred != y_test, 0], X_test[y_pred != y_test, 1], 
           c='black', marker='x', s=100, label='Misclassified')
plt.title(f'Test Data (Accuracy: {accuracy:.2%})')
plt.legend()
plt.xlabel('Feature 1')
plt.ylabel('Feature 2')

plt.tight_layout()
plt.show()
```

## Evaluation Metrics

### For Regression

**Mean Squared Error (MSE):**
\[ \text{MSE} = \frac{1}{n} \sum_{i=1}^{n} (y_i - \hat{y}_i)^2 \]

**Root Mean Squared Error (RMSE):**
\[ \text{RMSE} = \sqrt{\text{MSE}} \]

**Mean Absolute Error (MAE):**
\[ \text{MAE} = \frac{1}{n} \sum_{i=1}^{n} |y_i - \hat{y}_i| \]

**R-squared:**
\[ R^2 = 1 - \frac{\sum_{i=1}^{n} (y_i - \hat{y}_i)^2}{\sum_{i=1}^{n} (y_i - \bar{y})^2} \]

### For Classification

**Accuracy:**
\[ \text{Accuracy} = \frac{\text{Correct Predictions}}{\text{Total Predictions}} \]

**Precision:**
\[ \text{Precision} = \frac{\text{True Positives}}{\text{True Positives} + \text{False Positives}} \]

**Recall:**
\[ \text{Recall} = \frac{\text{True Positives}}{\text{True Positives} + \text{False Negatives}} \]

**F1-Score:**
\[ F1 = 2 \times \frac{\text{Precision} \times \text{Recall}}{\text{Precision} + \text{Recall}} \]

## Common Machine Learning Libraries

### Python Ecosystem

- **NumPy**: Numerical computing and linear algebra
- **Pandas**: Data manipulation and analysis
- **Scikit-learn**: General-purpose ML library
- **TensorFlow/Keras**: Deep learning framework
- **PyTorch**: Deep learning with dynamic computation graphs
- **Matplotlib/Seaborn**: Data visualization

## Summary

Machine Learning represents a paradigm shift in computing:

1. **Learning from Data**: Models improve through experience
2. **Three Main Types**: Supervised, Unsupervised, Reinforcement Learning
3. **Mathematical Foundations**: Linear algebra, statistics, calculus
4. **Pipeline Approach**: Data collection → Preprocessing → Training → Evaluation → Deployment
5. **Evaluation Metrics**: Different metrics for regression and classification tasks

Key concepts:
- Supervised learning uses labeled data
- Unsupervised learning finds patterns without labels
- Reinforcement learning learns through interaction
- Linear regression models relationships with linear equations
- KNN classifies based on nearest neighbors
- Evaluation metrics measure model performance

Understanding these fundamentals is essential before diving deeper into specific algorithms and advanced techniques.

