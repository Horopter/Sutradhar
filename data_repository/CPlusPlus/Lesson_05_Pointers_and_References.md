# Lesson 5: Pointers and References in C++

## Overview

Pointers and references are powerful C++ features that provide direct memory access and enable efficient data manipulation. Understanding pointers is crucial for advanced C++ programming, dynamic memory management, and working with complex data structures. This lesson covers pointer fundamentals, memory management, and practical applications including mathematical computations.

## Understanding Memory Addresses

Every variable in C++ is stored in memory at a specific address. A pointer is a variable that stores the memory address of another variable.

### Basic Pointer Concepts

```cpp
#include <iostream>

int main() {
    int x = 42;
    int* ptr = &x;  // ptr stores the address of x
    
    std::cout << "Value of x: " << x << std::endl;
    std::cout << "Address of x: " << &x << std::endl;
    std::cout << "Value of ptr (address): " << ptr << std::endl;
    std::cout << "Value at address stored in ptr: " << *ptr << std::endl;
    
    return 0;
}
```

### Pointer Declaration and Operations

```cpp
#include <iostream>

int main() {
    int num = 100;
    int* p1 = &num;      // Pointer to int
    int** p2 = &p1;      // Pointer to pointer
    
    std::cout << "num = " << num << std::endl;
    std::cout << "*p1 = " << *p1 << std::endl;
    std::cout << "**p2 = " << **p2 << std::endl;
    
    // Modifying value through pointer
    *p1 = 200;
    std::cout << "After *p1 = 200, num = " << num << std::endl;
    
    return 0;
}
```

## Pointer Arithmetic

Pointers support arithmetic operations that work in units of the type they point to.

### Array Access Using Pointers

```cpp
#include <iostream>

int main() {
    int arr[5] = {10, 20, 30, 40, 50};
    int* ptr = arr;  // Points to first element
    
    std::cout << "Array elements using pointer arithmetic:" << std::endl;
    for (int i = 0; i < 5; i++) {
        std::cout << "arr[" << i << "] = " << *(ptr + i) << std::endl;
        std::cout << "Address: " << (ptr + i) << std::endl;
    }
    
    return 0;
}
```

### Calculating Array Sum Using Pointers

```cpp
#include <iostream>

int sumArray(int* arr, int size) {
    int sum = 0;
    for (int i = 0; i < size; i++) {
        sum += *(arr + i);
    }
    return sum;
}

int main() {
    int numbers[] = {1, 2, 3, 4, 5};
    int size = 5;
    
    int total = sumArray(numbers, size);
    std::cout << "Sum of array elements: " << total << std::endl;
    
    return 0;
}
```

## Dynamic Memory Allocation

### `new` and `delete` Operators

```cpp
#include <iostream>

int main() {
    // Allocate single integer
    int* ptr = new int(42);
    std::cout << "Dynamically allocated value: " << *ptr << std::endl;
    delete ptr;
    
    // Allocate array
    int size;
    std::cout << "Enter array size: ";
    std::cin >> size;
    
    int* arr = new int[size];
    
    std::cout << "Enter " << size << " values: ";
    for (int i = 0; i < size; i++) {
        std::cin >> arr[i];
    }
    
    std::cout << "Array elements: ";
    for (int i = 0; i < size; i++) {
        std::cout << arr[i] << " ";
    }
    std::cout << std::endl;
    
    delete[] arr;  // Deallocate array
    
    return 0;
}
```

### Dynamic 2D Array Allocation

```cpp
#include <iostream>

int main() {
    int rows, cols;
    std::cout << "Enter rows and columns: ";
    std::cin >> rows >> cols;
    
    // Allocate 2D array
    int** matrix = new int*[rows];
    for (int i = 0; i < rows; i++) {
        matrix[i] = new int[cols];
    }
    
    // Initialize matrix
    int value = 1;
    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < cols; j++) {
            matrix[i][j] = value++;
        }
    }
    
    // Print matrix
    std::cout << "Matrix:" << std::endl;
    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < cols; j++) {
            std::cout << matrix[i][j] << " ";
        }
        std::cout << std::endl;
    }
    
    // Deallocate
    for (int i = 0; i < rows; i++) {
        delete[] matrix[i];
    }
    delete[] matrix;
    
    return 0;
}
```

## References

References are aliases for existing variables and provide an alternative to pointers for parameter passing.

### Reference Basics

```cpp
#include <iostream>

int main() {
    int x = 10;
    int& ref = x;  // ref is an alias for x
    
    std::cout << "x = " << x << std::endl;
    std::cout << "ref = " << ref << std::endl;
    
    ref = 20;  // Modifies x
    std::cout << "After ref = 20, x = " << x << std::endl;
    
    return 0;
}
```

### Passing by Reference

```cpp
#include <iostream>

void swap(int& a, int& b) {
    int temp = a;
    a = b;
    b = temp;
}

int main() {
    int x = 5, y = 10;
    std::cout << "Before swap: x = " << x << ", y = " << y << std::endl;
    swap(x, y);
    std::cout << "After swap: x = " << x << ", y = " << y << std::endl;
    return 0;
}
```

## Pointers to Functions

Function pointers allow storing and calling functions dynamically.

### Mathematical Operations Using Function Pointers

```cpp
#include <iostream>
#include <cmath>

double add(double a, double b) { return a + b; }
double subtract(double a, double b) { return a - b; }
double multiply(double a, double b) { return a * b; }
double divide(double a, double b) { return (b != 0) ? a / b : 0; }

double power(double a, double b) { return std::pow(a, b); }
double squareRoot(double a, double b) { return std::sqrt(a); }

int main() {
    double x, y;
    char operation;
    
    std::cout << "Enter two numbers: ";
    std::cin >> x >> y;
    
    std::cout << "Enter operation (+, -, *, /, ^, s for sqrt): ";
    std::cin >> operation;
    
    double (*funcPtr)(double, double) = nullptr;
    
    switch (operation) {
        case '+': funcPtr = add; break;
        case '-': funcPtr = subtract; break;
        case '*': funcPtr = multiply; break;
        case '/': funcPtr = divide; break;
        case '^': funcPtr = power; break;
        case 's': funcPtr = squareRoot; break;
        default: std::cout << "Invalid operation!" << std::endl; return 1;
    }
    
    double result = funcPtr(x, y);
    std::cout << "Result: " << result << std::endl;
    
    return 0;
}
```

## Mathematical Applications

### Numerical Integration Using Function Pointers

Approximating \( \int_a^b f(x)dx \) using Simpson's Rule:

\[ \int_a^b f(x)dx \approx \frac{h}{3}[f(a) + 4f(a+h) + 2f(a+2h) + \ldots + f(b)] \]

where \( h = \frac{b-a}{n} \) and n must be even.

```cpp
#include <iostream>
#include <cmath>
#include <iomanip>

// Function to integrate
double f(double x) {
    return x * x;  // x^2
}

double simpsonsRule(double (*func)(double), double a, double b, int n) {
    if (n % 2 != 0) n++;  // Ensure n is even
    
    double h = (b - a) / n;
    double sum = func(a) + func(b);
    
    for (int i = 1; i < n; i++) {
        double x = a + i * h;
        if (i % 2 == 0) {
            sum += 2 * func(x);
        } else {
            sum += 4 * func(x);
        }
    }
    
    return (h / 3.0) * sum;
}

int main() {
    double a, b;
    int n;
    
    std::cout << "Enter lower limit (a): ";
    std::cin >> a;
    std::cout << "Enter upper limit (b): ";
    std::cin >> b;
    std::cout << "Enter number of intervals (n, must be even): ";
    std::cin >> n;
    
    double result = simpsonsRule(f, a, b, n);
    double exact = (std::pow(b, 3) - std::pow(a, 3)) / 3.0;
    
    std::cout << std::fixed << std::setprecision(6);
    std::cout << "Approximate integral: " << result << std::endl;
    std::cout << "Exact integral: " << exact << std::endl;
    std::cout << "Error: " << std::abs(result - exact) << std::endl;
    
    return 0;
}
```

### Matrix Operations Using Pointers

```cpp
#include <iostream>

void multiplyMatrices(int** a, int** b, int** result, int rows1, int cols1, int cols2) {
    for (int i = 0; i < rows1; i++) {
        for (int j = 0; j < cols2; j++) {
            result[i][j] = 0;
            for (int k = 0; k < cols1; k++) {
                result[i][j] += a[i][k] * b[k][j];
            }
        }
    }
}

void printMatrix(int** matrix, int rows, int cols) {
    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < cols; j++) {
            std::cout << matrix[i][j] << " ";
        }
        std::cout << std::endl;
    }
}

int main() {
    int rows1 = 2, cols1 = 3, cols2 = 2;
    
    // Allocate and initialize matrix A
    int** matrixA = new int*[rows1];
    for (int i = 0; i < rows1; i++) {
        matrixA[i] = new int[cols1];
        for (int j = 0; j < cols1; j++) {
            matrixA[i][j] = i * cols1 + j + 1;
        }
    }
    
    // Allocate and initialize matrix B
    int** matrixB = new int*[cols1];
    for (int i = 0; i < cols1; i++) {
        matrixB[i] = new int[cols2];
        for (int j = 0; j < cols2; j++) {
            matrixB[i][j] = i * cols2 + j + 1;
        }
    }
    
    // Allocate result matrix
    int** result = new int*[rows1];
    for (int i = 0; i < rows1; i++) {
        result[i] = new int[cols2];
    }
    
    multiplyMatrices(matrixA, matrixB, result, rows1, cols1, cols2);
    
    std::cout << "Matrix A:" << std::endl;
    printMatrix(matrixA, rows1, cols1);
    
    std::cout << "\nMatrix B:" << std::endl;
    printMatrix(matrixB, cols1, cols2);
    
    std::cout << "\nResult (A × B):" << std::endl;
    printMatrix(result, rows1, cols2);
    
    // Deallocate memory
    for (int i = 0; i < rows1; i++) {
        delete[] matrixA[i];
        delete[] result[i];
    }
    for (int i = 0; i < cols1; i++) {
        delete[] matrixB[i];
    }
    delete[] matrixA;
    delete[] matrixB;
    delete[] result;
    
    return 0;
}
```

## Smart Pointers (C++11 and later)

Smart pointers automatically manage memory, preventing memory leaks.

### `unique_ptr`

```cpp
#include <iostream>
#include <memory>

int main() {
    std::unique_ptr<int> ptr1(new int(42));
    std::cout << "Value: " << *ptr1 << std::endl;
    
    // Automatically deallocated when out of scope
    return 0;
}
```

### `shared_ptr`

```cpp
#include <iostream>
#include <memory>

int main() {
    std::shared_ptr<int> ptr1 = std::make_shared<int>(42);
    std::shared_ptr<int> ptr2 = ptr1;  // Both share ownership
    
    std::cout << "Use count: " << ptr1.use_count() << std::endl;
    std::cout << "Value: " << *ptr1 << std::endl;
    
    return 0;  // Automatically deallocated when all references are gone
}
```

## Common Pointer Pitfalls

### Null Pointer Dereference

```cpp
int* ptr = nullptr;
// *ptr = 10;  // ERROR: Dereferencing null pointer

// Always check before dereferencing
if (ptr != nullptr) {
    *ptr = 10;
}
```

### Memory Leaks

```cpp
void function() {
    int* ptr = new int(42);
    // Memory leak if delete is not called before function returns
    delete ptr;  // Always deallocate
}
```

### Dangling Pointers

```cpp
int* ptr;
{
    int x = 10;
    ptr = &x;
}  // x is destroyed here
// ptr now points to invalid memory - dangling pointer!
```

## Summary

Pointers and references are essential for:

1. **Dynamic Memory Management**: Allocating/deallocating memory at runtime
2. **Efficient Parameter Passing**: Avoiding copying large objects
3. **Data Structures**: Building linked lists, trees, graphs
4. **Function Pointers**: Enabling flexible function calls
5. **System Programming**: Direct memory access

Key concepts:
- Pointer declaration and dereferencing
- Pointer arithmetic for arrays
- Dynamic memory allocation (`new`/`delete`)
- References as aliases
- Function pointers for callbacks
- Smart pointers for automatic memory management
- Common pitfalls and best practices

Mastering pointers is crucial for advanced C++ programming and understanding how computers manage memory.

