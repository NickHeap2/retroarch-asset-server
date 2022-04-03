# RetroArch asset server

This is an implementation of the Online Updater Content Downloader that is built into RetroArch.  
You can use it to serve up your ROMs, and their required BIOS files, from a full rom set to your devices running RetroArch.  
My use case is I have a PC with the MAME 0.78 ROM set that I want to be able to easily get select games onto my switchrooted Nintendo Switch without faffing around with memory cards.  

[![Node.js CI](https://github.com/NickHeap2/retroarch-asset-server/actions/workflows/main.yml/badge.svg?branch=main)](https://github.com/NickHeap2/retroarch-asset-server/actions/workflows/main.yml)
[![Standardjs](https://github.com/NickHeap2/retroarch-asset-server/actions/workflows/lint.yml/badge.svg?branch=main)](https://github.com/NickHeap2/retroarch-asset-server/actions/workflows/lint.yml)
[![CodeQL](https://github.com/NickHeap2/retroarch-asset-server/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/NickHeap2/retroarch-asset-server/actions/workflows/codeql-analysis.yml)

### Features
* Browse ROMs by Description, Manufacturer, ROM Name and Year
* Download your ROM plus any required BIOS to your device

### Start your server where your ROMs are  
![Asset Server](/resources/start.png "Asset Server")  
### Download your ROMs to your device  
![Content Downloader](/resources/asset-server.gif "Content Downloader")

## First Run the server
Download the server executable for your platform from https://github.com/NickHeap2/retroarch-asset-server/releases
``` text
Usage: retroarch-asset-server [options]

Options:
  -V, --version                 output the version number
  -d, --dat-file <datfile>      MAME dat file to serve
  -r, --rom-folder <romfolder>  ROM folder for roms defined in dat file
  -p, --port <port>             Port for server to listen on (default: 5050)
  -v, --verbose                 Verbose logging (default: false)
  -h, --help                    display help for command
```

### Run server on default port 5050 with required options
``` text
retroarch-asset-server --dat-file "./MAME 078.dat" --rom-folder ./roms
```

### Run server on port 6000 with verbose request logging
``` text
retroarch-asset-server --dat-file "./MAME 078.dat" --rom-folder ./roms --port 6000 --verbose
```

## Then Configure your RetroArch install
In your `retroarch.cfg` change the line below:
``` ini
core_updater_buildbot_assets_url = "http://buildbot.libretro.com/assets/"
```
to
``` ini
core_updater_buildbot_assets_url = "http://localhost:5050/assets/"
```

You can also use ngrok to allow the content downloader to work over the internet.

## The pattern that the Online Updater Content Downloader uses
The calls below are what we implement in our content downloader.

### `GET /assets/cores/.index-dirs`
This should return a \n delimited list of directories.  
For my case atm I just return Arcade.

### `GET /assets/cores/Arcade`
This has to return a 301 permanent redirect to the location /assets/cores/Arcade/.

### `GET /assets/cores/Arcade/.index`
This should return a \n delimited list of zip files.  
In our case though we return a file name with the ROM description, manufacturer and year included.  
e.g. `1943 - The Battle of Midway (US)        [Capcom 1987]--1943.zip`  
Luckily the selected file name in RetroArch has a scrolling preview if it doesn't fit on screen.

### `GET /assets/cores/Arcade/.index-dirs`
This should return a list of sub-directories.
As there currently aren't any sub-directories this returns a 404.

### `GET /assets/cores/Arcade/1943%20-%20The%20Battle%20of%20Midway%20%28US%29%20%20%20%20%20%20%20%20%5BCapcom%201987%5D--1943.zip`
This should return the zip file that is selected.  
In our case we create an in memory zip file with that name, add a directory of Arcade and add the actual `1943.zip` into that directory.  
This then gets extracted into the downloads directory in RetroArch as Arcade/1943.zip.  
We also now attach any needed bios file that the rom needs.
