const photoModules = import.meta.glob('../assets/machine/*.{jpg,jpeg,png,webp}', {
  eager: true,
  import: 'default',
  query: '?url',
})

const photoTranslations = {
  'photo-1.jpg': 'bmw',
  'photo-2.jpg': 'animal',
  'photo-3.jpg': 'adidas',
  'photo-4.jpg': 'shield',
  "photo-5.jpg": 'nike',
  'photo-6.jpg': 'shell',
}

const machinePhotos = Object.entries(photoModules)
  .sort(([firstPath], [secondPath]) =>
    firstPath.localeCompare(secondPath, undefined, { numeric: true }),
  )
  .map(([path, src]) => {
    const fileName = path.split('/').pop()
    const translationKey = photoTranslations[fileName]

    return {
      id: fileName,
      src,
      altKey: translationKey
        ? `home.gallery.photos.${translationKey}.alt`
        : 'home.gallery.defaultPhoto.alt',
      captionKey: translationKey
        ? `home.gallery.photos.${translationKey}.caption`
        : 'home.gallery.defaultPhoto.caption',
    }
  })

export default machinePhotos
