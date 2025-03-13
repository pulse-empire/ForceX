document.getElementById('openPopupAsTab').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs.length > 0 && tabs[0].id) {
            chrome.runtime.sendMessage({
                action: 'checkAndOpenPopup',
                tabId: tabs[0].id
            });
        } else {
            console.error("Could not get current tab ID.");
        }
    });
});