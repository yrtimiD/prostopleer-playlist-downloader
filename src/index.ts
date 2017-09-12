import * as colors from "colors/safe";

import { PleerApi } from "./pleer-api";
import { Downloader, ILogger, Mode } from "./downloader";


class ColorLog implements ILogger {
	public v(s: string) { console.log(colors.gray(s)); }
	public i(s: string) { console.log(colors.white(s)); }
	public w(s: string) { console.log(colors.yellow(s)); }
	public e(s: string) { console.log(colors.red(s)); }
}


if (process.argv.length < 3) {
	console.log("Usage: node index.js <SID>");
	process.exit(1);
} else {
	let api: PleerApi = new PleerApi(process.argv[2]);
	let log = new ColorLog();
	let downloader = new Downloader(api, log);
	downloader.start(Mode.Download);
}
