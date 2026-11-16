# Các phần giao diện tham khảo được tích hợp

- `bloom/`: bản giao diện hoa từ https://bunghoa.ai.studio/ theo yêu cầu sao chép mẫu của người dùng. Ảnh nằm trong `assets/bloom/`; màu hoa và các màn bung hoa chạy tự động trước khi chuyển sang thước phim.
- `gift/`: phần ứng dụng từ https://lovegift.pro/templates/mon-qua-nho-2010/app/ (mẫu người dùng cung cấp). Giữ giao diện và hiệu ứng của mẫu; `bridge.js` cấp nội dung 20/11, ảnh lớp và lời chúc từ `config.js`. Bỏ script thống kê Cloudflare và thay bridge mặc định theo mùa bằng cấu hình của dự án.
- Ảnh hoa dùng bởi bản mẫu lấy từ https://qrlovegift.com/gifts/, lưu cục bộ ở `assets/bloom/`.
- `galaxy/`: màn ngân hà ảnh được tích hợp từ dự án Flower Garden cục bộ. Giữ thông tin tác giả, giấy phép Three.js và font trong thư mục này; nội dung và ảnh lấy từ `config.js` của dự án 20/11.

Mã nguồn, hình ảnh và thư viện trong các phần giao diện này giữ quyền và thông báo của các tác giả tương ứng. Đây là tài nguyên của mẫu được người dùng yêu cầu tích hợp, không phải mã tự triển khai mới của dự án.

Các phần chạy trong iframe cùng nguồn, nạp khi chuyển tới cảnh tương ứng và được gỡ khi rời cảnh để dừng các vòng lặp hoạt ảnh. Phần quà và thiên hà dùng WebGL; phông của phần quà có thể tải từ Google Fonts. Dùng máy chủ HTTP (`npm start`) khi xem thay vì mở file trực tiếp.


Âm thanh Lovegift đã được khôi phục: createGiftAudio() tạo trình phát bài riêng, SFX gốc được bật. GiftAudioControls cho phép trang chính dừng âm thanh khi rời cảnh và điều khiển tắt/bật. Các nút trùng trong iframe tiếp tục ẩn để dùng một bộ nút chung.
