var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/createUser', function(req, res, next) {
	//res.render('createUser', {title: 'Create a New User'})
	var db = req.db;
	var userCollection = db.get('userCollection');
	userCollection.find({},{}, function(e,docs) {
		res.render('createUser', { 
			title: 'Create a New User',
			"userlist": docs
		});
	});
});

router.get('/login', function(req, res, next) {
	res.render('login', {title: 'Please Login'})
});

module.exports = router;
