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

};

$(document).ready(main);