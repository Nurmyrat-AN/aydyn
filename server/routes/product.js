const { Router } = require("express")
const { MProduct, MProductPriceConnection, sequelize } = require("../db/model")
const { Op } = require("sequelize")

const productRoute = new Router()

productRoute.post('/', async (req, res) => {
    return res.json(await sequelize.transaction(async transaction => {
        const model = await MProduct.create(req.body, { transaction })
        await MProductPriceConnection.bulkCreate(req.body.extraPrices.map(e => ({ ...e, productId: model.id })), { transaction })
        await Promise.all(req.body.extraProducts.map(e => model.addExtraProducts(e.extraProductId, { transaction })))
        return { ...model.toJSON, extraPrices: req.body.extraPrices, extraProducts: req.body.extraProducts }
    }))
})

productRoute.put('/:id', async (req, res) => {
    res.json(await sequelize.transaction(async transaction => {
        await MProduct.update(req.body, { where: { id: req.params.id }, transaction })
        const model = await MProduct.findByPk(req.params.id, { transaction })
        await model.setExtraPrices([], { transaction })
        await model.setExtraProducts([], { transaction })
        await MProductPriceConnection.bulkCreate(req.body.extraPrices.map(e => ({ ...e, productId: req.params.id })), { transaction })
        await Promise.all(req.body.extraProducts.map(e => model.addExtraProducts(e.extraProductId, { transaction })))
        return { ...model.toJSON, extraPrices: req.body.extraProducts, extraProducts: req.body.extraProducts }
    }))
})


productRoute.delete('/:id', async (req, res) => {
    res.json(await sequelize.transaction(async transaction => {
        const model = await MProduct.findByPk(req.params.id, { transaction })
        await model.setExtraPrices([], { transaction })
        await model.setExtraProducts([], { transaction })
        return await model.destroy()
    }))
})

productRoute.get('/', async (req, res) => {
    res.json(await MProduct.findAll({ where: { [Op.or]: [{ name: { [Op.like]: `%${req.query.q || ''}%` } }, { barcode: req.query.q || 'nothing' }] }, include: ['extraPrices', { association: 'extraProducts', include: ['extraPrices'] }] }))
})


productRoute.get('/:id', async (req, res) => {
    res.json(await MProduct.findByPk(req.params.id, { include: ['extraPrices', { association: 'extraProducts', include: ['extraPrices'] }] }))
})

module.exports = productRoute