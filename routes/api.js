var express = require('express');
var mongo = require('mongodb')
var router = express.Router();
var monk = require('monk');
var myDb = monk('localhost:27017/QuoteJar');
var async = require('async');

router.get('/tags', function(req, res, next) {
	var db = req.db;
	var tags = db.get('tag');
	tags.find({}, {}, function(e, tags_json) {
		res.json(tags_json);
	});
});

router.post('/userID', function(req, res, next) {
	//validate stuff posted in body
	console.log(req.body)
	req.checkBody("email", "Please Enter a Valid Email Address").isEmail();
	req.checkBody("password", "Please enter a valid password").notEmpty();
	var errors = req.validationErrors();

	var db = req.db;
	var users = db.get('userCollection');
	users.find({email: req.body.email, password: req.body.password}, {}, function(e, user) {
		if (errors) {
			//bad email and/or password sent in
			res.status(400);
			res.send(errors);
		} else if (user.length > 0) {
			//return json of user info
			res.json(user);
		} else {
			//user doesn't exist
			res.send('[]');
		}
	});
});

router.get('/quotes', function(req, res, next) {
	var db = req.db;
	var quotes = db.get('quoteCollection');
	quotes.find({}, {}, function(e, quotes_json) {
		res.json(quotes_json);
	});
});

router.post('/quotes/query', function(req, res, next) {
	var db = req.db;
	var quotes = db.get('quoteCollection');

	var myQuery = {};
	console.log(req.body);

	//cleanse any bad keys from input
	if (req.body._id) myQuery._id = mongo.ObjectID(req.body._id);
	if (req.body.text) myQuery.text = req.body.text;
	if (req.body.said_by) myQuery.said_by = req.body.said_by;
	if (req.body.isFavorite) myQuery.isFavorite = req.body.isFavorite;
	if (req.body.rating) myQuery.rating = req.body.rating;
	if (req.body.tags) myQuery.tags = req.body.tags;
	if (req.body.user_id) myQuery.user_id = req.body.user_id;

	console.log(myQuery);

	quotes.find(myQuery, {}, function(e, quotes_json) {
		console.log(quotes_json)
		res.json(quotes_json);
	});
});

//delete quote
router.delete('/quotes', function(req, res) {
	var db = req.db;
	var quotes = db.get('quoteCollection');
	quotes.remove({_id: req.body._id}, {}, function(e, result) {
		if (e) {
			res.status(400);
			res.send("Quote id could not be deleted");
		} else {
			res.json(result);
		}
	});
});

//edit quote
router.put('/quotes', function(req, res, next) {
	var db = req.db;
	var quotes = db.get('quoteCollection');
	var tags = db.get('tag');
	var users = db.get('userCollection');

	//validate input
	req.checkBody("text", "Please enter some quote text").notEmpty();
	req.checkBody("said_by", "Please tell us who said the quote").notEmpty();
	req.checkBody("isFavorite", "Please make sure isFavorite is a boolean value").isBoolean();
	req.checkBody("rating", "Please make sure rating is valid value between 1 and 9").isInt({"max": 9, "min": 1});
	req.checkBody("_id", "Please enter a quote id").notEmpty();
	var errors = req.validationErrors();

	//validate that user_id exists
	var user_ok = true;
	var user_id = "";
	//validate that tags exist
	var tags_ok = true;
	var my_tags = [];

	users.find({"_id": mongo.ObjectID(req.body.user_id)}, {}, function(e, user_json) {
		if (user_json.length > 0) {
			console.log(user_json);
			user_id = user_json[0]["_id"];
		} else {
			user_ok = false;
		}
		if (req.body.tags) {
			async.eachSeries(req.body.tags, function(item, callback) {
				console.log(item);
				tags.find({_id: parseInt(item)}, {}, function(e, tag) {
					console.log(tag);
					if (tag.length > 0) {
						console.log("Tag found");
						my_tags.push(item);
					}
					else {
						console.log("Tag not found");
						tags_ok = false;
					}
					callback(e);
				});
			}, function(err) {
				if (errors) {
					res.status(400);
					res.send(errors);
				} else if (!tags_ok) {
					res.status(400);	
					res.send("Tags don't exist for all ids in tags array");
				} else if (!user_ok) {
					res.status(400);
					res.send("User id does not exist");
				} else {
					var myQuery = {};
					//create new quote and return result
					if (req.body.text) myQuery.text = req.body.text;
					if (req.body.said_by) myQuery.said_by = req.body.said_by;
					if (req.body.isFavorite) myQuery.isFavorite = req.body.isFavorite;
					myQuery.tags = my_tags;
					if (req.body.user_id) myQuery.user_id = req.body.user_id;
					console.log(myQuery);
					quotes.update({"_id": mongo.ObjectID(req.body._id)}, myQuery, function(e, doc) {
						if (e) {
							console.warn(message);
						} else {
							console.log(doc);
							quotes.find({"_id": mongo.ObjectID(req.body._id)}, {}, function(e, quote_json) {
								res.json(quote_json);
							});
						}
					})
				}
			});
		} else {
			if (errors) {
				res.status(400);
				res.send(errors);
			} else if (!tags_ok) {
				res.status(400);
				res.send("Tags don't exist for all ids in tags array");
			} else if (!user_ok) {
				res.status(400);
				res.send("User id does not exist");
			} else {
				var myQuery = {};
				//create new quote and return result
				if (req.body.text) myQuery.text = req.body.text;
				if (req.body.said_by) myQuery.said_by = req.body.said_by;
				if (req.body.isFavorite) myQuery.isFavorite = req.body.isFavorite;
				if (req.body.rating) myQuery.rating = req.body.rating;
				myQuery.tags = my_tags;
				if (req.body.user_id) myQuery.user_id = req.body.user_id;
				console.log(myQuery);
				quotes.update({"_id": mongo.ObjectID(req.body._id)}, myQuery, function(e, doc) {
					if (e) {
						console.warn(message);
					} else {
						console.log(doc);
						quotes.find({"_id": mongo.ObjectID(req.body._id)}, {}, function(e, quote_json) {
							res.json(quote_json);
						});
					}
				})
			}
		}
	});
});

//add quote
router.post('/quotes', function(req, res, next) {
	var db = req.db;
	var quotes = db.get('quoteCollection');
	var tags = db.get('tag');
	var users = db.get('userCollection');

	console.log(req.body)

	//validate input
	req.checkBody("text", "Please enter some quote text").notEmpty();
	req.checkBody("said_by", "Please tell us who said the quote").notEmpty();
	req.checkBody("isFavorite", "Please make sure isFavorite is a boolean value").isBoolean();
	req.checkBody("rating", "Please make sure rating is valid value between 1 and 9").isInt({"max": 9, "min": 1});
	var errors = req.validationErrors();

	//validate that user_id exists
	var user_ok = true;
	var user_id = "";
	//validate that tags exist
	var tags_ok = true;
	var my_tags = [];

	users.find({"_id": mongo.ObjectID(req.body.user_id)}, {}, function(e, user_json) {
		if (user_json.length > 0) {
			console.log(user_json);
			user_id = user_json[0]["_id"];
			console.log(user_id);
		} else {
			user_ok = false;
		}
		if (req.body.tags) {
			async.eachSeries(req.body.tags, function(item, callback) {
				console.log(item);
				tags.find({_id: parseInt(item)}, {}, function(e, tag) {
					console.log(tag);
					if (tag.length > 0) {
						console.log("Tag found");
						my_tags.push(item);
					}
					else {
						console.log("Tag not found");
						tags_ok = false;
					}
					callback(e);
				});
			}, function(err) {
				if (errors) {
					res.status(400);
					res.send(errors);
				} else if (!tags_ok) {
					res.status(400);
					res.send("Tags don't exist for all ids in tags array");
				} else if (!user_ok) {
					res.status(400);
					res.send("User id does not exist");
				} else {
					var myQuery = {};
					//create new quote and return result
					if (req.body.text) myQuery.text = req.body.text;
					if (req.body.said_by) myQuery.said_by = req.body.said_by;
					if (req.body.isFavorite) myQuery.isFavorite = req.body.isFavorite;
					if (req.body.rating) myQuery.rating = req.body.rating;
					myQuery.tags = my_tags;
					if (req.body.user_id) myQuery.user_id = req.body.user_id;
					console.log(myQuery);
					quotes.insert(myQuery, function(e, doc) {
						if (e) {
							console.warn(message);
						} else {
							res.json(doc);
						}
					})
				}
			});
		} else {
			if (errors) {
				res.status(400);
				res.send(errors);
			} else if (!tags_ok) {
				res.status(400);
				res.send("Tags don't exist for all ids in tags array");
			} else if (!user_ok) {
				res.status(400);
				res.send("User id does not exist");
			} else {
				var myQuery = {};
				//create new quote and return result
				if (req.body.text) myQuery.text = req.body.text;
				if (req.body.said_by) myQuery.said_by = req.body.said_by;
				if (req.body.isFavorite) myQuery.isFavorite = req.body.isFavorite;
				if (req.body.rating) myQuery.rating = req.body.rating;
				myQuery.tags = my_tags;
				if (req.body.user_id) myQuery.user_id = req.body.user_id;
				console.log(myQuery);
				quotes.insert(myQuery, function(e, doc) {
					if (e) {
						console.warn(message);
					} else {
						res.json(doc);
					}
				})
			}
		}
	});
});



module.exports = router;
