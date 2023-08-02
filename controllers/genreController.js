const Genre = require("../models/genre");
const Book = require("../models/book");
const { body, validationResult } = require("express-validator");
const asyncHandler = require("express-async-handler");
//const { escape } = require("core-js/fn/regexp");

// Display list of all Genre.
exports.genre_list = asyncHandler(async (req, res) => {
  const allGenres = await Genre.find({}).sort({name:1}).exec();
  res.render("genre_list", {title: "Genre List", list_genres: allGenres,});
});

// Display detail page for a specific Genre.
exports.genre_detail = asyncHandler(async (req, res, next) => {
  // Get details of genre and all associated books (in parallel)
  const [genre, booksInGenre] = await Promise.all([
    Genre.findById(req.params.id).exec(),
    Book.find({ genre: req.params.id }, "title summary").exec(),
  ]);
  if (genre === null) {
    // No results.
    const err = new Error("Genre not found");
    err.status = 404;
    return next(err);
  }

  res.render("genre_detail", {
    title: "Genre Detail",
    genre: genre,
    genre_books: booksInGenre,
  });
});


// Display Genre create form on GET.
exports.genre_create_get = (req, res) => {
  res.render("genre_form", {title: "Create Genre"});
};

// Handle Genre create on POST.
exports.genre_create_post = [
  //FORM VALIDATION:
  body("name")
    .trim()
    .isLength({min:3})
    .escape()
    .withMessage("Genre name must contain at least 3 characters")
    .isAlphanumeric()
    .withMessage("Genre name has no alpa-numeric characters!"),

    //after validation and sanitization 
    asyncHandler(async (req, res) => {
    //validation errors:
    const errors = validationResult(req);
    // create new genre (usin Schema)
    const genre = new Genre({name: req.body.name});
    if (!errors.isEmpty()){
      // There are errors. Render the form again with sanitized values/error messages.
      res.render("genre_form", {
        title: "Create Genre",
        genre,
        errors: errors.array(),
      });
      return;
    } else {
    // Data form is valid
    // does the name arleady exists:
      const genreExists = await Genre.findOne({name: req.body.name}).exec();
      if (genreExists) {
       // const alert = alert(`${genreExists.name} already exists!`);
        res.redirect(`../${genreExists._id}`)
      } else {
        await genre.save(); 
        //genre saved and redirect to new genre page
        res.redirect(`./${genre._id}`);
      }
    }
    })
];

// Display Genre delete form on GET.
exports.genre_delete_get = asyncHandler(async (req, res) => {
  const [genre, allGenreBooks] = await Promise.all([Genre.findById(req.params.id).exec(),Book.find({genre: req.params.id}).exec()]);
  if(genre===null){res.redirect("/catalog/genres")}
  res.render("genre_delete",{
    title: "Delete the genre",
    genre: genre,
    genre_books: allGenreBooks
  })
});

// Handle Genre delete on POST.
exports.genre_delete_post = asyncHandler(async (req, res) => {
  const [genre, allGenreBooks] = await Promise.all([Genre.findById(req.params.id).exec(), Book.find({genre: req.params.id}).exec()]);
  if(allGenreBooks.length>0){
    res.render("genre_delete",{
      title: "Delete the genre:",
      genre: genre,
      genre_books: allGenreBooks
    })
  } else {
    await Genre.findByIdAndRemove(req.params.id);
    res.redirect("/catalog/genres")
  };
});
// Display Genre update form on GET.
exports.genre_update_get = asyncHandler(async (req, res) => {
  const genre = await Genre.findById(req.params.id).exec();
  if(genre=== null){res.redirect("/catalog/genres")}
  res.render("genre_form",{
    title: "Update genre",
    genre: genre
  })
});

// Handle Genre update on POST.
exports.genre_update_post = [
  body("name").trim().isLength({min:3}).escape().withMessage("Genre must contain at least 3 characters").isAlphanumeric().withMessage("Genre name has no alpa-numeric characters"),
  asyncHandler(async(req, res, next)=>{
    const errors = validationResult(req);
    const genre = new Genre({
      name: req.body.name,
      _id: req.params.id
    })
    if(!errors.isEmpty()){res.render("genre_form",{
      title:"Update genre",
      genre: genre,
      errors: errors.array()
    })
    return;
    } else {
      const genreExists = await Genre.findOne({name: req.body.name}).exec();
      if (genreExists){
        res.redirect(`../${genreExists.id}`)
      } else {
        const newGenre = await Genre.findByIdAndUpdate(req.params.id, genre, {});
        res.redirect("./")
      }
    }
  })
];
