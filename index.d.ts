import Chain from '@leofcoin/chain/chain';
import WSClient from '@leofcoin/endpoint-clients/ws';
import HttpClient from '@leofcoin/endpoint-clients/http';
type launchMode = 'direct' | 'remote';
type endpointReturns = {
    http?: string[];
    ws?: string[];
};
type clientReturns = {
    http?: HttpClient[];
    ws?: WSClient[];
};
type launchReturn = {
    chain: Chain;
    mode: launchMode;
    endpoints: endpointReturns;
    clients: clientReturns;
};
type endpointOptions = {
    port: number;
    url?: string;
};
type launchOptions = {
    network?: string;
    networkVersion?: string;
    stars: string[];
    forceRemote: boolean;
    mode?: launchMode;
    ws?: endpointOptions[] | undefined;
    http?: endpointOptions[] | undefined;
};
/**
 *
 * @param {object} options { ws: boolean || {url: string, port: number}, http: boolean || {url: string, port: number}, network}
 * @returns '{ mode: string, endpoints: object, chain}'
 */
declare const launch: (options: launchOptions, password: string) => Promise<launchReturn>;
export { launch as default };
