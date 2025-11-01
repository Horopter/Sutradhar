# Lesson 4: Arrays and Vectors in C++

## Overview

Arrays and vectors are fundamental data structures that allow you to store and manipulate collections of elements. Arrays provide fixed-size containers, while vectors offer dynamic resizing capabilities. Understanding these structures is crucial for handling multiple data items efficiently in C++ programs.

## Arrays

An array is a collection of elements of the same type stored in contiguous memory locations. Arrays have a fixed size that must be known at compile time.

### Array Declaration and Initialization

```cpp
// Declaration
int arr[5];  // Array of 5 integers (uninitialized)

// Initialization
int arr[5] = {1, 2, 3, 4, 5};
int arr[] = {1, 2, 3};  // Size automatically determined
int arr[5] = {1, 2};    // Remaining elements are 0
```

### Basic Array Operations

```cpp
#include <iostream>

int main() {
    int numbers[5] = {10, 20, 30, 40, 50};
    
    // Accessing elements (0-indexed)
    std::cout << "First element: " << numbers[0] << std::endl;
    std::cout << "Last element: " << numbers[4] << std::endl;
    
    // Modifying elements
    numbers[2] = 35;
    
    // Traversing array
    std::cout << "Array elements: ";
    for (int i = 0; i < 5; i++) {
        std::cout << numbers[i] << " ";
    }
    std::cout << std::endl;
    
    return 0;
}
```

## Mathematical Operations on Arrays

### Finding Sum and Average

```cpp
#include <iostream>

int main() {
    double numbers[10];
    int n;
    
    std::cout << "Enter number of elements (max 10): ";
    std::cin >> n;
    
    std::cout << "Enter " << n << " numbers: ";
    for (int i = 0; i < n; i++) {
        std::cin >> numbers[i];
    }
    
    double sum = 0;
    for (int i = 0; i < n; i++) {
        sum += numbers[i];
    }
    
    double average = sum / n;
    
    std::cout << "Sum: " << sum << std::endl;
    std::cout << "Average: " << average << std::endl;
    
    return 0;
}
```

### Finding Maximum and Minimum

```cpp
#include <iostream>
#include <limits>

int main() {
    int arr[100];
    int n;
    
    std::cout << "Enter number of elements: ";
    std::cin >> n;
    
    std::cout << "Enter " << n << " elements: ";
    for (int i = 0; i < n; i++) {
        std::cin >> arr[i];
    }
    
    int max = arr[0];
    int min = arr[0];
    
    for (int i = 1; i < n; i++) {
        if (arr[i] > max) {
            max = arr[i];
        }
        if (arr[i] < min) {
            min = arr[i];
        }
    }
    
    std::cout << "Maximum: " << max << std::endl;
    std::cout << "Minimum: " << min << std::endl;
    std::cout << "Range: " << (max - min) << std::endl;
    
    return 0;
}
```

### Calculating Variance and Standard Deviation

Variance: \( \sigma^2 = \frac{1}{n}\sum_{i=1}^{n}(x_i - \mu)^2 \)

Standard Deviation: \( \sigma = \sqrt{\sigma^2} \)

```cpp
#include <iostream>
#include <cmath>

int main() {
    double data[100];
    int n;
    
    std::cout << "Enter number of data points: ";
    std::cin >> n;
    
    std::cout << "Enter " << n << " values: ";
    for (int i = 0; i < n; i++) {
        std::cin >> data[i];
    }
    
    // Calculate mean
    double sum = 0;
    for (int i = 0; i < n; i++) {
        sum += data[i];
    }
    double mean = sum / n;
    
    // Calculate variance
    double variance = 0;
    for (int i = 0; i < n; i++) {
        variance += std::pow(data[i] - mean, 2);
    }
    variance /= n;
    
    // Calculate standard deviation
    double stdDev = std::sqrt(variance);
    
    std::cout << "Mean: " << mean << std::endl;
    std::cout << "Variance: " << variance << std::endl;
    std::cout << "Standard Deviation: " << stdDev << std::endl;
    
    return 0;
}
```

## Searching Algorithms

### Linear Search

```cpp
#include <iostream>

int linearSearch(int arr[], int size, int target) {
    for (int i = 0; i < size; i++) {
        if (arr[i] == target) {
            return i;  // Return index if found
        }
    }
    return -1;  // Return -1 if not found
}

int main() {
    int arr[] = {10, 20, 30, 40, 50};
    int size = 5;
    int target;
    
    std::cout << "Enter number to search: ";
    std::cin >> target;
    
    int index = linearSearch(arr, size, target);
    
    if (index != -1) {
        std::cout << "Found at index: " << index << std::endl;
    } else {
        std::cout << "Not found!" << std::endl;
    }
    
    return 0;
}
```

### Binary Search (Requires Sorted Array)

Binary search has time complexity O(log n).

```cpp
#include <iostream>

int binarySearch(int arr[], int size, int target) {
    int left = 0;
    int right = size - 1;
    
    while (left <= right) {
        int mid = left + (right - left) / 2;
        
        if (arr[mid] == target) {
            return mid;
        } else if (arr[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    
    return -1;
}

int main() {
    int arr[] = {10, 20, 30, 40, 50, 60, 70};
    int size = 7;
    int target;
    
    std::cout << "Enter number to search: ";
    std::cin >> target;
    
    int index = binarySearch(arr, size, target);
    
    if (index != -1) {
        std::cout << "Found at index: " << index << std::endl;
    } else {
        std::cout << "Not found!" << std::endl;
    }
    
    return 0;
}
```

## Sorting Algorithms

### Bubble Sort

```cpp
#include <iostream>

void bubbleSort(int arr[], int size) {
    for (int i = 0; i < size - 1; i++) {
        for (int j = 0; j < size - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                // Swap
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}

int main() {
    int arr[] = {64, 34, 25, 12, 22, 11, 90};
    int size = 7;
    
    std::cout << "Original array: ";
    for (int i = 0; i < size; i++) {
        std::cout << arr[i] << " ";
    }
    std::cout << std::endl;
    
    bubbleSort(arr, size);
    
    std::cout << "Sorted array: ";
    for (int i = 0; i < size; i++) {
        std::cout << arr[i] << " ";
    }
    std::cout << std::endl;
    
    return 0;
}
```

### Selection Sort

```cpp
#include <iostream>

void selectionSort(int arr[], int size) {
    for (int i = 0; i < size - 1; i++) {
        int minIndex = i;
        for (int j = i + 1; j < size; j++) {
            if (arr[j] < arr[minIndex]) {
                minIndex = j;
            }
        }
        // Swap
        int temp = arr[i];
        arr[i] = arr[minIndex];
        arr[minIndex] = temp;
    }
}

int main() {
    int arr[] = {64, 34, 25, 12, 22, 11, 90};
    int size = 7;
    
    std::cout << "Original array: ";
    for (int i = 0; i < size; i++) {
        std::cout << arr[i] << " ";
    }
    std::cout << std::endl;
    
    selectionSort(arr, size);
    
    std::cout << "Sorted array: ";
    for (int i = 0; i < size; i++) {
        std::cout << arr[i] << " ";
    }
    std::cout << std::endl;
    
    return 0;
}
```

## Multidimensional Arrays

### 2D Arrays (Matrices)

```cpp
#include <iostream>

const int ROWS = 3;
const int COLS = 3;

void printMatrix(int matrix[][COLS], int rows) {
    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < COLS; j++) {
            std::cout << matrix[i][j] << " ";
        }
        std::cout << std::endl;
    }
}

int main() {
    int matrix[ROWS][COLS] = {
        {1, 2, 3},
        {4, 5, 6},
        {7, 8, 9}
    };
    
    std::cout << "Matrix:" << std::endl;
    printMatrix(matrix, ROWS);
    
    return 0;
}
```

### Matrix Addition

For matrices A and B: \( C_{ij} = A_{ij} + B_{ij} \)

```cpp
#include <iostream>

const int SIZE = 3;

void addMatrices(int a[][SIZE], int b[][SIZE], int result[][SIZE]) {
    for (int i = 0; i < SIZE; i++) {
        for (int j = 0; j < SIZE; j++) {
            result[i][j] = a[i][j] + b[i][j];
        }
    }
}

void printMatrix(int matrix[][SIZE]) {
    for (int i = 0; i < SIZE; i++) {
        for (int j = 0; j < SIZE; j++) {
            std::cout << matrix[i][j] << " ";
        }
        std::cout << std::endl;
    }
}

int main() {
    int matrix1[SIZE][SIZE] = {{1, 2, 3}, {4, 5, 6}, {7, 8, 9}};
    int matrix2[SIZE][SIZE] = {{9, 8, 7}, {6, 5, 4}, {3, 2, 1}};
    int result[SIZE][SIZE];
    
    addMatrices(matrix1, matrix2, result);
    
    std::cout << "Matrix 1:" << std::endl;
    printMatrix(matrix1);
    
    std::cout << "\nMatrix 2:" << std::endl;
    printMatrix(matrix2);
    
    std::cout << "\nSum:" << std::endl;
    printMatrix(result);
    
    return 0;
}
```

### Matrix Multiplication

For matrices A (m×n) and B (n×p): \( C_{ij} = \sum_{k=1}^{n} A_{ik} \times B_{kj} \)

```cpp
#include <iostream>

const int ROWS = 3;
const int COLS = 3;

void multiplyMatrices(int a[][COLS], int b[][COLS], int result[][COLS]) {
    for (int i = 0; i < ROWS; i++) {
        for (int j = 0; j < COLS; j++) {
            result[i][j] = 0;
            for (int k = 0; k < COLS; k++) {
                result[i][j] += a[i][k] * b[k][j];
            }
        }
    }
}

void printMatrix(int matrix[][COLS]) {
    for (int i = 0; i < ROWS; i++) {
        for (int j = 0; j < COLS; j++) {
            std::cout << matrix[i][j] << " ";
        }
        std::cout << std::endl;
    }
}

int main() {
    int matrix1[ROWS][COLS] = {{1, 2, 3}, {4, 5, 6}, {7, 8, 9}};
    int matrix2[ROWS][COLS] = {{9, 8, 7}, {6, 5, 4}, {3, 2, 1}};
    int result[ROWS][COLS];
    
    multiplyMatrices(matrix1, matrix2, result);
    
    std::cout << "Matrix 1:" << std::endl;
    printMatrix(matrix1);
    
    std::cout << "\nMatrix 2:" << std::endl;
    printMatrix(matrix2);
    
    std::cout << "\nProduct:" << std::endl;
    printMatrix(result);
    
    return 0;
}
```

## Vectors (Dynamic Arrays)

Vectors are part of the Standard Template Library (STL) and provide dynamic arrays that can resize automatically.

### Basic Vector Operations

```cpp
#include <iostream>
#include <vector>

int main() {
    // Declaration and initialization
    std::vector<int> numbers;
    std::vector<int> vec1(5);           // Vector of size 5
    std::vector<int> vec2(5, 10);       // Vector of size 5, all values 10
    std::vector<int> vec3 = {1, 2, 3, 4, 5};
    
    // Adding elements
    numbers.push_back(10);
    numbers.push_back(20);
    numbers.push_back(30);
    
    // Accessing elements
    std::cout << "First element: " << numbers[0] << std::endl;
    std::cout << "Size: " << numbers.size() << std::endl;
    
    // Traversing vector
    std::cout << "Vector elements: ";
    for (size_t i = 0; i < numbers.size(); i++) {
        std::cout << numbers[i] << " ";
    }
    std::cout << std::endl;
    
    // Using range-based for loop
    std::cout << "Using range-based loop: ";
    for (int num : numbers) {
        std::cout << num << " ";
    }
    std::cout << std::endl;
    
    return 0;
}
```

### Vector Mathematical Operations

```cpp
#include <iostream>
#include <vector>
#include <numeric>
#include <algorithm>
#include <cmath>

int main() {
    std::vector<double> data;
    int n;
    
    std::cout << "Enter number of elements: ";
    std::cin >> n;
    
    std::cout << "Enter " << n << " values: ";
    for (int i = 0; i < n; i++) {
        double value;
        std::cin >> value;
        data.push_back(value);
    }
    
    // Calculate sum using accumulate
    double sum = std::accumulate(data.begin(), data.end(), 0.0);
    double mean = sum / data.size();
    
    // Find min and max
    auto minmax = std::minmax_element(data.begin(), data.end());
    double min = *minmax.first;
    double max = *minmax.second;
    
    // Calculate variance
    double variance = 0;
    for (double val : data) {
        variance += std::pow(val - mean, 2);
    }
    variance /= data.size();
    double stdDev = std::sqrt(variance);
    
    std::cout << "Sum: " << sum << std::endl;
    std::cout << "Mean: " << mean << std::endl;
    std::cout << "Min: " << min << std::endl;
    std::cout << "Max: " << max << std::endl;
    std::cout << "Variance: " << variance << std::endl;
    std::cout << "Standard Deviation: " << stdDev << std::endl;
    
    return 0;
}
```

## Summary

Arrays and vectors are essential for:

1. **Storing Collections**: Multiple related data items
2. **Mathematical Operations**: Statistics, matrix operations
3. **Algorithms**: Sorting, searching
4. **Efficient Data Handling**: Accessing elements by index

Key concepts:
- Fixed-size arrays vs dynamic vectors
- Index-based access (0-indexed)
- Common algorithms (search, sort)
- Multidimensional arrays for matrices
- STL vectors for dynamic sizing
- Mathematical applications (statistics, linear algebra)

Practice with various array operations and mathematical problems to master these fundamental data structures.

