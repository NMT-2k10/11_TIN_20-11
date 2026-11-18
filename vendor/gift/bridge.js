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
    morphTexts: config.particleMessages?.length ? config.particleMessages : ['20 tháng 11', 'Gửi cô', 'Tập thể lớp 11 Tin', 'Chúc mừng ngày Nhà giáo Việt Nam'],
    particleImage: asset('image/anh5.jpg'), particleImageShape: 'heart', particleColor: '#f5c986', heartName: 'Gửi cô',
    enableSphere: true, sphereImages: photos, enableSphereFlyingImages: true,
    flyingCaptions: [
      '11 Tin đây ạ!', 'Cả lớp cùng cô', 'Lớp mình đây!', 'Ngày vui của cô',
      'Gia đình của cô', 'Hai mẹ con', 'Một ngày thật vui', 'Cô và em bé',
      'Cô ngoài giờ lên lớp', 'Một dịp gặp nhau', 'Nụ cười của cô', 'Cô bên hoa',
      'Thêm một tấm ảnh của cô', 'Ảnh chung của lớp', 'Một ngày đáng nhớ', 'Cô cùng 11 Tin',
      'Đông đủ cả lớp', 'Chụp thêm một tấm nữa', 'Những gương mặt quen', 'Một buổi ở trường'
    ],
    enableLetter: true,
    letter: { title: config.letterTitle, text: (config.letter || []).join('\n\n'), image: photos[0], caption: 'Kỷ niệm của lớp chúng em', signature: config.sender, envColor: 'navy' },
    bgMusic: asset(config.giftMusic || 'vendor/gift/assets/music/gift.mp3'),
    bgVolume: Math.max(0,Math.min(1,Number.isFinite(Number(config.giftMusicVolume)) ? Number(config.giftMusicVolume) : .55)), autoPlay: false,
    recipientName: 'Cô', enableCalendar: true,
    calendar: { day: 20, month: 11, title: 'Ngày Nhà giáo Việt Nam', caption: 'Hôm nay là ngày của cô' },
    enableBouquet: true,
    bouquet: {
      count: 9, color: 'pink', title: config.bouquetTitle, note: config.bouquetNote,
      meaning: '', subtitle: config.bouquetMessage,
      decoration: asset('assets/icons/bouquet-ornament.svg'),
      keepsakes: [
        { src: asset('image/anh1.jpg'), caption: '11 Tin' },
        { src: asset('image/anh2.jpg'), caption: 'Kỷ niệm cùng cô' }
      ]
    },
    enableGiftBox: true,
    giftBox: { color: 'navy', title: 'Từ 11 Tin, gửi cô', message: config.scratchMessage, image: photos[1] || photos[0] },
    enableFinale: true,
    finale: { texts: ['20.11', 'Cảm ơn cô', 'Chúc mừng ngày Nhà giáo Việt Nam'], message: config.finalMessage, loveStart: '', counterLabel: 'Những ngày đi học' }
  };
  // Returning from the galaxy opens the tribute panel without replaying the gift.
  const resume = new URLSearchParams(location.search).get('resume');
  if (['finale', 'fireworks'].includes(resume)) {
    for (const key of ['enableCalendar','enableMorphEffect','enableBouquet','enableSphere','enableLetter','enableGiftBox']) window.APP_CONFIG[key] = false;
    window.APP_CONFIG.finale.skipIntro = resume === 'finale';
    window.APP_CONFIG.finale.previewPortrait = resume === 'fireworks';
  }
  window.DEFAULT_APP_CONFIG = window.APP_CONFIG;
  window.APP_CONFIG_PROMISE = Promise.resolve(window.APP_CONFIG);
  const passcode = document.getElementById('passcodeScreen');
  if (passcode) passcode.style.display = 'none';
  document.documentElement.lang = 'vi';
  document.title = window.APP_CONFIG.appTitle;
})();
