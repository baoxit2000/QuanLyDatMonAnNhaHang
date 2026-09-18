import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, TextInput, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500';

export default function App() {
  const [tab, setTab] = useState('menu'); // 'menu' | 'cart' | 'admin'
  const [menu, setMenu] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  
  // State Đơn Gọi Món: lưu các món khách chọn
  const [cart, setCart] = useState([]);

  // State Form Admin
  const [editingId, setEditingId] = useState(null);
  const [tenMon, setTenMon] = useState('');
  const [gia, setGia] = useState('');
  const [loaiMon, setLoaiMon] = useState('Món chính');
  const [soLuong, setSoLuong] = useState('50');
  const [hinhAnh, setHinhAnh] = useState('');

  useEffect(() => {
    loadMenu();
  }, [tab]);

  const loadMenu = () => {
    axios.get(`${API_URL}/mon-an`)
      .then(res => setMenu(res.data))
      .catch(err => console.log('Lỗi API menu:', err));
  };

  // Chọn món vào danh sách order
  const addToCart = (mon) => {
    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(item => item.id === mon.id);
      if (existingIndex > -1) {
        const updatedCart = [...prevCart];
        updatedCart[existingIndex].so_luong_dat += 1;
        return updatedCart;
      } else {
        return [...prevCart, { ...mon, so_luong_dat: 1 }];
      }
    });
    alert(`🍽️ Đã thêm "${mon.ten_mon}" vào danh sách gọi món!`);
  };

  // Thay đổi số lượng món trong phiếu gọi món
  const updateCartQty = (id, change) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.id === id) {
          const newQty = item.so_luong_dat + change;
          return newQty > 0 ? { ...item, so_luong_dat: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  // Bỏ món khỏi danh sách
  const removeFromCart = (id) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  };

  // Tính tổng tiền
  const tongTienGioHang = cart.reduce((sum, item) => sum + (item.gia * item.so_luong_dat), 0);
  const tongSoLuongMon = cart.reduce((sum, item) => sum + item.so_luong_dat, 0);

  // Gửi đơn hàng vào bếp
  const datHangTuGio = async () => {
    if (cart.length === 0) return alert('Danh sách gọi món đang trống!');

    try {
      for (const item of cart) {
        await axios.post(`${API_URL}/don-hang`, {
          mon_id: item.id,
          ten_mon: item.ten_mon,
          so_luong_dat: item.so_luong_dat,
          gia: item.gia,
          ten_khach: 'Khách bàn 1',
          so_ban: 1
        });
      }
      alert('🎉 Đã chuyển đơn gọi món vào bếp thành công!');
      setCart([]);
      loadMenu();
    } catch (err) {
      alert('❌ Lỗi đặt món: ' + (err.response?.data?.error || err.message));
    }
  };

  // Các hàm Quản lý Admin
  const luuMon = () => {
    if (!tenMon || !gia) return alert('Vui lòng nhập Tên món và Giá!');
    const payload = { ten_mon: tenMon, gia: Number(gia), loai_mon: loaiMon, so_luong: Number(soLuong) || 0, hinh_anh: hinhAnh };

    if (editingId) {
      axios.put(`${API_URL}/mon-an/${editingId}`, payload).then(() => {
        alert('✅ Đã cập nhật món!');
        resetForm(); loadMenu();
      });
    } else {
      axios.post(`${API_URL}/mon-an`, payload).then(() => {
        alert('✅ Thêm món thành công!');
        resetForm(); loadMenu();
      });
    }
  };

  const chonSua = (item) => {
    setEditingId(item.id); setTenMon(item.ten_mon); setGia(String(item.gia));
    setLoaiMon(item.loai_mon || 'Món chính'); setSoLuong(String(item.so_luong ?? 50)); setHinhAnh(item.hinh_anh || '');
  };

  const xoaMon = (id) => {
    if (window.confirm('Bạn muốn xóa món này khỏi thực đơn Nhà Hàng Quân Bảo?')) {
      axios.delete(`${API_URL}/mon-an/${id}`).then(() => { alert('🗑️ Đã xóa món!'); loadMenu(); });
    }
  };

  const resetForm = () => {
    setEditingId(null); setTenMon(''); setGia(''); setLoaiMon('Món chính'); setSoLuong('50'); setHinhAnh('');
  };

  const filteredMenu = selectedCategory === 'Tất cả' 
    ? menu 
    : menu.filter(item => (item.loai_mon || 'Món chính') === selectedCategory);

  return (
    <SafeAreaView style={styles.container}>
      {/* Topbar Navigation */}
      <View style={styles.navbar}>
        <Text style={styles.brand}>🏪 NHÀ HÀNG QUÂN BẢO</Text>
        <View style={styles.navMenu}>
          <TouchableOpacity style={[styles.navItem, tab === 'menu' && styles.navItemActive]} onPress={() => setTab('menu')}>
            <Text style={[styles.navText, tab === 'menu' && styles.navTextActive]}>Menu Thực Đơn</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.navItem, tab === 'cart' && styles.navItemActive]} onPress={() => setTab('cart')}>
            <Text style={[styles.navText, tab === 'cart' && styles.navTextActive]}>
              📋 Đơn Gọi Món {tongSoLuongMon > 0 ? `(${tongSoLuongMon})` : ''}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.navItem, tab === 'admin' && styles.navItemActive]} onPress={() => setTab('admin')}>
            <Text style={[styles.navText, tab === 'admin' && styles.navTextActive]}>Quản Lý Admin/Bếp</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* TAB 1: MENU ĐẶT MÓN */}
      {tab === 'menu' && (
        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>Thực Đơn Nhà Hàng Quân Bảo</Text>
          
          <View style={styles.categoryContainer}>
            {['Tất cả', 'Món chính', 'Nước uống', 'Tráng miệng'].map((cat) => (
              <TouchableOpacity key={cat} style={[styles.categoryBtn, selectedCategory === cat && styles.categoryBtnActive]} onPress={() => setSelectedCategory(cat)}>
                <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.grid}>
            {filteredMenu.map((item) => (
              <View key={item.id} style={styles.card}>
                <Image source={{ uri: item.hinh_anh || DEFAULT_IMAGE }} style={styles.cardImage} />
                <View style={styles.cardBody}>
                  <Text style={styles.title}>{item.ten_mon}</Text>
                  <Text style={styles.categoryBadge}>{item.loai_mon} | Kho: {item.so_luong}</Text>
                  <Text style={styles.price}>{Number(item.gia).toLocaleString('vi-VN')} VNĐ</Text>

                  <TouchableOpacity style={styles.btn} onPress={() => addToCart(item)}>
                    <Text style={styles.btnText}>➕ Chọn Món</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* TAB 2: ĐƠN GỌI MÓN */}
      {tab === 'cart' && (
        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>📋 Danh Sách Món Đã Chọn</Text>

          {cart.length === 0 ? (
            <View style={styles.emptyCartBox}>
              <Text style={{ fontSize: 16, color: '#64748b' }}>Chưa có món nào được chọn.</Text>
              <TouchableOpacity style={[styles.btn, { marginTop: 15, paddingHorizontal: 20 }]} onPress={() => setTab('menu')}>
                <Text style={styles.btnText}>Xem Thực Đơn</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              {cart.map((item) => (
                <View key={item.id} style={styles.cartItem}>
                  <Image source={{ uri: item.hinh_anh || DEFAULT_IMAGE }} style={styles.cartImage} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{item.ten_mon}</Text>
                    <Text style={{ color: '#e63946', fontWeight: 'bold' }}>{Number(item.gia).toLocaleString('vi-VN')} VNĐ</Text>
                  </View>

                  {/* Tăng / giảm số lượng */}
                  <View style={styles.qtyBox}>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => updateCartQty(item.id, -1)}>
                      <Text style={styles.qtyBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.so_luong_dat}</Text>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => updateCartQty(item.id, 1)}>
                      <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={{ width: 100, textAlign: 'right', fontWeight: 'bold', color: '#0f172a' }}>
                    {Number(item.gia * item.so_luong_dat).toLocaleString('vi-VN')}đ
                  </Text>

                  <TouchableOpacity style={styles.btnRemove} onPress={() => removeFromCart(item.id)}>
                    <Text style={{ color: '#ef4444', fontWeight: 'bold', marginLeft: 10 }}>Bỏ món</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {/* Tổng thanh toán */}
              <View style={styles.cartSummary}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Tổng tạm tính:</Text>
                  <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#e63946' }}>
                    {Number(tongTienGioHang).toLocaleString('vi-VN')} VNĐ
                  </Text>
                </View>

                <TouchableOpacity style={styles.btnCheckout} onPress={datHangTuGio}>
                  <Text style={styles.btnCheckoutText}>🚀 GỬI YÊU CẦU VÀO BẾP</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* TAB 3: ADMIN */}
      {tab === 'admin' && (
        <ScrollView style={styles.content}>
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>{editingId ? '✏️ CẬP NHẬT MÓN ĂN' : '➕ THÊM MÓN MỚI (NHÀ HÀNG QUÂN BẢO)'}</Text>
            <TextInput style={styles.input} placeholder="Tên món ăn" value={tenMon} onChangeText={setTenMon} />
            <TextInput style={styles.input} placeholder="Giá tiền (VNĐ)" keyboardType="numeric" value={gia} onChangeText={setGia} />
            <TextInput style={styles.input} placeholder="Số lượng trong kho" keyboardType="numeric" value={soLuong} onChangeText={setSoLuong} />
            <TextInput style={styles.input} placeholder="URL Hình ảnh" value={hinhAnh} onChangeText={setHinhAnh} />
            
            <View style={{ flexDirection: 'row', gap: 10, marginVertical: 10 }}>
              {['Món chính', 'Nước uống', 'Tráng miệng'].map((cat) => (
                <TouchableOpacity key={cat} style={[styles.typeBtn, loaiMon === cat && styles.typeBtnActive]} onPress={() => setLoaiMon(cat)}>
                  <Text style={{ color: loaiMon === cat ? '#fff' : '#333', fontWeight: 'bold' }}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={[styles.btnAdd, { flex: 1 }]} onPress={luuMon}>
                <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>{editingId ? 'Lưu Thay Đổi' : 'Thêm Món'}</Text>
              </TouchableOpacity>
              {editingId && (
                <TouchableOpacity style={[styles.btnCancel, { flex: 1 }]} onPress={resetForm}>
                  <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>Hủy Bỏ</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <Text style={styles.sectionTitle}>Danh Sách Món Ăn Hiện Có</Text>
          {menu.map((item) => (
            <View key={item.id} style={styles.manageItem}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{item.ten_mon}</Text>
                <Text style={{ color: '#64748b' }}>Phân loại: {item.loai_mon} | Kho: {item.so_luong}</Text>
              </View>
              <Text style={{ color: '#e63946', fontWeight: 'bold', marginRight: 15 }}>{Number(item.gia).toLocaleString('vi-VN')} VNĐ</Text>
              <TouchableOpacity style={styles.btnEdit} onPress={() => chonSua(item)}><Text style={{ color: '#fff', fontWeight: 'bold' }}>Sửa</Text></TouchableOpacity>
              <TouchableOpacity style={styles.btnDelete} onPress={() => xoaMon(item.id)}><Text style={{ color: '#fff', fontWeight: 'bold' }}>Xóa</Text></TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8' },
  navbar: { backgroundColor: '#0f172a', paddingHorizontal: 20, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { color: '#f59e0b', fontSize: 20, fontWeight: 'bold' },
  navMenu: { flexDirection: 'row', gap: 10 },
  navItem: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 6 },
  navItemActive: { backgroundColor: '#2a9d8f' },
  navText: { color: '#94a3b8', fontWeight: 'bold' },
  navTextActive: { color: '#fff' },
  content: { flex: 1, padding: 20, maxWidth: 1000, marginHorizontal: 'auto', width: '100%' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginVertical: 15, color: '#1e293b' },
  categoryContainer: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  categoryBtn: { backgroundColor: '#e2e8f0', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  categoryBtnActive: { backgroundColor: '#2a9d8f' },
  categoryText: { color: '#475569', fontWeight: 'bold' },
  categoryTextActive: { color: '#fff' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },
  card: { backgroundColor: '#fff', borderRadius: 12, width: '30%', minWidth: 250, overflow: 'hidden', boxShadow: '0px 4px 8px rgba(0,0,0,0.08)' },
  cardImage: { width: '100%', height: 140, objectFit: 'cover' },
  cardBody: { padding: 12 },
  title: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  categoryBadge: { fontSize: 12, color: '#64748b', marginVertical: 2 },
  price: { fontSize: 15, color: '#e63946', fontWeight: 'bold', marginVertical: 6 },
  btn: { backgroundColor: '#2a9d8f', paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  
  // Style Đơn Gọi Món
  emptyCartBox: { backgroundColor: '#fff', padding: 40, borderRadius: 12, alignItems: 'center' },
  cartItem: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  cartImage: { width: 50, height: 50, borderRadius: 6 },
  qtyBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 6, padding: 2 },
  qtyBtn: { width: 28, height: 28, backgroundColor: '#cbd5e1', borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
  qtyBtnText: { fontWeight: 'bold', fontSize: 16, color: '#1e293b' },
  qtyText: { paddingHorizontal: 12, fontWeight: 'bold', fontSize: 14 },
  btnRemove: { padding: 5 },
  cartSummary: { backgroundColor: '#fff', padding: 20, borderRadius: 12, marginTop: 15, boxShadow: '0 2px 4px rgba(0,0,0,0.08)' },
  btnCheckout: { backgroundColor: '#10b981', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  btnCheckoutText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  // Admin Style
  formContainer: { backgroundColor: '#fff', padding: 20, borderRadius: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.08)', marginBottom: 20 },
  formTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#1e293b' },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, padding: 10, marginBottom: 10 },
  typeBtn: { padding: 8, borderRadius: 6, backgroundColor: '#f1f5f9' },
  typeBtnActive: { backgroundColor: '#2a9d8f' },
  btnAdd: { backgroundColor: '#10b981', padding: 12, borderRadius: 6 },
  btnCancel: { backgroundColor: '#64748b', padding: 12, borderRadius: 6 },
  manageItem: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10 },
  btnEdit: { backgroundColor: '#f59e0b', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  btnDelete: { backgroundColor: '#ef4444', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 }
});