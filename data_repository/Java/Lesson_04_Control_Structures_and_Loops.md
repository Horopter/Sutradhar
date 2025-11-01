# Lesson 4: Control Structures and Loops in Java

## Overview

Control structures and loops are fundamental programming constructs that determine the flow of program execution. Java provides various conditional statements (if-else, switch) and looping constructs (for, while, do-while) that enable decision-making and repetitive execution. Understanding these constructs is essential for writing effective Java programs.

## Conditional Statements

### If-Else Statement

The `if` statement executes code conditionally based on a boolean expression.

```java
public class ConditionalDemo {
    public static void main(String[] args) {
        int score = 85;
        
        if (score >= 90) {
            System.out.println("Grade: A");
        } else if (score >= 80) {
            System.out.println("Grade: B");
        } else if (score >= 70) {
            System.out.println("Grade: C");
        } else if (score >= 60) {
            System.out.println("Grade: D");
        } else {
            System.out.println("Grade: F");
        }
    }
}
```

### Ternary Operator

A shorthand for simple if-else statements.

```java
public class TernaryDemo {
    public static void main(String[] args) {
        int age = 20;
        String status = (age >= 18) ? "Adult" : "Minor";
        System.out.println(status);
        
        int a = 10, b = 5;
        int max = (a > b) ? a : b;
        System.out.println("Maximum: " + max);
    }
}
```

### Switch Statement

The `switch` statement selects one of many code blocks to execute.

```java
public class SwitchDemo {
    public static void main(String[] args) {
        int day = 3;
        String dayName;
        
        switch (day) {
            case 1:
                dayName = "Monday";
                break;
            case 2:
                dayName = "Tuesday";
                break;
            case 3:
                dayName = "Wednesday";
                break;
            case 4:
                dayName = "Thursday";
                break;
            case 5:
                dayName = "Friday";
                break;
            case 6:
                dayName = "Saturday";
                break;
            case 7:
                dayName = "Sunday";
                break;
            default:
                dayName = "Invalid day";
        }
        
        System.out.println("Day " + day + " is " + dayName);
    }
}
```

### Switch Expression (Java 14+)

Modern switch expressions provide more concise syntax.

```java
public class SwitchExpressionDemo {
    public static void main(String[] args) {
        int day = 3;
        
        String dayName = switch (day) {
            case 1 -> "Monday";
            case 2 -> "Tuesday";
            case 3 -> "Wednesday";
            case 4 -> "Thursday";
            case 5 -> "Friday";
            case 6 -> "Saturday";
            case 7 -> "Sunday";
            default -> "Invalid day";
        };
        
        System.out.println("Day " + day + " is " + dayName);
    }
}
```

## Mathematical Example: Grade Calculator

```java
import java.util.Scanner;

public class GradeCalculator {
    public static char calculateGrade(double score) {
        if (score >= 90) return 'A';
        else if (score >= 80) return 'B';
        else if (score >= 70) return 'C';
        else if (score >= 60) return 'D';
        else return 'F';
    }
    
    public static double calculateGPA(char[] grades) {
        double totalPoints = 0;
        for (char grade : grades) {
            switch (grade) {
                case 'A': totalPoints += 4.0; break;
                case 'B': totalPoints += 3.0; break;
                case 'C': totalPoints += 2.0; break;
                case 'D': totalPoints += 1.0; break;
                case 'F': totalPoints += 0.0; break;
            }
        }
        return totalPoints / grades.length;
    }
    
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        
        System.out.print("Enter number of courses: ");
        int numCourses = scanner.nextInt();
        
        double[] scores = new double[numCourses];
        char[] grades = new char[numCourses];
        
        for (int i = 0; i < numCourses; i++) {
            System.out.print("Enter score for course " + (i + 1) + ": ");
            scores[i] = scanner.nextDouble();
            grades[i] = calculateGrade(scores[i]);
            System.out.println("Grade: " + grades[i]);
        }
        
        double gpa = calculateGPA(grades);
        System.out.println("\nOverall GPA: " + gpa);
        
        scanner.close();
    }
}
```

## Loops

### For Loop

The `for` loop is ideal when you know the number of iterations.

```java
public class ForLoopDemo {
    public static void main(String[] args) {
        // Basic for loop
        for (int i = 0; i < 5; i++) {
            System.out.println("Iteration: " + i);
        }
        
        // Enhanced for loop (for-each)
        int[] numbers = {1, 2, 3, 4, 5};
        for (int num : numbers) {
            System.out.print(num + " ");
        }
        System.out.println();
    }
}
```

### While Loop

The `while` loop repeats as long as a condition is true.

```java
public class WhileLoopDemo {
    public static void main(String[] args) {
        int count = 0;
        while (count < 5) {
            System.out.println("Count: " + count);
            count++;
        }
        
        // Sum of digits
        int number = 12345;
        int sum = 0;
        while (number > 0) {
            sum += number % 10;
            number /= 10;
        }
        System.out.println("Sum of digits: " + sum);
    }
}
```

### Do-While Loop

The `do-while` loop executes at least once, then checks the condition.

```java
import java.util.Scanner;

public class DoWhileDemo {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        int choice;
        
        do {
            System.out.println("\n=== Menu ===");
            System.out.println("1. Option 1");
            System.out.println("2. Option 2");
            System.out.println("3. Exit");
            System.out.print("Enter choice: ");
            choice = scanner.nextInt();
            
            switch (choice) {
                case 1:
                    System.out.println("You selected Option 1");
                    break;
                case 2:
                    System.out.println("You selected Option 2");
                    break;
                case 3:
                    System.out.println("Exiting...");
                    break;
                default:
                    System.out.println("Invalid choice!");
            }
        } while (choice != 3);
        
        scanner.close();
    }
}
```

## Mathematical Examples with Loops

### Factorial Calculation

Factorial: \( n! = n \times (n-1) \times (n-2) \times \ldots \times 1 \)

```java
public class Factorial {
    public static long factorial(int n) {
        if (n < 0) {
            throw new IllegalArgumentException("Factorial not defined for negative numbers");
        }
        
        long result = 1;
        for (int i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    }
    
    public static void main(String[] args) {
        for (int i = 0; i <= 10; i++) {
            System.out.println(i + "! = " + factorial(i));
        }
    }
}
```

### Fibonacci Sequence

Fibonacci: \( F_n = F_{n-1} + F_{n-2} \), where \( F_0 = 0 \) and \( F_1 = 1 \)

```java
public class Fibonacci {
    public static void printFibonacci(int n) {
        if (n <= 0) return;
        
        long a = 0, b = 1;
        
        if (n >= 1) System.out.print(a + " ");
        if (n >= 2) System.out.print(b + " ");
        
        for (int i = 3; i <= n; i++) {
            long next = a + b;
            System.out.print(next + " ");
            a = b;
            b = next;
        }
        System.out.println();
    }
    
    public static long fibonacci(int n) {
        if (n <= 1) return n;
        
        long a = 0, b = 1;
        for (int i = 2; i <= n; i++) {
            long temp = a + b;
            a = b;
            b = temp;
        }
        return b;
    }
    
    public static void main(String[] args) {
        System.out.println("First 10 Fibonacci numbers:");
        printFibonacci(10);
        
        System.out.println("\nFibonacci numbers up to 20:");
        for (int i = 0; i <= 20; i++) {
            System.out.println("F(" + i + ") = " + fibonacci(i));
        }
    }
}
```

### Prime Number Checker

```java
public class PrimeNumbers {
    public static boolean isPrime(int n) {
        if (n < 2) return false;
        if (n == 2) return true;
        if (n % 2 == 0) return false;
        
        int limit = (int) Math.sqrt(n) + 1;
        for (int i = 3; i <= limit; i += 2) {
            if (n % i == 0) return false;
        }
        return true;
    }
    
    public static void printPrimes(int limit) {
        System.out.println("Prime numbers up to " + limit + ":");
        for (int i = 2; i <= limit; i++) {
            if (isPrime(i)) {
                System.out.print(i + " ");
            }
        }
        System.out.println();
    }
    
    public static void main(String[] args) {
        printPrimes(50);
        
        System.out.println("\nFirst 20 prime numbers:");
        int count = 0;
        int num = 2;
        while (count < 20) {
            if (isPrime(num)) {
                System.out.print(num + " ");
                count++;
            }
            num++;
        }
        System.out.println();
    }
}
```

### Sum of Series

Example: Sum of squares: \( S = \sum_{i=1}^{n} i^2 = \frac{n(n+1)(2n+1)}{6} \)

```java
public class SeriesSum {
    // Sum of first n natural numbers
    public static long sumOfNaturalNumbers(int n) {
        return (long) n * (n + 1) / 2;  // n(n+1)/2
    }
    
    // Sum of squares: Σi²
    public static long sumOfSquares(int n) {
        return (long) n * (n + 1) * (2 * n + 1) / 6;
    }
    
    // Sum using loop
    public static long sumOfSquaresLoop(int n) {
        long sum = 0;
        for (int i = 1; i <= n; i++) {
            sum += i * i;
        }
        return sum;
    }
    
    // Geometric series: a + ar + ar² + ... + ar^(n-1)
    public static double geometricSum(double a, double r, int n) {
        if (r == 1) return a * n;
        return a * (1 - Math.pow(r, n)) / (1 - r);
    }
    
    // Harmonic series: 1 + 1/2 + 1/3 + ... + 1/n
    public static double harmonicSum(int n) {
        double sum = 0;
        for (int i = 1; i <= n; i++) {
            sum += 1.0 / i;
        }
        return sum;
    }
    
    public static void main(String[] args) {
        int n = 10;
        
        System.out.println("Sum of first " + n + " natural numbers: " + 
                          sumOfNaturalNumbers(n));
        
        System.out.println("Sum of squares (formula): " + sumOfSquares(n));
        System.out.println("Sum of squares (loop): " + sumOfSquaresLoop(n));
        
        System.out.println("Geometric sum (a=1, r=2, n=5): " + 
                          geometricSum(1, 2, 5));
        
        System.out.println("Harmonic sum (n=10): " + harmonicSum(10));
    }
}
```

## Nested Loops

Nested loops are useful for working with 2D structures.

### Multiplication Table

```java
public class MultiplicationTable {
    public static void printTable(int n) {
        System.out.print("    ");
        for (int i = 1; i <= n; i++) {
            System.out.printf("%4d", i);
        }
        System.out.println();
        
        for (int i = 1; i <= n; i++) {
            System.out.printf("%4d", i);
            for (int j = 1; j <= n; j++) {
                System.out.printf("%4d", i * j);
            }
            System.out.println();
        }
    }
    
    public static void main(String[] args) {
        printTable(10);
    }
}
```

### Pattern Printing

```java
public class Patterns {
    // Print triangle pattern
    public static void printTriangle(int n) {
        for (int i = 1; i <= n; i++) {
            for (int j = 1; j <= i; j++) {
                System.out.print("* ");
            }
            System.out.println();
        }
    }
    
    // Print number pyramid
    public static void printNumberPyramid(int n) {
        for (int i = 1; i <= n; i++) {
            // Print spaces
            for (int j = 1; j <= n - i; j++) {
                System.out.print(" ");
            }
            // Print numbers
            for (int j = 1; j <= i; j++) {
                System.out.print(j + " ");
            }
            System.out.println();
        }
    }
    
    // Print Pascal's triangle (binomial coefficients)
    public static void printPascalTriangle(int n) {
        for (int i = 0; i < n; i++) {
            // Print spaces
            for (int j = 0; j < n - i - 1; j++) {
                System.out.print(" ");
            }
            
            // Print binomial coefficients
            int value = 1;
            for (int j = 0; j <= i; j++) {
                System.out.print(value + " ");
                value = value * (i - j) / (j + 1);
            }
            System.out.println();
        }
    }
    
    public static void main(String[] args) {
        System.out.println("Triangle:");
        printTriangle(5);
        
        System.out.println("\nNumber Pyramid:");
        printNumberPyramid(5);
        
        System.out.println("\nPascal's Triangle:");
        printPascalTriangle(6);
    }
}
```

## Loop Control Statements

### Break Statement

Exits the loop immediately.

```java
public class BreakDemo {
    public static void main(String[] args) {
        for (int i = 1; i <= 10; i++) {
            if (i == 5) {
                break;  // Exit loop when i equals 5
            }
            System.out.print(i + " ");
        }
        System.out.println("\nLoop ended");
    }
}
```

### Continue Statement

Skips the rest of the current iteration and continues to the next.

```java
public class ContinueDemo {
    public static void main(String[] args) {
        for (int i = 1; i <= 10; i++) {
            if (i % 2 == 0) {
                continue;  // Skip even numbers
            }
            System.out.print(i + " ");
        }
        System.out.println();
    }
}
```

## Summary

Control structures and loops enable program flow control:

1. **Conditionals**: `if-else`, `switch` - Make decisions
2. **Loops**: `for`, `while`, `do-while` - Repeat code
3. **Control Flow**: `break`, `continue` - Modify loop behavior
4. **Mathematical Applications**: Factorials, Fibonacci, prime numbers, series

Key concepts:
- Conditional statements execute code based on conditions
- Loops repeat code blocks
- Nested loops work with 2D structures
- Break and continue modify loop execution
- Mathematical problems demonstrate practical applications

Mastering control structures and loops is essential for implementing algorithms and solving problems in Java.

