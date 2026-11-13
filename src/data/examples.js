const exampleFiles = import.meta.glob('/content/examples/*.json', {
  eager: true,
})

function getLocalizedText(text, language) {
  const fallbackLanguage = language === 'sk' ? 'en' : 'sk'
  return text?.[language] ?? text?.[fallbackLanguage] ?? ''
}

function getExamples(language = 'sk') {
  return Object.entries(exampleFiles)
    .map(([filePath, module]) => ({
      ...module.default,
      id: filePath.split('/').pop().replace(/\.json$/, ''),
    }))
    .filter((example) => example.published)
    .sort((first, second) => first.order - second.order)
    .map((example) => ({
      ...example,
      title: getLocalizedText(example.title, language),
      description: getLocalizedText(example.description, language),
      photos: (Array.isArray(example.photos) ? example.photos : []).map((photo) => ({
        src: photo.image,
        angleKey: photo.angle,
      })),
    }))
}

export default getExamples
