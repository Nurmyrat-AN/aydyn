const Router = require('express')
const { MInvoice } = require('../../db/model')
const { Op, Sequelize } = require('sequelize')

const invoicesReportRoute = new Router()


invoicesReportRoute.get('/', async (req, res) => {
    const { customerName = '', startDate, endDate, defaultPriceId } = req.query

    const where = []
    if (startDate && endDate) {
        where.push(Sequelize.where(Sequelize.literal('invoice.createdAt'), 'BETWEEN', Sequelize.literal(`'${startDate}' AND '${endDate}'`)))
    } else if (startDate) {
        where.push(Sequelize.where(Sequelize.literal('invoice.createdAt'), '>=', Sequelize.literal(`'${startDate}'`)))
    } else if (endDate) {
        where.push(Sequelize.where(Sequelize.literal('invoice.createdAt'), '<=', Sequelize.literal(`'${endDate}'`)))
    }
    if (defaultPriceId) where.push({ defaultPriceId })
    try {
        res.json(await MInvoice.findAll({
            where,
            include: [{
                association: 'customer',
                where: { name: { [Op.like]: `%${customerName || ''}%` } },
            }, 'defaultPrice']
        }))
    } catch (e) {
        console.log(e)
        res.status(500).json(e)
    }
})

invoicesReportRoute.get('/:id', async (req, res) => {
    res.json(await MInvoice.findByPk(req.params.id, {
        include: ['defaultPrice', 'customer',
            {
                association: 'items',
                include: ['product', {
                    association: 'extraItems',
                    include: ['extraProduct']
                }]
            }
        ]
    }))
})

module.exports = invoicesReportRoute