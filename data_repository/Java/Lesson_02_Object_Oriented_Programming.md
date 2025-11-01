# Lesson 2: Object-Oriented Programming in Java

## Overview

Object-Oriented Programming (OOP) is a programming paradigm that organizes code around objects and classes. Java is inherently object-oriented, meaning everything in Java is associated with classes and objects. Understanding OOP principles—encapsulation, inheritance, polymorphism, and abstraction—is fundamental to Java programming.

## Classes and Objects

### Class Definition

A class is a blueprint for creating objects. It defines attributes (fields) and behaviors (methods).

```java
public class Car {
    // Fields (attributes)
    private String brand;
    private String model;
    private int year;
    private double speed;
    
    // Constructor
    public Car(String brand, String model, int year) {
        this.brand = brand;
        this.model = model;
        this.year = year;
        this.speed = 0;
    }
    
    // Methods (behaviors)
    public void accelerate(double increment) {
        speed += increment;
    }
    
    public void brake(double decrement) {
        if (speed >= decrement) {
            speed -= decrement;
        } else {
            speed = 0;
        }
    }
    
    // Getters
    public String getBrand() {
        return brand;
    }
    
    public String getModel() {
        return model;
    }
    
    public double getSpeed() {
        return speed;
    }
    
    public void displayInfo() {
        System.out.println(brand + " " + model + " (" + year + ") - Speed: " + speed + " km/h");
    }
}

public class CarDemo {
    public static void main(String[] args) {
        Car myCar = new Car("Toyota", "Camry", 2023);
        myCar.displayInfo();
        
        myCar.accelerate(50);
        myCar.displayInfo();
        
        myCar.brake(20);
        myCar.displayInfo();
    }
}
```

## Encapsulation

Encapsulation bundles data and methods that operate on that data within a single unit and restricts direct access to some components.

### Access Modifiers

- **`private`**: Accessible only within the class
- **`protected`**: Accessible within package and subclasses
- **`public`**: Accessible from anywhere
- **`default`** (package-private): Accessible within the same package

```java
public class BankAccount {
    private double balance;
    private String accountNumber;
    
    public BankAccount(String accountNumber, double initialBalance) {
        this.accountNumber = accountNumber;
        if (initialBalance >= 0) {
            this.balance = initialBalance;
        } else {
            this.balance = 0;
        }
    }
    
    public void deposit(double amount) {
        if (amount > 0) {
            balance += amount;
            System.out.println("Deposited: $" + amount);
        } else {
            System.out.println("Invalid deposit amount");
        }
    }
    
    public boolean withdraw(double amount) {
        if (amount > 0 && amount <= balance) {
            balance -= amount;
            System.out.println("Withdrew: $" + amount);
            return true;
        } else {
            System.out.println("Invalid withdrawal amount");
            return false;
        }
    }
    
    public double getBalance() {
        return balance;
    }
    
    public String getAccountNumber() {
        return accountNumber;
    }
}
```

## Mathematical Example: Circle Class

```java
public class Circle {
    private double radius;
    private static final double PI = 3.14159265359;
    
    public Circle(double radius) {
        if (radius < 0) {
            this.radius = 0;
        } else {
            this.radius = radius;
        }
    }
    
    // Area: A = πr²
    public double area() {
        return PI * radius * radius;
    }
    
    // Circumference: C = 2πr
    public double circumference() {
        return 2 * PI * radius;
    }
    
    // Diameter: d = 2r
    public double diameter() {
        return 2 * radius;
    }
    
    // Sector area: A = (θ/360) × πr²
    public double sectorArea(double angleDegrees) {
        return (angleDegrees / 360.0) * area();
    }
    
    // Arc length: s = (θ/360) × 2πr
    public double arcLength(double angleDegrees) {
        return (angleDegrees / 360.0) * circumference();
    }
    
    public double getRadius() {
        return radius;
    }
    
    public void setRadius(double radius) {
        if (radius >= 0) {
            this.radius = radius;
        }
    }
}

public class CircleDemo {
    public static void main(String[] args) {
        Circle circle = new Circle(5.0);
        
        System.out.println("Circle Properties:");
        System.out.println("Radius: " + circle.getRadius());
        System.out.printf("Area: %.4f%n", circle.area());
        System.out.printf("Circumference: %.4f%n", circle.circumference());
        System.out.printf("Diameter: %.4f%n", circle.diameter());
        
        double angle = 60; // degrees
        System.out.println("\nSector (60 degrees):");
        System.out.printf("Sector Area: %.4f%n", circle.sectorArea(angle));
        System.out.printf("Arc Length: %.4f%n", circle.arcLength(angle));
    }
}
```

## Inheritance

Inheritance allows a class to inherit properties and methods from another class.

### Basic Inheritance

```java
// Parent class (superclass)
public class Shape {
    protected String name;
    
    public Shape(String name) {
        this.name = name;
    }
    
    public double area() {
        return 0; // Default implementation
    }
    
    public double perimeter() {
        return 0; // Default implementation
    }
    
    public void displayInfo() {
        System.out.println("Shape: " + name);
        System.out.println("Area: " + area());
        System.out.println("Perimeter: " + perimeter());
    }
}

// Child class (subclass)
public class Rectangle extends Shape {
    private double length;
    private double width;
    
    public Rectangle(double length, double width) {
        super("Rectangle");
        this.length = length;
        this.width = width;
    }
    
    @Override
    public double area() {
        return length * width;
    }
    
    @Override
    public double perimeter() {
        return 2 * (length + width);
    }
    
    public double diagonal() {
        return Math.sqrt(length * length + width * width);
    }
}

public class Square extends Rectangle {
    public Square(double side) {
        super(side, side);
        this.name = "Square";
    }
}

public class ShapeDemo {
    public static void main(String[] args) {
        Rectangle rect = new Rectangle(5, 3);
        rect.displayInfo();
        System.out.println("Diagonal: " + rect.diagonal());
        
        System.out.println();
        
        Square sq = new Square(4);
        sq.displayInfo();
    }
}
```

## Polymorphism

Polymorphism allows objects of different types to be treated through the same interface.

### Method Overriding

```java
public class Animal {
    public void makeSound() {
        System.out.println("Some generic animal sound");
    }
}

public class Dog extends Animal {
    @Override
    public void makeSound() {
        System.out.println("Woof! Woof!");
    }
}

public class Cat extends Animal {
    @Override
    public void makeSound() {
        System.out.println("Meow! Meow!");
    }
}

public class PolymorphismDemo {
    public static void main(String[] args) {
        Animal[] animals = {
            new Dog(),
            new Cat(),
            new Animal()
        };
        
        for (Animal animal : animals) {
            animal.makeSound(); // Calls appropriate version
        }
    }
}
```

### Method Overloading

Method overloading allows multiple methods with the same name but different parameters.

```java
public class MathOperations {
    // Add two integers
    public int add(int a, int b) {
        return a + b;
    }
    
    // Add three integers
    public int add(int a, int b, int c) {
        return a + b + c;
    }
    
    // Add two doubles
    public double add(double a, double b) {
        return a + b;
    }
    
    // Add array of integers
    public int add(int[] numbers) {
        int sum = 0;
        for (int num : numbers) {
            sum += num;
        }
        return sum;
    }
}

public class OverloadingDemo {
    public static void main(String[] args) {
        MathOperations math = new MathOperations();
        
        System.out.println("add(5, 3) = " + math.add(5, 3));
        System.out.println("add(5, 3, 2) = " + math.add(5, 3, 2));
        System.out.println("add(5.5, 3.2) = " + math.add(5.5, 3.2));
        
        int[] arr = {1, 2, 3, 4, 5};
        System.out.println("add([1,2,3,4,5]) = " + math.add(arr));
    }
}
```

## Abstract Classes

Abstract classes cannot be instantiated and may contain abstract methods.

```java
public abstract class MathematicalFunction {
    protected String functionName;
    
    public MathematicalFunction(String name) {
        this.functionName = name;
    }
    
    // Abstract methods (must be implemented by subclasses)
    public abstract double evaluate(double x);
    public abstract double derivative(double x);
    
    // Concrete method
    public void display() {
        System.out.println("Function: " + functionName);
    }
}

public class LinearFunction extends MathematicalFunction {
    private double slope;
    private double intercept;
    
    public LinearFunction(double slope, double intercept) {
        super("Linear");
        this.slope = slope;
        this.intercept = intercept;
    }
    
    @Override
    public double evaluate(double x) {
        return slope * x + intercept; // y = mx + b
    }
    
    @Override
    public double derivative(double x) {
        return slope; // Derivative is constant
    }
}

public class QuadraticFunction extends MathematicalFunction {
    private double a, b, c;
    
    public QuadraticFunction(double a, double b, double c) {
        super("Quadratic");
        this.a = a;
        this.b = b;
        this.c = c;
    }
    
    @Override
    public double evaluate(double x) {
        return a * x * x + b * x + c; // f(x) = ax² + bx + c
    }
    
    @Override
    public double derivative(double x) {
        return 2 * a * x + b; // f'(x) = 2ax + b
    }
}

public class FunctionDemo {
    public static void main(String[] args) {
        MathematicalFunction[] functions = {
            new LinearFunction(2, 3),
            new QuadraticFunction(1, -4, 4)
        };
        
        double x = 2.0;
        for (MathematicalFunction func : functions) {
            func.display();
            System.out.println("f(" + x + ") = " + func.evaluate(x));
            System.out.println("f'(" + x + ") = " + func.derivative(x));
            System.out.println();
        }
    }
}
```

## Interfaces

Interfaces define contracts that classes must implement.

```java
public interface Drawable {
    void draw();
    void resize(double factor);
}

public interface Calculable {
    double calculate();
}

public class Rectangle implements Drawable, Calculable {
    private double width;
    private double height;
    
    public Rectangle(double width, double height) {
        this.width = width;
        this.height = height;
    }
    
    @Override
    public void draw() {
        System.out.println("Drawing a rectangle: " + width + " × " + height);
    }
    
    @Override
    public void resize(double factor) {
        width *= factor;
        height *= factor;
    }
    
    @Override
    public double calculate() {
        return width * height; // Area
    }
}

public class InterfaceDemo {
    public static void main(String[] args) {
        Rectangle rect = new Rectangle(5, 3);
        
        rect.draw();
        System.out.println("Area: " + rect.calculate());
        
        rect.resize(2.0);
        rect.draw();
        System.out.println("New Area: " + rect.calculate());
    }
}
```

## Static Members

Static members belong to the class rather than instances.

```java
public class Counter {
    private static int count = 0;
    private int instanceId;
    
    public Counter() {
        count++;
        instanceId = count;
    }
    
    public static int getCount() {
        return count;
    }
    
    public int getInstanceId() {
        return instanceId;
    }
}

public class StaticDemo {
    public static void main(String[] args) {
        System.out.println("Initial count: " + Counter.getCount());
        
        Counter c1 = new Counter();
        Counter c2 = new Counter();
        Counter c3 = new Counter();
        
        System.out.println("Total count: " + Counter.getCount());
        System.out.println("c1 ID: " + c1.getInstanceId());
        System.out.println("c2 ID: " + c2.getInstanceId());
        System.out.println("c3 ID: " + c3.getInstanceId());
    }
}
```

## Summary

Object-Oriented Programming in Java provides:

1. **Encapsulation**: Data hiding and controlled access
2. **Inheritance**: Code reuse through class hierarchies
3. **Polymorphism**: Flexibility through method overriding and overloading
4. **Abstraction**: Interfaces and abstract classes define contracts

Key concepts:
- Classes define objects, objects are instances of classes
- Access modifiers control visibility
- Inheritance enables "is-a" relationships
- Polymorphism allows treating different types uniformly
- Abstract classes and interfaces provide abstraction

Mastering OOP is essential for building maintainable, scalable Java applications. These principles enable code reuse, flexibility, and better organization of complex systems.

