import placeholderImage from '../assets/home/Light.jpg'

const machines = [
  { id: 'machine1', image: placeholderImage, width: 3168, height: 1344 },
  { id: 'machine2', image: placeholderImage, width: 3168, height: 1344 },
  { id: 'machine3', image: placeholderImage, width: 3168, height: 1344 },
  { id: 'machine4', image: placeholderImage, width: 3168, height: 1344 },
]
const specNames = ['heads', 'needles', 'area', 'speed']

const productionMachines = machines.map((machine) => ({
  ...machine,
  name: `production.machines.${machine.id}.name`,
  alt: `production.machines.${machine.id}.alt`,
  description: `production.machines.${machine.id}.description`,
  specs: specNames.map((spec) => `production.machines.${machine.id}.specs.${spec}`),
}))

export default productionMachines
