const { Router } = require("express")
const { MInvoice, sequelize, MInvoiceItems, MInvoiceExtraItems } = require("../db/model")

const invoiceRouter = new Router()

invoiceRouter.post('/', async (req, res) => {
    res.json(await sequelize.transaction(async transaction => {
        const invoice = await MInvoice.create(req.body, { transaction })
        const items = await MInvoiceItems.bulkCreate(req.body.items.map(item => ({ ...item, invoiceId: invoice.id })), { transaction })
        await MInvoiceExtraItems.bulkCreate(items.reduce((res, item, idx) => [...res, ...req.body.items[idx].extraItems.map(ep => ({ ...ep, invoiceItemId: item.id }))], []), { transaction })

        return MInvoice.findByPk(invoice.id, { transaction, include: ['defaultPrice', 'customer', { association: 'items', include: ['product', { association: 'extraItems', include: ['extraProduct'] }] }] })
    }))
})

module.exports = invoiceRouter