<p align="center">
    <img src="https://github.com/Kompakkt/Assets/raw/main/repo-logo.png" alt="Kompakkt Logo" width="600">
</p>

This is the main GitHub-repository for Kompakkt, the Web Based 3D Viewer and 3D Annotation System https://kompakkt.de, being developed at the Department for Digital Humanities, University of Cologne.

Kompakkt consists of

- the object repository Kompakkt.Repo (https://github.com/Kompakkt/Repo)
- the 3D Viewer and multimedia annotation application Kompakkt.Viewer (https://github.com/Kompakkt/Viewer)
- the server Kompakkt.Server (https://github.com/Kompakkt/Server)

## Development setup

In order to setup your own development environment, you need a NodeJS runtime:

- [Bun](https://bun.sh/) used by the development team.
- [NodeJS](https://nodejs.org/en/) with the Node Package Manager ([NPM](https://www.npmjs.com/)) installed.

Clone this repository with submodules:

```bash
git clone -b main --recursive https://github.com/Kompakkt/Repo Repo
```

Install the dependencies:

```bash
cd Repo
bun install
# or
npm install
```

Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.
