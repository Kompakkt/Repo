<p align="center">
    <img src="https://github.com/Kompakkt/Assets/raw/main/repo-logo.png" alt="Kompakkt Logo" width="600">
</p>

This is the main GitHub-repository for Kompakkt, the Web Based 3D Viewer and 3D Annotation System (https://kompakkt.de), being developed at the Department for Digital Humanities, University of Cologne.

Kompakkt consists of

- the object repository (https://github.com/Kompakkt/Repo)
- the 3D Viewer and multimedia annotation application (https://github.com/Kompakkt/Viewer)
- the server (https://github.com/Kompakkt/Server)

## Requirements

- **[Bun](https://bun.sh/)** - runtime and package manager. `npm` / `yarn` / `pnpm` are **not** supported.

## Development setup

Clone the repository, then install the dependencies with Bun:

```bash
git clone https://github.com/Kompakkt/Repo
cd Repo
bun install
```

Shared code from upstream Kompakkt packages (`@kompakkt/common`, `@kompakkt/komponents`, `@kompakkt/plugins`) is pulled in automatically as git-pinned npm dependencies.

Start the Angular dev server:

```bash
bun start
```

Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

### Selecting a backend

By default the frontend talks to the public Kompakkt server at `https://kompakkt.de/`. To point the app at a different backend (e.g. a locally running Kompakkt server, or a custom instance), edit `src/environment.ts`:

```ts
export const environment = {
  viewer_url: 'https://kompakkt.de/viewer/index.html',
  server_url: 'https://kompakkt.de/server/',
};
```

Adjust `viewer_url` and `server_url` to the URLs of the services you want the frontend to use.

## Running the full stack

This repository only contains the Repo frontend. To run Repo, Viewer and Server together (with all required supporting services such as Redis, Sonic and MongoDB), use the [Kompakkt/Mono](https://github.com/Kompakkt/Mono) environment.
