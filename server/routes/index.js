const { Router } = require("express");
const priceRoute = require("./price");
const customerRoute = require("./customer");
const extraProductRoute = require("./extraproduct");
const productRoute = require("./product");
const invoiceRouter = require("./invoice");
const reportsRoute = require("./reports");

const routes = new Router()

routes.use('/prices', priceRoute)
routes.use('/customers', customerRoute)
routes.use('/extraproducts', extraProductRoute)
routes.use('/products', productRoute)
routes.use('/invoices', invoiceRouter)
routes.use('/reports', reportsRoute)

module.exports = routes