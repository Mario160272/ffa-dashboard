type Props = {
  name: string
  prenom?: string
  photo?: string | null
  size?: number
}

export default function PlayerAvatar({ name, prenom, photo, size = 40 }: Props) {
  const initials = (prenom?.[0] ?? '') + (name?.[0] ?? '')
  const style = {
    width: size,
    height: size,
    fontSize: Math.max(10, size * 0.38),
  }
  if (photo) {
    return (
      <img
        src={`/players/${photo}`}
        alt={`${prenom ?? ''} ${name}`}
        className="rounded-full object-cover border border-black/10 bg-[#F5F5F5]"
        style={style}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = 'none'
        }}
      />
    )
  }
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-white"
      style={{ ...style, background: '#500515' }}
    >
      {initials.toUpperCase()}
    </div>
  )
}
