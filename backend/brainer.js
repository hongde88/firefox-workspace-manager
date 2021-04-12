class Brainer {
  static registerListeners() {
    // initial set up when first installed
    browser.runtime.onInstalled.addListener(async (details) => {
      const currentWindow = await browser.windows.getCurrent();
      const activeWsp = await Brainer.getActiveWsp(currentWindow.id);

      if (!activeWsp) {
        const currentTabs = await browser.tabs.query({ windowId: currentWindow.id });
        const wsp = {
          id: Date.now(),
          name: Brainer.generateWspName(),
          active: true,
          tabs: [...currentTabs.map(tab => tab.id)],
          windowId: currentWindow.id
        };
  
        await Brainer.createWorkspace(wsp);
      }
    });

    // make sure we don't miss an important event of this extension
    browser.runtime.onUpdateAvailable.addListener(async (details) => {
      const currentWindow = await browser.windows.getCurrent();
      const activeWsp = await Brainer.getActiveWsp(currentWindow.id);

      if (!activeWsp) {
        const currentTabs = await browser.tabs.query({ windowId: currentWindow.id });
        const wsp = {
          id: Date.now(),
          name: Brainer.generateWspName(),
          active: true,
          tabs: [...currentTabs.map(tab => tab.id)],
          windowId: currentWindow.id
        };
  
        await Brainer.createWorkspace(wsp);
      }
    });

    browser.windows.onCreated.addListener(async (window) => {
      const wsp = {
        id: Date.now(),
        name: Brainer.generateWspName(),
        active: true,
        tabs: [],
        windowId: window.id
      };

      await Brainer.createWorkspace(wsp);
    });

    browser.windows.onRemoved.addListener(async (windowId) => {
      await WSPStorageManger.destroyWindow(windowId);
    });

    browser.tabs.onCreated.addListener(async (tab) => {
      const activeWsp = await Brainer.getActiveWsp(tab.windowId);
      
      if (activeWsp) {
        activeWsp.tabs.push(tab.id);
        await activeWsp._saveState();
      } else {
        const intervalRef = setInterval(async () => {
          const activeWsp = await Brainer.getActiveWsp(tab.windowId);
          if (activeWsp) {
            clearInterval(intervalRef);
            activeWsp.tabs.push(tab.id);
            await activeWsp._saveState();
          }
        }, 100);
      }
    });

    browser.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
      const activeWsp = await Brainer.getActiveWsp(removeInfo.windowId);
      const removedTabIdx = activeWsp.tabs.findIndex(tId => tId === tabId);
      
      if (removedTabIdx >= 0) {
        activeWsp.tabs.splice(removedTabIdx, 1);
        await activeWsp._saveState();
        if (activeWsp.tabs.length === 0) {
          await Brainer.destroyWsp(activeWsp.id);
          const nextWspId = await WSPStorageManger.getNextWspId(activeWsp.windowId);
          if (nextWspId) {
            await Brainer.activateWsp(nextWspId);
          }
        }
      }
    });
  }

  static async getWorkspaces(windowId) {
    return await Workspace.getWorkspaces(windowId);
  }

  static async createWorkspace(wsp) {
    // make other workspaces inactive first
    const activeWsp = await Brainer.getActiveWsp(wsp.windowId);

    if (activeWsp) {
      activeWsp.active = false;
      await activeWsp._saveState();
    }

    await Workspace.create(wsp.id, wsp);
  }

  static async renameWorkspace(wspId, wspName) {
    await Workspace.rename(wspId, wspName);
  }

  static async getNumWorkspaces(windowId) {
    return WSPStorageManger.getNumWorkspaces(windowId);
  }

  static async isFirstTimeCreateWsp(windowId) {
    return await WSPStorageManger.isFirstTimeCreateWsp(windowId);
  }

  static async setFirstTimeCreateWspToFalse(windowId) {
    await WSPStorageManger.setFirstTimeCreateWspToFalse(windowId);
  }

  static async hideInactiveWspTabs(windowId) {
    const workspaces = await WSPStorageManger.getWorkspaces(windowId);
    await Promise.all(workspaces.filter(wsp => !wsp.active).map(wsp => wsp.hideTabs()));
  }

  static async getActiveWsp(windowId) {
    const workspaces = await WSPStorageManger.getWorkspaces(windowId);
    const activeWsp = workspaces.find(wsp => wsp.active);
    return activeWsp;
  }

  static async destroyWsp(wspId) {
    const wsp = await WSPStorageManger.getWorkspace(wspId);
    await wsp.destroy();
  }

  static async activateWsp(wspId, windowId) {
    // make other workspaces inactive first
    const activeWsp = await Brainer.getActiveWsp(windowId);

    if (activeWsp) {
      activeWsp.active = false;
      await activeWsp._saveState();
    }

    const wsp = await WSPStorageManger.getWorkspace(wspId);
    await wsp.activate();
    await Brainer.hideInactiveWspTabs(wsp.windowId);
  }

  static generateWspName() {
    return Util.generateWspName(6);
  }
}

Brainer.registerListeners();