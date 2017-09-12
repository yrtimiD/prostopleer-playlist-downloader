# prostopleer-playlist-downloader
node.js script to download playlist from pleer.com site

To get access to the user playlists on pleer.com you need to aquire a personal SID value. It can be found in cookies after successfull login to the site.

### Usage:
```
npm install
npm run build
node dist/index.js <SID>
```

Script will get a list of available user playlists and let you select one to be downloaded. All files will be stored to the folder named after selected playlist name (no cleanup implemented yet).
