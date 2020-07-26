var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
Services.scriptloader.loadSubScript("chrome://sendtocategory/content/category_tools.js", this, "UTF-8");

//###################################################
// overriding a core thunderbird function
//###################################################

// The function 'GenerateAddressFromCard' is defined at: https://dxr.mozilla.org/comm-central/source/mail/components/addrbook/content/abCommon.js#596 
// Overiding this function to fix bugs:
// 1: Also check for secondary email, if primary not present.
// 2: Do not return anything (not even the name), if no email present, so that addSelectedAddresses (https://dxr.mozilla.org/comm-central/source/mail/components/addrbook/content/abContactsPanel.js#56) does not add contacts without email.
window.GenerateAddressFromCard(card)
{
  if (!card)
    return "";

  var email;

  if (card.isMailList)
  {
    var directory = GetDirectoryFromURI(card.mailListURI);
    email = directory.description || card.displayName;
  } else {
    email = card.primaryEmail 
    if (email == "") try {email = card.getPropertyAsAString("SecondEmail");} catch (ex) {}
  }

  if (email) {
    return MailServices.headerParser.makeMimeAddress(card.displayName, email); //DEPRECATED - check how searchfox fixed it, after they fixed it.
  } else {
    return ""
  }
}

//###################################################
//adding additional functions to the local jbCatMan Object
//###################################################

/* 
  We might want some event listeners as in addressbook_overlay.js to 
  catch category modifications (via EditDialog) and update Categories 
  and members.
*/

jbCatMan.contactPanelCategoryMenuInit = function () {
  //contactPanelCategoryMenuInit is called onSelect, which is triggered once without a book selected
  let currentlySelectedAddressbook = document.getElementById('addressbookList').value;
  if (currentlySelectedAddressbook != "") {
    
    jbCatMan.scanCategories(GetSelectedDirectory());

    let menulist = document.getElementById("CatManCategoryFilterList");
    menulist.selectedItem = null;
    let itemCount = menulist.itemCount;
    for(let i = (itemCount-1); i >= 0; i-- ) menulist.getItemAtIndex(i).remove();
    
    let menupopup = document.getElementById("CatManCategoryFilterListPopup");
    let newItem = document.createElement("menuitem");
    newItem.setAttribute("label", jbCatMan.locale.placeholderText);
    newItem.setAttribute("value", "");
    menupopup.appendChild( newItem );
    
    for (let i = 0; i < jbCatMan.data.categoryList.length; i++) {
      let newItem = document.createElement("menuitem");
      newItem.setAttribute("label", "- " + jbCatMan.data.categoryList[i]);
      newItem.setAttribute("value", jbCatMan.data.categoryList[i]);
      menupopup.appendChild( newItem );
    }        
    menulist.selectedItem = menulist.getItemAtIndex(0);
    
    if (jbCatMan.data.categoryList.length == 0) {
      menulist.disabled = true;
    } else {
      menulist.disabled = false;
    }
  }
}


jbCatMan.contactPanelCategoryMenuChanged = function () {
  if (document.getElementById("CatManCategoryFilterList").value != "") {
    //get selected category
    let category = document.getElementById("CatManCategoryFilterList").value; 

    //revert selection to placeholdertext (topmost entry)
    let menulist = document.getElementById("CatManCategoryFilterList");
    menulist.selectedItem = menulist.getItemAtIndex(0);

    //apply filter
    jbCatMan.doCategorySearch([category]);

    //select all members of the selected category to save mouse clicks (if only
    //one member is to be selected, the user still has to click once as before)
    let abResultsTree = document.getElementById("abResultsTree");
    abResultsTree.view.selection.selectAll();
  }
}

//###################################################
//WindowListener API
//###################################################


// called on window load or on add-on activation while window is already open
function onLoad(wasAlreadyOpen) {
  console.log("FIRRRRRED");
  let xul = window.MozXULElement.parseXULToFragment(`
    <script class="${namespace}" type="text/javascript">
          jbCatMan.locale.prefixForPeopleSearch = "&sendtocategory.category.label;";
        jbCatMan.locale.placeholderText = "&sendtocategory.categoryfilter.label;";
    </script>
    <vbox class="${namespace}" id="results_box" flex="1">
        <vbox id="categoryfilter-box" insertafter="panel-bar">
            <separator class="thin"/>
            <hbox id="categoryfilter-panel-bar" class="toolbar" align="center" insertafter="panel-bar">
                <menulist id="CatManCategoryFilterList"
                oncommand="window.${namespace}.jbCatMan.contactPanelCategoryMenuChanged();" flex="1"
                persist="value">
                    <menupopup id="CatManCategoryFilterListPopup" writable="true"/>
                </menulist>
            </hbox>
        </vbox>
    </vbox>  
`, 
    ["chrome://sendtocategory/locale/catman.dtd"]);
    window.document.documentElement.appendChild(xul);

    document.getElementById("addressbookList").addEventListener("select", jbCatMan.contactPanelCategoryMenuInit, false);  
  }

// called on window unload or on add-on deactivation while window is still open
function onUnload(isAddOnShutDown) {
    // no need to clean up UI on global shutdown
    if (isAddOnShutDown)
        return;

    // Remove all our added elements which are tagged with a unique classname
    let elements = Array.from(window.document.getElementsByClassName(namespace));
    for (let element of elements) {
        element.remove();
    }
  }
