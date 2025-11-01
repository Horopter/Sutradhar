# Lesson 2: Activities and Lifecycle in Android

## Overview

Activities are fundamental components in Android that represent a single screen with a user interface. Understanding the Activity lifecycle is crucial for managing resources, saving state, and providing a smooth user experience. This lesson covers Activity creation, lifecycle callbacks, state management, and best practices with practical examples.

## What is an Activity?

An Activity is a single, focused thing a user can do. Most Activities interact with the user, so the Activity class takes care of creating a window where you can place your UI with `setContentView()`.

### Basic Activity Structure

```java
package com.example.myapp;

import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        // Initialize components
        // Set up listeners
        // Load data
    }
}
```

## Activity Lifecycle

The Activity lifecycle consists of a series of callback methods that are called as an Activity transitions through different states.

### Lifecycle States

1. **Created**: Activity is being created
2. **Started**: Activity is visible but not in foreground
3. **Resumed**: Activity is in foreground and interactive
4. **Paused**: Activity is partially visible (another activity on top)
5. **Stopped**: Activity is completely hidden
6. **Destroyed**: Activity is being destroyed

### Lifecycle Callback Methods

```java
package com.example.lifecycle;

import android.os.Bundle;
import android.util.Log;
import androidx.appcompat.app.AppCompatActivity;

public class LifecycleDemoActivity extends AppCompatActivity {
    
    private static final String TAG = "LifecycleDemo";
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_lifecycle_demo);
        
        Log.d(TAG, "onCreate: Activity is being created");
        // Initialize views
        // Set up initial state
        // Restore saved instance state if available
        
        if (savedInstanceState != null) {
            String savedData = savedInstanceState.getString("key");
            Log.d(TAG, "Restored data: " + savedData);
        }
    }
    
    @Override
    protected void onStart() {
        super.onStart();
        Log.d(TAG, "onStart: Activity is becoming visible");
        // Register broadcast receivers
        // Start location updates if needed
    }
    
    @Override
    protected void onResume() {
        super.onResume();
        Log.d(TAG, "onResume: Activity is now in foreground");
        // Resume animations
        // Start camera preview
        // Resume sensors
    }
    
    @Override
    protected void onPause() {
        super.onPause();
        Log.d(TAG, "onPause: Activity is losing focus");
        // Pause animations
        // Stop camera preview
        // Save user data
    }
    
    @Override
    protected void onStop() {
        super.onStop();
        Log.d(TAG, "onStop: Activity is no longer visible");
        // Unregister broadcast receivers
        // Stop location updates
    }
    
    @Override
    protected void onRestart() {
        super.onRestart();
        Log.d(TAG, "onRestart: Activity is restarting");
        // Refresh data if needed
    }
    
    @Override
    protected void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "onDestroy: Activity is being destroyed");
        // Release resources
        // Close database connections
        // Cancel ongoing operations
    }
    
    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        Log.d(TAG, "onSaveInstanceState: Saving state");
        // Save UI state
        outState.putString("key", "important_data");
    }
    
    @Override
    protected void onRestoreInstanceState(Bundle savedInstanceState) {
        super.onRestoreInstanceState(savedInstanceState);
        Log.d(TAG, "onRestoreInstanceState: Restoring state");
        // Restore UI state
        String savedData = savedInstanceState.getString("key");
    }
}
```

## State Management

### Saving and Restoring State

```java
package com.example.calculator;

import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;

public class CalculatorActivity extends AppCompatActivity {
    
    private TextView display;
    private String currentInput = "";
    private String operator = "";
    private double operand1 = 0;
    private boolean waitingForOperand = false;
    
    private static final String KEY_CURRENT_INPUT = "currentInput";
    private static final String KEY_OPERATOR = "operator";
    private static final String KEY_OPERAND1 = "operand1";
    private static final String KEY_WAITING = "waitingForOperand";
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_calculator);
        
        display = findViewById(R.id.display);
        
        // Initialize buttons
        setupButtons();
        
        // Restore state if available
        if (savedInstanceState != null) {
            currentInput = savedInstanceState.getString(KEY_CURRENT_INPUT, "");
            operator = savedInstanceState.getString(KEY_OPERATOR, "");
            operand1 = savedInstanceState.getDouble(KEY_OPERAND1, 0);
            waitingForOperand = savedInstanceState.getBoolean(KEY_WAITING, false);
            updateDisplay();
        }
    }
    
    private void setupButtons() {
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
                        display.setText("Error");
                        return;
                    }
                    break;
            }
            
            // Format result
            if (result == (long) result) {
                currentInput = String.valueOf((long) result);
            } else {
                currentInput = String.valueOf(result);
            }
            updateDisplay();
            waitingForOperand = true;
            
        } catch (NumberFormatException e) {
            display.setText("Error");
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
    
    private void onClearClick() {
        currentInput = "";
        operand1 = 0;
        operator = "";
        waitingForOperand = false;
        updateDisplay();
    }
    
    private void updateDisplay() {
        display.setText(currentInput.isEmpty() ? "0" : currentInput);
    }
    
    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        outState.putString(KEY_CURRENT_INPUT, currentInput);
        outState.putString(KEY_OPERATOR, operator);
        outState.putDouble(KEY_OPERAND1, operand1);
        outState.putBoolean(KEY_WAITING, waitingForOperand);
    }
}
```

## Navigation Between Activities

### Starting Activities with Intent

```java
package com.example.navigation;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
    
    private static final int REQUEST_CODE = 1;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        Button openSecondActivity = findViewById(R.id.btnOpenSecond);
        openSecondActivity.setOnClickListener(v -> {
            // Explicit Intent
            Intent intent = new Intent(MainActivity.this, SecondActivity.class);
            intent.putExtra("message", "Hello from MainActivity");
            intent.putExtra("number", 42);
            startActivity(intent);
        });
        
        Button openForResult = findViewById(R.id.btnOpenForResult);
        openForResult.setOnClickListener(v -> {
            Intent intent = new Intent(MainActivity.this, InputActivity.class);
            startActivityForResult(intent, REQUEST_CODE);
        });
    }
    
    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        
        if (requestCode == REQUEST_CODE && resultCode == RESULT_OK) {
            String result = data.getStringExtra("result");
            // Handle the result
        }
    }
}

// SecondActivity.java
package com.example.navigation;

import android.content.Intent;
import android.os.Bundle;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;

public class SecondActivity extends AppCompatActivity {
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_second);
        
        // Receive data from Intent
        Intent intent = getIntent();
        String message = intent.getStringExtra("message");
        int number = intent.getIntExtra("number", 0);
        
        TextView textView = findViewById(R.id.textView);
        textView.setText(message + "\nNumber: " + number);
        
        // Return result
        Intent resultIntent = new Intent();
        resultIntent.putExtra("result", "Data processed successfully");
        setResult(RESULT_OK, resultIntent);
    }
    
    @Override
    public void onBackPressed() {
        // Finish this activity and return to previous
        finish();
    }
}
```

## Activity Configuration Changes

Handling screen rotations and other configuration changes.

```java
package com.example.config;

import android.content.res.Configuration;
import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;

public class ConfigurationActivity extends AppCompatActivity {
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_configuration);
    }
    
    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        
        if (newConfig.orientation == Configuration.ORIENTATION_LANDSCAPE) {
            // Handle landscape orientation
            Log.d(TAG, "Switched to landscape");
        } else if (newConfig.orientation == Configuration.ORIENTATION_PORTRAIT) {
            // Handle portrait orientation
            Log.d(TAG, "Switched to portrait");
        }
    }
}
```

## Best Practices

### 1. Always Call Super Methods

```java
@Override
protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);  // Always call first
    // Your code here
}
```

### 2. Release Resources

```java
@Override
protected void onPause() {
    super.onPause();
    // Release camera, sensors, etc.
}

@Override
protected void onStop() {
    super.onStop();
    // Release broadcast receivers
}

@Override
protected void onDestroy() {
    super.onDestroy();
    // Final cleanup
}
```

### 3. Save Important State

```java
@Override
protected void onSaveInstanceState(Bundle outState) {
    super.onSaveInstanceState(outState);
    // Save only essential UI state
    // Don't save large objects
}
```

## Summary

Activities and lifecycle management are fundamental:

1. **Activity Lifecycle**: Understand all callback methods
2. **State Management**: Save and restore UI state
3. **Resource Management**: Release resources appropriately
4. **Navigation**: Use Intents to navigate between activities
5. **Configuration Changes**: Handle screen rotations properly

Key concepts:
- onCreate, onStart, onResume, onPause, onStop, onDestroy
- onSaveInstanceState for state preservation
- Intent for activity navigation
- Proper resource cleanup prevents memory leaks
- State management ensures good user experience

Mastering Activity lifecycle is essential for building responsive, memory-efficient Android applications that handle system events gracefully.

