# Lesson 11: Templates and Generic Programming in C++

## Overview

Templates are one of C++'s most powerful features, enabling generic programming where code can work with any data type without modification. Templates allow you to write functions and classes that operate on generic types, providing type safety while maintaining code reusability. This lesson covers function templates, class templates, template specialization, and advanced template concepts with mathematical examples.

## Function Templates

Function templates allow you to write a single function that works with multiple data types.

### Basic Function Template

```cpp
#include <iostream>

template <typename T>
T maximum(T a, T b) {
    return (a > b) ? a : b;
}

int main() {
    std::cout << "Max of 5 and 10: " << maximum(5, 10) << std::endl;
    std::cout << "Max of 3.5 and 2.1: " << maximum(3.5, 2.1) << std::endl;
    std::cout << "Max of 'a' and 'z': " << maximum('a', 'z') << std::endl;
    
    return 0;
}
```

### Template with Multiple Parameters

```cpp
#include <iostream>

template <typename T, typename U>
auto add(T a, U b) -> decltype(a + b) {
    return a + b;
}

int main() {
    std::cout << "5 + 3.5 = " << add(5, 3.5) << std::endl;
    std::cout << "2.7 + 4 = " << add(2.7, 4) << std::endl;
    
    return 0;
}
```

## Mathematical Template Functions

### Vector Operations Template

```cpp
#include <iostream>
#include <vector>
#include <cmath>

template <typename T>
class Vector {
private:
    std::vector<T> data;
    
public:
    Vector(const std::vector<T>& vec) : data(vec) {}
    
    // Dot product: a · b = Σ(a_i × b_i)
    static T dotProduct(const Vector<T>& a, const Vector<T>& b) {
        if (a.data.size() != b.data.size()) {
            throw std::invalid_argument("Vectors must have same size");
        }
        
        T result = T(0);
        for (size_t i = 0; i < a.data.size(); i++) {
            result += a.data[i] * b.data[i];
        }
        return result;
    }
    
    // Euclidean norm: ||v|| = √(Σv_i²)
    static double euclideanNorm(const Vector<T>& vec) {
        double sumSquares = 0;
        for (const auto& val : vec.data) {
            sumSquares += static_cast<double>(val * val);
        }
        return std::sqrt(sumSquares);
    }
    
    // Cosine similarity: cos(θ) = (a·b) / (||a|| × ||b||)
    static double cosineSimilarity(const Vector<T>& a, const Vector<T>& b) {
        T dot = dotProduct(a, b);
        double normA = euclideanNorm(a);
        double normB = euclideanNorm(b);
        
        if (normA == 0 || normB == 0) {
            return 0.0;
        }
        
        return static_cast<double>(dot) / (normA * normB);
    }
    
    // Scalar multiplication
    Vector<T> operator*(T scalar) const {
        std::vector<T> result;
        for (const auto& val : data) {
            result.push_back(val * scalar);
        }
        return Vector<T>(result);
    }
    
    // Vector addition
    Vector<T> operator+(const Vector<T>& other) const {
        if (data.size() != other.data.size()) {
            throw std::invalid_argument("Vectors must have same size");
        }
        
        std::vector<T> result;
        for (size_t i = 0; i < data.size(); i++) {
            result.push_back(data[i] + other.data[i]);
        }
        return Vector<T>(result);
    }
    
    void print() const {
        std::cout << "[";
        for (size_t i = 0; i < data.size(); i++) {
            std::cout << data[i];
            if (i < data.size() - 1) std::cout << ", ";
        }
        std::cout << "]" << std::endl;
    }
};

int main() {
    Vector<int> v1({1, 2, 3});
    Vector<int> v2({4, 5, 6});
    
    std::cout << "Vector 1: ";
    v1.print();
    std::cout << "Vector 2: ";
    v2.print();
    
    int dot = Vector<int>::dotProduct(v1, v2);
    std::cout << "Dot product: " << dot << std::endl;
    
    double norm1 = Vector<int>::euclideanNorm(v1);
    std::cout << "||v1|| = " << norm1 << std::endl;
    
    double similarity = Vector<int>::cosineSimilarity(v1, v2);
    std::cout << "Cosine similarity: " << similarity << std::endl;
    
    Vector<int> v3 = v1 + v2;
    std::cout << "v1 + v2 = ";
    v3.print();
    
    Vector<int> v4 = v1 * 2;
    std::cout << "v1 * 2 = ";
    v4.print();
    
    return 0;
}
```

## Class Templates

Class templates allow you to define classes that work with generic types.

### Template Stack Class

```cpp
#include <iostream>
#include <vector>
#include <stdexcept>

template <typename T>
class Stack {
private:
    std::vector<T> elements;
    
public:
    void push(const T& element) {
        elements.push_back(element);
    }
    
    void pop() {
        if (elements.empty()) {
            throw std::runtime_error("Stack is empty");
        }
        elements.pop_back();
    }
    
    T top() const {
        if (elements.empty()) {
            throw std::runtime_error("Stack is empty");
        }
        return elements.back();
    }
    
    bool empty() const {
        return elements.empty();
    }
    
    size_t size() const {
        return elements.size();
    }
};

int main() {
    Stack<int> intStack;
    intStack.push(10);
    intStack.push(20);
    intStack.push(30);
    
    std::cout << "Top element: " << intStack.top() << std::endl;
    std::cout << "Stack size: " << intStack.size() << std::endl;
    
    intStack.pop();
    std::cout << "After pop, top: " << intStack.top() << std::endl;
    
    Stack<double> doubleStack;
    doubleStack.push(3.14);
    doubleStack.push(2.71);
    std::cout << "Double stack top: " << doubleStack.top() << std::endl;
    
    return 0;
}
```

## Template Matrix Class

```cpp
#include <iostream>
#include <vector>
#include <stdexcept>
#include <iomanip>

template <typename T>
class Matrix {
private:
    std::vector<std::vector<T>> data;
    size_t rows;
    size_t cols;
    
public:
    Matrix(size_t r, size_t c) : rows(r), cols(c) {
        data.resize(rows, std::vector<T>(cols, T(0)));
    }
    
    Matrix(const std::vector<std::vector<T>>& d) : data(d) {
        rows = data.size();
        cols = rows > 0 ? data[0].size() : 0;
    }
    
    T& operator()(size_t i, size_t j) {
        if (i >= rows || j >= cols) {
            throw std::out_of_range("Matrix index out of range");
        }
        return data[i][j];
    }
    
    const T& operator()(size_t i, size_t j) const {
        if (i >= rows || j >= cols) {
            throw std::out_of_range("Matrix index out of range");
        }
        return data[i][j];
    }
    
    Matrix<T> operator+(const Matrix<T>& other) const {
        if (rows != other.rows || cols != other.cols) {
            throw std::invalid_argument("Matrix dimensions must match");
        }
        
        Matrix<T> result(rows, cols);
        for (size_t i = 0; i < rows; i++) {
            for (size_t j = 0; j < cols; j++) {
                result(i, j) = data[i][j] + other(i, j);
            }
        }
        return result;
    }
    
    Matrix<T> operator*(const Matrix<T>& other) const {
        if (cols != other.rows) {
            throw std::invalid_argument("Invalid dimensions for multiplication");
        }
        
        Matrix<T> result(rows, other.cols);
        for (size_t i = 0; i < rows; i++) {
            for (size_t j = 0; j < other.cols; j++) {
                T sum = T(0);
                for (size_t k = 0; k < cols; k++) {
                    sum += data[i][k] * other(k, j);
                }
                result(i, j) = sum;
            }
        }
        return result;
    }
    
    Matrix<T> operator*(T scalar) const {
        Matrix<T> result(rows, cols);
        for (size_t i = 0; i < rows; i++) {
            for (size_t j = 0; j < cols; j++) {
                result(i, j) = data[i][j] * scalar;
            }
        }
        return result;
    }
    
    // Transpose
    Matrix<T> transpose() const {
        Matrix<T> result(cols, rows);
        for (size_t i = 0; i < rows; i++) {
            for (size_t j = 0; j < cols; j++) {
                result(j, i) = data[i][j];
            }
        }
        return result;
    }
    
    // Trace (sum of diagonal elements)
    T trace() const {
        if (rows != cols) {
            throw std::invalid_argument("Matrix must be square");
        }
        T sum = T(0);
        for (size_t i = 0; i < rows; i++) {
            sum += data[i][i];
        }
        return sum;
    }
    
    void print() const {
        for (size_t i = 0; i < rows; i++) {
            for (size_t j = 0; j < cols; j++) {
                std::cout << std::setw(8) << data[i][j] << " ";
            }
            std::cout << std::endl;
        }
    }
    
    size_t getRows() const { return rows; }
    size_t getCols() const { return cols; }
};

int main() {
    Matrix<int> A({{1, 2, 3}, {4, 5, 6}});
    Matrix<int> B({{7, 8}, {9, 10}, {11, 12}});
    
    std::cout << "Matrix A:" << std::endl;
    A.print();
    
    std::cout << "\nMatrix B:" << std::endl;
    B.print();
    
    Matrix<int> C = A * B;
    std::cout << "\nA × B:" << std::endl;
    C.print();
    
    Matrix<int> D({{1, 2}, {3, 4}});
    std::cout << "\nTrace of D: " << D.trace() << std::endl;
    
    Matrix<double> E({{1.5, 2.5}, {3.5, 4.5}});
    std::cout << "\nMatrix E:" << std::endl;
    E.print();
    std::cout << "Trace of E: " << E.trace() << std::endl;
    
    return 0;
}
```

## Template Specialization

Template specialization allows you to provide a specific implementation for particular types.

### Complete Specialization

```cpp
#include <iostream>
#include <cstring>

template <typename T>
void swapValues(T& a, T& b) {
    T temp = a;
    a = b;
    b = temp;
}

// Specialization for character arrays
template <>
void swapValues<char*>(char*& a, char*& b) {
    size_t lenA = std::strlen(a);
    size_t lenB = std::strlen(b);
    
    char* temp = new char[std::max(lenA, lenB) + 1];
    std::strcpy(temp, a);
    std::strcpy(a, b);
    std::strcpy(b, temp);
    delete[] temp;
}

int main() {
    int x = 5, y = 10;
    swapValues(x, y);
    std::cout << "x = " << x << ", y = " << y << std::endl;
    
    double a = 3.14, b = 2.71;
    swapValues(a, b);
    std::cout << "a = " << a << ", b = " << b << std::endl;
    
    return 0;
}
```

### Partial Specialization (for classes)

```cpp
#include <iostream>

template <typename T>
class MyClass {
public:
    void print() {
        std::cout << "Generic template" << std::endl;
    }
};

template <typename T>
class MyClass<T*> {
public:
    void print() {
        std::cout << "Partial specialization for pointers" << std::endl;
    }
};

template <>
class MyClass<int> {
public:
    void print() {
        std::cout << "Complete specialization for int" << std::endl;
    }
};

int main() {
    MyClass<double> obj1;
    obj1.print();
    
    MyClass<int*> obj2;
    obj2.print();
    
    MyClass<int> obj3;
    obj3.print();
    
    return 0;
}
```

## Variadic Templates

Variadic templates allow functions to accept a variable number of arguments.

```cpp
#include <iostream>

// Base case
void print() {
    std::cout << std::endl;
}

// Recursive case
template <typename T, typename... Args>
void print(T first, Args... args) {
    std::cout << first << " ";
    print(args...);
}

// Sum of variable arguments
template <typename T>
T sum(T value) {
    return value;
}

template <typename T, typename... Args>
T sum(T first, Args... args) {
    return first + sum(args...);
}

int main() {
    print(1, 2, 3, "Hello", 4.5);
    
    int result = sum(1, 2, 3, 4, 5);
    std::cout << "Sum: " << result << std::endl;
    
    double result2 = sum(1.5, 2.5, 3.5);
    std::cout << "Sum: " << result2 << std::endl;
    
    return 0;
}
```

## Template Metaprogramming

Template metaprogramming allows computation at compile-time.

### Compile-Time Factorial

```cpp
#include <iostream>

template <int N>
struct Factorial {
    static const long long value = N * Factorial<N - 1>::value;
};

template <>
struct Factorial<0> {
    static const long long value = 1;
};

int main() {
    std::cout << "Factorial of 5: " << Factorial<5>::value << std::endl;
    std::cout << "Factorial of 10: " << Factorial<10>::value << std::endl;
    
    // This is computed at compile-time!
    const long long result = Factorial<7>::value;
    std::cout << "Factorial of 7: " << result << std::endl;
    
    return 0;
}
```

### Compile-Time GCD

```cpp
#include <iostream>

template <int A, int B>
struct GCD {
    static const int value = GCD<B, A % B>::value;
};

template <int A>
struct GCD<A, 0> {
    static const int value = A;
};

int main() {
    std::cout << "GCD(48, 18): " << GCD<48, 18>::value << std::endl;
    std::cout << "GCD(100, 25): " << GCD<100, 25>::value << std::endl;
    std::cout << "GCD(17, 5): " << GCD<17, 5>::value << std::endl;
    
    return 0;
}
```

## Type Traits

Type traits provide information about types at compile-time.

```cpp
#include <iostream>
#include <type_traits>

template <typename T>
void printTypeInfo() {
    std::cout << "Type: " << typeid(T).name() << std::endl;
    std::cout << "  Is integral: " << std::is_integral<T>::value << std::endl;
    std::cout << "  Is floating point: " << std::is_floating_point<T>::value << std::endl;
    std::cout << "  Is arithmetic: " << std::is_arithmetic<T>::value << std::endl;
    std::cout << "  Size: " << sizeof(T) << " bytes" << std::endl;
}

template <typename T>
typename std::enable_if<std::is_arithmetic<T>::value, T>::type
square(T value) {
    return value * value;
}

int main() {
    printTypeInfo<int>();
    printTypeInfo<double>();
    printTypeInfo<char>();
    
    std::cout << "\nSquare of 5: " << square(5) << std::endl;
    std::cout << "Square of 3.5: " << square(3.5) << std::endl;
    
    return 0;
}
```

## Summary

Templates enable powerful generic programming:

1. **Function Templates**: Generic functions for any type
2. **Class Templates**: Generic classes for reusable data structures
3. **Template Specialization**: Custom implementations for specific types
4. **Variadic Templates**: Variable number of arguments
5. **Template Metaprogramming**: Compile-time computation
6. **Type Traits**: Compile-time type information

Key concepts:
- Templates provide type safety with code reuse
- Compile-time evaluation enables optimization
- Specialization allows custom behavior for specific types
- Type traits enable conditional compilation
- Generic programming reduces code duplication

Mastering templates enables writing highly reusable, efficient, and type-safe C++ code that works with any data type while maintaining performance.

