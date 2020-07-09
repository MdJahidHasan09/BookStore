const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const Book = require('../models/book');
const Author = require('../models/author');

const imageMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
const uploadPath = path.join('public', Book.coverImageBasePath);
const upload = multer({
    dest: uploadPath
    // fileFilter: (req, file, callback) => {
    //     callback(null, imageMimeTypes.includes(file.mimeType));
    // }
});

//Get all books route
router.get('/', async (req, res) => {
    let query = Book.find();
    if(req.query.title != null && req.query.title !== '') {
        query = query.regex('title', new RegExp(req.query.title, 'i'));
    }
    if(req.query.publishedBefore != null && req.query.publishedBefore !== '') {
        query = query.lte('publishDate', req.query.publishedBefore);
    }
    if(req.query.publishedAfter != null && req.query.publishedAfter !== '') {
        query = query.gte('publishDate', req.query.publishedAfter);
    }
    try {
        const books = await query.exec();
        res.render('books/index', {
            books: books,
            searchOptions: req.query
        });
    } catch (e) {
        res.redirect('/');
    }
});

//New book route
router.get('/new', async (req, res) => {
    await renderNewPage(res, new Book());
});

//Create book route
router.post('/', upload.single('cover'), async (req, res) => {
    if(req.cover) console.log(req.cover);
    const fileName = req.file != null ? req.file.filename : null;
    const book = new Book({
        title: req.body.title,
        author: req.body.author,
        publishDate: new Date(req.body.publishDate),
        pageCount: req.body.pageCount,
        coverImageName: fileName,
        description: req.body.description
    });
    try {
        console.log(book);
        const newBook = await book.save();
        // res.redirect(`books/${newBook.id}`);
        res.redirect(`books`)
    } catch (e) {
        if(book.coverImageName != null ) removeBookCover(book.coverImageName);
        await renderNewPage(res, book, true);
    }
});

const removeBookCover = (fileName) => {
    fs.unlink(path.join(uploadPath, fileName), err => {
        console.log(err);
    });
}

const renderNewPage = async (res, book, hasError = false) => {
    try {
        const authors = await Author.find({});
        const params = {
            authors: authors,
            book: book
        };
        if(hasError) params.errorMessage = 'Error while creating book';
        res.render('books/new', params);
    } catch (e) {
        console.log(e);
        res.redirect('/books');
    }
}

module.exports = router;
