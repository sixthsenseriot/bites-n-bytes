const express = require('express');
const app = express();
const port = 2000;
const path = require("path");
const { Pool } = require('pg');

const creds = require('./creds.json');
const pool = new Pool(creds);

app.set('view engine', 'ejs');

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
                        <h3 class="d-flex justify-content-center">Orders from Customer ID: ${customer.customer_id}</h3>
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
                            <h5 class="d-flex justify-content-center">Customer Orders</h5>
                            <div class="d-flex justify-content-center">
                            <div>
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

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
