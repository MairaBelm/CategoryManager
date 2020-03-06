async function getPref(aName, aFallback = null) {
  let defaultValue = await browser.storage.local.get({ ["pref.default." + aName] : aFallback });
  let value = await browser.storage.sync.get({ ["pref.value." + aName] :  defaultValue["pref.default." + aName] });
  return value["pref.value." + aName];
}

async function setPref(aName, aValue) {
  await browser.storage.sync.set({ ["pref.value." + aName] : aValue });
}

async function loadPreferences(document) {
  for (let node of document.querySelectorAll("[preference]")) {
    if (node.getAttribute("instantApply") == "true") {
      node.addEventListener("change", function (event) {savePreference(event.target);});
    }
  loadPreference(node);    
  }
}

async function savePreferences(document) {
  for (let node of document.querySelectorAll("[preference]")) {
    savePreference(node);    
  }
}

async function loadPreference(node) {
  switch (node.tagName.toLowerCase()) {
    case "input":
      node.setAttribute("value", await getPref(node.getAttribute("preference")));
      break;
  }
}

async function savePreference(node) {
  switch (node.tagName.toLowerCase()) {
    case "input":
      await setPref(node.getAttribute("preference"), node.value);
      break;
  }
}





async function loadLocales(document) {
  for (let node of document.querySelectorAll("[i18n]")) {
    let i18nId = node.getAttribute("i18n");
    // small convinient hack: if the id ends with a colon, then it is not part of the id
    // but should actually be printed
    let i18nValue = i18nId.endsWith(":") 
      ? browser.i18n.getMessage(i18nId.slice(0, -1)) + ":"
      : browser.i18n.getMessage(i18nId);
    
    switch (node.tagName.toLowerCase()) {
      case "p":
        node.innerHTML = browser.i18n.getMessage(i18nId);
        break;
    }
  }    
}




async function main() {
  await loadLocales(document);
  await loadPreferences(document);
}

window.addEventListener("load", main);
