# Lesson 10: Exception Handling in C++

## Overview

Exception handling is a mechanism in C++ that allows programs to respond to runtime errors gracefully. Instead of allowing the program to crash, exceptions provide a structured way to detect, report, and handle errors. Understanding exception handling is crucial for building robust, fault-tolerant applications.

## Basic Exception Handling

### Try-Catch Blocks

```cpp
#include <iostream>
#include <stdexcept>

int divide(int a, int b) {
    if (b == 0) {
        throw std::runtime_error("Division by zero!");
    }
    return a / b;
}

int main() {
    try {
        int result = divide(10, 0);
        std::cout << "Result: " << result << std::endl;
    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << std::endl;
    }
    
    return 0;
}
```

## Exception Types

C++ provides standard exception classes:

```cpp
#include <iostream>
#include <stdexcept>
#include <string>

void demonstrateExceptions() {
    try {
        // Logic error
        throw std::logic_error("Logic error occurred");
    } catch (const std::logic_error& e) {
        std::cout << "Logic error: " << e.what() << std::endl;
    }
    
    try {
        // Runtime error
        throw std::runtime_error("Runtime error occurred");
    } catch (const std::runtime_error& e) {
        std::cout << "Runtime error: " << e.what() << std::endl;
    }
    
    try {
        // Invalid argument
        throw std::invalid_argument("Invalid argument");
    } catch (const std::invalid_argument& e) {
        std::cout << "Invalid argument: " << e.what() << std::endl;
    }
    
    try {
        // Out of range
        throw std::out_of_range("Index out of range");
    } catch (const std::out_of_range& e) {
        std::cout << "Out of range: " << e.what() << std::endl;
    }
}
```

## Multiple Catch Blocks

```cpp
#include <iostream>
#include <stdexcept>

int main() {
    try {
        // Some operation that might throw different exceptions
        int value = -5;
        if (value < 0) {
            throw std::invalid_argument("Value cannot be negative");
        }
        if (value > 100) {
            throw std::out_of_range("Value exceeds maximum");
        }
    } catch (const std::invalid_argument& e) {
        std::cerr << "Invalid argument: " << e.what() << std::endl;
    } catch (const std::out_of_range& e) {
        std::cerr << "Out of range: " << e.what() << std::endl;
    } catch (const std::exception& e) {
        std::cerr << "Standard exception: " << e.what() << std::endl;
    } catch (...) {
        std::cerr << "Unknown exception occurred" << std::endl;
    }
    
    return 0;
}
```

## Custom Exception Classes

```cpp
#include <iostream>
#include <exception>
#include <string>

class MathException : public std::exception {
private:
    std::string message;
    
public:
    MathException(const std::string& msg) : message(msg) {}
    
    const char* what() const noexcept override {
        return message.c_str();
    }
};

class NegativeNumberException : public MathException {
public:
    NegativeNumberException() : MathException("Negative number not allowed") {}
};

class DivisionByZeroException : public MathException {
public:
    DivisionByZeroException() : MathException("Division by zero not allowed") {}
};

double safeSquareRoot(double value) {
    if (value < 0) {
        throw NegativeNumberException();
    }
    return std::sqrt(value);
}

double safeDivide(double numerator, double denominator) {
    if (denominator == 0) {
        throw DivisionByZeroException();
    }
    return numerator / denominator;
}

int main() {
    try {
        double result1 = safeSquareRoot(-4);
    } catch (const NegativeNumberException& e) {
        std::cerr << "Error: " << e.what() << std::endl;
    }
    
    try {
        double result2 = safeDivide(10, 0);
    } catch (const DivisionByZeroException& e) {
        std::cerr << "Error: " << e.what() << std::endl;
    }
    
    return 0;
}
```

## Exception Safety

### RAII (Resource Acquisition Is Initialization)

RAII ensures resources are properly released even when exceptions occur.

```cpp
#include <iostream>
#include <memory>

class Resource {
public:
    Resource() {
        std::cout << "Resource acquired" << std::endl;
    }
    
    ~Resource() {
        std::cout << "Resource released" << std::endl;
    }
    
    void doSomething() {
        std::cout << "Using resource" << std::endl;
        throw std::runtime_error("Error during operation");
    }
};

void functionWithException() {
    Resource resource;  // RAII: resource managed automatically
    resource.doSomething();  // Exception thrown here
    // Destructor still called automatically
}

int main() {
    try {
        functionWithException();
    } catch (const std::exception& e) {
        std::cerr << "Caught: " << e.what() << std::endl;
    }
    // Resource destructor is called even though exception was thrown
    return 0;
}
```

## Mathematical Calculator with Exception Handling

```cpp
#include <iostream>
#include <stdexcept>
#include <cmath>
#include <string>

class Calculator {
public:
    static double add(double a, double b) {
        return a + b;
    }
    
    static double subtract(double a, double b) {
        return a - b;
    }
    
    static double multiply(double a, double b) {
        return a * b;
    }
    
    static double divide(double a, double b) {
        if (b == 0) {
            throw std::runtime_error("Division by zero is undefined");
        }
        return a / b;
    }
    
    static double power(double base, double exponent) {
        if (base == 0 && exponent < 0) {
            throw std::runtime_error("Zero to negative power is undefined");
        }
        if (base < 0 && std::fmod(exponent, 1) != 0) {
            throw std::runtime_error("Negative base with non-integer exponent");
        }
        return std::pow(base, exponent);
    }
    
    static double squareRoot(double value) {
        if (value < 0) {
            throw std::domain_error("Square root of negative number is not real");
        }
        return std::sqrt(value);
    }
    
    static double logarithm(double value, double base) {
        if (value <= 0) {
            throw std::domain_error("Logarithm of non-positive number is undefined");
        }
        if (base <= 0 || base == 1) {
            throw std::domain_error("Invalid logarithm base");
        }
        return std::log(value) / std::log(base);
    }
    
    static double factorial(int n) {
        if (n < 0) {
            throw std::domain_error("Factorial of negative number is undefined");
        }
        if (n > 20) {
            throw std::overflow_error("Factorial too large for int");
        }
        
        long long result = 1;
        for (int i = 2; i <= n; i++) {
            result *= i;
        }
        return static_cast<double>(result);
    }
};

void performCalculation() {
    double a, b;
    char operation;
    
    std::cout << "Enter first number: ";
    std::cin >> a;
    
    std::cout << "Enter operation (+, -, *, /, ^, s for sqrt, l for log, f for factorial): ";
    std::cin >> operation;
    
    try {
        double result;
        
        switch (operation) {
            case '+':
                std::cout << "Enter second number: ";
                std::cin >> b;
                result = Calculator::add(a, b);
                std::cout << a << " + " << b << " = " << result << std::endl;
                break;
                
            case '-':
                std::cout << "Enter second number: ";
                std::cin >> b;
                result = Calculator::subtract(a, b);
                std::cout << a << " - " << b << " = " << result << std::endl;
                break;
                
            case '*':
                std::cout << "Enter second number: ";
                std::cin >> b;
                result = Calculator::multiply(a, b);
                std::cout << a << " * " << b << " = " << result << std::endl;
                break;
                
            case '/':
                std::cout << "Enter second number: ";
                std::cin >> b;
                result = Calculator::divide(a, b);
                std::cout << a << " / " << b << " = " << result << std::endl;
                break;
                
            case '^':
                std::cout << "Enter exponent: ";
                std::cin >> b;
                result = Calculator::power(a, b);
                std::cout << a << " ^ " << b << " = " << result << std::endl;
                break;
                
            case 's':
                result = Calculator::squareRoot(a);
                std::cout << "sqrt(" << a << ") = " << result << std::endl;
                break;
                
            case 'l':
                std::cout << "Enter base: ";
                std::cin >> b;
                result = Calculator::logarithm(a, b);
                std::cout << "log_" << b << "(" << a << ") = " << result << std::endl;
                break;
                
            case 'f':
                result = Calculator::factorial(static_cast<int>(a));
                std::cout << static_cast<int>(a) << "! = " << result << std::endl;
                break;
                
            default:
                std::cout << "Invalid operation!" << std::endl;
        }
    } catch (const std::domain_error& e) {
        std::cerr << "Domain Error: " << e.what() << std::endl;
    } catch (const std::overflow_error& e) {
        std::cerr << "Overflow Error: " << e.what() << std::endl;
    } catch (const std::runtime_error& e) {
        std::cerr << "Runtime Error: " << e.what() << std::endl;
    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << std::endl;
    }
}

int main() {
    performCalculation();
    return 0;
}
```

## Exception Handling in File Operations

```cpp
#include <iostream>
#include <fstream>
#include <stdexcept>
#include <string>

class FileHandler {
public:
    static void readFile(const std::string& filename) {
        std::ifstream file(filename);
        
        if (!file.is_open()) {
            throw std::runtime_error("Could not open file: " + filename);
        }
        
        std::string line;
        int lineNumber = 1;
        
        while (std::getline(file, line)) {
            std::cout << lineNumber << ": " << line << std::endl;
            lineNumber++;
            
            // Simulate processing error
            if (lineNumber > 100) {
                throw std::runtime_error("File too large to process");
            }
        }
        
        file.close();
    }
    
    static void writeFile(const std::string& filename, const std::string& content) {
        std::ofstream file(filename);
        
        if (!file.is_open()) {
            throw std::runtime_error("Could not create file: " + filename);
        }
        
        file << content;
        
        if (file.fail()) {
            file.close();
            throw std::runtime_error("Failed to write to file: " + filename);
        }
        
        file.close();
    }
};

int main() {
    try {
        FileHandler::readFile("nonexistent.txt");
    } catch (const std::exception& e) {
        std::cerr << "File operation failed: " << e.what() << std::endl;
    }
    
    return 0;
}
```

## Summary

Exception handling enables robust error management:

1. **Try-Catch Blocks**: Structured error handling
2. **Standard Exceptions**: Predefined exception types
3. **Custom Exceptions**: User-defined error types
4. **RAII**: Automatic resource management
5. **Exception Safety**: Ensuring program stability

Key concepts:
- `try` blocks contain code that might throw
- `catch` blocks handle specific exceptions
- Multiple catch blocks handle different exception types
- Custom exceptions provide domain-specific errors
- RAII ensures proper resource cleanup
- Always catch by reference to avoid slicing

Proper exception handling makes programs more robust, maintainable, and user-friendly by gracefully handling unexpected situations.

