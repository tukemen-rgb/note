export function JsonLd() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Kashikin",
    "alternateName": "貸金業務取扱主任者 対策アプリ",
    "description": "貸金業務取扱主任者資格試験の問題演習・過去問対策アプリ。2019年〜2025年の過去問を収録。スマホで手軽に学習でき、間違えた問題の復習やブックマーク機能で効率的に合格を目指せます。",
    "url": "https://kashikin.app",
    "applicationCategory": "EducationalApplication",
    "operatingSystem": "Web, iOS, Android",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "JPY"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "100"
    },
    "author": {
      "@type": "Organization",
      "name": "Kashikin"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Kashikin",
      "logo": {
        "@type": "ImageObject",
        "url": "https://kashikin.app/icon-512.png"
      }
    },
    "inLanguage": "ja",
    "isAccessibleForFree": true,
    "keywords": "貸金業務取扱主任者,貸金業務取扱主任者試験,過去問,問題集,資格試験,金融資格"
  };

  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "貸金業務取扱主任者とは？",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "貸金業務取扱主任者は、貸金業法に基づく国家資格です。貸金業を営む事業所には、一定数の貸金業務取扱主任者を配置することが義務付けられています。"
        }
      },
      {
        "@type": "Question",
        "name": "Kashikinアプリの特徴は？",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "2019年〜2025年の過去問を収録し、スマホで手軽に学習できます。間違えた問題の復習機能やブックマーク機能で効率的に合格を目指せます。"
        }
      },
      {
        "@type": "Question",
        "name": "アプリの利用料金は？",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Kashikinは無料でご利用いただけます。アカウント登録後、すべての問題にアクセスできます。"
        }
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
    </>
  );
}
