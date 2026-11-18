# Website tri ân 20/11

Website: https://nmt-2k10.github.io/11_TIN_20-11/

Repository: https://github.com/NMT-2k10/11_TIN_20-11

Website tĩnh HTML/CSS/JavaScript, chạy được trên GitHub Pages. Không cần cài thư viện hoặc build để triển khai.

## Đưa lên GitHub Pages

1. Tạo repository trống trên GitHub, ví dụ `20-11`.
2. Đưa **nội dung** thư mục này vào gốc repository: `index.html` phải nằm ngay ở ngoài cùng, cùng cấp với `assets/`, `vendor/` và `.nojekyll`.
3. Vào **Settings → Pages → Build and deployment**. Chọn **Deploy from a branch**, nhánh **main**, thư mục **/ (root)**, rồi **Save**.
4. Khi GitHub triển khai xong, mở địa chỉ được hiển thị trong trang Pages, thường là `https://TEN_CUA_BAN.github.io/20-11/`.

Tệp `.nojekyll` đã được thêm để GitHub phục vụ trực tiếp website tĩnh.

File nhạc ngân hà `assets/music/galaxy.mp3` khoảng 28,8 MB: dùng Git hoặc GitHub Desktop để đẩy repository. File này vượt giới hạn 25 MiB khi tải bằng trình duyệt, nhưng nhỏ hơn giới hạn 100 MiB của Git.

Ví dụ dùng Git trong PowerShell tại thư mục dự án, với repository GitHub mới tạo và còn trống:

```powershell
git init
git add .
git commit -m "Prepare Teachers Day website"
git branch -M main
git remote add origin https://github.com/TEN_CUA_BAN/20-11.git
git push -u origin main
```

Thay `TEN_CUA_BAN` và tên repository trong đường dẫn trước khi chạy.

Tài liệu: [Cấu hình GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site), [giới hạn tải tệp](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository).

## Xem và chỉnh sửa ở máy tính

Cần Node.js để dùng máy chủ xem thử:

```powershell
npm start
```

Mở `http://localhost:2011`. Không cần chạy `npm install`. `server.mjs` và `package.json` phục vụ việc xem/chỉnh sửa ở máy tính; GitHub Pages không chạy máy chủ Node.js này.

`npm run check` kiểm tra cú pháp JavaScript.

## Nội dung và tài nguyên

- Sửa `config.js` để đổi lời chúc, người gửi, ảnh và nhạc.
- `music` / `musicVolume`: nhạc mở đầu, hiện ở mức 50%.
- `giftMusic` / `giftMusicVolume`: nhạc phần quà.
- `galaxyMusic` / `galaxyMusicVolume`: nhạc thiên hà, hiện ở mức 55%.
- `galaxy.title`, `galaxy.messages`, `galaxy.photos`: tiêu đề, lời nhắn và ảnh riêng của thiên hà. Nếu không khai báo `galaxy.photos`, màn này dùng mảng `photos` chung.
- `assets/` và `vendor/` chứa tài nguyên cần để chạy web. Giữ nguyên cấu trúc các thư mục và các tệp giấy phép font/thư viện.

Luồng chính: mở đầu → bảng phấn → hoa tri ân → thước phim → phần quà, thư và pháo hoa → bảng tri ân → thiên hà.

Thư hiện từng từ theo mẫu Flower Garden. Thước phim tự chạy. Nút “Tiếp tục” ở bảng tri ân mở màn thiên hà; quay lại từ thiên hà sẽ về đúng bảng tri ân.

Xem nhanh bằng `?scene=classroom`, `?scene=flower`, `?scene=memories`, `?scene=gift`, `?scene=galaxy`. `?scene=gift&resume=finale` mở thẳng bảng tri ân để xem thử. `?scene=gift&resume=fireworks` mở thẳng đoạn pháo hoa có chân dung cô sau khi bấm bắt đầu.

Nguồn tham khảo và ghi nhận tác giả nằm trong `vendor/README.md`, `vendor/galaxy/README.md` và các tệp giấy phép đi kèm.
