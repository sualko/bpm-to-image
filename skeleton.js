// viewer instance, lazily initialized
let viewers = {};

let currentViewerType;

class DmnPromisfied {
    constructor(options) {
        this.dmn = new DmnJS(options);
    }

    on(name, cb) {
        this.dmn.on(name, cb);
    }

    get(key) {
        return this.dmn.getActiveViewer().get(key);
    }

    importXML(xml) {
        return new Promise((resolve, reject) => {
            this.dmn.importXML(xml, function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
}

/**
 * Get or create viewer instance.
 *
 * @return {BpmnViewer}
 */
function getViewer(type) {
    if (!type) {
        if (!currentViewerType) {
            throw new Error('No open diagram');
        }

        return viewers[currentViewerType];
    }

    if (currentViewerType === type && viewers[type]) {
        return viewers[type];
    }

    if (currentViewerType && currentViewerType !== type) {
        viewers[currentViewerType].detach();

        if (viewers[type]) {
            viewers[type].attachTo('#canvas');

            currentViewerType = type;

            return viewers[type];
        }
    }

    if (type === 'dmn') {
        viewers[type] = new DmnPromisfied({
            container: '#canvas'
        });
    } else if (type === 'bpmn') {
        viewers[type] = new BpmnJS({
            container: '#canvas'
        });
    } else {
        throw new Error('Unknown viewer type: ' + type);
    }

    currentViewerType = type;

    viewers[type].on('import.done', function (event) {

        let error = event.error;
        let warnings = event.warnings;

        if (error) {
            return console.error('could not import diagram', error);
        }

        if (warnings) {
            console.log(warnings);
        }

        viewers[type]
            .get('canvas')
            .zoom('fit-viewport');
    });

    return viewers[type];
}

/**
 * Open diagram in our viewer instance.
 *
 * @param {String} xml diagram to display
 * @param {Object} [options]
 * @param {Dimensions} [options.minDimensions]
 *
 * @return {Promise<Bounds, Error>}
 */
async function openDiagram(type, xml, options) {
    // viewer instance, lazily initialized
    const viewer = getViewer(type);

    options = options || {};

    const minDimensions = options.minDimensions || {
        width: 0,
        height: 0
    };

    const title = options.title;

    const footer = options.footer;

    await viewer.importXML(xml);

    let viewbox = viewer.get('canvas').viewbox();

    // uses provided title
    let titleNode = document.querySelector('#title');

    if (title) {
        titleNode.textContent = title;
    }

    titleNode.style.display = title ? 'block' : 'none';

    let width = Math.max(viewbox.inner.width, minDimensions.width);
    let diagramHeight = Math.max(viewbox.inner.height + (footer ? 90 : 0), minDimensions.height);

    return {
        width,
        height: diagramHeight + (footer ? 0 : 90),
        diagramHeight
    };
}

/**
 * Resize to viewport
 */
async function resize() {
    const viewer = getViewer();

    let canvas = viewer.get('canvas');

    canvas.resized();

    canvas.zoom('fit-viewport');
}

async function toSVG() {
    const viewer = getViewer();

    const { svg } = await viewer.saveSVG();

    return svg;
}