function checkPageForText(text) {
  const bodyText = document.body.textContent || document.body.innerText;
  return bodyText.includes(text);
}
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "checkPageText") {
    const textToCheck = request.text;
    console.log('request'+request)
    const result = checkPageForText(textToCheck);
    sendResponse({ found: result });
  }
});

chrome.runtime.sendMessage({ action: 'contentLoaded' }, (response) => {
  let isFound =  checkPageForText(response.text) ? response.text !== null : console.log(null);
  if (isFound){
    chrome.runtime.sendMessage({action: 'validationTextValid', response: isFound});
  }
  else{
    chrome.runtime.sendMessage({action: 'scrapLogin'}, (response) => {
    });
  }
});

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}