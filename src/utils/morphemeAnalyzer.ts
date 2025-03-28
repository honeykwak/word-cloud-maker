// 언어별 기본 규칙
const patterns = {
  ko: [
    /(이|가|을|를|의|에|로|와|과|나|이나|든지)$/,  // 조사
    /(다|요|까|네|죠|군요|습니다|입니다)$/,        // 어미
    /(하다|되다|시키다|당하다|스럽다)$/            // 접미사
  ],
  fr: [
    /^(le|la|les|un|une|des|l'|d'|de|du)[\s-]/i,
    /^(mon|ton|son|ma|ta|sa|mes|tes|ses|notre|votre|leur|nos|vos|leurs)[\s-]/i,
    /^(à|de|en|dans|sur|sous|par|pour|avec|sans|chez|entre|derrière|devant)[\s-]/i,
    /^(je|tu|il|elle|nous|vous|ils|elles|me|te|se|lui|leur)[\s-]/i,
    /^(suis|es|est|sommes|êtes|sont|ai|as|a|avons|avez|ont)[\s-]/i,
    /(ment|tion|sion|ence|ance|ité|té|isme|age|eur|euse|eux|euse|if|ive)$/i
  ]
};

export async function analyzeMorphemes(text: string, language: string): Promise<string[]> {
  try {
    switch (language) {
      case 'en':
        return text.toLowerCase()
          .split(/[\s,.!?;:""''()\[\]{}|\/\\]+/)
          .map(word => word.trim())
          .filter(word => word.length >= 2 && /^[a-z]+$/i.test(word));

      case 'fr':
        return text.toLowerCase()
          .split(/[\s,.!?;:«»""''()\[\]{}|\/\\]+/)
          .map(word => {
            let processed = word;
            patterns.fr.forEach(pattern => {
              processed = processed.replace(pattern, '');
            });
            return processed;
          })
          .filter(word => 
            word.length >= 2 && 
            /^[a-zàâäéèêëîïôöùûüÿçæœ]+$/i.test(word)
          );

      case 'ko':
        const words = text.split(/\s+/);
        const result: string[] = [];

        const isValid = {
          ko: (w: string) => /^[가-힣]+$/.test(w)
        };

        words.forEach(word => {
          let processed = word;
          patterns[language]?.forEach(pattern => {
            processed = processed.replace(pattern, '');
          });

          if (processed.length >= 2 && isValid[language](processed)) {
            result.push(processed);
          }
        });

        return result;

      default:
        return text.split(/\s+/);
    }
  } catch (error) {
    console.error('Morpheme analysis failed:', error);
    return text.split(/\s+/);
  }
} 