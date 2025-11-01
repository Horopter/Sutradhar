# Lesson 3: Advanced JavaScript Concepts

## Overview

Advanced JavaScript concepts build upon the fundamentals to enable more sophisticated programming patterns. This lesson covers closures, prototypes, async/await, promises, higher-order functions, functional programming patterns, and advanced object-oriented techniques. Understanding these concepts is essential for writing modern, efficient JavaScript applications.

## Closures

A closure is a function that has access to variables in its outer (enclosing) scope even after the outer function has returned.

### Basic Closure

```javascript
function outerFunction(x) {
    // Outer function's variable
    let outerVariable = x;
    
    // Inner function (closure)
    function innerFunction(y) {
        console.log(outerVariable + y);
    }
    
    return innerFunction;
}

const closure = outerFunction(10);
closure(5);  // Output: 15
// outerVariable is still accessible!
```

### Practical Closure Example: Counter

```javascript
function createCounter(initialValue = 0) {
    let count = initialValue;
    
    return {
        increment: function() {
            count++;
            return count;
        },
        decrement: function() {
            count--;
            return count;
        },
        getValue: function() {
            return count;
        },
        reset: function() {
            count = initialValue;
            return count;
        }
    };
}

const counter1 = createCounter(0);
const counter2 = createCounter(10);

console.log(counter1.increment());  // 1
console.log(counter1.increment());  // 2
console.log(counter2.increment());  // 11
console.log(counter1.getValue());   // 2
console.log(counter2.getValue());   // 11
```

### Module Pattern

```javascript
const Calculator = (function() {
    // Private variables
    let history = [];
    
    // Private functions
    function addToHistory(operation, result) {
        history.push({ operation, result, timestamp: new Date() });
    }
    
    // Public API
    return {
        add: function(a, b) {
            const result = a + b;
            addToHistory(`add(${a}, ${b})`, result);
            return result;
        },
        subtract: function(a, b) {
            const result = a - b;
            addToHistory(`subtract(${a}, ${b})`, result);
            return result;
        },
        multiply: function(a, b) {
            const result = a * b;
            addToHistory(`multiply(${a}, ${b})`, result);
            return result;
        },
        divide: function(a, b) {
            if (b === 0) {
                throw new Error('Division by zero');
            }
            const result = a / b;
            addToHistory(`divide(${a}, ${b})`, result);
            return result;
        },
        getHistory: function() {
            return [...history];  // Return copy
        },
        clearHistory: function() {
            history = [];
        }
    };
})();

console.log(Calculator.add(5, 3));      // 8
console.log(Calculator.multiply(4, 7)); // 28
console.log(Calculator.getHistory());
```

## Prototypes and Prototypal Inheritance

JavaScript uses prototypal inheritance rather than classical inheritance.

### Prototype Basics

```javascript
// Constructor function
function Person(name, age) {
    this.name = name;
    this.age = age;
}

// Add methods to prototype
Person.prototype.greet = function() {
    return `Hello, I'm ${this.name} and I'm ${this.age} years old`;
};

Person.prototype.haveBirthday = function() {
    this.age++;
    return this.age;
};

const person1 = new Person('Alice', 30);
const person2 = new Person('Bob', 25);

console.log(person1.greet());
console.log(person2.greet());
console.log(person1.haveBirthday());
```

### Prototypal Inheritance

```javascript
// Parent constructor
function Shape(name) {
    this.name = name;
}

Shape.prototype.getArea = function() {
    return 0;
};

Shape.prototype.getName = function() {
    return this.name;
};

// Child constructor
function Circle(radius) {
    Shape.call(this, 'Circle');
    this.radius = radius;
}

// Inherit from Shape
Circle.prototype = Object.create(Shape.prototype);
Circle.prototype.constructor = Circle;

// Override method
Circle.prototype.getArea = function() {
    return Math.PI * this.radius * this.radius;
};

Circle.prototype.getCircumference = function() {
    return 2 * Math.PI * this.radius;
};

// Another child
function Rectangle(width, height) {
    Shape.call(this, 'Rectangle');
    this.width = width;
    this.height = height;
}

Rectangle.prototype = Object.create(Shape.prototype);
Rectangle.prototype.constructor = Rectangle;

Rectangle.prototype.getArea = function() {
    return this.width * this.height;
};

Rectangle.prototype.getPerimeter = function() {
    return 2 * (this.width + this.height);
};

const circle = new Circle(5);
const rectangle = new Rectangle(4, 6);

console.log(circle.getName());         // Circle
console.log(circle.getArea());         // 78.54...
console.log(circle.getCircumference()); // 31.41...

console.log(rectangle.getName());      // Rectangle
console.log(rectangle.getArea());      // 24
console.log(rectangle.getPerimeter()); // 20
```

## ES6 Classes

Modern JavaScript provides class syntax (syntactic sugar over prototypes).

```javascript
class Shape {
    constructor(name) {
        this.name = name;
    }
    
    getArea() {
        return 0;
    }
    
    getName() {
        return this.name;
    }
}

class Circle extends Shape {
    constructor(radius) {
        super('Circle');
        this.radius = radius;
    }
    
    getArea() {
        return Math.PI * this.radius * this.radius;
    }
    
    getCircumference() {
        return 2 * Math.PI * this.radius;
    }
}

class Rectangle extends Shape {
    constructor(width, height) {
        super('Rectangle');
        this.width = width;
        this.height = height;
    }
    
    getArea() {
        return this.width * this.height;
    }
    
    getPerimeter() {
        return 2 * (this.width + this.height);
    }
}

const circle = new Circle(5);
const rect = new Rectangle(4, 6);

console.log(circle.getArea());      // 78.54...
console.log(rect.getArea());        // 24
```

## Promises and Async/Await

### Promises

Promises represent the eventual completion (or failure) of an asynchronous operation.

```javascript
// Creating a Promise
function fetchData(url) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (Math.random() > 0.3) {
                resolve({ data: `Data from ${url}`, status: 200 });
            } else {
                reject(new Error(`Failed to fetch from ${url}`));
            }
        }, 1000);
    });
}

// Using Promises
fetchData('https://api.example.com/data')
    .then(response => {
        console.log('Success:', response);
        return response.data;
    })
    .then(data => {
        console.log('Data:', data);
    })
    .catch(error => {
        console.error('Error:', error.message);
    });

// Promise.all - wait for all promises
Promise.all([
    fetchData('url1'),
    fetchData('url2'),
    fetchData('url3')
])
.then(results => {
    console.log('All requests completed:', results);
})
.catch(error => {
    console.error('One request failed:', error);
});

// Promise.race - first to complete wins
Promise.race([
    fetchData('url1'),
    fetchData('url2')
])
.then(result => {
    console.log('First completed:', result);
});
```

### Async/Await

Async/await provides a cleaner syntax for working with promises.

```javascript
async function fetchMultipleData() {
    try {
        const data1 = await fetchData('url1');
        const data2 = await fetchData('url2');
        const data3 = await fetchData('url3');
        
        return [data1, data2, data3];
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
}

async function processData() {
    try {
        const results = await fetchMultipleData();
        console.log('All data:', results);
    } catch (error) {
        console.error('Failed:', error.message);
    }
}

processData();
```

### Mathematical Calculator with Async Operations

```javascript
// Simulate async mathematical operations
function calculateAsync(operation, a, b) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            let result;
            try {
                switch (operation) {
                    case 'add':
                        result = a + b;
                        break;
                    case 'subtract':
                        result = a - b;
                        break;
                    case 'multiply':
                        result = a * b;
                        break;
                    case 'divide':
                        if (b === 0) {
                            reject(new Error('Division by zero'));
                            return;
                        }
                        result = a / b;
                        break;
                    case 'power':
                        result = Math.pow(a, b);
                        break;
                    default:
                        reject(new Error('Invalid operation'));
                        return;
                }
                resolve({
                    operation,
                    operands: [a, b],
                    result,
                    timestamp: new Date()
                });
            } catch (error) {
                reject(error);
            }
        }, Math.random() * 1000); // Random delay
    });
}

async function performCalculations() {
    try {
        console.log('Starting calculations...');
        
        // Sequential execution
        const addResult = await calculateAsync('add', 10, 5);
        console.log('Addition:', addResult);
        
        const multiplyResult = await calculateAsync('multiply', 4, 7);
        console.log('Multiplication:', multiplyResult);
        
        // Parallel execution
        const [powerResult, divideResult] = await Promise.all([
            calculateAsync('power', 2, 8),
            calculateAsync('divide', 100, 4)
        ]);
        
        console.log('Power:', powerResult);
        console.log('Division:', divideResult);
        
        // Chain calculations
        const chained = await calculateAsync('multiply', addResult.result, 2);
        console.log('Chained result:', chained);
        
    } catch (error) {
        console.error('Calculation error:', error.message);
    }
}

performCalculations();
```

## Higher-Order Functions

Higher-order functions are functions that take other functions as arguments or return functions.

### Array Methods

```javascript
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// map - transform each element
const doubled = numbers.map(x => x * 2);
console.log('Doubled:', doubled);

// filter - select elements that meet condition
const evens = numbers.filter(x => x % 2 === 0);
console.log('Even numbers:', evens);

// reduce - accumulate values
const sum = numbers.reduce((acc, x) => acc + x, 0);
console.log('Sum:', sum);

const product = numbers.reduce((acc, x) => acc * x, 1);
console.log('Product:', product);

// find - find first element that meets condition
const found = numbers.find(x => x > 5);
console.log('First > 5:', found);

// every - check if all elements meet condition
const allPositive = numbers.every(x => x > 0);
console.log('All positive:', allPositive);

// some - check if any element meets condition
const hasEven = numbers.some(x => x % 2 === 0);
console.log('Has even:', hasEven);
```

### Functional Programming Patterns

```javascript
// Function composition
const compose = (...fns) => (arg) => fns.reduceRight((acc, fn) => fn(acc), arg);

const addOne = x => x + 1;
const multiplyByTwo = x => x * 2;
const square = x => x * x;

const composed = compose(square, multiplyByTwo, addOne);
console.log(composed(3)); // ((3+1)*2)^2 = 64

// Partial application
const partial = (fn, ...args) => (...moreArgs) => fn(...args, ...moreArgs);

const multiply = (a, b, c) => a * b * c;
const multiplyBy10 = partial(multiply, 10);
console.log(multiplyBy10(2, 3)); // 60

// Currying
const curry = (fn) => {
    return function curried(...args) {
        if (args.length >= fn.length) {
            return fn.apply(this, args);
        } else {
            return function(...moreArgs) {
                return curried.apply(this, args.concat(moreArgs));
            };
        }
    };
};

const add = (a, b, c) => a + b + c;
const curriedAdd = curry(add);
console.log(curriedAdd(1)(2)(3));     // 6
console.log(curriedAdd(1, 2)(3));     // 6
console.log(curriedAdd(1)(2, 3));     // 6
```

### Advanced Array Operations

```javascript
// Mathematical operations on arrays
const stats = {
    mean: arr => arr.reduce((a, b) => a + b, 0) / arr.length,
    
    median: arr => {
        const sorted = [...arr].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0
            ? (sorted[mid - 1] + sorted[mid]) / 2
            : sorted[mid];
    },
    
    variance: arr => {
        const mean = stats.mean(arr);
        return arr.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / arr.length;
    },
    
    standardDeviation: arr => Math.sqrt(stats.variance(arr)),
    
    mode: arr => {
        const frequency = {};
        arr.forEach(val => frequency[val] = (frequency[val] || 0) + 1);
        const maxFreq = Math.max(...Object.values(frequency));
        return Object.keys(frequency).filter(key => frequency[key] === maxFreq);
    }
};

const data = [2, 4, 4, 4, 5, 5, 7, 9];

console.log('Mean:', stats.mean(data));
console.log('Median:', stats.median(data));
console.log('Variance:', stats.variance(data));
console.log('Standard Deviation:', stats.standardDeviation(data));
console.log('Mode:', stats.mode(data));
```

## Generators

Generators are functions that can be paused and resumed, yielding values.

```javascript
function* fibonacci() {
    let [a, b] = [0, 1];
    while (true) {
        yield a;
        [a, b] = [b, a + b];
    }
}

const fib = fibonacci();
for (let i = 0; i < 10; i++) {
    console.log(fib.next().value);
}

// Generator for range
function* range(start, end, step = 1) {
    for (let i = start; i < end; i += step) {
        yield i;
    }
}

console.log([...range(0, 10, 2)]); // [0, 2, 4, 6, 8]
```

## Summary

Advanced JavaScript concepts enable sophisticated programming:

1. **Closures**: Functions with access to outer scope variables
2. **Prototypes**: JavaScript's inheritance mechanism
3. **ES6 Classes**: Modern class syntax
4. **Promises/Async-Await**: Asynchronous programming
5. **Higher-Order Functions**: Functions as first-class citizens
6. **Generators**: Pausable functions

Key concepts:
- Closures enable module patterns and data privacy
- Prototypes provide inheritance without classes
- Promises handle asynchronous operations elegantly
- Functional programming patterns enable reusable code
- Generators provide memory-efficient iteration

Mastering these concepts enables writing modern, efficient, and maintainable JavaScript applications that leverage the language's full power.

