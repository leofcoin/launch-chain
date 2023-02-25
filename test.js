import launch from './index.js'

const {chain, endpoints, clients, mode } = await launch({
  network: 'leofcoin:peach',
  networkVersion: 'peach',
  forceRemote: true,
  ws: [{ url:'wss://ws-remote.leofcoin.org'}],
  http: [{ url: 'https://remote.leofcoin.org' }]
})
console.log(await clients.ws[0].client.networkStats());