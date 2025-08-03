const Router = require("express");
const { MProduct, MInvoiceItems, MInvoiceExtraItems, MExtraProduct } = require("../../db/model");
const { Sequelize, Op, HasMany } = require("sequelize");

const extraProductReportRoute = new Router()
extraProductReportRoute.get('/', async (req, res) => {
    const { name = '', startDate, endDate } = req.query
    let dates = ''
    if (startDate && endDate) {
        dates = `AND createdAt BETWEEN '${startDate}' AND '${endDate}'`
    } else if (startDate) {
        dates = `AND createdAt >= '${startDate}'`
    } else if (endDate) {
        dates = `AND createdAt <= '${endDate}'`
    }

    res.json(await MExtraProduct.findAll({
        where: { name: { [Op.like]: `%${name || ''}%` } },
        attributes: {
            include: [
                [Sequelize.literal(`(SELECT coalesce(SUM(calculatedQuantity), 0) FROM invoiceExtraItems WHERE extraProductId=extraProduct.id ${dates})`), 'totalQuantity'],
                [Sequelize.literal(`(SELECT coalesce(SUM(calculatedTotalPrice), 0) FROM invoiceExtraItems WHERE extraProductId=extraProduct.id ${dates})`), 'totalPrice'],
            ]
        }
    }))
})

extraProductReportRoute.get('/:id', async (req, res) => {
    const { startDate, endDate } = req.query
    let dates = ''
    if (startDate && endDate) {
        dates = ` sales.createdAt BETWEEN '${startDate}' AND '${endDate}'`
    } else if (startDate) {
        dates = ` sales.createdAt >= '${startDate}'`
    } else if (endDate) {
        dates = ` sales.createdAt <= '${endDate}'`
    }
    res.json(await MExtraProduct.findByPk(req.params.id, {
        include: [
            {
                association: new HasMany(MExtraProduct, MInvoiceExtraItems, {
                    as: 'sales',
                }),
                attributes: {
                    include: [[Sequelize.literal('(SELECT invoiceId FROM invoiceItems WHERE invoiceItems.id=sales.invoiceItemId)'), 'invoiceId']]
                },
                where: Sequelize.literal(dates),
                required: false,
            }
        ]
    }))
})

module.exports = extraProductReportRoute