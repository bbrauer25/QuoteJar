var express = require('express');
var mongo = require('mongodb')
var router = express.Router();

/* GET home page. */
//If user is logged in, redirect to viewQuotes page
router.get('/', function(req, res, next) {
	if (req.session && req.session.userId) {
		//redirect to viewQuotes page
		res.redirect('/viewQuotes');
	} else res.render('login', { title: 'Please Login'});
});

router.get('/howTo', function(req, res, next) {
	res.render('howTo');
})

router.get('/viewQuotes', function(req, res, next) {
	if (req.session && req.session.userId) {
		console.log(req.session.userId)
		var db = req.db;
		var quotes = db.get('quoteCollection');
		quotes.find({user_id: req.session.userId}, {}, function(e, users_quotes) {
			res.render('viewQuotes', {quotes: users_quotes})
		});
	} else {
		console.log(req.session.UserId)
		res.redirect('login');
	}
});

router.get('/addQuote', function(req, res, next) {
	if (req.session && req.session.userId) {
		var quoteTags = ["funny", "modern", "sports", "historical", "inspirational", "epic"];
		res.render('addQuote', {quoteTags: quoteTags});
	} else res.redirect('login');
});

router.get('/createUser', function(req, res, next) {
	//res.render('createUser', {title: 'Create a New User'})
	var db = req.db;
	var userCollection = db.get('userCollection');
	userCollection.find({},{}, function(e,docs) {
		console.log(docs)
		res.render('createUser', { 
			"errors": [],
			"userlist": docs
		});
	});
});


router.get('/login', function(req, res, next) {
	res.render('login')
});

//Handle form submissions

router.post('/createUser', function(req, res, next) {
	var db = req.db;
	var users = db.get('userCollection');
	//do some validation here
	req.checkBody("email", "Please make sure your emails match").equals(req.body.confirmEmail);
	req.checkBody("password", "Please make sure your passwords match").equals(req.body.confirmPassword);
	req.checkBody("email", "Please Enter a Valid Email Address").isEmail();
	req.checkBody("confirmEmail", "Please Enter a Valid Confirmation Email Address").isEmail();
	req.checkBody("password", "Please enter a valid password").notEmpty();
	req.checkBody("confirmPassword", "Please enter a valid confirmation password").notEmpty();

	var errors = req.validationErrors();

	if (errors) {
		console.log(errors);
		users.find({},{}, function(e, docs){
			res.render('createUser', {"userlist": docs, "errors": errors})
		});
	} else {
		users.insert({
		email: req.body.email,
		password: req.body.password
		}, function(e, docs) {
			if (e) {
				console.warn(e.message);
			} else {
				res.redirect('login');
			}
		});
	}
});


router.post('/saveEdit', function(req, res, next) {
	//validation stuff here
	req.checkBody("text", "Please enter some quote text").notEmpty();
	req.checkBody("said_by", "Please tell us who said the quote").notEmpty();
	var errors = req.validationErrors();

	var db = req.db;
	var quotes = db.get('quoteCollection');
	var quoteTags = ["funny", "modern", "sports", "historical", "inspirational", "epic"];
	console.log(req.body);
	var tagArray = [];
	if (req.body.tag) {
		for (var i = 0; i < req.body.tag.length; i++) {
			tagArray.push(req.body.tag[i]);
		}
	}
	console.log(tagArray)

	if (errors) {
		console.log(errors);
		quotes.find({"_id": mongo.ObjectID(req.body.quote_id)}, {}, function(e, quote) {
			if (quote.length > 0) {
				console.log(quote[0]);
				res.render('editQuote', {quote: quote[0], quoteTags: quoteTags, errors: errors});
			} else {
				console.log("Quote not found");
			}
		});
	} else {
		quotes.update({"_id": mongo.ObjectID(req.body.quote_id)}, {
			text: req.body.text, 
			said_by: req.body.said_by,
			isFavorite: req.body.isFavorite,
			rating: req.body.rating,
			tags: tagArray,
			user_id: req.session.userId
		}, function(e, docs) {
			if (e) {
				console.warn(e.message);
			} else {
				res.redirect('viewQuotes');
			}
		});
	}
});

router.post('/addQuote', function(req, res, next) {
	//validation stuff here
	req.checkBody("text", "Please enter some quote text").notEmpty();
	req.checkBody("said_by", "Please tell us who said the quote").notEmpty();
	var errors = req.validationErrors();

	var quoteTags = ["funny", "modern", "sports", "historical", "inspirational", "epic"];
	var db = req.db;
	var quotes = db.get('quoteCollection');
	var tagArray = [];
	if (req.body.tag) {
		for (var i = 0; i < req.body.tag.length; i++) {
			tagArray.push(req.body.tag[i]);
		}
	}
	console.log(tagArray);

	if (errors) {
		console.log(errors);
		res.render('addQuote', {"errors": errors, "quoteTags": quoteTags})
	} else {
		quotes.insert({
			text: req.body.text, 
			said_by: req.body.said_by,
			isFavorite: req.body.isFavorite,
			rating: req.body.rating,
			tags: tagArray,
			user_id: req.session.userId
		}, function(e, docs) {
			if (e) {
				console.warn(message);
			} else {
				res.redirect('viewQuotes');
			}
		});
	}
});

//Validate inputs and user credentials
router.post('/login', function(req, res, next) {
	//validate email is proper format
	req.checkBody("email", "Please Enter a Valid Email Address").isEmail();
	req.checkBody("password", "Please enter a valid password").notEmpty();
	var errors = req.validationErrors();
	var db = req.db;
	var userCollection = db.get('userCollection')

	//find user/password pair in database
	userCollection.find({ email: req.body.email, password: req.body.password}, {}, function(e, user) {
		if (errors) {
			console.log(errors);
			res.render('login', {"errors": errors, "prompt": ""});
		} else if (user.length > 0) {
			//set session
			if (req.session) {
				req.session.reset();
			}
			console.log(user[0]["_id"]);
			req.session.userId = user[0]["_id"];
			console.log(user);
			res.redirect('viewQuotes');
		} else {
			console.log("could not find user");
			res.render('login', {"errors": [], prompt: 'User not found or password incorrect'});
		}
	});
});

router.post('/editQuote', function(req, res, next) {
	var quoteTags = ["funny", "modern", "sports", "historical", "inspirational", "epic"];
	var db = req.db;
	var quotes = db.get('quoteCollection')
	quotes.find({"_id": mongo.ObjectID(req.body.quote_id)}, {}, function(e, quote) {
		if (quote.length > 0) {
			console.log(quote[0]);
			res.render('editQuote', {quote: quote[0], quoteTags: quoteTags});
		} else {
			console.log("Quote not found");
		}
	});
});

module.exports = router;
