var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var request = require('request');
var moment = require('moment');

var baseURL = 'https://api.nasa.gov/planetary/apod' ;

//MUST have a body-parser to get POST data.
//(Unlike GET requests, which can be extracted from body.query)
parser = bodyParser.json();

var apodJSON;
var apodError = false;


/* GET home page. */
router.get('/', function(req, res, next){
  res.render('index', { title: 'ASTROPIX' });
});


router.post('/fetch_picture', parser, function fetch_picture(req, res) {

  var today = "today_picture";
  var random = "random_picture";    //Button attributes. Which button was clicked?

  if (req.body[today] ) {
    apodRequest(false, function() {
      provideResponse(res, today);
    });
  }

  else if (req.body[random]) {
    apodRequest(true, function() {
      provideResponse(res);
    });
  }

  else {
    res.status(404).send("Unknown option");  //TODO better error message.
  }

});


function apodRequest(random, callback) {

  var queryParam = {};

  var APIKEY = process.env.APOD_API_KEY;

  if (random) {
    queryParam = { "api_key" : APIKEY, "date" :randomDateString() };
  }
  else {
    queryParam = { 'api_key' : APIKEY };
  }

  request( {uri :baseURL, qs: queryParam} , function(error, request, body, call){
    apodJSONReply(error, request, body, callback);
  });

}


function provideResponse(res, today){

  if (apodError) {
    apodError = false;
    res.render('apodError');
  }

  else {

    //APOD includes a copyright attribute, but only if the image is under copyright.
    //Add a parameter for copyright or image credit, depending if there is a copyright holder
    //NASA's images are in the public domain so no copyright, so provide an image credit.
    if (apodJSON.hasOwnProperty("copyright")) {
      apodJSON.credit = "Image credit and copyright: " + apodJSON.copyright;
    } else {
      apodJSON.credit = "Image credit: NASA";
    }

    //Create the NASA link to the image's page

    //For previous images,
    //The url provided is just for the image
    //Would like to provide a link in the form
    //   http://apod.nasa.gov/apod/ap160208.html
    //Which is a page about the image.

    //For today's image, the link is http://apod.nasa.gov/apod/

    var baseURL = "http://apod.nasa.gov/apod/";

    if (!today) {
      var imgDate = moment(apodJSON.date);
      var filenameDate = imgDate.format("YYMMDD");
      var filename = "ap" + filenameDate + ".html";
      var url = baseURL + filename;
      apodJSON.apodurl = url;
    }
    else {
      apodJSON.apodurl = baseURL;
    }


    console.log(JSON.stringify(apodJSON));  //for debugging
    res.render('image', apodJSON);

  }
}


function apodJSONReply(error, response, body, callback){

  if (!error && response.statusCode == 200){
    apodJSON = JSON.parse(body);
    apodError = false;
  }

  else {
    //Log error info, set apodError flag to true
    console.log("Error in JSON request: " + error);
    console.log("Status code: " + response.statusCode);
    console.log(response);
    console.log(body);
    apodError = true;
  }

  callback();

}

//APOD started on June 16th, 1995. Select a random date between
//then and yesterday.  Convert to a string in YYYY-MM-DD format.
function randomDateString(){

  //Create data objects for yesterday, and APOD start date
  var today = moment().subtract(1, 'days');
  var APODstart = moment('1995-06-16');

  //Convert to Unix time - milliseconds since Jan 1, 1970
  var todayUnix = today.valueOf();
  var APODstartUnix = APODstart.valueOf();

  //How many milliseconds between APOD start and now?
  var delta = todayUnix - APODstartUnix;

  //Generate a random number between 0 and (number of milliseconds between APOD start and now)
  var offset = Math.floor((Math.random() * delta));
  //And random number to APOD start
  var randomUnix = APODstartUnix + offset;

  //And then turn this number of seconds back into a date
  var randomDate = moment(randomUnix);

  //And format this date as "YYYY-MM-DD", the format required in the
  //APOD API calls.
  var stringRandomDate = randomDate.format('YYYY-MM-DD');

  return stringRandomDate;
}


module.exports = router;
