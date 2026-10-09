-- ==========================================================
-- SAVE & SMILE E-COMMERCE OPERATING SYSTEM
-- MICROSOFT SQL SERVER (MSSQL) DATABASE SCHEMA
-- ==========================================================

-- 1. Create Database if not exists
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'SaveAndSmileDB')
BEGIN
    CREATE DATABASE SaveAndSmileDB;
END
GO

USE SaveAndSmileDB;
GO

-- 2. Administrators & Users
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    CREATE TABLE Users (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Email NVARCHAR(150) NOT NULL UNIQUE,
        PasswordHash NVARCHAR(255) NOT NULL,
        FullName NVARCHAR(150) NOT NULL,
        Role NVARCHAR(50) NOT NULL DEFAULT 'Admin', -- Admin, Manager, Staff
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
    );
END
GO

-- 3. Product Categories
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Categories')
BEGIN
    CREATE TABLE Categories (
        Id NVARCHAR(50) PRIMARY KEY, -- e.g. 'storage', 'smartwatches'
        Name NVARCHAR(100) NOT NULL,
        Slug NVARCHAR(100) NOT NULL UNIQUE,
        Icon NVARCHAR(500) NULL,
        ProductCount INT NOT NULL DEFAULT 0,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
    );
END
GO

-- 4. Products & SKUs
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Products')
BEGIN
    CREATE TABLE Products (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Title NVARCHAR(300) NOT NULL,
        Description NVARCHAR(MAX) NULL,
        Code NVARCHAR(50) NOT NULL UNIQUE, -- SKU code e.g. 'QGW-100196'
        CategorySlug NVARCHAR(50) NULL,
        Tab NVARCHAR(50) NULL DEFAULT 'storage',
        Price DECIMAL(18,2) NOT NULL,
        OriginalPrice DECIMAL(18,2) NULL,
        Rating DECIMAL(3,2) NOT NULL DEFAULT 4.8,
        ReviewsCount INT NOT NULL DEFAULT 0,
        Badge NVARCHAR(50) NULL,
        Image NVARCHAR(500) NOT NULL,
        Stock INT NOT NULL DEFAULT 100,
        IsFlashSale BIT NOT NULL DEFAULT 0,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_Products_Categories FOREIGN KEY (CategorySlug) REFERENCES Categories(Id) ON DELETE SET NULL
    );
END
GO

-- 5. Inventory Movements Ledger
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'InventoryMovements')
BEGIN
    CREATE TABLE InventoryMovements (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        ProductId INT NOT NULL,
        ChangeQty INT NOT NULL, -- Positive for restock, negative for sales
        PreviousStock INT NOT NULL,
        NewStock INT NOT NULL,
        Reason NVARCHAR(150) NOT NULL, -- 'Order Placed', 'Restock', 'Manual Adjustment', 'Return'
        ReferenceId NVARCHAR(100) NULL, -- Order Code or Purchase ID
        CreatedBy NVARCHAR(150) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_Inventory_Products FOREIGN KEY (ProductId) REFERENCES Products(Id) ON DELETE CASCADE
    );
END
GO

-- 6. Customers Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Customers')
BEGIN
    CREATE TABLE Customers (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(150) NOT NULL,
        Phone NVARCHAR(50) NOT NULL,
        Address NVARCHAR(500) NOT NULL,
        City NVARCHAR(100) NOT NULL,
        TotalOrders INT NOT NULL DEFAULT 1,
        TotalSpent DECIMAL(18,2) NOT NULL DEFAULT 0,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
    );
END
GO

-- 7. Orders Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Orders')
BEGIN
    CREATE TABLE Orders (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        OrderCode NVARCHAR(50) NOT NULL UNIQUE, -- e.g. 'SS-100482'
        CustomerId INT NULL,
        CustomerName NVARCHAR(150) NOT NULL,
        CustomerPhone NVARCHAR(50) NOT NULL,
        CustomerAddress NVARCHAR(500) NOT NULL,
        CustomerCity NVARCHAR(100) NOT NULL,
        PaymentMethod NVARCHAR(50) NOT NULL DEFAULT 'COD', -- COD, JazzCash, EasyPaisa, Bank
        Subtotal DECIMAL(18,2) NOT NULL,
        ShippingFee DECIMAL(18,2) NOT NULL DEFAULT 0,
        GrandTotal DECIMAL(18,2) NOT NULL,
        Status NVARCHAR(50) NOT NULL DEFAULT 'Pending', -- Pending, Processing, Shipped, Delivered, Cancelled
        Courier NVARCHAR(100) NULL, -- 'Leopards Courier', 'TCS Express', 'Trax'
        TrackingNumber NVARCHAR(100) NULL, -- 'LEOP-849201'
        Notes NVARCHAR(500) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_Orders_Customers FOREIGN KEY (CustomerId) REFERENCES Customers(Id) ON DELETE SET NULL
    );
END
GO

-- 8. Order Items Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'OrderItems')
BEGIN
    CREATE TABLE OrderItems (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        OrderId INT NOT NULL,
        ProductId INT NULL,
        ProductTitle NVARCHAR(300) NOT NULL,
        ProductCode NVARCHAR(50) NULL,
        Price DECIMAL(18,2) NOT NULL,
        Quantity INT NOT NULL DEFAULT 1,
        Total DECIMAL(18,2) NOT NULL,
        CONSTRAINT FK_OrderItems_Orders FOREIGN KEY (OrderId) REFERENCES Orders(Id) ON DELETE CASCADE
    );
END
GO

-- 9. Suppliers & Purchases
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Suppliers')
BEGIN
    CREATE TABLE Suppliers (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(150) NOT NULL,
        ContactPerson NVARCHAR(100) NULL,
        Phone NVARCHAR(50) NULL,
        City NVARCHAR(100) NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
    );
END
GO

-- Indexes for lightning fast queries
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Products_CategorySlug')
    CREATE INDEX IX_Products_CategorySlug ON Products(CategorySlug);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Orders_OrderCode')
    CREATE INDEX IX_Orders_OrderCode ON Orders(OrderCode);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Orders_Status')
    CREATE INDEX IX_Orders_Status ON Orders(Status);
GO
