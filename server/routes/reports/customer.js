const Router = require("express");
const { MCustomer, MInvoice } = require("../../db/model");
const { HasMany, Sequelize, Op } = require("sequelize");

const customersReportsRoute = new Router()

customersReportsRoute.get('/', async (req, res) => {
    const { customerName = '', startDate, endDate } = req.query
    let dates = ''
    if (startDate && endDate) {
        dates = `AND createdAt BETWEEN '${startDate}' AND '${endDate}'`
    } else if (startDate) {
        dates = `AND createdAt >= '${startDate}'`
    } else if (endDate) {
        dates = `AND createdAt <= '${endDate}'`
    }
    res.json(await MCustomer.findAll({
        where: { name: { [Op.like]: `%${customerName || ''}%` } },
        include: [
            'defaultPrice'
        ],
        attributes: {
            include: [
                [Sequelize.literal(`(SELECT SUM(totalAmount) FROM invoices WHERE customerId=customer.id ${dates})`), 'totalSales']
            ]
        }
    }))
})


customersReportsRoute.get('/:id', async (req, res) => {
    const { startDate, endDate } = req.query
    let dates = ''
    if (startDate && endDate) {
        dates = ` sales.createdAt BETWEEN '${startDate}' AND '${endDate}'`
    } else if (startDate) {
        dates = ` sales.createdAt >= '${startDate}'`
    } else if (endDate) {
        dates = ` sales.createdAt <= '${endDate}'`
    }
    try {
        res.json(await MCustomer.findByPk(req.params.id, {
            include: [
                'defaultPrice',
                {
                    association: new HasMany(MCustomer, MInvoice, { as: 'sales' }),
                    required: false,
                    where: Sequelize.literal(dates),
                    include: [
                        'defaultPrice',
                    ]
                }
            ]
        }))
    } catch (e) {
        console.log(e)
        res.status(500).json(e)
    }
})

module.exports = customersReportsRoute