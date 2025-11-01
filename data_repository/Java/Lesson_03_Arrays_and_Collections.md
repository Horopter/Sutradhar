# Lesson 3: Arrays and Collections in Java

## Overview

Arrays and collections are fundamental data structures in Java for storing and manipulating groups of objects. While arrays provide a simple way to store fixed-size sequences, Java Collections Framework offers more sophisticated data structures like lists, sets, and maps. Understanding both is essential for effective Java programming.

## Arrays

Arrays are fixed-size containers that hold elements of the same type.

### Array Declaration and Initialization

```java
public class ArrayBasics {
    public static void main(String[] args) {
        // Declaration and initialization
        int[] numbers = new int[5];
        int[] numbers2 = {1, 2, 3, 4, 5};
        int[] numbers3 = new int[]{10, 20, 30, 40, 50};
        
        // Accessing elements
        numbers[0] = 100;
        System.out.println("First element: " + numbers[0]);
        
        // Array length
        System.out.println("Array length: " + numbers.length);
        
        // Iterating through array
        for (int i = 0; i < numbers2.length; i++) {
            System.out.print(numbers2[i] + " ");
        }
        System.out.println();
        
        // Enhanced for loop
        for (int num : numbers3) {
            System.out.print(num + " ");
        }
        System.out.println();
    }
}
```

### Multidimensional Arrays

```java
public class MultiDimArray {
    public static void main(String[] args) {
        // 2D array
        int[][] matrix = {
            {1, 2, 3},
            {4, 5, 6},
            {7, 8, 9}
        };
        
        // Accessing elements
        System.out.println("Element at [1][2]: " + matrix[1][2]);
        
        // Iterating 2D array
        for (int i = 0; i < matrix.length; i++) {
            for (int j = 0; j < matrix[i].length; j++) {
                System.out.print(matrix[i][j] + " ");
            }
            System.out.println();
        }
        
        // Jagged array
        int[][] jagged = {
            {1, 2},
            {3, 4, 5},
            {6, 7, 8, 9}
        };
    }
}
```

### Mathematical Operations on Arrays

```java
public class ArrayMath {
    // Calculate sum
    public static double sum(double[] array) {
        double sum = 0;
        for (double value : array) {
            sum += value;
        }
        return sum;
    }
    
    // Calculate mean: μ = (1/n) Σx_i
    public static double mean(double[] array) {
        if (array.length == 0) return 0;
        return sum(array) / array.length;
    }
    
    // Calculate variance: σ² = (1/n) Σ(x_i - μ)²
    public static double variance(double[] array) {
        if (array.length == 0) return 0;
        double mu = mean(array);
        double sumSquaredDiff = 0;
        for (double value : array) {
            sumSquaredDiff += Math.pow(value - mu, 2);
        }
        return sumSquaredDiff / array.length;
    }
    
    // Calculate standard deviation: σ = √σ²
    public static double standardDeviation(double[] array) {
        return Math.sqrt(variance(array));
    }
    
    // Dot product: a · b = Σ(a_i × b_i)
    public static double dotProduct(double[] a, double[] b) {
        if (a.length != b.length) {
            throw new IllegalArgumentException("Arrays must have same length");
        }
        double result = 0;
        for (int i = 0; i < a.length; i++) {
            result += a[i] * b[i];
        }
        return result;
    }
    
    // Find maximum
    public static double max(double[] array) {
        if (array.length == 0) throw new IllegalArgumentException("Array is empty");
        double max = array[0];
        for (double value : array) {
            if (value > max) max = value;
        }
        return max;
    }
    
    // Find minimum
    public static double min(double[] array) {
        if (array.length == 0) throw new IllegalArgumentException("Array is empty");
        double min = array[0];
        for (double value : array) {
            if (value < min) min = value;
        }
        return min;
    }
    
    public static void main(String[] args) {
        double[] data = {2.5, 3.7, 4.1, 5.2, 6.8, 7.3, 8.9};
        
        System.out.println("Data: " + java.util.Arrays.toString(data));
        System.out.println("Sum: " + sum(data));
        System.out.println("Mean: " + mean(data));
        System.out.println("Variance: " + variance(data));
        System.out.println("Standard Deviation: " + standardDeviation(data));
        System.out.println("Max: " + max(data));
        System.out.println("Min: " + min(data));
        
        double[] v1 = {1, 2, 3};
        double[] v2 = {4, 5, 6};
        System.out.println("Dot product: " + dotProduct(v1, v2));
    }
}
```

## Java Collections Framework

The Collections Framework provides interfaces and classes for storing and manipulating groups of objects.

### List Interface

`List` is an ordered collection that allows duplicate elements.

#### ArrayList

`ArrayList` is a resizable array implementation.

```java
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class ArrayListDemo {
    public static void main(String[] args) {
        // Create ArrayList
        List<String> list = new ArrayList<>();
        
        // Add elements
        list.add("Apple");
        list.add("Banana");
        list.add("Cherry");
        list.add("Date");
        
        // Access elements
        System.out.println("First element: " + list.get(0));
        System.out.println("Size: " + list.size());
        
        // Iterate
        for (String fruit : list) {
            System.out.print(fruit + " ");
        }
        System.out.println();
        
        // Check if contains
        System.out.println("Contains Apple: " + list.contains("Apple"));
        
        // Remove element
        list.remove("Banana");
        
        // Sort
        Collections.sort(list);
        System.out.println("Sorted: " + list);
    }
}
```

#### LinkedList

`LinkedList` provides efficient insertion and deletion.

```java
import java.util.LinkedList;
import java.util.List;

public class LinkedListDemo {
    public static void main(String[] args) {
        List<Integer> list = new LinkedList<>();
        
        list.add(10);
        list.add(20);
        list.add(30);
        
        // Add at beginning
        ((LinkedList<Integer>) list).addFirst(5);
        
        // Add at end
        ((LinkedList<Integer>) list).addLast(40);
        
        System.out.println("List: " + list);
        System.out.println("First: " + ((LinkedList<Integer>) list).getFirst());
        System.out.println("Last: " + ((LinkedList<Integer>) list).getLast());
    }
}
```

### Set Interface

`Set` is a collection that does not allow duplicate elements.

#### HashSet

`HashSet` stores elements using hash table.

```java
import java.util.HashSet;
import java.util.Set;

public class HashSetDemo {
    public static void main(String[] args) {
        Set<Integer> set = new HashSet<>();
        
        set.add(10);
        set.add(20);
        set.add(30);
        set.add(10); // Duplicate, will not be added
        
        System.out.println("Set: " + set);
        System.out.println("Size: " + set.size());
        System.out.println("Contains 20: " + set.contains(20));
        
        // Remove element
        set.remove(20);
        System.out.println("After removal: " + set);
    }
}
```

#### TreeSet

`TreeSet` maintains elements in sorted order.

```java
import java.util.TreeSet;
import java.util.Set;

public class TreeSetDemo {
    public static void main(String[] args) {
        Set<Integer> set = new TreeSet<>();
        
        set.add(30);
        set.add(10);
        set.add(20);
        set.add(5);
        
        // Automatically sorted
        System.out.println("Sorted Set: " + set);
    }
}
```

### Map Interface

`Map` stores key-value pairs.

#### HashMap

```java
import java.util.HashMap;
import java.util.Map;

public class HashMapDemo {
    public static void main(String[] args) {
        Map<String, Integer> grades = new HashMap<>();
        
        // Put key-value pairs
        grades.put("Alice", 95);
        grades.put("Bob", 87);
        grades.put("Charlie", 92);
        grades.put("Diana", 88);
        
        // Get value
        System.out.println("Alice's grade: " + grades.get("Alice"));
        
        // Check if key exists
        System.out.println("Contains Bob: " + grades.containsKey("Bob"));
        
        // Iterate through map
        for (Map.Entry<String, Integer> entry : grades.entrySet()) {
            System.out.println(entry.getKey() + ": " + entry.getValue());
        }
        
        // Calculate average
        double sum = 0;
        for (int grade : grades.values()) {
            sum += grade;
        }
        double average = sum / grades.size();
        System.out.println("Average grade: " + average);
    }
}
```

## Matrix Operations with Collections

```java
import java.util.ArrayList;
import java.util.List;

public class Matrix {
    private List<List<Double>> data;
    private int rows;
    private int cols;
    
    public Matrix(int rows, int cols) {
        this.rows = rows;
        this.cols = cols;
        this.data = new ArrayList<>();
        
        for (int i = 0; i < rows; i++) {
            List<Double> row = new ArrayList<>();
            for (int j = 0; j < cols; j++) {
                row.add(0.0);
            }
            data.add(row);
        }
    }
    
    public void set(int row, int col, double value) {
        data.get(row).set(col, value);
    }
    
    public double get(int row, int col) {
        return data.get(row).get(col);
    }
    
    // Matrix addition: C = A + B
    public Matrix add(Matrix other) {
        if (rows != other.rows || cols != other.cols) {
            throw new IllegalArgumentException("Matrix dimensions must match");
        }
        
        Matrix result = new Matrix(rows, cols);
        for (int i = 0; i < rows; i++) {
            for (int j = 0; j < cols; j++) {
                result.set(i, j, this.get(i, j) + other.get(i, j));
            }
        }
        return result;
    }
    
    // Matrix multiplication: C = A × B
    public Matrix multiply(Matrix other) {
        if (cols != other.rows) {
            throw new IllegalArgumentException("Invalid dimensions for multiplication");
        }
        
        Matrix result = new Matrix(rows, other.cols);
        for (int i = 0; i < rows; i++) {
            for (int j = 0; j < other.cols; j++) {
                double sum = 0;
                for (int k = 0; k < cols; k++) {
                    sum += this.get(i, k) * other.get(k, j);
                }
                result.set(i, j, sum);
            }
        }
        return result;
    }
    
    public void print() {
        for (int i = 0; i < rows; i++) {
            for (int j = 0; j < cols; j++) {
                System.out.printf("%8.2f ", get(i, j));
            }
            System.out.println();
        }
    }
    
    public static void main(String[] args) {
        Matrix A = new Matrix(2, 3);
        A.set(0, 0, 1); A.set(0, 1, 2); A.set(0, 2, 3);
        A.set(1, 0, 4); A.set(1, 1, 5); A.set(1, 2, 6);
        
        Matrix B = new Matrix(3, 2);
        B.set(0, 0, 7); B.set(0, 1, 8);
        B.set(1, 0, 9); B.set(1, 1, 10);
        B.set(2, 0, 11); B.set(2, 1, 12);
        
        System.out.println("Matrix A:");
        A.print();
        
        System.out.println("\nMatrix B:");
        B.print();
        
        Matrix C = A.multiply(B);
        System.out.println("\nA × B:");
        C.print();
    }
}
```

## Summary

Arrays and collections provide essential data structures:

1. **Arrays**: Fixed-size, simple containers
2. **ArrayList**: Resizable array, fast random access
3. **LinkedList**: Efficient insertion/deletion
4. **HashSet**: Fast lookups, no duplicates
5. **TreeSet**: Sorted set
6. **HashMap**: Key-value pairs, fast lookups

Key concepts:
- Arrays for fixed-size data
- Collections for dynamic data
- Lists preserve order, allow duplicates
- Sets ensure uniqueness
- Maps store key-value relationships
- Mathematical operations possible on all

Understanding these data structures enables efficient data manipulation and is fundamental for Java programming.

