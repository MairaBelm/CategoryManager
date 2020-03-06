async function main() {
  await preferences.setDefaults({
    "extensions.sendtocategory.to_address": ""
  });  
  console.log("to_address: " + await preferences.getPref("extensions.sendtocategory.to_address")); 
}

main();
