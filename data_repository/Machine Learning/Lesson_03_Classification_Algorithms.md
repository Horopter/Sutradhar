# Lesson 3: Classification Algorithms in Machine Learning

## Overview

Classification is a fundamental supervised learning task where the goal is to predict categorical labels for input data. Unlike regression which predicts continuous values, classification assigns inputs to discrete categories or classes. This lesson covers key classification algorithms including Logistic Regression, K-Nearest Neighbors, Decision Trees, and evaluation metrics for classification problems.

## What is Classification?

Classification involves predicting which category or class an input belongs to. Examples include:
- Email spam detection (spam vs. not spam)
- Medical diagnosis (disease vs. healthy)
- Image recognition (cat vs. dog vs. bird)
- Credit approval (approved vs. rejected)

## Binary vs. Multi-Class Classification

- **Binary Classification**: Two classes (e.g., yes/no, true/false)
- **Multi-Class Classification**: More than two classes (e.g., cat/dog/bird/other)

## Logistic Regression

Despite its name, logistic regression is a classification algorithm, not a regression algorithm.

### Mathematical Foundation

Logistic regression uses the logistic (sigmoid) function to model probabilities:

\[ P(y=1|x) = \frac{1}{1 + e^{-(\beta_0 + \beta_1 x_1 + \ldots + \beta_n x_n)}} \]

The sigmoid function:
\[ \sigma(z) = \frac{1}{1 + e^{-z}} \]

Squashes any real number into the range (0, 1).

### Cost Function

For binary classification, logistic regression uses the binary cross-entropy loss:

\[ J(\theta) = -\frac{1}{m} \sum_{i=1}^{m} [y_i \log(h_\theta(x_i)) + (1-y_i) \log(1-h_\theta(x_i))] \]

### Python Implementation

```python
import numpy as np
import matplotlib.pyplot as plt
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

class LogisticRegression:
    def __init__(self, learning_rate=0.01, iterations=1000):
        self.learning_rate = learning_rate
        self.iterations = iterations
        self.weights = None
        self.bias = None
        self.cost_history = []
    
    def sigmoid(self, z):
        """Sigmoid activation function."""
        # Clip z to prevent overflow
        z = np.clip(z, -500, 500)
        return 1 / (1 + np.exp(-z))
    
    def fit(self, X, y):
        """Train the logistic regression model."""
        m, n = X.shape
        
        # Initialize parameters
        self.weights = np.zeros(n)
        self.bias = 0
        
        # Gradient descent
        for i in range(self.iterations):
            # Forward propagation
            z = X @ self.weights + self.bias
            h = self.sigmoid(z)
            
            # Calculate cost
            cost = -np.mean(y * np.log(h + 1e-15) + (1 - y) * np.log(1 - h + 1e-15))
            self.cost_history.append(cost)
            
            # Backward propagation
            dw = (1/m) * X.T @ (h - y)
            db = (1/m) * np.sum(h - y)
            
            # Update parameters
            self.weights -= self.learning_rate * dw
            self.bias -= self.learning_rate * db
            
            if (i + 1) % 100 == 0:
                print(f'Iteration {i+1}/{self.iterations}, Cost: {cost:.4f}')
    
    def predict(self, X):
        """Make binary predictions."""
        z = X @ self.weights + self.bias
        h = self.sigmoid(z)
        return (h >= 0.5).astype(int)
    
    def predict_proba(self, X):
        """Return probability predictions."""
        z = X @ self.weights + self.bias
        return self.sigmoid(z)

# Generate synthetic data
X, y = make_classification(n_samples=1000, n_features=2, n_redundant=0,
                          n_informative=2, n_clusters_per_class=1,
                          random_state=42)

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Standardize features
scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)

# Train model
model = LogisticRegression(learning_rate=0.1, iterations=1000)
model.fit(X_train, y_train)

# Predictions
y_pred = model.predict(X_test)
y_proba = model.predict_proba(X_test)

# Evaluate
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report

accuracy = accuracy_score(y_test, y_pred)
print(f"\nAccuracy: {accuracy:.4f}")

print("\nConfusion Matrix:")
print(confusion_matrix(y_test, y_pred))

print("\nClassification Report:")
print(classification_report(y_test, y_pred))

# Visualize decision boundary
def plot_decision_boundary(X, y, model):
    h = 0.02
    x_min, x_max = X[:, 0].min() - 1, X[:, 0].max() + 1
    y_min, y_max = X[:, 1].min() - 1, X[:, 1].max() + 1
    xx, yy = np.meshgrid(np.arange(x_min, x_max, h),
                         np.arange(y_min, y_max, h))
    
    Z = model.predict(np.c_[xx.ravel(), yy.ravel()])
    Z = Z.reshape(xx.shape)
    
    plt.contourf(xx, yy, Z, alpha=0.4)
    plt.scatter(X[:, 0], X[:, 1], c=y, s=20, edgecolor='k')
    plt.title('Logistic Regression Decision Boundary')
    plt.xlabel('Feature 1')
    plt.ylabel('Feature 2')
    plt.show()

plot_decision_boundary(X_test, y_test, model)
```

## K-Nearest Neighbors (KNN)

KNN classifies a data point based on the majority class of its k nearest neighbors.

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
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

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
        """Calculate Euclidean distance."""
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

# Generate data
X, y = make_classification(n_samples=200, n_features=2, n_redundant=0,
                          n_informative=2, n_clusters_per_class=1,
                          random_state=42)

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)

# Train and predict
knn = KNN(k=5)
knn.fit(X_train, y_train)
y_pred = knn.predict(X_test)

# Evaluate
accuracy = accuracy_score(y_test, y_pred)
print(f"KNN Accuracy (k=5): {accuracy:.4f}")
```

## Decision Trees

Decision trees make decisions by asking a series of questions, splitting data based on feature values.

### Information Theory Concepts

**Entropy:**
\[ H(S) = -\sum_{i=1}^{c} p_i \log_2(p_i) \]

Where \( p_i \) is the proportion of class i in set S.

**Information Gain:**
\[ IG(S, A) = H(S) - \sum_{v \in Values(A)} \frac{|S_v|}{|S|} H(S_v) \]

### Python Implementation

```python
import numpy as np
from collections import Counter

class DecisionTree:
    def __init__(self, max_depth=10, min_samples_split=2):
        self.max_depth = max_depth
        self.min_samples_split = min_samples_split
        self.tree = None
    
    def entropy(self, y):
        """Calculate entropy."""
        if len(y) == 0:
            return 0
        counts = np.bincount(y)
        proportions = counts / len(y)
        entropy = -np.sum([p * np.log2(p) for p in proportions if p > 0])
        return entropy
    
    def information_gain(self, X, y, feature_idx, threshold):
        """Calculate information gain for a split."""
        parent_entropy = self.entropy(y)
        
        left_indices = X[:, feature_idx] <= threshold
        right_indices = ~left_indices
        
        if np.sum(left_indices) == 0 or np.sum(right_indices) == 0:
            return 0
        
        left_entropy = self.entropy(y[left_indices])
        right_entropy = self.entropy(y[right_indices])
        
        n = len(y)
        n_left = np.sum(left_indices)
        n_right = np.sum(right_indices)
        
        child_entropy = (n_left / n) * left_entropy + (n_right / n) * right_entropy
        information_gain = parent_entropy - child_entropy
        
        return information_gain
    
    def best_split(self, X, y):
        """Find the best feature and threshold to split on."""
        best_gain = 0
        best_feature = None
        best_threshold = None
        
        for feature_idx in range(X.shape[1]):
            thresholds = np.unique(X[:, feature_idx])
            for threshold in thresholds:
                gain = self.information_gain(X, y, feature_idx, threshold)
                if gain > best_gain:
                    best_gain = gain
                    best_feature = feature_idx
                    best_threshold = threshold
        
        return best_feature, best_threshold, best_gain
    
    def build_tree(self, X, y, depth=0):
        """Recursively build the decision tree."""
        n_samples = len(y)
        n_classes = len(np.unique(y))
        
        # Stopping criteria
        if (depth >= self.max_depth or 
            n_classes == 1 or 
            n_samples < self.min_samples_split):
            return Counter(y).most_common(1)[0][0]
        
        # Find best split
        feature, threshold, gain = self.best_split(X, y)
        
        if gain == 0:
            return Counter(y).most_common(1)[0][0]
        
        # Split data
        left_indices = X[:, feature] <= threshold
        right_indices = ~left_indices
        
        # Build subtrees
        tree = {
            'feature': feature,
            'threshold': threshold,
            'left': self.build_tree(X[left_indices], y[left_indices], depth + 1),
            'right': self.build_tree(X[right_indices], y[right_indices], depth + 1)
        }
        
        return tree
    
    def fit(self, X, y):
        """Train the decision tree."""
        self.tree = self.build_tree(X, y)
    
    def predict_sample(self, x, tree):
        """Predict class for a single sample."""
        if isinstance(tree, dict):
            if x[tree['feature']] <= tree['threshold']:
                return self.predict_sample(x, tree['left'])
            else:
                return self.predict_sample(x, tree['right'])
        else:
            return tree
    
    def predict(self, X):
        """Predict classes for multiple samples."""
        return np.array([self.predict_sample(x, self.tree) for x in X])

# Generate data
X, y = make_classification(n_samples=200, n_features=2, n_redundant=0,
                          n_informative=2, n_clusters_per_class=1,
                          random_state=42)

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)

# Train
dt = DecisionTree(max_depth=5, min_samples_split=10)
dt.fit(X_train, y_train)

# Predict
y_pred = dt.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f"Decision Tree Accuracy: {accuracy:.4f}")
```

## Evaluation Metrics for Classification

### Confusion Matrix

A confusion matrix shows the counts of true positives, false positives, true negatives, and false negatives.

### Metrics

**Accuracy:**
\[ \text{Accuracy} = \frac{TP + TN}{TP + TN + FP + FN} \]

**Precision:**
\[ \text{Precision} = \frac{TP}{TP + FP} \]

**Recall (Sensitivity):**
\[ \text{Recall} = \frac{TP}{TP + FN} \]

**F1-Score:**
\[ F1 = 2 \times \frac{\text{Precision} \times \text{Recall}}{\text{Precision} + \text{Recall}} \]

**Specificity:**
\[ \text{Specificity} = \frac{TN}{TN + FP} \]

```python
from sklearn.metrics import confusion_matrix, precision_score, recall_score, f1_score

def evaluate_classification(y_true, y_pred):
    """Comprehensive classification evaluation."""
    cm = confusion_matrix(y_true, y_pred)
    accuracy = accuracy_score(y_true, y_pred)
    precision = precision_score(y_true, y_pred)
    recall = recall_score(y_true, y_pred)
    f1 = f1_score(y_true, y_pred)
    
    print("Confusion Matrix:")
    print(cm)
    print(f"\nAccuracy: {accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall: {recall:.4f}")
    print(f"F1-Score: {f1:.4f}")
    
    return {
        'accuracy': accuracy,
        'precision': precision,
        'recall': recall,
        'f1': f1
    }

# Use with any classifier
evaluate_classification(y_test, y_pred)
```

## Summary

Classification algorithms predict categorical labels:

1. **Logistic Regression**: Probabilistic classifier using sigmoid function
2. **K-Nearest Neighbors**: Instance-based learning using distance metrics
3. **Decision Trees**: Rule-based classification using information theory
4. **Evaluation Metrics**: Accuracy, precision, recall, F1-score

Key concepts:
- Binary vs. multi-class classification
- Probability-based vs. distance-based approaches
- Information gain for feature selection
- Comprehensive evaluation using multiple metrics

Understanding classification algorithms enables solving many real-world prediction problems where outputs are discrete categories rather than continuous values.

