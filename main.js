"use strict";

const { app, BrowserWindow, Tray, nativeImage, Menu } = require("electron");
const fs = require("fs");
const fetch = require("electron-fetch").default;

const settings = require("./settings");

let discord_rpc_manager;
if(settings.discord_integration) {
	discord_rpc_manager = require("./discord_rpc_manager");
}

function saveSettings(window) {
	const url = new URL(window.webContents.getURL());
	fs.writeFileSync(settings.save_searchstr_to, url.search);
}

app.whenReady().then(() => {
	let previous_query = "";
	try {
		previous_query = fs.readFileSync(settings.save_searchstr_to, {encoding: "utf8"}).trim();
	} catch {}

	const url = new URL(settings.site);
	url.search = previous_query;
	for(const [key, value] of Object.entries(settings.parameters)) {
		if(key === "playlists" && value.length) {
			url.searchParams.delete("playlist");
			for(const x of value) {
				url.searchParams.append("playlist", x);
			}
			continue;
		}
		if(value !== undefined) url.searchParams.set(key, value);
	}

	const window = new BrowserWindow({
		width: 800,
		height: 600,
		title: "𝚖𝚎𝚍𝚒𝚊_𝚙𝚕𝚊𝚢𝚎𝚛"
	});
	window.setMenu(null);
	window.loadURL(url.toString());
	window.setIcon("icon.png");

	const tray = new Tray("icon.png");
	const contextMenu = Menu.buildFromTemplate([
		{ label: 'Open media_player', click: (menuItem, browserWindow, event) => window.show() },
		//{ label: 'Item2', type: 'radio' }
	]);
	tray.setContextMenu(contextMenu);

	window.on("close", () => {
		saveSettings(window);
	});

	window.webContents.on("page-favicon-updated", async (event, favicons) => {
		if(favicons.length < 1) return;
		try {
			const buffer = await (await fetch(favicons[0])).buffer();
			const image = nativeImage.createFromBuffer(buffer);
			window.setIcon(image);
			tray.setImage(image);
		} catch(e) {
			console.trace(e);
		}
	});

	setInterval(() => saveSettings(window), 10000);
	if(discord_rpc_manager) {
		setInterval(async () => {
			const metadata = await window.webContents.executeJavaScript("window.metadata");
			discord_rpc_manager.setMetadata(metadata);
		}, 2000);
	}
});
