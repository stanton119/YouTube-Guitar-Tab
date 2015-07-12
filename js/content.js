console.log("insert");
// inject listen.js into current webpage
var s = document.createElement('script');
s.src = chrome.extension.getURL("js/youtubeAPI.js");
s.onload = function() {
	this.parentNode.removeChild(this);
	console.log("s.onload");
};
(document.head||document.documentElement).appendChild(s);

// after inserting get current tab
// var on = 0;	// inserted by background script
var on;
// if (on === undefined) {
// 	on = 1;
// }
if (on) {
	requestTab();
}

// listen for new tab request
window.addEventListener("message", function(event) {
	// if new tab event
	if (on && event.data.type == "newTab") {
		console.log("Content script received: " + event.data.title);
		console.log(event);
		requestTab();
	}
}, false);

function requestTab() {
	// send message to background, wait for response
	chrome.runtime.sendMessage({
		type: "newTab",
		title: document.title
	}, function(response) {
		// process response = tab
		console.log("response");
	    callbackfn(response);
	    return;
	});
}


// when sent tab content, display on page
chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		console.log("received message");
		console.log(sender.tab ?
			"from a content script:" + sender.tab.url :
			"from the extension");
		// output tab or error
		processTab(request);
		
		// if (request.type == "tabReceived") {
// 			var tabCont = getTab(request.title);
//
// 			// sendResponse({tabContent: tabCont});
// 		}
	}
);


function callbackfn(response) {
	console.log("callback");
	console.log(response);
	console.log(response.tabContent);
	
	// add tab to page
}



// function to insert complete tab box into page
function insertIntoPage(tabDiv) {
	//var sidebar = document.getElementById('watch7-sidebar-contents');
	//watch-discussion, watch7-sidebar-contents, switch between above comments vs above related videos
	var sidebar = document.getElementById('watch-discussion');
	if (sidebar) {
		sidebar.insertBefore(tabDiv, sidebar.firstChild);
	}
}


var videoTitle;
var tabTitle;
var tabURL;
function processTab(request) {
	// if already inserted to page
	var tabBoxes = document.getElementsByClassName('tabBox');
	if (tabBoxes.length>0) {
		console.log("already inserted to page");
		return;
	}
	
	tabTitle   = request.tabTitle;
	videoTitle = request.videoTitle;
	tabURL = request.tabURL;
	
	// if no tab found, show error
    if(!request.tabURL || !request.tabContents){
      errorShow();
	  return;
    }
	
	// create div
	var tabDiv = document.createElement('div');
		tabDiv.className = 'tabBox';
		// use innerText to prevent XSS
		tabDiv.innerText = request.tabContents;
		
	// add header at top
	tabDiv.insertBefore(createTabHeader(request.tabURL), tabDiv.firstChild);
					
	// insert into page
	insertIntoPage(tabDiv);
}

// function for tab header
function createTabHeader(tabURL) {
	// create div
	var tabHeader = document.createElement('div');
		tabHeader.className = 'tabHeader';
	
	// create links
	tabHeader.appendChild(sourceLink(tabURL));
	tabHeader.appendChild(document.createTextNode(" ---- "));
	tabHeader.appendChild(getSearchLinks());
	tabHeader.appendChild(document.createElement('br'));
	tabHeader.appendChild(getTabTitle());
	return tabHeader;
}

// function for sourceLink
function sourceLink(tabURL, sourceText) {
	// parameter defaults
	sourceText = typeof sourceText !== 'undefined' ? sourceText : "From ultimate-guitar.com";
	tabURL = typeof tabURL !== 'undefined' ? tabURL : "http://www.ultimate-guitar.com";
	
	// create links
	var sourceLinkA = document.createElement('a');
	sourceLinkA.appendChild(document.createTextNode(sourceText));
	sourceLinkA.title = sourceText;
	sourceLinkA.className = "tab_sourceLink";
	sourceLinkA.href = tabURL;
	sourceLinkA.target = "_blank";
	return sourceLinkA;
}

// function for searchLinks
function getSearchLinks(wrongTab) {
	// linktext:
	wrongTab = typeof wrongTab !== 'undefined' ? wrongTab : "Wrong tab?";
	
	// create links
	var searchLink = "http://www.911tabs.com/search.php?search=" + encodeURIComponent(videoTitle);
	var searchLinkA = document.createElement('a');
	searchLinkA.appendChild(document.createTextNode(wrongTab));
	searchLinkA.title = wrongTab;
	searchLinkA.className = "tab_searchLink";
	searchLinkA.href = searchLink;
	searchLinkA.target = "_blank";
	return searchLinkA;
}

// function for searchLinks
function getTabTitle() {
	// create links
	var searchLinkA = document.createElement('a');
	searchLinkA.appendChild(document.createTextNode(tabTitle));
	searchLinkA.className = "tab_title";
	searchLinkA.href = tabURL;
	searchLinkA.target = "_blank";
	return searchLinkA;
}

// function on error calls
function errorShow(e) {
	console.log("Error - could not find tab");
	if (e) {
		console.log(e);
	}
	
	// tab not found dialog
	// create div
	var tabDiv = document.createElement('div');
		tabDiv.className = 'tabBox tabBoxNo';
		// use innerText to prevent XSS
		tabDiv.innerText = " -- Tab not found --";
		
	// create links
	tabDiv.insertBefore(getSearchLinks("Search again..."), tabDiv.firstChild);
		
	// insert into page
	insertIntoPage(tabDiv);
}