const Book = require("../models/book");
const Author = require("../models/author");
const Genre = require("../models/genre");
const BookInstance = require("../models/bookinstance");

const asyncHandler = require("express-async-handler");
const {body, validationResult} = require("express-validator");
const book = require("../models/book");

exports.index = asyncHandler(async (req, res, next) => {
  //to get details of books:
  const [
    numBooks,
    numBookInstances, 
    numAvailableBookInstances,
    numAuthors,
    numGenres,
  ] = await Promise.all([
    Book.countDocuments({}).exec(),
    BookInstance.countDocuments({}).exec(),
    BookInstance.countDocuments({status: "Available"}).exec(),
    Author.countDocuments({}).exec(),
    Genre.countDocuments({}).exec(),
  ]);
  res.render('index',{
    title: "Local library Home",
    book_count: numBooks,
    book_instance_count: numBookInstances,
    book_instance_available_count: numAvailableBookInstances,
    author_count: numAuthors,
    genre_count: numGenres,
  });
});



// Display list of all books.
exports.book_list = asyncHandler(async (req, res, next) => {
  const allBooks = await Book.find({}, "title author")
    .sort({title:1})
    .populate("author")
    .exec();
  res.render("book_list", {title: "Book List", book_list: allBooks});
});

// Display detail page for a specific book.
exports.book_detail = asyncHandler(async (req, res, next) => {
  const [book, bookInstances] = await Promise.all([
    Book.findById(req.params.id).populate("author").populate("genre").exec(),
    BookInstance.find({book: req.params.id}).exec(),
  ]);
  if (book=== null){
    const err = new Error ("Book not found");
    err.status = 404;
    return next (err);
  }

  res.render ("book_detail", {
    title: book.title,
    book: book, 
    book_instances: bookInstances,
  });
});

// Display book create form on GET.
exports.book_create_get = asyncHandler(async (req, res, next) => {
  const [allAuthors, allGenres] = await Promise.all([
    Author.find().exec(),
    Genre.find().exec()
  ]);
  res.render("book_form", {
    title: "Create Book",
    authors: allAuthors,
    genres: allGenres
  });
});

// Handle book create on POST.
exports.book_create_post = [
  //convert genre to array
    (req, res, next) =>{
      if (!(req.body.genre instanceof Array)) {
        if (typeof req.body.genre === "undefined") req.body.genre = [];
        else req.body.genre = new Array(req.body.genre);
      }
      next();
    },
  //validate and sanitize fields
  body("title","Title must not be empty").trim().isLength({min:1}).escape(),
  body("author","Author must not be empty").trim().isLength({min:1}).escape(),
  body("summary","Summary must not be empty").trim().isLength({min:1}).escape(),
  body("isbn","ISBN must not be empty").trim().isLength({min:1}).escape(),
  body("genre.*").escape(),

  //process request after validation and sanitazation
  asyncHandler(async(req, res, next)=>{
    const errors = validationResult(req);

    const book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: req.body.genre,
    });

    if (!errors.isEmpty()) {
        // There are errors. Render form again with sanitized values/error messages.

      // Get all authors and genres for form.
      const [allAuthors, allGenres] = await Promise.all([Author.find().exec(), Genre.find().exec()]);

      //Mark  our selected Genre as checked 
      for(const genre of allGenres) {
        if (book.genre.indexOf(genre._id)>-1){ genre.checked ="true"}
      }
      res.render("book_form",{
        title: "Create Book",
        authors: allAuthors,
        genres: allGenres,
        book: book,
        errors: errors.array(),
      });
    } else {
      await book.save();
      res.redirect(`./${book._id}`)
    };
  })
];

// Display book delete form on GET.
exports.book_delete_get = asyncHandler(async (req, res, next) => {
  const [book, allBookInstances] = await Promise.all([
    Book.findById(req.params.id).populate("author").populate("genre").exec(),
    BookInstance.find({book: req.params.id}).exec()
  ])
  if(book === null){res.redirect("/catolog/books")};
  res.render("book_delete", {
    title: "Delete the book",
    book: book,
    book_instances: allBookInstances,
  });
});
// Handle book delete on POST.for
exports.book_delete_post = asyncHandler(async (req, res, next) => {
  const [book, allBookInstances] = await Promise.all([
    Book.findById(req.params.id).exec(),
    BookInstance.find({book: req.params.id},"status").exec()
  ]);
  if(allBookInstances.length>0){
    res.render("book_delete", {
      title: "Delete the book",
      book: book, 
      book_instances: allBookInstances
    })
    return
  } else {
    await Book.findByIdAndRemove(req.body.bookid);
    res.redirect("/catalog/books")
  }
});

// Display book update form on GET.
exports.book_update_get = asyncHandler(async (req, res, next) => {
  const [book, allAuthors, allGenres] = await Promise.all([
    Book.findById(req.params.id).populate("author").populate("genre").exec(),
    Author.find().exec(),
    Genre.find().exec(),
  ]);
  if (book === null){
    const err = new Error ("Books not found");
    err.status = 404;
    return next(err);
  }
  //Mark selected genres as checked:
  for (const genre of allGenres){
    for (const book_g of book.genre){
      if (genre._id.toString() === book_g._id.toString()){
        genre.checked = "true";
      }
    }
  }
  
  res.render("book_form",{
    title: "Update form",
    authors: allAuthors,
    genres: allGenres,
    book: book
  });
});

// Handle book update on POST.
exports.book_update_post = [
(req, res, next) =>{
  if (!(req.body.genre instanceof Array)){
    if (typeof req.body.genre === "undefined"){
      req.body.genre = [];
    } else {
      req.body.genre = new Array(req.body.genre)
    }
  } 
  next();
},
body("title", "Title must not be empty").trim().isLength({min: 1}).escape(),
body("author","Author must not be empty").trim().isLength({min:1}).escape(),
body("summary","Summary must not be empty").trim().isLength({min:1}).escape(),
body("isbn","ISBN must not be empty").trim().isLength({min:1}).escape(),
body("genre.*").escape(),

asyncHandler(async (req, res, next)=>{
  const errors = validationResult(req);

  const book = new Book({
    title: req.body.title,
    author: req.body.author,
    summary: req.body.summary,
    isbn: req.body.isbn,
    genre: typeof req.body.genre === "undefined" ? [] : req.body.genre,
    _id: req.params.id
  });

  if(!errors.isEmpty()){
    const [allAuthors, allGenres] = await Promise.all([
      Author.find().exec(),
      Genre.find().exec(),
    ]);
    
    for(const genre of allGenres){
      if(book.genre.indexOf(genre._id) >-1 ){
        genre.checked = "true"
      }
    }
    res.render("book_form", {
      title: "Update book",
      authors: allAuthors,
      genres: allGenres,
      book: book,
      errors: errors.array(),
    });
    return;
  } else {
    const thebook = await Book.findByIdAndUpdate(req.params.id, book,{});
    res.redirect("./")
  }
}),
];
