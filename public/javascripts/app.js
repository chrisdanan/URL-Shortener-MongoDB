// Client-side code
/* jshint browser: true, jquery: true, curly: true, eqeqeq: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, nonew: true, quotmark: double, strict: true, undef: true, unused: true */

var main = function(){
	"use strict";

	//DOM elements for the area where user can input URLs.
	//DOM elements for the area where user can input URLs.
	var $inputURL = $("<input>").attr({"id": "inputURLText", "name": "inputURL"}),
		$URLSubmitBtn = $("<button>").text("Submit").attr("id", "inputURLBtn"),
		$tagLabel = $("<label>").text("Enter URL here").attr("for", "inputURL"),
		$resultParagraph = $("<p>").attr("id", "resultParagraph");

	$("#inputURLDiv").append($tagLabel);
	$("#inputURLDiv").append($inputURL);
	$("#inputURLDiv").append($URLSubmitBtn);
	$("#resultsDiv").append($resultParagraph);

	$URLSubmitBtn.on("click", function(){
		var inputURL = $inputURL.val();  //Store the user input.
		$inputURL.val("");  //Empty the text box.

		$.post("/shorter", {url: inputURL}, function(res){
			console.log("Posted to the server and got back a response.");
			
			$resultParagraph.empty();
			//Reference for checking if JSON object has property: http://stackoverflow.com/questions/20804163/check-if-a-key-exists-inside-a-json-object
			if(res.hasOwnProperty("shortenedURL")){
				$resultParagraph.text("URL: " + res.shortenedURL);
			} else if(res.hasOwnProperty("longerURL")){
				$resultParagraph.text("URL: " + res.longerURL);
			} else if(res.hasOwnProperty("error")){
				$resultParagraph.text("Error: That URL does not exist in the database");
			} else{
				$resultParagraph.text("No data returned");
			}
		});
	});
};

$(document).ready(main);