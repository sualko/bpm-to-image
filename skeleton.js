// viewer instance, lazily initialized
let viewers = {};

let currentViewerType;

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
        viewers[type] = new DmnJS({
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

        // zoom to fit full viewport
        let activeViewer = viewers[type].getActiveViewer ? viewers[type].getActiveViewer() : viewers[type];

        activeViewer
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
function openDiagram(type, xml, options) {
    // viewer instance, lazily initialized
    const viewer = getViewer(type);

    options = options || {};

    const minDimensions = options.minDimensions || {
        width: 0,
        height: 0
    };

    const title = options.title;

    const footer = options.footer;

    return new Promise(function (resolve, reject) {
        viewer.importXML(xml, function (err) {

            if (err) {
                return reject(err);
            }

            let viewbox = viewer.getActiveViewer ? viewer.getActiveViewer().get('canvas').viewbox() : viewer.get(
                'canvas').viewbox();

            // uses provided title
            let titleNode = document.querySelector('#title');

            if (title) {
                titleNode.textContent = title;
            }

            titleNode.style.display = title ? 'block' : 'none';

            let width = Math.max(viewbox.inner.width, minDimensions.width);
            let diagramHeight = Math.max(viewbox.inner.height + (footer ? 90 : 0), minDimensions.height);

            let desiredViewport = {
                width,
                height: diagramHeight + (footer ? 0 : 90),
                diagramHeight
            };

            return resolve(desiredViewport);
        });
    });
}

/**
 * Resize to viewport
 */
function resize() {
    const viewer = getViewer();

    let canvas = viewer.getActiveViewer ? viewer.getActiveViewer().get('canvas') : viewer.get('canvas');

    return new Promise(function (resolve, reject) {
        canvas.resized();

        canvas.zoom('fit-viewport');

        return resolve();
    });
}

function toSVG() {
    const viewer = getViewer();

    return new Promise(function (resolve, reject) {
        viewer.saveSVG(function (err, svg) {

            if (err) {
                reject(err);
            } else {
                resolve(svg);
            }
        });
    });
}