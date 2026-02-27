import type { ProjectMemberDto } from '@repo/types'

function getInitials(name: string) {
  const parts = name.split(' ')
  return parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : name.slice(0, 2)
}

function getColor(name: string) {
  const colors = [
    'bg-red-400',
    'bg-blue-400',
    'bg-green-400',
    'bg-purple-400',
    'bg-yellow-400',
    'bg-pink-400',
    'bg-indigo-400',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

export function MemberAvatarList({
  members,
  max = 4,
}: {
  members: ProjectMemberDto[]
  max?: number
}) {
  const shown = members.slice(0, max)
  const remaining = members.length - max

  return (
    <div className="flex -space-x-2">
      {shown.map((m) => (
        <div
          key={m.id}
          title={m.user.name}
          className={`w-7 h-7 rounded-full ${getColor(m.user.name)} text-white text-xs flex items-center justify-center border-2 border-white font-medium`}
        >
          {getInitials(m.user.name).toUpperCase()}
        </div>
      ))}
      {remaining > 0 && (
        <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-600 text-xs flex items-center justify-center border-2 border-white font-medium">
          +{remaining}
        </div>
      )}
    </div>
  )
}
