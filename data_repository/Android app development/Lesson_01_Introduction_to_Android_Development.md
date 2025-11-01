# Lesson 1: Introduction to Android Development

## Overview

Android is the world's most popular mobile operating system, powering billions of devices worldwide. Android development involves creating applications for smartphones, tablets, wearables, and other devices running the Android OS. This lesson introduces the Android platform, development environment setup, and fundamental concepts necessary to build Android applications.

## Understanding Android

### Android Architecture

Android is built on a Linux kernel and consists of several layers:

1. **Linux Kernel**: Low-level system services (memory, security, drivers)
2. **Hardware Abstraction Layer (HAL)**: Standard interface for hardware components
3. **Android Runtime (ART)**: Executes Android apps (replaced Dalvik in Android 5.0)
4. **Java API Framework**: Provides high-level APIs for app development
5. **System Apps**: Built-in applications (Contacts, Phone, Settings)

### Android Application Components

**1. Activities**: Single screens with user interfaces
- Entry point for user interaction
- Represents one screen in an app
- Lifecycle managed by the system

**2. Services**: Background operations
- No user interface
- Run independently of activities
- Examples: music playback, file downloads

**3. Broadcast Receivers**: Respond to system-wide announcements
- Listen for events (battery low, SMS received)
- Can trigger actions in response

**4. Content Providers**: Manage shared app data
- Provide access to structured data
- Enable data sharing between apps

**5. Intents**: Messaging objects for component communication
- Start activities, services, broadcast receivers
- Explicit (specific component) or implicit (action-based)

## Development Environment Setup

### Prerequisites

1. **Java Development Kit (JDK)**: Java 8 or higher
2. **Android Studio**: Official IDE for Android development
3. **Android SDK**: Software development kit with tools and libraries

### Installing Android Studio

1. Download Android Studio from developer.android.com
2. Install JDK if not already installed
3. Run Android Studio installer
4. Follow setup wizard to install Android SDK

### Android Studio Components

- **Gradle**: Build automation tool
- **Android SDK Manager**: Install/update SDK components
- **AVD Manager**: Create and manage Android Virtual Devices (emulators)
- **Layout Editor**: Visual UI design tool
- **Code Editor**: Intelligent code editing with autocomplete

### Creating Your First Android Project

1. **File → New → New Project**
2. **Choose Template**: Select "Empty Activity"
3. **Configure Project**:
   - Name: MyFirstApp
   - Package name: com.example.myfirstapp
   - Language: Java or Kotlin
   - Minimum SDK: API 21 (Android 5.0)
4. **Finish**: Android Studio generates project structure

## Project Structure

### Key Directories and Files

```
MyFirstApp/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/example/myfirstapp/
│   │   │   │   └── MainActivity.java
│   │   │   ├── res/
│   │   │   │   ├── layout/
│   │   │   │   │   └── activity_main.xml
│   │   │   │   ├── values/
│   │   │   │   │   ├── strings.xml
│   │   │   │   │   └── colors.xml
│   │   │   │   └── drawable/
│   │   │   └── AndroidManifest.xml
│   │   └── test/
│   └── build.gradle
├── build.gradle (Project level)
└── settings.gradle
```

## Your First Android App: Hello World

### MainActivity.java

```java
package com.example.myfirstapp;

import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
    }
}
```

### activity_main.xml (Layout File)

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="16dp"
    android:gravity="center">

    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="Hello, Android!"
        android:textSize="24sp"
        android:textStyle="bold"
        android:textColor="@android:color/black" />

    <Button
        android:id="@+id/button"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="Click Me"
        android:layout_marginTop="16dp" />

</LinearLayout>
```

### Adding Interactivity

```java
package com.example.myfirstapp;

import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
    
    private TextView textView;
    private Button button;
    private int clickCount = 0;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        // Find views by ID
        textView = findViewById(R.id.textView);
        button = findViewById(R.id.button);
        
        // Set click listener
        button.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                clickCount++;
                textView.setText("Button clicked " + clickCount + " times!");
                
                // Show toast message
                Toast.makeText(MainActivity.this, 
                    "Hello from Android!", 
                    Toast.LENGTH_SHORT).show();
            }
        });
    }
}
```

## AndroidManifest.xml

Every Android app must have an AndroidManifest.xml file that declares:
- App components (activities, services, etc.)
- Permissions required
- Minimum Android API level
- App metadata

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.example.myfirstapp">

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:theme="@style/AppTheme">
        
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>
```

## Mathematical Calculator App Example

Let's build a simple calculator to demonstrate Android concepts.

### activity_calculator.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="16dp"
    android:background="#f5f5f5">

    <!-- Display -->
    <EditText
        android:id="@+id/display"
        android:layout_width="match_parent"
        android:layout_height="80dp"
        android:textSize="32sp"
        android:textAlignment="textEnd"
        android:gravity="center_vertical|end"
        android:background="#ffffff"
        android:padding="16dp"
        android:editable="false"
        android:focusable="false"
        android:text="0" />

    <!-- Button Grid -->
    <GridLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:columnCount="4"
        android:rowCount="5"
        android:layout_marginTop="16dp">

        <!-- Row 1 -->
        <Button
            android:id="@+id/btnClear"
            android:text="C"
            android:layout_columnSpan="2"
            android:backgroundTint="#e74c3c" />
        
        <Button
            android:id="@+id/btnDelete"
            android:text="⌫"
            android:layout_columnSpan="2"
            android:backgroundTint="#e67e22" />

        <!-- Row 2 -->
        <Button android:id="@+id/btn7" android:text="7" />
        <Button android:id="@+id/btn8" android:text="8" />
        <Button android:id="@+id/btn9" android:text="9" />
        <Button android:id="@+id/btnDivide" android:text="/" android:backgroundTint="#3498db" />

        <!-- Row 3 -->
        <Button android:id="@+id/btn4" android:text="4" />
        <Button android:id="@+id/btn5" android:text="5" />
        <Button android:id="@+id/btn6" android:text="6" />
        <Button android:id="@+id/btnMultiply" android:text="×" android:backgroundTint="#3498db" />

        <!-- Row 4 -->
        <Button android:id="@+id/btn1" android:text="1" />
        <Button android:id="@+id/btn2" android:text="2" />
        <Button android:id="@+id/btn3" android:text="3" />
        <Button android:id="@+id/btnSubtract" android:text="-" android:backgroundTint="#3498db" />

        <!-- Row 5 -->
        <Button android:id="@+id/btn0" android:text="0" android:layout_columnSpan="2" />
        <Button android:id="@+id/btnDecimal" android:text="." />
        <Button android:id="@+id/btnAdd" android:text="+" android:backgroundTint="#3498db" />

        <!-- Row 6 -->
        <Button
            android:id="@+id/btnEquals"
            android:text="="
            android:layout_columnSpan="4"
            android:backgroundTint="#27ae60"
            android:textSize="24sp" />

    </GridLayout>

</LinearLayout>
```

### CalculatorActivity.java

```java
package com.example.calculator;

import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;

public class CalculatorActivity extends AppCompatActivity {
    
    private EditText display;
    private String currentInput = "";
    private double operand1 = 0;
    private String operator = "";
    private boolean waitingForOperand = false;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_calculator);
        
        display = findViewById(R.id.display);
        
        // Number buttons
        int[] numberButtonIds = {
            R.id.btn0, R.id.btn1, R.id.btn2, R.id.btn3, R.id.btn4,
            R.id.btn5, R.id.btn6, R.id.btn7, R.id.btn8, R.id.btn9
        };
        
        for (int id : numberButtonIds) {
            findViewById(id).setOnClickListener(v -> {
                Button btn = (Button) v;
                onNumberClick(btn.getText().toString());
            });
        }
        
        // Operator buttons
        findViewById(R.id.btnAdd).setOnClickListener(v -> onOperatorClick("+"));
        findViewById(R.id.btnSubtract).setOnClickListener(v -> onOperatorClick("-"));
        findViewById(R.id.btnMultiply).setOnClickListener(v -> onOperatorClick("×"));
        findViewById(R.id.btnDivide).setOnClickListener(v -> onOperatorClick("/"));
        
        // Special buttons
        findViewById(R.id.btnDecimal).setOnClickListener(v -> onDecimalClick());
        findViewById(R.id.btnEquals).setOnClickListener(v -> onEqualsClick());
        findViewById(R.id.btnClear).setOnClickListener(v -> onClearClick());
        findViewById(R.id.btnDelete).setOnClickListener(v -> onDeleteClick());
    }
    
    private void onNumberClick(String number) {
        if (waitingForOperand) {
            currentInput = "";
            waitingForOperand = false;
        }
        currentInput += number;
        updateDisplay();
    }
    
    private void onOperatorClick(String op) {
        if (!currentInput.isEmpty()) {
            if (!operator.isEmpty()) {
                calculate();
            }
            operand1 = Double.parseDouble(currentInput);
            operator = op;
            waitingForOperand = true;
        }
    }
    
    private void onDecimalClick() {
        if (waitingForOperand) {
            currentInput = "0";
            waitingForOperand = false;
        }
        if (!currentInput.contains(".")) {
            currentInput += ".";
            updateDisplay();
        }
    }
    
    private void onEqualsClick() {
        if (!operator.isEmpty() && !waitingForOperand) {
            calculate();
            operator = "";
        }
    }
    
    private void calculate() {
        if (currentInput.isEmpty()) return;
        
        try {
            double operand2 = Double.parseDouble(currentInput);
            double result = 0;
            
            switch (operator) {
                case "+":
                    result = operand1 + operand2;
                    break;
                case "-":
                    result = operand1 - operand2;
                    break;
                case "×":
                    result = operand1 * operand2;
                    break;
                case "/":
                    if (operand2 != 0) {
                        result = operand1 / operand2;
                    } else {
                        Toast.makeText(this, "Cannot divide by zero!", Toast.LENGTH_SHORT).show();
                        return;
                    }
                    break;
            }
            
            // Round to avoid floating point precision issues
            if (result == (long) result) {
                currentInput = String.valueOf((long) result);
            } else {
                currentInput = String.valueOf(result);
            }
            updateDisplay();
            waitingForOperand = true;
            
        } catch (NumberFormatException e) {
            Toast.makeText(this, "Error in calculation", Toast.LENGTH_SHORT).show();
        }
    }
    
    private void onClearClick() {
        currentInput = "";
        operand1 = 0;
        operator = "";
        waitingForOperand = false;
        display.setText("0");
    }
    
    private void onDeleteClick() {
        if (!currentInput.isEmpty() && !waitingForOperand) {
            currentInput = currentInput.substring(0, currentInput.length() - 1);
            if (currentInput.isEmpty()) {
                display.setText("0");
            } else {
                updateDisplay();
            }
        }
    }
    
    private void updateDisplay() {
        display.setText(currentInput);
    }
}
```

## Activity Lifecycle

Understanding the activity lifecycle is crucial for proper resource management:

1. **onCreate()**: Called when activity is first created
2. **onStart()**: Activity becomes visible
3. **onResume()**: Activity comes to foreground
4. **onPause()**: Another activity comes to foreground
5. **onStop()**: Activity no longer visible
6. **onDestroy()**: Activity is being destroyed
7. **onRestart()**: Activity restarting from stopped state

```java
@Override
protected void onPause() {
    super.onPause();
    // Save data, pause animations
}

@Override
protected void onResume() {
    super.onResume();
    // Resume updates, refresh data
}

@Override
protected void onDestroy() {
    super.onDestroy();
    // Release resources, cleanup
}
```

## Summary

Android development fundamentals:

1. **Platform Architecture**: Linux-based, layered system
2. **Application Components**: Activities, Services, Broadcast Receivers, Content Providers
3. **Development Tools**: Android Studio, SDK, Gradle
4. **Project Structure**: Organized directories for code and resources
5. **Activity Lifecycle**: Understanding component lifecycle
6. **UI Development**: XML layouts and Java/Kotlin code

Key concepts:
- Activities represent screens
- Layouts define UI structure
- Java/Kotlin handles logic
- AndroidManifest declares app components
- Lifecycle methods manage state

Mastering these fundamentals provides the foundation for building feature-rich Android applications. As you progress, you'll learn about fragments, databases, networking, Material Design, and advanced Android features.

