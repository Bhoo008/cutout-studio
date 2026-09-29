# Cutout Studio

An image tool that runs entirely on your own computer. Nothing is uploaded.

- **Remove background**: AI cutout, with brushes to erase or restore by hand, plus soft edge, outline and drop shadow
- **Remove objects**: paint over text, a date stamp, a blemish or an object and AI fills the spot (MI-GAN)
- **Crop, rotate, flip**, including passport and social-media shapes
- **Resize**, **watermark** (text and/or logo), **compress** to a maximum file size
- **Convert** between PNG, JPEG, WebP, AVIF and ICO; opens HEIC photos from iPhones
- **Batch** many images into one ZIP
- **Undo and redo**

## Use it

Double-click **`start.bat`**. Your browser opens at http://localhost:8420. Keep the black window open while you work, and close it to stop.

Needs [Node.js](https://nodejs.org) (version 18 or newer).

## Fresh setup (new computer or after cloning)

The AI models and libraries are large, so git doesn't store them. Recreate them:

```
npm run setup
npm run build
```

## Keeping the background remover up to date

```
npm run update-model
```

This checks for a new `@imgly/background-removal` release. If one exists, it downloads only the changed model files, updates the page and rebuilds `vendor/`. Test a photo afterwards.

## Folders

| Path | What it is |
|---|---|
| `index.html` | the whole app |
| `server.mjs`, `start.bat` | local web server and launcher |
| `bgdata/` | background-removal model and runtime (downloaded) |
| `models/` | object-removal model, MI-GAN (downloaded) |
| `vendor/` | libraries and fonts for offline use (built by `npm run build`) |
| `tools/` | build, setup and update scripts |

## Licences

- Background removal uses [@imgly/background-removal](https://github.com/imgly/background-removal-js), licensed **AGPL-3.0**. Private use on your own computer is fine. Before offering this tool to other people (for example on a website), either publish this project's source code under the AGPL or buy a commercial licence from IMG.LY.
- Object removal uses [MI-GAN](https://huggingface.co/andraniksargsyan/migan), MIT licence (see `models/MIGAN-LICENSE.txt`).
- Only remove objects or watermarks from images you own or have rights to.
