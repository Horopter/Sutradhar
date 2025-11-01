# Lesson 7: Inheritance and Polymorphism in C++

## Overview

Inheritance and polymorphism are core OOP principles that enable code reuse and flexible design. Inheritance allows creating new classes based on existing ones, while polymorphism enables objects of different types to be treated through a common interface. This lesson covers single and multiple inheritance, virtual functions, abstract classes, and demonstrates these concepts with mathematical examples.

## Inheritance Basics

Inheritance allows a derived class to inherit properties and methods from a base class.

### Basic Inheritance Syntax

```cpp
#include <iostream>
#include <string>

class Shape {
protected:
    std::string name;
    
public:
    Shape(const std::string& n) : name(n) {}
    
    virtual double area() const = 0;  // Pure virtual function
    virtual double perimeter() const = 0;
    
    void display() const {
        std::cout << "Shape: " << name << std::endl;
        std::cout << "Area: " << area() << std::endl;
        std::cout << "Perimeter: " << perimeter() << std::endl;
    }
};

class Rectangle : public Shape {
private:
    double length;
    double width;
    
public:
    Rectangle(double l, double w) : Shape("Rectangle"), length(l), width(w) {}
    
    double area() const override {
        return length * width;
    }
    
    double perimeter() const override {
        return 2 * (length + width);
    }
};

class Circle : public Shape {
private:
    double radius;
    static const double PI;
    
public:
    Circle(double r) : Shape("Circle"), radius(r) {}
    
    double area() const override {
        return PI * radius * radius;
    }
    
    double perimeter() const override {
        return 2 * PI * radius;
    }
};

const double Circle::PI = 3.14159265359;

int main() {
    Rectangle rect(5.0, 3.0);
    Circle circ(4.0);
    
    rect.display();
    std::cout << std::endl;
    circ.display();
    
    return 0;
}
```

## Types of Inheritance

### Public Inheritance

```cpp
#include <iostream>

class Base {
public:
    int publicVar;
protected:
    int protectedVar;
private:
    int privateVar;
};

class Derived : public Base {
public:
    void accessMembers() {
        publicVar = 1;        // OK: public in derived
        protectedVar = 2;     // OK: protected in derived
        // privateVar = 3;    // Error: not accessible
    }
};

int main() {
    Derived d;
    d.publicVar = 10;  // OK
    // d.protectedVar = 20;  // Error: not accessible outside class
    return 0;
}
```

## Virtual Functions and Polymorphism

### Virtual Functions

Virtual functions enable runtime polymorphism - the correct function is called based on the actual object type, not the pointer/reference type.

```cpp
#include <iostream>

class Animal {
public:
    virtual void makeSound() {
        std::cout << "Some generic animal sound" << std::endl;
    }
    
    virtual ~Animal() {}  // Virtual destructor
};

class Dog : public Animal {
public:
    void makeSound() override {
        std::cout << "Woof! Woof!" << std::endl;
    }
};

class Cat : public Animal {
public:
    void makeSound() override {
        std::cout << "Meow! Meow!" << std::endl;
    }
};

int main() {
    Animal* animals[] = {new Dog(), new Cat(), new Animal()};
    
    for (int i = 0; i < 3; i++) {
        animals[i]->makeSound();  // Calls appropriate version
        delete animals[i];
    }
    
    return 0;
}
```

## Mathematical Inheritance Example: Geometric Shapes

### Shape Hierarchy with Mathematical Properties

```cpp
#include <iostream>
#include <cmath>
#include <vector>
#include <memory>

class Shape {
protected:
    std::string name;
    
public:
    Shape(const std::string& n) : name(n) {}
    
    virtual double area() const = 0;
    virtual double perimeter() const = 0;
    virtual double volume() const { return 0; }  // Default for 2D shapes
    
    virtual void display() const {
        std::cout << name << ": Area = " << area() 
                  << ", Perimeter = " << perimeter() << std::endl;
    }
    
    virtual ~Shape() {}
};

class Rectangle : public Shape {
protected:
    double length, width;
    
public:
    Rectangle(double l, double w) 
        : Shape("Rectangle"), length(l), width(w) {}
    
    double area() const override {
        return length * width;
    }
    
    double perimeter() const override {
        return 2 * (length + width);
    }
    
    double diagonal() const {
        return std::sqrt(length * length + width * width);
    }
};

class Square : public Rectangle {
public:
    Square(double side) : Rectangle(side, side) {
        name = "Square";
    }
};

class Circle : public Shape {
protected:
    double radius;
    static const double PI;
    
public:
    Circle(double r) : Shape("Circle"), radius(r) {}
    
    double area() const override {
        return PI * radius * radius;
    }
    
    double perimeter() const override {
        return 2 * PI * radius;
    }
    
    double diameter() const {
        return 2 * radius;
    }
};

const double Circle::PI = 3.14159265359;

class Triangle : public Shape {
protected:
    double a, b, c;
    
public:
    Triangle(double side1, double side2, double side3) 
        : Shape("Triangle"), a(side1), b(side2), c(side3) {}
    
    double perimeter() const override {
        return a + b + c;
    }
    
    double area() const override {
        // Heron's formula: √[s(s-a)(s-b)(s-c)]
        double s = perimeter() / 2.0;
        return std::sqrt(s * (s - a) * (s - b) * (s - c));
    }
};

// 3D Shapes
class Cuboid : public Rectangle {
private:
    double height;
    
public:
    Cuboid(double l, double w, double h) 
        : Rectangle(l, w), height(h) {
        name = "Cuboid";
    }
    
    double volume() const override {
        return length * width * height;
    }
    
    double surfaceArea() const {
        return 2 * (length * width + length * height + width * height);
    }
    
    void display() const override {
        std::cout << name << ": Volume = " << volume() 
                  << ", Surface Area = " << surfaceArea() << std::endl;
    }
};

class Sphere : public Circle {
public:
    Sphere(double r) : Circle(r) {
        name = "Sphere";
    }
    
    double volume() const override {
        return (4.0 / 3.0) * PI * radius * radius * radius;
    }
    
    double surfaceArea() const {
        return 4 * PI * radius * radius;
    }
    
    void display() const override {
        std::cout << name << ": Volume = " << volume() 
                  << ", Surface Area = " << surfaceArea() << std::endl;
    }
};

int main() {
    std::vector<std::unique_ptr<Shape>> shapes;
    
    shapes.push_back(std::make_unique<Rectangle>(5, 3));
    shapes.push_back(std::make_unique<Square>(4));
    shapes.push_back(std::make_unique<Circle>(3));
    shapes.push_back(std::make_unique<Triangle>(3, 4, 5));
    shapes.push_back(std::make_unique<Cuboid>(2, 3, 4));
    shapes.push_back(std::make_unique<Sphere>(3));
    
    std::cout << "Shape Information:" << std::endl;
    std::cout << "==================" << std::endl;
    for (const auto& shape : shapes) {
        shape->display();
        std::cout << std::endl;
    }
    
    return 0;
}
```

## Abstract Classes

Abstract classes have at least one pure virtual function and cannot be instantiated.

### Mathematical Function Hierarchy

```cpp
#include <iostream>
#include <cmath>
#include <vector>

class MathematicalFunction {
protected:
    std::string functionName;
    
public:
    MathematicalFunction(const std::string& name) : functionName(name) {}
    
    virtual double evaluate(double x) const = 0;  // Pure virtual
    virtual double derivative(double x) const = 0;  // Pure virtual
    
    virtual void display() const {
        std::cout << "Function: " << functionName << std::endl;
    }
    
    virtual ~MathematicalFunction() {}
};

class LinearFunction : public MathematicalFunction {
private:
    double slope;
    double intercept;
    
public:
    LinearFunction(double m, double b) 
        : MathematicalFunction("Linear"), slope(m), intercept(b) {}
    
    double evaluate(double x) const override {
        return slope * x + intercept;  // y = mx + b
    }
    
    double derivative(double x) const override {
        return slope;  // Derivative of mx + b is m
    }
    
    void display() const override {
        MathematicalFunction::display();
        std::cout << "f(x) = " << slope << "x + " << intercept << std::endl;
    }
};

class QuadraticFunction : public MathematicalFunction {
private:
    double a, b, c;
    
public:
    QuadraticFunction(double coeff_a, double coeff_b, double coeff_c)
        : MathematicalFunction("Quadratic"), a(coeff_a), b(coeff_b), c(coeff_c) {}
    
    double evaluate(double x) const override {
        return a * x * x + b * x + c;  // f(x) = ax² + bx + c
    }
    
    double derivative(double x) const override {
        return 2 * a * x + b;  // f'(x) = 2ax + b
    }
    
    void display() const override {
        MathematicalFunction::display();
        std::cout << "f(x) = " << a << "x² + " << b << "x + " << c << std::endl;
    }
};

class ExponentialFunction : public MathematicalFunction {
private:
    double base;
    
public:
    ExponentialFunction(double b) 
        : MathematicalFunction("Exponential"), base(b) {}
    
    double evaluate(double x) const override {
        return std::pow(base, x);  // f(x) = b^x
    }
    
    double derivative(double x) const override {
        return std::pow(base, x) * std::log(base);  // f'(x) = b^x * ln(b)
    }
    
    void display() const override {
        MathematicalFunction::display();
        std::cout << "f(x) = " << base << "^x" << std::endl;
    }
};

class SineFunction : public MathematicalFunction {
public:
    SineFunction() : MathematicalFunction("Sine") {}
    
    double evaluate(double x) const override {
        return std::sin(x);
    }
    
    double derivative(double x) const override {
        return std::cos(x);  // d/dx(sin x) = cos x
    }
    
    void display() const override {
        MathematicalFunction::display();
        std::cout << "f(x) = sin(x)" << std::endl;
    }
};

int main() {
    std::vector<MathematicalFunction*> functions;
    
    functions.push_back(new LinearFunction(2, 3));
    functions.push_back(new QuadraticFunction(1, -4, 4));
    functions.push_back(new ExponentialFunction(2));
    functions.push_back(new SineFunction());
    
    double x = 2.0;
    
    std::cout << "Function Evaluation at x = " << x << ":" << std::endl;
    std::cout << "=====================================" << std::endl;
    
    for (auto* func : functions) {
        func->display();
        std::cout << "f(" << x << ") = " << func->evaluate(x) << std::endl;
        std::cout << "f'(" << x << ") = " << func->derivative(x) << std::endl;
        std::cout << std::endl;
    }
    
    // Cleanup
    for (auto* func : functions) {
        delete func;
    }
    
    return 0;
}
```

## Multiple Inheritance

C++ supports multiple inheritance where a class can inherit from multiple base classes.

### Multiple Inheritance Example

```cpp
#include <iostream>

class Printable {
public:
    virtual void print() const = 0;
    virtual ~Printable() {}
};

class Drawable {
public:
    virtual void draw() const = 0;
    virtual ~Drawable() {}
};

class Shape2D {
protected:
    std::string name;
public:
    Shape2D(const std::string& n) : name(n) {}
    virtual double area() const = 0;
    virtual ~Shape2D() {}
};

class Rectangle : public Shape2D, public Printable, public Drawable {
private:
    double length, width;
    
public:
    Rectangle(double l, double w) 
        : Shape2D("Rectangle"), length(l), width(w) {}
    
    double area() const override {
        return length * width;
    }
    
    void print() const override {
        std::cout << name << ": " << length << " × " << width << std::endl;
    }
    
    void draw() const override {
        std::cout << "Drawing rectangle..." << std::endl;
    }
};

int main() {
    Rectangle rect(5, 3);
    
    rect.print();
    rect.draw();
    std::cout << "Area: " << rect.area() << std::endl;
    
    return 0;
}
```

## Summary

Inheritance and polymorphism enable:

1. **Code Reuse**: Inherit common functionality
2. **Hierarchical Organization**: Model "is-a" relationships
3. **Polymorphism**: Treat derived objects through base pointers
4. **Extensibility**: Add new classes without modifying existing code
5. **Abstraction**: Define interfaces through abstract classes

Key concepts:
- Single and multiple inheritance
- Virtual functions for runtime polymorphism
- Abstract classes and pure virtual functions
- Virtual destructors for proper cleanup
- Access modifiers in inheritance
- Mathematical examples (shapes, functions)

Mastering inheritance and polymorphism is essential for building flexible, maintainable object-oriented systems.

