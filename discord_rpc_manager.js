"use strict"

const RPC = require("discord-rpc");

const application_id = "969862085976670218"; //media_player application

function DiscordRPCManager() {
	let client;

	const _createClient = async () => {
		if(client) client.destroy();
		client = new RPC.Client({ transport: "ipc" });
		client.on("ready", () => this.setMetadata());
		client.on("disconnected", () => _createClient());
		try {
			await client.login({ clientId: application_id });
		} catch(e) {
			console.trace(e);
			_createClient();
		}
	};

	this.setMetadata = async (metadata) => {
		if(metadata) {
			try {
				await client.setActivity({
					details: `├ ${metadata.playlist_path_monospace}`.slice(0, 128),
					state: `└─ ${metadata.track_monospace}`.slice(0, 128),
					largeImageKey: metadata.icon_url,
				});
			} catch(e) {
				console.trace(e);
				_createClient();
			}
			return;
		}

		try {
			await client.setActivity();
		} catch {
			_createClient();
		}
	};

	_createClient();
}

module.exports = new DiscordRPCManager();
