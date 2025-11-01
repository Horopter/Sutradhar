# Lesson 2: JavaScript Fundamentals

## Overview

JavaScript is a versatile programming language that powers interactivity on the web. Originally created for browser scripting, JavaScript has evolved into a full-stack language used for frontend, backend, and mobile development. This lesson covers JavaScript fundamentals including variables, data types, functions, control structures, and DOM manipulation with mathematical examples.

## JavaScript in the Browser

JavaScript can be included in HTML documents in three ways:

### Inline Script

```html
<script>
    console.log("Hello, JavaScript!");
</script>
```

### External Script

```html
<script src="script.js"></script>
```

### Event Handler

```html
<button onclick="alert('Clicked!')">Click Me</button>
```

## Variables and Data Types

### Variable Declarations

```javascript
// var (function-scoped, hoisted)
var name = "JavaScript";

// let (block-scoped, can be reassigned)
let age = 25;

// const (block-scoped, cannot be reassigned)
const PI = 3.14159;
```

### Data Types

JavaScript has dynamic typing - variables can hold values of any type.

```javascript
// Primitive Types
let number = 42;
let string = "Hello";
let boolean = true;
let nullValue = null;
let undefinedValue = undefined;
let symbol = Symbol('id');

// Object Types
let object = { name: "John", age: 30 };
let array = [1, 2, 3, 4, 5];
let date = new Date();

console.log(typeof number);    // "number"
console.log(typeof string);    // "string"
console.log(typeof boolean);   // "boolean"
console.log(typeof object);    // "object"
console.log(typeof array);     // "object" (arrays are objects)
```

## Mathematical Operations

### Basic Arithmetic

```javascript
let a = 10;
let b = 3;

console.log("Addition:", a + b);        // 13
console.log("Subtraction:", a - b);     // 7
console.log("Multiplication:", a * b);  // 30
console.log("Division:", a / b);        // 3.333...
console.log("Modulus:", a % b);         // 1
console.log("Exponentiation:", a ** b); // 1000 (10^3)
```

### Math Object

```javascript
// Constants
console.log(Math.PI);        // 3.141592653589793
console.log(Math.E);         // 2.718281828459045

// Basic Functions
console.log(Math.abs(-5));           // 5
console.log(Math.ceil(4.3));         // 5
console.log(Math.floor(4.7));        // 4
console.log(Math.round(4.5));        // 5
console.log(Math.max(1, 2, 3, 4, 5)); // 5
console.log(Math.min(1, 2, 3, 4, 5)); // 1

// Power and Roots
console.log(Math.pow(2, 3));         // 8
console.log(Math.sqrt(16));          // 4
console.log(Math.cbrt(27));          // 3

// Logarithms
console.log(Math.log(Math.E));       // 1
console.log(Math.log10(100));        // 2
console.log(Math.log2(8));           // 3

// Trigonometric Functions (angles in radians)
console.log(Math.sin(Math.PI / 2));  // 1
console.log(Math.cos(0));            // 1
console.log(Math.tan(Math.PI / 4));  // 1

// Random Number
console.log(Math.random());          // Random number between 0 and 1
console.log(Math.floor(Math.random() * 100)); // Random integer 0-99
```

## Functions

### Function Declarations

```javascript
function greet(name) {
    return `Hello, ${name}!`;
}

console.log(greet("JavaScript")); // "Hello, JavaScript!"
```

### Function Expressions

```javascript
const add = function(a, b) {
    return a + b;
};

console.log(add(5, 3)); // 8
```

### Arrow Functions

```javascript
const multiply = (a, b) => a * b;

const square = x => x * x;

const greet = (name) => {
    return `Hello, ${name}!`;
};
```

### Mathematical Functions Example

```javascript
// Calculate distance between two points
// Distance formula: d = √[(x₂-x₁)² + (y₂-y₁)²]
function distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

console.log(distance(0, 0, 3, 4)); // 5

// Calculate quadratic equation roots
// Formula: x = (-b ± √(b²-4ac)) / 2a
function quadraticRoots(a, b, c) {
    const discriminant = b * b - 4 * a * c;
    
    if (discriminant < 0) {
        return { type: "complex", roots: null };
    } else if (discriminant === 0) {
        const root = -b / (2 * a);
        return { type: "single", root: root };
    } else {
        const root1 = (-b + Math.sqrt(discriminant)) / (2 * a);
        const root2 = (-b - Math.sqrt(discriminant)) / (2 * a);
        return { type: "two", root1: root1, root2: root2 };
    }
}

const result = quadraticRoots(1, -5, 6);
console.log(result); // { type: "two", root1: 3, root2: 2 }
```

## Control Structures

### Conditionals

```javascript
let score = 85;

if (score >= 90) {
    console.log("Grade: A");
} else if (score >= 80) {
    console.log("Grade: B");
} else if (score >= 70) {
    console.log("Grade: C");
} else {
    console.log("Grade: F");
}

// Ternary operator
let grade = score >= 60 ? "Pass" : "Fail";
console.log(grade);

// Switch statement
switch (score) {
    case 100:
        console.log("Perfect!");
        break;
    case 90:
    case 91:
    case 92:
        console.log("Excellent!");
        break;
    default:
        console.log("Keep working!");
}
```

### Loops

```javascript
// For loop
for (let i = 0; i < 5; i++) {
    console.log(i);
}

// While loop
let count = 0;
while (count < 5) {
    console.log(count);
    count++;
}

// Do-while loop
let num = 0;
do {
    console.log(num);
    num++;
} while (num < 5);

// For...of loop (arrays)
const numbers = [1, 2, 3, 4, 5];
for (let num of numbers) {
    console.log(num);
}

// For...in loop (objects)
const person = { name: "John", age: 30 };
for (let key in person) {
    console.log(key + ": " + person[key]);
}
```

## Arrays

### Array Operations

```javascript
// Create arrays
let numbers = [1, 2, 3, 4, 5];
let fruits = ["Apple", "Banana", "Cherry"];

// Access elements
console.log(numbers[0]); // 1
console.log(fruits[1]);  // "Banana"

// Array methods
numbers.push(6);           // Add to end
numbers.pop();             // Remove from end
numbers.unshift(0);        // Add to beginning
numbers.shift();           // Remove from beginning

// Iteration methods
numbers.forEach(num => console.log(num));

const doubled = numbers.map(num => num * 2);
const evens = numbers.filter(num => num % 2 === 0);
const sum = numbers.reduce((acc, num) => acc + num, 0);

console.log("Doubled:", doubled);
console.log("Evens:", evens);
console.log("Sum:", sum);
```

### Mathematical Array Operations

```javascript
// Calculate statistics
function calculateStats(array) {
    const sum = array.reduce((a, b) => a + b, 0);
    const mean = sum / array.length;
    
    const variance = array.reduce((acc, val) => 
        acc + Math.pow(val - mean, 2), 0) / array.length;
    const stdDev = Math.sqrt(variance);
    
    const sorted = [...array].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)];
    
    return {
        sum: sum,
        mean: mean,
        variance: variance,
        standardDeviation: stdDev,
        median: median,
        min: Math.min(...array),
        max: Math.max(...array)
    };
}

const data = [2.5, 3.7, 4.1, 5.2, 6.8, 7.3, 8.9];
const stats = calculateStats(data);
console.log(stats);
```

## Objects

### Object Basics

```javascript
// Object literal
const person = {
    name: "John",
    age: 30,
    greet: function() {
        return `Hello, I'm ${this.name}`;
    }
};

// Access properties
console.log(person.name);
console.log(person["age"]);
console.log(person.greet());

// Add/modify properties
person.email = "john@example.com";
person.age = 31;

// Object methods
console.log(Object.keys(person));
console.log(Object.values(person));
console.log(Object.entries(person));
```

## DOM Manipulation

### Selecting Elements

```javascript
// Select by ID
const element = document.getElementById('myId');

// Select by class
const elements = document.getElementsByClassName('myClass');

// Select by tag
const paragraphs = document.getElementsByTagName('p');

// Modern selectors
const element = document.querySelector('#myId');
const elements = document.querySelectorAll('.myClass');
```

### Modifying DOM

```javascript
// Change content
element.textContent = "New text";
element.innerHTML = "<strong>Bold text</strong>";

// Change attributes
element.setAttribute('class', 'new-class');
element.style.color = 'red';
element.style.fontSize = '20px';

// Create and append elements
const newDiv = document.createElement('div');
newDiv.textContent = "New element";
document.body.appendChild(newDiv);

// Remove elements
element.remove();
```

### Event Handling

```javascript
// Add event listener
const button = document.getElementById('myButton');
button.addEventListener('click', function() {
    alert('Button clicked!');
});

// Multiple events
element.addEventListener('mouseenter', () => {
    element.style.backgroundColor = 'yellow';
});

element.addEventListener('mouseleave', () => {
    element.style.backgroundColor = 'white';
});
```

## Complete Example: Interactive Calculator

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>JavaScript Calculator</title>
    <style>
        .calculator {
            max-width: 300px;
            margin: 50px auto;
            padding: 20px;
            border: 2px solid #333;
            border-radius: 10px;
        }
        .display {
            width: 100%;
            height: 60px;
            font-size: 24px;
            text-align: right;
            margin-bottom: 10px;
        }
        .buttons {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
        }
        button {
            height: 50px;
            font-size: 18px;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <div class="calculator">
        <input type="text" class="display" id="display" readonly>
        <div class="buttons">
            <button onclick="clearDisplay()">C</button>
            <button onclick="deleteLast()">⌫</button>
            <button onclick="appendToDisplay('/')">/</button>
            <button onclick="appendToDisplay('*')">×</button>
            <button onclick="appendToDisplay('7')">7</button>
            <button onclick="appendToDisplay('8')">8</button>
            <button onclick="appendToDisplay('9')">9</button>
            <button onclick="appendToDisplay('-')">-</button>
            <button onclick="appendToDisplay('4')">4</button>
            <button onclick="appendToDisplay('5')">5</button>
            <button onclick="appendToDisplay('6')">6</button>
            <button onclick="appendToDisplay('+')">+</button>
            <button onclick="appendToDisplay('1')">1</button>
            <button onclick="appendToDisplay('2')">2</button>
            <button onclick="appendToDisplay('3')">3</button>
            <button onclick="calculate()" style="grid-row: span 2;">=</button>
            <button onclick="appendToDisplay('0')" style="grid-column: span 2;">0</button>
            <button onclick="appendToDisplay('.')">.</button>
        </div>
    </div>

    <script>
        let currentInput = '';
        
        function updateDisplay() {
            document.getElementById('display').value = currentInput || '0';
        }
        
        function appendToDisplay(value) {
            currentInput += value;
            updateDisplay();
        }
        
        function clearDisplay() {
            currentInput = '';
            updateDisplay();
        }
        
        function deleteLast() {
            currentInput = currentInput.slice(0, -1);
            updateDisplay();
        }
        
        function calculate() {
            try {
                if (currentInput === '') return;
                const result = eval(currentInput.replace('×', '*'));
                currentInput = result.toString();
                updateDisplay();
            } catch (error) {
                currentInput = 'Error';
                updateDisplay();
                setTimeout(clearDisplay, 1000);
            }
        }
        
        // Keyboard support
        document.addEventListener('keydown', function(event) {
            const key = event.key;
            if (key >= '0' && key <= '9' || key === '.' || 
                key === '+' || key === '-' || key === '*' || key === '/') {
                appendToDisplay(key);
            } else if (key === 'Enter' || key === '=') {
                calculate();
            } else if (key === 'Escape' || key === 'c' || key === 'C') {
                clearDisplay();
            } else if (key === 'Backspace') {
                deleteLast();
            }
        });
        
        updateDisplay();
    </script>
</body>
</html>
```

## Summary

JavaScript fundamentals provide the foundation for web interactivity:

1. **Variables**: `var`, `let`, `const` with dynamic typing
2. **Data Types**: Primitives and objects
3. **Functions**: Declarations, expressions, arrow functions
4. **Control Flow**: Conditionals, loops
5. **Arrays**: Powerful array methods
6. **Objects**: Key-value pairs
7. **DOM**: Manipulating HTML elements
8. **Events**: Handling user interactions

Key concepts:
- Dynamic typing allows flexible code
- Functions are first-class citizens
- Array methods enable functional programming
- DOM manipulation creates interactive web pages
- Event handling responds to user actions

Mastering these fundamentals enables building interactive, dynamic web applications that respond to user input and modify content in real-time.

