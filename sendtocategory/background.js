async function main() {
  await browser.conversionHelper.init("chrome://sendtocategory/content/ConversionHelper.jsm");

  let defaultPrefs = {
    "extensions.sendtocategory.to_address": ""
  };
  
  await preferences.setDefaults(defaultPrefs);
  await preferences.migrateFromLegacy(defaultPrefs, "");
  
  await browser.conversionHelper.notifyStartupCompleted();
}

main();
