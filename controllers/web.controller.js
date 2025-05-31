const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const bwipjs = require('bwip-js');



// ✅ Static HTML test page

async function index(req, res) {
    const data = await req.userData;
    if (data) {
        if (data.role == "admin") {
            res.sendFile(path.join(__dirname, '../public/admin.html'));
        } else {

            res.sendFile(path.join(__dirname, '../public/news.html'));
        }
    } else {
        res.sendFile(path.join(__dirname, '../public/news.html'));
    }
}

async function auth(req, res) {
    const data = await req.userData;
    if (data) {
        res.sendFile(path.join(__dirname, '../public/news.html'));
    } else {
        res.sendFile(path.join(__dirname, `../public/auth.html`));
    }
}

async function create(req, res) {
    const data = await req.userData;
    if (data) {
        res.sendFile(path.join(__dirname, '../public/create.html'));
    } else {
        res.sendFile(path.join(__dirname, `../public/access.html`));
    }
}

async function news(req, res) {
    res.sendFile(path.join(__dirname, '../public/news.html'));
}
async function article(req, res) {
    res.sendFile(path.join(__dirname, '../public/article.html'));
}

async function article2(req, res) {
    res.sendFile(path.join(__dirname, '../public/article2.html'));
}

async function radio(req, res) {

    res.sendFile(path.join(__dirname, '../public/radio.html'));
}

async function adminRadio(req, res) {
    const data = await req.userData;
    if (data && data.role === "admin") {
        res.sendFile(path.join(__dirname, '../public/admin-radio.html'));
    } else {
        res.sendFile(path.join(__dirname, '../public/radio.html'));
    }
}

async function admin(req, res) {
    const data = await req.userData;
    if (data && data.role === "admin") {
        res.sendFile(path.join(__dirname, '../public/admin.html'));
    } else {
        res.sendFile(path.join(__dirname, '../public/access.html'));
    }
}

async function about(req, res) {

    res.sendFile(path.join(__dirname, '../public/about.html'));
}

async function contact(req, res) {

    res.sendFile(path.join(__dirname, '../public/contact.html'));
}

async function myReviews(req, res) {

    res.sendFile(path.join(__dirname, '../public/my-reviews.html'));
}

async function dashboard(req, res) {
    const data = await req.userData;
    if (data && data.role === "admin") {
        res.sendFile(path.join(__dirname, '../public/dashboard.html'));
    } else {
        res.sendFile(path.join(__dirname, '../public/access.html'));
    }
}

async function reviews(req, res) {
    const data = await req.userData;
    if (data && data.role === "admin") {
        res.sendFile(path.join(__dirname, '../public/reviews.html'));
    } else {
        res.sendFile(path.join(__dirname, '../public/access.html'));
    }
}
async function team(req, res) {
    res.sendFile(path.join(__dirname, '../public/team.html'));
}

async function users(req, res) {
    const data = await req.userData;
    if (data && data.role === "admin") {
        res.sendFile(path.join(__dirname, '../public/users.html'));
    } else {
        res.sendFile(path.join(__dirname, '../public/access.html'));
    }
}

async function videos(req, res) {

    res.sendFile(path.join(__dirname, '../public/videos.html'));
}

async function settings(req, res) {

    res.sendFile(path.join(__dirname, '../public/settings.html'));
}

async function program(req, res) {
    res.sendFile(path.join(__dirname, '../public/program.html'));
}



module.exports = {
    auth,
    create,
    news,
    article,
    article2,
    radio,
    adminRadio,
    admin,
    about,
    contact,
    dashboard,
    reviews,
    myReviews,
    videos,
    team,
    users,
    settings,
    program,
};

