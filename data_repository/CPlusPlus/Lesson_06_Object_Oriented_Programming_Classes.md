# Lesson 6: Object-Oriented Programming - Classes in C++

## Overview

Object-Oriented Programming (OOP) is a programming paradigm that organizes code around objects rather than functions. Classes are the foundation of OOP in C++, allowing you to encapsulate data and methods together. This lesson covers class definition, member variables, member functions, constructors, destructors, and access modifiers, with mathematical examples demonstrating OOP principles.

## Introduction to Classes

A class is a blueprint for creating objects. It defines the structure and behavior that objects of that class will have.

### Basic Class Definition

```cpp
#include <iostream>
#include <string>

class Rectangle {
private:
    double length;
    double width;

public:
    // Constructor
    Rectangle(double l, double w) {
        length = l;
        width = w;
    }
    
    // Member functions
    double area() {
        return length * width;
    }
    
    double perimeter() {
        return 2 * (length + width);
    }
    
    void display() {
        std::cout << "Length: " << length << ", Width: " << width << std::endl;
        std::cout << "Area: " << area() << std::endl;
        std::cout << "Perimeter: " << perimeter() << std::endl;
    }
};

int main() {
    Rectangle rect(5.0, 3.0);
    rect.display();
    return 0;
}
```

## Access Modifiers

C++ provides three access modifiers: `private`, `public`, and `protected`.

### Private, Public, and Protected

```cpp
#include <iostream>

class BankAccount {
private:
    double balance;  // Only accessible within the class
    
protected:
    int accountNumber;  // Accessible in class and derived classes
    
public:
    BankAccount(int accNum, double initialBalance) {
        accountNumber = accNum;
        balance = initialBalance;
    }
    
    void deposit(double amount) {
        if (amount > 0) {
            balance += amount;
        }
    }
    
    bool withdraw(double amount) {
        if (amount > 0 && amount <= balance) {
            balance -= amount;
            return true;
        }
        return false;
    }
    
    double getBalance() const {
        return balance;  // Read-only access
    }
};

int main() {
    BankAccount account(12345, 1000.0);
    account.deposit(500.0);
    account.withdraw(200.0);
    std::cout << "Balance: $" << account.getBalance() << std::endl;
    return 0;
}
```

## Constructors and Destructors

### Constructors

Constructors initialize objects when they are created.

```cpp
#include <iostream>

class Point {
private:
    double x, y;

public:
    // Default constructor
    Point() {
        x = 0;
        y = 0;
    }
    
    // Parameterized constructor
    Point(double xVal, double yVal) {
        x = xVal;
        y = yVal;
    }
    
    // Copy constructor
    Point(const Point& p) {
        x = p.x;
        y = p.y;
    }
    
    double getX() const { return x; }
    double getY() const { return y; }
    
    void setX(double xVal) { x = xVal; }
    void setY(double yVal) { y = yVal; }
};

int main() {
    Point p1;              // Default constructor
    Point p2(3.0, 4.0);    // Parameterized constructor
    Point p3(p2);          // Copy constructor
    
    std::cout << "p1: (" << p1.getX() << ", " << p1.getY() << ")" << std::endl;
    std::cout << "p2: (" << p2.getX() << ", " << p2.getY() << ")" << std::endl;
    std::cout << "p3: (" << p3.getX() << ", " << p3.getY() << ")" << std::endl;
    
    return 0;
}
```

### Destructors

Destructors clean up resources when objects are destroyed.

```cpp
#include <iostream>

class DynamicArray {
private:
    int* data;
    int size;

public:
    DynamicArray(int s) {
        size = s;
        data = new int[size];
        std::cout << "Array allocated with size " << size << std::endl;
    }
    
    ~DynamicArray() {
        delete[] data;
        std::cout << "Array deallocated" << std::endl;
    }
    
    void setValue(int index, int value) {
        if (index >= 0 && index < size) {
            data[index] = value;
        }
    }
    
    int getValue(int index) const {
        if (index >= 0 && index < size) {
            return data[index];
        }
        return -1;
    }
};

int main() {
    {
        DynamicArray arr(5);
        for (int i = 0; i < 5; i++) {
            arr.setValue(i, i * 10);
        }
        // Destructor called automatically when arr goes out of scope
    }
    std::cout << "Array destroyed" << std::endl;
    return 0;
}
```

## Mathematical Class Examples

### Circle Class with Mathematical Operations

```cpp
#include <iostream>
#include <cmath>
#include <iomanip>

class Circle {
private:
    double radius;
    static const double PI;

public:
    Circle(double r) {
        if (r < 0) {
            radius = 0;
        } else {
            radius = r;
        }
    }
    
    double area() const {
        return PI * radius * radius;  // πr²
    }
    
    double circumference() const {
        return 2 * PI * radius;  // 2πr
    }
    
    double diameter() const {
        return 2 * radius;
    }
    
    double getRadius() const {
        return radius;
    }
    
    void setRadius(double r) {
        if (r >= 0) {
            radius = r;
        }
    }
    
    // Calculate sector area: (θ/360) × πr²
    double sectorArea(double angleDegrees) const {
        return (angleDegrees / 360.0) * area();
    }
    
    // Calculate arc length: (θ/360) × 2πr
    double arcLength(double angleDegrees) const {
        return (angleDegrees / 360.0) * circumference();
    }
};

const double Circle::PI = 3.14159265359;

int main() {
    Circle c(5.0);
    
    std::cout << std::fixed << std::setprecision(4);
    std::cout << "Circle Properties:" << std::endl;
    std::cout << "Radius: " << c.getRadius() << std::endl;
    std::cout << "Area: " << c.area() << std::endl;
    std::cout << "Circumference: " << c.circumference() << std::endl;
    std::cout << "Diameter: " << c.diameter() << std::endl;
    
    std::cout << "\nSector (60 degrees):" << std::endl;
    std::cout << "Sector Area: " << c.sectorArea(60) << std::endl;
    std::cout << "Arc Length: " << c.arcLength(60) << std::endl;
    
    return 0;
}
```

### Complex Number Class

Complex numbers have the form \( a + bi \), where \( i = \sqrt{-1} \).

```cpp
#include <iostream>
#include <cmath>
#include <iomanip>

class Complex {
private:
    double real;
    double imaginary;

public:
    Complex(double r = 0, double i = 0) : real(r), imaginary(i) {}
    
    double getReal() const { return real; }
    double getImaginary() const { return imaginary; }
    
    // Addition: (a+bi) + (c+di) = (a+c) + (b+d)i
    Complex add(const Complex& other) const {
        return Complex(real + other.real, imaginary + other.imaginary);
    }
    
    // Subtraction: (a+bi) - (c+di) = (a-c) + (b-d)i
    Complex subtract(const Complex& other) const {
        return Complex(real - other.real, imaginary - other.imaginary);
    }
    
    // Multiplication: (a+bi) × (c+di) = (ac-bd) + (ad+bc)i
    Complex multiply(const Complex& other) const {
        double r = real * other.real - imaginary * other.imaginary;
        double i = real * other.imaginary + imaginary * other.real;
        return Complex(r, i);
    }
    
    // Division: (a+bi)/(c+di) = [(ac+bd) + (bc-ad)i] / (c²+d²)
    Complex divide(const Complex& other) const {
        double denominator = other.real * other.real + other.imaginary * other.imaginary;
        if (denominator == 0) {
            std::cout << "Error: Division by zero!" << std::endl;
            return Complex(0, 0);
        }
        double r = (real * other.real + imaginary * other.imaginary) / denominator;
        double i = (imaginary * other.real - real * other.imaginary) / denominator;
        return Complex(r, i);
    }
    
    // Magnitude: |a+bi| = √(a² + b²)
    double magnitude() const {
        return std::sqrt(real * real + imaginary * imaginary);
    }
    
    // Conjugate: conjugate(a+bi) = a-bi
    Complex conjugate() const {
        return Complex(real, -imaginary);
    }
    
    void display() const {
        std::cout << std::fixed << std::setprecision(2);
        if (imaginary >= 0) {
            std::cout << real << " + " << imaginary << "i" << std::endl;
        } else {
            std::cout << real << " - " << std::abs(imaginary) << "i" << std::endl;
        }
    }
};

int main() {
    Complex c1(3, 4);
    Complex c2(1, 2);
    
    std::cout << "c1 = ";
    c1.display();
    std::cout << "c2 = ";
    c2.display();
    
    std::cout << "\nc1 + c2 = ";
    c1.add(c2).display();
    
    std::cout << "c1 - c2 = ";
    c1.subtract(c2).display();
    
    std::cout << "c1 × c2 = ";
    c1.multiply(c2).display();
    
    std::cout << "c1 / c2 = ";
    c1.divide(c2).display();
    
    std::cout << "\n|c1| = " << c1.magnitude() << std::endl;
    std::cout << "conjugate(c1) = ";
    c1.conjugate().display();
    
    return 0;
}
```

### Polynomial Class

A polynomial of degree n: \( P(x) = a_nx^n + a_{n-1}x^{n-1} + \ldots + a_1x + a_0 \)

```cpp
#include <iostream>
#include <vector>
#include <cmath>
#include <iomanip>

class Polynomial {
private:
    std::vector<double> coefficients;  // coefficients[i] is coefficient of x^i

public:
    Polynomial(const std::vector<double>& coeffs) : coefficients(coeffs) {}
    
    // Evaluate polynomial at x
    double evaluate(double x) const {
        double result = 0;
        for (size_t i = 0; i < coefficients.size(); i++) {
            result += coefficients[i] * std::pow(x, i);
        }
        return result;
    }
    
    // Get degree of polynomial
    int degree() const {
        return coefficients.size() - 1;
    }
    
    // Get coefficient at index i
    double getCoefficient(int i) const {
        if (i >= 0 && i < static_cast<int>(coefficients.size())) {
            return coefficients[i];
        }
        return 0;
    }
    
    // Add two polynomials
    Polynomial add(const Polynomial& other) const {
        size_t maxSize = std::max(coefficients.size(), other.coefficients.size());
        std::vector<double> result(maxSize, 0);
        
        for (size_t i = 0; i < coefficients.size(); i++) {
            result[i] += coefficients[i];
        }
        for (size_t i = 0; i < other.coefficients.size(); i++) {
            result[i] += other.coefficients[i];
        }
        
        return Polynomial(result);
    }
    
    // Multiply polynomial by a scalar
    Polynomial multiplyScalar(double scalar) const {
        std::vector<double> result = coefficients;
        for (size_t i = 0; i < result.size(); i++) {
            result[i] *= scalar;
        }
        return Polynomial(result);
    }
    
    // Derivative of polynomial
    Polynomial derivative() const {
        if (coefficients.size() <= 1) {
            return Polynomial({0});
        }
        std::vector<double> deriv(coefficients.size() - 1);
        for (size_t i = 1; i < coefficients.size(); i++) {
            deriv[i - 1] = coefficients[i] * i;
        }
        return Polynomial(deriv);
    }
    
    void display() const {
        bool firstTerm = true;
        for (int i = degree(); i >= 0; i--) {
            double coeff = getCoefficient(i);
            if (coeff == 0 && degree() > 0) continue;
            
            if (!firstTerm && coeff > 0) std::cout << " + ";
            if (coeff < 0) std::cout << " - ";
            
            double absCoeff = std::abs(coeff);
            if (absCoeff != 1 || i == 0) {
                std::cout << absCoeff;
            }
            
            if (i > 0) {
                std::cout << "x";
                if (i > 1) std::cout << "^" << i;
            }
            
            firstTerm = false;
        }
        std::cout << std::endl;
    }
};

int main() {
    // P(x) = 2x³ + 3x² - x + 5
    Polynomial p1({5, -1, 3, 2});
    
    std::cout << "P(x) = ";
    p1.display();
    
    std::cout << "\nP(2) = " << p1.evaluate(2) << std::endl;
    std::cout << "P(-1) = " << p1.evaluate(-1) << std::endl;
    
    // Derivative: P'(x) = 6x² + 6x - 1
    Polynomial deriv = p1.derivative();
    std::cout << "\nP'(x) = ";
    deriv.display();
    
    // Q(x) = x² + 1
    Polynomial p2({1, 0, 1});
    std::cout << "\nQ(x) = ";
    p2.display();
    
    // P(x) + Q(x)
    Polynomial sum = p1.add(p2);
    std::cout << "\nP(x) + Q(x) = ";
    sum.display();
    
    return 0;
}
```

## Static Members

Static members belong to the class rather than individual objects.

### Static Member Variables and Functions

```cpp
#include <iostream>

class Counter {
private:
    static int count;  // Shared across all objects
    
public:
    Counter() {
        count++;
    }
    
    ~Counter() {
        count--;
    }
    
    static int getCount() {  // Can be called without object
        return count;
    }
};

int Counter::count = 0;  // Definition of static member

int main() {
    std::cout << "Initial count: " << Counter::getCount() << std::endl;
    
    {
        Counter c1;
        Counter c2;
        std::cout << "Count after creating 2 objects: " << Counter::getCount() << std::endl;
    }
    
    std::cout << "Count after destroying objects: " << Counter::getCount() << std::endl;
    
    return 0;
}
```

## Summary

Classes are the foundation of object-oriented programming:

1. **Encapsulation**: Data and methods together in one unit
2. **Data Hiding**: Private members protect internal state
3. **Initialization**: Constructors set up objects
4. **Cleanup**: Destructors free resources
5. **Modularity**: Related functionality grouped together

Key concepts:
- Class definition and member access
- Constructors (default, parameterized, copy)
- Destructors for resource management
- Static members shared across objects
- Mathematical class examples (Circle, Complex, Polynomial)

Understanding classes enables you to model real-world entities and mathematical concepts effectively in C++.

