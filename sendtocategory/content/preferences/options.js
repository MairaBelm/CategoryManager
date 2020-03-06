async function main() {
  await locales.load(document);
  await preferences.load(document);
}

window.addEventListener("load", main);
