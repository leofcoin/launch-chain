import Node from '@leofcoin/chain/node'
import Chain from '@leofcoin/chain/chain'
import nodeConfig from '@leofcoin/lib/node-config'
import wsServer from '@leofcoin/endpoints/ws'
import httpServer from '@leofcoin/endpoints/http'

/**
 * 
 * @param {string} url 
 * @param {string} networkVersion network/testnet-network sepperate by -
 * @returns Promise(boolean)
 */
const hasHttp = async (url, networkVersion) => {
  try {
    await fetch(url + '/network')
    return true
  } catch (error) {
    return false
  }
}

const tryWs = (url, networkVersion) => new Promise(async (resolve, reject) => {
  try {
    const socket = await new WebSocket(url, networkVersion)
    socket.onerror = () => resolve(false)
    if (socket.readyState === 1) socket.close()
    resolve(true)
  } catch (error) {
    reject(error)
  }
})

/**
 * 
 * @param {string} url 
 * @param {string} networkVersion network/testnet-network sepperate by -
 * @returns Promise(boolean)
 */
const hasWs = async (url, networkVersion) => {
  try {
    await tryWs(url, networkVersion)
    return true
  } catch (error) {
    return false
  }
}

/**
 * 
 * @param {string} httpURL 
 * @param {string} wsURL 
 * @param {string} networkVersion 
 * @returns Promise({http: boolean, ws: boolean})
 */
const hasClient = async (httpURL, wsURL, networkVersion) => {
  const ws = await hasWs(wsURL, networkVersion)
  const http = await hasHttp(httpURL, networkVersion)
  return {http, ws}
}

// chain is undefined when mode is remote
// endpoints contain urls to connect to the desired remote
// when mode is remote means an instance is already running
// when mode is direct means chain is directly available and no endpoint is needed to interact with it
/**
 * 
 * @param {object} options { ws: boolean || {url: string, port: number}, http: boolean || {url: string, port: number}, network}
 * @returns '{ mode: string, endpoints: object, chain}'
 */
const launch = async (options = {ws, http, network: 'leofcoin:peach'}) => {
  if (!options) options = {}
  if (!options.network) options.network = 'leofcoin:peach'
  if (options.ws === undefined) options.ws = { port: 4040 }
  if (options.http === undefined) options.http = { port: 8080 }
  if (options.networkVersion === undefined) options.networkVersion = options.network.replace(':', '-')

  if (options.http?.port && !options.http.url) options.http.url = `http://localhost:${options.http.port}`
  if (options.ws?.port && !options.ws.url) options.ws.url = `ws://localhost:${options.ws.port}`

  const clients = await hasClient(options.http.url, options.ws.url, options.networkVersion)
  let endpoints
  let chain
  let mode

  if (clients) {
    Object.entries(clients).forEach(([key, value]) => {
      if (value) endpoints[key] = options[key].url      
    })
    mode = 'remote'
  } else {    
    await new Node({ network })
    await nodeConfig({ network })

    chain = await new Chain()

    if (ws) {
      await wsServer(chain, options.ws.port, options.networkVersion)
      endpoints.ws = options.ws.url
    }
    if (http) {
      await httpServer(chain, options.http.port, options.networkVersion)
      endpoints.http = options.http.url
    }
    mode = 'direct'
  }
  return {
    chain,
    mode,
    endpoints
  }
}

export { launch as default}