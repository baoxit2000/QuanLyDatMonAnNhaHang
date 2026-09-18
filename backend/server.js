const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: 'localhost',
  port: 3307,
  user: 'root',
  password: '',
  database: 'quanly_nhahang'
});

db.connect(err => {
  if (err) {
    console.error('Lỗi kết nối MySQL:', err);
  } else {
    console.log('Đã kết nối MySQL port 3307!');
    
    // Đảm bảo bảng mon_an có đầy đủ cấu trúc cột
    db.query("ALTER TABLE mon_an ADD COLUMN IF NOT EXISTS loai_mon VARCHAR(50) DEFAULT 'Món chính'");
    db.query("ALTER TABLE mon_an ADD COLUMN IF NOT EXISTS hinh_anh TEXT");
    db.query("ALTER TABLE mon_an ADD COLUMN IF NOT EXISTS so_luong INT DEFAULT 50");

    // Xóa sạch dữ liệu cũ và nạp mới dữ liệu đa dạng cho NHÀ HÀNG QUÂN BẢO
    db.query("DELETE FROM mon_an", () => {
      const samples = [
        ['Phở Bò Tái Nạm', 55000, 'Món chính', 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=500', 50],
        ['Cơm Tấm Sườn Bì Chả', 50000, 'Món chính', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500', 40],
        ['Bún Chả Hà Nội', 48000, 'Món chính', 'https://images.unsplash.com/photo-1562967914-608f82629710?w=500', 35],
        ['Trà Đào Cam Sả', 30000, 'Nước uống', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500', 100],
        ['Cà Phê Sữa Đá', 25000, 'Nước uống', 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500', 100],
        ['Trà Sữa Trân Châu', 35000, 'Nước uống', 'https://images.unsplash.com/photo-1558857563-b371033873b8?w=500', 80],
        ['Bánh Flan Caramel', 20000, 'Tráng miệng', 'https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=500', 30],
        ['Rau Câu Dừa', 18000, 'Tráng miệng', 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500', 45]
      ];
      db.query("INSERT INTO mon_an (ten_mon, gia, loai_mon, hinh_anh, so_luong) VALUES ?", [samples], (err) => {
        if (!err) console.log('✅ Đã nạp đầy đủ thực đơn 3 danh mục cho Nhà Hàng Quân Bảo!');
      });
    });
  }
});

// GET: Lấy toàn bộ món
app.get('/api/mon-an', (req, res) => {
  db.query('SELECT * FROM mon_an', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// POST: Thêm món mới
app.post('/api/mon-an', (req, res) => {
  const { ten_mon, gia, loai_mon, hinh_anh, so_luong } = req.body;
  const sql = 'INSERT INTO mon_an (ten_mon, gia, loai_mon, hinh_anh, so_luong) VALUES (?, ?, ?, ?, ?)';
  db.query(sql, [ten_mon, gia, loai_mon || 'Món chính', hinh_anh || '', so_luong || 10], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Thêm món thành công!', id: result.insertId });
  });
});

// PUT: Cập nhật món
app.put('/api/mon-an/:id', (req, res) => {
  const { ten_mon, gia, loai_mon, so_luong, hinh_anh } = req.body;
  const sql = 'UPDATE mon_an SET ten_mon = ?, gia = ?, loai_mon = ?, so_luong = ?, hinh_anh = ? WHERE id = ?';
  db.query(sql, [ten_mon, gia, loai_mon, so_luong, hinh_anh, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Cập nhật thành công!' });
  });
});

// DELETE: Xóa món
app.delete('/api/mon-an/:id', (req, res) => {
  db.query('DELETE FROM mon_an WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Xóa món thành công!' });
  });
});

// POST: Đặt món
app.post('/api/don-hang', (req, res) => {
  const { mon_id, ten_mon, so_luong_dat, gia, ten_khach, so_ban } = req.body;
  const tongTien = gia * so_luong_dat;

  db.query('SELECT so_luong FROM mon_an WHERE id = ?', [mon_id], (err, results) => {
    if (err || results.length === 0) return res.status(400).json({ error: 'Món ăn không tồn tại!' });
    
    const khoHienTai = results[0].so_luong;
    if (khoHienTai < so_luong_dat) {
      return res.status(400).json({ error: `Chỉ còn ${khoHienTai} phần trong kho!` });
    }

    db.query('UPDATE mon_an SET so_luong = so_luong - ? WHERE id = ?', [so_luong_dat, mon_id], (err) => {
      if (err) return res.status(500).json({ error: err.message });

      const sqlOrder = 'INSERT INTO don_hang (ten_khach, so_ban, tong_tien, trang_thai) VALUES (?, ?, ?, ?)';
      const ghiChu = `${ten_mon} (x${so_luong_dat})`;
      db.query(sqlOrder, [`${ten_khach || 'Khách bàn 1'} - ${ghiChu}`, so_ban || 1, tongTien, "Mới đặt"], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Đặt món thành công!', id: result.insertId });
      });
    });
  });
});

app.listen(5000, () => console.log('Server Nhà Hàng Quân Bảo dang chay tai port 5000'));