// If the <script src=...> tag is placed before the end of the body,
// declare --- var randomQuoteMachine = function() {...} --- and use -
// window.addEventListener("load", randomQuoteMachine, false);
// OR document.addEventListener("DOMContentLoaded", randomQuoteMachine, false);

(function randomQuoteMachine() {
  "use strict";

  // Define our internal Quote Data Model that holds the quote data (in JSON format)
  // -------------------------------------------------------------------------------
  var quoteDataModel = {
    "quoteText": "",
    "quoteAuthor": ""
  };

  // Local Source of Quotes - Using an array of json objects to store the data
  // Optionally use deepFreezeObjects(localSourceQuotesArray) to make the array a constant
  // -------------------------------------------------------------------------------------
  var LOCAL_SOURCE_QUOTES_ARRAY = [
    {
      "quoteText": "People often say that motivation does not last. Well, neither does bathing. That is why we recommend it daily.",
      "quoteAuthor": "Zig Ziglar"
    },
    {
      "quoteText": "All are lunatics, but he who can analyze his delusion is called a philosopher.",
      "quoteAuthor": "Ambrose Bierce"
    },
    {
      "quoteText": "Be who you are and say what you feel, because those who mind don't matter, and those who matter don't mind.",
      "quoteAuthor": "Bernard M. Baruch"
    },
    {
      "quoteText": "In three words I can sum up everything I've learned about life: it goes on.",
      "quoteAuthor": "Robert Frost"
    },
    {
      "quoteText": "I've learned that people will forget what you said, people will forget what you did, but people will never forget how you made them feel.",
      "quoteAuthor": "Maya Angelou"
    },
    {
      "quoteText": "To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.",
      "quoteAuthor": "Ralph Waldo Emerson"
    },
    {
      "quoteText": "Life is what happens to you while you're busy making other plans.",
      "quoteAuthor": "Allen Saunders"
    },
    {
      "quoteText": "The man who does not read has no advantage over the man who cannot read.",
      "quoteAuthor": "Mark Twain"
    },
    {
      "quoteText": "I have not failed. I've just found 10,000 ways that won't work.",
      "quoteAuthor": "Thomas A. Edison"
    },
    {
      "quoteText": "Life is like riding a bicycle. To keep your balance, you must keep moving.",
      "quoteAuthor": "Albert Einstein"
  }];

  // Define a CONSTANT array to hold information about the quote sources
  // Optionally use deepFreezeObject(localSourceQuotesArray) to make the array a constant
  // ------------------------------------------------------------------------------------
  var QUOTE_SOURCES = [
    {
      name: "Local Source",
      url: "",
      format: "JSON",
      method: "",
      type: "LOCAL",
      responseProcessingFunction: function (responseObj) {
        quoteDataModel.quoteText = responseObj.quoteText;
        quoteDataModel.quoteAuthor = responseObj.quoteAuthor;
      }
    },
    {
      name: "Storm Consultancy",
      url: "http://quotes.stormconsultancy.co.uk/random.json",
      format: "JSON",
      method: "GET",
      type: "CORSPROXY",
      responseProcessingFunction: function (responseString) {
        var obj = JSON.parse(responseString);
        quoteDataModel.quoteText = obj.quote;
        quoteDataModel.quoteAuthor = obj.author;
      }
    },
    {
      name: "Forismatic",
      url: "http://api.forismatic.com/api/1.0/?method=getQuote&format=json&lang=en&nocache=",
      format: "JSON",
      method: "GET",
      type: "CORSPROXY",
      responseProcessingFunction: function (responseString) {
        var obj = JSON.parse(responseString);
        quoteDataModel.quoteText = obj.quoteText;
        quoteDataModel.quoteAuthor = obj.quoteAuthor;
      }
    },
    {
      name: "Quotes On Design",
      url: "http://quotesondesign.com/wp-json/posts?filter[orderby]=rand&filter[posts_per_page]=1&nocache=",
      format: "JSON",
      method: "GET",
      type: "CORSPROXY",
      responseProcessingFunction: function (responseString) {
        var obj = JSON.parse(responseString);
        quoteDataModel.quoteText = obj[0].content;
        quoteDataModel.quoteAuthor = obj[0].title;
      }
    },
    {
      name: "AndruXnet Random-Famous-Quotes",
      url: "https://andruxnet-random-famous-quotes.p.mashape.com/?cat=famous",
      headers: {},
      format: "JSON",
      method: "POST",
      type: "CORS",
      responseProcessingFunction: function (responseString) {
        var obj = JSON.parse(responseString);
        quoteDataModel.quoteText = obj[0].content;
        quoteDataModel.quoteAuthor = obj[0].title;
      }
    }
  ];

  // Define CONSTANTS used by the application and store it in an Object
  // ------------------------------------------------------------------
  var RQM_CONSTANTS = {
    HTTP_SUCCESS_STATUS_CODE: 200,
    //CORS_PROXY_URL: "https://jsonp.afeld.me/?url=",
    CORS_PROXY_URL: "https://crossorigin.me/",
    DEFAULT_QUOTE_SOURCE: 0,
    NO_OF_LOCAL_QUOTES: LOCAL_SOURCE_QUOTES_ARRAY.length,
    NO_OF_QUOTE_SOURCES: QUOTE_SOURCES.length,
    QUOTE_TEXT_ELEMENT: document.getElementById("quote-text"),
    QUOTE_AUTHOR_ELEMENT: document.getElementById("quote-author"),
    MANUAL_REFRESH_BUTTON_ELEMENT: document.getElementById("refreshQuote"),
    AUTO_REFRESH_BUTTON_ELEMENT: document.getElementById("autoRefreshQuote"),
    ANIMATED_REFRESH_ICON_ELEMENT: document.getElementById("animateRefreshIcon"),
    MY_ALERT: document.getElementById("myAlert"),
    MSG_QUOTE_SOURCE_CHANGED: "<Strong>Note: </strong>Quote Source changed to ",
    AUTO_REFRESH_BUTTON_ELEMENT_DISABLE: "<span class=\"glyphicon glyphicon-refresh\"></span>&ensp;Auto-Refresh: OFF&ensp;<span class=\"caret\"></span>",
    TWEET_URL: "http://twitter.com/intent/tweet?text="
  };
  // Shallow freeze the constants
  Object.freeze(RQM_CONSTANTS);

  // Keep track of the user's currently selected quote source
  // By default, it is "Local Source"
  var currentQuoteSource = RQM_CONSTANTS.DEFAULT_QUOTE_SOURCE;
  var currentAutoRefreshIntervalId = 0;
  var autoRefreshEnabled = false;

  // Define function to make a call to the local quote source
  // --------------------------------------------------------
  function callLocalSouceApi(parseResponseFunction, updateViewFunction) {
    // Select a random quote from the array of local quotes
    var localSourceQuoteIndex = Math.floor(Math.random() * RQM_CONSTANTS.NO_OF_LOCAL_QUOTES);
    parseResponseFunction(LOCAL_SOURCE_QUOTES_ARRAY[localSourceQuoteIndex]);
    updateViewFunction();
    endManualRefresh();
  }

  // Define function to make a CORS compliant REST API call
  //-------------------------------------------------------
  function callCorsRestApi(url, parseResponseFunction, updateViewFunction) {
    var request = new XMLHttpRequest();
    request.onreadystatechange = function () {
      if (request.readyState === XMLHttpRequest.DONE) {
        if (request.status === RQM_CONSTANTS.HTTP_SUCCESS_STATUS_CODE) {
          parseResponseFunction(request.responseText);
          updateViewFunction();
        } else {
          displayAlert(RQM_CONSTANTS.MY_ALERT, "error", "<strong>Error: </strong>Unable to retrieve Quote from \"" +
            "<strong>" + QUOTE_SOURCES[currentQuoteSource].name + "</strong>\". Please try a different Quote Source.", true, 0);
        }
        endManualRefresh();
      }

    };
    // Open connection for asynchronous request
    request.open(QUOTE_SOURCES[currentQuoteSource].method, url, true);
    request.send(null);
  }

  // Function to make a CORS non-compliant REST API call by using a CORS Proxy
  //--------------------------------------------------------------------------
  function callCorsProxyRestApi(url, parseResponseFunction, updateViewFunction) {
    //prepend the url with the CORS PROXY url
    url = (RQM_CONSTANTS.CORS_PROXY_URL).concat(url);
    // check if API uses caches (by checking for "nocache" parameter in url)
    // If so, append the current datetime to the end of the url (i.e. nocache=Date.now())
    if (QUOTE_SOURCES[currentQuoteSource].url.indexOf("&nocache=") !== -1) {
      url = url.concat(Date.now());
    }
    callCorsRestApi(url, parseResponseFunction, updateViewFunction);
  }

  // Define functions that change the view here
  //-------------------------------------------
  function updateMainQuote() {
    RQM_CONSTANTS.QUOTE_TEXT_ELEMENT.innerHTML = quoteDataModel.quoteText;
    RQM_CONSTANTS.QUOTE_AUTHOR_ELEMENT.innerHTML = quoteDataModel.quoteAuthor;
  }

  function beginManualRefresh() {
    // start animating refresh icon
    RQM_CONSTANTS.ANIMATED_REFRESH_ICON_ELEMENT.classList.add("glyphicon-refresh-animate");
    // disable the manual refresh button until results are obtained or there is an error
    // we do this to prevent multiple clicks and sending too many async requests in a short period of time
    RQM_CONSTANTS.MANUAL_REFRESH_BUTTON_ELEMENT.classList.remove("btn-info");
    RQM_CONSTANTS.MANUAL_REFRESH_BUTTON_ELEMENT.classList.add("btn-warning");
    RQM_CONSTANTS.MANUAL_REFRESH_BUTTON_ELEMENT.setAttribute("disabled", "disabled");
  }

  function endManualRefresh() {
    // re-enable the manual refresh button
    RQM_CONSTANTS.MANUAL_REFRESH_BUTTON_ELEMENT.classList.remove("btn-warning");
    RQM_CONSTANTS.MANUAL_REFRESH_BUTTON_ELEMENT.classList.add("btn-info");
    if (!autoRefreshEnabled) {
      RQM_CONSTANTS.MANUAL_REFRESH_BUTTON_ELEMENT.removeAttribute("disabled");
    }
    // stop animating the refresh icon
    RQM_CONSTANTS.ANIMATED_REFRESH_ICON_ELEMENT.classList.remove("glyphicon-refresh-animate");
  }

  // Define all event handlers here
  //-------------------------------
  function myAlertCloseButtonClickedEventHandler() {
    fadeOutAlert(RQM_CONSTANTS.MY_ALERT);
  }

  function tweetQuoteButtonClickedEventHandler() {
    var tweetMsg = quoteDataModel.quoteText + " (" + quoteDataModel.quoteAuthor + ")";
    window.open(RQM_CONSTANTS.TWEET_URL + tweetMsg, "twitterwindow", "height=450, width=550, toolbar=0, location=0, menubar=0, directories=0, scrollbars=0");
  }

  function manualRefreshQuoteButtonClickedEventHandler() {
    // first, remove any existing alerts
    hideAlert(RQM_CONSTANTS.MY_ALERT);
    // next, start animating the refresh icon and disable the button to prevent multiple requests
    beginManualRefresh();
    apiToCall();
  }

  function apiToCall() {
    // Based on connection method of quote source, call the appropriate function
    switch (QUOTE_SOURCES[currentQuoteSource].type) {
      case "LOCAL":
        {
          return callLocalSouceApi(QUOTE_SOURCES[currentQuoteSource].responseProcessingFunction, updateMainQuote);
        }
      case "CORS":
        {
          return callCorsRestApi(QUOTE_SOURCES[currentQuoteSource].url, QUOTE_SOURCES[currentQuoteSource].responseProcessingFunction, updateMainQuote);
        }
      case "CORSPROXY":
        {
          return callCorsProxyRestApi(QUOTE_SOURCES[currentQuoteSource].url, QUOTE_SOURCES[currentQuoteSource].responseProcessingFunction, updateMainQuote);
        }
      default:
        {
          return callLocalSouceApi(QUOTE_SOURCES[currentQuoteSource].responseProcessingFunction, updateMainQuote);
        }
    }
  }

  function autoRefreshSelectionClickedEventHandler(event) {
    // first, remove any existing alerts
    hideAlert(RQM_CONSTANTS.MY_ALERT);
    // next clear OLD auto refresh interval
    window.clearInterval(currentAutoRefreshIntervalId);

    var interval = Number(event.target.getAttribute("data-label"));
    if (!isNaN(interval) && 0 <= interval && interval <= 3600) {
      // If 0, then disable autorefresh
      if (interval === 0) {
        autoRefreshEnabled = false;
        RQM_CONSTANTS.MANUAL_REFRESH_BUTTON_ELEMENT.removeAttribute("disabled");
        RQM_CONSTANTS.AUTO_REFRESH_BUTTON_ELEMENT.classList.remove("btn-warning");
        RQM_CONSTANTS.AUTO_REFRESH_BUTTON_ELEMENT.classList.add("btn-info");
        RQM_CONSTANTS.AUTO_REFRESH_BUTTON_ELEMENT.innerHTML = RQM_CONSTANTS.AUTO_REFRESH_BUTTON_ELEMENT_DISABLE;
      } else { // enable autorefresh
        autoRefreshEnabled = true;
        var intervalUnit = (interval < 60) ? " sec" : " min";
        var intervalTime = (interval / 60 < 1) ? interval : (Math.floor(interval / 60));
        RQM_CONSTANTS.MANUAL_REFRESH_BUTTON_ELEMENT.setAttribute("disabled", "disabled");
        RQM_CONSTANTS.AUTO_REFRESH_BUTTON_ELEMENT.classList.remove("btn-info");
        RQM_CONSTANTS.AUTO_REFRESH_BUTTON_ELEMENT.classList.add("btn-warning");
        RQM_CONSTANTS.AUTO_REFRESH_BUTTON_ELEMENT.innerHTML = "<span class=\"glyphicon glyphicon-refresh\">" +
          "</span>&ensp;Auto-Refresh: ON (" + intervalTime + intervalUnit +
          ")&ensp;<span class=\"caret\"></span>";
        // set interval to call refreshquote
        currentAutoRefreshIntervalId = window.setInterval(function () {
          apiToCall();
        }, interval * 1000);
      }
    }
  }

  function quoteOptionsSelectionClickedEventHandler(event) {
    var quoteSourceIndex = Number(event.target.getAttribute("data-label"));
    if ((!isNaN(quoteSourceIndex)) && (0 <= quoteSourceIndex) && (quoteSourceIndex < RQM_CONSTANTS.NO_OF_QUOTE_SOURCES)) {
      // display alert and change currentQuoteSource ONLY if different from previous selection
      if (currentQuoteSource !== quoteSourceIndex) {
        currentQuoteSource = quoteSourceIndex;
        displayAlert(RQM_CONSTANTS.MY_ALERT, "info", RQM_CONSTANTS.MSG_QUOTE_SOURCE_CHANGED +
          "\"<strong>" + QUOTE_SOURCES[quoteSourceIndex].name + "</strong>\" ", true, 0);
      }
    }
  }

  // On initial page load, display a random quote from the local quote source
  (function init() {
    callLocalSouceApi(QUOTE_SOURCES[currentQuoteSource].responseProcessingFunction, updateMainQuote);
  })();

  /**
   * [Add custom event listerners used by my application,
   * i.e. wire up the component, event, and eventhandler]
   */
  (function addCustomEventListeners() {

    var myAlertCloseButton = document.getElementById("myAlertClose");
    myAlertCloseButton.addEventListener("click", myAlertCloseButtonClickedEventHandler, false);

    // event listener for "Refresh Quote" button
    var refreshQuoteButton = document.getElementById("refreshQuote");
    refreshQuoteButton.addEventListener("click", manualRefreshQuoteButtonClickedEventHandler, false);

    // event listener for "Tweet Quote" button
    var tweetQuoteButton = document.getElementById("tweetQuote");
    tweetQuoteButton.addEventListener("click", tweetQuoteButtonClickedEventHandler, false);

    // event listener for "Auto Refresh" button
    var autoRefreshButton = document.getElementById("autoRefreshSelection");
    autoRefreshButton.addEventListener("click", autoRefreshSelectionClickedEventHandler, false);

    // event listener for "Options" button
    var optionsButton = document.getElementById("optionSelection");
    optionsButton.addEventListener("click", quoteOptionsSelectionClickedEventHandler, false);

  })();

})();
