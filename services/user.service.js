// services/user.service.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User } = require('../models');
const models = require('../models');
const bcrypt = require('bcrypt-nodejs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv').config();
const config = require('../config/config');
const cookieParser = require('cookie-parser');
const Datastore = require('nedb-promises');
const { where } = require('sequelize');


const userRefreshTokens = Datastore.create('UserRefreshTokens.db')
const userInvalidTokens = Datastore.create('UserInvalidTokens.db')

/*─────────────────────────────────────────────  LIST USERS  ────────────────────────────────────────────*/
/**
 * Paginated, optional search by name or email.
 */
async function list({ page = 1, limit = 20, search } = {}) {
    const where = {};

    if (search) {
        where[Op.or] = [
            { username: { [Op.like]: `%${search}%` } },
            { email: { [Op.like]: `%${search}%` } }
        ];
    }

    const { rows, count } = await User.findAndCountAll({
        where,
        attributes: { exclude: ['password'] },     // never leak password hashes
        limit: +limit,
        offset: (page - 1) * limit,
        order: [['createdAt', 'DESC']]
    });

    return { total: count, page: +page, rows };
}

/*─────────────────────────────────────────────  GETTERS  ───────────────────────────────────────────────*/
const getById = (id) => User.findByPk(id, { attributes: { exclude: ['password'] } });
const getByEmail = (email) => User.findOne({ where: { email } });

/*─────────────────────────────────────────────  AUTH  ─────────────────────────────────────────────────*/
async function register({ req }) {
    const exists = await getByEmail(email);
    if (exists) throw new Error('E_EXISTING_EMAIL');

    bcrypt.hash(req.body.password, bcrypt.genSaltSync(10), null, (err, hash) => {
        console.log(err)
        if (err) {
            return res.status(500).json({
                error: err
            });
        } else {

            models.User.findAll().then(users => {

                let user = {
                    username: req.body.username,
                    email: req.body.email,
                    password: hash,
                    profile_pic: req.image,
                    role: "Admin"
                };

                if (users.length > 0) {
                    user = {
                        username: req.body.username,
                        email: req.body.email,
                        password: hash,
                        profile_pic: req.image,
                        role: "reader"
                    };
                }

                models.User.create(user).then(result => {

                    if (result) {
                        const accessToken = jwt.sign({ userId: result.id }, config.accessTokenSecret, { subject: 'accessApi', expiresIn: config.accessTokenExpiresIn })

                        const refreshToken = jwt.sign({ userId: result.id }, config.refreshTokenSecret, { subject: 'refreshToken', expiresIn: config.refreshTokenExpiresIn })

                        userRefreshTokens.insert({
                            refreshToken,
                            userId: user.id
                        })

                        res.clearCookie('accessToken');
                        res.clearCookie('refreshToken');

                        res.cookie('accessToken', accessToken, { maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true });
                        res.cookie('refreshToken', refreshToken, { maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true });
                        return {
                            message: 'Authentication successful',
                        };
                    } else {
                        return {
                            message: 'Registration Failed!!',
                        };
                    }
                }).catch(error => {
                    console.log(error);
                    res.status(500).json({
                        message: 'Something Went Wrong',
                        error: error
                    });
                });
            }).catch(error => {
                console.error("Error retrieving equipments:", error);
                res.status(500).json({ message: "Error retrieving equipments", error: error.message });
            });
        }
    });
}

async function login({ email, password }) {
    const user = await getByEmail(email);
    if (!user) throw new Error('E_BAD_CREDENTIALS');

    bcrypt.compare(req.body.password, user.password, (err, result) => {
        console.log(err, result);
        if (result) {
            const accessToken = jwt.sign({ userId: user.id }, config.accessTokenSecret, { subject: 'accessApi', expiresIn: config.accessTokenExpiresIn })

            const refreshToken = jwt.sign({ userId: user.id }, config.refreshTokenSecret, { subject: 'refreshToken', expiresIn: config.refreshTokenExpiresIn })

            userRefreshTokens.insert({
                refreshToken,
                userId: user.id
            })
            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');

            res.cookie('accessToken', accessToken, { maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true });
            res.cookie('refreshToken', refreshToken, { maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true });
            return {
                message: 'Authentication successful',
            };
        } else {
            return {
                message: 'E_BAD_CREDENTIALS',
            };
        }
    })
}


/*─────────────────────────────────────────────  UPDATE / DELETE  ───────────────────────────────────────*/
async function update(id, data = {}) {
    // if password provided, hash it
    if (data.password) {
        data.hash = await bcrypt.hash(data.password, 12);
        delete data.password;
    }
    await User.update(data, { where: { id } });
    return getById(id);
}

const remove = (id) => User.destroy({ where: { id } });

/*─────────────────────────────────────────────  EXPORTS  ───────────────────────────────────────────────*/
module.exports = {
    list,
    getById,
    getByEmail,
    register,
    login,
    update,
    remove
};
