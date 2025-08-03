const { sequelize, MInvoiceItems, MInvoice, MInvoiceExtraItems, MPrice, MExtraProduct, MExtraProductPriceConnection, MProduct, MProductPriceConnection, MExtraProductsConnection, MCustomer } = require("./db/model")
const express = require('express');
const cors = require('cors'); // Import cors middleware
const routes = require("./routes");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000; // Use port 5000 for backend

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON request bodies
app.use('/api', routes);


/* --------------SERVE CLIENT------------------- */
app.use(express.static(path.resolve(__dirname, 'dist')));
app.get(/(.*)/, (req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
});
/* --------------SERVE CLIENT------------------- */

const initDb = async () => {
    await sequelize.sync({ force: true })
    await MPrice.bulkCreate([{ id: 1, name: 'Diller' }, { id: 2, name: 'Adaty' }])
    await MExtraProduct.bulkCreate([
        { id: 1, name: 'Secek (Base: 10, Diller: 15, Adaty: 20)', measure: 'm', calculationType: 'a', price: 10 },
        { id: 2, name: 'Selpe (Base: 16, Diller: 30)', measure: 'm', calculationType: 'a', price: 16 },
    ])
    await MExtraProductPriceConnection.bulkCreate([
        { extraProductId: 1, priceId: 1, price: 15 },
        { extraProductId: 1, priceId: 2, price: 20 },
        { extraProductId: 2, priceId: 1, price: 30 },
    ])

    await MProduct.bulkCreate([
        { id: 1, name: 'H-1 (Base: 50, Diller: 40)', barcode: 1, price: 50, measure: 'm', countOfSides: 1 },
        { id: 2, name: 'H-2 (Base: 60, Adaty: 70)', barcode: 2, price: 60, measure: 'mkw', countOfSides: 2 },
        { id: 3, name: 'H-3 (Base: 80, DIller: 90, Adaty: 100)', barcode: 3, price: 80, measure: 'mkb', countOfSides: 3 },
    ])
    await MProductPriceConnection.bulkCreate([
        { productId: 1, priceId: 1, price: 40 },
        { productId: 2, priceId: 2, price: 70 },
        { productId: 3, priceId: 1, price: 90 },
        { productId: 3, priceId: 2, price: 100 },
    ])
    await MExtraProductsConnection.bulkCreate([
        { productId: 2, extraProductId: 1 },
        { productId: 3, extraProductId: 2 },
    ])
    await MCustomer.bulkCreate([
        { id: 1, name: 'Maksat (Diller)', phoneNumber: '+99363038652', address: 'Mary', defaultPriceId: 1 },
        { id: 2, name: 'Aman (Adaty)', phoneNumber: '+99363038652', address: 'Mary', defaultPriceId: 2 },
        { id: 3, name: 'Serdar', phoneNumber: '+99363038652', address: 'Mary' },
    ])
}

const startServer = async () => {
    await sequelize.authenticate()
    await sequelize.sync({})
    // await initDb()


    app.listen(PORT, () => {
        console.log(`Backend server running on http://localhost:${PORT}`);
    });
}

startServer()