# Lesson 8: STL - Standard Template Library in C++

## Overview

The Standard Template Library (STL) is a powerful C++ library that provides a collection of template classes and functions for common data structures and algorithms. The STL consists of four main components: containers, iterators, algorithms, and function objects. Mastering the STL is essential for writing efficient, reusable C++ code.

## STL Components

### 1. Containers

Data structures that hold collections of objects:
- **Sequence Containers**: `vector`, `deque`, `list`, `array`, `forward_list`
- **Associative Containers**: `set`, `map`, `multiset`, `multimap`
- **Unordered Containers**: `unordered_set`, `unordered_map`, `unordered_multiset`, `unordered_multimap`
- **Container Adapters**: `stack`, `queue`, `priority_queue`

### 2. Iterators

Provide a way to access elements in containers sequentially.

### 3. Algorithms

Generic functions for common operations like sorting, searching, and manipulating sequences.

### 4. Function Objects (Functors)

Objects that can be called like functions.

## Vector: Dynamic Array

`vector` is a dynamic array that can resize automatically.

### Basic Vector Operations

```cpp
#include <iostream>
#include <vector>
#include <algorithm>
#include <numeric>

int main() {
    // Declaration and initialization
    std::vector<int> numbers;
    std::vector<int> vec1(5);              // Vector of size 5 (default values)
    std::vector<int> vec2(5, 10);          // Vector of size 5, all values 10
    std::vector<int> vec3 = {1, 2, 3, 4, 5};
    
    // Adding elements
    numbers.push_back(10);
    numbers.push_back(20);
    numbers.push_back(30);
    numbers.push_back(40);
    numbers.push_back(50);
    
    // Accessing elements
    std::cout << "First element: " << numbers[0] << std::endl;
    std::cout << "Last element: " << numbers.back() << std::endl;
    std::cout << "Size: " << numbers.size() << std::endl;
    std::cout << "Capacity: " << numbers.capacity() << std::endl;
    
    // Iterating
    std::cout << "Elements: ";
    for (size_t i = 0; i < numbers.size(); i++) {
        std::cout << numbers[i] << " ";
    }
    std::cout << std::endl;
    
    // Range-based for loop
    std::cout << "Using range-based loop: ";
    for (int num : numbers) {
        std::cout << num << " ";
    }
    std::cout << std::endl;
    
    // Using iterators
    std::cout << "Using iterators: ";
    for (auto it = numbers.begin(); it != numbers.end(); ++it) {
        std::cout << *it << " ";
    }
    std::cout << std::endl;
    
    return 0;
}
```

### Mathematical Operations with Vectors

```cpp
#include <iostream>
#include <vector>
#include <numeric>
#include <algorithm>
#include <cmath>

class VectorOperations {
public:
    // Calculate mean: μ = (1/n) Σx_i
    static double mean(const std::vector<double>& vec) {
        if (vec.empty()) return 0;
        double sum = std::accumulate(vec.begin(), vec.end(), 0.0);
        return sum / vec.size();
    }
    
    // Calculate variance: σ² = (1/n) Σ(x_i - μ)²
    static double variance(const std::vector<double>& vec) {
        if (vec.empty()) return 0;
        double mu = mean(vec);
        double sumSquaredDiff = 0;
        for (double val : vec) {
            sumSquaredDiff += std::pow(val - mu, 2);
        }
        return sumSquaredDiff / vec.size();
    }
    
    // Calculate standard deviation: σ = √σ²
    static double standardDeviation(const std::vector<double>& vec) {
        return std::sqrt(variance(vec));
    }
    
    // Dot product: a · b = Σ(a_i × b_i)
    static double dotProduct(const std::vector<double>& a, const std::vector<double>& b) {
        if (a.size() != b.size()) {
            throw std::invalid_argument("Vectors must have same size");
        }
        double result = 0;
        for (size_t i = 0; i < a.size(); i++) {
            result += a[i] * b[i];
        }
        return result;
    }
    
    // Euclidean norm: ||v|| = √(Σv_i²)
    static double euclideanNorm(const std::vector<double>& vec) {
        double sumSquares = 0;
        for (double val : vec) {
            sumSquares += val * val;
        }
        return std::sqrt(sumSquares);
    }
    
    // Vector addition: c = a + b
    static std::vector<double> add(const std::vector<double>& a, const std::vector<double>& b) {
        if (a.size() != b.size()) {
            throw std::invalid_argument("Vectors must have same size");
        }
        std::vector<double> result(a.size());
        for (size_t i = 0; i < a.size(); i++) {
            result[i] = a[i] + b[i];
        }
        return result;
    }
    
    // Scalar multiplication: c = k × a
    static std::vector<double> scalarMultiply(const std::vector<double>& vec, double scalar) {
        std::vector<double> result(vec.size());
        for (size_t i = 0; i < vec.size(); i++) {
            result[i] = vec[i] * scalar;
        }
        return result;
    }
};

int main() {
    std::vector<double> data = {2.5, 3.7, 4.1, 5.2, 6.8, 7.3, 8.9};
    
    std::cout << "Data: ";
    for (double val : data) {
        std::cout << val << " ";
    }
    std::cout << std::endl;
    
    double mu = VectorOperations::mean(data);
    double var = VectorOperations::variance(data);
    double stdDev = VectorOperations::standardDeviation(data);
    
    std::cout << "\nStatistics:" << std::endl;
    std::cout << "Mean: " << mu << std::endl;
    std::cout << "Variance: " << var << std::endl;
    std::cout << "Standard Deviation: " << stdDev << std::endl;
    
    // Vector operations
    std::vector<double> v1 = {1, 2, 3};
    std::vector<double> v2 = {4, 5, 6};
    
    std::cout << "\nVector Operations:" << std::endl;
    std::cout << "v1 = [1, 2, 3]" << std::endl;
    std::cout << "v2 = [4, 5, 6]" << std::endl;
    
    double dot = VectorOperations::dotProduct(v1, v2);
    std::cout << "Dot product: " << dot << std::endl;
    
    double norm1 = VectorOperations::euclideanNorm(v1);
    std::cout << "||v1|| = " << norm1 << std::endl;
    
    std::vector<double> sum = VectorOperations::add(v1, v2);
    std::cout << "v1 + v2 = [";
    for (size_t i = 0; i < sum.size(); i++) {
        std::cout << sum[i];
        if (i < sum.size() - 1) std::cout << ", ";
    }
    std::cout << "]" << std::endl;
    
    std::vector<double> scaled = VectorOperations::scalarMultiply(v1, 2.5);
    std::cout << "2.5 × v1 = [";
    for (size_t i = 0; i < scaled.size(); i++) {
        std::cout << scaled[i];
        if (i < scaled.size() - 1) std::cout << ", ";
    }
    std::cout << "]" << std::endl;
    
    return 0;
}
```

## Map: Key-Value Pairs

`map` stores key-value pairs in sorted order.

```cpp
#include <iostream>
#include <map>
#include <string>

int main() {
    // Create a map
    std::map<std::string, int> grades;
    
    // Insert elements
    grades["Alice"] = 95;
    grades["Bob"] = 87;
    grades["Charlie"] = 92;
    grades["Diana"] = 88;
    
    // Access elements
    std::cout << "Alice's grade: " << grades["Alice"] << std::endl;
    
    // Check if key exists
    if (grades.find("Bob") != grades.end()) {
        std::cout << "Bob's grade: " << grades["Bob"] << std::endl;
    }
    
    // Iterate through map
    std::cout << "\nAll grades:" << std::endl;
    for (const auto& pair : grades) {
        std::cout << pair.first << ": " << pair.second << std::endl;
    }
    
    // Calculate average grade
    double sum = 0;
    for (const auto& pair : grades) {
        sum += pair.second;
    }
    double average = sum / grades.size();
    std::cout << "\nAverage grade: " << average << std::endl;
    
    return 0;
}
```

## Set: Unique Elements

`set` stores unique elements in sorted order.

```cpp
#include <iostream>
#include <set>
#include <vector>

int main() {
    std::vector<int> numbers = {3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5};
    
    // Convert vector to set (removes duplicates)
    std::set<int> uniqueNumbers(numbers.begin(), numbers.end());
    
    std::cout << "Original numbers: ";
    for (int num : numbers) {
        std::cout << num << " ";
    }
    std::cout << std::endl;
    
    std::cout << "Unique numbers (sorted): ";
    for (int num : uniqueNumbers) {
        std::cout << num << " ";
    }
    std::cout << std::endl;
    
    // Set operations
    std::set<int> set1 = {1, 2, 3, 4, 5};
    std::set<int> set2 = {4, 5, 6, 7, 8};
    
    // Union
    std::set<int> unionSet;
    std::set_union(set1.begin(), set1.end(), set2.begin(), set2.end(),
                   std::inserter(unionSet, unionSet.begin()));
    
    std::cout << "\nSet 1: ";
    for (int num : set1) std::cout << num << " ";
    
    std::cout << "\nSet 2: ";
    for (int num : set2) std::cout << num << " ";
    
    std::cout << "\nUnion: ";
    for (int num : unionSet) std::cout << num << " ";
    std::cout << std::endl;
    
    return 0;
}
```

## STL Algorithms

The `<algorithm>` header provides many useful functions.

### Sorting and Searching

```cpp
#include <iostream>
#include <vector>
#include <algorithm>
#include <numeric>

int main() {
    std::vector<int> numbers = {64, 34, 25, 12, 22, 11, 90, 5};
    
    std::cout << "Original: ";
    for (int num : numbers) {
        std::cout << num << " ";
    }
    std::cout << std::endl;
    
    // Sort in ascending order
    std::sort(numbers.begin(), numbers.end());
    std::cout << "Sorted (ascending): ";
    for (int num : numbers) {
        std::cout << num << " ";
    }
    std::cout << std::endl;
    
    // Sort in descending order
    std::sort(numbers.begin(), numbers.end(), std::greater<int>());
    std::cout << "Sorted (descending): ";
    for (int num : numbers) {
        std::cout << num << " ";
    }
    std::cout << std::endl;
    
    // Binary search (requires sorted array)
    std::sort(numbers.begin(), numbers.end());
    int target = 25;
    if (std::binary_search(numbers.begin(), numbers.end(), target)) {
        std::cout << target << " found in the vector" << std::endl;
    }
    
    // Find element
    auto it = std::find(numbers.begin(), numbers.end(), 22);
    if (it != numbers.end()) {
        std::cout << "Found 22 at index: " << (it - numbers.begin()) << std::endl;
    }
    
    // Count occurrences
    numbers.push_back(25);
    numbers.push_back(25);
    int count = std::count(numbers.begin(), numbers.end(), 25);
    std::cout << "Number 25 appears " << count << " times" << std::endl;
    
    return 0;
}
```

### Transform and Accumulate

```cpp
#include <iostream>
#include <vector>
#include <algorithm>
#include <numeric>
#include <cmath>

int main() {
    std::vector<double> values = {1.5, 2.3, 3.7, 4.2, 5.9};
    
    // Transform: square each element
    std::vector<double> squared;
    std::transform(values.begin(), values.end(), std::back_inserter(squared),
                   [](double x) { return x * x; });
    
    std::cout << "Original: ";
    for (double val : values) std::cout << val << " ";
    std::cout << std::endl;
    
    std::cout << "Squared: ";
    for (double val : squared) std::cout << val << " ";
    std::cout << std::endl;
    
    // Accumulate: sum of elements
    double sum = std::accumulate(values.begin(), values.end(), 0.0);
    std::cout << "Sum: " << sum << std::endl;
    
    // Accumulate: product of elements
    double product = std::accumulate(values.begin(), values.end(), 1.0,
                                     std::multiplies<double>());
    std::cout << "Product: " << product << std::endl;
    
    // Maximum and minimum
    auto maxIt = std::max_element(values.begin(), values.end());
    auto minIt = std::min_element(values.begin(), values.end());
    std::cout << "Maximum: " << *maxIt << std::endl;
    std::cout << "Minimum: " << *minIt << std::endl;
    
    return 0;
}
```

## Priority Queue

`priority_queue` implements a max-heap by default.

```cpp
#include <iostream>
#include <queue>
#include <vector>

int main() {
    // Max heap (default)
    std::priority_queue<int> maxHeap;
    
    maxHeap.push(30);
    maxHeap.push(10);
    maxHeap.push(50);
    maxHeap.push(20);
    maxHeap.push(40);
    
    std::cout << "Max heap (top elements): ";
    while (!maxHeap.empty()) {
        std::cout << maxHeap.top() << " ";
        maxHeap.pop();
    }
    std::cout << std::endl;
    
    // Min heap
    std::priority_queue<int, std::vector<int>, std::greater<int>> minHeap;
    
    minHeap.push(30);
    minHeap.push(10);
    minHeap.push(50);
    minHeap.push(20);
    minHeap.push(40);
    
    std::cout << "Min heap (top elements): ";
    while (!minHeap.empty()) {
        std::cout << minHeap.top() << " ";
        minHeap.pop();
    }
    std::cout << std::endl;
    
    return 0;
}
```

## Mathematical Example: Matrix Operations with STL

```cpp
#include <iostream>
#include <vector>
#include <algorithm>
#include <numeric>
#include <iomanip>

class Matrix {
private:
    std::vector<std::vector<double>> data;
    size_t rows, cols;
    
public:
    Matrix(size_t r, size_t c) : rows(r), cols(c) {
        data.resize(rows, std::vector<double>(cols, 0));
    }
    
    Matrix(const std::vector<std::vector<double>>& d) : data(d) {
        rows = data.size();
        cols = rows > 0 ? data[0].size() : 0;
    }
    
    double& operator()(size_t i, size_t j) {
        return data[i][j];
    }
    
    const double& operator()(size_t i, size_t j) const {
        return data[i][j];
    }
    
    size_t getRows() const { return rows; }
    size_t getCols() const { return cols; }
    
    // Matrix addition: C = A + B
    Matrix operator+(const Matrix& other) const {
        if (rows != other.rows || cols != other.cols) {
            throw std::invalid_argument("Matrix dimensions must match");
        }
        Matrix result(rows, cols);
        for (size_t i = 0; i < rows; i++) {
            for (size_t j = 0; j < cols; j++) {
                result(i, j) = data[i][j] + other(i, j);
            }
        }
        return result;
    }
    
    // Matrix multiplication: C = A × B
    Matrix operator*(const Matrix& other) const {
        if (cols != other.rows) {
            throw std::invalid_argument("Invalid matrix dimensions for multiplication");
        }
        Matrix result(rows, other.cols);
        for (size_t i = 0; i < rows; i++) {
            for (size_t j = 0; j < other.cols; j++) {
                double sum = 0;
                for (size_t k = 0; k < cols; k++) {
                    sum += data[i][k] * other(k, j);
                }
                result(i, j) = sum;
            }
        }
        return result;
    }
    
    // Scalar multiplication
    Matrix operator*(double scalar) const {
        Matrix result(rows, cols);
        for (size_t i = 0; i < rows; i++) {
            std::transform(data[i].begin(), data[i].end(), result.data[i].begin(),
                          [scalar](double val) { return val * scalar; });
        }
        return result;
    }
    
    // Transpose
    Matrix transpose() const {
        Matrix result(cols, rows);
        for (size_t i = 0; i < rows; i++) {
            for (size_t j = 0; j < cols; j++) {
                result(j, i) = data[i][j];
            }
        }
        return result;
    }
    
    // Trace (sum of diagonal elements)
    double trace() const {
        if (rows != cols) {
            throw std::invalid_argument("Matrix must be square");
        }
        double sum = 0;
        for (size_t i = 0; i < rows; i++) {
            sum += data[i][i];
        }
        return sum;
    }
    
    void print() const {
        for (size_t i = 0; i < rows; i++) {
            for (size_t j = 0; j < cols; j++) {
                std::cout << std::setw(8) << std::fixed << std::setprecision(2) 
                         << data[i][j] << " ";
            }
            std::cout << std::endl;
        }
    }
};

int main() {
    Matrix A({{1, 2, 3}, {4, 5, 6}});
    Matrix B({{7, 8}, {9, 10}, {11, 12}});
    
    std::cout << "Matrix A (2×3):" << std::endl;
    A.print();
    
    std::cout << "\nMatrix B (3×2):" << std::endl;
    B.print();
    
    Matrix C = A * B;
    std::cout << "\nA × B:" << std::endl;
    C.print();
    
    Matrix A_T = A.transpose();
    std::cout << "\nA^T:" << std::endl;
    A_T.print();
    
    return 0;
}
```

## Summary

The STL provides powerful, efficient, and reusable components:

1. **Containers**: Data structures (vector, map, set, etc.)
2. **Iterators**: Access elements sequentially
3. **Algorithms**: Generic functions (sort, search, transform)
4. **Function Objects**: Callable objects for custom behavior

Key benefits:
- Efficiency: Optimized implementations
- Type safety: Template-based
- Reusability: Generic code
- Standardization: Consistent interface

Mastering STL enables writing cleaner, more efficient C++ code and reduces the need to implement common data structures and algorithms from scratch.

