# Lesson 1: Introduction to Web Development

## Overview

Web development is the process of building and maintaining websites and web applications. It encompasses everything from creating simple static pages to complex dynamic web applications. Modern web development involves multiple technologies working together: HTML for structure, CSS for styling, and JavaScript for interactivity, along with server-side technologies and databases.

## The Web Architecture

### Client-Server Model

The web operates on a client-server architecture:

**Client (Browser):**
- Makes requests to servers
- Renders HTML, CSS, and JavaScript
- Displays content to users
- Examples: Chrome, Firefox, Safari, Edge

**Server:**
- Receives and processes requests
- Serves web pages and resources
- Handles database operations
- Executes server-side code

### Request-Response Cycle

1. **User Action**: User enters URL or clicks a link
2. **DNS Lookup**: Browser resolves domain name to IP address
3. **HTTP Request**: Browser sends request to server
4. **Server Processing**: Server processes request, queries database if needed
5. **HTTP Response**: Server sends HTML/CSS/JavaScript back
6. **Rendering**: Browser parses and displays the page

### HTTP Protocol

HTTP (Hypertext Transfer Protocol) is the foundation of data communication on the web.

**HTTP Methods:**
- `GET`: Retrieve data
- `POST`: Submit data
- `PUT`: Update data
- `DELETE`: Remove data

**HTTP Status Codes:**
- `200 OK`: Success
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error
- `301 Moved Permanently`: Redirect

## The Three Pillars of Web Development

### 1. HTML (Hypertext Markup Language)

HTML provides the structure and content of web pages. It uses tags to define elements.

**Basic HTML Structure:**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My First Web Page</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <header>
        <h1>Welcome to Web Development</h1>
        <nav>
            <ul>
                <li><a href="#home">Home</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
        </nav>
    </header>
    
    <main>
        <section id="home">
            <h2>Introduction</h2>
            <p>This is a paragraph of text.</p>
            <img src="image.jpg" alt="Description">
        </section>
        
        <section id="about">
            <h2>About</h2>
            <article>
                <h3>What is Web Development?</h3>
                <p>Web development involves building websites and web applications.</p>
            </article>
        </section>
    </main>
    
    <footer>
        <p>&copy; 2024 Web Development Course</p>
    </footer>
    
    <script src="script.js"></script>
</body>
</html>
```

### 2. CSS (Cascading Style Sheets)

CSS controls the visual presentation and styling of HTML elements.

**Basic CSS Syntax:**

```css
/* CSS Selectors and Properties */
selector {
    property: value;
    property: value;
}

/* Example */
body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
    background-color: #f4f4f4;
    color: #333;
}

h1 {
    color: #2c3e50;
    text-align: center;
    font-size: 2.5em;
    margin-bottom: 20px;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.button {
    background-color: #3498db;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    transition: background-color 0.3s;
}

.button:hover {
    background-color: #2980b9;
}

/* Responsive Design with Media Queries */
@media (max-width: 768px) {
    body {
        padding: 10px;
    }
    
    h1 {
        font-size: 2em;
    }
    
    .container {
        padding: 15px;
    }
}
```

**CSS Box Model:**

The box model describes how elements are sized and spaced:

- **Content**: The actual content (text, images)
- **Padding**: Space inside the element
- **Border**: Edge around the element
- **Margin**: Space outside the element

Total width = width + padding-left + padding-right + border-left + border-right + margin-left + margin-right

### 3. JavaScript

JavaScript adds interactivity and dynamic behavior to web pages.

**Basic JavaScript Example:**

```javascript
// Variables and Data Types
let name = "Web Developer";
const age = 25;
var isActive = true;

// Functions
function greet(userName) {
    return `Hello, ${userName}! Welcome to web development.`;
}

// Arrow Function
const calculateArea = (width, height) => {
    return width * height;
};

// Event Handling
document.addEventListener('DOMContentLoaded', function() {
    const button = document.getElementById('myButton');
    const output = document.getElementById('output');
    
    button.addEventListener('click', function() {
        output.textContent = 'Button clicked!';
        output.style.color = '#27ae60';
    });
});

// DOM Manipulation
function updateContent() {
    const element = document.querySelector('.content');
    element.innerHTML = '<h2>Updated Content</h2><p>This content was dynamically updated!</p>';
}

// Array Operations
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
const sum = numbers.reduce((acc, n) => acc + n, 0);

console.log('Doubled:', doubled);  // [2, 4, 6, 8, 10]
console.log('Sum:', sum);          // 15
```

## Mathematical Calculator Example

Let's build a simple web-based calculator to demonstrate HTML, CSS, and JavaScript working together.

**HTML Structure:**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Web Calculator</title>
    <link rel="stylesheet" href="calculator.css">
</head>
<body>
    <div class="calculator-container">
        <h1>Web Calculator</h1>
        <div class="calculator">
            <div class="display">
                <input type="text" id="display" readonly>
            </div>
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
                <button onclick="calculate()" rowspan="2" class="equals">=</button>
                
                <button onclick="appendToDisplay('0')" class="zero">0</button>
                <button onclick="appendToDisplay('.')">.</button>
            </div>
        </div>
        <div class="history">
            <h3>Calculation History</h3>
            <ul id="historyList"></ul>
        </div>
    </div>
    <script src="calculator.js"></script>
</body>
</html>
```

**CSS Styling:**

```css
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px;
}

.calculator-container {
    background: white;
    border-radius: 20px;
    padding: 30px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    max-width: 400px;
    width: 100%;
}

h1 {
    text-align: center;
    color: #333;
    margin-bottom: 20px;
}

.calculator {
    margin-bottom: 20px;
}

.display {
    margin-bottom: 10px;
}

#display {
    width: 100%;
    height: 60px;
    font-size: 24px;
    text-align: right;
    padding: 10px;
    border: 2px solid #ddd;
    border-radius: 8px;
    background-color: #f9f9f9;
}

.buttons {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
}

button {
    height: 60px;
    font-size: 20px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    background-color: #f0f0f0;
    transition: all 0.2s;
    font-weight: bold;
}

button:hover {
    background-color: #e0e0e0;
    transform: scale(1.05);
}

button:active {
    transform: scale(0.95);
}

button.equals {
    grid-row: span 2;
    background-color: #667eea;
    color: white;
}

button.equals:hover {
    background-color: #5568d3;
}

button.zero {
    grid-column: span 1;
}

.history {
    border-top: 2px solid #eee;
    padding-top: 20px;
}

.history h3 {
    margin-bottom: 10px;
    color: #333;
}

#historyList {
    list-style: none;
    max-height: 150px;
    overflow-y: auto;
}

#historyList li {
    padding: 5px;
    margin: 5px 0;
    background-color: #f9f9f9;
    border-radius: 4px;
    font-family: monospace;
}
```

**JavaScript Functionality:**

```javascript
let display = document.getElementById('display');
let historyList = document.getElementById('historyList');
let currentInput = '';

function appendToDisplay(value) {
    currentInput += value;
    display.value = currentInput;
}

function clearDisplay() {
    currentInput = '';
    display.value = '';
}

function deleteLast() {
    currentInput = currentInput.slice(0, -1);
    display.value = currentInput;
}

function calculate() {
    try {
        if (currentInput === '') {
            return;
        }
        
        // Replace × with * for evaluation
        let expression = currentInput.replace(/×/g, '*');
        
        // Evaluate the expression
        let result = eval(expression);
        
        // Add to history
        addToHistory(currentInput + ' = ' + result);
        
        // Display result
        display.value = result;
        currentInput = result.toString();
    } catch (error) {
        display.value = 'Error';
        currentInput = '';
    }
}

function addToHistory(calculation) {
    let li = document.createElement('li');
    li.textContent = calculation;
    historyList.appendChild(li);
    
    // Keep only last 10 calculations
    if (historyList.children.length > 10) {
        historyList.removeChild(historyList.firstChild);
    }
}

// Keyboard support
document.addEventListener('keydown', function(event) {
    const key = event.key;
    
    if (key >= '0' && key <= '9' || key === '.' || key === '+' || key === '-' || key === '*') {
        appendToDisplay(key);
    } else if (key === '/') {
        appendToDisplay('/');
    } else if (key === 'Enter' || key === '=') {
        calculate();
    } else if (key === 'Escape' || key === 'c' || key === 'C') {
        clearDisplay();
    } else if (key === 'Backspace') {
        deleteLast();
    }
});
```

## Responsive Design Principles

Responsive web design ensures websites work well on all devices and screen sizes.

### Media Queries

```css
/* Mobile First Approach */
.container {
    width: 100%;
    padding: 10px;
}

/* Tablet */
@media (min-width: 768px) {
    .container {
        max-width: 750px;
        margin: 0 auto;
        padding: 20px;
    }
}

/* Desktop */
@media (min-width: 1024px) {
    .container {
        max-width: 1200px;
        padding: 30px;
    }
}
```

### Flexible Units

- **Relative Units**: `em`, `rem`, `%`, `vw`, `vh`
- **Viewport Units**: `vw` (viewport width), `vh` (viewport height)

### Flexbox and Grid

**Flexbox Example:**

```css
.flex-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
}
```

**CSS Grid Example:**

```css
.grid-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
}
```

## Web Development Tools

### Code Editors

- **Visual Studio Code**: Popular, extensible editor
- **Sublime Text**: Lightweight and fast
- **Atom**: Open-source editor
- **WebStorm**: Full-featured IDE

### Browser Developer Tools

- **Elements/Inspector**: View and modify HTML/CSS
- **Console**: Debug JavaScript
- **Network**: Monitor HTTP requests
- **Performance**: Analyze page speed

### Version Control

- **Git**: Distributed version control
- **GitHub/GitLab**: Code hosting platforms

## Summary

Web development fundamentals:

1. **Three Core Technologies**: HTML (structure), CSS (styling), JavaScript (behavior)
2. **Client-Server Architecture**: Browsers request, servers respond
3. **HTTP Protocol**: Foundation of web communication
4. **Responsive Design**: Ensuring compatibility across devices
5. **Development Tools**: Editors, browsers, version control

Key concepts:
- HTML provides page structure
- CSS controls visual presentation
- JavaScript adds interactivity
- Responsive design adapts to screen sizes
- Developer tools help debug and optimize

Understanding these fundamentals provides the foundation for building modern web applications. As you progress, you'll learn about frameworks, server-side technologies, databases, and deployment strategies.

