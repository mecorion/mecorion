export const courseResultTypes = {
  CORRECT: {title: "Correct", description: "Смысл передан точно", minScore: 0.86},
  MOSTLY_CORRECT: {title: "Mostly correct", description: "Основной смысл понятен", minScore: 0.76},
  PARTIALLY_CORRECT: {title: "Partially correct", description: "Часть смысла есть, но важные детали потеряны", minScore: 0.62},
  INCORRECT: {title: "Incorrect", description: "Смысл фразы не распознан", minScore: 0},
};

export const courseTopics = [
  {id: "general-english", title: "General English", parentId: null, phraseCount: 124},
  {id: "conversation", title: "Conversational English", parentId: "general-english", phraseCount: 72},
  {id: "phrasal-verbs", title: "Phrasal Verbs", parentId: "general-english", phraseCount: 96},
  {id: "wild-west", title: "Wild West", parentId: null, phraseCount: 58},
  {id: "american-english", title: "American English", parentId: null, phraseCount: 86},
  {id: "texas", title: "Texas", parentId: "american-english", phraseCount: 21},
];

export const courseChunks = [
  {id: "be-on-it", text: "be on it", meaning: "заниматься задачей или проблемой прямо сейчас"},
  {id: "make-it", text: "make it", meaning: "успеть, справиться или добраться"},
  {id: "get-out-of-here", text: "get out of here", meaning: "уйти или убраться отсюда"},
  {id: "under-control", text: "have something under control", meaning: "контролировать ситуацию"},
  {id: "lay-low", text: "lay low", meaning: "затаиться, не высовываться"},
  {id: "for-a-while", text: "for a while", meaning: "некоторое время"},
];

export const coursePhrases = [
  {
    id: "phrase-on-it",
    text: "We're on it.",
    language: "en",
    locale: "en-US",
    difficulty: "A2",
    topicIds: ["conversation", "general-english"],
    chunkIds: ["be-on-it"],
    literalTranslation: "Мы на этом.",
    naturalTranslation: "Мы уже этим занимаемся.",
    meanings: [
      {id: "meaning-on-it-1", text: "Мы уже этим занимаемся.", meaningType: "primary", priority: 1},
      {id: "meaning-on-it-2", text: "Мы уже работаем над этим.", meaningType: "alternative", priority: 2},
      {id: "meaning-on-it-3", text: "Мы этим занимаемся.", meaningType: "alternative", priority: 3},
    ],
    literalTraps: [{id: "trap-on-it-1", text: "мы на этом", explanation: "be on it здесь не про положение на объекте, а про активную работу над задачей."}],
    examples: ["I'm on it.", "Don't worry, we're on it.", "Are you on it?"],
    explanation: "be on it означает, что человек уже взял задачу в работу и занимается ей сейчас.",
  },
  {
    id: "phrase-make-it",
    text: "We ain't gonna make it in time.",
    language: "en",
    locale: "en-US",
    difficulty: "A2-B1",
    topicIds: ["conversation", "phrasal-verbs", "american-english"],
    chunkIds: ["make-it"],
    literalTranslation: "Мы не собираемся сделать это вовремя.",
    naturalTranslation: "Мы не успеем вовремя.",
    meanings: [
      {id: "meaning-make-it-1", text: "Мы не успеем вовремя.", meaningType: "primary", priority: 1},
      {id: "meaning-make-it-2", text: "Мы не успеваем.", meaningType: "alternative", priority: 2},
    ],
    literalTraps: [{id: "trap-make-it-1", text: "сделать это", explanation: "make it часто означает не «сделать это», а «успеть» или «справиться»."}],
    examples: ["Can we make it before dark?", "I don't think we'll make it.", "She made it to the station."],
    explanation: "ain't gonna примерно равно are not going to, а make it in time означает успеть вовремя.",
  },
  {
    id: "phrase-get-out",
    text: "We need to get the hell out of here.",
    language: "en",
    locale: "en-US",
    difficulty: "B1",
    topicIds: ["conversation", "wild-west"],
    chunkIds: ["get-out-of-here"],
    literalTranslation: "Нам нужно выбраться к черту отсюда.",
    naturalTranslation: "Нам надо валить отсюда.",
    meanings: [
      {id: "meaning-get-out-1", text: "Нам надо валить отсюда.", meaningType: "primary", priority: 1},
      {id: "meaning-get-out-2", text: "Нам нужно уходить отсюда.", meaningType: "alternative", priority: 2},
      {id: "meaning-get-out-3", text: "Нам нужно убираться отсюда.", meaningType: "alternative", priority: 3},
    ],
    literalTraps: [{id: "trap-get-out-1", text: "выбраться к черту", explanation: "the hell усиливает эмоцию, но не переводится буквально как место."}],
    examples: ["Get out of here!", "Let's get out of here.", "You should get out of here."],
    explanation: "get out of here передает идею срочно уйти или убраться отсюда. the hell добавляет эмоциональный оттенок.",
  },
  {
    id: "phrase-under-control",
    text: "I thought you said you had it under control.",
    language: "en",
    locale: "en-US",
    difficulty: "B1",
    topicIds: ["conversation", "business"],
    chunkIds: ["under-control"],
    literalTranslation: "Я думал, ты сказал, что имел это под контролем.",
    naturalTranslation: "Я думал, ты говорил, что всё под контролем.",
    meanings: [
      {id: "meaning-control-1", text: "Я думал, ты говорил, что всё под контролем.", meaningType: "primary", priority: 1},
      {id: "meaning-control-2", text: "Я думал, ты сказал, что контролируешь ситуацию.", meaningType: "alternative", priority: 2},
    ],
    literalTraps: [{id: "trap-control-1", text: "имел это под контролем", explanation: "В русском естественнее передавать смысл как «всё под контролем» или «контролируешь ситуацию»."}],
    examples: ["Do you have it under control?", "Everything is under control.", "She has the project under control."],
    explanation: "have something under control означает контролировать ситуацию или держать процесс в управляемом состоянии.",
  },
  {
    id: "phrase-lay-low",
    text: "We need to lay low for a while.",
    language: "en",
    locale: "en-US",
    difficulty: "B1",
    topicIds: ["wild-west", "crime", "conversation"],
    chunkIds: ["lay-low", "for-a-while"],
    literalTranslation: "Нам нужно лежать низко какое-то время.",
    naturalTranslation: "Нам нужно какое-то время не высовываться.",
    meanings: [
      {id: "meaning-lay-low-1", text: "Нам нужно какое-то время не высовываться.", meaningType: "primary", priority: 1},
      {id: "meaning-lay-low-2", text: "Нам надо некоторое время затаиться.", meaningType: "alternative", priority: 2},
      {id: "meaning-lay-low-3", text: "Нам нужно ненадолго спрятаться.", meaningType: "alternative", priority: 3},
    ],
    literalTraps: [{id: "trap-lay-low-1", text: "лежать низко", explanation: "lay low является устойчивой конструкцией: затаиться, не привлекать внимание."}],
    examples: ["Lay low until things calm down.", "He decided to lay low.", "We should lay low for a few days."],
    explanation: "lay low означает временно не привлекать внимание, а for a while задаёт длительность.",
  },
];

export const courses = [
  {
    id: "english-understanding-real-english",
    title: "English",
    subtitle: "Understanding Real English",
    description: "Курс учит понимать живые английские фразы через смысловые конструкции, контекст и практику свободного ответа.",
    status: "published",
    level: "A2-B1",
    language: "English",
    progress: 34,
    enrolled: true,
    nextLessonId: "lesson-make-it",
    sections: [
      {
        id: "section-stop-translating",
        number: "01",
        title: "Stop translating words",
        progress: 100,
        lessonIds: ["lesson-literal-translation", "lesson-chunks"],
      },
      {
        id: "section-phrasal-verbs",
        number: "02",
        title: "Phrasal verbs",
        progress: 40,
        lessonIds: ["lesson-make-it", "lesson-get-out"],
      },
      {
        id: "section-context",
        number: "03",
        title: "Contextual meanings",
        progress: 0,
        lessonIds: ["lesson-under-control"],
      },
      {
        id: "section-wild-west",
        number: "04",
        title: "Wild West",
        progress: 0,
        lessonIds: ["lesson-lay-low"],
      },
    ],
  },
  {
    id: "programming-foundation",
    title: "Programming",
    subtitle: "Foundation for Backend",
    description: "Будущий курс по базовой архитектуре backend, HTTP API, БД и доменным моделям.",
    status: "soon",
    level: "Beginner",
    language: "Русский",
    progress: 0,
    enrolled: false,
    nextLessonId: null,
    sections: [],
  },
];

export const courseLessons = [
  {
    id: "lesson-literal-translation",
    courseId: "english-understanding-real-english",
    title: "Why literal translation fails",
    sectionId: "section-stop-translating",
    progress: 100,
    duration: "12 мин",
    phraseIds: ["phrase-on-it", "phrase-under-control"],
    content: [
      {type: "intro", title: "Вступление", text: "Живой английский часто строится на конструкциях. Если переводить слово за словом, смысл ломается."},
      {type: "theory", title: "Главная идея", text: "Сначала ищите смысловой блок: be on it, make it, get out of here. Потом переводите мысль, а не отдельные слова."},
      {type: "mistake", title: "Типичная ошибка", text: "We're on it не означает «мы на этом». В живой речи это означает «мы уже этим занимаемся»."},
    ],
  },
  {
    id: "lesson-chunks",
    courseId: "english-understanding-real-english",
    title: "Understanding chunks",
    sectionId: "section-stop-translating",
    progress: 75,
    duration: "16 мин",
    phraseIds: ["phrase-on-it", "phrase-lay-low"],
    content: [
      {type: "intro", title: "Что такое chunk", text: "Chunk — это короткая конструкция, которая несёт готовый смысл и часто повторяется в разных фразах."},
      {type: "example", title: "Пример", text: "lay low = затаиться / не высовываться. Это нельзя собрать из отдельных слов lay и low."},
    ],
  },
  {
    id: "lesson-make-it",
    courseId: "english-understanding-real-english",
    title: "Understanding “make it”",
    sectionId: "section-phrasal-verbs",
    progress: 40,
    duration: "18 мин",
    phraseIds: ["phrase-make-it", "phrase-get-out"],
    content: [
      {type: "intro", title: "Вступление", text: "make it часто выглядит простым, но в контексте означает «успеть», «справиться» или «добраться»."},
      {type: "theory", title: "Как понимать", text: "Смотрите на ситуацию: время, путь, цель, риск провала. Эти признаки обычно показывают, что make it не переводится дословно."},
      {type: "example", title: "Пример", text: "We ain't gonna make it in time. Естественный смысл: мы не успеем вовремя."},
    ],
  },
  {
    id: "lesson-get-out",
    courseId: "english-understanding-real-english",
    title: "get out of here",
    sectionId: "section-phrasal-verbs",
    progress: 0,
    duration: "14 мин",
    phraseIds: ["phrase-get-out"],
    content: [
      {type: "theory", title: "Конструкция", text: "get out of here передаёт уход из места. В эмоциональной речи смысл может быть резче: «вали отсюда»."},
    ],
  },
  {
    id: "lesson-under-control",
    courseId: "english-understanding-real-english",
    title: "Context: under control",
    sectionId: "section-context",
    progress: 0,
    duration: "15 мин",
    phraseIds: ["phrase-under-control"],
    content: [
      {type: "theory", title: "Контроль ситуации", text: "have something under control означает, что ситуация понятна, управляема и не выходит из-под контроля."},
    ],
  },
  {
    id: "lesson-lay-low",
    courseId: "english-understanding-real-english",
    title: "Wild West: lay low",
    sectionId: "section-wild-west",
    progress: 0,
    duration: "17 мин",
    phraseIds: ["phrase-lay-low"],
    content: [
      {type: "theory", title: "Контекст", text: "В криминальном, приключенческом и western-контексте lay low часто означает временно не привлекать внимание."},
    ],
  },
];

export const coursePractice = {
  sessionId: "practice-demo-session",
  courseId: "english-understanding-real-english",
  lessonId: "lesson-make-it",
  mode: "Lesson Practice",
  phraseIds: ["phrase-on-it", "phrase-make-it", "phrase-get-out", "phrase-under-control", "phrase-lay-low"],
};

export function getCourseById(courseId) {
  return courses.find((course) => course.id === courseId) ?? courses[0];
}

export function getLessonById(lessonId) {
  return courseLessons.find((lesson) => lesson.id === lessonId) ?? courseLessons[0];
}

export function getPhrasesByIds(phraseIds) {
  return phraseIds.map((phraseId) => coursePhrases.find((phrase) => phrase.id === phraseId)).filter(Boolean);
}

export function getChunksByIds(chunkIds) {
  return chunkIds.map((chunkId) => courseChunks.find((chunk) => chunk.id === chunkId)).filter(Boolean);
}

export function getLessonsForSection(section) {
  return section.lessonIds.map(getLessonById).filter(Boolean);
}

export function normalizeAnswer(value) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("ru")
    .replaceAll("ё", "е")
    .replace(/[.,!?;:()[\]«»"']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasNegationMismatch(answer, expected) {
  const answerHasNegation = /\b(не|нет|никогда)\b/u.test(answer);
  const expectedHasNegation = /\b(не|нет|никогда)\b/u.test(expected);
  return answerHasNegation !== expectedHasNegation;
}

function tokenSimilarity(answer, expected) {
  const answerTokens = new Set(answer.split(" ").filter((token) => token.length > 2));
  const expectedTokens = new Set(expected.split(" ").filter((token) => token.length > 2));

  if (!answerTokens.size || !expectedTokens.size) {
    return 0;
  }

  const overlap = [...answerTokens].filter((token) => expectedTokens.has(token)).length;
  return overlap / Math.max(answerTokens.size, expectedTokens.size);
}

function resultTypeByScore(score) {
  if (score >= courseResultTypes.CORRECT.minScore) return "CORRECT";
  if (score >= courseResultTypes.MOSTLY_CORRECT.minScore) return "MOSTLY_CORRECT";
  if (score >= courseResultTypes.PARTIALLY_CORRECT.minScore) return "PARTIALLY_CORRECT";
  return "INCORRECT";
}

export function evaluatePhraseAnswer(phrase, rawAnswer) {
  const normalizedAnswer = normalizeAnswer(rawAnswer);
  const normalizedMeanings = phrase.meanings.map((meaning) => ({
    ...meaning,
    normalizedText: normalizeAnswer(meaning.text),
  }));

  const exactMeaning = normalizedMeanings.find((meaning) => meaning.normalizedText === normalizedAnswer);
  const detectedTrap = phrase.literalTraps.find((trap) => normalizedAnswer.includes(normalizeAnswer(trap.text)));

  if (exactMeaning) {
    return {
      resultType: "CORRECT",
      score: 1,
      matchedMeaningId: exactMeaning.id,
      detectedTrap: null,
      summary: "Ответ совпал с одним из допустимых естественных смыслов.",
    };
  }

  // MVP-checker имитирует каскад из ТЗ: normalizing -> known matching -> fuzzy -> rule/trap.
  let best = {meaning: normalizedMeanings[0], score: 0};
  for (const meaning of normalizedMeanings) {
    let score = tokenSimilarity(normalizedAnswer, meaning.normalizedText);

    if (normalizedAnswer && meaning.normalizedText.includes(normalizedAnswer)) {
      score = Math.max(score, 0.78);
    }

    if (hasNegationMismatch(normalizedAnswer, meaning.normalizedText)) {
      score = Math.min(score, 0.48);
    }

    if (score > best.score) {
      best = {meaning, score};
    }
  }

  const trapPenalty = detectedTrap ? 0.2 : 0;
  const finalScore = Math.max(0, Math.min(0.98, best.score + (best.score > 0 ? 0.18 : 0) - trapPenalty));

  return {
    resultType: resultTypeByScore(finalScore),
    score: finalScore,
    matchedMeaningId: best.meaning?.id ?? null,
    detectedTrap,
    summary: detectedTrap
      ? "Похоже, часть конструкции была воспринята буквально."
      : finalScore >= 0.76
        ? "Основной смысл передан достаточно близко."
        : "Ответ пока далёк от естественного смысла фразы.",
  };
}
