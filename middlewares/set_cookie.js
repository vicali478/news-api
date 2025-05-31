
const cookieParser = require('cookie-parser');
const path = require('path');

function set(req, res, next) {
    
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    
    res.cookie('accessToken', req.accessToken, { maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true });
    res.cookie('refreshToken', req.refreshToken, { maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true });
    return res.status(200).json({
        message: 'Authentication successful',
        accessToken: req.accessToken,
        refreshToken: req.refreshToken
    });
}

function clear(req, res, next) {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return res.status(409).json({
        message: "Logged out successfully"
    });
}

module.exports = {
    set: set,
    clear: clear
}