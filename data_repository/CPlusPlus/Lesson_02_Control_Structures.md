# Lesson 2: Control Structures in C++

## Overview

Control structures are fundamental programming constructs that allow you to control the flow of execution in your programs. C++ provides three main types of control structures: sequential, selection (conditional), and iteration (looping). Understanding these structures is essential for writing effective programs that can make decisions and repeat actions.

## Selection Structures

### The `if` Statement

The `if` statement allows conditional execution of code based on a boolean expression.

#### Basic Syntax

```cpp
if (condition) {
    // Code to execute if condition is true
}
```

#### Example: Grade Classifier

```cpp
#include <iostream>

int main() {
    int score;
    std::cout << "Enter your score (0-100): ";
    std::cin >> score;
    
    if (score >= 90) {
        std::cout << "Grade: A" << std::endl;
    }
    if (score >= 80 && score < 90) {
        std::cout << "Grade: B" << std::endl;
    }
    if (score >= 70 && score < 80) {
        std::cout << "Grade: C" << std::endl;
    }
    if (score >= 60 && score < 70) {
        std::cout << "Grade: D" << std::endl;
    }
    if (score < 60) {
        std::cout << "Grade: F" << std::endl;
    }
    
    return 0;
}
```

### The `if-else` Statement

The `if-else` statement provides an alternative path when the condition is false.

```cpp
if (condition) {
    // Code if condition is true
} else {
    // Code if condition is false
}
```

### The `if-else-if` Ladder

Multiple conditions can be checked using `else if`:

```cpp
if (condition1) {
    // Code for condition1
} else if (condition2) {
    // Code for condition2
} else if (condition3) {
    // Code for condition3
} else {
    // Default code
}
```

### Improved Grade Classifier

```cpp
#include <iostream>

int main() {
    int score;
    std::cout << "Enter your score (0-100): ";
    std::cin >> score;
    
    if (score >= 90) {
        std::cout << "Grade: A (Excellent!)" << std::endl;
    } else if (score >= 80) {
        std::cout << "Grade: B (Good!)" << std::endl;
    } else if (score >= 70) {
        std::cout << "Grade: C (Average)" << std::endl;
    } else if (score >= 60) {
        std::cout << "Grade: D (Below Average)" << std::endl;
    } else {
        std::cout << "Grade: F (Fail)" << std::endl;
    }
    
    return 0;
}
```

### Mathematical Example: Finding Maximum and Minimum

```cpp
#include <iostream>
#include <algorithm>

int main() {
    double a, b, c;
    
    std::cout << "Enter three numbers: ";
    std::cin >> a >> b >> c;
    
    double maximum, minimum;
    
    // Find maximum
    if (a >= b && a >= c) {
        maximum = a;
    } else if (b >= a && b >= c) {
        maximum = b;
    } else {
        maximum = c;
    }
    
    // Find minimum
    if (a <= b && a <= c) {
        minimum = a;
    } else if (b <= a && b <= c) {
        minimum = b;
    } else {
        minimum = c;
    }
    
    std::cout << "Maximum: " << maximum << std::endl;
    std::cout << "Minimum: " << minimum << std::endl;
    std::cout << "Range: " << (maximum - minimum) << std::endl;
    
    return 0;
}
```

### The Ternary Operator

A shorthand for simple `if-else` statements:

```cpp
variable = (condition) ? value_if_true : value_if_false;
```

```cpp
int max = (a > b) ? a : b;
std::string result = (score >= 60) ? "Pass" : "Fail";
```

## Switch Statement

The `switch` statement is useful when comparing a variable against multiple constant values.

```cpp
switch (expression) {
    case constant1:
        // Code
        break;
    case constant2:
        // Code
        break;
    default:
        // Default code
}
```

### Example: Day of Week Calculator

```cpp
#include <iostream>

int main() {
    int day;
    std::cout << "Enter day number (1-7): ";
    std::cin >> day;
    
    switch (day) {
        case 1:
            std::cout << "Monday" << std::endl;
            break;
        case 2:
            std::cout << "Tuesday" << std::endl;
            break;
        case 3:
            std::cout << "Wednesday" << std::endl;
            break;
        case 4:
            std::cout << "Thursday" << std::endl;
            break;
        case 5:
            std::cout << "Friday" << std::endl;
            break;
        case 6:
            std::cout << "Saturday" << std::endl;
            break;
        case 7:
            std::cout << "Sunday" << std::endl;
            break;
        default:
            std::cout << "Invalid day number!" << std::endl;
    }
    
    return 0;
}
```

### Mathematical Calculator with Switch

```cpp
#include <iostream>

int main() {
    double num1, num2, result;
    char operation;
    
    std::cout << "Enter first number: ";
    std::cin >> num1;
    
    std::cout << "Enter operation (+, -, *, /, %): ";
    std::cin >> operation;
    
    std::cout << "Enter second number: ";
    std::cin >> num2;
    
    switch (operation) {
        case '+':
            result = num1 + num2;
            std::cout << num1 << " + " << num2 << " = " << result << std::endl;
            break;
        case '-':
            result = num1 - num2;
            std::cout << num1 << " - " << num2 << " = " << result << std::endl;
            break;
        case '*':
            result = num1 * num2;
            std::cout << num1 << " * " << num2 << " = " << result << std::endl;
            break;
        case '/':
            if (num2 != 0) {
                result = num1 / num2;
                std::cout << num1 << " / " << num2 << " = " << result << std::endl;
            } else {
                std::cout << "Error: Division by zero!" << std::endl;
            }
            break;
        default:
            std::cout << "Invalid operation!" << std::endl;
    }
    
    return 0;
}
```

## Iteration Structures (Loops)

### The `for` Loop

The `for` loop is ideal when you know the number of iterations beforehand.

```cpp
for (initialization; condition; increment) {
    // Loop body
}
```

### Example: Sum of First N Natural Numbers

The sum of first N natural numbers is given by: \( S = \frac{n(n+1)}{2} \)

```cpp
#include <iostream>

int main() {
    int n;
    std::cout << "Enter n: ";
    std::cin >> n;
    
    int sum = 0;
    
    // Calculate sum using loop
    for (int i = 1; i <= n; i++) {
        sum += i;
    }
    
    // Verify with formula
    int formulaSum = n * (n + 1) / 2;
    
    std::cout << "Sum using loop: " << sum << std::endl;
    std::cout << "Sum using formula: " << formulaSum << std::endl;
    
    return 0;
}
```

### Example: Factorial Calculation

Factorial of n (denoted as n!) is: \( n! = n \times (n-1) \times (n-2) \times \ldots \times 1 \)

```cpp
#include <iostream>

int main() {
    int n;
    std::cout << "Enter a number: ";
    std::cin >> n;
    
    if (n < 0) {
        std::cout << "Factorial is not defined for negative numbers." << std::endl;
        return 1;
    }
    
    long long factorial = 1;
    
    for (int i = 1; i <= n; i++) {
        factorial *= i;
    }
    
    std::cout << n << "! = " << factorial << std::endl;
    
    return 0;
}
```

### Example: Prime Number Checker

A prime number is only divisible by 1 and itself. We check divisibility from 2 to \(\sqrt{n}\).

```cpp
#include <iostream>
#include <cmath>

bool isPrime(int n) {
    if (n < 2) return false;
    if (n == 2) return true;
    if (n % 2 == 0) return false;
    
    int limit = static_cast<int>(std::sqrt(n)) + 1;
    for (int i = 3; i <= limit; i += 2) {
        if (n % i == 0) {
            return false;
        }
    }
    return true;
}

int main() {
    int num;
    std::cout << "Enter a number: ";
    std::cin >> num;
    
    if (isPrime(num)) {
        std::cout << num << " is a prime number." << std::endl;
    } else {
        std::cout << num << " is not a prime number." << std::endl;
    }
    
    return 0;
}
```

### The `while` Loop

The `while` loop repeats as long as a condition is true.

```cpp
while (condition) {
    // Loop body
}
```

### Example: Calculating GCD (Greatest Common Divisor) using Euclidean Algorithm

The Euclidean algorithm finds GCD using: \( \gcd(a, b) = \gcd(b, a \bmod b) \)

```cpp
#include <iostream>

int gcd(int a, int b) {
    while (b != 0) {
        int temp = b;
        b = a % b;
        a = temp;
    }
    return a;
}

int main() {
    int a, b;
    std::cout << "Enter two numbers: ";
    std::cin >> a >> b;
    
    int result = gcd(a, b);
    std::cout << "GCD of " << a << " and " << b << " is " << result << std::endl;
    
    // LCM can be calculated as: LCM(a, b) = |a * b| / GCD(a, b)
    int lcm = (a * b) / result;
    std::cout << "LCM of " << a << " and " << b << " is " << lcm << std::endl;
    
    return 0;
}
```

### The `do-while` Loop

The `do-while` loop executes at least once, then checks the condition.

```cpp
do {
    // Loop body
} while (condition);
```

### Example: Menu-Driven Program

```cpp
#include <iostream>
#include <cmath>

int main() {
    int choice;
    double num;
    
    do {
        std::cout << "\n=== Math Operations Menu ===" << std::endl;
        std::cout << "1. Square" << std::endl;
        std::cout << "2. Square Root" << std::endl;
        std::cout << "3. Cube" << std::endl;
        std::cout << "4. Exit" << std::endl;
        std::cout << "Enter your choice: ";
        std::cin >> choice;
        
        if (choice >= 1 && choice <= 3) {
            std::cout << "Enter a number: ";
            std::cin >> num;
        }
        
        switch (choice) {
            case 1:
                std::cout << "Square of " << num << " = " << (num * num) << std::endl;
                break;
            case 2:
                if (num >= 0) {
                    std::cout << "Square root of " << num << " = " << std::sqrt(num) << std::endl;
                } else {
                    std::cout << "Cannot calculate square root of negative number!" << std::endl;
                }
                break;
            case 3:
                std::cout << "Cube of " << num << " = " << (num * num * num) << std::endl;
                break;
            case 4:
                std::cout << "Exiting..." << std::endl;
                break;
            default:
                std::cout << "Invalid choice!" << std::endl;
        }
    } while (choice != 4);
    
    return 0;
}
```

## Nested Loops

Loops can be nested inside other loops, useful for working with 2D structures.

### Example: Multiplication Table

```cpp
#include <iostream>
#include <iomanip>

int main() {
    int n;
    std::cout << "Enter the size of multiplication table: ";
    std::cin >> n;
    
    std::cout << "\nMultiplication Table (1 to " << n << "):\n" << std::endl;
    std::cout << std::setw(6) << " ";
    
    // Print header
    for (int i = 1; i <= n; i++) {
        std::cout << std::setw(6) << i;
    }
    std::cout << std::endl;
    
    // Print table
    for (int i = 1; i <= n; i++) {
        std::cout << std::setw(6) << i;
        for (int j = 1; j <= n; j++) {
            std::cout << std::setw(6) << (i * j);
        }
        std::cout << std::endl;
    }
    
    return 0;
}
```

### Example: Pattern Printing - Pascal's Triangle

Pascal's Triangle has binomial coefficients: \( \binom{n}{k} = \frac{n!}{k!(n-k)!} \)

```cpp
#include <iostream>
#include <iomanip>

int factorial(int n) {
    if (n <= 1) return 1;
    int result = 1;
    for (int i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

int binomialCoefficient(int n, int k) {
    return factorial(n) / (factorial(k) * factorial(n - k));
}

int main() {
    int rows;
    std::cout << "Enter number of rows for Pascal's Triangle: ";
    std::cin >> rows;
    
    for (int i = 0; i < rows; i++) {
        // Print leading spaces
        for (int j = 0; j < rows - i - 1; j++) {
            std::cout << "  ";
        }
        
        // Print binomial coefficients
        for (int j = 0; j <= i; j++) {
            std::cout << std::setw(4) << binomialCoefficient(i, j);
        }
        std::cout << std::endl;
    }
    
    return 0;
}
```

## Loop Control Statements

### `break` Statement

Exits the loop immediately.

```cpp
for (int i = 1; i <= 10; i++) {
    if (i == 5) {
        break;  // Exit loop when i equals 5
    }
    std::cout << i << " ";
}
// Output: 1 2 3 4
```

### `continue` Statement

Skips the rest of the current iteration and continues to the next.

```cpp
for (int i = 1; i <= 10; i++) {
    if (i % 2 == 0) {
        continue;  // Skip even numbers
    }
    std::cout << i << " ";
}
// Output: 1 3 5 7 9
```

### Example: Finding First N Prime Numbers

```cpp
#include <iostream>
#include <cmath>

bool isPrime(int n) {
    if (n < 2) return false;
    if (n == 2) return true;
    if (n % 2 == 0) return false;
    
    int limit = static_cast<int>(std::sqrt(n)) + 1;
    for (int i = 3; i <= limit; i += 2) {
        if (n % i == 0) return false;
    }
    return true;
}

int main() {
    int n;
    std::cout << "Enter how many prime numbers to find: ";
    std::cin >> n;
    
    int count = 0;
    int num = 2;
    
    std::cout << "First " << n << " prime numbers:" << std::endl;
    
    while (count < n) {
        if (isPrime(num)) {
            std::cout << num << " ";
            count++;
        }
        num++;
    }
    std::cout << std::endl;
    
    return 0;
}
```

## Mathematical Series: Fibonacci Sequence

The Fibonacci sequence: \( F_n = F_{n-1} + F_{n-2} \), where \( F_0 = 0 \) and \( F_1 = 1 \)

```cpp
#include <iostream>

int main() {
    int n;
    std::cout << "Enter number of terms: ";
    std::cin >> n;
    
    if (n <= 0) {
        std::cout << "Invalid input!" << std::endl;
        return 1;
    }
    
    long long a = 0, b = 1;
    
    std::cout << "Fibonacci sequence: ";
    
    if (n >= 1) std::cout << a << " ";
    if (n >= 2) std::cout << b << " ";
    
    for (int i = 3; i <= n; i++) {
        long long next = a + b;
        std::cout << next << " ";
        a = b;
        b = next;
    }
    std::cout << std::endl;
    
    return 0;
}
```

## Summary

Control structures are essential for creating dynamic, decision-making programs:

- **Selection**: `if`, `if-else`, `switch` - Make decisions based on conditions
- **Iteration**: `for`, `while`, `do-while` - Repeat code blocks
- **Control Flow**: `break`, `continue` - Modify loop behavior

These structures, combined with mathematical concepts, enable you to solve complex problems. Practice with various mathematical problems like finding primes, calculating series, and working with algorithms to master control structures.

