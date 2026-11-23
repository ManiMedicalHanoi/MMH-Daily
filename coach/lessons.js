/* MMH Daily · Luyện nói — bộ bài có sẵn theo công việc (quản lý sản phẩm + quản lý sales).
   Mỗi bài: vi (đề tiếng Việt) · en (câu chuẩn, [[...]] = chỗ trống của Mức 1) · d (2 phương án SAI cho mỗi chỗ trống, đúng thứ tự)
   · keys [vi, en] (từ khoá khó, gợi ý Mức 2) · chunks [vi, en] (chia nhỏ) · ideas [ý tiếng Việt, [[cách nói chấp nhận]…]] — mỗi nhóm phải có ít nhất 1 cụm xuất hiện
   · grammar [cấu trúc, giải thích] · alt (cách nói khác). Câu luyện tập, số liệu là ví dụ. */
window.COACH_TOPICS = [
  { id: 'present', vi: 'Thuyết trình sản phẩm' },
  { id: 'sales', vi: 'Sales & KPI' },
  { id: 'npp', vi: 'Làm việc với NPP' },
  { id: 'tender', vi: 'Đấu thầu & pháp lý' },
  { id: 'mail', vi: 'Email & họp' },
  { id: 'life', vi: 'Giao tiếp đời thường' }
];

window.COACH_LESSONS = [
  {
    id: 'p1', topic: 'present',
    vi: 'Điểm khác biệt của sản phẩm này là độ sắc bén cao, giúp đường rạch gọn và sạch hơn.',
    en: 'What [[sets]] this product [[apart]] is its high [[sharpness]], which makes the incision cleaner and more precise.',
    d: [['makes', 'puts'], ['away', 'aside'], ['sharpen', 'sharply']],
    keys: [['điểm khác biệt', 'what sets … apart'], ['độ sắc bén', 'sharpness'], ['đường rạch', 'incision'], ['gọn và sạch hơn', 'cleaner and more precise']],
    chunks: [['Điểm khác biệt của sản phẩm này là độ sắc bén cao', 'What sets this product apart is its high sharpness'], ['giúp đường rạch gọn và sạch hơn', 'which makes the incision cleaner and more precise']],
    ideas: [['Điểm khác biệt', [['apart', 'differen', 'unique', 'stand out', 'stands out', 'special']]], ['Độ sắc bén cao', [['sharp']]], ['Đường rạch', [['incision', 'cut']]], ['Gọn, sạch hơn', [['clean', 'precise', 'neat', 'smooth']]]],
    grammar: [['What sets X apart is …', 'Nhấn mạnh điểm khác biệt của sản phẩm, rất hay dùng khi thuyết trình.'], ['…, which makes + tân ngữ + tính từ', 'Nối thêm kết quả: "which makes the incision cleaner".']],
    alt: ['This product stands out because it is extremely sharp, so the incision is cleaner.']
  },
  {
    id: 'p2', topic: 'present',
    vi: 'So với các sản phẩm cùng loại, trâm của chúng tôi linh hoạt hơn nên ít bị gãy trong ống tủy cong.',
    en: '[[Compared with]] similar products, our files are more [[flexible]], so they are less likely to [[break]] in curved canals.',
    d: [['Compare to', 'Comparing'], ['flexibility', 'flexibly'], ['broken', 'breaking']],
    keys: [['so với', 'compared with'], ['linh hoạt', 'flexible'], ['ít bị gãy', 'less likely to break'], ['ống tủy cong', 'curved canals']],
    chunks: [['So với các sản phẩm cùng loại', 'Compared with similar products'], ['trâm của chúng tôi linh hoạt hơn', 'our files are more flexible'], ['nên ít bị gãy trong ống tủy cong', 'so they are less likely to break in curved canals']],
    ideas: [['So với sản phẩm cùng loại', [['compar', 'than other', 'similar', 'than competitor']]], ['Linh hoạt hơn', [['flexib']]], ['Ít bị gãy', [['break', 'fractur', 'separat', 'broken']]], ['Ống tủy cong', [['curved']]]],
    grammar: [['Compared with + danh từ, S + V-er …', 'Mở đầu câu so sánh, trang trọng hơn "than".'], ['be less likely to + V', 'Ít có khả năng xảy ra: "less likely to break" = ít bị gãy.']],
    alt: ['Our files are more flexible than similar products, which reduces the risk of breakage in curved canals.']
  },
  {
    id: 'p3', topic: 'present',
    vi: 'Điều này giúp bác sĩ rút ngắn thời gian điều trị và bệnh nhân cảm thấy thoải mái hơn.',
    en: 'This [[helps]] dentists [[shorten]] treatment time and makes patients feel more [[comfortable]].',
    d: [['helping', 'help to'], ['shortly', 'short'], ['comfort', 'comfortably']],
    keys: [['rút ngắn', 'shorten / reduce'], ['thời gian điều trị', 'treatment time'], ['thoải mái', 'comfortable']],
    chunks: [['Điều này giúp bác sĩ rút ngắn thời gian điều trị', 'This helps dentists shorten treatment time'], ['và bệnh nhân cảm thấy thoải mái hơn', 'and makes patients feel more comfortable']],
    ideas: [['Rút ngắn thời gian điều trị', [['shorten', 'reduc', 'save time', 'saves time', 'less time', 'faster', 'chair time']]], ['Bệnh nhân thoải mái hơn', [['patient'], ['comfort']]]],
    grammar: [['help + tân ngữ + động từ nguyên mẫu', '"help dentists shorten" — không cần "to".'], ['make + tân ngữ + feel + tính từ', 'Làm cho ai cảm thấy thế nào.']],
    alt: ['As a result, dentists can save chair time and patients have a more comfortable experience.']
  },
  {
    id: 's1', topic: 'sales',
    vi: 'Quý này doanh số của chúng tôi thấp hơn mục tiêu 8%, chủ yếu do một số gói thầu bị chậm.',
    en: 'This quarter, our sales are 8% [[below]] target, [[mainly]] due to some [[delayed]] tenders.',
    d: [['less', 'behind of'], ['main', 'mostly of'], ['delaying', 'delay']],
    keys: [['thấp hơn mục tiêu', 'below target / behind target'], ['chủ yếu do', 'mainly due to'], ['gói thầu', 'tender'], ['bị chậm', 'delayed']],
    chunks: [['Quý này doanh số của chúng tôi thấp hơn mục tiêu 8%', 'This quarter, our sales are 8% below target'], ['chủ yếu do một số gói thầu bị chậm', 'mainly due to some delayed tenders']],
    ideas: [['Quý này', [['quarter']]], ['Thấp hơn mục tiêu 8%', [['8', 'eight'], ['below', 'behind', 'short', 'lower', 'less', 'under']]], ['Chủ yếu do', [['due to', 'because', 'mainly', 'caused by', 'since']]], ['Gói thầu bị chậm', [['tender', 'bid'], ['delay', 'late', 'slow', 'postpon']]]],
    grammar: [['X% below / behind target', 'Thấp hơn mục tiêu X%. Ngược lại: "X% above target".'], ['due to + danh từ', 'Không dùng "due to" + mệnh đề; mệnh đề thì dùng "because".']],
    alt: ["We're 8% behind target this quarter, mostly because several tenders were delayed."]
  },
  {
    id: 's2', topic: 'sales',
    vi: 'Động lực tăng trưởng chính của tháng này là một đơn hàng lớn từ nhà phân phối ở miền Nam.',
    en: 'The main [[driver]] of growth this month was a large [[order]] from our [[distributor]] in the South.',
    d: [['drive', 'driving'], ['ordering', 'command'], ['distribution', 'distribute']],
    keys: [['động lực tăng trưởng chính', 'the main driver of growth'], ['đơn hàng', 'order'], ['nhà phân phối', 'distributor'], ['miền Nam', 'the South / southern Vietnam']],
    chunks: [['Động lực tăng trưởng chính của tháng này', 'The main driver of growth this month'], ['là một đơn hàng lớn từ nhà phân phối ở miền Nam', 'was a large order from our distributor in the South']],
    ideas: [['Động lực chính', [['driver', 'main reason', 'mainly', 'thanks to', 'came from', 'boost']]], ['Đơn hàng lớn', [['order']]], ['Nhà phân phối', [['distributor', 'dealer', 'partner']]], ['Miền Nam', [['south']]]],
    grammar: [['The main driver of … was + danh từ', 'Giải thích nguyên nhân chính khi báo cáo số liệu.'], ['Thì quá khứ "was"', 'Báo cáo tháng đã qua dùng quá khứ.']],
    alt: ["This month's growth came mainly from a big order placed by our distributor in southern Vietnam."]
  },
  {
    id: 's3', topic: 'sales',
    vi: 'Từ nay đến cuối năm, chúng tôi sẽ tập trung vào việc mở rộng khách hàng mới ở các tỉnh miền Trung.',
    en: 'From now until the end of the year, we will [[focus on]] [[expanding]] our new customer base in the [[central]] provinces.',
    d: [['focus in', 'focus to'], ['expand', 'expansion'], ['centre', 'middle of']],
    keys: [['từ nay đến cuối năm', 'from now until the end of the year'], ['tập trung vào', 'focus on + V-ing'], ['mở rộng', 'expand'], ['khách hàng mới', 'new customers'], ['các tỉnh miền Trung', 'the central provinces']],
    chunks: [['Từ nay đến cuối năm', 'From now until the end of the year'], ['chúng tôi sẽ tập trung vào việc mở rộng khách hàng mới', 'we will focus on expanding our new customer base'], ['ở các tỉnh miền Trung', 'in the central provinces']],
    ideas: [['Từ nay đến cuối năm', [['end of the year', 'year-end', 'year end', 'rest of the year', 'before the year']]], ['Tập trung vào', [['focus', 'priorit', 'concentrat']]], ['Mở rộng khách hàng mới', [['new customer', 'new account', 'new client', 'expand']]], ['Miền Trung', [['central']]]],
    grammar: [['focus on + V-ing', 'Sau giới từ "on" dùng V-ing: "focus on expanding".'], ['will + V', 'Nói kế hoạch, cam kết sắp tới.']],
    alt: ['Going forward, our priority is to win new accounts in central Vietnam before the year ends.']
  },
  {
    id: 'n1', topic: 'npp',
    vi: 'Chúng tôi sẵn sàng hỗ trợ hàng demo, với điều kiện quý anh gửi dự báo hằng quý.',
    en: 'We would be [[willing]] to support demo stock, [[provided that]] you send us a [[quarterly]] forecast.',
    d: [['will', 'willingly'], ['provide that', 'providing to'], ['quarter', 'quarters']],
    keys: [['sẵn sàng', 'be willing to'], ['hàng demo', 'demo stock / demo units'], ['với điều kiện', 'provided that'], ['dự báo hằng quý', 'quarterly forecast']],
    chunks: [['Chúng tôi sẵn sàng hỗ trợ hàng demo', 'We would be willing to support demo stock'], ['với điều kiện quý anh gửi dự báo hằng quý', 'provided that you send us a quarterly forecast']],
    ideas: [['Sẵn sàng hỗ trợ', [['willing', 'happy to', 'ready to', 'can support', 'support']]], ['Hàng demo', [['demo']]], ['Với điều kiện', [['provided', 'as long as', 'on condition', 'if you']]], ['Dự báo hằng quý', [['forecast'], ['quarter']]]],
    grammar: [['would be willing to + V', 'Cách nói lịch sự khi đề xuất trong đàm phán.'], ['provided that + mệnh đề', '= với điều kiện là. Thân mật hơn: "as long as".']],
    alt: ["We're happy to provide demo units as long as you share a quarterly forecast with us."]
  },
  {
    id: 'n2', topic: 'npp',
    vi: 'Anh có thể giải thích giúp tôi vì sao lượng hàng tồn kho tháng này tăng không?',
    en: 'Could you [[walk me through]] why your [[inventory]] [[increased]] this month?',
    d: [['walk me over', 'walk through me'], ['inventor', 'inventories of'], ['was increased', 'increase']],
    keys: [['giải thích giúp tôi', 'walk me through / explain'], ['hàng tồn kho', 'inventory / stock level'], ['tăng', 'increase / go up']],
    chunks: [['Anh có thể giải thích giúp tôi', 'Could you walk me through'], ['vì sao lượng hàng tồn kho tháng này tăng không?', 'why your inventory increased this month?']],
    ideas: [['Nhờ giải thích', [['walk me through', 'explain', 'tell me', 'clarify']]], ['Hàng tồn kho', [['inventory', 'stock']]], ['Tăng', [['increas', 'go up', 'went up', 'rise', 'rose', 'higher', 'grew', 'grow']]], ['Tháng này', [['this month']]]],
    grammar: [['Could you + V …?', 'Hỏi lịch sự với đối tác.'], ['increase là nội động từ', 'Hàng tự tăng: "inventory increased", không nói "was increased".']],
    alt: ['Can you explain why your stock level went up this month?']
  },
  {
    id: 'n3', topic: 'npp',
    vi: 'Hãy thống nhất kế hoạch đặt hàng cho ba tháng tới trước khi kết thúc cuộc họp.',
    en: "Let's [[align on]] the order plan for the [[next]] three months before we [[wrap up]] the meeting.",
    d: [['align with on', 'aligning'], ['last', 'following of'], ['wrap off', 'wrapping']],
    keys: [['thống nhất', 'align on / agree on'], ['kế hoạch đặt hàng', 'order plan'], ['ba tháng tới', 'the next three months'], ['kết thúc cuộc họp', 'wrap up the meeting']],
    chunks: [['Hãy thống nhất kế hoạch đặt hàng cho ba tháng tới', "Let's align on the order plan for the next three months"], ['trước khi kết thúc cuộc họp', 'before we wrap up the meeting']],
    ideas: [['Thống nhất', [['align', 'agree', 'confirm', 'finaliz', 'finalis']]], ['Kế hoạch đặt hàng', [['order', 'purchase plan']]], ['Ba tháng tới', [['three month', '3 month']]], ['Trước khi kết thúc họp', [['before', 'wrap up', 'end of the meeting', 'finish']]]],
    grammar: [["Let's + V", 'Đề nghị cả nhóm cùng làm.'], ['align on / agree on + danh từ', 'Thống nhất về việc gì.']],
    alt: ["Before we finish, let's agree on the purchase plan for the coming three months."]
  },
  {
    id: 't1', topic: 'tender',
    vi: 'Theo quy định, hồ sơ mời thầu không được nêu tên thương hiệu cụ thể mà phải mô tả yêu cầu kỹ thuật.',
    en: 'According to the regulations, bidding documents must not [[specify]] a brand name; instead, they must [[describe]] the technical [[requirements]].',
    d: [['specific', 'specification'], ['describing', 'description'], ['require', 'requiring']],
    keys: [['theo quy định', 'according to the regulations'], ['hồ sơ mời thầu', 'bidding documents / tender documents'], ['tên thương hiệu', 'brand name'], ['yêu cầu kỹ thuật', 'technical requirements']],
    chunks: [['Theo quy định, hồ sơ mời thầu không được nêu tên thương hiệu cụ thể', 'According to the regulations, bidding documents must not specify a brand name'], ['mà phải mô tả yêu cầu kỹ thuật', 'instead, they must describe the technical requirements']],
    ideas: [['Theo quy định', [['according', 'under the', 'regulation', 'rule', 'law']]], ['Hồ sơ mời thầu', [['bidding document', 'tender document', 'bid document', 'tender dossier', 'bidding dossier']]], ['Không nêu thương hiệu', [['brand']]], ['Mô tả yêu cầu kỹ thuật', [['technical', 'specification', 'requirement', 'standard']]]],
    grammar: [['must not + V', 'Bị cấm, không được phép.'], ['…; instead, …', 'Nối hai ý: không làm A, thay vào đó làm B.']],
    alt: ["Under the rules, tender documents can't name a specific brand; they have to describe the technical specifications."]
  },
  {
    id: 't2', topic: 'tender',
    vi: 'Gói thầu này đang chờ phê duyệt kết quả, dự kiến có trong hai tuần tới.',
    en: 'This tender is [[pending]] approval of the results, which are [[expected]] [[within]] the next two weeks.',
    d: [['pended', 'pending of'], ['expecting', 'expect'], ['during of', 'in within']],
    keys: [['đang chờ phê duyệt', 'pending approval'], ['kết quả', 'results / award decision'], ['dự kiến', 'expected'], ['trong hai tuần tới', 'within the next two weeks']],
    chunks: [['Gói thầu này đang chờ phê duyệt kết quả', 'This tender is pending approval of the results'], ['dự kiến có trong hai tuần tới', 'which are expected within the next two weeks']],
    ideas: [['Đang chờ phê duyệt', [['pending', 'waiting', 'await'], ['approv', 'decision', 'sign off']]], ['Kết quả', [['result', 'award', 'decision']]], ['Dự kiến', [['expect', 'should', 'likely', 'estimat']]], ['Hai tuần tới', [['two week', '2 week']]]],
    grammar: [['be pending + danh từ', 'Đang chờ (phê duyệt, xác nhận…).'], ['be expected within + thời gian', 'Dự kiến có trong khoảng thời gian.']],
    alt: ["We're still waiting for the award decision on this tender; it should come out in the next two weeks."]
  },
  {
    id: 't3', topic: 'tender',
    vi: 'Chúng tôi trượt gói thầu vì sản phẩm không đáp ứng tiêu chí về chiều dài lưỡi dao.',
    en: 'We [[lost]] the tender because our product did not [[meet]] the [[criterion]] for blade length.',
    d: [['lose', 'missed out'], ['meeting', 'reach to'], ['criteria of', 'critic']],
    keys: [['trượt gói thầu', 'lose a tender'], ['đáp ứng', 'meet'], ['tiêu chí', 'criterion (số nhiều: criteria)'], ['chiều dài lưỡi dao', 'blade length']],
    chunks: [['Chúng tôi trượt gói thầu', 'We lost the tender'], ['vì sản phẩm không đáp ứng tiêu chí về chiều dài lưỡi dao', 'because our product did not meet the criterion for blade length']],
    ideas: [['Trượt thầu', [['lost', 'lose', 'did not win', "didn't win", 'fail']]], ['Không đáp ứng', [['meet', 'satisf', 'compl', 'fulfil']]], ['Tiêu chí', [['criteri', 'requirement', 'condition']]], ['Chiều dài lưỡi dao', [['blade'], ['length', 'long']]]],
    grammar: [['lose a tender (quá khứ: lost)', 'Trượt thầu. Trúng thầu: "win a tender" (won).'], ['meet a requirement / criterion', 'Đáp ứng yêu cầu, tiêu chí.']],
    alt: ["We didn't win the tender since our knife didn't satisfy the blade-length requirement."]
  },
  {
    id: 'm1', topic: 'mail',
    vi: 'Tiếp theo cuộc trao đổi hôm qua, tôi gửi kèm báo giá cập nhật để anh xem xét.',
    en: '[[Following up on]] our conversation yesterday, please find [[attached]] the updated [[quotation]] for your review.',
    d: [['Follow up', 'Following to'], ['attach', 'attaching'], ['quotations of', 'quote for']],
    keys: [['tiếp theo cuộc trao đổi', 'following up on our conversation'], ['gửi kèm', 'please find attached'], ['báo giá', 'quotation / quote'], ['để anh xem xét', 'for your review']],
    chunks: [['Tiếp theo cuộc trao đổi hôm qua', 'Following up on our conversation yesterday'], ['tôi gửi kèm báo giá cập nhật để anh xem xét', 'please find attached the updated quotation for your review']],
    ideas: [['Tiếp theo cuộc trao đổi', [['follow', 'as discussed', 'regarding', 'further to', 'after our']]], ['Gửi kèm', [['attach', 'enclos', 'send', 'sending']]], ['Báo giá cập nhật', [['quot', 'price']]], ['Để xem xét', [['review', 'consider', 'look at', 'take a look', 'check']]]],
    grammar: [['Following up on + danh từ', 'Câu mở đầu email nối tiếp cuộc trao đổi trước.'], ['Please find attached + danh từ', 'Cách nói trang trọng: "gửi kèm theo đây".']],
    alt: ["As discussed yesterday, I'm sending you the updated quote. Please take a look."]
  },
  {
    id: 'm2', topic: 'mail',
    vi: 'Tôi rất cảm kích nếu anh có thể phản hồi trước thứ Sáu tuần này.',
    en: 'I would [[appreciate]] it if you could [[get back to]] me [[by]] this Friday.',
    d: [['appreciated', 'appreciate for'], ['get back with', 'return back'], ['until', 'on before']],
    keys: [['rất cảm kích nếu', "I'd appreciate it if"], ['phản hồi', 'get back to me / reply'], ['trước thứ Sáu', 'by Friday']],
    chunks: [['Tôi rất cảm kích nếu anh có thể phản hồi', 'I would appreciate it if you could get back to me'], ['trước thứ Sáu tuần này', 'by this Friday']],
    ideas: [['Cảm kích', [['appreciat', 'grateful', 'thank']]], ['Phản hồi', [['get back', 'reply', 'respond', 'response', 'feedback', 'let me know']]], ['Trước thứ Sáu', [['friday']]]],
    grammar: [["I'd appreciate it if you could + V", 'Nhờ vả lịch sự trong email.'], ['by + mốc thời gian', '= trước / chậm nhất vào. Khác "until" (kéo dài đến).']],
    alt: ['Could you please reply by this Friday? Thank you.']
  },
  {
    id: 'm3', topic: 'mail',
    vi: 'Điểm chính của cuộc họp hôm nay là chúng ta cần ưu tiên khách hàng trọng điểm trong quý tới.',
    en: "The key [[takeaway]] from today's meeting is that we need to [[prioritize]] our key [[accounts]] next quarter.",
    d: [['take away of', 'takeout'], ['priority', 'prioritizing'], ["account's", 'accountants']],
    keys: [['điểm chính', 'key takeaway'], ['ưu tiên', 'prioritize'], ['khách hàng trọng điểm', 'key accounts'], ['quý tới', 'next quarter']],
    chunks: [['Điểm chính của cuộc họp hôm nay', "The key takeaway from today's meeting"], ['là chúng ta cần ưu tiên khách hàng trọng điểm trong quý tới', 'is that we need to prioritize our key accounts next quarter']],
    ideas: [['Điểm chính', [['takeaway', 'main point', 'key point', 'conclusion', 'summary']]], ['Ưu tiên', [['priorit', 'focus', 'come first', 'put first']]], ['Khách hàng trọng điểm', [['key account', 'key customer', 'important customer', 'major customer']]], ['Quý tới', [['quarter']]]],
    grammar: [['The key takeaway is that + mệnh đề', 'Tóm tắt điều quan trọng nhất cuối buổi họp.'], ['need to + V', 'Cần phải làm gì.']],
    alt: ['So the main point from today: next quarter, our key accounts come first.']
  },
  {
    id: 'l1', topic: 'life',
    vi: 'Dạo này tôi khá bận vì phải đi công tác nhiều, nhưng cuối tuần tôi vẫn cố gắng chạy bộ.',
    en: "I've been [[pretty]] busy lately because I've had to go on a lot of [[business trips]], but I still try to go [[running]] at weekends.",
    d: [['pretty much of', 'prettily'], ['business travels', 'businesses trip'], ['to run', 'run']],
    keys: [['dạo này', 'lately / recently'], ['đi công tác', 'go on a business trip'], ['cố gắng', 'try to'], ['chạy bộ', 'go running']],
    chunks: [['Dạo này tôi khá bận', "I've been pretty busy lately"], ['vì phải đi công tác nhiều', "because I've had to go on a lot of business trips"], ['nhưng cuối tuần tôi vẫn cố gắng chạy bộ', 'but I still try to go running at weekends']],
    ideas: [['Dạo này khá bận', [['busy']]], ['Đi công tác nhiều', [['business trip', 'travel', 'work trip', 'trip']]], ['Cuối tuần vẫn chạy bộ', [['run', 'jog'], ['weekend']]]],
    grammar: [["I've been + tính từ + lately", 'Hiện tại hoàn thành cho tình trạng "dạo này".'], ['go + V-ing', 'Hoạt động: go running, go shopping, go swimming.']],
    alt: ['Work has kept me busy with lots of travel recently, but I still go for a run on weekends.']
  },
  {
    id: 'l2', topic: 'life',
    vi: 'Nếu có dịp đến Hà Nội, anh nên thử phở ở phố cổ vào buổi sáng.',
    en: 'If you [[get the chance]] to visit Hanoi, you [[should]] try pho in the Old Quarter [[in the morning]].',
    d: [['get chance', 'take chance of'], ['should to', 'must to'], ['on the morning', 'at morning']],
    keys: [['nếu có dịp', 'if you get the chance'], ['nên thử', 'should try'], ['phố cổ', 'the Old Quarter']],
    chunks: [['Nếu có dịp đến Hà Nội', 'If you get the chance to visit Hanoi'], ['anh nên thử phở ở phố cổ vào buổi sáng', 'you should try pho in the Old Quarter in the morning']],
    ideas: [['Nếu có dịp đến Hà Nội', [['hanoi', 'ha noi']]], ['Nên thử phở', [['should', 'recommend', 'must try', 'have to try', 'try', "don't miss", 'do not miss'], ['pho']]], ['Phố cổ', [['old quarter', 'old town']]], ['Buổi sáng', [['morning', 'breakfast']]]],
    grammar: [['If + hiện tại, S + should + V', 'Câu điều kiện loại 1 để khuyên ai đó.'], ['in the morning', 'Giới từ "in" với buổi sáng / chiều / tối.']],
    alt: ["When you're in Hanoi, don't miss a bowl of pho in the Old Quarter; breakfast is the best time."]
  },
  {
    id: 'l3', topic: 'life',
    vi: 'Tôi đang luyện tiếng Anh mỗi ngày khoảng mười phút để tự tin hơn khi thuyết trình.',
    en: "I'm [[practicing]] English for about ten minutes [[every day]] so that I can feel more [[confident]] when I give presentations.",
    d: [['practice to', 'practise of'], ['everyday of', 'each days'], ['confidence', 'confidently']],
    keys: [['luyện', 'practice'], ['mỗi ngày', 'every day (hai chữ)'], ['để', 'so that I can'], ['tự tin', 'confident'], ['thuyết trình', 'give a presentation']],
    chunks: [['Tôi đang luyện tiếng Anh mỗi ngày khoảng mười phút', "I'm practicing English for about ten minutes every day"], ['để tự tin hơn khi thuyết trình', 'so that I can feel more confident when I give presentations']],
    ideas: [['Luyện tiếng Anh', [['practi', 'learn', 'study', 'spend', 'work on'], ['english']]], ['Mười phút mỗi ngày', [['ten minute', '10 minute'], ['every day', 'daily', 'each day', 'a day']]], ['Tự tin hơn', [['confiden']]], ['Khi thuyết trình', [['present']]]],
    grammar: [['so that + S + can + V', '= để mà, chỉ mục đích.'], ['every day ≠ everyday', '"every day" (mỗi ngày) là trạng từ; "everyday" là tính từ (thường ngày).']],
    alt: ['I spend around ten minutes a day on English so I can present with more confidence.']
  }
];
