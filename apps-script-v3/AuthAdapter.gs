function qv3Auth_(token) {
  // Adapter duy nhất cần nối với auth hiện hành. Không tạo hệ PIN thứ hai.
  if (typeof verifyPagesSession_ !== 'function') throw new Error('Backend hiện hành chưa cung cấp verifyPagesSession_(token).');
  const session=verifyPagesSession_(token); if(!session || !session.email) throw new Error('Phiên đăng nhập không hợp lệ hoặc đã hết hạn.');
  const email=String(session.email).toLowerCase(), user=qv3Rows_('USERS').find(function(u){return String(u.email).toLowerCase()===email && qv3Bool_(u.active)});
  if(!user) throw new Error('Tài khoản chưa được cấp quyền Quotation V3.');
  const permission=qv3Rows_('PERMISSIONS').find(function(p){return String(p.role)===String(user.role)})||{};
  return {user:user,permission:permission,session:session};
}

function qv3PublicPermission_(p) { return {role:p.role||'',can_view_floor:qv3Bool_(p.can_view_floor),max_discount:Number(p.max_discount||0),can_approve:qv3Bool_(p.can_approve),can_admin_catalog:qv3Bool_(p.can_admin_catalog)}; }
