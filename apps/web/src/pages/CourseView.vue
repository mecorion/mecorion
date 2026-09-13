<script setup>
import {computed, ref} from "vue";
import {useContextNavigation} from "@/navigation/contextNavigation.js";
import {
  coursePractice,
  courseResultTypes,
  courseTopics,
  courses,
  evaluatePhraseAnswer,
  getChunksByIds,
  getCourseById,
  getLessonById,
  getLessonsForSection,
  getPhrasesByIds,
} from "@/course/course.mock.js";

const activeSection = ref("home");
const query = ref("");
const selectedCourseId = ref("english-understanding-real-english");
const selectedLessonId = ref("lesson-make-it");
const practiceIndex = ref(0);
const practiceAnswer = ref("");
const practiceResults = ref([]);
const lastEvaluation = ref(null);

const navigation = [
  {id: "home", icon: "⌂", title: "Главная", shortTitle: "Главная"},
  {id: "catalog", icon: "▦", title: "Каталог курсов", shortTitle: "Каталог"},
  {id: "my", icon: "▤", title: "Мои курсы", shortTitle: "Мои"},
  {id: "mistakes", icon: "◇", title: "Повтор ошибок", shortTitle: "Ошибки"},
  {id: "progress", icon: "◎", title: "Прогресс", shortTitle: "Статы"},
];

const practiceModes = [
  {id: "lesson", title: "Lesson Practice", description: "Фразы текущего урока"},
  {id: "topic", title: "Topic Practice", description: "Фразы выбранной темы"},
  {id: "mistakes", title: "Mistakes", description: "Ошибочные фразы"},
  {id: "mixed", title: "Mixed Practice", description: "Смешанная тренировка"},
];

const currentCourse = computed(() => getCourseById(selectedCourseId.value));
const currentLesson = computed(() => getLessonById(selectedLessonId.value));
const currentLessonPhrases = computed(() => getPhrasesByIds(currentLesson.value.phraseIds));
const practicePhrases = computed(() => getPhrasesByIds(coursePractice.phraseIds));
const currentPhrase = computed(() => practicePhrases.value[practiceIndex.value] ?? practicePhrases.value[0]);
const currentPhraseChunks = computed(() => getChunksByIds(currentPhrase.value.chunkIds));
const availableCourses = computed(() => {
  const normalized = query.value.trim().toLocaleLowerCase("ru");

  if (!normalized) {
    return courses;
  }

  return courses.filter((course) =>
    `${course.title} ${course.subtitle} ${course.description}`.toLocaleLowerCase("ru").includes(normalized),
  );
});

const courseStats = computed(() => {
  const answers = practiceResults.value;
  const averageScore = answers.length
    ? Math.round(answers.reduce((sum, item) => sum + item.score, 0) / answers.length * 100)
    : 0;

  return [
    {label: "Прогресс курса", value: `${currentCourse.value.progress}%`, icon: "↗"},
    {label: "Изучено фраз", value: `${answers.length}/${practicePhrases.value.length}`, icon: "Aa"},
    {label: "Средний score", value: `${averageScore}%`, icon: "◎"},
    {label: "К повторению", value: String(answers.filter((answer) => answer.score < 0.76).length), icon: "◇"},
  ];
});

const mistakes = computed(() => practiceResults.value.filter((answer) => answer.score < 0.76));

function navigate(section) {
  activeSection.value = section;
}

function openCourse(courseId) {
  selectedCourseId.value = courseId;
  activeSection.value = "course";
}

function openLesson(lessonId) {
  selectedLessonId.value = lessonId;
  activeSection.value = "lesson";
}

function startPractice(lessonId = selectedLessonId.value) {
  selectedLessonId.value = lessonId;
  practiceIndex.value = 0;
  practiceAnswer.value = "";
  lastEvaluation.value = null;
  activeSection.value = "practice";
}

useContextNavigation({
  title: "Mecorion",
  subtitle: "Course",
  activeId: activeSection,
  groups: computed(() => [
    {label: null, navLabel: "Разделы Course", items: navigation.map((item) => ({...item, symbol: item.icon, action: () => navigate(item.id)}))},
    {label: "Практика", items: practiceModes.map((mode) => ({
      title: mode.title,
      symbol: mode.id === "lesson" ? "01" : mode.id === "topic" ? "◎" : mode.id === "mistakes" ? "◇" : "∞",
      action: () => mode.id === "mistakes" ? navigate("mistakes") : startPractice(),
    }))},
  ]),
});

function submitPracticeAnswer() {
  if (!practiceAnswer.value.trim()) {
    return;
  }

  const evaluation = evaluatePhraseAnswer(currentPhrase.value, practiceAnswer.value);
  const result = {
    ...evaluation,
    phraseId: currentPhrase.value.id,
    userAnswer: practiceAnswer.value,
    answerDtm: new Date().toISOString(),
  };

  lastEvaluation.value = result;
  practiceResults.value = [
    ...practiceResults.value.filter((item) => item.phraseId !== currentPhrase.value.id),
    result,
  ];
}

function nextPhrase() {
  practiceIndex.value = (practiceIndex.value + 1) % practicePhrases.value.length;
  practiceAnswer.value = "";
  lastEvaluation.value = null;
}

function finishPractice() {
  activeSection.value = "progress";
}
</script>

<template>
  <div class="mecourse-app">

    <section class="mecourse-workspace">

      <main class="mecourse-content">
        <template v-if="activeSection === 'home'">
          <section class="mecourse-hero">
            <div class="mecourse-hero__copy">
              <p class="mecourse-kicker">Mecorion Course</p>
              <h1>Учитесь понимать смысл, а не переводить слова</h1>
              <p>Course собирает структурированные уроки, практику свободного ответа, прогресс и повторение ошибок в одном образовательном сервисе Mecorion.</p>
              <div>
                <button class="mecourse-primary-action" type="button" @click="openCourse(currentCourse.id)">Продолжить курс</button>
                <button class="mecourse-secondary-action" type="button" @click="startPractice()">Daily Practice</button>
              </div>
            </div>
            <article class="mecourse-practice-preview">
              <span>Phrase Practice</span>
              <strong>{{ currentPhrase.text }}</strong>
              <small>Free text input · local checker · chunks</small>
            </article>
          </section>

          <section class="mecourse-stat-grid" aria-label="Статистика обучения">
            <article v-for="stat in courseStats" :key="stat.label">
              <span aria-hidden="true">{{ stat.icon }}</span>
              <strong>{{ stat.value }}</strong>
              <small>{{ stat.label }}</small>
            </article>
          </section>

          <section class="mecourse-section">
            <div class="mecourse-section-heading">
              <h2>Continue Learning</h2>
              <button type="button" @click="openCourse(currentCourse.id)">Открыть курс</button>
            </div>
            <article class="mecourse-course-banner">
              <div>
                <p class="mecourse-kicker">{{ currentCourse.language }} · {{ currentCourse.level }}</p>
                <h3>{{ currentCourse.title }}: {{ currentCourse.subtitle }}</h3>
                <p>{{ currentCourse.description }}</p>
                <span><i :style="{width: `${currentCourse.progress}%`}"></i></span>
              </div>
              <button type="button" @click="openLesson(currentCourse.nextLessonId)">Продолжить урок</button>
            </article>
          </section>

          <section class="mecourse-section">
            <div class="mecourse-section-heading">
              <h2>Explore Courses</h2>
              <button type="button" @click="activeSection = 'catalog'">Смотреть всё</button>
            </div>
            <div class="mecourse-card-grid">
              <article v-for="course in courses" :key="course.id" class="mecourse-course-card" :class="{'is-soon': course.status === 'soon'}">
                <span>{{ course.status === 'published' ? 'Доступен' : 'Скоро' }}</span>
                <h3>{{ course.title }}</h3>
                <p>{{ course.subtitle }}</p>
                <button type="button" :disabled="course.status === 'soon'" @click="openCourse(course.id)">Открыть</button>
              </article>
            </div>
          </section>
        </template>

        <template v-else-if="activeSection === 'catalog' || activeSection === 'my'">
          <section class="mecourse-page-heading">
            <p class="mecourse-kicker">{{ activeSection === 'my' ? 'My Courses' : 'Explore Courses' }}</p>
            <h1>{{ query ? `Результаты для «${query}»` : 'Каталог образовательных направлений' }}</h1>
            <p>Сейчас опубликован первый English-курс, но структура поддерживает Programming, Databases, Networks, History и другие направления.</p>
          </section>

          <section class="mecourse-card-grid">
            <article v-for="course in availableCourses" :key="course.id" class="mecourse-course-card" :class="{'is-soon': course.status === 'soon'}">
              <span>{{ course.status === 'published' ? 'Доступен' : 'Скоро' }}</span>
              <h3>{{ course.title }}</h3>
              <p>{{ course.subtitle }}</p>
              <small>{{ course.level }} · {{ course.language }}</small>
              <button type="button" :disabled="course.status === 'soon'" @click="openCourse(course.id)">Открыть курс</button>
            </article>
          </section>
        </template>

        <template v-else-if="activeSection === 'course'">
          <section class="mecourse-course-head">
            <div>
              <p class="mecourse-kicker">{{ currentCourse.language }} · {{ currentCourse.level }}</p>
              <h1>{{ currentCourse.title }}: {{ currentCourse.subtitle }}</h1>
              <p>{{ currentCourse.description }}</p>
              <div class="mecourse-progress"><i :style="{width: `${currentCourse.progress}%`}"></i></div>
            </div>
            <button class="mecourse-primary-action" type="button" @click="openLesson(currentCourse.nextLessonId)">Continue</button>
          </section>

          <section class="mecourse-section">
            <div class="mecourse-section-heading"><h2>Sections</h2></div>
            <div class="mecourse-section-list">
              <article v-for="section in currentCourse.sections" :key="section.id">
                <header>
                  <span>{{ section.number }}</span>
                  <div>
                    <h3>{{ section.title }}</h3>
                    <small>{{ section.progress }}% завершено</small>
                  </div>
                  <div class="mecourse-progress"><i :style="{width: `${section.progress}%`}"></i></div>
                </header>
                <button v-for="lesson in getLessonsForSection(section)" :key="lesson.id" type="button" @click="openLesson(lesson.id)">
                  <span>{{ lesson.title }}</span>
                  <small>{{ lesson.duration }} · {{ lesson.progress }}%</small>
                </button>
              </article>
            </div>
          </section>
        </template>

        <template v-else-if="activeSection === 'lesson'">
          <section class="mecourse-lesson">
            <aside class="mecourse-lesson__rail">
              <p class="mecourse-kicker">Lesson</p>
              <h2>{{ currentLesson.title }}</h2>
              <span><i :style="{width: `${currentLesson.progress}%`}"></i></span>
              <button type="button" @click="startPractice(currentLesson.id)">Перейти к Practice</button>
            </aside>
            <article class="mecourse-lesson__document">
              <h1>{{ currentLesson.title }}</h1>
              <section v-for="block in currentLesson.content" :key="`${currentLesson.id}-${block.title}`">
                <p class="mecourse-kicker">{{ block.type }}</p>
                <h2>{{ block.title }}</h2>
                <p>{{ block.text }}</p>
              </section>

              <section>
                <p class="mecourse-kicker">Important constructions</p>
                <div class="mecourse-chunk-grid">
                  <article v-for="phrase in currentLessonPhrases" :key="phrase.id">
                    <strong>{{ phrase.text }}</strong>
                    <small>{{ phrase.naturalTranslation }}</small>
                  </article>
                </div>
              </section>
            </article>
          </section>
        </template>

        <template v-else-if="activeSection === 'practice'">
          <section class="mecourse-practice">
            <article class="mecourse-practice-card">
              <p class="mecourse-kicker">{{ coursePractice.mode }} · {{ currentPhrase.difficulty }}</p>
              <h1>{{ currentPhrase.text }}</h1>
              <label>
                <span>Как вы понимаете эту фразу?</span>
                <textarea v-model="practiceAnswer" maxlength="400" placeholder="Напишите смысл своими словами"></textarea>
              </label>
              <button class="mecourse-primary-action" type="button" :disabled="!practiceAnswer.trim()" @click="submitPracticeAnswer">Проверить</button>
            </article>

            <aside class="mecourse-feedback" :class="lastEvaluation ? `is-${lastEvaluation.resultType.toLowerCase().replace('_', '-')}` : ''">
              <template v-if="lastEvaluation">
                <p class="mecourse-kicker">Feedback</p>
                <h2>{{ courseResultTypes[lastEvaluation.resultType].title }} — {{ Math.round(lastEvaluation.score * 100) }}%</h2>
                <p>{{ courseResultTypes[lastEvaluation.resultType].description }}. {{ lastEvaluation.summary }}</p>
                <dl>
                  <div><dt>Ваш ответ</dt><dd>{{ lastEvaluation.userAnswer }}</dd></div>
                  <div><dt>Естественный смысл</dt><dd>{{ currentPhrase.naturalTranslation }}</dd></div>
                </dl>
                <section>
                  <h3>Chunks</h3>
                  <article v-for="chunk in currentPhraseChunks" :key="chunk.id">
                    <strong>{{ chunk.text }}</strong>
                    <span>{{ chunk.meaning }}</span>
                  </article>
                </section>
                <section v-if="lastEvaluation.detectedTrap">
                  <h3>Literal trap</h3>
                  <p>{{ lastEvaluation.detectedTrap.explanation }}</p>
                </section>
                <div>
                  <button type="button" @click="nextPhrase">Следующая Phrase</button>
                  <button type="button" @click="finishPractice">Завершить</button>
                </div>
              </template>
              <template v-else>
                <p class="mecourse-kicker">Answer Checker</p>
                <h2>Свободный ответ без вариантов</h2>
                <p>Сначала проверяется точное совпадение с PhraseMeaning, затем fuzzy-score и простые правила защиты от буквальных ловушек.</p>
              </template>
            </aside>
          </section>
        </template>

        <template v-else-if="activeSection === 'mistakes'">
          <section class="mecourse-page-heading">
            <p class="mecourse-kicker">Mistakes to Review</p>
            <h1>Повторение ошибочных фраз</h1>
            <p>Фразы с низким score будут возвращаться чаще. Это основа будущей spaced repetition модели.</p>
          </section>
          <section class="mecourse-review-list">
            <article v-for="mistake in mistakes" :key="mistake.phraseId">
              <strong>{{ getPhrasesByIds([mistake.phraseId])[0]?.text }}</strong>
              <span>{{ Math.round(mistake.score * 100) }}%</span>
              <button type="button" @click="startPractice()">Повторить</button>
            </article>
            <article v-if="!mistakes.length">
              <strong>Ошибок пока нет</strong>
              <span>Пройдите Practice, чтобы собрать материал для повторения.</span>
              <button type="button" @click="startPractice()">Начать</button>
            </article>
          </section>
        </template>

        <template v-else>
          <section class="mecourse-page-heading">
            <p class="mecourse-kicker">Progress</p>
            <h1>Базовая статистика обучения</h1>
            <p>Этот экран показывает будущие метрики UserCourseProgress, UserLessonProgress и UserPhraseProgress.</p>
          </section>
          <section class="mecourse-stat-grid">
            <article v-for="stat in courseStats" :key="stat.label">
              <span aria-hidden="true">{{ stat.icon }}</span>
              <strong>{{ stat.value }}</strong>
              <small>{{ stat.label }}</small>
            </article>
          </section>
          <section class="mecourse-topic-map">
            <article v-for="topic in courseTopics" :key="topic.id">
              <strong>{{ topic.title }}</strong>
              <small>{{ topic.parentId ? `Внутри ${topic.parentId}` : 'Корневая тема' }}</small>
              <span>{{ topic.phraseCount }} Phrase</span>
            </article>
          </section>
        </template>
      </main>
    </section>
  </div>
</template>
