const puppeteer = require('puppeteer');
const fs = require('fs');

const {
  basename,
  relative
} = require('path');

const {
  readFileSync
} = require('fs');

const SUPPORTED_TYPES = ['dmn', 'bpmn'];


async function printDiagram(page, options) {

  const {
    input,
    outputs,
    minDimensions,
    footer,
    title = true,
    deviceScaleFactor
  } = options;

  const type = input.split('.').pop().toLowerCase();

  if (!SUPPORTED_TYPES.includes(type)) {
    console.error(`Unknown input file format: ${type}`);
    return;
  }

  const diagramXML = readFileSync(input, 'utf8');

  const diagramTitle = title === false ? false : (
    title.length ? title : basename(input)
  );

  await page.goto(`file://${__dirname}/skeleton.html`);

  const dependencies = {
    scripts: [
      relative(__dirname, require.resolve('dmn-js/dist/dmn-viewer.production.min.js')),
      relative(__dirname, require.resolve('bpmn-js/dist/bpmn-viewer.production.min.js')),
    ],
    stylesheets: [
      relative(__dirname, require.resolve('dmn-js/dist/assets/dmn-js-drd.css')),
      relative(__dirname, require.resolve('dmn-js/dist/assets/dmn-js-decision-table.css')),
      relative(__dirname, require.resolve('dmn-js/dist/assets/dmn-js-literal-expression.css')),
      relative(__dirname, require.resolve('dmn-js/dist/assets/dmn-js-shared.css')),
      relative(__dirname, require.resolve('dmn-js/dist/assets/dmn-font/css/dmn.css')),
    ],
  }

  const desiredViewport = await page.evaluate(async function (diagramXML, options) {

    const {
      dependencies,
      type,
      ...openOptions
    } = options;

    for(const script of dependencies.scripts) {
      await loadScript(script);
    }

    for(const stylesheet of dependencies.stylesheets) {
      await loadStylesheet(stylesheet);
    }

    // returns desired viewport
    return openDiagram(type, diagramXML, openOptions);
  }, diagramXML, {
    minDimensions,
    title: diagramTitle,
    footer,
    type,
    dependencies,
  });;

  page.setViewport({
    width: Math.round(desiredViewport.width),
    height: Math.round(desiredViewport.height),
    deviceScaleFactor: deviceScaleFactor
  });

  await page.evaluate(() => resize());

  for (const output of outputs) {
    if (output.endsWith('.pdf')) {
      await page.pdf({
        path: output,
        width: desiredViewport.width,
        height: desiredViewport.diagramHeight
      });
    } else if (output.endsWith('.png')) {
      await page.screenshot({
        path: output,
        clip: {
          x: 0,
          y: 0,
          width: desiredViewport.width,
          height: desiredViewport.diagramHeight
        }
      });
    } else if (output.endsWith('.svg') && type === 'bpmn') {
      const svg = await page.evaluate(() => {
        return toSVG();
      });

      fs.writeFileSync(output, svg, 'utf8');
    } else {
      console.error(`Unknown output file format: ${output}`);
    }
  }
}


async function withPage(fn, options) {
  let browser;
  const args = [];

  options = options || {};

  if (options.disableSandbox) {
    args.push('--no-sandbox');
    args.push('--disable-setuid-sandbox');
  }

  try {
    browser = await puppeteer.launch({ args });

    await fn(await browser.newPage());
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}


async function convertAll(conversions, options = {}) {

  const {
    minDimensions,
    footer,
    title,
    deviceScaleFactor,
    disableSandbox,
  } = options;

  await withPage(async function (page) {

    for (const conversion of conversions) {

      const {
        input,
        outputs
      } = conversion;

      await printDiagram(page, {
        input,
        outputs,
        minDimensions,
        title,
        footer,
        deviceScaleFactor
      });
    }

  }, { disableSandbox });

}

module.exports.convertAll = convertAll;

async function convert(input, output) {
  return await convertAll([
    {
      input,
      outputs: [output]
    }
  ]);
}


module.exports.convert = convert;
