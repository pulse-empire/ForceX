// background.js
var storedData = {};
var validationString = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'checkAndOpenPopup') {
        const popupUrl = `chrome-extension://${chrome.runtime.id}/FXPage/page.html`;
        chrome.tabs.get(request.tabId, (tab) => {
            if (tab && tab.url && tab.url !== popupUrl) {
                chrome.tabs.create({ url: popupUrl });
            }
        });
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'Prepare') {
        storedData[request.tabId] = {
            selectors: request.selectors,
            values: request.values,
            validationString: request.validationString,
            regexString: request.regexString
        };
        validationString = request.validationString;
        sendResponse({ success: true, message: "Data stored." });
        return true; // Indicate asynchronous response
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'contentLoaded') {
        sendResponse({ success: true, text: validationString });
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'validationTextValid') {
        if (request.response) {
            chrome.runtime.sendMessage({
                action: 'updateResponseDiv',
                message: 'Login is successful',
                storedData: storedData,
                tabId: sender.tab.id
            });
        } else {
            chrome.runtime.sendMessage({ action: 'updateResponseDiv', message: 'Login attempt failed', tabId: sender.tab.id });
        }
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'scrapLogin') {
        const tabId = sender.tab ? sender.tab.id : null;
        if (storedData[tabId]) {
            const data = storedData[tabId];
            fillAndSubmit(tabId, data.selectors, data.values, data.regexString, sendResponse);
            return true; // Indicate asynchronous response
        } else {
            sendResponse({ success: false, message: "No stored data for this tab." });
        }
    }
});

async function fillAndSubmit(tabId, selectors, values, regexString, sendResponse) {
    await waitForPageLoad(tabId);
    try {
        const password = generatePassword(regexString);
        storedData[tabId]['values']['password_selector'] = password;

        for (const key in selectors) {
            await delay(Math.floor(Math.random() * 1000) + 500);
            const selector = selectors[key];
            let value = values[key];

            if (key === 'password_selector') {
                value = password;
            }

            await executeScript(tabId, simulateTypingWrapper, [selector, value]);
        }

        await executeScript(tabId, simulateFormSubmission, []);
        
        sendResponse({ success: true, message: "Login process completed." });
    } catch (error) {
        console.error("Login process failed:", error);
        sendResponse({ success: false, message: "Login process failed." });
    }
}

function simulateTypingWrapper(selector, text) {
    return new Promise(async (resolve) => {
        const element = document.querySelector(selector);
        if (element) {
            // Initial wait before focusing
            await new Promise(r => setTimeout(r, Math.floor(Math.random() * 800) + 300)); // 300-1100ms

            element.focus(); // Focus the element

            // Short pause after focusing
            await new Promise(r => setTimeout(r, Math.floor(Math.random() * 300) + 100)); // 100-400ms

            if (element.value) {
                // If there is existing value, simulate backspace to clear
                const currentValueLength = element.value.length;
                for (let i = 0; i < currentValueLength; i++) {
                    element.value = element.value.slice(0, -1);
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                    element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true }));
                    element.dispatchEvent(new KeyboardEvent('keyup', { key: 'Backspace', bubbles: true, cancelable: true }));
                    await new Promise(r => setTimeout(r, Math.floor(Math.random() * 120) + 60)); // Simulate backspace delay
                }
                //pause after clearing
                await new Promise(r => setTimeout(r, Math.floor(Math.random() * 400) + 200)); // 200-600 ms pause after clearing.
            }

            // Delay before starting to type
            await new Promise(r => setTimeout(r, Math.floor(Math.random() * 400) + 200)); // Delay 200-600ms

            // Now type the new text with mistakes and corrections
            let typedText = '';
            for (let char of text) {
                if (Math.random() < 0.15) { // 15% chance of making a mistake
                    const mistakeChar = String.fromCharCode(Math.floor(Math.random() * 26) + 97); // Random lowercase letter
                    typedText += mistakeChar;
                    element.value = typedText;
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                    element.dispatchEvent(new KeyboardEvent('keydown', { key: mistakeChar, bubbles: true, cancelable: true }));
                    element.dispatchEvent(new KeyboardEvent('keyup', { key: mistakeChar, bubbles: true, cancelable: true }));
                    await new Promise(r => setTimeout(r, Math.floor(Math.random() * 150) + 75)); // Simulate mistake typing delay

                    // Simulate backspace to correct the mistake
                    typedText = typedText.slice(0, -1);
                    element.value = typedText;
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                    element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true }));
                    element.dispatchEvent(new KeyboardEvent('keyup', { key: 'Backspace', bubbles: true, cancelable: true }));
                    await new Promise(r => setTimeout(r, Math.floor(Math.random() * 120) + 60)); // Simulate backspace delay

                    // Type the correct character
                    typedText += char;
                    element.value = typedText;
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                    element.dispatchEvent(new KeyboardEvent('keydown', { key: char, bubbles: true, cancelable: true }));
                    element.dispatchEvent(new KeyboardEvent('keyup', { key: char, bubbles: true, cancelable: true }));
                    await new Promise(r => setTimeout(r, Math.floor(Math.random() * 180) + 90)); // Simulate typing delay
                } else {
                    typedText += char;
                    element.value = typedText;
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                    element.dispatchEvent(new KeyboardEvent('keydown', { key: char, bubbles: true, cancelable: true }));
                    element.dispatchEvent(new KeyboardEvent('keyup', { key: char, bubbles: true, cancelable: true }));
                    await new Promise(r => setTimeout(r, Math.floor(Math.random() * 180) + 90)); // Simulate typing delay
                }
            }

            // Delay after typing
            await new Promise(r => setTimeout(r, Math.floor(Math.random() * 300) + 150)); // Delay 150-450ms

            element.dispatchEvent(new Event('change', { bubbles: true }));

            //Delay after change event.
            await new Promise(r => setTimeout(r, Math.floor(Math.random() * 500) + 250)); // Delay 250-750ms
        }
        resolve();
    });
}

async function waitForPageLoad(tabId) {
    return new Promise((resolve) => {
        const listener = (updatedTabId, changeInfo, tab) => {
            if (updatedTabId === tabId && changeInfo.status === 'complete') {
                chrome.tabs.onUpdated.removeListener(listener);
                resolve();
            }
        };
        chrome.tabs.onUpdated.addListener(listener);
    });
}

async function executeScript(tabId, func, args = [], world = "MAIN") {
    return new Promise((resolve) => {
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            function: func,
            args: args,
            world: world
        }, (results) => {
            if (chrome.runtime.lastError) {
                console.error("Error executing script:", chrome.runtime.lastError);
            }
            resolve(results);
        });
    });
}

function generatePassword(regexString) {
    try {
        const regex = new RegExp(regexString);
        let password = '';
        const possibleChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]\:;?><,./-=';

        const match = regexString.match(/\{(\d+),?(\d*)\}/);
        if (match) {
            const minLength = parseInt(match[1]);
            const maxLength = match[2] ? parseInt(match[2]) : minLength;
            const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;

            for (let i = 0; i < length; i++) {
                password += possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));
            }
            return password;
        } else {
            console.log("Regex not supported, needs to contain length parameters");
            return null;
        }
    } catch (error) {
        console.error('Error generating password:', error);
        return null;
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function fillInput(selector, value) {
    const element = document.querySelector(selector);
    if (element) {
        element.value = value;
    }
}

function simulateFormSubmission() {
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    const form = document.querySelector('form');
    if (form) {
        let submitButton = null;

        // Search for buttons or inputs with matching text
        const elements = form.querySelectorAll('button, input[type="submit"], input[type="button"]');
        for (const element of elements) {
            const text = (element.textContent.length > 1) ? element.textContent : element.value;
            const regex = /\b(log\s?in|sign\s?in|continue|submit|next|enter|access|authenticate|proceed|confirm|connect|get\s?started|start|join|go|authorize|validate|unlock|verify|login|signin)\b/i;
            if (regex.test(text)) {
                submitButton = element;
                break;
            }
        }

        if (submitButton) {
            // Simulate hover
            submitButton.dispatchEvent(new MouseEvent('mouseover', {
                view: window,
                bubbles: true,
                cancelable: true
            }));

            // Delay after hover
            delay(Math.floor(Math.random() * 500) + 500).then(() => {
                // Simulate mouse click
                submitButton.click();
                console.log("Simulated hover and click on submit button.");
            });

        } else {
            console.error("Submit button not found. Attempting form.submit as fallback.");
            // form.submit(); // Fallback to form.submit()
        }
    } else {
        console.error("Form not found.");
    }
}