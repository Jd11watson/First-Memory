export const FRIENDS = [
  { id: 'maya', name: 'Maya', colorClass: 'avatar-purple' },
  { id: 'theo', name: 'Theo', colorClass: 'avatar-blue' },
  { id: 'priya', name: 'Priya', colorClass: 'avatar-green' },
  { id: 'jordan', name: 'Jordan', colorClass: 'avatar-pink' },
  { id: 'sam', name: 'Sam', colorClass: 'avatar-orange' },
]

export function friendById(id) {
  return FRIENDS.find(f => f.id === id)
}

export function initials(name) {
  return name.slice(0, 1).toUpperCase()
}
