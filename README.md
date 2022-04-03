# RetroArch asset server

This is an implementation of the Online Updater Content Downloader that is built into RetroArch.  
You can use it to serve up roms from a full rom set to your devices running RetroArch.  
My use case is I have a PC with the MAME 0.78 ROM set that I want to be able to easily get select games onto my switchrooted Nintendo Switch without faffing with memory cards.  

### Start your server where your ROMs are  
![Asset Server](/resources/start.png "Asset Server")  
### Download your ROMs to your device  
![Content Downloader](/resources/asset-server.gif "Content Downloader")

## Run the server
Download the server executable for your platform from Releases
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

## Configure your RetroArch install
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

## Future plans
I'm looking to add subdirectories under Arcade like this:
* By Description
  * All - single list as per current
  * Each letter of the alphabet - Games starting with that letter
* By Date
  * All - single list sorted by date then description
  * Each Year - Games for that year
* By Manufacturer
  * All - single list sorted by manufacturer then description
  * Each Year - Games for that Manufacturer
* Just rom name - list with just the romname
