const express = require('express');
const router = express.Router();

const Authors = require('../models/author');

//Get all author route
router.get('/', async (req, res) => {
    let searchOptions = {};
    if(req.query.name != null && req.query.name !== '') {
        searchOptions.name = new RegExp(req.query.name, 'i');
    }
    try {
        const authors = await Authors.find(searchOptions);
        res.render('authors/index', {
            authors: authors,
            searchOptions: req.query
        });
    } catch (error) {
        res.redirect('/');
    }
});

//New author route
router.get('/new', (req, res) => {
    res.render('authors/new', { author: new Authors() });
});

//Create author route
router.post('/', async (req, res) => {
    const author = new Authors({
        name: req.body.name
    });
    try {
        const newAuthor = await author.save();
        // res.redirct(`authors/${newAuthor.id}`);
        res.redirect(`authors`);
    } catch (error) {
        res.render('authors/new', {
            author: author,
            errorMessage: 'Error while creating author'
        })
    }
});

module.exports = router;
