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
		}
	});