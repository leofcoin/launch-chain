import Node from '@leofcoin/chain/node';
import Chain from '@leofcoin/chain/chain';
import nodeConfig from '@leofcoin/lib/node-config';
import WSClient from '@leofcoin/endpoint-clients/ws';
import HttpClient from '@leofcoin/endpoint-clients/http';
import networks from '@leofcoin/networks';

const defaultOptions = {
    network: 'leofcoin:peach',
    networkVersion: 'peach',
    stars: networks.leofcoin.peach.stars,
    forceRemote: false,
    mode: 'direct',
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
const getHttp = async (url, networkVersion) => {
    try {
        const client = new HttpClient(url, networkVersion);
        await client.network();
        return client;
    }
    catch (error) {
        return undefined;
    }
};
const tryWs = (url, networkVersion) => new Promise(async (resolve, reject) => {
    try {
        const socket = await new WSClient(url, networkVersion);
        await socket.init();
        resolve(socket);
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
const getWS = async (url, networkVersion) => {
    try {
        const ws = await tryWs(url, networkVersion);
        return ws;
    }
    catch (error) {
        return undefined;
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
const launch = async (options, password) => {
    if (!options)
        options = defaultOptions;
    else
        options = { ...defaultOptions, ...options };
    const clients = {
        http: [],
        ws: []
    };
    const endpoints = {
        http: [],
        ws: []
    };
    let chain;
    if (options.mode === 'remote') {
        if (options.http) {
            for (const endpoint of options.http) {
                if (endpoint.port && !endpoint.url)
                    endpoint.url = `http://localhost:${endpoint.port}`;
                const client = await getHttp(endpoint.url, options.networkVersion);
                if (client)
                    endpoints.http.push(endpoint.url) && clients.http.push(client);
            }
        }
        if (options.ws) {
            for (const endpoint of options.ws) {
                if (endpoint.port && !endpoint.url)
                    endpoint.url = `ws://localhost:${endpoint.port}`;
                const client = await getWS(endpoint.url, options.networkVersion);
                client && endpoints.ws.push(endpoint.url) && clients.ws.push(client);
            }
        }
        if (endpoints.http.length === 0 && endpoints.ws.length === 0)
            throw new Error(`no remotes connected`);
    }
    else if (options.mode === 'direct') {
        await new Node({ network: options.network, stars: options.stars, networkVersion: options.networkVersion }, password);
        await nodeConfig({ network: options.network, stars: options.stars, networkVersion: options.networkVersion });
        chain = await new Chain();
        if (options.ws) {
            const importee = await import('@leofcoin/endpoints/ws');
            const wsServer = importee.default;
            for (const endpoint of options.ws) {
                if (endpoint.port && !endpoint.url)
                    endpoint.url = `ws://localhost:${endpoint.port}`;
                await wsServer(chain, endpoint.port, options.networkVersion);
                endpoints.ws.push(endpoint.url);
                const client = await getWS(endpoint.url, options.networkVersion);
                client && clients.ws.push(client);
            }
        }
        if (options.http) {
            const importee = await import('@leofcoin/endpoints/http');
            const httpServer = importee.default;
            for (const endpoint of options.http) {
                if (endpoint.port && !endpoint.url)
                    endpoint.url = `http://localhost:${endpoint.port}`;
                await httpServer(chain, endpoint.port, options.networkVersion);
                endpoints.http.push(endpoint.url);
                const client = await getHttp(endpoint.url, options.networkVersion);
                client && clients.http.push(client);
            }
        }
    }
    else {
        await new Node({ network: options.network, stars: options.stars, networkVersion: options.networkVersion }, password);
        await nodeConfig({ network: options.network, stars: options.stars, networkVersion: options.networkVersion });
        chain = await new Chain();
        if (options.ws) {
            const importee = await import('@leofcoin/endpoints/ws');
            const wsServer = importee.default;
            for (const endpoint of options.ws) {
                if (endpoint.port && !endpoint.url)
                    endpoint.url = `ws://localhost:${endpoint.port}`;
                await wsServer(chain, endpoint.port, options.networkVersion);
                endpoints.ws.push(endpoint.url);
            }
        }
        if (options.http) {
            const importee = await import('@leofcoin/endpoints/http');
            const httpServer = importee.default;
            for (const endpoint of options.http) {
                if (endpoint.port && !endpoint.url)
                    endpoint.url = `http://localhost:${endpoint.port}`;
                await httpServer(chain, endpoint.port, options.networkVersion);
                endpoints.http.push(endpoint.url);
            }
        }
    }
    return {
        chain,
        mode: options.mode,
        endpoints,
        clients
    };
};

export { launch as default };
