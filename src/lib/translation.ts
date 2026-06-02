export function hasArabicCharacters(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text)
}

export async function translateText(text: string, from: string, to: string): Promise<string> {
  if (!text || !text.trim()) return ''
  
  let processedText = text.trim()
  if (from === 'ar') {
    // Pre-process: Replace dialect "كفرات" / "كفر" with standard Arabic so translation API understands them
    processedText = processedText.replace(/كفرات/g, 'حافظات هواتف')
    processedText = processedText.replace(/كفر/g, 'حافظة هاتف')
  }

  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(processedText)}&langpair=${from}|${to}&de=info@souveniral.com`
    )
    if (res.ok) {
      const data = await res.json()
      const translated = data.responseData?.translatedText
      if (translated) {
        let resultText = translated.trim()
        if (to === 'ar') {
          // Post-process: Convert standard Arabic back to dialect "كفرات" / "كفر" matching the store's branding
          resultText = resultText.replace(/(حافظات الهواتف|حافظات هواتف|أغطية الهواتف|أغطية هواتف)/g, 'كفرات')
          resultText = resultText.replace(/(حافظة الهاتف|حافظة هاتف|غطاء الهاتف|غطاء هاتف)/g, 'كفر')
        }
        return resultText
      }
    }
  } catch (err) {
    console.error('Translation error:', err)
  }
  return text // fallback to original on failure
}

export async function autoTranslatePayload<T extends Record<string, any>>(payload: T): Promise<T> {
  const result: any = { ...payload }

  // 1. Auto translate name fields if equal or one is missing
  const nameAr = result.name_ar
  const nameTr = result.name_tr
  
  if (nameAr && nameTr && nameAr === nameTr) {
    const isAr = hasArabicCharacters(nameAr)
    if (isAr) {
      result.name_tr = await translateText(nameAr, 'ar', 'tr')
    } else {
      result.name_ar = await translateText(nameTr, 'tr', 'ar')
    }
  }

  // 2. Auto translate description fields if equal or one is missing
  const descAr = result.description_ar
  const descTr = result.description_tr

  if (descAr && descTr && descAr === descTr) {
    const isAr = hasArabicCharacters(descAr)
    if (isAr) {
      result.description_tr = await translateText(descAr, 'ar', 'tr')
    } else {
      result.description_ar = await translateText(descTr, 'tr', 'ar')
    }
  }

  return result
}
