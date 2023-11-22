DROP TABLE IF EXISTS Restaurants cascade;
DROP TABLE IF EXISTS FoodCategories cascade;
DROP TABLE IF EXISTS FoodItems cascade;
DROP TABLE IF EXISTS customer cascade;
DROP TABLE IF EXISTS Orders cascade;
DROP TABLE IF EXISTS OrderItems cascade;
DROP TABLE IF EXISTS PaymentInfo cascade;
DROP TABLE IF EXISTS CustomerTransaction cascade;
DROP TABLE IF EXISTS OrderHistory cascade;

CREATE TABLE PaymentInfo (
    payment_id SERIAL PRIMARY KEY,
    order_id INT REFERENCES Orders(order_id),
    payment_amount DECIMAL(10, 2),
    payment_date DATE,
    tax_amount DECIMAL(10, 2),
    tips_amount DECIMAL(10, 2) 
);

CREATE TABLE Restaurants (
    restaurant_id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    location VARCHAR(255)
);

CREATE TABLE FoodCategories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(255)
);

CREATE TABLE FoodItems (
    food_id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    description TEXT,
    price DECIMAL(10, 2),
    category_id INT REFERENCES FoodCategories(category_id)
);

CREATE TABLE customer (
    customer_id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255),
    has_loyalty_card BOOLEAN
);

CREATE TABLE Orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INT REFERENCES customer(customer_id),
    restaurant_id INT REFERENCES Restaurants(restaurant_id),
    order_date DATE,
    package_meal BOOLEAN
);

CREATE TABLE OrderItems (
    order_item_id SERIAL PRIMARY KEY,
    customer_id INT REFERENCES customer(customer_id),
    order_id INT REFERENCES Orders(order_id),
    food_id INT REFERENCES FoodItems(food_id)
);
