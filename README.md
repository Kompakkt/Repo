<p align="center">
    <img src="https://github.com/DH-Cologne/Kompakkt.Repo/raw/master/src/assets/kompakkt-logo.png" alt="Kompakkt Logo" width="350">
</p>

This is the main GitHub-repository for Kompakkt, the Web Based 3D Viewer and 3D Annotation System https://kompakkt.uni-koeln.de, being developed at the Institute for Digital Humanities, University of Cologne. 

Kompakkt consists of
- the object repository Kompakkt.Repo (https://github.com/DH-Cologne/Kompakkt.Repo)
- the 3D Viewer and multimedia annotation application Kompakkt.Viewer (https://github.com/DH-Cologne/Kompakkt.Viewer)
- the server Kompakkt.Server (https://github.com/DH-Cologne/Kompakkt.Server)

## Development setup

In order to setup your own development environment, you have to have [NodeJS](https://nodejs.org/en/) as well as Node Package Manager ([NPM](https://www.npmjs.com/)) installed.

Clone this repository, cd to the project directory and run the following commands:

```
$ npm i
$ ng serve
```

Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.
