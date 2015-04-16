/*
	Authors: Chris Danan and Mario Andrade
	Created: April 14, 2015
	Modified: April 15, 2015
*/

// Server-side code
/* jshint node: true, curly: true, eqeqeq: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, nonew: true, quotmark: double, strict: true, undef: true, unused: true */

"use strict";

var express = require("express"),
	http = require("http"),
	bodyParser = require("body-parser"),
	mongoose = require("mongoose"),
	path = require("path"),
	router = express.Router(),
	port = 3000,
	app,
	initialKey = 10 * Math.pow(36, 3),  //Initial key for short URLs.
	updatedKey = initialKey,  //Will hold values for short URLs.
	getNextKey,  //Function that is defined later.
	checkKeyExistence;  //Function that is defined later.

app = express();

//Connect to the database.
//Reference for checking for connection errors: http://stackoverflow.com/questions/6676499/is-there-a-mongoose-connect-error-callback
mongoose.connect("mongodb://localhost/URLShortener", function(err){
	if(err){
		console.log("CONNECTION ERROR: " + err);
		return;
	}
});

//Set up views path and view engine.
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");  //Using Jade.

//Set up static folder path.
app.use(express.static(__dirname + "/public"));

app.use(bodyParser());
app.use(router);

http.createServer(app).listen(port);
console.log("Server listening on port " + port);

//Set up the schema.
var URLSchema = mongoose.Schema({
	shortURL: String,
	longURL: String,
	numViewed: Number
});

//Set up the variable to hold objects for the database.
var URLModel = mongoose.model("URLModel", URLSchema);

//Functions
//Purpose: Generate a new key that will be used as the short URL.
getNextKey = function(base, originalURL, res){
	var newKey,  //The key that will act as the shortened URL.
		increaseValue; //Random value to increase previous key by.

	increaseValue = Math.floor(Math.random() * 10 + 1);

	updatedKey = updatedKey + increaseValue;  //Increase updatedKey to reflect new generated key.
	newKey = updatedKey;  
	newKey = newKey.toString(36);  //Convert new key to base36.

	checkKeyExistence(newKey, base, originalURL, res);
};

//Purpose: Check if the newly generated key is in the database. 
//			If it is in the database, then get another key (since the generated key will cause a collison).
//			If it is not in the database, then the generated key is valid, so store it in the database.
checkKeyExistence = function(key, base, originalURL, res){
	URLModel.find({"shortURL": base + key}, function(err, data){
		if(err){
			console.log("ERROR: " + err);
			return;
		}

		if(data.length > 0){  //The key exists in the database, so find a new key.
			getNextKey(base, originalURL, res);
		} else if(data.length === 0){  //The key does not exist in the database, so this key is valid.
			var newShortURL = base + key;  //"http://localhost:<port number>/<key>"

			var newURL = new URLModel({"shortURL": newShortURL, "longURL": originalURL, "numViewed": 0
		});

			newURL.save(function(err){
				if(err){
					console.log("ERROR: " + err);
					return;
				}
				//After we save the pair of URLs in the database, find and send the new shortened URL to the client.
				URLModel.find({"longURL": originalURL}, function(err, results){
					if(err){
						console.log("ERROR: " + err);
						return;
					}

					//Note: the following assumes that there is only ONE unique shortened URL (i.e. no collisions).
					//		If there is a key collision, then this will result in an error.
					//		If there is time, fix this!
					results.forEach(function(elements){
						var shortURL = elements.shortURL;
						console.log(shortURL);

						res.json({shortenedURL: shortURL});
					});
				});
			});
		} else{  //Since length is 0 or greater, this shouldn't become active.  If it does, something went wrong, so just get a new key.  Hopefully that will fix it.
			getNextKey(base, originalURL, res);
		}
	});
};

//Routes
//Route for homepage.
router.route("/")
	.get(function(req, res){
		res.render("index", {title: "URL Shortener"});
	});
//Route for recieving POST data from the client.
router.route("/shorter")
	.post(function(req, res){
		console.log("Received POST from client");
		console.log(req.body);

		var originalURL,  //The original URL entered by the user.
		base, shorterbase, prefix;  //URL part should be "http://localhost:<port number>/". 

		originalURL = req.body.url;
		base = "http://localhost:" + port + "/";
		shorterbase = "localhost:" + port + "/";
		prefix = "http://";

		//Reference for checking if string contains substring: http://stackoverflow.com/questions/1789945/how-can-i-check-if-one-string-contains-another-substring
		if(originalURL.indexOf(base) > -1 || originalURL.indexOf(shorterbase) > -1){  //Entered URL starts with base, so assume user wants a shortened URL.
			console.log("URL is long URL");

			if(originalURL.indexOf(prefix) === -1) {
				originalURL = prefix + originalURL;
			}

			URLModel.find({"longURL": originalURL}, function(err, data){
				if(err){
					console.log("ERROR: " + err);
					return;
				}

				//Check if the database has the long URL stored already.  If it does, the data will have length > 0; if it doesn't, data will have length 0.
				if(data.length > 0){  //Long URL is already in the database.
					console.log("It is in the database");

					//Reference for getting value from object returned: http://stackoverflow.com/questions/12956438/accessing-mongodb-collection-values-in-javascript
					data.forEach(function(elements){
						var shortURL = elements.shortURL;
						console.log(shortURL);

						res.json({shortenedURL: shortURL});
					});
				} else if(data.length === 0){  //Long URL is not in the database.
					console.log("It is not in the database");

					//Since it does not exist in the database, we need to create a shortened URL and store it in the database.

					getNextKey(base, originalURL, res);
				}
			});
		} else{  //Entered URL does not start with base, so assume user entered a shortened URL and wants the long URL.
			console.log("URL is short URL");

			var shortenedURL = base + originalURL;

			URLModel.find({"shortURL": shortenedURL}, function(err, data){
				if(err){
					console.log("ERROR: " + err);
					return;
				}

				if(data.length > 0){  //The shortened URL exists, so give the long URL to the user.
					data.forEach(function(elements){
						var longerURL = elements.longURL;
						console.log(longerURL);
						res.json({longerURL: longerURL});
					});
				} else if(data.length === 0){  //The shortened URL entered by the user does not exist, so print out error message.
					res.json({error: "1"});
				}
			});
		}
	});

router.route("/topTen")
	.get(function(req, res){
		res.render("topTen", {title: "Top Ten URLs"});
	});

router.route("/getTopTen")
	.post(function(req, res){
		var resultsArr = [];

		//Reference for getting existing database objects: http://docs.mongodb.org/manual/reference/operator/query/exists/
		URLModel.find({"shortURL": {$exists: true}}, function(err, data){
			if(err){
				console.log("ERROR: " + err);
				return;
			}

			resultsArr = data;

			res.json(resultsArr);
		});
	});

//Route for handling short and long URLs 
router.route("/:url")
	.get(function(req, res){
		//Reference for getting /:url value: http://stackoverflow.com/questions/20089582/how-to-get-url-parameter-in-express-node-js
		//									 http://expressjs.com/api.html
		var URLpath = req.params.url,  //The path that will be queried in the db.
			base = "http://localhost:" + port + "/";

		var url = base + URLpath;

		URLModel.find({"shortURL": url}, function(err, data){
			if(err){
				console.log("ERROR: " + err);
				return;
			}

			if(data.length > 0){  //The URL was found in the database.
				//The URL that was found is the short one, so redirect to the long one.
				data.forEach(function(element){
					var longURL = element.longURL;
					res.redirect(longURL);
				});
			} else if(data.length === 0){  //The URL was not found in the database.
				//The URL searched was the short one.  Now search for the long one.
				URLModel.find({"longURL": url}, function(error, item){
					if(error){
						console.log("ERROR: " + error);
						return;
					}

					if(item.length > 0){  //Long URL was found.
						//Update the number of times the URL was viewed.
						//References for update: http://docs.mongodb.org/manual/reference/operator/update/inc/
						//						http://stackoverflow.com/questions/9151092/increasing-one-field-in-a-mongodb-collection-with-mongoose
						//						http://mongoosejs.com/docs/2.7.x/docs/updating-documents.html
						URLModel.update({"longURL": url}, {$inc: {"numViewed": 1}}, function(err, numAffected){
							if(err){
								console.log("ERROR: " + err);
								return;
							}

							console.log("Num views was updated:");
							console.log(numAffected);

							item.forEach(function(){
								res.render("page", {title: URLpath, thisURL: url});
							});
						});
					} else if(item.length === 0){  //Long AND short URL was not found, so output 404.
						res.render("pagenx", {title: "404'd"});
					}
				});
			}
		});
	});