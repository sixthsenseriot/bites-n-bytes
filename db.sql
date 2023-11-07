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
    price DECIMAL(10, 2), -- Price in dollars
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
    order_id INT REFERENCES Orders(order_id),
    food_id INT REFERENCES FoodItems(food_id)
);

CREATE TABLE PaymentInfo (
    payment_id SERIAL PRIMARY KEY,
    order_id INT REFERENCES Orders(order_id),
    payment_amount DECIMAL(10, 2), -- Payment amount in dollars
    payment_date DATE,
    tax_amount DECIMAL(10, 2), -- Tax amount in dollars
    tips_amount DECIMAL(10, 2) -- Tips amount in dollars
);

INSERT INTO Restaurants (name, location)
VALUES 
    ('Texan Delight', 'Houston, TX'),
    ('Chinese Garden', 'New York, NY'),
    ('Spicy Indian', 'San Francisco, CA'),
    ('French Bistro', 'Los Angeles, CA'),
    ('Italian Trattoria', 'Chicago, IL');

INSERT INTO FoodCategories (category_name)
VALUES 
    ('Texan'),
    ('Chinese'),
    ('Indian'),
    ('French'),
    ('Italian');

INSERT INTO FoodItems (name, description, price, category_id)
VALUES 
    ('Texan Steak', 'A juicy Texan steak', 20.00, 1),
    ('General Tso''s Chicken', 'Crispy chicken in sweet and spicy sauce', 15.00, 2),
    ('Chicken Tikka Masala', 'Creamy tomato curry', 18.00, 3),
    ('Coq au Vin', 'French chicken dish', 22.00, 4),
    ('Spaghetti Carbonara', 'Italian pasta', 16.00, 5);

INSERT INTO customer (name, email, has_loyalty_card)
VALUES 
    ('John Doe', 'john.doe@example.com', true),
    ('Jane Smith', 'jane.smith@example.com', false),
    ('Alice Johnson', 'alice.johnson@example.com', true),
    ('Bob Brown', 'bob.brown@example.com', false),
    ('Eva White', 'eva.white@example.com', true);

INSERT INTO Restaurants (name, location)
VALUES 
    ('BBQ Heaven', 'Austin, TX'),
    ('Peking House', 'San Francisco, CA'),
    ('Tandoori Palace', 'New York, NY'),
    ('La Petite Boulangerie', 'Chicago, IL'),
    ('Trattoria Amore', 'Los Angeles, CA');

INSERT INTO FoodItems (name, description, price, category_id)
VALUES 
    ('BBQ Ribs', 'Smoked to perfection', 22.00, 1),
    ('Kung Pao Chicken', 'Spicy and flavorful', 16.00, 2),
    ('Chicken Curry', 'Rich and aromatic', 18.00, 3),
    ('Croissant', 'Freshly baked French pastry', 5.00, 4),
    ('Margherita Pizza', 'Classic Italian pizza', 12.00, 5);