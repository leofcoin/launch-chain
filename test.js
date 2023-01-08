import launch from './index.js'

console.log(await launch({
  network: 'leofcoin:peach',
  networkVersion: 'peach'
}));