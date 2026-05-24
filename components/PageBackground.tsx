export default function PageBackground({ imageUrl }: { imageUrl?: string }) {
  if (!imageUrl) return null

  return (
    <div className="fixed inset-0 -z-10">
      <img
        src={imageUrl}
        alt=""
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-black/75" />
    </div>
  )
}
