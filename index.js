import Node from '@leofcoin/chain/node';
import Chain from '@leofcoin/chain/chain';
import nodeConfig from '@leofcoin/lib/node-config';

const defaultOptions = {
    network: 'leofcoin:peach',
    networkVersion: 'peach',
    stars: ['wss://peach.leofcoin.org'],
    forceRemote: false,
    ws: [{
            port: 4040
        }],
    http: [{
            port: 8080
        }]
};
/**
 *
 * @param {string} url
 * @param {string} networkVersion network/testnet-network sepperate by -
 * @returns Promise(boolean)
 */
const hasHttp = async (url, networkVersion) => {
    try {
        await fetch(url + '/network');
        return true;
    }
    catch (error) {
        return false;
    }
};
const tryWs = (url, networkVersion) => new Promise(async (resolve, reject) => {
    try {
        const socket = await new WebSocket(url, networkVersion);
        socket.onerror = () => resolve(false);
        if (socket.readyState === 1)
            socket.close();
        resolve(true);
    }
    catch (error) {
        reject(error);
    }
});
/**
 *
 * @param {string} url
 * @param {string} networkVersion network/testnet-network sepperate by -
 * @returns Promise(boolean)
 */
const hasWs = async (url, networkVersion) => {
    try {
        await tryWs(url, networkVersion);
        return true;
    }
    catch (error) {
        return false;
    }
};
// chain is undefined when mode is remote
// endpoints contain urls to connect to the desired remote
// when mode is remote means an instance is already running
// when mode is direct means chain is directly available and no endpoint is needed to interact with it
/**
 *
 * @param {object} options { ws: boolean || {url: string, port: number}, http: boolean || {url: string, port: number}, network}
 * @returns '{ mode: string, endpoints: object, chain}'
 */
const launch = async (options) => {
    if (!options)
        options = defaultOptions;
    else
        options = { ...defaultOptions, ...options };
    const availableEndpoints = {
        http: [],
        ws: []
    };
    if (options.http) {
        for (const endpoint of options.http) {
            if (endpoint.port && !endpoint.url)
                endpoint.url = `http://localhost:${endpoint.port}`;
            if (await hasHttp(endpoint.url, options.networkVersion))
                availableEndpoints.http.push(endpoint.url);
        }
    }
    if (options.ws) {
        for (const endpoint of options.ws) {
            if (endpoint.port && !endpoint.url)
                endpoint.url = `ws://localhost:${endpoint.port}`;
            if (await hasWs(endpoint.url, options.networkVersion))
                availableEndpoints.ws.push(endpoint.url);
        }
    }
    const endpoints = {
        http: [],
        ws: []
    };
    let chain;
    let mode;
    if (availableEndpoints.http.length > 0 || availableEndpoints.ws.length > 0) {
        availableEndpoints.http.forEach(endpoint => {
            endpoints.http.push(endpoint);
        });
        availableEndpoints.ws.forEach(endpoint => {
            endpoints.ws.push(endpoint);
        });
        mode = 'remote';
    }
    else {
        if (options.forceRemote)
            throw new Error(`forceRemote was set but no remotes connected`);
        await new Node({ network: options.network, stars: options.stars, networkVersion: options.networkVersion });
        await nodeConfig({ network: options.network, stars: options.stars, networkVersion: options.networkVersion });
        chain = await new Chain();
        if (options.ws) {
            const importee = await import('@leofcoin/endpoints/ws');
            const wsServer = importee.default;
            await wsServer(chain, options.ws[0].port, options.networkVersion);
            endpoints.ws.push(options.ws[0].url);
        }
        if (options.http) {
            const importee = await import('@leofcoin/endpoints/http');
            const httpServer = importee.default;
            await httpServer(chain, options.http[0].port, options.networkVersion);
            endpoints.http.push(options.http[0].url);
        }
        mode = 'direct';
    }
    return {
        chain,
        mode,
        endpoints
    };
};

export { launch as default };
