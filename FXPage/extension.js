
document.getElementById('fillButton').addEventListener('click', () => {
    const config = document.getElementById('config').value;
    const { selectors, values } = parseConfig(config);
    const loginUrl = document.getElementById('loginUrl').value;
    const ReGex = document.getElementById('ReGex').value;
    const validationString = document.getElementById('validationString').value;

    chrome.tabs.create({ url: loginUrl }, (newTab) => {
        if (newTab && newTab.id) {
            tabId = newTab.id;
            chrome.runtime.sendMessage({
                action: 'Prepare',
                tabId: newTab.id,
                selectors: selectors,
                values: values,
                regexString: ReGex,
                validationString: validationString
            }, (response) => {
                if (response && response.success) {
                    console.log("Background service is ready:", response.message);
                } else {
                    console.error("Background service failed:", response);
                }
            });
            chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo, tab) {
                if (tabId === newTab.id && changeInfo.status === 'complete') {
                    chrome.tabs.onUpdated.removeListener(listener);
                }
            });
        } else {
            console.error("Failed to create new tab.");
        }
    });
});

function parseConfig(config) {
    const selectors = {};
    const values = {};
    let currentSection = null;

    config.split('\n').forEach((line) => {
        line = line.trim();
        if (line.startsWith('[')) {
            currentSection = line.slice(1, -1);
        } else if (line && currentSection) {
            const equalSignIndex = line.indexOf('=');
            if (equalSignIndex !== -1) {
                const key = line.substring(0, equalSignIndex).trim();
                const value = line.substring(equalSignIndex + 1).trim();
                if (currentSection === 'selectors') {
                    selectors[key] = value;
                } else if (currentSection === 'values') {
                    values[key] = value;
                }
            }
        }
    });

    return { selectors, values };
}

chrome.runtime.onMessage.addListener((request)=>{
    if (request.action === 'updateResponseDiv') {updateResponseDiv(request);}
});

function updateResponseDiv(response) {
    document.querySelectorAll('.response-div').forEach((responseDiv) => {
        const messageDiv = responseDiv.querySelector('.msg');
        const pwdDiv = responseDiv.querySelector('.password');
        const tabId = response.tabId;
        messageDiv.textContent = response.message;

        if (response.storedData && tabId && response.storedData[tabId] && response.storedData[tabId]['values'] && response.storedData[tabId]['values']['password_selector']) {
            pwdDiv.textContent = response.storedData[tabId]['values']['password_selector'];
        } else {
            pwdDiv.textContent = null;
        }
    });
}