# Lesson 9: File Input/Output in C++

## Overview

File I/O is essential for persistent data storage and retrieval in C++. C++ provides several mechanisms for file operations through the `<fstream>` library, which includes classes for reading from and writing to files. Understanding file I/O enables programs to save data, load configurations, process large datasets, and interact with external files.

## File Stream Classes

The `<fstream>` header provides three main classes:

1. **`ofstream`**: Output file stream (writing to files)
2. **`ifstream`**: Input file stream (reading from files)
3. **`fstream`**: File stream (both reading and writing)

## Basic File Operations

### Writing to a File

```cpp
#include <iostream>
#include <fstream>
#include <string>

int main() {
    // Create output file stream
    std::ofstream outputFile("data.txt");
    
    // Check if file opened successfully
    if (!outputFile.is_open()) {
        std::cerr << "Error: Could not open file for writing!" << std::endl;
        return 1;
    }
    
    // Write data to file
    outputFile << "Hello, World!" << std::endl;
    outputFile << "This is line 2" << std::endl;
    outputFile << 42 << " " << 3.14 << std::endl;
    
    // Close file
    outputFile.close();
    
    std::cout << "Data written to file successfully!" << std::endl;
    return 0;
}
```

### Reading from a File

```cpp
#include <iostream>
#include <fstream>
#include <string>

int main() {
    // Create input file stream
    std::ifstream inputFile("data.txt");
    
    // Check if file opened successfully
    if (!inputFile.is_open()) {
        std::cerr << "Error: Could not open file for reading!" << std::endl;
        return 1;
    }
    
    std::string line;
    
    // Read line by line
    while (std::getline(inputFile, line)) {
        std::cout << line << std::endl;
    }
    
    // Close file
    inputFile.close();
    
    return 0;
}
```

## File Modes

Files can be opened in different modes:

- `std::ios::in`: Open for reading
- `std::ios::out`: Open for writing (truncates if exists)
- `std::ios::app`: Append mode (write at end)
- `std::ios::ate`: Open and seek to end
- `std::ios::binary`: Binary mode
- `std::ios::trunc`: Truncate file if exists

```cpp
#include <fstream>

// Append to file
std::ofstream file("data.txt", std::ios::app);

// Open for both reading and writing
std::fstream file("data.txt", std::ios::in | std::ios::out);

// Binary mode
std::ofstream binaryFile("data.bin", std::ios::binary);
```

## Mathematical Example: Reading and Processing Data

### Writing Numerical Data

```cpp
#include <iostream>
#include <fstream>
#include <vector>
#include <iomanip>
#include <cmath>

void writeDataToFile(const std::string& filename, 
                     const std::vector<double>& x, 
                     const std::vector<double>& y) {
    std::ofstream file(filename);
    
    if (!file.is_open()) {
        std::cerr << "Error opening file!" << std::endl;
        return;
    }
    
    // Write header
    file << "# X Values\tY Values" << std::endl;
    
    // Write data
    file << std::fixed << std::setprecision(6);
    for (size_t i = 0; i < x.size(); i++) {
        file << x[i] << "\t" << y[i] << std::endl;
    }
    
    file.close();
    std::cout << "Data written to " << filename << std::endl;
}

int main() {
    // Generate sample data: y = x²
    std::vector<double> x, y;
    
    for (double i = 0; i <= 10; i += 0.5) {
        x.push_back(i);
        y.push_back(i * i);
    }
    
    writeDataToFile("quadratic_data.txt", x, y);
    
    return 0;
}
```

### Reading and Analyzing Data

```cpp
#include <iostream>
#include <fstream>
#include <vector>
#include <string>
#include <sstream>
#include <cmath>
#include <algorithm>
#include <numeric>

struct DataPoint {
    double x;
    double y;
};

std::vector<DataPoint> readDataFromFile(const std::string& filename) {
    std::vector<DataPoint> data;
    std::ifstream file(filename);
    
    if (!file.is_open()) {
        std::cerr << "Error opening file!" << std::endl;
        return data;
    }
    
    std::string line;
    
    while (std::getline(file, line)) {
        // Skip comment lines
        if (line.empty() || line[0] == '#') {
            continue;
        }
        
        std::istringstream iss(line);
        DataPoint point;
        
        if (iss >> point.x >> point.y) {
            data.push_back(point);
        }
    }
    
    file.close();
    return data;
}

void analyzeData(const std::vector<DataPoint>& data) {
    if (data.empty()) {
        std::cout << "No data to analyze!" << std::endl;
        return;
    }
    
    // Extract x and y values
    std::vector<double> xValues, yValues;
    for (const auto& point : data) {
        xValues.push_back(point.x);
        yValues.push_back(point.y);
    }
    
    // Calculate statistics
    double xMean = std::accumulate(xValues.begin(), xValues.end(), 0.0) / xValues.size();
    double yMean = std::accumulate(yValues.begin(), yValues.end(), 0.0) / yValues.size();
    
    // Calculate variance
    double xVariance = 0, yVariance = 0;
    for (size_t i = 0; i < data.size(); i++) {
        xVariance += std::pow(xValues[i] - xMean, 2);
        yVariance += std::pow(yValues[i] - yMean, 2);
    }
    xVariance /= data.size();
    yVariance /= data.size();
    
    // Calculate covariance
    double covariance = 0;
    for (size_t i = 0; i < data.size(); i++) {
        covariance += (xValues[i] - xMean) * (yValues[i] - yMean);
    }
    covariance /= data.size();
    
    // Calculate correlation coefficient: r = Cov(X,Y) / (σ_X × σ_Y)
    double correlation = covariance / (std::sqrt(xVariance) * std::sqrt(yVariance));
    
    std::cout << "Data Analysis:" << std::endl;
    std::cout << "==============" << std::endl;
    std::cout << "Number of data points: " << data.size() << std::endl;
    std::cout << "X mean: " << xMean << std::endl;
    std::cout << "Y mean: " << yMean << std::endl;
    std::cout << "X variance: " << xVariance << std::endl;
    std::cout << "Y variance: " << yVariance << std::endl;
    std::cout << "Covariance: " << covariance << std::endl;
    std::cout << "Correlation coefficient: " << correlation << std::endl;
}

int main() {
    std::vector<DataPoint> data = readDataFromFile("quadratic_data.txt");
    
    std::cout << "Loaded " << data.size() << " data points" << std::endl;
    std::cout << "\nFirst 5 points:" << std::endl;
    for (size_t i = 0; i < std::min(data.size(), size_t(5)); i++) {
        std::cout << "(" << data[i].x << ", " << data[i].y << ")" << std::endl;
    }
    
    std::cout << std::endl;
    analyzeData(data);
    
    return 0;
}
```

## CSV File Processing

CSV (Comma-Separated Values) is a common file format for data exchange.

```cpp
#include <iostream>
#include <fstream>
#include <vector>
#include <string>
#include <sstream>

class CSVReader {
public:
    static std::vector<std::vector<std::string>> readCSV(const std::string& filename) {
        std::vector<std::vector<std::string>> data;
        std::ifstream file(filename);
        
        if (!file.is_open()) {
            std::cerr << "Error opening CSV file!" << std::endl;
            return data;
        }
        
        std::string line;
        
        while (std::getline(file, line)) {
            std::vector<std::string> row;
            std::stringstream ss(line);
            std::string cell;
            
            while (std::getline(ss, cell, ',')) {
                row.push_back(cell);
            }
            
            data.push_back(row);
        }
        
        file.close();
        return data;
    }
    
    static void writeCSV(const std::string& filename, 
                        const std::vector<std::vector<std::string>>& data) {
        std::ofstream file(filename);
        
        if (!file.is_open()) {
            std::cerr << "Error opening CSV file for writing!" << std::endl;
            return;
        }
        
        for (const auto& row : data) {
            for (size_t i = 0; i < row.size(); i++) {
                file << row[i];
                if (i < row.size() - 1) {
                    file << ",";
                }
            }
            file << std::endl;
        }
        
        file.close();
    }
};

int main() {
    // Create sample CSV data
    std::vector<std::vector<std::string>> data = {
        {"Name", "Age", "Score"},
        {"Alice", "25", "95"},
        {"Bob", "30", "87"},
        {"Charlie", "22", "92"}
    };
    
    // Write to CSV
    CSVReader::writeCSV("students.csv", data);
    std::cout << "CSV file written successfully!" << std::endl;
    
    // Read from CSV
    auto readData = CSVReader::readCSV("students.csv");
    
    std::cout << "\nCSV Contents:" << std::endl;
    for (const auto& row : readData) {
        for (const auto& cell : row) {
            std::cout << cell << "\t";
        }
        std::cout << std::endl;
    }
    
    return 0;
}
```

## Binary File I/O

Binary files store data in binary format, which is more efficient for numerical data.

```cpp
#include <iostream>
#include <fstream>
#include <vector>

void writeBinaryFile(const std::string& filename, const std::vector<double>& data) {
    std::ofstream file(filename, std::ios::binary);
    
    if (!file.is_open()) {
        std::cerr << "Error opening binary file!" << std::endl;
        return;
    }
    
    // Write size first
    size_t size = data.size();
    file.write(reinterpret_cast<const char*>(&size), sizeof(size));
    
    // Write data
    file.write(reinterpret_cast<const char*>(data.data()), 
               size * sizeof(double));
    
    file.close();
    std::cout << "Binary file written: " << filename << std::endl;
}

std::vector<double> readBinaryFile(const std::string& filename) {
    std::vector<double> data;
    std::ifstream file(filename, std::ios::binary);
    
    if (!file.is_open()) {
        std::cerr << "Error opening binary file!" << std::endl;
        return data;
    }
    
    // Read size
    size_t size;
    file.read(reinterpret_cast<char*>(&size), sizeof(size));
    
    // Read data
    data.resize(size);
    file.read(reinterpret_cast<char*>(data.data()), size * sizeof(double));
    
    file.close();
    return data;
}

int main() {
    // Create sample data
    std::vector<double> originalData;
    for (int i = 0; i < 100; i++) {
        originalData.push_back(i * 0.1);
    }
    
    // Write binary file
    writeBinaryFile("data.bin", originalData);
    
    // Read binary file
    auto readData = readBinaryFile("data.bin");
    
    std::cout << "Read " << readData.size() << " values" << std::endl;
    std::cout << "First 5 values: ";
    for (size_t i = 0; i < std::min(readData.size(), size_t(5)); i++) {
        std::cout << readData[i] << " ";
    }
    std::cout << std::endl;
    
    return 0;
}
```

## Matrix File Operations

```cpp
#include <iostream>
#include <fstream>
#include <vector>
#include <sstream>

class Matrix {
private:
    std::vector<std::vector<double>> data;
    
public:
    Matrix(size_t rows, size_t cols) : data(rows, std::vector<double>(cols, 0)) {}
    
    double& operator()(size_t i, size_t j) { return data[i][j]; }
    const double& operator()(size_t i, size_t j) const { return data[i][j]; }
    
    size_t rows() const { return data.size(); }
    size_t cols() const { return data.empty() ? 0 : data[0].size(); }
    
    void saveToFile(const std::string& filename) const {
        std::ofstream file(filename);
        
        if (!file.is_open()) {
            std::cerr << "Error opening file!" << std::endl;
            return;
        }
        
        file << rows() << " " << cols() << std::endl;
        for (size_t i = 0; i < rows(); i++) {
            for (size_t j = 0; j < cols(); j++) {
                file << data[i][j];
                if (j < cols() - 1) file << " ";
            }
            file << std::endl;
        }
        
        file.close();
    }
    
    static Matrix loadFromFile(const std::string& filename) {
        std::ifstream file(filename);
        
        if (!file.is_open()) {
            std::cerr << "Error opening file!" << std::endl;
            return Matrix(0, 0);
        }
        
        size_t rows, cols;
        file >> rows >> cols;
        
        Matrix matrix(rows, cols);
        
        for (size_t i = 0; i < rows; i++) {
            for (size_t j = 0; j < cols; j++) {
                file >> matrix(i, j);
            }
        }
        
        file.close();
        return matrix;
    }
    
    void print() const {
        for (size_t i = 0; i < rows(); i++) {
            for (size_t j = 0; j < cols(); j++) {
                std::cout << data[i][j] << " ";
            }
            std::cout << std::endl;
        }
    }
};

int main() {
    // Create and populate matrix
    Matrix matrix(3, 3);
    int value = 1;
    for (size_t i = 0; i < matrix.rows(); i++) {
        for (size_t j = 0; j < matrix.cols(); j++) {
            matrix(i, j) = value++;
        }
    }
    
    std::cout << "Original Matrix:" << std::endl;
    matrix.print();
    
    // Save to file
    matrix.saveToFile("matrix.txt");
    
    // Load from file
    Matrix loadedMatrix = Matrix::loadFromFile("matrix.txt");
    
    std::cout << "\nLoaded Matrix:" << std::endl;
    loadedMatrix.print();
    
    return 0;
}
```

## Error Handling

```cpp
#include <iostream>
#include <fstream>
#include <string>

bool safeFileOperation(const std::string& filename) {
    std::ofstream file(filename);
    
    if (!file) {
        std::cerr << "Error: Failed to open " << filename << std::endl;
        return false;
    }
    
    if (!file.is_open()) {
        std::cerr << "Error: File stream not open" << std::endl;
        return false;
    }
    
    // Check write permission
    file << "Test";
    if (file.fail()) {
        std::cerr << "Error: Failed to write to file" << std::endl;
        file.close();
        return false;
    }
    
    file.close();
    
    if (file.fail()) {
        std::cerr << "Error: Failed to close file" << std::endl;
        return false;
    }
    
    return true;
}
```

## Summary

File I/O enables persistent data storage:

1. **File Streams**: `ifstream`, `ofstream`, `fstream`
2. **Text Files**: Human-readable format
3. **Binary Files**: Efficient for numerical data
4. **CSV Processing**: Common data exchange format
5. **Error Handling**: Always check file operations

Key concepts:
- Open files before operations
- Check if files opened successfully
- Close files when done
- Handle errors appropriately
- Choose text or binary format based on needs

Mastering file I/O allows programs to save state, load configurations, process datasets, and interact with external data sources effectively.

