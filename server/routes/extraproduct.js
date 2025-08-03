const { Router } = require("express")
const { MExtraProduct, MExtraProductPriceConnection, sequelize } = require("../db/model")
const { Op } = require("sequelize")

const extraProductRoute = new Router()

extraProductRoute.post('/', async (req, res) => {
    const model = await MExtraProduct.create(req.body)
    const extraPrices = await MExtraProductPriceConnection.bulkCreate(req.body.extraPrices.map(e => ({ ...e, extraProductId: model.id })))
    return res.json({ ...model.toJSON, extraPrices })
})

extraProductRoute.put('/:id', async (req, res) => {
    res.json(await sequelize.transaction(async transaction => {
        await MExtraProduct.update(req.body, { where: { id: req.params.id }, transaction })
        await MExtraProductPriceConnection.destroy({ where: { extraProductId: req.params.id }, transaction })
        await MExtraProductPriceConnection.bulkCreate(req.body.extraPrices.map(e => ({ ...e, extraProductId: req.params.id })), { transaction })
        return await MExtraProduct.findByPk(req.params.id, { include: ['extraPrices'], transaction })
    }))
})


extraProductRoute.delete('/:id', async (req, res) => {
    res.json(await sequelize.transaction(async transaction => {
        await MExtraProductPriceConnection.destroy({ where: { extraProductId: req.params.id }, transaction })
        await MExtraProduct.destroy({ where: { id: req.params.id }, transaction })
        return 1;
    }))
})

extraProductRoute.get('/', async (req, res) => {
    res.json(await MExtraProduct.findAll({ where: { name: { [Op.like]: `%${req.query.q || ''}%` } } }))
})


extraProductRoute.get('/:id', async (req, res) => {
    res.json(await MExtraProduct.findByPk(req.params.id, { include: ['extraPrices'] }))

})

module.exports = extraProductRoute