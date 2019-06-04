var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var exphbs  = require('express-handlebars');

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");
var app = express();
app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";
mongoose.connect(MONGODB_URI);
// Require all models
var db = require("./models");

var PORT = 3007;

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
//app.use(express.static("public"));

// Connect to the Mongo DB
mongoose.connect("mongodb://localhost/newsScraper", { useNewUrlParser: true });

// // Routes
// //app.destroy
// //mongoose.dropdatabase("")
// // A GET route for scraping the echoJS website
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with axios
  axios.get("https://www.nytimes.com/section/sports").then(function(response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);

    // Now, we grab every h2 within an article tag, and do the following:
    $("ol h2").each(function(i, element) {
      // Save an empty result object
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this)
        .children("a")
        .text();
      result.link = $(this)
        .children("a")
        .attr("href");

      // Create a new Article using the `result` object built from scraping
      db.Article.create(result)
        .then(function(dbArticle) {
          // View the added result in the console
          console.log(dbArticle);
        })
        .catch(function(err) {
          // If an error occurred, log it
          console.log(err);
        });
    });

    // Send a message to the client
    res.redirect("/");
  });
});


// renders the homepage with the articles that exist in the database
app.get('/', function(req, res){
	db.Article.find({}, function(error, found){
		res.render('home', {
			article: found
		});
	})
})

// // FIX to rendersaved articles on page
// app.get('/saved', function(req, res){
// 	db.Article.find({saved: true}, function(error, found){
// 		res.render('articles', {
//       article: found,
      
// 		});
// 	})
// })


// Route for getting all Articles from the db for saved
app.get("/saved", function (req, res) {
    // TODO: Finish the route so it grabs all of the articles
    // This will send only the true saved articles.
    db.Article.find({saved: true})
        .then(function (dbArticle) {
            
            // res.json(dbArticle);
            console.log(dbArticle);
            res.render('articles', { article: dbArticle });
        })
        .catch(function (err) {
            // If an error occurs, send the error back to the client
            res.json(err);
        });
});
//trying to get saved articles, put them in /saved
app.get("/articles/:id", function (req, res) {
  db.Article.findOne({ _id: req.params.id }) 
    .populate("note")
    .then(function(dbArticle) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
  // Grab every document in the Articles collection
  db.Article.find({})
    .then(function(dbArticle) {
      // If we were able to successfully find Articles, send them back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});



// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
  console.log("hihihkokokok")
  // Create a new note and pass the req.body to the entry
  db.Note.create(req.body)
    .then(function(dbNote) {
      // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function(dbArticle) {
      // If we were able to successfully update an Article, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for getting all notes back to notes in 'articles'should be good.
app.get("/saved", function (req, res) {
  // TODO: Finish the route so it grabs all of the articles
  // This will send only the true saved articles.
       db.Note.find({body: comment})
      //.populate("note")
      .then(function (dbNote) {
          
          // res.json(dbArticle);
          console.log(dbNote);
          res.render('articles', { saved: dbNote });
      })
      .catch(function (err) {
          // If an error occurs, send the error back to the client
          res.json(err);
      });
});

app.put("/articles/:id", function (req, res) {
  console.log("140", req.params.id)
  
  db.Article.updateOne({ _id: req.params.id }, { $set: { saved: true } }, function (err, res) {
    if (err) {
          console.log("Error updating document " + req.params.id);
      } else {
          console.log("Document " + req.params.id + " saved flag updated!");
      }
  })
});


// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
