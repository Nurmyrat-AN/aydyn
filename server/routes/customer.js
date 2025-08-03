const { Router } = require("express")
const { MCustomer } = require("../db/model")
const { Op } = require("sequelize")

const customerRoute = new Router()

customerRoute.post('/', async (req, res) => {
    console.log(req.body)
    const model = await MCustomer.create(req.body)
    return res.json(model)
})

customerRoute.put('/:id', async (req, res) => {
    await MCustomer.update(req.body, { where: { id: req.params.id } })
    res.json(await MCustomer.findByPk(req.params.id))
})


customerRoute.delete('/:id', async (req, res) => {
    res.json(await MCustomer.destroy({ where: { id: req.params.id } }))
})

customerRoute.get('/', async (req, res) => {
    const q = `%${req.query.q || ''}%`
    res.json(await MCustomer.findAll({
        where: {
            [Op.or]: [
                { name: { [Op.like]: `%${req.query.q || ''}%` } },
                { phoneNumber: { [Op.like]: `%${req.query.q || ''}%` } },
                { address: { [Op.like]: `%${req.query.q || ''}%` } },
            ],
        }
    }))
})


customerRoute.get('/:id', async (req, res) => {
    res.json(await MCustomer.findByPk(req.params.id))
})

module.exports = customerRoute