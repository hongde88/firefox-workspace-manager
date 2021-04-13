# A Workspace Manager Extension for Firefox

Let's group your tabs into workspaces to navigate through tabs more efficiently.

This extension utilizes tab show and hide APIs so giving it a permission to keep tabs hidden is required.

## Features

1. Tabs are grouped into a workspace.

2. New tabs are added to the current workspace automatically.

3. Create a new workspace.

4. Tabs in other workspaces are hidden under hidden tabs.

5. If multiple windows are open, each one has its own list of workspaces.

6. Rename a workspace by either clicking on a rename/pen button, or double clicking on the workspace name.

7. Rename a workspace by typing it out and hitting enter, or just clicking away from it.

## Screenshots

Workspace manager extension UI<br/>
![workspace-list](https://raw.githubusercontent.com/hongde88/firefox-workspace-manager/master/screenshots/wsp_icon.png)

Hidden tab notification after a workspace is created<br/>
![hidden-tab-notification](https://raw.githubusercontent.com/hongde88/firefox-workspace-manager/master/screenshots/wsp_hidden_tabs_notification.png)

A list of workspaces in the current window<br/>
![another-workspace-list](https://raw.githubusercontent.com/hongde88/firefox-workspace-manager/master/screenshots/wsp_list.png)

A warning alert popup when renaming a workspace to an existing name<br/>
![rename-workspace](https://raw.githubusercontent.com/hongde88/firefox-workspace-manager/master/screenshots/wsp_rename.png)

A danger confirm popup when deleting a workspace<br/>
![delete-workspace](https://raw.githubusercontent.com/hongde88/firefox-workspace-manager/master/screenshots/wsp_delete.png)

A danger confirm popup when attempting to delete the last workspace<br/>
![delete-last-workspace](https://raw.githubusercontent.com/hongde88/firefox-workspace-manager/master/screenshots/wsp_delete_last.png)

## Improvements

[x] Send a tab to another workspace by right clicking the tab and choosing which workspace to send it to.

[ ] Save and load workspaces.

[ ] Smoothness in hiding and show tabs between workspace switches.

[ ] Support for commands/shortcuts to open and navigate through the list of workspaces.

## Issues and Feature Requests

1. Please report any issue by creating an issue with a label of **bug**.

2. Please make a feature request by creating an issue with a label of **enhancement**.

## Acknowledgements

This extension was inspired by [Tab Workspaces](https://addons.mozilla.org/en-US/firefox/addon/tab-workspaces) which is highly served as references for some of the design and functionality.

A special thank to [superawdi](https://github.com/superawdi) for an awesome Alert and Confirm [plugin](https://github.com/superawdi/Fnon).