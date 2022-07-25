export function formatDuration(time: number): string {
  const roundedTime = Math.round(time)
  const hours = Math.floor(roundedTime / 3600)
  const minutes = Math.floor(roundedTime / 60) % 60
  const seconds = roundedTime % 60

  let formattedTime = ''
  if (hours > 0) formattedTime += `${('0' + hours).slice(-2)}:`
  formattedTime += `${('0' + minutes).slice(-2)}:${('0' + seconds).slice(-2)}`

  return formattedTime
}