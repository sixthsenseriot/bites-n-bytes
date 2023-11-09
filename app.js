const express = require('express');
const app = express();
const port = 5000;
const path = require("path");
const { Pool } = require('pg');

const creds = require('./creds.json');
const pool = new Pool(creds);

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true })); // Middleware for parsing form data

// Render homepage with menu selection
app.get('/', async (req, res) => {
    const restaurantId = req.query.restaurantId;
    let menuHtml = "";
    let ordersHtml = "";
    let restaurantName = "";

    if (restaurantId) {
        try {
            const result = await pool.query(`
                SELECT DISTINCT f.food_id, f.name AS food_name, f.description AS food_description, f.price, c.category_name
                FROM FoodItems f
                JOIN FoodCategories c ON f.category_id = c.category_id
                WHERE f.category_id = $1
            `, [restaurantId]);

            if (result.rows.length > 0) {
                menuHtml = result.rows.map(row => {
                    const price = parseFloat(row.price); // Convert price to a number
                    return `
                        <div class="menu-container d-flex justify-content-center">
                        <div>
                            <h5>${row.food_name}</h5>
                            <p>${row.food_description}</p>
                            <p>Price: $${price.toFixed(2)}</p>
                            <p>Category: ${row.category_name}</p>
                            <form action="/add-to-order" method="POST">
                                <input type="hidden" name="foodId" value="${row.food_id}">
                                <label for="customerId">Enter Customer ID:</label>
                                <input type="number" name="customerId" id="customerId" required>
                                <button type="submit">Add to Order</button>
                            </form>
                        </div>
                        </div>
                    `;
                }).join('');
            }
        } catch (err) {
            return res.status(500).send("Error: " + err.message);
        }
    }
    // Get restaurant name
    if (restaurantId) {
        try {
            const result = await pool.query(`
            SELECT * FROM Restaurants WHERE restaurant_id = $1
            `, [restaurantId]);

            if (result.rows.length > 0) {
                restaurantName = result.rows.map(row => {
                    return `
                        <div class="menu-container d-flex justify-content-center">
                            <h3>${row.name}</h3>
                        </div>
                    `;
                }).join('');
            }
        } catch (err) {
            return res.status(500).send("Error: " + err.message);
        }
    }

    res.render('index', { menuHtml, ordersHtml, restaurantName });
});

// Render orders page
app.get('/orders', async function(req, res) {
    const customerId = req.query.customerId;
    let customerInfoHtml = "";
    let orderHtml = "";
    let totalOrderAmount = 0; // Initialize total order amount to 0.

    if (customerId) {
        try {
            const customerResult = await pool.query(`
                SELECT customer_id, name, email, has_loyalty_card
                FROM customer
                WHERE customer_id = $1
            `, [customerId]);

            if (customerResult.rows.length > 0) {
                const customer = customerResult.rows[0];
                customerInfoHtml = `
                    <div>
                        <h3 class="d-flex justify-content-center mb-3">Orders from Customer ID: ${customer.customer_id}</h3>
                        <div class="customer-container d-flex justify-content-center">
                            <div>
                            <p>Name: ${customer.name}</p>
                            <p>Email: ${customer.email}</p>
                            <p>Loyalty Card: ${customer.has_loyalty_card ? 'Yes' : 'No'}</p>
                            </div>
                        </div>
                    </div>
                `;

                const orderResult = await pool.query(`
                    SELECT oi.order_item_id, f.name AS food_name, f.price
                    FROM OrderItems oi
                    JOIN FoodItems f ON oi.food_id = f.food_id
                    WHERE oi.order_id IN (SELECT order_id FROM Orders WHERE customer_id = $1)
                `, [customerId]);

                if (orderResult.rows.length > 0) {
                    orderHtml = `
                        <div>
                            <h5 class="d-flex justify-content-center mb-3">Customer Orders</h5>
                            <div class="d-flex justify-content-center">
                            <div>
                                <ul>
                                    ${orderResult.rows.map(order => {
                                        totalOrderAmount += parseFloat(order.price); // Add the price to the total order amount.
                                        return `
                                            <div class="d-flex justify-content-center">
                                            <li>${order.food_name} - $${order.price}
                                                <form action="/remove-from-order" method="POST" style="display:inline;">
                                                    <input type="hidden" name="orderItemId" value="${order.order_item_id}">
                                                    <input type="hidden" name="customerId" value="${customerId}"> <!-- Include customer ID -->
                                                    <button type="submit" class="btn btn-link">Remove</button>
                                                </form>
                                            </li>
                                            </div>
                                        `;
                                    }).join('')}
                                </ul>
                            </div>
                            </div>
                        </div>
                    `;
                }
            }
        } catch (err) {
            return res.status(500).send("Error: " + err.message);
        }
    }

    res.render('orders', { customerId, customerInfoHtml, orderHtml, totalOrderAmount });
});

// Add to order function in homepage
app.post('/add-to-order', async (req, res) => {
    const customerId = req.body.customerId;
    const foodId = req.body.foodId;

    if (!customerId || !foodId) {
        return res.status(400).send("Invalid customer ID or food ID");
    }

    try {
        const orderResult = await pool.query(`
            SELECT order_id
            FROM Orders
            WHERE customer_id = $1
        `, [customerId]);

        let orderId;

        if (orderResult.rows.length > 0) {
            orderId = orderResult.rows[0].order_id;
        } else {
            const newOrderResult = await pool.query(`
                INSERT INTO Orders (customer_id, restaurant_id, order_date, package_meal)
                VALUES ($1, 1, current_date, false) -- Assuming restaurant ID is 1 and package_meal is set to false
                RETURNING order_id
            `, [customerId]);

            orderId = newOrderResult.rows[0].order_id;
        }

        await pool.query(`
            INSERT INTO OrderItems (order_id, food_id)
            VALUES ($1, $2)
        `, [orderId, foodId]);

        // Redirect back to the customer's order page
        res.redirect(`/orders?customerId=${customerId}`);
    } catch (err) {
        res.status(500).send("Error: " + err.message);
    }
});

// Remove from order function in order page
app.post('/remove-from-order', async (req, res) => {
    const orderItemId = req.body.orderItemId;
    const customerId = req.body.customerId; // Include this line to retrieve the customer ID

    if (!orderItemId) {
        return res.status(400).send("Invalid order item ID");
    }

    try {
        await pool.query(`
            DELETE FROM OrderItems
            WHERE order_item_id = $1
        `, [orderItemId]);

        // Redirect back to the customer's order page with the customer ID
        return res.redirect(`/orders?customerId=${customerId}`);
    } catch (err) {
        return res.status(500).send("Error: " + err.message);
    }
});

// Checkout page
app.post('/checkedout', async (req, res) => {
    const customerId = req.body.customerId;
    let customerInfoHtml = "";
    let orderHtml = "";
    let totalOrderAmount = 0; // Initialize total order amount to 0.
    const foodId = req.body.foodId;
    const orderItemId = req.body.orderItemId;

    if (!customerId) {
        return res.status(400).send("Invalid customer ID");
    }
    
    try {
        const customerResult = await pool.query(`
            SELECT customer_id, name, email, has_loyalty_card
            FROM customer
            WHERE customer_id = $1
        `, [customerId]);

        if (customerResult.rows.length > 0) {
            const customer = customerResult.rows[0];
            customerInfoHtml = `
                    <div>
                        <p class="customer-container d-flex justify-content-center">Customer ID: ${customer.customer_id}</p>
                        <p class="customer-container d-flex justify-content-center">Name: ${customer.name}</p>
                        <p class="customer-container d-flex justify-content-center">Email: ${customer.email}</p>
                        <p class="customer-container d-flex justify-content-center">Loyalty Card: ${customer.has_loyalty_card ? 'Yes' : 'No'}</p>
                    </div>
            `;

            const orderResult = await pool.query(`
                SELECT oi.order_item_id, f.name AS food_name, f.price
                FROM OrderItems oi
                JOIN FoodItems f ON oi.food_id = f.food_id
                WHERE oi.order_id IN (SELECT order_id FROM Orders WHERE customer_id = $1)
            `, [customerId]);

            if (orderResult.rows.length > 0) {
                orderHtml = `
                    <div>
                        <h5 class="d-flex justify-content-center mb-3">Customer Orders</h5>
                        <div class="order-container px-5 mb-3">
                            ${orderResult.rows.map((order, index) => {
                                totalOrderAmount += parseFloat(order.price); // Add the price to the total order amount.
                                return `
                                    <div class="row">
                                        <div class="col"><p>${index + 1}. ${order.food_name}</p></div>
                                        <div class="col"><p class="d-flex justify-content-end">$${order.price}</p></div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            }
        }
    } catch (err) {
        return res.status(500).send("Error: " + err.message);
    }
    
    // Get customer name
    try {
        const result = await pool.query(`
        SELECT * FROM customer WHERE customer_id = $1
        `, [customerId]);

        if (result.rows.length > 0) {
            customerName = result.rows.map(row => {
                return `${row.name}`;
            }).join('');
        }
    } catch (err) {
        return res.status(500).send("Error: " + err.message);
    }

    // Create new table CustomerTransaction and OrderHistory
    try {
        const result = await pool.query(`
        CREATE TABLE IF NOT EXISTS CustomerTransaction (
            customer_id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            date DATE NOT NULL,
            transaction VARCHAR(255) NOT NULL
        );
        `);
    } catch (err) {
        return res.status(500).send("Error: " + err.message);
    }
    try {
        const result = await pool.query(`
        CREATE TABLE IF NOT EXISTS OrderHIstory (
            order_item_id SERIAL PRIMARY KEY,
            order_id INT REFERENCES customer(customer_id),
            food_id INT NOT NULL
        );
        `);
    } catch (err) {
        return res.status(500).send("Error: " + err.message);
    }

    // Add bought items to OrderHistory table
    // try {
    //     const newOrderResult = await pool.query(`
    //     INSERT INTO OrderHistory (order_id, food_id) VALUES ($1, $2)
    //     `, [customerId, foodId]);
    // } catch (err) {
    //     return res.status(500).send("Error: " + err.message);
    // }

    res.render('checkedout', { customerId, customerInfoHtml, orderHtml, totalOrderAmount });
  });

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
