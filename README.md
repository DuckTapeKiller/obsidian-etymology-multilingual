![Etymology Multilingual Art](https://github.com/user-attachments/assets/008aaa68-7574-475d-bf45-67277a94d044)

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/ducktapekiller)

This plugin allows you to look up the etymology of words in English, Spanish, and French directly within your Obsidian notes.

It is a fork and extension of the [Etymology Lookup](https://github.com/clairefro/obsidian-plugin-etymology-lookup) plugin by **clairefro**, which originally supported only English. This version introduces multilingual support.

## Features

* **Multilingual Support**: look up word origins in English, Spanish, and French.
* **Contextual Search**: Highlight a word and run the command to fetch its history.
* **Clipboard Integration**: Click an entry to copy the definition to your clipboard.

## Data Sources

This plugin fetches data from the following online dictionaries (internet connection required):

### English
* **Online Etymology Dictionary** (Douglas Harper).

### Spanish
In Spanish, the plugin retrieves results from:
* **Diccionario de la Real Academia Española (RAE)**.
* **Diccionario Etimológico de Chile**.

### French
* Includes support for French etymology lookups.

## How to use

1.  **Highlight** a word (or part of a word) in your active note.
2.  Open the Command Palette (`Ctrl/Cmd + P`).
3.  Run the command **“Etymology Multilingual: Lookup”**.
4.  The results will appear in a modal window.
5.  (Optional) Click an entry to copy it to the clipboard.

## Installation

### Manual Installation
1.  Download the latest release from the GitHub Releases page.
2.  Extract `main.js`, `manifest.json`, and `styles.css`.
3.  Place them in `.obsidian/plugins/obsidian-etymology-multilingual/`.
4.  Reload Obsidian and enable the plugin.

## Credits

* Original code and concept by [clairefro](https://github.com/clairefro).
* English data courtesy of [Etymonline](https://www.etymonline.com).
* Spanish data courtesy of RAE and Etimologías de Chile.
