const jwt = require('jsonwebtoken');
const config = require('../config/config');
const Datastore = require('nedb-promises');
const path = require('path');
const models = require('../models');
const userRefreshTokens = Datastore.create({ filename: 'UserRefreshTokens.db', autoload: true });
const userInvalidTokens = Datastore.create({ filename: 'UserInvalidTokens.db', autoload: true });

// Helper function to extract token from cookies or headers
function extractToken(req) {
    let token = req.cookies?.accessToken;
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }
    return token;
}

async function handleTokenRefresh(req, res, decodedRefreshToken) {
    const userRefreshToken = await userRefreshTokens.findOne({
        refreshToken: req.cookies?.refreshToken,
        userId: decodedRefreshToken.userId,
    });

    if (!userRefreshToken) return null;

    // Remove old refresh token and issue new tokens
    await userRefreshTokens.remove({ _id: userRefreshToken._id });
    await userRefreshTokens.compactDatafile();

    const newAccessToken = jwt.sign(
        { userId: decodedRefreshToken.userId },
        config.accessTokenSecret,
        { subject: 'accessApi', expiresIn: config.accessTokenExpiresIn }
    );

    const newRefreshToken = jwt.sign(
        { userId: decodedRefreshToken.userId },
        config.refreshTokenSecret,
        { subject: 'refreshToken', expiresIn: config.refreshTokenExpiresIn }
    );

    await userRefreshTokens.insert({
        refreshToken: newRefreshToken,
        userId: decodedRefreshToken.userId,
    });

    res.cookie('accessToken', newAccessToken, {
        httpOnly: true,
        secure: true,
        maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return jwt.verify(newAccessToken, config.accessTokenSecret);
}

async function findUser(req, res, userId) {
    const id = parseInt(userId);
    const result = await models.User.findByPk(id);
    if (result) {
        if(result.email){
            const data = {
                userId: result.id,
                role: result.role,
            };
            
        return data;

        }else{        
            res.clearCookie('refreshToken');
            res.clearCookie('accessToken');
            return null;
        }
    } else{        
        res.clearCookie('refreshToken');
        res.clearCookie('accessToken');
        return null;
    }
}

// Middleware for general user access
async function user(req, res, next) {
    try {
        const token = extractToken(req);

        if (!token) {
            req.userData = null;
            req.message = 'No user found';
            return next();
        }

        const isInvalid = await userInvalidTokens.findOne({ accessToken: token });
        if (isInvalid) {
            req.userData = null;
            req.message = 'Token blacklisted';
            res.clearCookie('accessToken');
            return next();
        }

        try {
            const decoded = jwt.verify(token, config.accessTokenSecret);
            req.accessToken = { value: token, exp: decoded.exp };

            const userData = await findUser(req, res, decoded.userId);
            if(userData){
                req.userData = userData;
                req.message = 'Access granted';

            }else {
                req.userData = null;
                req.message = '';
            }
            return next();
        } catch (err) {
            if (err instanceof jwt.TokenExpiredError) {
                const refreshToken = req.cookies?.refreshToken;
                if (!refreshToken) return res.status(401).json({ message: 'Refresh token missing', code: 'RefreshTokenMissing' });

                const decodedRefreshToken = jwt.verify(refreshToken, config.refreshTokenSecret);
                const newDecoded = await handleTokenRefresh(req, res, decodedRefreshToken);

                if (!newDecoded) {
                    req.userData = null;
                    req.message = 'Refresh token invalid';
                    res.clearCookie('accessToken');
                    return next();
                }

                req.accessToken = { value: req.cookies.accessToken, exp: newDecoded.exp };
             const userData = await findUser(req, res, decoded.userId);
            if(userData){
                req.userData = userData;
                req.message = 'Access Refreshed';

            }else {
                req.userData = null;
                req.message = '';
            }
                return next();
            }
            throw err; // Re-throw any other errors
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal server error', error: err.message });
    }
}

// Middleware for login check and redirect
async function check(req, res, next) {
    try {
        const token = extractToken(req);

        if (!token) return res.sendFile(path.join(__dirname, '../public/auth.html'));

        const isInvalid = await userInvalidTokens.findOne({ accessToken: token });
        if (isInvalid) return res.sendFile(path.join(__dirname, '../public/auth.html'));

        try {
            const decoded = jwt.verify(token, config.accessTokenSecret);
            const userData = await findUser(req, res, decoded.userId);
            req.accessToken = { value: token, exp: decoded.exp };
        if (!userData) return res.sendFile(path.join(__dirname, '../public/auth.html'));
            req.userData = userData;
            return next();
        } catch (err) {
            if (err instanceof jwt.TokenExpiredError) {
                const refreshToken = req.cookies?.refreshToken;
                if (!refreshToken) return res.sendFile(path.join(__dirname, '../public/auth.html'));

                const decodedRefreshToken = jwt.verify(refreshToken, config.refreshTokenSecret);
                const newDecoded = await handleTokenRefresh(req, res, decodedRefreshToken);

                if (!newDecoded) return res.sendFile(path.join(__dirname, '../public/auth.html'));

                req.accessToken = { value: req.cookies.accessToken, exp: newDecoded.exp };
                const userData = await findUser(req, res, newDecoded.userId);
        if (!userData) return res.sendFile(path.join(__dirname, '../public/auth.html'));
            req.userData = userData;
                return next();
            }
            throw err; // Re-throw any other errors
        }
    } catch (err) {
        console.error(err);
        return res.sendFile(path.join(__dirname, '../public/auth.html'));
    }
}

// Middleware for Admin verification
async function admin(req, res, next) {
    try {
        const token = extractToken(req);

        if (!token) return res.sendFile(path.join(__dirname, '../public/auth.html'));

        const isInvalid = await userInvalidTokens.findOne({ accessToken: token });
        if (isInvalid) return res.sendFile(path.join(__dirname, '../public/auth.html'));

        try {
            const decoded = jwt.verify(token, config.accessTokenSecret);
            const userData = await findUser(req, res, decoded.userId);
            if (!userData) return res.sendFile(path.join(__dirname, '../public/auth.html'));
            if (userData.role !== 'admin') {
                return res.sendFile(path.join(__dirname, '../public/access.html'));
            }
            req.userData = userData;
            return next();
        } catch (err) {
            if (err instanceof jwt.TokenExpiredError) {
                const refreshToken = req.cookies?.refreshToken;
                if (!refreshToken) return res.sendFile(path.join(__dirname, '../public/auth.html'));

                const decodedRefreshToken = jwt.verify(refreshToken, config.refreshTokenSecret);
                const newDecoded = await handleTokenRefresh(req, res, decodedRefreshToken);

                if (!newDecoded) {
                    return res.sendFile(path.join(__dirname, '../public/auth.html'));
                }

                const userData = await findUser(req, res, newDecoded.userId);
                if (!userData) return res.sendFile(path.join(__dirname, '../public/auth.html'));
                if (userData.role !== 'admin') {
                    return res.sendFile(path.join(__dirname, '../public/access.html'));
                }

                req.userData = userData;
                return next();
            }
            throw err; // Re-throw any other errors
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal server error', error: err.message });
    }
}
// Middleware for Admin verification
async function writer(req, res, next) {
    try {
        const token = extractToken(req);

        if (!token) return res.sendFile(path.join(__dirname, '../public/auth.html'));

        const isInvalid = await userInvalidTokens.findOne({ accessToken: token });
        if (isInvalid) return res.sendFile(path.join(__dirname, '../public/auth.html'));

        try {
            const decoded = jwt.verify(token, config.accessTokenSecret);
            const userData = await findUser(req, res, decoded.userId);
            if (!userData) return res.sendFile(path.join(__dirname, '../public/auth.html'));
            if (userData.role !== 'writer') {
                return res.sendFile(path.join(__dirname, '../public/access.html'));
            }
            req.userData = userData;
            return next();
        } catch (err) {
            if (err instanceof jwt.TokenExpiredError) {
                const refreshToken = req.cookies?.refreshToken;
                if (!refreshToken) return res.sendFile(path.join(__dirname, '../public/auth.html'));

                const decodedRefreshToken = jwt.verify(refreshToken, config.refreshTokenSecret);
                const newDecoded = await handleTokenRefresh(req, res, decodedRefreshToken);

                if (!newDecoded) {
                    return res.sendFile(path.join(__dirname, '../public/auth.html'));
                }

                const userData = await findUser(req, res, newDecoded.userId);
                if (!userData) return res.sendFile(path.join(__dirname, '../public/auth.html'));
                if (userData.role !== 'writer') {
                    return res.sendFile(path.join(__dirname, '../public/access.html'));
                }

                req.userData = userData;
                return next();
            }
            throw err; // Re-throw any other errors
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal server error', error: err.message });
    }
}

module.exports = {
    isUser: user,
    check,
    writer,
    admin
};
