// Chỉ cần sửa tệp này để đổi tên, lời chúc, ảnh và nhạc cho lớp của bạn.
window.GIFT_CONFIG = {
  title: '20/11 · Món quà nhỏ gửi cô',
  recipient: 'cô',
  sender: 'Tập thể lớp 11 Tin',
  letterTitle: 'Gửi cô,',
  letter: [
    'Nhân ngày Nhà giáo Việt Nam 20/11, tập thể lớp 11 Tin chúng em chúc cô luôn mạnh khỏe, vui vẻ, hạnh phúc và gặp nhiều điều tốt đẹp trong cuộc sống.',
    'Chúng em muốn cảm ơn cô vì đã luôn quan tâm, dạy dỗ và đồng hành cùng lớp trong suốt thời gian qua. Cảm ơn cô vì những bài giảng, những lời động viên và cả những lần nhắc nhở để chúng em ngày càng tiến bộ hơn.',
    'Chúng em biết đôi khi lớp vẫn còn những lúc chưa ngoan, chưa thực sự tập trung và khiến cô phải nhắc nhở nhiều. Chúng em sẽ cố gắng học tập tốt hơn, có ý thức hơn và cùng nhau xây dựng một tập thể đoàn kết để cô yên tâm hơn về lớp.',
    'Cuối cùng, chúng em mong cô luôn giữ gìn sức khỏe, có thật nhiều niềm vui trong công việc và cuộc sống. Hy vọng cô và lớp mình sẽ có thêm thật nhiều kỷ niệm đẹp trong thời gian sắp tới. Chúc cô có một ngày 20/11 thật vui và ý nghĩa!'
  ],
  // Ảnh kỷ niệm dùng chung cho album, phần quà và thiên hà.
  photos: Array.from({ length: 48 }, (_, index) => ({
    src: index === 32 ? 'image/anh45.jpg' : `image/anh${index + 1}.jpg`,
    caption: ['Kỷ niệm của lớp 11 Tin', 'Những khoảnh khắc đáng nhớ', 'Cô và chúng em'][index % 3],
    alt: `Ảnh kỷ niệm ${index + 1}`
  })),
  music: 'assets/music/opening.mp3',
  musicVolume: 0.5,
  giftMusic: 'vendor/gift/assets/music/gift.mp3',
  giftMusicVolume: 0.55,
  galaxyMusic: 'assets/music/galaxy.mp3',
  galaxyMusicVolume: 0.55,
  bouquetTitle: '11 Tin gửi cô',
  bouquetNote: [],
  bouquetMessage: '20 · 11 · 2026',
  scratchMessage: 'Chúng em sẽ cố gắng chăm học hơn, chú ý nghe giảng và bớt để cô phải nhắc nhở.',
  finalMessage: 'Chúc cô luôn mạnh khỏe, vui vẻ, hạnh phúc và có thật nhiều niềm vui trong cuộc sống. Cảm ơn cô vì tất cả những điều cô đã dành cho chúng em!',
  finalePortrait: 'image/anh12.jpg',
  galaxy: {
    title: 'Chúc mừng ngày Nhà giáo Việt Nam',
    messages: [
      'Chúc cô luôn mạnh khỏe.',
      'Luôn vui vẻ và hạnh phúc.',
      'Mọi việc đều thuận lợi.',
      'Luôn tràn đầy năng lượng.',
      'Chúc cô ngày 20/11 thật ý nghĩa.'
    ]
  },
  // Đổi thành true để thêm màn hình nhập mã như mẫu Lovegift.
  enablePasscode: false,
  passcode: '2011',
  passcodeHint: 'Gợi ý: Ngày Nhà giáo Việt Nam, gồm 4 chữ số.',
  particleMessages: ['20 · 11', 'Nhân ngày Nhà giáo Việt Nam', 'Tập thể lớp 11 Tin']
};
