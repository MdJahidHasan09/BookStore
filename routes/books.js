const express = require('express');
const router = express.Router();

const Book = require('../models/book');
const Author = require('../models/author');

const imageMimeTypes = [ 'image/jpeg', 'image/png' ,'image/gif' ];

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

//Create a book route
router.post('/', async (req, res) => {
    const book = new Book({
        title: req.body.title,
        author: req.body.author,
        publishDate: new Date(req.body.publishDate),
        pageCount: req.body.pageCount,
        description: req.body.description
    });
    saveCover(book, req.body.cover);
    try {
        console.log(book);
        const newBook = await book.save();
        res.redirect(`books/${newBook.id}`);
    } catch (e) {
        await renderNewPage(res, book, true);
    }
});

//Show book by id
router.get('/:id', async (req, res) => {
    try {
        const book = await Book.findById(req.params.id)
            .populate('author')
            .exec()
        res.render('books/show', { book: book });
    } catch (e) {
        res.redirect('/')
    }
});

//Edit Book Route
router.get('/:id/edit', async(req, res) => {
    try{
        const book = await Book.findById(req.params.id);
        renderEditPage(res, book);
    } catch (e) {
        res.redirect('/');
    }
})

//Update a book route
router.put('/:id', async (req, res) => {
    let book;
    try {
        book = await Book.findById(req.params.id);
        book.title = req.body.title;
        book.author = req.body.author;
        book.publishDate = new Date(req.body.publishDate);
        book.pageCount = req.body.pageCount;
        book.description = req.body.description;
        if(req.body.cover != null && req.body.cover !== '') {
            saveCover(book, req.body.cover);
        }
        await book.save();
        res.redirect(`/books/${book.id}`);
    } catch (e) {
        if(book != null) await renderEditPage(res, book, true);
        else res.redirect('/');
    }
});

//Delete Book Page
router.delete('/:id', async(req, res) => {
    let book;
    try{
        book = await Book.findById(req.params.id);
        await book.remove();
        res.redirect('/books');
    } catch (e) {
        console.log(e);
        if(book != null) {
            res.render(`book/show`, {
                book: book,
                errorMessage: 'Could not delete book'
            })
        }
         else {
            res.redirect('/');
        }
    }
})

const renderNewPage = async (res, book, hasError = false) => {
    await renderFormPage(res, book, 'new', hasError);
}

const renderEditPage = async (res, book, hasError = false) => {
    await renderFormPage(res, book, 'edit', hasError);
}

const renderFormPage = async (res, book, form, hasError = false) => {
    try {
        const authors = await Author.find({});
        const params = {
            authors: authors,
            book: book
        };
        if(hasError) {
            if(form === 'edit') params.errorMessage = 'Error while editing book';
            else params.errorMessage = 'Error while creating book';
        }
        res.render(`books/${form}`, params);
    } catch (e) {
        console.log(e);
        res.redirect('/books');
    }
}

const saveCover = (book, coverEncoded) => {
    if(coverEncoded == null) return;
    const cover = JSON.parse(coverEncoded);
    if(cover != null && imageMimeTypes.includes(cover.type)) {
        book.coverImage = new Buffer.from(cover.data, 'base64');
        book.coverImageType = cover.type;
    }
};

module.exports = router;
