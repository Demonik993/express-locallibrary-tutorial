const BookInstance = require("../models/bookinstance");
const asyncHandler = require("express-async-handler");
const Book = require("../models/book");

const {book, validationResult, body} = require("express-validator");

// Display list of all BookInstances.
exports.bookinstance_list = asyncHandler(async (req, res, next) => {
  const allBookInstances = await BookInstance.find().populate("book").exec();
  res.render("bookinstance_list", {title: "Book Instance List", bookinstance_list: allBookInstances,})
});

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = asyncHandler(async (req, res, next) => {
  const bookInstance = await BookInstance.findById(req.params.id).populate("book").exec();
  if (bookInstance === null){ const err = new Error("Book copy not found"); err.status = 404; return next (err)};
  res.render("bookinstance_detail", {
    title:"Book:", 
    bookinstance: bookInstance,
  });
});

// Display BookInstance create form on GET.
exports.bookinstance_create_get = asyncHandler(async (req, res, next) => {
  const allBooks = await Book.find().exec();

  res.render("bookinstance_form", {
    title: "Create book instance",
    book_list: allBooks
  })
});

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
  body("book", "Book must be specified").trim().isLength({min:1}).escape(),
  body("imprint", "Imprint must be specified").trim().isLength({min:1}).escape(),
  body("status").escape(),
  body("due_back", "Invalid date").optional({values: "falsy"}).isISO8601().toDate(),

  asyncHandler(async(req, res, next)=>{
    const errors = validationResult(req);
    const bookInstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_date
    });
  if(!errors.isEmpty()){
    const allBooks = await Book.find({}, "title").exec();

    res.render("bookinstance_form", {
      title: "Create book instance!",
      book_list: allBooks,
      selected_book: bookInstance.book._id,
      errors: errors.array(),
      bookinstance: bookInstance,
    });
    return;
  } else {
    await bookInstance.save();
    res.redirect(`./${bookInstance._id}`)
  }

  })
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = asyncHandler(async (req, res, next) => {
  const bookInstance = await BookInstance.findById(req.params.id).exec();
  if(bookInstance === null){res.redirect("/catalog/bookinstances")}
  res.render("bookinstance_delete",{
    title: "Delete the book copy of",
    bookinstance: bookInstance,
  })
});

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = asyncHandler(async (req, res, next) => {
  await BookInstance.findByIdAndRemove(req.body.bookinstanceid); 
  res.redirect(`/catalog/bookinstances`)
});

// Display BookInstance update form on GET.
exports.bookinstance_update_get = asyncHandler(async (req, res, next) => {
  const [bookinstance, allBooks] = await Promise.all([BookInstance.findById(req.params.id).exec(), Book.find().exec()]);

  res.render("bookinstance_form",{
    title: "Update the copy",
    book_list: allBooks,
    selected_book: bookinstance.book._id,
    bookinstance: bookinstance,    
  })
});

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
  body("book", "Book must be specified").trim().isLength({min:1}).escape(),
  body("imprint", "Imprint must be specified").trim().isLength({min:1}).escape(),
  body("status").escape(),
  body("due_back", "invalid date").optional({values:"falsy"}).isISO8601().toDate(),

  asyncHandler(async(req, res,next)=>{
    const errors = validationResult(req);
    const bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_date,
      _id: req.params.id
    });
    if(!errors.isEmpty()){
      const allBooks = await Book.find().exec();

      res.render("bookinstance_form",{
        title: "Update this fucking copy",
        book_list: allBooks,
        selected_book: bookinstance.book._id,
        errors: errors.array(),
        bookinstance: bookinstance,
      });
      return;
    } else {
      const updateBookInstance = await BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {});
      res.redirect("./")
    }
  })
]
