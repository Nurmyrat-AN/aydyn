const { Router } = require("express")
const { MPrice } = require("../db/model")
const { Op } = require("sequelize")

const priceRoute = new Router()

priceRoute.post('/', async (req, res) => {
    console.log(req.body)
    const model = await MPrice.create(req.body)
    return res.json(model)
})

priceRoute.put('/:id', async (req, res) => {
    await MPrice.update(req.body, { where: { id: req.params.id } })
    res.json(await MPrice.findByPk(req.params.id))
})


priceRoute.delete('/:id', async (req, res) => {
    res.json(await MPrice.destroy({ where: { id: req.params.id } }))
})

priceRoute.get('/', async (req, res) => {
    res.json(await MPrice.findAll({ where: { name: { [Op.like]: `%${req.query.q || ''}%` } } }))
})


priceRoute.get('/:id', async (req, res) => {
    res.json(await MPrice.findByPk(req.params.id))
})

module.exports = priceRoute