"use strict";

var express = require("express"),
	http = require("http"),
	bodyParser = require("body-parser"),
	mongoose = require("mongoose"),
	path = require("path"),
	router = express.Router(),
	port = 3000,
	app,
	initialKey = 10 * Math.pow(36, 3);

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
	longURL: String
});

//Set up the variable to hold objects for the database.
var URL = mongoose.model("URL", URLSchema);

//Functions

//Routes
//Route for homepage.
router.route("/")
	.get(function(req, res){
		res.render("index", {title: "URL Shortener"});
	});
//Route for receiving a URL from the client.
router.route("/shorter")
	.post(function(req, res){
		console.log("Received POST from client");
		console.log(req.body);

		var originalURL,  //The original URL entered by the user.
		base,  //URL part should be "http://localhost:<port number>/". 
		path;  //The part of the URL that will be shortened.

		originalURL = req.body.url;
		base = "http://localhost:" + port + "/";

		//Reference for checking if string contains substring: http://stackoverflow.com/questions/1789945/how-can-i-check-if-one-string-contains-another-substring
		if(originalURL.indexOf(base) > -1){  //Entered URL starts with base, so assume user wants a shortened URL.
			console.log("URL is long URL");

			URL.find({"longURL": originalURL}, function(err, data){
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
					var newKey,
						increaseValue,
						shortenedURL;

					increaseValue = Math.floor(Math.random() * 10 + 1);

					initialKey = initialKey + increaseValue;

					newKey = initialKey;

					newKey = newKey.toString(36);

					shortenedURL = base + newKey;

					var newURL = new URL({"shortURL": shortenedURL,
											"longURL": originalURL});

					newURL.save(function(err, result){
						if(err){
							console.log("ERROR: " + err);
							return;
						}

						URL.find({"longURL": originalURL}, function(err, data){
							if(err){
								console.log("ERROR: " + err);
								return;
							}

							data.forEach(function(elements){
								var shortURL = elements.shortURL;
								console.log(shortURL);

								res.json({shortenedURL: shortURL});
							});
						});
					});
				}
			});
		} else{  //Entered URL does not start with base, so assume user entered a shortened URL and wants the long URL.
			console.log("URL is short URL");

			var shortenedURL = base + originalURL;

			URL.find({"shortURL": shortenedURL}, function(err, data){
				if(err){
					console.log("ERROR: " + err);
					return;
				}

				if(data.length > 0){  //The shortened URL exists, so give the long URL to the user.
					data.forEach(function(elements){
						var longerURL = elements.longURL;
						console.log(longerURL);
						res.json({longerURL: longerURL});
					})
				} else if(data.length === 0){  //The shortened URL entered by the user does not exist, so print out error message.
					res.json({error: "1"});
				}
			});
		}
	});

//Route for handling short and long URLs 
router.route("/:url")
	.get(function(req, res){
		//Reference for getting /:url value: http://stackoverflow.com/questions/20089582/how-to-get-url-parameter-in-express-node-js
		//									 http://expressjs.com/api.html
		var path = req.params.url,  //The path that will be queried in the db.
			base = "http://localhost:" + port + "/";

		var url = base + path;

		URL.find({"shortURL": url}, function(err, data){
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
				URL.find({"longURL": url}, function(error, item){
					if(error){
						console.log("ERROR: " + error);
						return;
					}

					if(item.length > 0){  //Long URL was found.
						res.render("page", {title: path});
					} else if(item.length === 0){  //Long AND short URL was not found, so output 404.
						res.render("pagenx", {title: "404'd"});
					}
				})
			}
		})
	})