# Lesson 3: Functions and Modularity in C++

## Overview

Functions are fundamental building blocks in C++ that allow you to encapsulate code into reusable, organized modules. They enable code reuse, improve readability, and make programs easier to maintain. Understanding functions, their parameters, return types, and scope is crucial for writing efficient and organized C++ programs.

## What are Functions?

A function is a named block of code that performs a specific task. Functions help break down complex problems into smaller, manageable pieces following the mathematical principle of decomposition.

### Function Syntax

```cpp
returnType functionName(parameter1, parameter2, ...) {
    // Function body
    return value;  // if returnType is not void
}
```

## Basic Function Examples

### Example: Simple Function Without Parameters

```cpp
#include <iostream>

void greet() {
    std::cout << "Hello, welcome to C++ programming!" << std::endl;
}

int main() {
    greet();  // Function call
    return 0;
}
```

### Example: Function with Parameters and Return Value

```cpp
#include <iostream>

// Function to calculate area of a rectangle
// Mathematical formula: Area = length × width
double calculateRectangleArea(double length, double width) {
    return length * width;
}

int main() {
    double len, wid;
    std::cout << "Enter length: ";
    std::cin >> len;
    std::cout << "Enter width: ";
    std::cin >> wid;
    
    double area = calculateRectangleArea(len, wid);
    std::cout << "Area of rectangle: " << area << std::endl;
    
    return 0;
}
```

## Function Parameters

### Pass by Value

When parameters are passed by value, a copy of the argument is made.

```cpp
#include <iostream>

void increment(int x) {
    x++;  // This only modifies the copy
    std::cout << "Inside function, x = " << x << std::endl;
}

int main() {
    int num = 5;
    increment(num);
    std::cout << "In main, num = " << num << std::endl;
    // Output: Inside function, x = 6
    //         In main, num = 5 (unchanged)
    return 0;
}
```

### Pass by Reference

Pass by reference allows the function to modify the original variable.

```cpp
#include <iostream>

void increment(int& x) {
    x++;  // Modifies the original variable
    std::cout << "Inside function, x = " << x << std::endl;
}

int main() {
    int num = 5;
    increment(num);
    std::cout << "In main, num = " << num << std::endl;
    // Output: Inside function, x = 6
    //         In main, num = 6 (changed)
    return 0;
}
```

### Pass by Pointer

Pointers provide another way to modify arguments.

```cpp
#include <iostream>

void swap(int* a, int* b) {
    int temp = *a;
    *a = *b;
    *b = temp;
}

int main() {
    int x = 5, y = 10;
    std::cout << "Before swap: x = " << x << ", y = " << y << std::endl;
    swap(&x, &y);
    std::cout << "After swap: x = " << x << ", y = " << y << std::endl;
    return 0;
}
```

## Mathematical Functions

### Distance Between Two Points

The distance formula in 2D: \( d = \sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2} \)

```cpp
#include <iostream>
#include <cmath>

double distance(double x1, double y1, double x2, double y2) {
    double dx = x2 - x1;
    double dy = y2 - y1;
    return std::sqrt(dx * dx + dy * dy);
}

int main() {
    double x1, y1, x2, y2;
    std::cout << "Enter first point (x1 y1): ";
    std::cin >> x1 >> y1;
    std::cout << "Enter second point (x2 y2): ";
    std::cin >> x2 >> y2;
    
    double dist = distance(x1, y1, x2, y2);
    std::cout << "Distance: " << dist << std::endl;
    
    return 0;
}
```

### Volume and Surface Area of a Sphere

Formulas:
- Volume: \( V = \frac{4}{3}\pi r^3 \)
- Surface Area: \( A = 4\pi r^2 \)

```cpp
#include <iostream>
#include <cmath>

const double PI = 3.14159265359;

double sphereVolume(double radius) {
    return (4.0 / 3.0) * PI * std::pow(radius, 3);
}

double sphereSurfaceArea(double radius) {
    return 4.0 * PI * radius * radius;
}

int main() {
    double radius;
    std::cout << "Enter radius of sphere: ";
    std::cin >> radius;
    
    double volume = sphereVolume(radius);
    double surfaceArea = sphereSurfaceArea(radius);
    
    std::cout << "Volume: " << volume << std::endl;
    std::cout << "Surface Area: " << surfaceArea << std::endl;
    
    return 0;
}
```

## Recursive Functions

A recursive function calls itself to solve a problem by breaking it into smaller instances of the same problem.

### Factorial Using Recursion

Mathematical definition: \( n! = n \times (n-1)! \) where \( 0! = 1 \)

```cpp
#include <iostream>

long long factorial(int n) {
    // Base case
    if (n <= 1) {
        return 1;
    }
    // Recursive case
    return n * factorial(n - 1);
}

int main() {
    int n;
    std::cout << "Enter a number: ";
    std::cin >> n;
    
    if (n < 0) {
        std::cout << "Factorial is not defined for negative numbers." << std::endl;
        return 1;
    }
    
    std::cout << n << "! = " << factorial(n) << std::endl;
    return 0;
}
```

### Fibonacci Sequence Using Recursion

Fibonacci: \( F(n) = F(n-1) + F(n-2) \), with \( F(0) = 0 \) and \( F(1) = 1 \)

```cpp
#include <iostream>

long long fibonacci(int n) {
    // Base cases
    if (n == 0) return 0;
    if (n == 1) return 1;
    
    // Recursive case
    return fibonacci(n - 1) + fibonacci(n - 2);
}

int main() {
    int n;
    std::cout << "Enter n: ";
    std::cin >> n;
    
    if (n < 0) {
        std::cout << "Invalid input!" << std::endl;
        return 1;
    }
    
    std::cout << "Fibonacci sequence up to " << n << ":" << std::endl;
    for (int i = 0; i <= n; i++) {
        std::cout << "F(" << i << ") = " << fibonacci(i) << std::endl;
    }
    
    return 0;
}
```

### Greatest Common Divisor (GCD) Using Recursion

Euclidean algorithm: \( \gcd(a, b) = \gcd(b, a \bmod b) \)

```cpp
#include <iostream>

int gcd(int a, int b) {
    // Base case
    if (b == 0) {
        return a;
    }
    // Recursive case
    return gcd(b, a % b);
}

int main() {
    int a, b;
    std::cout << "Enter two numbers: ";
    std::cin >> a >> b;
    
    int result = gcd(a, b);
    std::cout << "GCD of " << a << " and " << b << " is " << result << std::endl;
    
    return 0;
}
```

## Function Overloading

C++ allows multiple functions with the same name but different parameters.

```cpp
#include <iostream>
#include <cmath>

// Area of rectangle
double area(double length, double width) {
    return length * width;
}

// Area of circle
double area(double radius) {
    return M_PI * radius * radius;
}

// Area of triangle (using Heron's formula)
double area(double a, double b, double c) {
    double s = (a + b + c) / 2.0;
    return std::sqrt(s * (s - a) * (s - b) * (s - c));
}

int main() {
    std::cout << "Rectangle area (5, 3): " << area(5.0, 3.0) << std::endl;
    std::cout << "Circle area (radius 4): " << area(4.0) << std::endl;
    std::cout << "Triangle area (3, 4, 5): " << area(3.0, 4.0, 5.0) << std::endl;
    
    return 0;
}
```

## Default Parameters

Functions can have default parameter values.

```cpp
#include <iostream>

double power(double base, int exponent = 2) {
    double result = 1.0;
    for (int i = 0; i < exponent; i++) {
        result *= base;
    }
    return result;
}

int main() {
    std::cout << "5^2 = " << power(5.0) << std::endl;      // Uses default exponent of 2
    std::cout << "5^3 = " << power(5.0, 3) << std::endl;   // Uses exponent 3
    
    return 0;
}
```

## Inline Functions

Inline functions suggest the compiler to expand the function code inline, potentially improving performance for small functions.

```cpp
#include <iostream>

inline int square(int x) {
    return x * x;
}

int main() {
    int num = 5;
    std::cout << "Square of " << num << " = " << square(num) << std::endl;
    return 0;
}
```

## Mathematical Series: Taylor Series for e^x

The exponential function can be approximated using: \( e^x = \sum_{n=0}^{\infty} \frac{x^n}{n!} \)

```cpp
#include <iostream>
#include <cmath>
#include <iomanip>

double factorial(int n) {
    if (n <= 1) return 1.0;
    double result = 1.0;
    for (int i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

double expTaylor(double x, int terms = 10) {
    double sum = 0.0;
    for (int n = 0; n < terms; n++) {
        sum += std::pow(x, n) / factorial(n);
    }
    return sum;
}

int main() {
    double x;
    std::cout << "Enter value of x: ";
    std::cin >> x;
    
    int terms;
    std::cout << "Enter number of terms: ";
    std::cin >> terms;
    
    double approximation = expTaylor(x, terms);
    double actual = std::exp(x);
    
    std::cout << std::fixed << std::setprecision(10);
    std::cout << "Approximation: " << approximation << std::endl;
    std::cout << "Actual value: " << actual << std::endl;
    std::cout << "Error: " << std::abs(approximation - actual) << std::endl;
    
    return 0;
}
```

## Integration: Numerical Integration Using Trapezoidal Rule

The trapezoidal rule approximates: \( \int_a^b f(x)dx \approx \frac{h}{2}[f(a) + 2\sum_{i=1}^{n-1}f(x_i) + f(b)] \)

where \( h = \frac{b-a}{n} \)

```cpp
#include <iostream>
#include <cmath>
#include <iomanip>

// Function to integrate: f(x) = x^2
double f(double x) {
    return x * x;
}

double trapezoidalRule(double a, double b, int n) {
    double h = (b - a) / n;
    double sum = (f(a) + f(b)) / 2.0;
    
    for (int i = 1; i < n; i++) {
        double x = a + i * h;
        sum += f(x);
    }
    
    return h * sum;
}

int main() {
    double a, b;
    int n;
    
    std::cout << "Enter lower limit (a): ";
    std::cin >> a;
    std::cout << "Enter upper limit (b): ";
    std::cin >> b;
    std::cout << "Enter number of intervals (n): ";
    std::cin >> n;
    
    double result = trapezoidalRule(a, b, n);
    
    // Exact value for x^2: [x^3/3] from a to b = (b^3 - a^3) / 3
    double exact = (std::pow(b, 3) - std::pow(a, 3)) / 3.0;
    
    std::cout << std::fixed << std::setprecision(6);
    std::cout << "Approximate integral: " << result << std::endl;
    std::cout << "Exact integral: " << exact << std::endl;
    std::cout << "Error: " << std::abs(result - exact) << std::endl;
    
    return 0;
}
```

## Function Templates

Templates allow functions to work with different data types.

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

## Summary

Functions are essential for:

1. **Code Reusability**: Write once, use multiple times
2. **Modularity**: Break complex problems into smaller parts
3. **Readability**: Make code more understandable
4. **Maintainability**: Easier to update and debug

Key concepts covered:
- Function definition and calling
- Parameter passing (value, reference, pointer)
- Return types and void functions
- Recursive functions for mathematical problems
- Function overloading
- Default parameters
- Mathematical applications (distance, volume, series, integration)

Practice creating functions for various mathematical operations and algorithms to master this fundamental concept.

