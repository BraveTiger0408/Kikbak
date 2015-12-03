# WonderVid

An automatically generated music video top 100 of the web.

## Building

Make sure you have node, and meteor installed

```shell
node -v
meteor --version
```

Once everything is installed, open two terminal tabs for the project.

To start server go to /Server: (starts on localHost:4000)
```shell
npm install
gulp
```

To start client got to WonderVidClient: (starts on localHost:3000)
```shell
meteor
```

Navigate to http://localhost:5000/videosList to see the first 20 videos.
GET http://localhost:5000/videos for full list

Go to  http://localhost:3000/ to see UI.