<p align="center">
    <img src="https://github.com/DH-Cologne/Kompakkt.Repo/raw/master/src/assets/kompakkt-logo.png" alt="Kompakkt Logo" width="350">
</p>

This is the main GitHub-repository for Kompakkt, the Web Based 3D Viewer and 3D Annotation System https://kompakkt.de, being developed at the Department for Digital Humanities, University of Cologne. 

Kompakkt consists of
- the object repository Kompakkt.Repo (https://github.com/Kompakkt/Repo)
- the 3D Viewer and multimedia annotation application Kompakkt.Viewer (https://github.com/Kompakkt/Viewer)
- the server Kompakkt.Server (https://github.com/Kompakkt/Server)

## Development setup

In order to setup your own development environment, you have to have [NodeJS](https://nodejs.org/en/) as well as Node Package Manager ([NPM](https://www.npmjs.com/)) installed.

Clone this repository, cd to the project directory and run the following commands:

```
$ git clone https://github.com/Kompakkt/Common.git src/common
$ npm i
$ ng serve
```

Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Testing

Run ```npm run e2e``` or ```npm run e2e-gui``` for e2e testing.  
