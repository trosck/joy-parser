
# Joyreactor images scraper

Scraping and downloading images from Joyreactor-like sites

## Table of Contents
  - [Installation](#installation)
  - [Usage/Examples](#usageexamples)

## Installation

Just download the binary from the [latest release](!https://github.com/trosck/joyreactor-images-scraper/releases/latest) for your OS and run from any CLI

```bash
./joy-scraper-[linux|macos|win.exe]
```
    
## Usage/Examples
*all examples uses **joy-scraper-linux** binary, you can use any of them*

Run `./joy-scraper-linux --help` without arguments to see list of options:

```
Options: 
  -l, --link URL         Link on category to parse
  -d, --dir [STRING]     Directory to save (Default is images)
  -s, --start NUMBER     Start page(optional if page number in url)
  -t, --total [NUMBER]   Total pages(count) (Default is 1)
  -a, --all ON           Parse articles with negative rating
  -r, --reverse ON       Parse articles by date(from down to top)
  -c, --comments ON      Parse images in comments
  -k, --no-color         Omit color from output
      --debug            Show debug information
  -v, --version          Display the current version
  -h, --help             Display help and usage details
```

The directory for loading images is specified by the `dir` argument (`images` in current directory is default)

Example:
```bash
./joy-scraper-linux \
    --link 'http://joyreactor.com/tag/cats' \
    --start 322 \
    --total 5
```

