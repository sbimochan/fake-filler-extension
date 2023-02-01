/* eslint-disable no-param-reassign */

import { CreateContextMenus, GetFakeFillerOptions, GetMessage, SaveFakeFillerOptions } from "src/common/helpers";
import { MessageRequest, IProfile, IFakeFillerOptions } from "src/types";

function NotifyTabsOfNewOptions(options: IFakeFillerOptions) {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      if (tab && tab.id && tab.id !== chrome.tabs.TAB_ID_NONE) {
        chrome.tabs.sendMessage(
          tab.id,
          { type: "receiveNewOptions", data: { options } },
          () => chrome.runtime.lastError
        );
      }
    });
  });
}

function handleMessage(
  request: MessageRequest,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: any) => void
): boolean | null {
  switch (request.type) {
    case "getOptions": {
      GetFakeFillerOptions().then((result) => {
        sendResponse({ options: result });
      });
      return true;
    }

    case "setProfileBadge": {
      const profile = request.data as IProfile;
      chrome.browserAction.setBadgeText({ text: "★", tabId: sender.tab?.id });
      chrome.browserAction.setBadgeBackgroundColor({ color: "#757575", tabId: sender.tab?.id });
      chrome.browserAction.setTitle({
        title: `${GetMessage("browserActionTitle")}\n${GetMessage("matchedProfile")}: ${profile.name}`,
        tabId: sender.tab?.id,
      });
      return true;
    }

    case "clearProfileBadge": {
      chrome.browserAction.setBadgeText({ text: "", tabId: sender.tab?.id });
      return true;
    }

    case "optionsUpdated": {
      GetFakeFillerOptions().then((options) => {
        NotifyTabsOfNewOptions(options);
      });
      return true;
    }

    default:
      return null;
  }
}

if (chrome.runtime.onInstalled) {
  chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === "update") {
      try {
        if (details.previousVersion && details.previousVersion.startsWith("3.2")) {
          GetFakeFillerOptions().then((options) => {
            options.fieldMatchSettings.matchAriaLabelledBy = true;
            SaveFakeFillerOptions(options);
          });
        }
      } catch (ex: any) {
        // eslint-disable-next-line no-alert
        window.alert(GetMessage("bgPage_errorMigratingOptions", [ex.message]));
      }
    }
  });
}

chrome.runtime.onMessage.addListener(handleMessage);

chrome.browserAction.onClicked.addListener(() => {
  chrome.tabs.executeScript({
    code: "window.fakeFiller && window.fakeFiller.fillAllInputs();",
    allFrames: true,
  });
});

GetFakeFillerOptions().then((options) => {
  CreateContextMenus(options.enableContextMenu);
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === "fake-filler-all") {
    chrome.tabs.executeScript({
      code: "window.fakeFiller.fillAllInputs();",
      allFrames: true,
    });
  }
  if (info.menuItemId === "fake-filler-form") {
    chrome.tabs.executeScript({
      code: "window.fakeFiller.fillThisForm();",
      allFrames: true,
    });
  }
  if (info.menuItemId === "fake-filler-input") {
    chrome.tabs.executeScript({
      code: "window.fakeFiller.fillThisInput();",
      allFrames: true,
    });
  }
});

chrome.commands.onCommand.addListener((command) => {
  if (command === "fill_all_inputs") {
    chrome.tabs.executeScript({
      code: "window.fakeFiller.fillAllInputs();",
      allFrames: true,
    });
  }
  if (command === "fill_this_form") {
    chrome.tabs.executeScript({
      code: "window.fakeFiller.fillThisForm();",
      allFrames: true,
    });
  }
  if (command === "fill_this_input") {
    chrome.tabs.executeScript({
      code: "window.fakeFiller.fillThisInput();",
      allFrames: true,
    });
  }
});
