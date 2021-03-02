# bpm-to-image

Convert [BPMN 2.0 diagrams](https://www.omg.org/spec/BPMN/2.0) to PDF documents,
SVG or PNG files and [DMN diagrams](https://www.omg.org/spec/DMN) to PDF
documents or PNG files.


## Usage

This package exposes the `bpm-to-image` command line utility that allows you to
convert BPM diagrams to PNG and PDF documents:

```
$ node cli.js
  Convert a BPMN 2.0 or DMN diagrams to PDF, SVG or PNG images

  Usage

    $ bpm-to-image <diagramFile>:<outputConfig> ...

  Options

    diagramFile                    Path to BPM diagram (needs bpmn or dmn file extension)
    outputConfig                   List of extension or output file paths

    --min-dimensions=<dimensions>  Minimum size in pixels (<width>x<height>)

    --title=<title>                Add explicit <title> to exported image
    --no-title                     Don't display title on exported image

    --no-footer                    Strip title and logo from image

    --scale                        Scale factor for images (1)

    --disable-sandbox              Disable sandbox of Chromium

  Examples

    # export to diagram.png
    $ bpm-to-image diagram.bpmn:diagram.png

    # export diagram.png and /tmp/diagram.pdf
    $ bpm-to-image diagram.bpmn:diagram.png,/tmp/diagram.pdf

    # export with minimum size of 500x300 pixels
    $ bpm-to-image --min-dimensions=500x300 diagram.bpmn:png
```

## Embedding

You may embed [bpm-to-image](https://github.com/sualko/bpm-to-image) and use it as parts of your application:

```javascript
const {
  convertAll
} = require('bpm-to-image');

await convertAll([
  {
    input: 'diagram.bpmn',
    outputs: [
      'diagram.pdf',
      'diagram.png'
      'diagram.svg'
    ]
  }
]);
```

This renders the BPMN diagram using
[bpmn-js](https://github.com/bpmn-io/bpmn-js) and exports it to the specified
output files using [Puppeteer](https://github.com/GoogleChrome/puppeteer).


## Install

```bash
$ git clone https://github.com/sualko/bpm-to-image
$ yarn install
```


## License

MIT
