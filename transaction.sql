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
