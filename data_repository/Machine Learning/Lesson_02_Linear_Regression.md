# Lesson 2: Linear Regression in Machine Learning

## Overview

Linear regression is one of the most fundamental and widely used supervised learning algorithms. It models the relationship between a dependent variable (target) and one or more independent variables (features) using a linear equation. Linear regression is used for prediction tasks where the output is continuous, making it ideal for problems like price prediction, sales forecasting, and trend analysis.

## Mathematical Foundation

### Simple Linear Regression

Simple linear regression models the relationship between two variables using a straight line.

**Equation:**
\[ y = \beta_0 + \beta_1 x + \epsilon \]

Where:
- \( y \) is the dependent variable (target)
- \( x \) is the independent variable (feature)
- \( \beta_0 \) is the y-intercept
- \( \beta_1 \) is the slope
- \( \epsilon \) is the error term

The goal is to find \( \hat{\beta}_0 \) and \( \hat{\beta}_1 \) that minimize the prediction error.

### Multiple Linear Regression

When we have multiple features, the equation becomes:

\[ y = \beta_0 + \beta_1 x_1 + \beta_2 x_2 + \ldots + \beta_n x_n + \epsilon \]

In matrix form:
\[ \mathbf{y} = \mathbf{X}\boldsymbol{\beta} + \boldsymbol{\epsilon} \]

Where:
- \( \mathbf{y} \) is the target vector
- \( \mathbf{X} \) is the feature matrix (with a column of 1s for the intercept)
- \( \boldsymbol{\beta} \) is the coefficient vector
- \( \boldsymbol{\epsilon} \) is the error vector

## Cost Function

### Mean Squared Error (MSE)

The most common cost function for linear regression is the Mean Squared Error:

\[ \text{MSE} = \frac{1}{n} \sum_{i=1}^{n} (y_i - \hat{y}_i)^2 \]

Where:
- \( n \) is the number of samples
- \( y_i \) is the actual value
- \( \hat{y}_i = \beta_0 + \beta_1 x_i \) is the predicted value

### Root Mean Squared Error (RMSE)

\[ \text{RMSE} = \sqrt{\frac{1}{n} \sum_{i=1}^{n} (y_i - \hat{y}_i)^2} \]

### Mean Absolute Error (MAE)

\[ \text{MAE} = \frac{1}{n} \sum_{i=1}^{n} |y_i - \hat{y}_i| \]

## Solving Linear Regression

### Normal Equation (Closed-Form Solution)

For linear regression, we can derive a closed-form solution:

\[ \boldsymbol{\beta} = (\mathbf{X}^T \mathbf{X})^{-1} \mathbf{X}^T \mathbf{y} \]

**Advantages:**
- Direct solution, no iteration needed
- Guaranteed to find optimal solution

**Disadvantages:**
- Computationally expensive for large datasets (O(n³))
- Requires matrix inversion
- Doesn't scale well

### Gradient Descent

Gradient descent is an iterative optimization algorithm that finds the minimum of a function by moving in the direction of steepest descent.

**Algorithm:**

1. Initialize \( \beta_0 \) and \( \beta_1 \) randomly
2. Repeat until convergence:
   - Calculate predictions: \( \hat{y}_i = \beta_0 + \beta_1 x_i \)
   - Calculate cost: \( J = \frac{1}{2n} \sum (y_i - \hat{y}_i)^2 \)
   - Update parameters:
     \[ \beta_0 := \beta_0 - \alpha \frac{\partial J}{\partial \beta_0} \]
     \[ \beta_1 := \beta_1 - \alpha \frac{\partial J}{\partial \beta_1} \]

Where \( \alpha \) is the learning rate.

**Partial Derivatives:**

\[ \frac{\partial J}{\partial \beta_0} = -\frac{1}{n} \sum_{i=1}^{n} (y_i - \hat{y}_i) \]

\[ \frac{\partial J}{\partial \beta_1} = -\frac{1}{n} \sum_{i=1}^{n} (y_i - \hat{y}_i) x_i \]

## Python Implementation

### Using NumPy (Normal Equation)

```python
import numpy as np
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score

class LinearRegression:
    def __init__(self):
        self.coefficients = None
        self.intercept = None
    
    def fit(self, X, y):
        """
        Train the linear regression model using the normal equation.
        β = (X^T X)^(-1) X^T y
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
    
    def rmse(self, y_true, y_pred):
        """Calculate Root Mean Squared Error."""
        return np.sqrt(self.mse(y_true, y_pred))
    
    def mae(self, y_true, y_pred):
        """Calculate Mean Absolute Error."""
        return np.mean(np.abs(y_true - y_pred))
    
    def r_squared(self, y_true, y_pred):
        """
        Calculate R-squared (coefficient of determination).
        R² = 1 - (SS_res / SS_tot)
        """
        ss_res = np.sum((y_true - y_pred) ** 2)
        ss_tot = np.sum((y_true - np.mean(y_true)) ** 2)
        return 1 - (ss_res / ss_tot)

# Generate synthetic data
np.random.seed(42)
X = np.linspace(0, 10, 100).reshape(-1, 1)
y = 2 * X.flatten() + 3 + np.random.normal(0, 1, 100)

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train model
model = LinearRegression()
model.fit(X_train, y_train)

# Make predictions
y_train_pred = model.predict(X_train)
y_test_pred = model.predict(X_test)

# Evaluate
train_mse = model.mse(y_train, y_train_pred)
test_mse = model.mse(y_test, y_test_pred)
train_r2 = model.r_squared(y_train, y_train_pred)
test_r2 = model.r_squared(y_test, y_test_pred)

print("Model Performance:")
print(f"Intercept: {model.intercept:.4f}")
print(f"Coefficient: {model.coefficients[0]:.4f}")
print(f"\nTraining Set:")
print(f"  MSE: {train_mse:.4f}")
print(f"  RMSE: {np.sqrt(train_mse):.4f}")
print(f"  R²: {train_r2:.4f}")
print(f"\nTest Set:")
print(f"  MSE: {test_mse:.4f}")
print(f"  RMSE: {np.sqrt(test_mse):.4f}")
print(f"  R²: {test_r2:.4f}")

# Visualize
plt.figure(figsize=(12, 5))

plt.subplot(1, 2, 1)
plt.scatter(X_train, y_train, alpha=0.5, label='Training data')
plt.plot(X_train, y_train_pred, 'r-', label='Fitted line')
plt.xlabel('X')
plt.ylabel('y')
plt.title('Training Data')
plt.legend()

plt.subplot(1, 2, 2)
plt.scatter(X_test, y_test, alpha=0.5, label='Test data')
plt.plot(X_test, y_test_pred, 'r-', label='Predicted line')
plt.xlabel('X')
plt.ylabel('y')
plt.title('Test Data')
plt.legend()

plt.tight_layout()
plt.show()
```

### Gradient Descent Implementation

```python
import numpy as np
import matplotlib.pyplot as plt

class LinearRegressionGD:
    def __init__(self, learning_rate=0.01, iterations=1000):
        self.learning_rate = learning_rate
        self.iterations = iterations
        self.coefficients = None
        self.intercept = None
        self.cost_history = []
    
    def fit(self, X, y):
        """Train using gradient descent."""
        m = X.shape[0]
        n = X.shape[1]
        
        # Initialize parameters
        self.coefficients = np.zeros(n)
        self.intercept = 0
        
        for i in range(self.iterations):
            # Predictions
            y_pred = X @ self.coefficients + self.intercept
            
            # Calculate cost
            cost = (1/(2*m)) * np.sum((y_pred - y) ** 2)
            self.cost_history.append(cost)
            
            # Calculate gradients
            d_coefficients = (1/m) * (X.T @ (y_pred - y))
            d_intercept = (1/m) * np.sum(y_pred - y)
            
            # Update parameters
            self.coefficients -= self.learning_rate * d_coefficients
            self.intercept -= self.learning_rate * d_intercept
            
            # Optional: print progress
            if (i + 1) % 100 == 0:
                print(f'Iteration {i+1}/{self.iterations}, Cost: {cost:.4f}')
    
    def predict(self, X):
        """Make predictions."""
        return X @ self.coefficients + self.intercept

# Generate data
np.random.seed(42)
X = np.random.randn(100, 1)
y = 2 * X.flatten() + 3 + np.random.normal(0, 0.5, 100)

# Normalize features (helps gradient descent converge faster)
X_normalized = (X - np.mean(X, axis=0)) / np.std(X, axis=0)

# Train model
model_gd = LinearRegressionGD(learning_rate=0.1, iterations=1000)
model_gd.fit(X_normalized, y)

# Predictions
y_pred = model_gd.predict(X_normalized)

# Visualize cost history
plt.figure(figsize=(12, 5))

plt.subplot(1, 2, 1)
plt.plot(model_gd.cost_history)
plt.xlabel('Iteration')
plt.ylabel('Cost')
plt.title('Cost Function Convergence')
plt.grid(True)

plt.subplot(1, 2, 2)
plt.scatter(X, y, alpha=0.5, label='Data')
plt.plot(X, y_pred, 'r-', label='Fitted line')
plt.xlabel('X')
plt.ylabel('y')
plt.title('Linear Regression with Gradient Descent')
plt.legend()

plt.tight_layout()
plt.show()
```

## Multiple Linear Regression

```python
import numpy as np
from sklearn.datasets import make_regression
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D

# Generate multiple regression dataset
X, y = make_regression(n_samples=100, n_features=2, n_informative=2, 
                       noise=10, random_state=42)

# Train model
model = LinearRegression()
model.fit(X, y)

# Predictions
y_pred = model.predict(X)

# Evaluate
mse = model.mse(y, y_pred)
r2 = model.r_squared(y, y_pred)

print(f"MSE: {mse:.4f}")
print(f"R²: {r2:.4f}")
print(f"\nCoefficients: {model.coefficients}")
print(f"Intercept: {model.intercept:.4f}")

# Visualize (3D plot for 2 features)
fig = plt.figure(figsize=(12, 5))

ax1 = fig.add_subplot(121, projection='3d')
ax1.scatter(X[:, 0], X[:, 1], y, alpha=0.5, label='Actual')
ax1.scatter(X[:, 0], X[:, 1], y_pred, alpha=0.5, label='Predicted', marker='^')
ax1.set_xlabel('Feature 1')
ax1.set_ylabel('Feature 2')
ax1.set_zlabel('Target')
ax1.set_title('Multiple Linear Regression (3D)')
ax1.legend()

ax2 = fig.add_subplot(122)
ax2.scatter(y, y_pred, alpha=0.5)
ax2.plot([y.min(), y.max()], [y.min(), y.max()], 'r--', lw=2)
ax2.set_xlabel('Actual')
ax2.set_ylabel('Predicted')
ax2.set_title('Actual vs Predicted')
ax2.grid(True)

plt.tight_layout()
plt.show()
```

## Assumptions of Linear Regression

1. **Linearity**: Relationship between features and target is linear
2. **Independence**: Observations are independent
3. **Homoscedasticity**: Constant variance of errors
4. **Normality**: Errors are normally distributed
5. **No multicollinearity**: Features are not highly correlated

## Regularization

### Ridge Regression (L2 Regularization)

Adds penalty term to prevent overfitting:

\[ J = \text{MSE} + \alpha \sum_{i=1}^{n} \beta_i^2 \]

### Lasso Regression (L1 Regularization)

Can set coefficients to zero (feature selection):

\[ J = \text{MSE} + \alpha \sum_{i=1}^{n} |\beta_i| \]

## Summary

Linear regression is a fundamental algorithm:

1. **Simple yet powerful**: Easy to understand and implement
2. **Interpretable**: Coefficients have clear meaning
3. **Fast**: Efficient computation
4. **Baseline**: Good starting point for regression problems
5. **Foundation**: Understanding linear regression helps with more complex models

Key concepts:
- Models linear relationships between features and target
- Normal equation provides closed-form solution
- Gradient descent enables iterative optimization
- Multiple metrics (MSE, RMSE, MAE, R²) evaluate performance
- Assumptions must be met for reliable results
- Regularization prevents overfitting

Linear regression provides a solid foundation for understanding more advanced machine learning algorithms and is widely used in practice for prediction tasks.

