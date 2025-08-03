const Router = require("express");
const productReportRoute = require("./product");
const customersReportsRoute = require("./customer");
const extraProductReportRoute = require("./extraProducts");
const invoicesReportRoute = require("./invoices");

const reportsRoute = new Router()
reportsRoute.use('/products', productReportRoute)
reportsRoute.use('/extraproducts', extraProductReportRoute)
reportsRoute.use('/customers', customersReportsRoute)
reportsRoute.use('/invoices', invoicesReportRoute)

module.exports = reportsRoute