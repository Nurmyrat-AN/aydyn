const Router = require("express");
const { MProduct, MInvoiceItems, MInvoiceExtraItems } = require("../../db/model");
const { Sequelize, Op, HasMany } = require("sequelize");

const productReportRoute = new Router()
productReportRoute.get('/', async (req, res) => {
    const { productName = '', startDate, endDate } = req.query
    let dates = ''
    if (startDate && endDate) {
        dates = `AND createdAt BETWEEN '${startDate}' AND '${endDate}'`
    } else if (startDate) {
        dates = `AND createdAt >= '${startDate}'`
    } else if (endDate) {
        dates = `AND createdAt <= '${endDate}'`
    }

    res.json(await MProduct.findAll({
        where: { name: { [Op.like]: `%${productName || ''}%` } },
        attributes: {
            include: [
                [Sequelize.literal(`(SELECT coalesce(SUM(quantity), 0) FROM invoiceItems WHERE productId=product.id ${dates})`), 'quantity'],
                [Sequelize.literal(`(SELECT coalesce(SUM(quantity*calculatedPricePerUnit), 0) FROM invoiceItems WHERE productId=product.id ${dates})`), 'totalByUnit'],
                [Sequelize.literal(`(SELECT coalesce(SUM(totalItemPrice), 0) FROM invoiceItems WHERE productId=product.id ${dates})`), 'totalWithExtraProducts'],
            ]
        },
        include: [
            {
                association: 'extraProducts',
                attributes: {
                    include: [
                        [Sequelize.literal(`(SELECT coalesce(SUM(calculatedQuantity),0) FROM invoiceExtraItems WHERE extraProductId=extraProducts.id ${dates})`), 'quantity'],
                        [Sequelize.literal(`(SELECT coalesce(SUM(calculatedTotalPrice),0) FROM invoiceExtraItems WHERE extraProductId=extraProducts.id ${dates})`), 'total'],
                    ]
                }
            }
        ]
    }))
})

productReportRoute.get('/:id', async (req, res) => {
    const { startDate, endDate } = req.query
    let dates = ''
    if (startDate && endDate) {
        dates = ` sales.createdAt BETWEEN '${startDate}' AND '${endDate}'`
    } else if (startDate) {
        dates = ` sales.createdAt >= '${startDate}'`
    } else if (endDate) {
        dates = ` sales.createdAt <= '${endDate}'`
    }
    res.json(await MProduct.findByPk(req.params.id, {
        include: [
            {
                association: new HasMany(MProduct, MInvoiceItems, {
                    as: 'sales',
                }),
                where: Sequelize.literal(dates),
                required: false,
                include: [
                    {
                        association: 'extraItems',
                        include: ['extraProduct'],
                        required: false,
                    }
                ]

            }
        ]
    }))
})

module.exports = productReportRoute