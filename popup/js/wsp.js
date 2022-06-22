class WorkspaceUI {
  constructor() {
    this.workspaces = [];
  }

  async initialize() {
    this.workspaces.push(...await this.getWorkspaces());
    this.displayWorkspaces();
    this.handleEvents();
  }

  async getWorkspaces() {
    const currentWindowId = (await browser.windows.getCurrent()).id;

    const workspaces = await this._callBackgroundTask("getWorkspaces", { windowId: currentWindowId });

    workspaces.sort((a, b) => a.name.localeCompare(b.name));

    return workspaces;
  }

  displayWorkspaces() {
    this.workspaces.forEach(workspace => this._addWorkspace(workspace));
  }

  handleEvents() {
    document.getElementById("createNewWsp").addEventListener("click", async (e) => {
      const windowId = (await browser.windows.getCurrent()).id;
      const wspId = Date.now();
      const wspName = await this._callBackgroundTask("getWorkspaceName");

      const wsp = {
        id: wspId,
        name: wspName,
        active: true,
        tabs: [],
        windowId: windowId
      };

      // create a new workspace
      await this._callBackgroundTask("createWorkspace", wsp);

      // create a temp tab for the new workspace
      // this would be added to the workspace in the background script
      const tempTab = await browser.tabs.create({
        active: true,
        windowId
      });

      // hide all other tabs from other workspaces
      await this._callBackgroundTask("hideInactiveWspTabs", { windowId });

      wsp.tabs.push(tempTab.id);
      this.workspaces.push(wsp);

      // remove previously active list item
      this._removePreviouslyActiveLi();

      this._addWorkspace(wsp);

      const isFirstTimeCreateWsp = await this._callBackgroundTask("isFirstTimeCreateWsp", { windowId });

      if (isFirstTimeCreateWsp) {
        await this._callBackgroundTask("setFirstTimeCreateWspToFalse", { windowId });
        window.close();
      }
    });

    // open extensions option page on settings icon click
    document.getElementById("openOptionsPage").addEventListener("click", () => {
      browser.runtime.openOptionsPage();
    });

  }

  async _callBackgroundTask(action, args) {
    const message = { action, ...args };

    return browser ? await browser.runtime.sendMessage(message) : null;
  }

  _isValidWorkspaceName(wspName) {
    const lis = document.getElementsByTagName("li");

    for (let i = 0; i < lis.length; i++) {
      if (lis[i].dataset.originalText === wspName) {
        return false;
      }
    }

    return true;
  }

  _createListItemAndRegisterListeners(workspace) {
    const li = document.createElement("li");
    li.classList.add("wsp-list-item");
    
    workspace.active && li.classList.add("active");

    li.dataset.wspId = workspace.id;

    const radioBox = document.createElement("input");
    radioBox.type = "radio";
    radioBox.id = `radio-${workspace.id}-id`;
    radioBox.checked = workspace.active;
    li.appendChild(radioBox);

    const span1 = document.createElement("span");
    span1.spellcheck = false;
    span1.textContent = workspace.name;
    li.appendChild(span1);

    const span2 = document.createElement("span");
    span2.classList.add("tabs-qty");
    span2.textContent = workspace.tabs.length;
    li.appendChild(span2);

    const deleteBtn = document.createElement("a");
    deleteBtn.href = "#";
    deleteBtn.classList.add("edit-btn", "delete-btn");
    li.appendChild(deleteBtn);

    const renameBtn = document.createElement("a");
    renameBtn.href = "#";
    renameBtn.classList.add("edit-btn", "rename-btn");
    li.appendChild(renameBtn);

    li.dataset.originalText = span1.textContent;

    // select a workspace
    radioBox.addEventListener("click", async (e) => {
      const lis = document.getElementsByTagName("li");

      // uncheck other boxes
      for (let i = 0; i < lis.length; i++) {
        const firstChild = lis[i].firstElementChild;
        if (firstChild.id != radioBox.id && firstChild.checked) {
          firstChild.checked = false;
          firstChild.parentElement.classList.remove("active");
        }
      }

      li.classList.add("active");

      // activate this workspace
      await this._callBackgroundTask("activateWorkspace", { wspId: workspace.id, windowId: workspace.windowId });
    });

    // rename a workspace by double clicking
    li.addEventListener("dblclick", (e) => {
      // make it editable
      span1.contentEditable = true;

      // focus and move cursor to the end of span
      span1.focus();
      document.execCommand("selectAll", false, null);
      document.getSelection().collapseToEnd();

      span1.addEventListener("keydown", async (e) => {
        if (span1.textContent.length === 0) {
          return;
        }

        if (e.key === "Enter") {
          e.preventDefault();
          
          if (span1.textContent.length > 0 && span1.textContent !== li.dataset.originalText) {
            const wspName = span1.textContent;

            if (!this._isValidWorkspaceName(wspName)) {
              // alert(`${wspName} already exists!!! Please choose another name!!!`);
              Fnon.Alert.Warning(`${wspName} already exists!!! Please choose another name!!!`, "Warning", "OK");
              span1.textContent = li.dataset.originalText;
              return;
            }

            const wspId = li.dataset.wspId;
            li.dataset.originalText = wspName;
            // rename a workspace
            await this._callBackgroundTask("renameWorkspace", { wspId, wspName });
          } else {
            span1.textContent = li.dataset.originalText;
          }

          span1.contentEditable = false;
          span1.blur();
        }
      });

      span1.addEventListener("blur", async (e) => {
        if (span1.textContent.length > 0 && span1.textContent !== li.dataset.originalText) {
          const wspName = span1.textContent;

          if (!this._isValidWorkspaceName(wspName)) {
            // alert(`${wspName} already exists!!! Please choose another name!!!`);
            Fnon.Alert.Warning(`${wspName} already exists!!! Please choose another name!!!`, "Warning", "OK");
            span1.textContent = li.dataset.originalText;
            return;
          }

          const wspId = li.dataset.wspId;
          li.dataset.originalText = wspName;
          // rename a workspace
          await this._callBackgroundTask("renameWorkspace", { wspId, wspName });
        } else {
          span1.textContent = li.dataset.originalText;
        }
      });
    });

    // rename a workspace by clicking on the rename button
    renameBtn.addEventListener("click", (e) => {
      // make it editable
      span1.contentEditable = true;

      // focus and move cursor to the end of span
      span1.focus();
      document.execCommand("selectAll", false, null);
      document.getSelection().collapseToEnd();

      span1.addEventListener("keydown", async (e) => {
        if (span1.textContent.length === 0) {
          return;
        }

        if (e.key === "Enter") {
          e.preventDefault();
          
          if (span1.textContent.length > 0 && span1.textContent !== li.dataset.originalText) {
            const wspName = span1.textContent;

            if (!this._isValidWorkspaceName(wspName)) {
              // alert(`${wspName} already exists!!! Please choose another name!!!`);
              Fnon.Alert.Warning(`${wspName} already exists!!! Please choose another name!!!`, "Warning", "OK");
              span1.textContent = li.dataset.originalText;
              return;
            }

            const wspId = li.dataset.wspId;
            li.dataset.originalText = wspName;
            // rename a workspace
            await this._callBackgroundTask("renameWorkspace", { wspId, wspName });
          } else {
            span1.textContent = li.dataset.originalText;
          }

          span1.contentEditable = false;
          span1.blur();
        }
      });

      span1.addEventListener("blur", async (e) => {
        if (span1.textContent.length > 0 && span1.textContent !== li.dataset.originalText) {
          const wspName = span1.textContent;

          if (!this._isValidWorkspaceName(wspName)) {
            // alert(`${wspName} already exists!!! Please choose another name!!!`);
            Fnon.Alert.Warning(`${wspName} already exists!!! Please choose another name!!!`, "Warning", "OK");
            span1.textContent = li.dataset.originalText;
            return;
          }

          const wspId = li.dataset.wspId;
          li.dataset.originalText = wspName;
          // rename a workspace
          await this._callBackgroundTask("renameWorkspace", { wspId, wspName });
        } else {
          span1.textContent = li.dataset.originalText;
        }
      });
    });

    // delete a workspace
    deleteBtn.addEventListener("click", async (e) => {
      // const deleteConfirmed = confirm(`Are you sure you want to delete ${workspace.name}?`);
      const deleteConfirmed = await this._promisfyConfirm(`Are you sure you want to delete ${workspace.name}?`);

      if (!deleteConfirmed) {
        return;
      }

      const liParent = li.parentElement;

      if (liParent.childElementCount === 1) {
        // const deleteLastWspConfirmed = confirm(`Deleting the last workspace will close the window.\nDo you still want to delete ${workspace.name}?`);

        const deleteLastWspConfirmed = await this._promisfyConfirm(`Deleting the last workspace will close the window.\nDo you still want to delete ${workspace.name}?`);

        if (!deleteLastWspConfirmed) {
          return;
        }
      }

      li.parentNode.removeChild(li);
      await this._callBackgroundTask("destroyWsp", { wspId: workspace.id });

      // removing the active workspace
      if (li.classList.contains("active")) {
        // set the first child of the parent to be active
        const firstChild = liParent.children[0];
        firstChild.classList.add("active");
        firstChild.firstElementChild.checked = true;
        await this._callBackgroundTask("activateWorkspace", { wspId: firstChild.dataset.wspId });
      }
    });

    return li;
  }

  _addWorkspace(workspace) {
    const wspList = document.getElementById("wsp-list");

    const li = this._createListItemAndRegisterListeners(workspace);

    wspList.appendChild(li);

    // it could have been sorted in place while added to the list
    // however, this is easier to understand and implement
    // if performance is an issue, then switch back to sort on fly
    this._sortWorkspaces();
  }

  // from https://www.w3schools.com/howto/howto_js_sort_list.asp
  _sortWorkspaces() {
    let list, i, switching, b, shouldSwitch;

    list = document.getElementById("wsp-list");

    switching = true;

    while (switching) {
      switching = false;

      b = list.getElementsByTagName("li");

      for (i = 0; i < b.length - 1; i++) {
        shouldSwitch = false;

        if (b[i].dataset.originalText.localeCompare(b[i+1].dataset.originalText) > 0) {
          shouldSwitch = true;
          break;
        }
      }

      if (shouldSwitch) {
        b[i].parentNode.insertBefore(b[i+1], b[i]);
        switching = true;
      }
    }
  }

  _removePreviouslyActiveLi() {
    const lis = document.getElementsByClassName("active");

    for (const li of lis) {
      li.classList.remove("active");
      li.firstElementChild.checked = false;
    }
  }

  _promisfyConfirm(message) {
    return new Promise((resolve, reject) => {
      Fnon.Ask.Danger(message, "Danger", "OK", "Cancel", (result) => {
        resolve(result);
      });
    });
  }
}

const wsp = new WorkspaceUI();
wsp.initialize();