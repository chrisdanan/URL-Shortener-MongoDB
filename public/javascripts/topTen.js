// Client-side code
/* jshint browser: true, jquery: true, curly: true, eqeqeq: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, nonew: true, quotmark: double, strict: true, undef: true, unused: true */

var main = function(){
	"use strict";

	var $getResultsBtn = $("<button>").text("Get the Top Ten URLs");
	var resultsArr = [];

	$("#buttonArea").append($getResultsBtn);

	//Reference for sorting: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
	function sortURLS(resultsArr){
		resultsArr.sort(function(a, b){
			if(a.numViewed > b.numViewed){
				return 1;
			}

			if(a.numViewed < b.numViewed){
				return -1;
			}

			return 0;
		});
	}

	$getResultsBtn.on("click", function(){
		$.post("/getTopTen", function(res){
			console.log("Received response from the server");

			//Populate resultsArr with the URLs stored in the database (specifically, the long URL and the number of views it has).
			res.forEach(function(data){
				var resultObject = new Object();
				resultObject.longURL = data.longURL;
				resultObject.numViewed = data.numViewed;
				resultsArr.push(resultObject);
			});

			sortURLS(resultsArr);

			$("#top10Results").empty();

			resultsArr.reverse().forEach(function(object){
				$("#top10Results").append($("<p>").text("Long URL: " + object.longURL + " | Number of views: " + object.numViewed));
			});
		});
	});
};

$(document).ready(main);