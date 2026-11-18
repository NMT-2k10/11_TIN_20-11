# Màn ngân hà ảnh

Hình ảnh 3D được điều chỉnh từ mã trình duyệt công khai của https://love-galaxy-pro.netlify.app/ (chuỗi tác giả trong bản mẫu: Luc Thien Phong). Giữ hệ hạt, trái tim, shader, sao băng, hiệu ứng lưu ảnh và chuỗi cinematic intro. Bản cục bộ bỏ thư và bảng hướng dẫn của trang mẫu; dùng ảnh và nhạc đang có trong Flower Garden.

- `knowledge-symbol.js`: hoa sen nở 34 cánh bằng hạt sáng, có lớp cánh thấp, đài sen, gân cánh và gân lá, gương sen, nhị vàng và giọt sương; cùng cơ chế tụ hình với quả cầu.
  Bố cục vườn sen gồm một bông chính và hai bông phụ 35%/50%, xếp lệch tầng phía sau. Hạt được gộp theo lớp để hạn chế số lần vẽ. Ảnh kỷ niệm rải đủ vòng quanh đĩa thiên hà, cùng chuyển động xoay và có thể bấm để xem lớn.
- `scene.js`: cảnh 3D, phóng to/thu nhỏ, chọn ảnh và quản lý tài nguyên.
- `cinematic.js`: bấm trái tim hoặc quả cầu sáng ở giữa để chạy camera qua lõi sáng, vòng quanh trái tim, lùi ra panorama, hạ xuống xoắn ốc và bay xuyên ngân hà. Kết thúc tự trả quyền điều khiển; bấm chuột/chạm, lăn chuột hoặc Escape dừng ngay hiệu ứng tại góc nhìn hiện tại. Bấm lại trái tim hoặc quả cầu sáng để chạy lại chuỗi. Không tạo thư, phong bì hay cửa sổ đọc thư.
- `index.html`, `galaxy.css`, `boot.js`: giao diện xem ảnh, quay lại và dự phòng khi thiết bị không mở được WebGL.
- `vendor/`: Three.js 0.136.0 và module cần thiết; import cục bộ, giấy phép trong `vendor/LICENSE`.
- `fonts/`, `fonts.css`: Mali/Pacifico cục bộ và giấy phép font.

Tích hợp trong dự án 20/11: ảnh mặc định lấy từ `photos` trong `config.js`. Có thể thêm `galaxy.title`, `galaxy.messages`, `galaxy.photos` để tùy chỉnh riêng. Nút “Tiếp tục” ở bảng tri ân mở cảnh này; quay lại sẽ trở về bảng tri ân, không chạy lại toàn bộ phần quà. Nhạc do trang cha quản lý, tắt âm thanh phần quà trước khi mở thiên hà. Khi thiết bị bật giảm chuyển động, cinematic dùng chuyển cảnh panorama nhẹ thay cho các đoạn xoay và xuyên lõi.

Góc nhìn mặc định nằm trong vòng ảnh, thấp gần mặt phẳng ảnh. Nút đặt lại góc nhìn trở về đúng vị trí này; nút Cinematic riêng đã được bỏ.


Giữ chuột trái rồi kéo để xoay camera; di chuột thông thường không đổi góc nhìn. Ảnh trôi quanh ngân hà với tốc độ 0,05 radian/giây, gấp 2 lần bản trước. Bật giảm chuyển động vẫn tắt phần trôi tự động.
