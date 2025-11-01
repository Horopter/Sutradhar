# Lesson 1: Introduction to C++

## Overview

C++ is a general-purpose programming language developed by Bjarne Stroustrup at Bell Labs in the early 1980s. It extends the C programming language with object-oriented programming capabilities while maintaining compatibility with C. C++ is known for its performance, flexibility, and wide range of applications from system programming to game development.

## History and Evolution

C++ was originally called "C with Classes" and was designed to add object-oriented features to C without sacrificing performance. The language has evolved through multiple standards: C++98, C++03, C++11, C++14, C++17, C++20, and C++23. Each standard has introduced new features and improvements, making C++ a modern, powerful language while maintaining backward compatibility.

## Setting Up Your Environment

To start programming in C++, you need a compiler. Popular options include:
- **GCC (GNU Compiler Collection)**: Available on Linux and can be installed on macOS and Windows
- **Clang**: Modern compiler with excellent error messages
- **MSVC (Microsoft Visual C++)**: The standard on Windows
- **Integrated Development Environments**: Visual Studio, Code::Blocks, CLion, or VS Code with extensions

### Basic Compilation

A simple C++ program is compiled using:
```bash
g++ -o program program.cpp
./program
```

## Your First C++ Program

Let's start with the classic "Hello, World!" program:

```cpp
#include <iostream>

int main() {
    std::cout << "Hello, World!" << std::endl;
    return 0;
}
```

### Program Breakdown

1. **`#include <iostream>`**: Preprocessor directive that includes the input/output stream library
2. **`int main()`**: The main function where program execution begins. Returns an integer (0 indicates success)
3. **`std::cout`**: Standard output stream object
4. **`<<`**: Stream insertion operator
5. **`std::endl`**: Inserts a newline and flushes the buffer

## Variables and Data Types

C++ provides several fundamental data types:

### Integer Types
- `int`: Typically 32 bits, range: -2,147,483,648 to 2,147,483,647
- `short`: At least 16 bits
- `long`: At least 32 bits
- `long long`: At least 64 bits

### Floating-Point Types
- `float`: Typically 32 bits, precision ~7 decimal digits
- `double`: Typically 64 bits, precision ~15 decimal digits
- `long double`: Extended precision

### Character and Boolean
- `char`: 8 bits, represents a single character
- `bool`: Can be `true` or `false`

### Example: Variable Declarations

```cpp
#include <iostream>
#include <string>

int main() {
    int age = 25;
    double height = 5.9;
    char grade = 'A';
    bool isStudent = true;
    std::string name = "Alice";
    
    std::cout << "Name: " << name << std::endl;
    std::cout << "Age: " << age << std::endl;
    std::cout << "Height: " << height << " feet" << std::endl;
    std::cout << "Grade: " << grade << std::endl;
    std::cout << "Is Student: " << (isStudent ? "Yes" : "No") << std::endl;
    
    return 0;
}
```

## Input and Output

### Taking User Input

```cpp
#include <iostream>
#include <string>

int main() {
    std::string name;
    int age;
    
    std::cout << "Enter your name: ";
    std::getline(std::cin, name);
    
    std::cout << "Enter your age: ";
    std::cin >> age;
    
    std::cout << "Hello, " << name << "! You are " << age << " years old." << std::endl;
    
    return 0;
}
```

## Mathematical Operations

C++ supports standard arithmetic operations: addition (`+`), subtraction (`-`), multiplication (`*`), division (`/`), and modulus (`%`).

### Mathematical Example: Calculating Compound Interest

The formula for compound interest is:
\[ A = P \left(1 + \frac{r}{n}\right)^{nt} \]

Where:
- \(A\) = Final amount
- \(P\) = Principal (initial amount)
- \(r\) = Annual interest rate (decimal)
- \(n\) = Number of times interest compounds per year
- \(t\) = Time in years

```cpp
#include <iostream>
#include <cmath>
#include <iomanip>

int main() {
    double principal, rate, time, amount;
    int compoundsPerYear;
    
    std::cout << "Enter principal amount: $";
    std::cin >> principal;
    
    std::cout << "Enter annual interest rate (as decimal, e.g., 0.05 for 5%): ";
    std::cin >> rate;
    
    std::cout << "Enter number of times interest compounds per year: ";
    std::cin >> compoundsPerYear;
    
    std::cout << "Enter time in years: ";
    std::cin >> time;
    
    // Calculate compound interest using the formula
    double base = 1.0 + (rate / compoundsPerYear);
    double exponent = compoundsPerYear * time;
    amount = principal * std::pow(base, exponent);
    
    double interest = amount - principal;
    
    std::cout << std::fixed << std::setprecision(2);
    std::cout << "\nResults:" << std::endl;
    std::cout << "Principal: $" << principal << std::endl;
    std::cout << "Final Amount: $" << amount << std::endl;
    std::cout << "Interest Earned: $" << interest << std::endl;
    
    return 0;
}
```

## Mathematical Concepts in Programming

### Order of Operations

C++ follows standard mathematical order of operations (PEMDAS):
1. Parentheses
2. Exponents
3. Multiplication/Division (left to right)
4. Addition/Subtraction (left to right)

```cpp
int result = 2 + 3 * 4;        // Result: 14 (not 20)
int result2 = (2 + 3) * 4;     // Result: 20
```

### Type Conversion

C++ performs implicit type conversion, but explicit casting is often safer:

```cpp
int a = 5;
int b = 2;
double result = static_cast<double>(a) / b;  // Result: 2.5 (not 2)
```

## Constants and Literals

### Constants

Use `const` keyword to create read-only variables:

```cpp
const double PI = 3.14159;
const int MAX_SIZE = 100;

// PI = 3.14;  // Error: cannot modify const
```

### Mathematical Constants Example

```cpp
#include <iostream>
#include <cmath>

int main() {
    const double PI = 3.14159265359;
    double radius;
    
    std::cout << "Enter radius: ";
    std::cin >> radius;
    
    double area = PI * radius * radius;           // Area of circle: πr²
    double circumference = 2 * PI * radius;       // Circumference: 2πr
    double volume = (4.0 / 3.0) * PI * std::pow(radius, 3);  // Volume of sphere: (4/3)πr³
    
    std::cout << "Circle Area: " << area << std::endl;
    std::cout << "Circumference: " << circumference << std::endl;
    std::cout << "Sphere Volume: " << volume << std::endl;
    
    return 0;
}
```

## Basic Program Structure

### Formatting and Style

Good programming practices include:
- Meaningful variable names
- Consistent indentation (typically 2 or 4 spaces)
- Comments for complex logic
- Organizing code into logical sections

### Example: Temperature Converter

```cpp
#include <iostream>
#include <iomanip>

// Convert Fahrenheit to Celsius
// Formula: C = (F - 32) * 5/9
double fahrenheitToCelsius(double fahrenheit) {
    return (fahrenheit - 32.0) * 5.0 / 9.0;
}

// Convert Celsius to Fahrenheit
// Formula: F = C * 9/5 + 32
double celsiusToFahrenheit(double celsius) {
    return celsius * 9.0 / 5.0 + 32.0;
}

int main() {
    double temp;
    char unit;
    
    std::cout << "Enter temperature: ";
    std::cin >> temp;
    
    std::cout << "Enter unit (F for Fahrenheit, C for Celsius): ";
    std::cin >> unit;
    
    std::cout << std::fixed << std::setprecision(2);
    
    if (unit == 'F' || unit == 'f') {
        double celsius = fahrenheitToCelsius(temp);
        std::cout << temp << "°F = " << celsius << "°C" << std::endl;
    } else if (unit == 'C' || unit == 'c') {
        double fahrenheit = celsiusToFahrenheit(temp);
        std::cout << temp << "°C = " << fahrenheit << "°F" << std::endl;
    } else {
        std::cout << "Invalid unit!" << std::endl;
    }
    
    return 0;
}
```

## Common Mathematical Functions

The `<cmath>` library provides many useful functions:

```cpp
#include <cmath>

double x = 25.0;
double sqrt_x = std::sqrt(x);        // Square root: 5.0
double pow_x = std::pow(x, 2);       // Power: 625.0
double log_x = std::log(x);          // Natural logarithm
double sin_x = std::sin(3.14159/2);  // Sine (in radians)
double cos_x = std::cos(0);          // Cosine: 1.0
double abs_x = std::abs(-25);        // Absolute value: 25
double ceil_x = std::ceil(4.3);      // Ceiling: 5.0
double floor_x = std::floor(4.7);    // Floor: 4.0
```

## Practice Exercise: Quadratic Equation Solver

The quadratic formula solves equations of the form \(ax^2 + bx + c = 0\):

\[ x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a} \]

The discriminant (\(b^2 - 4ac\)) determines the nature of roots:
- If discriminant > 0: Two real and distinct roots
- If discriminant = 0: One real root (repeated)
- If discriminant < 0: Two complex roots

```cpp
#include <iostream>
#include <cmath>
#include <iomanip>
#include <complex>

int main() {
    double a, b, c;
    
    std::cout << "Quadratic Equation Solver: ax² + bx + c = 0" << std::endl;
    std::cout << "Enter coefficient a: ";
    std::cin >> a;
    
    if (a == 0) {
        std::cout << "Error: 'a' cannot be zero (not a quadratic equation)!" << std::endl;
        return 1;
    }
    
    std::cout << "Enter coefficient b: ";
    std::cin >> b;
    
    std::cout << "Enter coefficient c: ";
    std::cin >> c;
    
    // Calculate discriminant
    double discriminant = b * b - 4 * a * c;
    
    std::cout << std::fixed << std::setprecision(4);
    std::cout << "\nEquation: " << a << "x² + " << b << "x + " << c << " = 0" << std::endl;
    std::cout << "Discriminant: " << discriminant << std::endl;
    
    if (discriminant > 0) {
        // Two real and distinct roots
        double root1 = (-b + std::sqrt(discriminant)) / (2 * a);
        double root2 = (-b - std::sqrt(discriminant)) / (2 * a);
        
        std::cout << "Roots: Two real and distinct roots" << std::endl;
        std::cout << "Root 1: " << root1 << std::endl;
        std::cout << "Root 2: " << root2 << std::endl;
    } else if (discriminant == 0) {
        // One real root (repeated)
        double root = -b / (2 * a);
        
        std::cout << "Root: One real root (repeated)" << std::endl;
        std::cout << "Root: " << root << std::endl;
    } else {
        // Two complex roots
        double realPart = -b / (2 * a);
        double imaginaryPart = std::sqrt(-discriminant) / (2 * a);
        
        std::cout << "Roots: Two complex roots" << std::endl;
        std::cout << "Root 1: " << realPart << " + " << imaginaryPart << "i" << std::endl;
        std::cout << "Root 2: " << realPart << " - " << imaginaryPart << "i" << std::endl;
    }
    
    return 0;
}
```

## Summary

In this lesson, we've covered:
- Introduction to C++ and its history
- Setting up the development environment
- Basic program structure and "Hello, World!"
- Fundamental data types and variables
- Input/output operations
- Arithmetic operations and mathematical functions
- Constants and type conversion
- Practical examples including compound interest, temperature conversion, and quadratic equation solving

C++ provides a solid foundation for learning programming concepts. The mathematical examples demonstrate how programming can solve real-world problems. As you continue, you'll learn about control structures, functions, arrays, and object-oriented programming concepts that build upon these fundamentals.

## Next Steps

Practice writing programs that:
1. Calculate various mathematical formulas
2. Convert between different units
3. Solve algebraic equations
4. Work with different data types and understand type conversions

The key to mastering C++ is consistent practice and understanding the mathematical foundations that underlie many programming problems.

