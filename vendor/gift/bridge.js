// Cấu hình 20/11 cho phần quà; dùng cùng ảnh và lời chúc của website chính.
(() => {
  // This scene owns its native music and sound effects; the parent pauses its song.
  window.createGiftAudio = () => {
    const audio = new Audio(window.APP_CONFIG.bgMusic);
    window.giftBackgroundAudio=audio;
    const report = () => parent.postMessage({type:'gift-audio-state'},location.origin);
    ['playing','pause','volumechange'].forEach(event=>audio.addEventListener(event,report));
    return audio;
  };
  const config = parent.GIFT_CONFIG || {};
  const root = new URL('../../', location.href);
  const asset = value => new URL(value, root).href;
  const photos = (config.photos || []).map(photo => asset(photo.src));
  window.APP_CONFIG = {
    appTitle: 'Món quà tri ân · 20/11', appIcon: asset('assets/icons/flower.svg'), enableWebsiteInfo: true,
    enablePasscode: false, passcode: '2011', enableMorphEffect: true,
    morphTexts: ['Chúc mừng', 'Ngày Nhà giáo Việt Nam', '20 tháng 11', 'Cảm ơn thầy cô vì tất cả'],
    particleImage: asset('assets/images/start-logo.png'), particleImageShape: 'heart', particleColor: '#f5c986', heartName: 'Thầy Cô',
    enableSphere: true, sphereImages: photos, enableSphereFlyingImages: true,
    flyingCaptions: ['Cảm ơn người gieo ước mơ ♡', 'Một thời áo trắng', 'Mãi nhớ mái trường', 'Tri ân thầy cô · 20/11'],
    enableLetter: true,
    letter: { title: config.letterTitle, text: (config.letter || []).join('\n\n'), image: photos[0], caption: 'Những ngày bên thầy cô ♡', signature: config.sender, envColor: 'navy' },
    bgMusic: asset(config.giftMusic || 'vendor/gift/assets/music/gift.mp3'),
    bgVolume: Math.max(0,Math.min(1,Number.isFinite(Number(config.giftMusicVolume)) ? Number(config.giftMusicVolume) : .55)), autoPlay: false,
    recipientName: 'Thầy Cô', enableCalendar: true,
    calendar: { day: 20, month: 11, title: 'Ngày Nhà giáo Việt Nam', caption: 'Gửi ngàn lời tri ân ♡' },
    enableBouquet: true,
    bouquet: { count: 9, color: 'pink', title: config.bouquetTitle, meaning: 'Tôn kính và biết ơn', subtitle: config.bouquetMessage },
    enableGiftBox: true,
    giftBox: { color: 'navy', message: config.scratchMessage, image: photos[1] || photos[0] },
    enableFinale: true,
    finale: { texts: ['20.11', 'Tri Ân Thầy Cô', 'Chúc mừng ngày nhà giáo Việt Nam'], message: config.finalMessage, loveStart: '', counterLabel: 'Những mùa tri thức' }
  };
  // Returning from the galaxy opens the tribute panel without replaying the gift.
  if (new URLSearchParams(location.search).get('resume') === 'finale') {
    for (const key of ['enableCalendar','enableMorphEffect','enableBouquet','enableSphere','enableLetter','enableGiftBox']) window.APP_CONFIG[key] = false;
    window.APP_CONFIG.finale.skipIntro = true;
  }
  window.DEFAULT_APP_CONFIG = window.APP_CONFIG;
  window.APP_CONFIG_PROMISE = Promise.resolve(window.APP_CONFIG);
  const passcode = document.getElementById('passcodeScreen');
  if (passcode) passcode.style.display = 'none';
  document.documentElement.lang = 'vi';
  document.title = window.APP_CONFIG.appTitle;
})();
