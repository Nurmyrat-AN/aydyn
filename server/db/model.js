const { DataTypes } = require("sequelize");
const sequelize = require("./conf");

const MPrice = sequelize.define('price', {
    name: { type: DataTypes.STRING, unique: true }
})

const MCustomer = sequelize.define('customer', {
    name: { type: DataTypes.STRING, unique: true },
    phoneNumber: DataTypes.STRING,
    address: DataTypes.STRING,

})


MCustomer.belongsTo(MPrice, { as: 'defaultPrice' })

const MProduct = sequelize.define('product', {
    name: { type: DataTypes.STRING, unique: true },
    barcode: { type: DataTypes.STRING, unique: true },
    price: DataTypes.DOUBLE,
    measure: DataTypes.STRING,
    countOfSides: DataTypes.INTEGER
})

const MProductPriceConnection = sequelize.define('extraPrice', {
    price: DataTypes.DOUBLE
})

MProduct.belongsToMany(MPrice, { as: 'extraPrices', through: MProductPriceConnection })

const MExtraProduct = sequelize.define('extraProduct', {
    name: { type: DataTypes.STRING, unique: true },
    price: DataTypes.DOUBLE,
    measure: DataTypes.STRING,
    calculationType: DataTypes.STRING
})


const MExtraProductPriceConnection = sequelize.define('extraProductPrice', {
    price: DataTypes.DOUBLE
})

const MExtraProductsConnection = sequelize.define('extraProductsConnection', {})

MExtraProduct.belongsToMany(MPrice, { as: 'extraPrices', through: MExtraProductPriceConnection })

MProduct.belongsToMany(MExtraProduct, { as: 'extraProducts', through: MExtraProductsConnection })
const MInvoice = sequelize.define('invoice', {
    totalAmount: DataTypes.DOUBLE,
})

const MInvoiceItems = sequelize.define('invoiceItems', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    measurements: DataTypes.JSON,
    quantity: DataTypes.DOUBLE,
    calculatedPricePerUnit: DataTypes.DOUBLE,
    totalItemPrice: DataTypes.DOUBLE,
    notes: DataTypes.STRING
})


const MInvoiceExtraItems = sequelize.define('invoiceExtraItems', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    calculatedQuantity: DataTypes.DOUBLE,
    calculatedUnitPrice: DataTypes.DOUBLE,
    calculatedTotalPrice: DataTypes.DOUBLE,
})

MInvoice.hasMany(MInvoiceItems, { as: 'items' })
MInvoiceItems.belongsTo(MProduct, { as: 'product' })
MInvoiceItems.hasMany(MInvoiceExtraItems, { as: 'extraItems' })
MInvoiceExtraItems.belongsTo(MExtraProduct, { as: 'extraProduct' })
// MInvoice.belongsToMany(MProduct, { as: 'items', through: MInvoiceItems })
MInvoice.belongsTo(MCustomer, { as: 'customer' })
MInvoice.belongsTo(MPrice, { as: 'defaultPrice' })

// MInvoiceItems.belongsToMany(MExtraProduct, { as: 'extraProducts', through: MInvoiceExtraItems })


module.exports = {
    MProduct,
    MExtraProduct,
    MExtraProductPriceConnection,
    MProductPriceConnection,
    MPrice,
    MExtraProductsConnection,
    MCustomer,
    MInvoice,
    MInvoiceItems,
    MInvoiceExtraItems,
    sequelize
}