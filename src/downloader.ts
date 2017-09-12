import * as request from "request";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as readline from "readline";


import { PleerApi, IPlaylist, ITrack } from "./pleer-api";

export interface ILogger {
	v(s: string): void;
	i(s: string): void;
	w(s: string): void;
	e(s: string): void;
}

export enum Mode {
	Download,
	CreateScript
}
export class Downloader {
	constructor(private api: PleerApi, private log: ILogger) {
	}

	public start(mode: Mode) {

		this.log.i("Downloading list of playlists...");
		let playlist = this.api.getAllPlaylists()
			.then(this.selectPlaylist);


		switch (mode) {
			case Mode.CreateScript:
				{
					playlist.then(async (playlist) => {
						let baseDir = path.join(__dirname, playlist.title)
						fs.mkdirSync(baseDir);
						let scriptPath = path.join(baseDir, "script.sh");
						let script = fs.createWriteStream(scriptPath, { mode: 0o755 });

						await this.iterateTracks(playlist, (url: string, fileName: string) => {
							return new Promise((resolve, reject) => {
								script.write(`curl -L -o "${fileName}" -f ${url}\n`, (err: any) => {
									if (err) return reject(err);
									resolve();
								});
							});
						});

						script.end();
						script.close();

					});
				}
				break;
			case Mode.Download: {
				playlist.then((playlist) => {
					this.iterateTracks(playlist, this.downloadTrack);
				});
			}
				break;
		}
	}

	selectPlaylist(playlists: IPlaylist[]): Promise<IPlaylist> {
		return new Promise((resolve, reject) => {
			const rl = readline.createInterface({
				input: process.stdin,
				output: process.stdout
			});

			for (let i = 0; i < playlists.length; i++) {
				rl.write(`${i} ${playlists[i].title} (${playlists[i].countTracks})${os.EOL}`);
			}

			rl.question("Select playlist number: ", (answer) => {
				let index = parseInt(answer, 10);
				let playlist = playlists[index];
				this.log.v(`Selected playlist: ${playlist.title}`);

				rl.close();
				resolve(playlist);
			});
		});
	}

	async iterateTracks(playlist: IPlaylist, handleTrack: (url: string, fileName: string, playlistName: string, track: ITrack) => Promise<any>) {
		return new Promise(async (resolve, reject) => {
			let skipped: number = 0;
			let handled: number = 0;
			for (let track of playlist.tracks) {
				let fileName = track.artist + " - " + track.track + path.extname(track.file);
				fileName = fileName.replace(/\//g, "_");

				this.log.v(`Processing ${fileName} (${track.file})...`);
				try {
					await handleTrack(track.file, fileName, playlist.title, track);
					handled++;
				} catch (error) {
					skipped++;
					this.log.e(error);
				}
			}
			this.log.i(`Handled ${handled}, skipped ${skipped}`);
			this.log.i("Done.");
			resolve();
		});
	}

	downloadTrack(url: string, fileName: string, playlistName: string, track: ITrack): Promise<void> {
		let saveFileName = path.join(__dirname, playlistName, fileName);
		this.log.v(`Saving to ${saveFileName}`);

		try {
			let fileStat = fs.statSync(saveFileName);
			if (fileStat) {
				if (fileStat.size != track.size) {
					this.log.w("Exists but different size. Skipping.");
				} else {
					this.log.v("Already exists.");
				}

				return Promise.reject("Skipped");
			}
		} catch (error) {
			//file doesn't exists
		}

		return new Promise((resolve, reject) => {
			this.log.v(`Downloading ${url}...`);
			request.get(url)
				.on("response", (response: request.RequestResponse) => {
					this.log.v(`Got ${response.statusCode} ${response.headers["content-type"]}`);
					if (response.headers["content-type"].toString().startsWith("text")) {
						reject("No binary data returned.");
						return;
					}
					response.on("end", () => this.log.v("Finished downloading."));
					response.pipe(fs.createWriteStream(saveFileName))
						.on("finish", () => {
							this.log.v("Finished writing to the file.");
							resolve();
							return;
						});
				})
				.on("error", reject);
		});
	}

}