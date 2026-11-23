/* MMH Daily Podcast — gắn nhãn PESTEL cho từng tin (chạy trên trình duyệt, miễn phí, dùng cho cả số cũ).
   P Chính trị – chính sách · E Kinh tế · S Xã hội · T Công nghệ · M Môi trường (chữ E thứ hai, dùng mã M để khỏi trùng) · L Pháp lý.
   So khớp theo cả từ (không khớp "ai" trong "hai"). window.PESTEL.of(story) ⇒ ['L','T'] · PESTEL.NAMES. */
(() => {
  const K = {
    P: ['chính phủ', 'quốc hội', 'nghị quyết', 'chủ trương', 'thủ tướng', 'phó thủ tướng', 'bộ y tế', 'bộ trưởng', 'chính sách', 'đề án', 'chiến lược', 'quy hoạch', 'chương trình hành động', 'ủy ban nhân dân',
      'government', 'national assembly', 'resolution', 'ministry of health', 'minister', 'policy', 'policies', 'prime minister', 'strategy'],
    E: ['tỷ giá', 'nhập khẩu', 'xuất khẩu', 'giá thuốc', 'giá dịch vụ', 'giá thiết bị', 'ngân sách', 'đầu tư', 'đầu tư công', 'giải ngân', 'doanh thu', 'thị trường', 'lạm phát', 'thuế', 'usd', 'đồng yên', 'chi phí', 'viện phí', 'kinh tế',
      'exchange rate', 'import', 'imports', 'export', 'price', 'prices', 'budget', 'investment', 'market', 'tariff', 'tariffs', 'revenue', 'yen', 'economy', 'cost', 'costs'],
    S: ['dân số', 'người cao tuổi', 'già hóa', 'trẻ em', 'học sinh', 'cận thị', 'tật khúc xạ', 'sức khỏe răng miệng', 'sâu răng', 'cộng đồng', 'thói quen', 'xu hướng', 'du lịch y tế', 'nhân lực y tế', 'nhân viên y tế',
      'aging', 'ageing', 'population', 'children', 'myopia', 'community', 'trend', 'trends', 'medical tourism', 'workforce', 'oral health'],
    T: ['công nghệ', 'trí tuệ nhân tạo', 'ai', 'robot', 'kỹ thuật mới', 'kỹ thuật', 'phẫu thuật nội soi', 'laser', 'phaco', 'implant', 'số hóa', 'chuyển đổi số', 'mô phỏng', 'thiết bị mới', 'nghiên cứu', 'lần đầu tiên',
      'technology', 'digital', 'robotic', 'artificial intelligence', 'innovation', 'technique', 'study', 'research', 'trial', 'approval', 'approved', 'fda'],
    M: ['môi trường', 'khí hậu', 'ô nhiễm', 'rác thải', 'chất thải y tế', 'bụi mịn', 'nắng nóng', 'bão', 'lũ', 'thiên tai', 'dịch bệnh',
      'environment', 'climate', 'pollution', 'waste', 'flood', 'floods', 'heatwave', 'typhoon', 'sustainability'],
    L: ['luật', 'thông tư', 'nghị định', 'quy định', 'đấu thầu', 'mua sắm', 'cấp phép', 'giấy phép', 'đăng ký lưu hành', 'xử phạt', 'thanh tra', 'bảo hiểm y tế', 'bhyt', 'hồ sơ mời thầu', 'gói thầu',
      'law', 'laws', 'circular', 'decree', 'regulation', 'regulations', 'regulatory', 'tender', 'tenders', 'license', 'licence', 'compliance', 'procurement', 'bidding']
  };
  const NAMES = { P: ['P', 'Chính trị – chính sách', 'Political'], E: ['E', 'Kinh tế', 'Economic'], S: ['S', 'Xã hội', 'Social'], T: ['T', 'Công nghệ', 'Technological'], M: ['E', 'Môi trường', 'Environmental'], L: ['L', 'Pháp lý', 'Legal'] };
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const RX = Object.fromEntries(Object.entries(K).map(([f, ws]) => [f, new RegExp('(?:^|[^\\p{L}\\p{N}])(?:' + ws.sort((a, b) => b.length - a.length).map(esc).join('|') + ')(?=$|[^\\p{L}\\p{N}])', 'iu')]));
  const TAGF = { tender: ['L'], policy: ['P', 'L'], insurance: ['L', 'E'], market: ['E'], invest: ['E'] };
  function of(x) {
    const t = [x.t, x.h_en, x.h_vi, x.sum, x.s_en, x.s_vi].filter(Boolean).join(' ').normalize('NFC');
    const out = new Set();
    for (const f of Object.keys(RX)) if (RX[f].test(t)) out.add(f);
    (x.tags || []).forEach(g => (TAGF[g] || []).forEach(f => out.add(f)));
    if (x.docs?.length) out.add('L');
    return ['P', 'E', 'S', 'T', 'M', 'L'].filter(f => out.has(f));
  }
  window.PESTEL = { of, NAMES, ORDER: ['P', 'E', 'S', 'T', 'M', 'L'] };
})();
