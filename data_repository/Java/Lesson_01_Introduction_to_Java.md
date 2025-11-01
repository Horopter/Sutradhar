# Lesson 1: Introduction to Java

## Overview

Java is a high-level, object-oriented programming language developed by Sun Microsystems (now owned by Oracle) in 1995. Java's "write once, run anywhere" philosophy, enabled by the Java Virtual Machine (JVM), makes it one of the most popular programming languages worldwide. Java is used in enterprise applications, Android development, web applications, and big data processing.

## History and Philosophy

Java was created by James Gosling and his team with the goal of creating a language that was simple, object-oriented, portable, and secure. Key design principles include:
- **Platform Independence**: Code compiles to bytecode that runs on the JVM
- **Object-Oriented**: Everything is an object (except primitives)
- **Automatic Memory Management**: Garbage collection handles memory
- **Strong Typing**: Type safety at compile time
- **Multithreading**: Built-in support for concurrent programming

## Java Platform and JVM

### How Java Works

1. **Write**: Write Java source code (`.java` files)
2. **Compile**: Java compiler (`javac`) converts source to bytecode (`.class` files)
3. **Execute**: JVM interprets bytecode and executes the program

```bash
# Compile
javac HelloWorld.java

# Run
java HelloWorld
```

## Setting Up Java Development Environment

### Installing JDK

Download and install the Java Development Kit (JDK) from Oracle or use OpenJDK:

```bash
# Check Java version
java -version
javac -version

# Set JAVA_HOME environment variable (varies by OS)
export JAVA_HOME=/path/to/jdk
```

### IDE Options

- **IntelliJ IDEA**: Professional IDE with excellent Java support
- **Eclipse**: Popular open-source IDE
- **NetBeans**: Oracle's official IDE
- **VS Code**: Lightweight editor with Java extensions

## Your First Java Program

```java
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
```

### Program Breakdown

1. **`public class HelloWorld`**: Class declaration (filename must match class name)
2. **`public static void main(String[] args)`**: Entry point of the program
   - `public`: Accessible from anywhere
   - `static`: Belongs to the class, not an instance
   - `void`: Returns nothing
   - `main`: Required method name
   - `String[] args`: Command-line arguments
3. **`System.out.println()`**: Prints to console with newline

## Variables and Data Types

### Primitive Data Types

```java
public class DataTypes {
    public static void main(String[] args) {
        // Integer types
        byte b = 127;           // 8 bits, -128 to 127
        short s = 32767;        // 16 bits, -32,768 to 32,767
        int i = 2147483647;     // 32 bits, -2^31 to 2^31-1
        long l = 9223372036854775807L;  // 64 bits, -2^63 to 2^63-1
        
        // Floating-point types
        float f = 3.14f;        // 32 bits, ~7 decimal digits
        double d = 3.141592653589793;  // 64 bits, ~15 decimal digits
        
        // Character and boolean
        char c = 'A';           // 16 bits, Unicode character
        boolean bool = true;    // true or false
        
        System.out.println("byte: " + b);
        System.out.println("short: " + s);
        System.out.println("int: " + i);
        System.out.println("long: " + l);
        System.out.println("float: " + f);
        System.out.println("double: " + d);
        System.out.println("char: " + c);
        System.out.println("boolean: " + bool);
    }
}
```

### Reference Types

```java
public class ReferenceTypes {
    public static void main(String[] args) {
        String name = "Java Programming";
        Integer number = 42;  // Wrapper class
        int[] numbers = {1, 2, 3, 4, 5};
        
        System.out.println("String: " + name);
        System.out.println("Integer: " + number);
        System.out.println("Array length: " + numbers.length);
    }
}
```

## Input and Output

### Reading Input from Console

```java
import java.util.Scanner;

public class UserInput {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        
        System.out.print("Enter your name: ");
        String name = scanner.nextLine();
        
        System.out.print("Enter your age: ");
        int age = scanner.nextInt();
        
        System.out.print("Enter your height (in meters): ");
        double height = scanner.nextDouble();
        
        System.out.println("\nHello, " + name + "!");
        System.out.println("You are " + age + " years old.");
        System.out.println("Your height is " + height + " meters.");
        
        scanner.close();
    }
}
```

## Mathematical Operations

### Basic Arithmetic

```java
public class Arithmetic {
    public static void main(String[] args) {
        int a = 10;
        int b = 3;
        
        System.out.println("Addition: " + (a + b));
        System.out.println("Subtraction: " + (a - b));
        System.out.println("Multiplication: " + (a * b));
        System.out.println("Division: " + (a / b));
        System.out.println("Modulus: " + (a % b));
        
        // Floating-point division
        double result = (double) a / b;
        System.out.println("Floating-point division: " + result);
    }
}
```

### Mathematical Example: Compound Interest Calculator

Formula: \( A = P \left(1 + \frac{r}{n}\right)^{nt} \)

```java
import java.util.Scanner;
import java.text.DecimalFormat;

public class CompoundInterest {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        DecimalFormat df = new DecimalFormat("#.##");
        
        System.out.print("Enter principal amount: $");
        double principal = scanner.nextDouble();
        
        System.out.print("Enter annual interest rate (as decimal, e.g., 0.05 for 5%): ");
        double rate = scanner.nextDouble();
        
        System.out.print("Enter number of times interest compounds per year: ");
        int compoundsPerYear = scanner.nextInt();
        
        System.out.print("Enter time in years: ");
        double time = scanner.nextDouble();
        
        // Calculate compound interest
        double base = 1.0 + (rate / compoundsPerYear);
        double exponent = compoundsPerYear * time;
        double amount = principal * Math.pow(base, exponent);
        double interest = amount - principal;
        
        System.out.println("\nResults:");
        System.out.println("Principal: $" + df.format(principal));
        System.out.println("Final Amount: $" + df.format(amount));
        System.out.println("Interest Earned: $" + df.format(interest));
        
        scanner.close();
    }
}
```

### Mathematical Example: Quadratic Equation Solver

Formula: \( x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a} \)

```java
import java.util.Scanner;

public class QuadraticEquation {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        
        System.out.println("Quadratic Equation Solver: ax² + bx + c = 0");
        System.out.print("Enter coefficient a: ");
        double a = scanner.nextDouble();
        
        if (a == 0) {
            System.out.println("Error: 'a' cannot be zero (not a quadratic equation)!");
            scanner.close();
            return;
        }
        
        System.out.print("Enter coefficient b: ");
        double b = scanner.nextDouble();
        
        System.out.print("Enter coefficient c: ");
        double c = scanner.nextDouble();
        
        // Calculate discriminant
        double discriminant = b * b - 4 * a * c;
        
        System.out.println("\nEquation: " + a + "x² + " + b + "x + " + c + " = 0");
        System.out.println("Discriminant: " + discriminant);
        
        if (discriminant > 0) {
            // Two real and distinct roots
            double root1 = (-b + Math.sqrt(discriminant)) / (2 * a);
            double root2 = (-b - Math.sqrt(discriminant)) / (2 * a);
            
            System.out.println("Roots: Two real and distinct roots");
            System.out.println("Root 1: " + root1);
            System.out.println("Root 2: " + root2);
        } else if (discriminant == 0) {
            // One real root (repeated)
            double root = -b / (2 * a);
            
            System.out.println("Root: One real root (repeated)");
            System.out.println("Root: " + root);
        } else {
            // Two complex roots
            double realPart = -b / (2 * a);
            double imaginaryPart = Math.sqrt(-discriminant) / (2 * a);
            
            System.out.println("Roots: Two complex roots");
            System.out.println("Root 1: " + realPart + " + " + imaginaryPart + "i");
            System.out.println("Root 2: " + realPart + " - " + imaginaryPart + "i");
        }
        
        scanner.close();
    }
}
```

## Mathematical Functions in Java

The `Math` class provides static methods for mathematical operations.

```java
public class MathFunctions {
    public static void main(String[] args) {
        double x = 25.0;
        double y = 3.0;
        
        System.out.println("Square root of " + x + ": " + Math.sqrt(x));
        System.out.println("Power: " + x + "^" + y + " = " + Math.pow(x, y));
        System.out.println("Natural logarithm of " + x + ": " + Math.log(x));
        System.out.println("Base-10 logarithm of " + x + ": " + Math.log10(x));
        System.out.println("Absolute value of -" + x + ": " + Math.abs(-x));
        System.out.println("Ceiling of 4.3: " + Math.ceil(4.3));
        System.out.println("Floor of 4.7: " + Math.floor(4.7));
        System.out.println("Round of 4.6: " + Math.round(4.6));
        
        // Trigonometric functions (angles in radians)
        double angle = Math.PI / 4;  // 45 degrees
        System.out.println("sin(45°): " + Math.sin(angle));
        System.out.println("cos(45°): " + Math.cos(angle));
        System.out.println("tan(45°): " + Math.tan(angle));
        
        // Constants
        System.out.println("Pi: " + Math.PI);
        System.out.println("E: " + Math.E);
    }
}
```

## Temperature Converter Example

```java
import java.util.Scanner;

public class TemperatureConverter {
    
    // Convert Fahrenheit to Celsius: C = (F - 32) × 5/9
    public static double fahrenheitToCelsius(double fahrenheit) {
        return (fahrenheit - 32.0) * 5.0 / 9.0;
    }
    
    // Convert Celsius to Fahrenheit: F = C × 9/5 + 32
    public static double celsiusToFahrenheit(double celsius) {
        return celsius * 9.0 / 5.0 + 32.0;
    }
    
    // Convert Celsius to Kelvin: K = C + 273.15
    public static double celsiusToKelvin(double celsius) {
        return celsius + 273.15;
    }
    
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        
        System.out.print("Enter temperature: ");
        double temp = scanner.nextDouble();
        
        System.out.print("Enter unit (F/C/K): ");
        char unit = scanner.next().charAt(0);
        
        System.out.println("\nConversion Results:");
        
        if (unit == 'F' || unit == 'f') {
            double celsius = fahrenheitToCelsius(temp);
            double kelvin = celsiusToKelvin(celsius);
            System.out.println(temp + "°F = " + celsius + "°C = " + kelvin + "K");
        } else if (unit == 'C' || unit == 'c') {
            double fahrenheit = celsiusToFahrenheit(temp);
            double kelvin = celsiusToKelvin(temp);
            System.out.println(temp + "°C = " + fahrenheit + "°F = " + kelvin + "K");
        } else if (unit == 'K' || unit == 'k') {
            double celsius = temp - 273.15;
            double fahrenheit = celsiusToFahrenheit(celsius);
            System.out.println(temp + "K = " + celsius + "°C = " + fahrenheit + "°F");
        } else {
            System.out.println("Invalid unit!");
        }
        
        scanner.close();
    }
}
```

## Constants and Final Variables

The `final` keyword creates constants that cannot be reassigned.

```java
public class Constants {
    // Class-level constants
    public static final double PI = 3.14159265359;
    public static final double GRAVITY = 9.81;  // m/s²
    public static final int MAX_SIZE = 100;
    
    public static void main(String[] args) {
        // Method-level constant
        final int localConstant = 42;
        
        double radius = 5.0;
        double area = PI * radius * radius;
        double circumference = 2 * PI * radius;
        
        System.out.println("Circle with radius " + radius + ":");
        System.out.println("Area: " + area);
        System.out.println("Circumference: " + circumference);
        System.out.println("Gravity constant: " + GRAVITY + " m/s²");
        
        // PI = 3.14;  // Error: cannot assign to final variable
    }
}
```

## String Operations

```java
public class StringOperations {
    public static void main(String[] args) {
        String str1 = "Hello";
        String str2 = "World";
        
        // Concatenation
        String combined = str1 + " " + str2;
        System.out.println(combined);
        
        // Length
        System.out.println("Length: " + combined.length());
        
        // Substring
        System.out.println("Substring (0-5): " + combined.substring(0, 5));
        
        // Character access
        System.out.println("First character: " + combined.charAt(0));
        
        // Case conversion
        System.out.println("Uppercase: " + combined.toUpperCase());
        System.out.println("Lowercase: " + combined.toLowerCase());
        
        // Comparison
        System.out.println("Equals 'Hello World': " + combined.equals("Hello World"));
        System.out.println("Equals ignore case: " + combined.equalsIgnoreCase("hello world"));
    }
}
```

## Summary

Java fundamentals covered:

1. **Platform Independence**: Write once, run anywhere with JVM
2. **Object-Oriented**: Classes and objects as building blocks
3. **Data Types**: Primitives and reference types
4. **I/O Operations**: Console input/output with Scanner
5. **Mathematical Operations**: Arithmetic, Math class, formulas
6. **Constants**: Using `final` keyword
7. **Strings**: Immutable string objects with useful methods

Key takeaways:
- Java programs must have a `main` method in a public class
- File name must match public class name
- Use `System.out.println()` for output
- Use `Scanner` for input
- `Math` class provides mathematical functions
- `final` keyword creates constants

Java's strong typing and object-oriented nature provide a solid foundation for building robust applications. Practice with mathematical problems and algorithms to reinforce these concepts.

