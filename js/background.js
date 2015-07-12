// off by default
var guitarEnabled;

// on by default, use localstorage to keep state
chrome.storage.sync.get('guitarEnabled', function(data) {
	if (data.guitarEnabled === undefined) {
		chrome.storage.sync.set({guitarEnabled: 'on'});
		guitarEnabled = true;
	} else if (data.guitarEnabled === 'on') {
		guitarEnabled = true;
	} else {
		guitarEnabled = false;
	}
});

// show icon only for youtube pages
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	if (!isYoutubeTab(tab))
		return;
	// place address bar icon
	showIcon(tabId);
});
function isYoutubeTab(tab) {
	// return tab.url.match(/youtube/);
	// true if video player only
	return (tab.url.indexOf('youtube.com/watch') > -1);
	
}
function showIcon(tabId) {
	chrome.pageAction.show(tabId);
	console.log("showing GuitarTab icon, state: "+guitarEnabled);
	icon_path = guitarEnabled ? "img/on.png" : "img/off.png";
	chrome.pageAction.setIcon({tabId: tabId, path:icon_path});
	// turn content script on/off
	chrome.tabs.executeScript(tabId, {code: 'on = '+guitarEnabled+';'});
}

chrome.pageAction.onClicked.addListener(function(tab) {
	guitarEnabled = !guitarEnabled;
	
	// use storage for persistence
	chrome.storage.sync.get('guitarEnabled', function(data) {
		if (data.guitarEnabled === 'on') {
			chrome.storage.sync.set({guitarEnabled: 'off'});
		} else {
			chrome.storage.sync.set({guitarEnabled: 'on'});
		}
	});
	
	// change icon
	icon_path = guitarEnabled ? "img/on.png" : "img/off.png";
	chrome.pageAction.setIcon({tabId: tab.id, path:icon_path});
	
	// turn on/off guitar
	if (guitarEnabled) {
		insertedAlready = false;
		// chrome.tabs.executeScript(tab.id, {code: 'on = 1;'});
		// get tab: song title, tad_it
		getTabURL(tab.title, tab.id);
	} else {
		// chrome.tabs.executeScript(tab.id, {code: 'on = 0;'});
		// delete tab from page
	}
	chrome.tabs.executeScript(tab.id, {code: 'on = '+guitarEnabled+';'});
	// chrome.tabs.executeScript(tabId, {file: "js/off.js"});
	console.log("Triggering GuitarTab: "+guitarEnabled);
});


chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		console.log(sender.tab ?
			"from a content script:" + sender.tab.url :
			"from the extension");
		
		console.log(request);
			
		if (request.type == "newTab") {
			// var tabCont = getTab(request.title);
			insertedAlready = false;
			// get tab: song title, tad_it
			getTabURL(request.title, sender.tab.id);
			
			// sendResponse({tabContent: tabCont});
		}
	}
);

// retrieve tab
// function getTab(title) {
// 	var tabURL = getTabURL(title);
// 	console.log(tabURL);
// 	var tabContent = parseTab(tabURL);
// 	return tabContent;
// }


var videoTitle;
var tabTitle;
// function to get tab URL
function getTabURL(title, tabId) {
	// condition title
	videoTitle = conditionTitle(title);
	
	// form google search url
	var google_url = 'https://ajax.googleapis.com/ajax/services/search/web?v=1.0&q=site%3Atabs.ultimate-guitar.com%22+' + encodeURIComponent(videoTitle) + '%20tab -"Page Ranking Information"';
	console.log(google_url);
	
	// get top google result
	$.getJSON( google_url, function( data ) {
		if (data.responseStatus !== 200) {
			console.log("XHR google error");
			return;
		}
		console.log("URL found, parsing tab");
		try {
			var googleResult = data.responseData.results[0].unescapedUrl;
			tabTitle		 = data.responseData.results[0].titleNoFormatting;
		} catch (e) {
			errorShow(tab_id, "No google url");
			return;
		}
		parseTab(googleResult, tabId);
	});
}

function conditionTitle(titleIn) {
	// condition title
	titleIn = titleIn.replace(" - YouTube", "");
	titleIn = titleIn.replace(/<[^>]*>/g, "").trim();
	titleIn = titleIn.replace(/\s+/gm, ' ')        // Remove all white spaces with a single space
	.trim()                       // Trim it
	.replace(/( \(.+\))+$/g, '')  // Remove additional info like (video)
	.replace(/( \[.+\])+$/g, '')  // Remove additional info like [video]
	.replace(/-(?=[^\s])/g, '- ') // Change -something to - something, so Google includes it in search
	.trim();
	
	return titleIn;
}

// function to parse tab URL
function parseTab (tabURL, tabId) {
	console.log(tabURL);
	
    if(!tabURL){
      errorShow(tabId,"No tab url");
	  return;
    }
	
	jQuery.ajax({
		url: tabURL,
		success: function(result) {
			// find tab content, 3rd pre statement
			// var tabContent= $(result.responseText).find("#cont");
			try {
				var tabContent= $(result).find("#cont").find("pre")[2].innerText;
				console.log("sending tab to page");
				// insert into page
				insertIntoPage(tabId, tabContent, tabURL);
			} catch (e) {
				errorShow(tabId, "No tab url 2");
				return;
			}
		},
	});
}


// function to insert complete tab box into page
var insertedAlready = false;
function insertIntoPage(tabId, tabContent, URL) {
	if (insertedAlready) {
		console.log("Already inserted");
		return;
	}
	insertedAlready = true;
	// chrome.tabs.executeScript(tabId, {file: "js/on.js"});
	console.log("sending message to tab " + tabId);
	chrome.tabs.sendMessage(tabId, {tabContents: tabContent, tabURL: URL, tabTitle: tabTitle, videoTitle: videoTitle});
}
function errorShow(tabId, tabContent) {
	console.log("Error: " + tabContent);
	insertIntoPage(tabId, "", "");
}





// Check whether new version is installed
chrome.runtime.onInstalled.addListener(function(details){
	// direct to welcome page
	
    if(details.reason == "install"){
        console.log("First time install, show website");
		// new tab with install page
		chrome.tabs.create({url: "http://www.richard-stanton.com/chrome-plugins/guitar-tabs-for-youtube/guitarinstall/"});
    }
	// else if(details.reason == "update"){
//         var thisVersion = chrome.runtime.getManifest().version;
//         console.log("Updated from " + details.previousVersion + " to " + thisVersion + "!");
// 		chrome.tabs.create({url: "http://www.richard-stanton.com/chrome-plugins/guitar-tabs-for-youtube/guitarinstall/"});
//     }
});