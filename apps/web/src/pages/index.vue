<script setup>
import {ref, onMounted, onBeforeUnmount} from 'vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiCard from '@/components/ui/UiCard.vue';
import UiAvatar from '@/components/ui/UiAvatar.vue';
import UiAvatarGroup from '@/components/ui/UiAvatarGroup.vue';
import UiAvatarGroupCount from '@/components/ui/UiAvatarGroupCount.vue';
import UiBadge from '@/components/ui/UiBadge.vue';
import UiProgress from '@/components/ui/UiProgress.vue';
import UiItem from '@/components/ui/UiItem.vue';
import UiItemGroup from '@/components/ui/UiItemGroup.vue';
import SvgIcon from '@/components/SvgIcon.vue';
definePageMeta({layout: 'auth', standalone: true});
useHead({htmlAttrs: {class: 'mecorion-landing-scroll'}, title: 'Mecorion — всё, что вдохновляет', meta: [{name: 'description', content: 'Музыка, видео, книги, обучение, сообщества и цифровые сервисы в одной экосистеме.'}]});
const root = ref(null);
const menuOpen = ref(false);
const playing = ref(false);
const scrolled = ref(false);
let observer;
function updateScroll() { scrolled.value = window.scrollY > 24; }
function escapeMenu(event) { if (event.key === 'Escape') menuOpen.value = false; }
onMounted(() => {
 updateScroll();
 window.addEventListener('scroll', updateScroll, {passive: true});
 window.addEventListener('keydown', escapeMenu);
 if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
 observer = new IntersectionObserver(entries => entries.forEach(entry => {
  if (!entry.isIntersecting) return;
  entry.target.classList.remove('reveal-pending');
  entry.target.classList.add('visible');
  observer.unobserve(entry.target);
 }), {threshold: 0, rootMargin: '0px 0px -32px 0px'});
 root.value.querySelectorAll('.reveal').forEach(item => {
  item.classList.add('reveal-pending');
  observer.observe(item);
 });
});
onBeforeUnmount(() => { observer?.disconnect(); window.removeEventListener('scroll', updateScroll); window.removeEventListener('keydown', escapeMenu); });
</script>

<template>
<div ref="root" class="main-landing">
  <header class="header" :class="{scrolled}" id="header">
    <div class="header-inner">
    <UiButton variant="ghost" class="brand" href="#top" aria-label="Mecorion, на главную">
      <span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span>
      <span>Mecorion</span>
    </UiButton>
    <nav id="landing-nav" class="nav" :class="{open: menuOpen}" @click="menuOpen = false" aria-label="Основная навигация">
      <UiButton variant="ghost" href="#worlds">Возможности</UiButton>
      <UiButton variant="ghost" href="#flow">Как это работает</UiButton>
      <UiButton variant="ghost" href="#membership">Подписка</UiButton>
    </nav>
    <UiButton variant="outline" class="header-cta" to="/sign-up-seed">Попробовать</UiButton>
    <UiButton variant="ghost" icon class="menu-button" :aria-label="menuOpen ? 'Закрыть меню' : 'Открыть меню'" :aria-expanded="menuOpen" aria-controls="landing-nav" @click="menuOpen = !menuOpen"><SvgIcon :name="menuOpen ? 'x' : 'menu'" /></UiButton>
    </div>
  </header>

  <main id="top">
    <section class="hero section">
      <div class="hero-copy reveal">
        <div class="eyebrow"><span></span> Одна экосистема. Твой ритм.</div>
        <h1>Всё, что<br />тебя <em>движет.</em></h1>
        <p class="lead">Музыка, видео, книги, обучение и люди, с которыми хочется быть на одной волне. Один аккаунт — тысячи способов провести время с пользой.</p>
        <div class="hero-actions">
          <UiButton variant="primary" size="lg" to="/sign-up-seed">Начать бесплатно <span aria-hidden="true"><SvgIcon name="arrow-up-right-1" /></span></UiButton>
          <UiButton variant="ghost" href="#worlds">Исследовать Mecorion <span aria-hidden="true"><SvgIcon name="arrow-up-right-1" /></span></UiButton>
        </div>
        <div class="trust-row"><UiAvatarGroup aria-label="Пользователи Mecorion"><UiAvatar size="sm" fallback="А" alt="Алексей" /><UiAvatar size="sm" fallback="М" alt="Мария" /><UiAvatar size="sm" fallback="К" alt="Кирилл" /></UiAvatarGroup><span><b>Уже 2,4 млн</b><br />нашли своё в Mecorion</span></div>
      </div>

      <div class="hero-stage reveal" aria-label="Интерфейс приложения Mecorion">
        <div class="orbit orbit-one"></div><div class="orbit orbit-two"></div>
        <UiCard raw class="phone-card">
          <div class="phone-top"><span>9:41</span><span><span class="status-dots" aria-hidden="true"></span></span></div>
          <div class="mini-greeting">Добрый вечер, Алексей</div>
          <h2>Твой вечер<br />уже звучит</h2>
          <div class="album-art"><div class="disc"></div><span>Новая волна<br /><b>Vega</b></span></div>
          <div class="player"><span aria-hidden="true"><SvgIcon name="skip-back" /></span><UiButton variant="primary" icon rounded class="play" :aria-label="playing ? 'Пауза демонстрации' : 'Воспроизвести демонстрацию'" :aria-pressed="playing" @click="playing = !playing"><SvgIcon :name="playing ? 'pause' : 'play'" /></UiButton><span aria-hidden="true"><SvgIcon name="skip-forward" /></span></div>
          <nav class="phone-tabs" aria-label="Сервисы в демонстрации"><UiButton variant="ghost" icon to="/dashboard" aria-label="Главная"><SvgIcon name="home" /></UiButton><UiButton variant="ghost" icon to="/profile" aria-label="Мой профиль"><SvgIcon name="user" /></UiButton><UiButton variant="ghost" icon href="#worlds" aria-label="Исследовать сервисы"><SvgIcon name="search" /></UiButton></nav>
        </UiCard>
        <UiCard raw class="float-card video-card"><UiBadge variant="soft">ПРЕМЬЕРА</UiBadge><div class="play-ring"><SvgIcon name="play" /></div><p>За горизонтом</p><small>Новый эпизод</small></UiCard>
        <UiCard raw class="float-card landing-book-card"><UiAvatar class="book-icon" alt="Книги"><SvgIcon name="book" /></UiAvatar><div><small>ПРОДОЛЖИТЬ ЧТЕНИЕ</small><p>Краткая история будущего</p><UiProgress :value="62" size="sm" label="Прочитано" /></div></UiCard>
        <UiCard raw class="float-card course-card"><span><SvgIcon name="badge-check" /></span><div><small>КУРС ЗАВЕРШЁН</small><p>Основы креативности</p></div></UiCard>
      </div>
    </section>

    <section class="marquee reveal" aria-label="Сервисы Mecorion"><div>СЛУШАЙ <span><SvgIcon name="star" /></span> СМОТРИ <span><SvgIcon name="star" /></span> ЧИТАЙ <span><SvgIcon name="star" /></span> УЧИСЬ <span><SvgIcon name="star" /></span> ОБЩАЙСЯ <span><SvgIcon name="star" /></span> СОЗДАВАЙ <span><SvgIcon name="star" /></span></div></section>

    <section class="worlds section" id="worlds">
      <div class="section-heading reveal"><div><span class="kicker">ТВОЯ ЭКОСИСТЕМА</span><h2>Шесть миров.<br />Один <em>Mecorion.</em></h2></div><p>Переключайся между любимыми форматами без лишних приложений и новых регистраций.</p></div>
      <div class="world-grid">
        <UiCard raw class="world-card music reveal"><div class="card-icon"><SvgIcon name="music" /></div><span class="number">01</span><div class="visual equalizer"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><h3>Музыка</h3><p>Миллионы треков, умные рекомендации и звук, который знает твоё настроение.</p><UiButton variant="ghost" to="/music" aria-label="Подробнее о музыке">Узнать больше <SvgIcon name="arrow-up-right-1" /></UiButton></UiCard>
        <UiCard raw class="world-card video reveal"><div class="card-icon"><SvgIcon name="play" /></div><span class="number">02</span><div class="visual frame"><div class="sun"></div><div class="horizon"></div><UiButton variant="primary" icon rounded to="/video" aria-label="Открыть видео"><SvgIcon name="play" /></UiButton></div><h3>Видео</h3><p>Кино, сериалы и авторские проекты — от громких премьер до редких находок.</p><UiButton variant="ghost" to="/video" aria-label="Подробнее о видео">Узнать больше <SvgIcon name="arrow-up-right-1" /></UiButton></UiCard>
        <UiCard raw class="world-card books reveal"><div class="card-icon"><SvgIcon name="book" /></div><span class="number">03</span><div class="visual pages"><i></i><i></i><i></i></div><h3>Книги</h3><p>Читай и слушай в своём темпе. Библиотека всегда помнит, где ты остановился.</p><UiButton variant="ghost" to="/books" aria-label="Подробнее о книгах">Узнать больше <SvgIcon name="arrow-up-right-1" /></UiButton></UiCard>
        <UiCard raw class="world-card learn reveal"><div class="card-icon"><SvgIcon name="graduation-cap" /></div><span class="number">04</span><div class="visual lesson"><b>74%</b><span>Твоя цель ближе</span><UiProgress :value="74" label="Прогресс обучения" /></div><h3>Обучение</h3><p>Курсы от практиков, понятный прогресс и знания, которые работают в жизни.</p><UiButton variant="ghost" to="/course" aria-label="Подробнее об обучении">Узнать больше <SvgIcon name="arrow-up-right-1" /></UiButton></UiCard>
        <UiCard raw class="world-card community reveal"><div class="card-icon"><SvgIcon name="users" /></div><span class="number">05</span><UiAvatarGroup class="visual people" aria-label="Сообщество"><UiAvatar fallback="К" alt="Кирилл" /><UiAvatar fallback="Л" alt="Лена" /><UiAvatar fallback="Р" alt="Роман" /><UiAvatarGroupCount :count="5" /></UiAvatarGroup><h3>Сообщества</h3><p>Находи своих, делись открытиями и будь частью разговоров по интересам.</p><UiButton variant="ghost" to="/spaces" aria-label="Подробнее о сообществах">Узнать больше <SvgIcon name="arrow-up-right-1" /></UiButton></UiCard>
        <UiCard raw class="world-card services reveal"><div class="card-icon"><SvgIcon name="star" /></div><span class="number">06</span><div class="visual service-dots"><i></i><i></i><i></i><i></i></div><h3>Сервисы</h3><p>Полезные инструменты на каждый день — собраны рядом и работают как единое целое.</p><UiButton variant="ghost" to="/services" aria-label="Подробнее о сервисах">Узнать больше <SvgIcon name="arrow-up-right-1" /></UiButton></UiCard>
      </div>
    </section>

    <section class="flow section" id="flow">
      <div class="flow-copy reveal"><span class="kicker">БЕЗ ЛИШНИХ ДВИЖЕНИЙ</span><h2>Начни с песни.<br />Продолжи <em>идеей.</em></h2><p>Рекомендации Mecorion соединяют форматы. Послушал подкаст — нашёл книгу автора, его курс и сообщество единомышленников.</p><UiItemGroup class="flow-steps"><UiItem title="Один профиль" description="История, избранное и прогресс всегда рядом."><template #media><UiBadge>01</UiBadge></template></UiItem><UiItem title="Умные связи" description="Больше открытий, меньше бесконечного поиска."><template #media><UiBadge>02</UiBadge></template></UiItem><UiItem title="На любом устройстве" description="Продолжай ровно с того места, где остановился."><template #media><UiBadge>03</UiBadge></template></UiItem></UiItemGroup></div>
      <div class="flow-map reveal" aria-hidden="true"><div class="core"><span class="brand-mark"><i></i><i></i><i></i></span><b>mecorion</b></div><span class="node n1"><SvgIcon name="music" /></span><span class="node n2"><SvgIcon name="play" /></span><span class="node n3"><SvgIcon name="book" /></span><span class="node n4"><SvgIcon name="graduation-cap" /></span><span class="node n5"><SvgIcon name="users" /></span><span class="node n6"><SvgIcon name="star" /></span><svg viewBox="0 0 600 600"><circle cx="300" cy="300" r="205"/><circle cx="300" cy="300" r="130"/></svg></div>
    </section>

    <section class="membership section" id="membership">
      <UiCard raw class="membership-inner reveal"><span class="kicker">MECORION ONE</span><h2>Один аккаунт.<br /><em>Всё включено.</em></h2><p>Начни бесплатно на 30 дней. Открой всю экосистему без рекламы и ограничений.</p><div class="price"><b>399 ₽</b><span>/ месяц<br />после пробного периода</span></div><UiButton variant="primary" size="lg" to="/sign-up-seed">Попробовать бесплатно <span><SvgIcon name="arrow-up-right-1" /></span></UiButton><small>Отменить можно в любой момент</small><div class="benefits"><span><SvgIcon name="badge-check" /> Без рекламы</span><span><SvgIcon name="badge-check" /> Офлайн-доступ</span><span><SvgIcon name="badge-check" /> До 5 профилей</span><span><SvgIcon name="badge-check" /> Высокое качество</span></div></UiCard>
    </section>
  </main>

  <footer class="reveal"><UiButton variant="ghost" class="brand" href="#top"><span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span><span>Mecorion</span></UiButton><p>Твоя культура. Твой ритм. Твой мир.</p><div><UiButton variant="ghost" href="#worlds">О продукте</UiButton><UiButton variant="ghost" to="/support">Поддержка</UiButton><UiButton variant="ghost" to="/resolutions">Документы</UiButton></div><small>© 2026 Mecorion</small></footer>
  </div>
</template>
<style scoped>
:global(html.mecorion-landing-scroll) {
  scroll-behavior: smooth;
}
@media (prefers-reduced-motion: reduce) {
  :global(html.mecorion-landing-scroll) {
    scroll-behavior: auto;
  }
}
.marquee div  {
  display:flex;
  align-items:center;
  justify-content:space-around;
  gap:var(--mc-space-6);
  }

.marquee .svg-icon  {
  width:16px;
  height:16px;
  }

@media(max-width:360px) {
  .marquee div {
  flex-wrap:wrap;
  white-space:normal;
  gap:var(--mc-space-3);
  word-spacing:normal;
  }
}


    * {
  box-sizing:border-box}
.main-landing {
  margin:0;
  background:var(--mc-bg);
  color:var(--mc-text-primary);
  overflow-x:clip}
a {
  color:inherit;
  text-decoration:none}
button {
  font:inherit}
.header {
  position:fixed;
  inset:0 0 auto;
  z-index:50;
  background:color-mix(in srgb,var(--mc-bg) 88%,transparent);
  backdrop-filter:blur(18px);
  border-bottom:1px solid transparent;
  transition:.3s}
.header-inner {
  max-width:1440px;
  margin-inline:auto;
  min-width:0;
  height:82px;
  padding:0 clamp(24px,6vw,96px);
  display:flex;
  align-items:center;
  justify-content:space-between;
  position:relative;
  transition:height .3s}
.header.scrolled {
  border-color:rgba(255,255,255,.08)}
.header.scrolled .header-inner {
  height:68px}
.brand {
  display:flex;
  align-items:center;
  gap:var(--mc-space-3);
  font-weight:800;
  font-size:1.25rem;
  letter-spacing:-.04em}
.brand-mark {
  width:26px;
  height:24px;
  display:flex;
  align-items:flex-end;
  gap:3px}
.brand-mark i {
  display:block;
  width:6px;
  border-radius:6px;
  background:linear-gradient(var(--mc-accent),var(--mc-accent))}
.brand-mark i:nth-child(1) {
  height:13px}
.brand-mark i:nth-child(2) {
  height:23px}
.brand-mark i:nth-child(3) {
  height:17px}
.nav {
  display:flex;
  gap:36px;
  color:var(--mc-text-secondary);
  font-size:.92rem;
  font-weight:600}

.menu-button {
  display:none;

  }
.section {
  max-width:1440px;
  margin:auto;
  padding-left:clamp(24px,6vw,96px);
  padding-right:clamp(24px,6vw,96px)}
.hero {
  min-height:820px;
  padding-top:150px;
  padding-bottom:80px;
  display:grid;
  grid-template-columns:1fr 1fr;
  align-items:center;
  gap:60px;
  position:relative}
.hero:before {
  content:"";
  position:absolute;
  width:500px;
  height:500px;
  left:-300px;
  top:130px;
  background:var(--mc-accent);
  filter:blur(180px);
  opacity:.16}
.eyebrow,.kicker {
  font-size:.76rem;
  font-weight:800;
  letter-spacing:.16em}
.eyebrow {
  display:flex;
  align-items:center;
  gap:10px;
  color:var(--mc-accent)}
.eyebrow span {
  width:28px;
  height:2px;
  background:var(--mc-accent)}
h1,h2,h3,p {
  margin-top:0}
h1 {
  font-size:clamp(4rem,7.6vw,7.5rem);
  line-height:.88;
  letter-spacing:-.075em;
  margin:28px 0 32px;
  max-width:770px}
h1 em,h2 em {
  font-style:normal;
  color:var(--mc-accent)}
.lead {
  max-width:610px;
  color:var(--mc-text-secondary);
  font-size:1.12rem;
  line-height:1.75}
.hero-actions {
  display:flex;
  align-items:center;
  gap:34px;
  margin-top:38px}
.trust-row {
  display:flex;
  align-items:center;
  gap:var(--mc-space-4);
  margin-top:54px;
  color:var(--mc-text-secondary);
  font-size:.75rem;
  line-height:1.5}
.trust-row b {
  color:white;
  font-size:.82rem}
.hero-stage {
  height:610px;
  position:relative;
  display:grid;
  place-items:center}
.hero-stage:before {
  content:"";
  position:absolute;
  width:420px;
  height:420px;
  background:radial-gradient(circle,#8d66ff 0,rgba(141,102,255,.22) 42%,transparent 70%);
  filter:blur(8px)}
.orbit {
  position:absolute;
  border:1px solid rgba(255,255,255,.12);
  border-radius:50%;
  transform:rotate(-18deg)}
.orbit-one {
  width:520px;
  height:360px}
.orbit-two {
  width:640px;
  height:460px}
.phone-card {
  width:280px;
  height:560px;
  padding:24px 20px 18px;
  position:relative;
  z-index:2;
  transform:rotate(-4deg)}
.phone-top {
  display:flex;
  justify-content:space-between;
  font-size:.58rem}
.mini-greeting {
  margin-top:28px;
  color:var(--mc-text-muted);
  font-size:.62rem}
.phone-card h2 {
  font-size:1.75rem;
  line-height:1.05;
  letter-spacing:-.04em;
  margin:8px 0 20px}
.album-art {
  height:230px;
  border-radius:var(--mc-radius-md);
  padding:18px;
  display:flex;
  align-items:flex-end;
  background:radial-gradient(circle at 30% 24%,#ffb0d3,transparent 24%),linear-gradient(145deg,#eb5d9e,#4d2aa3 62%,#1f1738);
  overflow:hidden;
  position:relative}
.album-art:before {
  content:"";
  position:absolute;
  width:150px;
  height:150px;
  border:32px solid rgba(255,255,255,.13);
  border-radius:50%;
  right:-42px;
  top:20px}
.album-art span {
  font-size:.7rem;
  position:relative}
.album-art b {
  font-size:1rem}
.player {
  display:flex;
  justify-content:center;
  align-items:center;
  gap:22px;
  padding:16px}
.phone-tabs {
  position:absolute;
  inset:auto 18px 14px;
  display:flex;
  justify-content:space-around;
  border-top:1px solid rgba(255,255,255,.08);
  padding-top:11px;
  color:#a8a4b0}
.phone-tabs span {
  display:grid;
  text-align:center;
  font-size:.8rem}
.phone-tabs small {
  font-size:.45rem;
  margin-top:2px}
.float-card {
  position:absolute;
  z-index:3;
  backdrop-filter:blur(14px);
  }
.video-card {
  width:180px;
  height:210px;
  right:0;
  top:45px;
  padding:15px;
  }
.play-ring {
  width:60px;
  height:60px;
  border:1px solid rgba(255,255,255,.5);
  border-radius:50%;
  display:grid;
  place-items:center;
  margin:35px auto 25px}
.video-card p,.landing-book-card p,.course-card p {
  font-weight:700;
  margin:0;
  font-size:.75rem}
.video-card small,.landing-book-card small,.course-card small {
  color:var(--mc-text-muted);
  font-size:.52rem}
.landing-book-card {
  width:230px;
  left:-20px;
  bottom:80px;
  padding:var(--mc-space-4);
  display:flex;
  gap:14px;
  align-items:center}
.book-icon {
  flex-shrink:0;
  }
.course-card {
  right:25px;
  bottom:25px;
  padding:13px 18px;
  display:flex;
  gap:var(--mc-space-3);
  align-items:center}
.course-card>span {
  width:30px;
  height:30px;
  border-radius:50%;
  display:grid;
  place-items:center;
  background:#2c5a46;
  color:#8cf1bd}
.marquee {
  background:var(--mc-accent);
  color:#17121f;
  overflow:hidden;
  transform:rotate(-1.2deg);
  width:102%;
  margin-left:-1%;
  white-space:nowrap}
.marquee div {
  font-size:.74rem;
  font-weight:800;
  letter-spacing:.16em;
  padding:15px;
  word-spacing:22px;
  animation:none}
.marquee span {
  color:#fff}
.worlds {
  padding-top:150px;
  padding-bottom:130px}
.section-heading {
  display:flex;
  justify-content:space-between;
  align-items:end;
  margin-bottom:58px}
.kicker {
  color:var(--mc-accent);
  display:block;
  margin-bottom:24px}
.section-heading h2,.flow-copy h2,.membership h2 {
  font-size:clamp(3rem,5vw,5rem);
  line-height:.98;
  letter-spacing:-.06em;
  margin:0}
.section-heading>p {
  max-width:420px;
  color:var(--mc-text-secondary);
  line-height:1.7}
.world-grid {
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:16px}
.world-card {
  min-height:480px;
  padding:var(--mc-space-8);
  position:relative;
  overflow:hidden;
  transition:transform .25s,background .25s;
  outline:none}
.card-icon {
  width:46px;
  height:46px;
  border-radius:var(--mc-radius-md);
  background:#332747;
  display:grid;
  place-items:center;
  color:var(--mc-accent);
  font-size:1.2rem}
.number {
  position:absolute;
  right:28px;
  top:32px;
  color:#736f7d;
  font-size:.72rem}
.world-card h3 {
  font-size:1.65rem;
  margin:28px 0 12px}
.world-card p {
  color:var(--mc-text-secondary);
  font-size:.91rem;
  line-height:1.65;
  min-height:72px}
.visual {
  height:190px;
  margin-top:14px;
  display:flex;
  align-items:center;
  justify-content:center}
.equalizer {
  gap:9px;
  align-items:flex-end;
  padding-bottom:26px}
.equalizer i {
  width:14px;
  border-radius:var(--mc-radius-md);
  background:linear-gradient(var(--mc-accent),var(--mc-accent));
  animation:pulse 1.4s ease-in-out infinite}
.equalizer i:nth-child(1) {
  height:38px}
.equalizer i:nth-child(2) {
  height:92px;
  animation-delay:.2s}
.equalizer i:nth-child(3) {
  height:120px;
  animation-delay:.4s}
.equalizer i:nth-child(4) {
  height:70px;
  animation-delay:.1s}
.equalizer i:nth-child(5) {
  height:140px;
  animation-delay:.3s}
.equalizer i:nth-child(6) {
  height:82px;
  animation-delay:.5s}
.equalizer i:nth-child(7) {
  height:48px;
  animation-delay:.25s}
.frame {
  margin-top:24px;
  height:165px;
  border-radius:var(--mc-radius-md);
  background:linear-gradient(#554688,#df797d);
  position:relative;
  overflow:hidden}
.frame .sun {
  width:70px;
  height:70px;
  border-radius:50%;
  background:#ffd582;
  position:absolute;
  right:35px;
  top:24px}
.horizon {
  width:120%;
  height:75px;
  background:#2c2853;
  position:absolute;
  bottom:-20px;
  transform:rotate(-8deg)}
.pages {
  position:relative}
.pages i {
  position:absolute;
  width:108px;
  height:145px;
  border-radius:var(--mc-radius-md);
  background:#eed7aa;
  transform:rotate(-12deg);
  box-shadow:0 12px 28px #0c0b13}
.pages i:nth-child(2) {
  background:#c48472;
  transform:rotate(2deg)}
.pages i:nth-child(3) {
  background:linear-gradient(145deg,#5f3e84,#b25880);
  transform:rotate(14deg)}
.lesson {
  flex-direction:column}
.lesson b {
  font-size:3.5rem;
  letter-spacing:-.06em;
  color:var(--mc-accent)}
.lesson span {
  color:var(--mc-text-secondary);
  font-size:.7rem}
.service-dots {
  display:grid;
  grid-template-columns:70px 70px;
  gap:12px}
.service-dots i {
  width:70px;
  height:70px;
  border-radius:var(--mc-radius-md);
  background:linear-gradient(135deg,var(--mc-accent),#5943a2)}
.service-dots i:nth-child(2) {
  background:linear-gradient(135deg,var(--mc-info),#337a8e)}
.service-dots i:nth-child(3) {
  background:linear-gradient(135deg,var(--mc-accent),#95466b)}
.service-dots i:nth-child(4) {
  background:linear-gradient(135deg,var(--mc-warning),#a16e2d)}
.flow {
  padding-top:130px;
  padding-bottom:150px;
  display:grid;
  grid-template-columns:1fr 1fr;
  align-items:center;
  gap:100px}
.flow-copy>p {
  color:var(--mc-text-secondary);
  line-height:1.75;
  max-width:590px;
  margin:30px 0 38px}
.flow-map {
  aspect-ratio:1;
  position:relative;
  display:grid;
  place-items:center}
.flow-map>svg {
  position:absolute;
  width:100%;
  height:100%;
  fill:none;
  stroke:#383545;
  stroke-width:1}
.core {
  width:160px;
  height:160px;
  border-radius:50%;
  background:linear-gradient(145deg,var(--mc-accent),#563ca7);
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  gap:var(--mc-space-2);
  box-shadow:0 0 80px rgba(169,135,255,.25);
  z-index:2}
.core .brand-mark {
  transform:scale(1.25)}
.node {
  position:absolute;
  width:72px;
  height:72px;
  border-radius:var(--mc-radius-md);
  background:var(--mc-surface-raised);
  border:1px solid var(--mc-border-strong);
  display:grid;
  place-items:center;
  font-weight:800;
  font-size:1.1rem;
  z-index:3}
.n1 {
  top:6%;
  left:43%}
.n2 {
  top:21%;
  right:7%}
.n3 {
  bottom:18%;
  right:10%}
.n4 {
  bottom:3%;
  left:40%}
.n5 {
  bottom:19%;
  left:7%}
.n6 {
  top:21%;
  left:8%}
.membership {
  padding-bottom:120px}
.membership-inner {
  padding:90px clamp(28px,8vw,110px);
  position:relative;
  overflow:hidden}
.membership-inner:after {
  content:"M";
  position:absolute;
  right:5%;
  top:-26%;
  font-size:35rem;
  font-weight:800;
  opacity:.055}
.membership .kicker {
  color:#eadfff}
.membership h2 {
  font-size:clamp(3.6rem,6.5vw,6.7rem);
  position:relative;
  z-index:1}
.membership h2 em {
  color:#ffd1e4}
.membership p {
  font-size:1.05rem;
  max-width:550px;
  line-height:1.7;
  margin:28px 0}
.price {
  display:flex;
  align-items:center;
  gap:var(--mc-space-4);
  margin-bottom:28px}
.price b {
  font-size:2.5rem}
.price span {
  font-size:.7rem;
  line-height:1.5;
  opacity:.75}
.membership small {
  margin-left:18px;
  opacity:.7}
.benefits {
  display:flex;
  gap:35px;
  margin-top:48px;
  padding-top:26px;
  border-top:1px solid rgba(255,255,255,.25);
  font-size:.78rem;
  font-weight:700}
footer {
  max-width:1440px;
  margin:auto;
  padding:0 clamp(24px,6vw,96px) 50px;
  display:grid;
  grid-template-columns:1fr 1fr auto;
  align-items:center;
  gap:var(--mc-space-6);
  color:var(--mc-text-secondary)}
footer p {
  margin:0;
  font-size:.8rem}
footer div {
  display:flex;
  gap:26px;
  font-size:.74rem}
footer small {
  grid-column:1/-1;
  border-top:1px solid #282732;
  padding-top:var(--mc-space-6);
  color:#777380}
.reveal {
  opacity:1;
  transform:none;
  transition:opacity .65s ease,transform .65s cubic-bezier(.2,.65,.3,1);
}
.reveal.reveal-pending {
  transition:none;
  opacity:0;
  transform:translateY(var(--mc-space-6));
}
.reveal.reveal-pending:focus-within {
  opacity:1;
  transform:none;
}
.reveal.visible {
  opacity:1;
  transform:none}
@keyframes pulse {
  50% {
  transform:scaleY(.55)}
}
@keyframes move {
  to {
  transform:translateX(-50%)}
}

    @media(max-width:1000px) {
  .nav {
  display:none}
.hero {
  grid-template-columns:1fr;
  padding-top:130px}
.hero-copy {
  max-width:700px}
.hero-stage {
  margin-top:0}
.world-grid {
  grid-template-columns:repeat(2,1fr)}
.flow {
  grid-template-columns:1fr}
.flow-map {
  max-width:600px;
  margin:auto;
  width:100%}
.section-heading {
  align-items:start;
  gap:40px}
.membership small {
  display:block;
  margin:15px 0 0}
footer {
  grid-template-columns:1fr auto}
footer p {
  display:none}
}

    @media(max-width:640px) {
  .header-inner {
  padding:0 20px}
.header-cta {
  display:none}
.menu-button {
  display:grid;
  gap:6px;
  }

.nav.open {
  display:flex;
  position:absolute;
  top:68px;
  left:12px;
  right:12px;
  background:var(--mc-surface-raised);
  padding:var(--mc-space-6);
  border-radius:var(--mc-radius-md);
  flex-direction:column;
  gap:20px}
.section {
  padding-left:var(--mc-space-5);
  padding-right:20px}
.hero {
  padding-top:115px;
  min-height:auto;
  gap:20px}
.hero h1 {
  font-size:3.75rem}
.hero-actions {
  align-items:flex-start;
  flex-direction:column;
  gap:10px}
.hero-stage {
  height:520px;
  transform:scale(.82);
  margin-left:-30px;
  margin-right:-30px}
.phone-card {
  height:540px}
.video-card {
  right:-15px}
.landing-book-card {
  left:-25px}
.marquee {
  margin-top:-15px}
.worlds {
  padding-top:100px;
  padding-bottom:80px}
.section-heading {
  display:block}
.section-heading>p {
  margin-top:26px}
.world-grid {
  grid-template-columns:1fr}
.world-card {
  min-height:450px}
.flow {
  padding-top:80px;
  padding-bottom:90px;
  gap:50px}
.flow-map {
  transform:scale(.92)}
.membership {
  padding-bottom:80px}
.membership-inner {
  padding:58px 26px;
  }
.membership h2 {
  font-size:3.4rem}
.benefits {
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:18px}
.membership .mc-button {
  width:100%}
footer {
  grid-template-columns:1fr}
footer div {
  flex-wrap:wrap}
}

    @media(prefers-reduced-motion:reduce) {
  *,*:before,*:after {
  animation:none!important;
  transition:none!important}
.reveal.reveal-pending {
  opacity:1;
  transform:none}
}



.main-landing  {
   isolation:isolate;
   overflow:clip;
   --radius:var(--mc-radius-md);
   }

.svg-icon  {
  width:1.2em;
  height:1.2em;
  flex-shrink:0;
  vertical-align:middle;
  }

.section, .hero-copy, .flow-copy, .world-card, .section-heading > *, .membership-inner  {
  min-width:0;
  }

h1,h2,h3,p,a,span  {
  overflow-wrap:anywhere;
  }

.hero-actions  {
  flex-wrap:wrap;
  gap:var(--mc-space-5);
  }

.world-card > a  {
  opacity:1;
  display:inline-flex;
  align-items:center;
  gap:var(--mc-space-2);
  }

.phone-tabs span  {
  justify-items:center;
  }

.benefits span  {
  display:flex;
  align-items:center;
  gap:var(--mc-space-2);
  }

.status-dots  {
  width:16px;
  height:5px;
  border-radius:4px;
  background:currentColor;
  }

section[id]  {
  scroll-margin-top:100px;
  }




.hero-stage, .membership-inner  {
  color:#f9f7ff;
  }

@media(max-width:640px) {
  .header-cta {
  display:inline-flex;
  min-height:44px;
  padding:8px 12px;
  }
.header-inner,.header.scrolled .header-inner {
  flex-wrap:wrap;
  height:auto;
  min-height:68px;
  gap:var(--mc-space-2);
  padding:10px 16px;
  }
.brand {
  font-size:1rem;
  }
.menu-button {
  display:grid;
  place-items:center;
  min-height:44px;
  min-width:44px;
  color:var(--mc-text-primary);
  }
.nav.open {
  top:100%;
  }
.hero-stage {
  transform:none;
  margin:0;
  height:auto;
  min-height:520px;
  }
.orbit {
  max-width:100%;
  }
.phone-card {
  width:min(280px,80%);
  }
.float-card {
  max-width:55%;
  }
.video-card {
  right:0;
  }
.landing-book-card {
  left:0;
  }
.hero h1 {
  font-size:clamp(2rem,11vw,3.75rem);
  }
.section-heading h2,.flow-copy h2,.membership h2 {
  font-size:clamp(1.8rem,9vw,3.4rem);
  }
.membership-inner {
  padding:40px 20px;
  }
.flow {
  gap:var(--mc-space-6);
  }
.node {
  width:15%;
  height:auto;
  aspect-ratio:1;
  border-radius:var(--mc-radius-md);
  }
.core {
  width:32%;
  height:auto;
  aspect-ratio:1;
  font-size:clamp(.55rem,3vw,1rem);
  }
.world-card {
  padding:var(--mc-space-5);
  }
.benefits {
  grid-template-columns:1fr;
  }
.price {
  flex-wrap:wrap;
  }
.membership-inner:after {
  display:none;
  }
}

@media(max-width:360px) {
  .section {
  padding-left:var(--mc-space-3);
  padding-right:var(--mc-space-3);
  }
.header-inner {
  padding:8px 12px;
  }
.hero {
  padding-top:160px;
  }
.hero-actions {
  align-items:stretch;
  }
.hero-stage {
  min-height:0;
  display:flex;
  flex-direction:column;
  gap:var(--mc-space-3);
  }
.phone-card {
  width:100%;
  height:510px;
  transform:none;
  padding:18px 12px;
  }
.hero-stage:before {
  width:100%;
  height:100%;
  }
.orbit {
  display:none;
  }
.float-card {
  position:relative;
  inset:auto;
  width:100%;
  max-width:100%;
  }
.video-card {
  height:auto;
  }
.play-ring {
  margin:12px auto;
  }
.landing-book-card {
  padding:var(--mc-space-3);
  gap:var(--mc-space-2);
  }
.course-card {
  padding:var(--mc-space-3);
  }
.trust-row {
  flex-wrap:wrap;
  }
.world-card {
  padding:var(--mc-space-4);
  min-height:0;
  }
.equalizer {
  gap:5px;
  }
.equalizer i {
  width:10px;
  }
.section-heading {
  margin-bottom:28px;
  }
.membership-inner {
  padding:28px 12px;
  }
.eyebrow {
  letter-spacing:.06em;
  }
.flow-map {
  transform:none;
  }
.n1 {
  left:43%;
  }
.node {
  font-size:.75rem;
  }
footer {
  padding:0 12px 30px;
  }
footer div {
  gap:var(--mc-space-4);
  }
.lead {
  font-size:1rem;
  }
.phone-card h2 {
  font-size:1.5rem;
  }
.album-art {
  height:210px;
  }
}




.main-landing  {
  --mc-card-spacing:var(--mc-space-6);
  }

.nav .mc-button  {
  padding-inline:var(--mc-space-3);
  }

.brand.mc-button  {
  padding-inline:0;
  justify-content:flex-start;
  color:var(--mc-text-primary);
  }

.hero-actions .mc-button  {
  max-width:100%;
  white-space:normal;
  line-height:1.4;
  }

.world-card  {
  display:flex;
  flex-direction:column;
  gap:var(--mc-space-3);
  }

.world-card > .mc-button  {
  align-self:flex-start;
  margin-top:auto;
  }

.world-card h3,.world-card p  {
  margin:0;
  }

.card-icon  {
  background:color-mix(in srgb,var(--mc-accent) 15%,var(--mc-surface));
  color:var(--mc-accent);
  border-radius:var(--mc-radius-md);
  }

.number  {
  color:var(--mc-text-muted);
  }

.hero-stage,.membership-inner  {
  color:var(--mc-text-primary);
  }

.trust-row b  {
  color:var(--mc-text-primary);
  }

.phone-card  {
  height:auto;
  min-height:560px;
  padding-bottom:80px;
  }

.phone-tabs  {
  gap:var(--mc-space-1);
  }

.phone-tabs .mc-button  {
  flex-shrink:1;
  }

.player  {
  position:relative;
  }

.landing-book-card > div  {
  min-width:0;
  }

.landing-book-card :deep(.ui-progress__meta)  {
  font-size:var(--mc-font-xs);
  }

.lesson > .ui-progress  {
  width:80%;
  margin-top:var(--mc-space-5);
  }

.people  {
  flex-wrap:wrap;
  }

.frame .mc-button  {
  position:relative;
  }

.membership-inner  {
  background:linear-gradient(135deg,color-mix(in srgb,var(--mc-accent) 20%,var(--mc-surface)),var(--mc-surface));
  }

.membership .kicker,.membership h2 em  {
  color:var(--mc-accent);
  }

.membership-inner:after  {
  pointer-events:none;
  }

.menu-button {
  display:none;
  }

@media(max-width:1000px) {
  .menu-button {
  display:inline-flex;
  }
.nav.open {
  display:flex;
  position:absolute;
  top:100%;
  left:var(--mc-space-3);
  right:var(--mc-space-3);
  flex-direction:column;
  gap:var(--mc-space-2);
  padding:var(--mc-space-4);
  border:1px solid var(--mc-border);
  border-radius:var(--mc-radius-md);
  background:var(--mc-surface);
  }
.header-inner {
  gap:var(--mc-space-2);
  }
}

@media(max-width:360px) {
  .header-inner {
  flex-wrap:wrap;
  }
.header-cta {
  order:3;
  flex-basis:100%;
  }
.hero {
  padding-top:180px;
  }
.nav .mc-button {
  white-space:normal;
  }
.world-card > .mc-button {
  align-self:stretch;
  padding-inline:var(--mc-space-2);
  }
.phone-card {
  height:auto;
  min-height:510px;
  }
.phone-tabs {
  inset-inline:var(--mc-space-2);
  }
.hero-actions {
  align-items:stretch;
  }
footer .mc-button {
  white-space:normal;
  max-width:100%;
  }
.flow-steps :deep(.ui-item__body) {
  flex-wrap:wrap;
  }
.landing-book-card :deep(.ui-progress__meta) {
  flex-wrap:wrap;
  }
}
@media (max-width:640px) {
  section[id] {scroll-margin-top:136px;}
  .hero h1 {line-height:1.08;}
  .section-heading h2,.flow-copy h2,.membership h2 {line-height:1.12;}
}
.album-art {width:100%;min-width:0;color:var(--mcrn-color-on-artwork);}
</style>
