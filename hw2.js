const express = require('express');
const { Pool } = require('pg');
const app = express();
const port = 1000;

const creds = require('./creds.json'); // Update with your PostgreSQL credentials
const pool = new Pool(creds);

app.use(express.urlencoded({ extended: true })); // Middleware for parsing form data

app.get('/', async (req, res) => {
    const restaurantId = req.query.restaurantId;
    let menuHtml = "";
    let ordersHtml = "";

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
                        <div>
                            <h3>${row.food_name}</h3>
                            <p>${row.food_description}</p>
                            <p>Price: $${price.toFixed(2)}</p>
                            <p>Category: ${row.category_name}</p>
                            <form action="/add-to-order" method="POST">
                                <input type="hidden" name="foodId" value="${row.food_id}">
                                <label for="customerId">Select Customer ID:</label>
                                <input type="number" name="customerId" id="customerId" required>
                                <button type="submit">Add to Order</button>
                            </form>
                        </div>
                    `;
                }).join('');
            }
        } catch (err) {
            return res.status(500).send("Error: " + err.message);
        }
    }

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Restaurant Menu</title>
        </head>
        <body>
            <form action="/" method="GET">
                <label for="restaurantId">Select a Restaurant:</label>
                <select name="restaurantId" id="restaurantId">
                    <option value="1">Texan Delight</option>
                    <option value="2">Chinese Garden</option>
                    <option value="3">Spicy Indian</option>
                    <option value="4">French Bistro</option>
                    <option value="5">Italian Trattoria</option>
                </select>
                <button type="submit">View Menu</button>
            </form>
            <h2>Restaurant Menu:</h2>
            ${menuHtml || '<p>Select a restaurant to view the menu.</p>'}

            <form action="/orders" method="GET">
                <label for="customerId">Enter Customer ID:</label>
                <input type="number" name="customerId" id="customerId" required>
                <button type="submit">View Customer Orders</button>
            </form>
            <h2>Customer Orders:</h2>
            ${ordersHtml || '<p>Enter a customer ID to view orders.</p>'}
        </body>
        </html>
    `);
});

app.get('/orders', async (req, res) => {
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
                        <h3>Customer ID: ${customer.customer_id}</h3>
                        <p>Name: ${customer.name}</p>
                        <p>Email: ${customer.email}</p>
                        <p>Loyalty Card: ${customer.has_loyalty_card ? 'Yes' : 'No'}</p>
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
                        <h2>Customer Order:</h2>
                        <ul>
                            ${orderResult.rows.map(order => {
                                totalOrderAmount += parseFloat(order.price); // Add the price to the total order amount.
                                return `
                                    <li>${order.food_name} 
                                        <form action="/remove-from-order" method="POST" style="display:inline;">
                                            <input type="hidden" name="orderItemId" value="${order.order_item_id}">
                                            <input type="hidden" name="customerId" value="${customerId}"> <!-- Include customer ID -->
                                            <button type="submit">Remove</button>
                                        </form>
                                    </li>
                                `;
                            }).join('')}
                        </ul>
                    `;
                }
            }
        } catch (err) {
            return res.status(500).send("Error: " + err.message);
        }
    }

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Customer Orders</title>
        </head>
        <body>
            <form action="/orders" method="GET">
                <label for="customerId">Enter Customer ID:</label>
                <input type="number" name="customerId" id="customerId" required>
                <button type="submit">View Customer Orders</button>
            </form>
            ${customerInfoHtml || '<p>Enter a valid customer ID to view customer information.</p>'}
            ${orderHtml || '<p>No orders found for this customer.</p>'}
            <h2>Total Order Amount: $${totalOrderAmount.toFixed(2)}</h2> <!-- Display the total order amount. -->
        </body>
        </html>
    `);
});

// ... (existing code for /add-to-order and /remove-from-order routes)

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
        return res.redirect(`/orders?customerId=${customerId}`);
    } catch (err) {
        return res.status(500).send("Error: " + err.message);
    }
});

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

// ... (existing code for server initialization)

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
