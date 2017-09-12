import * as request from "request";
//import * as fs from "fs";

export interface IResponse {
    result: boolean;
    success: boolean;
}

export interface ITrack {
    id: string;
    inListId: number;
    artist: string;
    track: string;
    length: number;
    file: string;
    link: string;
    size: number;
    bitrate: string;
}

export interface IPlaylist {
    id: string;
    title: string;
    is_my: boolean;
    file: string;
    link: string;
    countTracks: number;
    tracks: ITrack[];
}

export interface IPlaylists extends IResponse {
    playlists: IPlaylist[];
}

export class PleerApi {
    private readonly BASE_URL: string = "http://pleer.com/browser-extension";

    constructor(private readonly sid: string) {
    }

    public getAllPlaylists(): Promise<IPlaylist[]> {
        return new Promise((resolve, reject) => {
            let req = request.get(`${this.BASE_URL}/user/playlists?sid=${this.sid}`, undefined,
                function handleResponse(error: any, response: request.RequestResponse, body: any) {
                    if (response.statusCode && response.statusCode >= 400) {
                        reject(error);
                    }

                    //console.info(`Got response ${response.statusCode}`);
                    //fs.writeFileSync("playlists.json", body);

                    let playlists: IPlaylists = JSON.parse(body);
                    if (playlists.result && playlists.success) {
                        resolve(playlists.playlists);
                    } else {
                        reject(playlists);
                    }
                }
            );
        });
    }
}
