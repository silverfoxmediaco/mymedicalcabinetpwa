/**
 * Palantir Foundry client for the Foundry bridge (docs/foundry-bridge.md §8).
 *
 * Talks to the Foundry Ontology REST API (v2) with one personal token from
 * FOUNDRY_TOKEN. Settings (names only, values live on Render):
 *   FOUNDRY_URL           e.g. https://<stack>.palantirfoundry.com
 *   FOUNDRY_TOKEN         personal Foundry token
 *   FOUNDRY_ONTOLOGY_RID  ontology RID (or API name)
 *
 * Errors thrown here never contain parameter values or the token: only the
 * HTTP status and Foundry's error name, so they are safe to store in
 * foundryRecordError and to log.
 */

const REQUEST_TIMEOUT_MS = 20000;

class FoundryError extends Error {
    constructor(message, { status = null, errorName = null } = {}) {
        super(message);
        this.name = 'FoundryError';
        this.status = status;
        this.errorName = errorName;
    }
}

const getConfig = () => {
    const missing = ['FOUNDRY_URL', 'FOUNDRY_TOKEN', 'FOUNDRY_ONTOLOGY_RID'].filter(name => !process.env[name]);
    if (missing.length) {
        throw new FoundryError(`Foundry settings missing: ${missing.join(', ')}`);
    }
    return {
        baseUrl: process.env.FOUNDRY_URL.replace(/\/+$/, ''),
        token: process.env.FOUNDRY_TOKEN,
        ontology: encodeURIComponent(process.env.FOUNDRY_ONTOLOGY_RID)
    };
};

const request = async (method, path, body) => {
    const { baseUrl, token, ontology } = getConfig();
    const url = `${baseUrl}/api/v2/ontologies/${ontology}${path}`;

    let response;
    try {
        response = await fetch(url, {
            method,
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            body: body ? JSON.stringify(body) : undefined,
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
        });
    } catch (err) {
        const reason = err.name === 'TimeoutError' ? 'timed out' : 'network error';
        throw new FoundryError(`Foundry ${method} ${reason}`);
    }

    let data = null;
    const text = await response.text();
    if (text) {
        try {
            data = JSON.parse(text);
        } catch (err) {
            data = null;
        }
    }

    if (!response.ok) {
        const errorName = data?.errorName || null;
        throw new FoundryError(
            `Foundry ${response.status}${errorName ? ` ${errorName}` : ''}`,
            { status: response.status, errorName }
        );
    }

    return data;
};

/**
 * Apply an ontology action.
 * @param {string} apiName  action API name exactly as Foundry lists it, e.g. 'save-mmc-medication'
 * @param {object} parameters  action parameters keyed by parameter id
 */
const applyAction = async (apiName, parameters) => {
    const data = await request('POST', `/actions/${encodeURIComponent(apiName)}/apply`, {
        options: { mode: 'VALIDATE_AND_EXECUTE', returnEdits: 'NONE' },
        parameters
    });

    if (data?.validation?.result === 'INVALID') {
        throw new FoundryError('Foundry action validation failed', { errorName: 'ActionValidationFailed' });
    }

    return data;
};

const actionTypeCache = new Map();

/**
 * Read an action type's definition (parameters and their data types). Cached
 * per process; the bridge uses it to find the object parameter of delete actions.
 */
const getActionType = async (apiName) => {
    if (!actionTypeCache.has(apiName)) {
        const data = await request('GET', `/actionTypes/${encodeURIComponent(apiName)}`);
        actionTypeCache.set(apiName, data);
    }
    return actionTypeCache.get(apiName);
};

/**
 * List every object linked to one object through a link type (all pages).
 * Used when a parent is re-sent, to delete child objects that are gone in Mongo (§3).
 */
const listLinkedObjects = async (objectType, primaryKey, linkType) => {
    const objects = [];
    let pageToken = null;
    do {
        const query = new URLSearchParams({ pageSize: '1000' });
        if (pageToken) query.set('pageToken', pageToken);
        const data = await request(
            'GET',
            `/objects/${encodeURIComponent(objectType)}/${encodeURIComponent(primaryKey)}/links/${encodeURIComponent(linkType)}?${query}`
        );
        objects.push(...(data?.data || []));
        pageToken = data?.nextPageToken || null;
    } while (pageToken);
    return objects;
};

module.exports = {
    FoundryError,
    applyAction,
    getActionType,
    listLinkedObjects
};
