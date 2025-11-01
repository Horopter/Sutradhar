# Lesson 5: Exception Handling in Java

## Overview

Exception handling is a crucial mechanism in Java that allows programs to respond gracefully to runtime errors and unexpected situations. Instead of crashing, Java programs can catch exceptions, log errors, and recover or fail gracefully. Understanding exception handling is essential for building robust, production-ready Java applications.

## Exception Hierarchy

Java's exception hierarchy:

```
Throwable
├── Error (serious system errors, usually not caught)
│   ├── OutOfMemoryError
│   ├── StackOverflowError
│   └── ...
└── Exception (checked and unchecked exceptions)
    ├── RuntimeException (unchecked)
    │   ├── NullPointerException
    │   ├── ArrayIndexOutOfBoundsException
    │   ├── IllegalArgumentException
    │   └── ...
    └── Checked Exceptions
        ├── IOException
        ├── FileNotFoundException
        └── ...
```

### Checked vs. Unchecked Exceptions

- **Checked Exceptions**: Must be handled or declared (compile-time checking)
- **Unchecked Exceptions**: `RuntimeException` and its subclasses (runtime checking)

## Try-Catch Blocks

### Basic Exception Handling

```java
public class ExceptionBasics {
    public static void main(String[] args) {
        try {
            int result = 10 / 0;  // This will throw ArithmeticException
        } catch (ArithmeticException e) {
            System.out.println("Error: " + e.getMessage());
            System.out.println("Cannot divide by zero!");
        }
        
        System.out.println("Program continues after exception handling");
    }
}
```

### Multiple Catch Blocks

```java
public class MultipleCatch {
    public static void main(String[] args) {
        try {
            int[] numbers = {1, 2, 3};
            System.out.println(numbers[5]);  // ArrayIndexOutOfBoundsException
            
            String str = null;
            System.out.println(str.length());  // NullPointerException
            
        } catch (ArrayIndexOutOfBoundsException e) {
            System.out.println("Array index out of bounds: " + e.getMessage());
        } catch (NullPointerException e) {
            System.out.println("Null pointer exception: " + e.getMessage());
        } catch (Exception e) {
            System.out.println("General exception: " + e.getMessage());
        }
    }
}
```

### Try-Catch-Finally

The `finally` block always executes, regardless of whether an exception occurs.

```java
import java.io.FileReader;
import java.io.IOException;

public class FinallyDemo {
    public static void main(String[] args) {
        FileReader file = null;
        try {
            file = new FileReader("data.txt");
            // Read file operations
            System.out.println("File read successfully");
        } catch (IOException e) {
            System.out.println("Error reading file: " + e.getMessage());
        } finally {
            // Always executes
            if (file != null) {
                try {
                    file.close();
                    System.out.println("File closed");
                } catch (IOException e) {
                    System.out.println("Error closing file: " + e.getMessage());
                }
            }
        }
    }
}
```

### Try-With-Resources (Java 7+)

Automatically closes resources that implement `AutoCloseable`.

```java
import java.io.FileReader;
import java.io.IOException;

public class TryWithResources {
    public static void main(String[] args) {
        try (FileReader file = new FileReader("data.txt")) {
            // File automatically closed at end of try block
            System.out.println("Reading file...");
        } catch (IOException e) {
            System.out.println("Error: " + e.getMessage());
        }
        // File is automatically closed here
    }
}
```

## Throwing Exceptions

### Throwing Custom Exceptions

```java
public class ThrowException {
    public static void checkAge(int age) {
        if (age < 0) {
            throw new IllegalArgumentException("Age cannot be negative: " + age);
        }
        if (age > 150) {
            throw new IllegalArgumentException("Age cannot be greater than 150: " + age);
        }
        System.out.println("Valid age: " + age);
    }
    
    public static void main(String[] args) {
        try {
            checkAge(-5);
        } catch (IllegalArgumentException e) {
            System.out.println("Caught exception: " + e.getMessage());
        }
        
        try {
            checkAge(200);
        } catch (IllegalArgumentException e) {
            System.out.println("Caught exception: " + e.getMessage());
        }
        
        checkAge(25);  // Valid age
    }
}
```

## Custom Exception Classes

### Creating Custom Exceptions

```java
// Custom checked exception
class InsufficientFundsException extends Exception {
    private double amount;
    
    public InsufficientFundsException(double amount) {
        super("Insufficient funds. Required: " + amount);
        this.amount = amount;
    }
    
    public double getAmount() {
        return amount;
    }
}

// Custom unchecked exception
class InvalidInputException extends RuntimeException {
    public InvalidInputException(String message) {
        super(message);
    }
}

public class CustomExceptionDemo {
    static class BankAccount {
        private double balance;
        
        public BankAccount(double initialBalance) {
            this.balance = initialBalance;
        }
        
        public void withdraw(double amount) throws InsufficientFundsException {
            if (amount > balance) {
                throw new InsufficientFundsException(amount);
            }
            balance -= amount;
            System.out.println("Withdrawn: $" + amount + ", Remaining: $" + balance);
        }
        
        public double getBalance() {
            return balance;
        }
    }
    
    public static void main(String[] args) {
        BankAccount account = new BankAccount(1000);
        
        try {
            account.withdraw(500);
            account.withdraw(600);  // This will throw exception
        } catch (InsufficientFundsException e) {
            System.out.println("Exception: " + e.getMessage());
            System.out.println("Your balance: $" + account.getBalance());
        }
    }
}
```

## Mathematical Calculator with Exception Handling

```java
import java.util.InputMismatchException;
import java.util.Scanner;

public class CalculatorWithExceptions {
    
    public static double divide(double numerator, double denominator) 
            throws ArithmeticException {
        if (denominator == 0) {
            throw new ArithmeticException("Division by zero is undefined");
        }
        return numerator / denominator;
    }
    
    public static double squareRoot(double value) throws IllegalArgumentException {
        if (value < 0) {
            throw new IllegalArgumentException(
                "Square root of negative number is not real: " + value);
        }
        return Math.sqrt(value);
    }
    
    public static double logarithm(double value, double base) 
            throws IllegalArgumentException {
        if (value <= 0) {
            throw new IllegalArgumentException(
                "Logarithm of non-positive number is undefined: " + value);
        }
        if (base <= 0 || base == 1) {
            throw new IllegalArgumentException("Invalid logarithm base: " + base);
        }
        return Math.log(value) / Math.log(base);
    }
    
    public static long factorial(int n) throws IllegalArgumentException {
        if (n < 0) {
            throw new IllegalArgumentException(
                "Factorial of negative number is undefined: " + n);
        }
        if (n > 20) {
            throw new IllegalArgumentException(
                "Factorial too large for long type: " + n);
        }
        
        long result = 1;
        for (int i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    }
    
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        boolean continueCalculations = true;
        
        while (continueCalculations) {
            try {
                System.out.println("\n=== Calculator ===");
                System.out.println("1. Divide");
                System.out.println("2. Square Root");
                System.out.println("3. Logarithm");
                System.out.println("4. Factorial");
                System.out.println("5. Exit");
                System.out.print("Enter choice: ");
                
                int choice = scanner.nextInt();
                
                if (choice == 5) {
                    continueCalculations = false;
                    continue;
                }
                
                double result = 0;
                
                switch (choice) {
                    case 1:
                        System.out.print("Enter numerator: ");
                        double num = scanner.nextDouble();
                        System.out.print("Enter denominator: ");
                        double den = scanner.nextDouble();
                        result = divide(num, den);
                        System.out.println("Result: " + result);
                        break;
                        
                    case 2:
                        System.out.print("Enter number: ");
                        double value = scanner.nextDouble();
                        result = squareRoot(value);
                        System.out.println("Square root: " + result);
                        break;
                        
                    case 3:
                        System.out.print("Enter value: ");
                        double val = scanner.nextDouble();
                        System.out.print("Enter base: ");
                        double base = scanner.nextDouble();
                        result = logarithm(val, base);
                        System.out.println("Logarithm: " + result);
                        break;
                        
                    case 4:
                        System.out.print("Enter number: ");
                        int n = scanner.nextInt();
                        long fact = factorial(n);
                        System.out.println("Factorial: " + fact);
                        break;
                        
                    default:
                        System.out.println("Invalid choice!");
                }
                
            } catch (ArithmeticException e) {
                System.err.println("Arithmetic Error: " + e.getMessage());
            } catch (IllegalArgumentException e) {
                System.err.println("Invalid Argument: " + e.getMessage());
            } catch (InputMismatchException e) {
                System.err.println("Input Error: Please enter a valid number");
                scanner.nextLine();  // Clear invalid input
            } catch (Exception e) {
                System.err.println("Unexpected Error: " + e.getMessage());
                e.printStackTrace();
            }
        }
        
        scanner.close();
        System.out.println("Calculator closed. Goodbye!");
    }
}
```

## Exception Propagation

Exceptions propagate up the call stack if not caught.

```java
public class ExceptionPropagation {
    public static void method1() {
        System.out.println("In method1");
        method2();
    }
    
    public static void method2() {
        System.out.println("In method2");
        method3();
    }
    
    public static void method3() {
        System.out.println("In method3");
        throw new RuntimeException("Exception in method3");
    }
    
    public static void main(String[] args) {
        try {
            method1();
        } catch (RuntimeException e) {
            System.out.println("Caught in main: " + e.getMessage());
            System.out.println("Stack trace:");
            e.printStackTrace();
        }
    }
}
```

## Best Practices

### 1. Specific Exception Types

```java
// Good: Specific exception
try {
    // code
} catch (FileNotFoundException e) {
    // handle file not found
} catch (IOException e) {
    // handle other IO errors
}

// Bad: Catching generic Exception
try {
    // code
} catch (Exception e) {
    // too generic
}
```

### 2. Don't Swallow Exceptions

```java
// Bad: Swallowing exception
try {
    riskyOperation();
} catch (Exception e) {
    // Empty catch block - exception is ignored!
}

// Good: Log or handle appropriately
try {
    riskyOperation();
} catch (Exception e) {
    System.err.println("Error occurred: " + e.getMessage());
    e.printStackTrace();
}
```

### 3. Clean Up Resources

```java
// Good: Using try-with-resources
try (BufferedReader reader = new BufferedReader(new FileReader("file.txt"))) {
    // use reader
} catch (IOException e) {
    // handle exception
}
// Reader automatically closed
```

### 4. Document Exceptions

```java
/**
 * Divides two numbers.
 * @param a numerator
 * @param b denominator
 * @return result of division
 * @throws ArithmeticException if denominator is zero
 */
public static double divide(double a, double b) throws ArithmeticException {
    if (b == 0) {
        throw new ArithmeticException("Division by zero");
    }
    return a / b;
}
```

## Summary

Exception handling enables robust error management:

1. **Try-Catch Blocks**: Handle exceptions gracefully
2. **Finally Blocks**: Clean up resources
3. **Try-With-Resources**: Automatic resource management
4. **Custom Exceptions**: Domain-specific error handling
5. **Exception Propagation**: Understanding call stack
6. **Best Practices**: Writing maintainable exception code

Key concepts:
- Checked exceptions must be handled or declared
- Unchecked exceptions extend RuntimeException
- Always clean up resources
- Use specific exception types
- Don't swallow exceptions silently
- Document exceptions in method signatures

Proper exception handling makes Java applications more robust, maintainable, and user-friendly by gracefully managing unexpected situations.

